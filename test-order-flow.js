// Test Order Flow - Verify stock deduction and admin refresh

window.testOrderFlow = async function() {
    console.log('🧪 Testing order flow...');
    
    try {
        // Test stock deduction
        const testProductId = 1;
        const testQuantity = 1;
        
        console.log(`Testing stock deduction for product ${testProductId}, quantity ${testQuantity}`);
        
        const { data, error } = await supabase.rpc('deduct_stock', {
            product_id: testProductId,
            quantity_to_deduct: testQuantity
        });
        
        if (error) {
            console.error('❌ Stock deduction test failed:', error);
            return false;
        }
        
        console.log('✅ Stock deduction test passed:', data);
        
        // Test admin refresh trigger
        console.log('Testing admin refresh trigger...');
        
        localStorage.setItem('forceAdminRefresh', JSON.stringify({
            timestamp: Date.now(),
            orderId: 'test_order_' + Date.now(),
            items: [{ id: testProductId, name: 'Test Product', quantity: testQuantity }]
        }));
        
        window.dispatchEvent(new CustomEvent('orderPlaced', {
            detail: { orderId: 'test_order', items: [{ id: testProductId, name: 'Test Product', quantity: testQuantity }] }
        }));
        
        console.log('✅ Admin refresh triggers sent');
        
        // Restore stock
        console.log('Restoring test stock...');
        const { data: restoreData, error: restoreError } = await supabase.rpc('restore_stock', {
            product_id: testProductId,
            quantity_to_restore: testQuantity
        });
        
        if (restoreError) {
            console.warn('⚠️ Stock restoration failed:', restoreError);
        } else {
            console.log('✅ Stock restored');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
};

// Auto-run test if on admin page
if (window.location.pathname.includes('admin')) {
    setTimeout(() => {
        console.log('🧪 Auto-running order flow test...');
        window.testOrderFlow();
    }, 3000);
}

console.log('✅ Test order flow loaded - Use testOrderFlow() to test');