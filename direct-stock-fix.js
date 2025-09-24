// Direct Stock Fix - Ensures stock is deducted when orders are placed

// Override processOrder to ensure stock deduction works
const originalProcessOrder = window.processOrder;

window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('🔧 Direct Stock Fix: Processing order...');
    
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
        // STEP 1: Deduct stock for each item
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
        
        // STEP 3: Clear cart/buy now item
        if (isBuyNow) {
            localStorage.removeItem('buyNowItem');
        } else {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        }
        
        // STEP 4: Force admin panel refresh
        setTimeout(() => {
            console.log('🔄 Triggering admin panel refresh...');
            
            // Trigger multiple refresh methods
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
            }
            
            // Force a page refresh for admin panel if it's open
            if (window.location.pathname.includes('admin')) {
                setTimeout(() => window.location.reload(), 2000);
            }
        }, 1000);
        
        return savedOrder;
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        alert(`Order failed: ${error.message}`);
        return null;
    }
};

console.log('✅ Direct Stock Fix loaded - processOrder function overridden');