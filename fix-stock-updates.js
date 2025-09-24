// Fix for stock updates not reflecting in admin panel

// Enhanced stock update trigger
function triggerStockUpdateForAdmin() {
    console.log('🔄 Triggering stock update for admin panel...');
    
    // Force refresh admin panel if available
    if (typeof window.adminPanel !== 'undefined') {
        // Refresh products list
        if (window.adminPanel.loadProducts) {
            setTimeout(() => {
                window.adminPanel.loadProducts();
                console.log('✅ Admin products refreshed');
            }, 500);
        }
        
        // Refresh dashboard data
        if (window.adminPanel.loadDashboardData) {
            setTimeout(() => {
                window.adminPanel.loadDashboardData();
                console.log('✅ Admin dashboard refreshed');
            }, 1000);
        }
        
        // Refresh stock alerts
        if (window.adminPanel.loadStockAlerts) {
            setTimeout(() => {
                window.adminPanel.loadStockAlerts();
                console.log('✅ Stock alerts refreshed');
            }, 1500);
        }
    }
}

// Enhanced processOrder function with better stock management
async function processOrderWithStockUpdate(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('=== PROCESSING ORDER WITH STOCK UPDATE ===');
    
    // Get user session
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const userId = userSession.id;
    
    if (!userId) {
        console.error('❌ No user ID found');
        alert('Please login to place an order.');
        return null;
    }
    
    // Determine order items
    let items = [];
    if (isBuyNow) {
        const buyNowItem = orderItems || JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            console.error('❌ Buy now item is missing');
            alert('No item selected for purchase.');
            return null;
        }
        items = Array.isArray(buyNowItem) ? buyNowItem : [buyNowItem];
    } else {
        if (!cart || cart.length === 0) {
            console.error('❌ Cart is empty');
            alert('Your cart is empty.');
            return null;
        }
        items = [...cart];
    }
    
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    if (!addressData.firstName) {
        console.error('❌ Address data is missing');
        alert('Delivery address is required.');
        return null;
    }
    
    try {
        // STEP 1: Validate and reserve stock
        console.log('🔍 Validating and reserving stock...');
        
        for (const item of items) {
            const { data, error } = await supabase.rpc('deduct_stock', {
                product_id: parseInt(item.id),
                quantity_to_deduct: parseInt(item.quantity)
            });
            
            if (error || !data) {
                console.error(`❌ Stock deduction failed for ${item.name}:`, error);
                throw new Error(`Failed to reserve stock for ${item.name}. Please check availability.`);
            }
            
            console.log(`✅ Stock deducted for ${item.name}: ${item.quantity} units`);
        }
        
        // STEP 2: Create and save order
        const order = {\n            user_id: userId.toString(),\n            items: items.map(item => ({\n                id: item.id,\n                name: item.name,\n                price: item.price,\n                quantity: item.quantity,\n                image: item.image,\n                category: item.category\n            })),\n            total_amount: total,\n            shipping_addr: addressData,\n            status: paymentMethod === 'cod' ? 'pending' : 'confirmed',\n            payment_method: paymentMethod,\n            payment_id: paymentId\n        };\n        \n        console.log('💾 Saving order to database...');\n        const { data: savedOrder, error: saveError } = await supabase\n            .from('orders')\n            .insert([order])\n            .select('id, created_at, *')\n            .single();\n        \n        if (saveError || !savedOrder) {\n            console.error('❌ Failed to save order:', saveError);\n            // Restore stock if order save fails\n            await restoreStockForFailedOrder(items);\n            throw new Error('Failed to save order. Stock has been restored.');\n        }\n        \n        console.log('✅ Order saved successfully:', savedOrder.id);\n        \n        // STEP 3: Trigger admin panel updates\n        triggerStockUpdateForAdmin();\n        \n        // STEP 4: Clear cart/buy now item\n        if (isBuyNow) {\n            localStorage.removeItem('buyNowItem');\n        } else {\n            cart = [];\n            localStorage.setItem('cart', JSON.stringify(cart));\n            updateCartCount();\n        }\n        \n        return savedOrder;\n        \n    } catch (error) {\n        console.error('❌ Error processing order:', error);\n        alert(`Order failed: ${error.message}`);\n        return null;\n    }\n}\n\n// Restore stock for failed orders\nasync function restoreStockForFailedOrder(items) {\n    console.log('🔄 Restoring stock for failed order...');\n    \n    for (const item of items) {\n        try {\n            const { data, error } = await supabase.rpc('restore_stock', {\n                product_id: parseInt(item.id),\n                quantity_to_restore: parseInt(item.quantity)\n            });\n            \n            if (error) {\n                console.error(`Failed to restore stock for ${item.name}:`, error);\n            } else {\n                console.log(`✅ Stock restored for ${item.name}: +${item.quantity} units`);\n            }\n        } catch (error) {\n            console.error(`Error restoring stock for ${item.name}:`, error);\n        }\n    }\n}\n\n// Override the original processOrder function\nif (typeof window.processOrder !== 'undefined') {\n    window.originalProcessOrder = window.processOrder;\n}\nwindow.processOrder = processOrderWithStockUpdate;\n\n// Make functions globally available\nwindow.triggerStockUpdateForAdmin = triggerStockUpdateForAdmin;\nwindow.processOrderWithStockUpdate = processOrderWithStockUpdate;\nwindow.restoreStockForFailedOrder = restoreStockForFailedOrder;\n\nconsole.log('✅ Stock update fix loaded');\n