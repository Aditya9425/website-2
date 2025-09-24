// Simple Admin Refresh - Direct and reliable stock update system

// Override processOrder with immediate admin refresh
const originalProcessOrder = window.processOrder;

window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('🔧 Simple Admin Refresh: Processing order...');
    
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const userId = userSession.id;
    
    if (!userId) {
        alert('Please login to place an order.');
        return null;
    }
    
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
        // STEP 1: Deduct stock
        console.log('🔒 Deducting stock...');
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
        
        // STEP 2: Save order
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
        
        console.log('💾 Saving order...');
        const { data: savedOrder, error: saveError } = await supabase
            .from('orders')
            .insert([order])
            .select('id, created_at, *')
            .single();
        
        if (saveError || !savedOrder) {
            console.error('❌ Failed to save order:', saveError);
            throw new Error('Failed to save order.');
        }
        
        console.log('✅ Order saved:', savedOrder.id);
        
        // STEP 3: Clear cart
        if (isBuyNow) {
            localStorage.removeItem('buyNowItem');
        } else {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        }
        
        // STEP 4: Force admin refresh immediately
        console.log('🔄 Forcing admin refresh...');
        
        // Method 1: Direct localStorage trigger
        localStorage.setItem('forceAdminRefresh', JSON.stringify({
            timestamp: Date.now(),
            orderId: savedOrder.id,
            items: items.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
        }));
        
        // Method 2: Custom event
        window.dispatchEvent(new CustomEvent('orderPlaced', {
            detail: { orderId: savedOrder.id, items: items }
        }));
        
        // Method 3: BroadcastChannel for cross-tab
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('admin-refresh');
            channel.postMessage({
                type: 'ORDER_PLACED',
                orderId: savedOrder.id,
                items: items,
                timestamp: Date.now()
            });
            channel.close();
        }
        
        return savedOrder;
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        alert(`Order failed: ${error.message}`);
        return null;
    }
};

// Admin panel listener (only runs on admin pages)
if (window.location.pathname.includes('admin')) {
    console.log('🎯 Setting up admin refresh listeners...');
    
    // Listen for localStorage changes
    setInterval(() => {
        const refreshTrigger = localStorage.getItem('forceAdminRefresh');
        if (refreshTrigger) {
            try {
                const data = JSON.parse(refreshTrigger);
                const now = Date.now();
                
                // Process if less than 10 seconds old
                if (now - data.timestamp < 10000) {
                    console.log('🔄 Admin refresh triggered by localStorage:', data);
                    
                    // Clear trigger
                    localStorage.removeItem('forceAdminRefresh');
                    
                    // Refresh admin panel
                    setTimeout(() => {
                        if (typeof window.adminPanel !== 'undefined') {
                            if (window.adminPanel.loadProducts) {
                                console.log('🔄 Refreshing products...');
                                window.adminPanel.loadProducts();
                            }
                            if (window.adminPanel.loadDashboardData) {
                                console.log('🔄 Refreshing dashboard...');
                                window.adminPanel.loadDashboardData();
                            }
                        }
                    }, 1000);
                }
            } catch (e) {
                console.warn('Invalid refresh trigger:', e);
            }
        }
    }, 2000);
    
    // Listen for custom events
    window.addEventListener('orderPlaced', (event) => {
        console.log('🔄 Admin refresh triggered by custom event:', event.detail);
        setTimeout(() => {
            if (typeof window.adminPanel !== 'undefined') {
                if (window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
                if (window.adminPanel.loadDashboardData) {
                    window.adminPanel.loadDashboardData();
                }
            }
        }, 1000);
    });
    
    // Listen for BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('admin-refresh');
        channel.addEventListener('message', (event) => {
            if (event.data.type === 'ORDER_PLACED') {
                console.log('🔄 Admin refresh triggered by BroadcastChannel:', event.data);
                setTimeout(() => {
                    if (typeof window.adminPanel !== 'undefined') {
                        if (window.adminPanel.loadProducts) {
                            window.adminPanel.loadProducts();
                        }
                        if (window.adminPanel.loadDashboardData) {
                            window.adminPanel.loadDashboardData();
                        }
                    }
                }, 1000);
            }
        });
    }
    
    console.log('✅ Admin refresh listeners ready');
}

console.log('✅ Simple Admin Refresh loaded');