// Initialize Supabase for stock management
const stockSupabase = window.supabase.createClient(
    'https://jstvadizuzvwhabtfhfs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw'
);

// Direct stock deduction function
window.deductStock = async function(productId, quantity) {
    try {
        console.log(`🔄 Deducting stock: Product ${productId}, Quantity ${quantity}`);
        
        const { data: current } = await stockSupabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();
        
        const newStock = Math.max(0, (current?.stock || 0) - quantity);
        
        const { error } = await stockSupabase
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

// Listen for new orders in database and deduct stock
stockSupabase
    .channel('order-stock-updates')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
            console.log('🆕 New order detected, deducting stock:', payload.new);
            const order = payload.new;
            if (order.items) {
                for (const item of order.items) {
                    await window.deductStock(item.id, item.quantity);
                }
            }
        }
    )
    .subscribe();

// Manual trigger function for testing
window.testStockDeduction = async function(orderId) {
    try {
        const { data: order } = await stockSupabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        
        if (order && order.items) {
            console.log('🧪 Manual stock deduction for order:', order.id);
            for (const item of order.items) {
                await window.deductStock(item.id, item.quantity);
            }
        }
    } catch (error) {
        console.error('Error in manual stock deduction:', error);
    }
};

// Direct trigger - run this in console after order
window.deductStockForLastOrder = async function() {
    try {
        const { data: orders } = await stockSupabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (orders && orders[0]) {
            const order = orders[0];
            console.log('🔄 Deducting stock for latest order:', order.id);
            
            if (order.items) {
                for (const item of order.items) {
                    await window.deductStock(item.id, item.quantity);
                }
            }
        }
    } catch (error) {
        console.error('Error deducting stock for last order:', error);
    }
};

// Auto-trigger every 5 seconds to check for new orders
setInterval(async () => {
    try {
        const { data: orders } = await stockSupabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (orders && orders[0]) {
            const order = orders[0];
            const orderTime = new Date(order.created_at).getTime();
            const now = new Date().getTime();
            
            // If order is less than 10 seconds old and not processed
            if (now - orderTime < 10000 && !window.processedOrders?.includes(order.id)) {
                console.log('🆕 Auto-detected new order, deducting stock:', order.id);
                
                if (!window.processedOrders) window.processedOrders = [];
                window.processedOrders.push(order.id);
                
                if (order.items) {
                    for (const item of order.items) {
                        await window.deductStock(item.id, item.quantity);
                    }
                }
            }
        }
    } catch (error) {
        // Silent fail
    }
}, 5000);

// Update UI for out of stock products
window.updateStockUI = async function() {
    try {
        const { data } = await stockSupabase.from('products').select('id, stock');
        
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



// Load stock UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.updateStockUI();
    }, 2000);
});