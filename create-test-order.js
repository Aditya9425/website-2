// Create test order for current user
async function createTestOrder() {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        console.error('No user session found');
        return;
    }
    
    const user = JSON.parse(userSession);
    console.log('Creating test order for user:', user.id);
    
    const testOrder = {
        user_id: user.id,
        items: [{
            id: 1,
            name: 'Test Silk Saree',
            price: 2500,
            quantity: 1,
            image: 'test-image.jpg',
            category: 'silk'
        }],
        total_amount: 2500,
        shipping_addr: {
            firstName: 'Test',
            lastName: 'User',
            email: user.email,
            mobile: '9999999999',
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
        },
        status: 'confirmed',
        payment_method: 'razorpay',
        payment_id: 'test_payment_123'
    };
    
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([testOrder])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating test order:', error);
            return;
        }
        
        console.log('✅ Test order created:', data);
        
        // Reload orders
        if (typeof loadUserOrders === 'function') {
            loadUserOrders();
        }
        
        return data;
    } catch (error) {
        console.error('Failed to create test order:', error);
    }
}

// Make function available globally
window.createTestOrder = createTestOrder;
console.log('Run createTestOrder() to add a test order for current user');