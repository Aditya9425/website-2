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

// Hook into processOrder function directly
if (typeof window.processOrder === 'function') {
    const originalProcessOrder = window.processOrder;
    window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
        console.log('🛒 Processing order with stock deduction...');
        
        const result = await originalProcessOrder(total, paymentMethod, orderItems, isBuyNow, paymentId);
        
        if (result && result.items) {
            console.log('📦 Deducting stock for order items:', result.items);
            for (const item of result.items) {
                await window.deductStock(item.id, item.quantity);
            }
        }
        
        return result;
    };
}

// Also hook into saveOrderToDatabase as backup
setTimeout(() => {
    if (typeof window.saveOrderToDatabase === 'function') {
        const originalSaveOrder = window.saveOrderToDatabase;
        window.saveOrderToDatabase = async function(order) {
            console.log('💾 Saving order with stock deduction...');
            
            const savedOrder = await originalSaveOrder(order);
            
            if (savedOrder && order.items) {
                console.log('📦 Deducting stock after save:', order.items);
                for (const item of order.items) {
                    await window.deductStock(item.id, item.quantity);
                }
            }
            
            return savedOrder;
        };
    }
}, 1000);

// Load stock UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.updateStockUI();
    }, 2000);
});