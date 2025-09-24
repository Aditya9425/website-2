// Force Admin Panel Update - Ensures admin panel gets real-time stock updates

// Enhanced processOrder with forced admin updates
const originalProcessOrder = window.processOrder;

window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('🔧 Force Admin Update: Processing order...');
    
    // Get user session
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const userId = userSession.id;
    
    if (!userId) {
        alert('Please login to place an order.');
        return null;
    }
    
    // Determine order items
    let items = [];
    if (isBuyNow) {
        const buyNowItem = orderItems || JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            alert('No item selected for purchase.');
            return null;
        }
        items = Array.isArray(buyNowItem) ? buyNowItem : [buyNowItem];
    } else {
        if (!cart || cart.length === 0) {
            alert('Your cart is empty.');
            return null;
        }
        items = [...cart];
    }
    
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    if (!addressData.firstName) {
        alert('Delivery address is required.');
        return null;
    }
    
    try {
        // STEP 1: Deduct stock for each item using atomic operations
        console.log('🔒 Deducting stock for items...');
        for (const item of items) {
            const { data, error } = await supabase.rpc('deduct_stock', {
                product_id: parseInt(item.id),
                quantity_to_deduct: parseInt(item.quantity)
            });
            
            if (error || !data) {
                console.error(`❌ Stock deduction failed for ${item.name}:`, error);
                throw new Error(`Failed to reserve stock for ${item.name}`);
            }
            
            console.log(`✅ Stock deducted for ${item.name}: ${item.quantity} units`);
        }
        
        // STEP 2: Create and save order
        const order = {
            user_id: userId.toString(),
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                category: item.category
            })),
            total_amount: total,
            shipping_addr: addressData,
            status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
            payment_method: paymentMethod,
            payment_id: paymentId
        };
        
        console.log('💾 Saving order to database...');
        const { data: savedOrder, error: saveError } = await supabase
            .from('orders')
            .insert([order])
            .select('id, created_at, *')
            .single();
        
        if (saveError || !savedOrder) {
            console.error('❌ Failed to save order:', saveError);
            // Restore stock if order save fails
            for (const item of items) {
                await supabase.rpc('restore_stock', {
                    product_id: parseInt(item.id),
                    quantity_to_restore: parseInt(item.quantity)
                });
            }
            throw new Error('Failed to save order. Stock has been restored.');
        }
        
        console.log('✅ Order saved successfully:', savedOrder.id);
        
        // STEP 3: Force immediate admin panel updates
        console.log('🔄 Forcing admin panel updates...');
        
        // Method 1: Trigger custom events
        window.dispatchEvent(new CustomEvent('stockUpdated', { 
            detail: { 
                items: items,
                orderId: savedOrder.id,
                timestamp: new Date().toISOString()
            }
        }));
        
        // Method 2: Direct database trigger for admin notifications
        try {
            await supabase.rpc('notify_admin_stock_change', {
                changed_products: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity_sold: item.quantity
                }))
            });
        } catch (notifyError) {
            console.warn('Admin notification failed:', notifyError);
        }
        
        // Method 3: Force refresh admin panel if open in another tab
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('admin-updates');
            channel.postMessage({
                type: 'STOCK_UPDATED',
                data: {
                    items: items,
                    orderId: savedOrder.id,
                    timestamp: new Date().toISOString()
                }
            });
            channel.close();
        }
        
        // Method 4: Update localStorage trigger for admin panel
        const adminTrigger = {
            type: 'STOCK_UPDATE',
            timestamp: Date.now(),
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantitySold: item.quantity
            })),
            orderId: savedOrder.id
        };
        localStorage.setItem('adminStockTrigger', JSON.stringify(adminTrigger));
        
        // STEP 4: Clear cart/buy now item
        if (isBuyNow) {
            localStorage.removeItem('buyNowItem');
        } else {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        }
        
        // STEP 5: Additional admin panel refresh methods
        setTimeout(() => {
            console.log('🔄 Additional admin refresh triggers...');
            
            // Trigger all available refresh methods
            if (typeof window.triggerStockUpdateForAdmin === 'function') {
                window.triggerStockUpdateForAdmin();
            }
            
            if (typeof window.adminPanel !== 'undefined') {
                if (window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
                if (window.adminPanel.loadDashboardData) {
                    window.adminPanel.loadDashboardData();
                }
                if (window.adminPanel.refreshStockAlerts) {
                    window.adminPanel.refreshStockAlerts();
                }
            }
            
            // Force real-time subscription refresh
            if (typeof window.realtimeStock !== 'undefined' && window.realtimeStock.forceRefresh) {
                window.realtimeStock.forceRefresh();
            }
        }, 500);
        
        return savedOrder;
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        alert(`Order failed: ${error.message}`);
        return null;
    }
};

// Listen for admin panel updates
if (typeof window !== 'undefined') {
    window.addEventListener('stockUpdated', (event) => {
        console.log('📢 Stock update event received:', event.detail);
        
        // If this is an admin page, refresh immediately
        if (window.location.pathname.includes('admin')) {
            setTimeout(() => {
                if (typeof window.adminPanel !== 'undefined' && window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
            }, 1000);
        }
    });
    
    // Listen for localStorage changes (for cross-tab communication)
    window.addEventListener('storage', (event) => {
        if (event.key === 'adminStockTrigger' && window.location.pathname.includes('admin')) {
            console.log('📢 Admin stock trigger detected via localStorage');
            setTimeout(() => {
                if (typeof window.adminPanel !== 'undefined' && window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
            }, 1000);
        }
    });
    
    // BroadcastChannel listener for cross-tab updates
    if (typeof BroadcastChannel !== 'undefined') {
        const adminChannel = new BroadcastChannel('admin-updates');
        adminChannel.addEventListener('message', (event) => {
            if (event.data.type === 'STOCK_UPDATED' && window.location.pathname.includes('admin')) {
                console.log('📢 Admin update received via BroadcastChannel:', event.data);
                setTimeout(() => {
                    if (typeof window.adminPanel !== 'undefined' && window.adminPanel.loadProducts) {
                        window.adminPanel.loadProducts();
                    }
                }, 1000);
            }
        });
    }
}

console.log('✅ Force Admin Update loaded - Enhanced processOrder with multiple update triggers');