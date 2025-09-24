// Force Admin Refresh - Aggressive admin panel updates

// Override processOrder with forced admin refresh
const originalProcessOrder = window.processOrder;

window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('🔧 Force Admin Refresh: Processing order...');
    
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
        // STEP 1: Update stock directly
        console.log('🔒 Updating stock...');
        for (const item of items) {
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.id)
                .single();
            
            if (fetchError || !product) {
                throw new Error(`Product ${item.name} not found`);
            }
            
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }
            
            const newStock = product.stock - item.quantity;
            const { error: updateError } = await supabase
                .from('products')
                .update({ 
                    stock: newStock,
                    status: newStock <= 0 ? 'out-of-stock' : 'active'
                })
                .eq('id', item.id);
            
            if (updateError) {
                throw new Error(`Failed to update stock for ${item.name}`);
            }
            
            console.log(`✅ Stock updated: ${item.name} → ${newStock}`);
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
        
        const { data: savedOrder, error: saveError } = await supabase
            .from('orders')
            .insert([order])
            .select('id, created_at, *')
            .single();
        
        if (saveError || !savedOrder) {
            throw new Error('Failed to save order');
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
        
        // STEP 4: FORCE ADMIN REFRESH IMMEDIATELY
        console.log('🔄 FORCING ADMIN REFRESH...');
        
        // Method 1: Set multiple localStorage triggers
        localStorage.setItem('FORCE_ADMIN_REFRESH', JSON.stringify({
            timestamp: Date.now(),
            orderId: savedOrder.id,
            action: 'ORDER_PLACED'
        }));
        
        localStorage.setItem('ADMIN_REFRESH_NOW', Date.now().toString());
        localStorage.setItem('STOCK_CHANGED', JSON.stringify({
            products: items.map(item => ({ id: item.id, name: item.name })),
            timestamp: Date.now()
        }));
        
        // Method 2: Dispatch multiple events
        window.dispatchEvent(new CustomEvent('forceAdminRefresh', {
            detail: { orderId: savedOrder.id, items: items }
        }));
        
        window.dispatchEvent(new CustomEvent('stockChanged', {
            detail: { products: items }
        }));
        
        // Method 3: Direct admin panel refresh if available
        if (typeof window.adminPanel !== 'undefined') {
            console.log('🔄 Direct admin panel refresh...');
            setTimeout(() => {
                if (window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
                if (window.adminPanel.loadDashboardData) {
                    window.adminPanel.loadDashboardData();
                }
            }, 500);
        }
        
        return savedOrder;
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        alert(`Order failed: ${error.message}`);
        return null;
    }
};

// AGGRESSIVE ADMIN REFRESH LISTENER (only on admin pages)
if (window.location.pathname.includes('admin')) {
    console.log('🎯 Setting up AGGRESSIVE admin refresh...');
    
    // Method 1: Check localStorage every 1 second
    setInterval(() => {
        const forceRefresh = localStorage.getItem('FORCE_ADMIN_REFRESH');
        const refreshNow = localStorage.getItem('ADMIN_REFRESH_NOW');
        const stockChanged = localStorage.getItem('STOCK_CHANGED');
        
        if (forceRefresh || refreshNow || stockChanged) {
            console.log('🔄 ADMIN REFRESH TRIGGERED!');
            
            // Clear triggers
            localStorage.removeItem('FORCE_ADMIN_REFRESH');
            localStorage.removeItem('ADMIN_REFRESH_NOW');
            localStorage.removeItem('STOCK_CHANGED');
            
            // Force refresh
            if (typeof window.adminPanel !== 'undefined') {
                console.log('🔄 Refreshing admin panel NOW...');
                if (window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
                if (window.adminPanel.loadDashboardData) {
                    window.adminPanel.loadDashboardData();
                }
            }
        }
    }, 1000);
    
    // Method 2: Listen for events
    window.addEventListener('forceAdminRefresh', () => {
        console.log('🔄 Force refresh event received');
        if (typeof window.adminPanel !== 'undefined') {
            if (window.adminPanel.loadProducts) {
                window.adminPanel.loadProducts();
            }
        }
    });
    
    window.addEventListener('stockChanged', () => {
        console.log('🔄 Stock changed event received');
        if (typeof window.adminPanel !== 'undefined') {
            if (window.adminPanel.loadProducts) {
                window.adminPanel.loadProducts();
            }
        }
    });
    
    // Method 3: Supabase real-time listener
    if (typeof supabase !== 'undefined') {
        supabase
            .channel('admin-product-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'products'
            }, (payload) => {
                console.log('🔄 Real-time product update:', payload);
                if (typeof window.adminPanel !== 'undefined' && window.adminPanel.loadProducts) {
                    window.adminPanel.loadProducts();
                }
            })
            .subscribe();
        
        supabase
            .channel('admin-order-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders'
            }, (payload) => {
                console.log('🔄 Real-time order insert:', payload);
                if (typeof window.adminPanel !== 'undefined') {
                    if (window.adminPanel.loadProducts) {
                        window.adminPanel.loadProducts();
                    }
                    if (window.adminPanel.loadDashboardData) {
                        window.adminPanel.loadDashboardData();
                    }
                }
            })
            .subscribe();
    }
    
    console.log('✅ AGGRESSIVE admin refresh ready');
}

console.log('✅ Force Admin Refresh loaded');