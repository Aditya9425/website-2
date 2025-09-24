// Direct Stock Update - Works without SQL functions

// Override processOrder with direct stock updates
const originalProcessOrder = window.processOrder;

window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('🔧 Direct Stock Update: Processing order...');
    
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
        // STEP 1: Check and update stock directly
        console.log('🔒 Updating stock directly...');
        for (const item of items) {
            // Get current product data
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.id)
                .single();
            
            if (fetchError || !product) {
                throw new Error(`Product ${item.name} not found`);
            }
            
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
            }
            
            // Update stock directly
            const newStock = product.stock - item.quantity;
            const newStatus = newStock <= 0 ? 'out-of-stock' : 'active';
            
            const { error: updateError } = await supabase
                .from('products')
                .update({ 
                    stock: newStock,
                    status: newStatus
                })
                .eq('id', item.id);
            
            if (updateError) {
                throw new Error(`Failed to update stock for ${item.name}: ${updateError.message}`);
            }
            
            console.log(`✅ Stock updated for ${item.name}: ${product.stock} → ${newStock}`);
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
            // Restore stock on failure
            for (const item of items) {
                const { data: product } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', item.id)
                    .single();
                
                if (product) {
                    await supabase
                        .from('products')
                        .update({ 
                            stock: product.stock + item.quantity,
                            status: 'active'
                        })
                        .eq('id', item.id);
                }
            }
            throw new Error('Failed to save order. Stock has been restored.');
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
        
        // STEP 4: Trigger admin refresh
        console.log('🔄 Triggering admin refresh...');
        
        // Set refresh trigger
        localStorage.setItem('adminRefreshTrigger', JSON.stringify({
            timestamp: Date.now(),
            orderId: savedOrder.id,
            type: 'ORDER_PLACED'
        }));
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('stockUpdated', {
            detail: { orderId: savedOrder.id, items: items }
        }));
        
        return savedOrder;
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        alert(`Order failed: ${error.message}`);
        return null;
    }
};

// Admin refresh listener (only on admin pages)
if (window.location.pathname.includes('admin')) {
    console.log('🎯 Setting up admin refresh listener...');
    
    // Check for refresh triggers every 2 seconds
    setInterval(() => {
        const trigger = localStorage.getItem('adminRefreshTrigger');
        if (trigger) {
            try {
                const data = JSON.parse(trigger);
                const now = Date.now();
                
                // Process if less than 10 seconds old
                if (now - data.timestamp < 10000) {
                    console.log('🔄 Admin refresh triggered:', data);
                    
                    // Clear trigger
                    localStorage.removeItem('adminRefreshTrigger');
                    
                    // Refresh admin panel
                    setTimeout(() => {
                        if (typeof window.adminPanel !== 'undefined') {
                            console.log('🔄 Refreshing admin panel...');
                            if (window.adminPanel.loadProducts) {
                                window.adminPanel.loadProducts();
                            }
                            if (window.adminPanel.loadDashboardData) {
                                window.adminPanel.loadDashboardData();
                            }
                        }
                    }, 1000);
                }
            } catch (e) {
                console.warn('Invalid refresh trigger:', e);
                localStorage.removeItem('adminRefreshTrigger');
            }
        }
    }, 2000);
    
    // Listen for stock update events
    window.addEventListener('stockUpdated', (event) => {
        console.log('🔄 Stock update event received:', event.detail);
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
    
    console.log('✅ Admin refresh listener ready');
}

console.log('✅ Direct Stock Update loaded');