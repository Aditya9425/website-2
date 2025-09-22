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

// Auto-trigger by monitoring DOM for order confirmation
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.textContent?.includes('Order Placed Successfully')) {
                console.log('🎯 Auto-detected order success, triggering stock deduction...');
                setTimeout(() => {
                    window.deductStockForLastOrder();
                }, 2000);
            }
        });
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Also hook into window events
window.addEventListener('orderPlaced', () => {
    console.log('🎯 Order event detected, deducting stock...');
    setTimeout(() => {
        window.deductStockForLastOrder();
    }, 2000);
});

// Debug: Log when the event listener is set up
console.log('🔍 Stock system loaded - listening for orderPlaced events');

// Additional trigger - check for order success in console logs
const originalLog = console.log;
console.log = function(...args) {
    originalLog.apply(console, args);
    
    // Check if this is the order saved log
    if (args[0] === 'Order saved to Supabase successfully:' && args[1] && args[1].id) {
        console.log('🎯 Detected order save in console, triggering stock deduction...');
        setTimeout(() => {
            window.deductStockForLastOrder();
        }, 1000);
    }
};

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



// Create test order function
window.createTestOrder = async function() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            console.error('❌ No user logged in');
            return;
        }
        
        const testOrder = {
            user_id: user.id,
            user_email: user.email,
            items: [
                { id: 'e9b9000f-8f9d-47a9-8ca0-43e8aec8ae39', name: 'Gajri silk saree', quantity: 1, price: 2999 },
                { id: '73239457-a584-4d0d-9668-5c6ec1767a19', name: 'Reliance', quantity: 1, price: 1999 }
            ],
            total_amount: 34997,
            status: 'pending',
            payment_method: 'cod',
            delivery_address: {
                name: 'Test User',
                phone: user.mobile || '1234567890',
                address: 'Test Address',
                city: 'Test City',
                state: 'Rajasthan',
                pincode: '123456'
            }
        };
        
        const { data, error } = await stockSupabase
            .from('orders')
            .insert([testOrder])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Test order created:', data[0]);
        console.log('🔄 Manually triggering stock deduction...');
        
        // Manually trigger stock deduction for this order
        setTimeout(async () => {
            if (data[0].items) {
                for (const item of data[0].items) {
                    await window.deductStock(item.id, item.quantity);
                }
            }
        }, 1000);
        
        return data[0];
    } catch (error) {
        console.error('❌ Failed to create test order:', error);
    }
};

// Hook into processOrder function for immediate stock deduction
const originalProcessOrder = window.processOrder;
if (originalProcessOrder) {
    window.processOrder = async function(...args) {
        console.log('🎯 processOrder called, will deduct stock after order save');
        const result = await originalProcessOrder.apply(this, args);
        
        if (result && result.id) {
            console.log('🔄 Order saved successfully, deducting stock for order:', result.id);
            setTimeout(async () => {
                try {
                    const { data: order } = await stockSupabase
                        .from('orders')
                        .select('*')
                        .eq('id', result.id)
                        .single();
                    
                    if (order && order.items) {
                        for (const item of order.items) {
                            await window.deductStock(item.id, item.quantity);
                        }
                    }
                } catch (error) {
                    console.error('Error in automatic stock deduction:', error);
                }
            }, 500);
        }
        
        return result;
    };
}

// Load stock UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.updateStockUI();
        
        // Try to hook processOrder if it loads later
        setTimeout(() => {
            if (window.processOrder && !window.processOrder.toString().includes('deduct stock')) {
                const originalProcessOrder = window.processOrder;
                window.processOrder = async function(...args) {
                    console.log('🎯 processOrder called (late hook), will deduct stock after order save');
                    const result = await originalProcessOrder.apply(this, args);
                    
                    if (result && result.id) {
                        console.log('🔄 Order saved successfully, deducting stock for order:', result.id);
                        setTimeout(async () => {
                            try {
                                const { data: order } = await stockSupabase
                                    .from('orders')
                                    .select('*')
                                    .eq('id', result.id)
                                    .single();
                                
                                if (order && order.items) {
                                    for (const item of order.items) {
                                        await window.deductStock(item.id, item.quantity);
                                    }
                                }
                            } catch (error) {
                                console.error('Error in automatic stock deduction:', error);
                            }
                        }, 500);
                    }
                    
                    return result;
                };
            }
        }, 3000);
    }, 2000);
});