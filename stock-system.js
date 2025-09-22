// Simple stock deduction function
window.deductStock = async function(productId, quantity) {
    try {
        console.log(`🔄 Deducting stock: Product ${productId}, Quantity ${quantity}`);
        
        const { data: current } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();
        
        const newStock = Math.max(0, (current?.stock || 0) - quantity);
        
        const { error } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId);
        
        if (error) throw error;
        
        console.log(`✅ Stock updated: Product ${productId} now has ${newStock} items`);
        return true;
    } catch (error) {
        console.error('❌ Stock deduction failed:', error);
        return false;
    }
};

// Update UI for out of stock products
window.updateStockUI = async function() {
    try {
        const { data } = await supabase.from('products').select('id, stock');
        
        data?.forEach(product => {
            const cards = document.querySelectorAll(`[data-product-id="${product.id}"]`);
            cards.forEach(card => {
                const addBtn = card.querySelector('.add-to-cart, .add-to-cart-btn');
                const buyBtn = card.querySelector('.buy-now-btn');
                
                if (product.stock <= 0) {
                    if (addBtn) {
                        addBtn.disabled = true;
                        addBtn.textContent = 'Out of Stock';
                        addBtn.style.backgroundColor = '#ccc';
                    }
                    if (buyBtn) {
                        buyBtn.disabled = true;
                        buyBtn.textContent = 'Out of Stock';
                        buyBtn.style.backgroundColor = '#ccc';
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error updating stock UI:', error);
    }
};

// Override saveOrderToDatabase to include stock deduction
const originalSaveOrder = window.saveOrderToDatabase;
window.saveOrderToDatabase = async function(order) {
    try {
        console.log('💾 Saving order and deducting stock...');
        
        // Save order first
        const savedOrder = await originalSaveOrder(order);
        
        // Deduct stock for each item
        if (savedOrder && order.items) {
            for (const item of order.items) {
                await window.deductStock(item.id, item.quantity);
            }
        }
        
        return savedOrder;
    } catch (error) {
        console.error('Error in enhanced saveOrderToDatabase:', error);
        throw error;
    }
};

// Load stock UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.updateStockUI();
    }, 2000);
});