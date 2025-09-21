// Test function to verify order placement and confirmation flow
// Add this to your browser console to test the order flow

async function testOrderFlow() {
    console.log('🧪 Testing order flow...');
    
    // Mock user session
    const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com'
    };
    localStorage.setItem('userSession', JSON.stringify(mockUser));
    
    // Mock address data
    const mockAddress = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        mobile: '9999999999',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
    };
    localStorage.setItem('deliveryAddress', JSON.stringify(mockAddress));
    
    // Mock cart item
    const mockCart = [{
        id: 1,
        name: 'Test Saree',
        price: 2500,
        quantity: 1,
        image: 'test-image.jpg',
        category: 'silk'
    }];
    localStorage.setItem('cart', JSON.stringify(mockCart));
    
    try {
        // Test the processOrder function
        console.log('📦 Testing processOrder...');
        const result = await processOrder(2500, 'razorpay', mockCart, false, 'test_payment_123');
        
        if (result && result.id) {
            console.log('✅ Order processed successfully!');
            console.log('📋 Order ID:', result.id);
            console.log('💰 Total Amount:', result.total_amount);
            
            // Test the confirmation popup
            showOrderConfirmation(result);
            
            return result;
        } else {
            console.error('❌ Order processing failed');
            return null;
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
}

// Test function for My Orders section
async function testMyOrders() {
    console.log('🧪 Testing My Orders section...');
    
    // Ensure user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        console.error('❌ No user session found. Please login first.');
        return;
    }
    
    const user = JSON.parse(userSession);
    console.log('👤 Current user:', user.email);
    
    try {
        // Fetch user's orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id.toString())
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error fetching orders:', error);
            return;
        }
        
        console.log('📋 User orders:', orders);
        console.log('📊 Total orders found:', orders?.length || 0);
        
        if (orders && orders.length > 0) {
            orders.forEach(order => {
                console.log(`📦 Order ${order.id}: ₹${order.total_amount} - ${order.status}`);
            });
        } else {
            console.log('📭 No orders found for this user');
        }
        
        return orders;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
}

// Make functions available globally for testing
window.testOrderFlow = testOrderFlow;
window.testMyOrders = testMyOrders;

console.log('🧪 Test functions loaded. Use testOrderFlow() and testMyOrders() in console to test.');