// Test Admin Refresh - Verify admin panel updates work

window.testAdminRefresh = function() {
    console.log('🧪 Testing admin refresh system...');
    
    // Simulate order placement triggers
    localStorage.setItem('FORCE_ADMIN_REFRESH', JSON.stringify({
        timestamp: Date.now(),
        orderId: 'test_' + Date.now(),
        action: 'ORDER_PLACED'
    }));
    
    localStorage.setItem('ADMIN_REFRESH_NOW', Date.now().toString());
    
    window.dispatchEvent(new CustomEvent('forceAdminRefresh', {
        detail: { orderId: 'test_order', items: [] }
    }));
    
    console.log('✅ Admin refresh triggers sent');
    console.log('📋 Check admin panel in 2-3 seconds for refresh');
    
    return true;
};

// Auto-run test on admin page
if (window.location.pathname.includes('admin')) {
    setTimeout(() => {
        console.log('🧪 Auto-testing admin refresh...');
        window.testAdminRefresh();
    }, 3000);
}

console.log('✅ Test admin refresh loaded - Use testAdminRefresh() to test');