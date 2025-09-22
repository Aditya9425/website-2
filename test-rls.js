// Test RLS Implementation
async function testRLS() {
    console.log('🧪 Testing RLS Implementation...');
    
    try {
        // Test 1: Public read access to products (should work)
        console.log('Test 1: Reading products (public access)');
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .limit(1);
        
        if (productsError) {
            console.error('❌ Products read failed:', productsError);
        } else {
            console.log('✅ Products read successful:', products.length, 'items');
        }
        
        // Test 2: Try to read orders without authentication (should fail or return empty)
        console.log('Test 2: Reading orders without auth');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .limit(1);
        
        if (ordersError) {
            console.log('✅ Orders read properly restricted:', ordersError.message);
        } else {
            console.log('ℹ️ Orders read returned:', orders.length, 'items');
        }
        
        // Test 3: Test user authentication
        console.log('Test 3: Testing authentication');
        const testUser = window.authManager?.getCurrentUser();
        if (testUser) {
            console.log('✅ User authenticated:', testUser.email);
        } else {
            console.log('ℹ️ No user authenticated (expected for public pages)');
        }
        
        console.log('🎉 RLS test completed');
        
    } catch (error) {
        console.error('❌ RLS test failed:', error);
    }
}

// Auto-run test when script loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testRLS, 2000); // Wait 2 seconds for other scripts to load
});