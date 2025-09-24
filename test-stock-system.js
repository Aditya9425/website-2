// Test Stock Management System

async function testStockSystem() {
    console.log('🧪 Testing Stock Management System...');
    
    // Test 1: Check if SQL functions exist
    console.log('\n📋 Test 1: Checking SQL Functions...');
    try {
        const { data, error } = await supabase.rpc('deduct_stock', {
            product_id: 999999, // Non-existent product
            quantity_to_deduct: 1
        });
        
        if (error && error.message.includes('function')) {
            console.error('❌ SQL functions not created. Please run the SQL scripts first.');
            return false;
        } else {
            console.log('✅ SQL functions are available');
        }
    } catch (error) {
        console.error('❌ Error testing SQL functions:', error);
        return false;
    }
    
    // Test 2: Check if products exist
    console.log('\n📋 Test 2: Checking Products...');
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, stock, status')
            .limit(5);
        
        if (error) {
            console.error('❌ Error fetching products:', error);
            return false;
        }
        
        if (!products || products.length === 0) {
            console.error('❌ No products found in database');
            return false;
        }
        
        console.log('✅ Found products:', products.length);
        console.table(products);
        
        // Test 3: Test stock deduction
        console.log('\n📋 Test 3: Testing Stock Deduction...');
        const testProduct = products.find(p => p.stock > 0);
        
        if (!testProduct) {
            console.error('❌ No products with stock > 0 found for testing');
            return false;
        }
        
        console.log(`Testing with product: ${testProduct.name} (ID: ${testProduct.id}, Stock: ${testProduct.stock})`);
        
        // Deduct 1 unit
        const { data: deductResult, error: deductError } = await supabase.rpc('deduct_stock', {
            product_id: testProduct.id,
            quantity_to_deduct: 1
        });
        
        if (deductError) {
            console.error('❌ Stock deduction failed:', deductError);
            return false;
        }
        
        if (!deductResult) {
            console.error('❌ Stock deduction returned false (insufficient stock or other issue)');
            return false;
        }
        
        console.log('✅ Stock deduction successful');
        
        // Check updated stock
        const { data: updatedProduct, error: fetchError } = await supabase
            .from('products')
            .select('stock, status')
            .eq('id', testProduct.id)
            .single();
        
        if (fetchError) {
            console.error('❌ Error fetching updated product:', fetchError);
            return false;
        }
        
        console.log(`✅ Stock updated: ${testProduct.stock} → ${updatedProduct.stock}`);
        console.log(`✅ Status: ${testProduct.status} → ${updatedProduct.status}`);
        
        // Test 4: Restore stock
        console.log('\n📋 Test 4: Testing Stock Restoration...');
        const { data: restoreResult, error: restoreError } = await supabase.rpc('restore_stock', {
            product_id: testProduct.id,
            quantity_to_restore: 1
        });
        
        if (restoreError) {
            console.error('❌ Stock restoration failed:', restoreError);
            return false;
        }
        
        if (!restoreResult) {
            console.error('❌ Stock restoration returned false');
            return false;
        }
        
        console.log('✅ Stock restoration successful');
        
        // Check restored stock
        const { data: restoredProduct, error: restoreFetchError } = await supabase
            .from('products')
            .select('stock, status')
            .eq('id', testProduct.id)
            .single();
        
        if (restoreFetchError) {
            console.error('❌ Error fetching restored product:', restoreFetchError);
            return false;
        }
        
        console.log(`✅ Stock restored: ${updatedProduct.stock} → ${restoredProduct.stock}`);
        console.log(`✅ Status: ${updatedProduct.status} → ${restoredProduct.status}`);
        
        // Test 5: Test real-time updates
        console.log('\n📋 Test 5: Testing Real-time Updates...');
        if (typeof initializeRealtimeStock === 'function') {
            initializeRealtimeStock();
            console.log('✅ Real-time stock updates initialized');
        } else {
            console.warn('⚠️ Real-time stock function not found');
        }
        
        console.log('\n🎉 All stock system tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Unexpected error during testing:', error);
        return false;
    }
}

// Test order processing
async function testOrderProcessing() {
    console.log('\n🧪 Testing Order Processing...');
    
    try {
        // Get a product with stock
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .gt('stock', 0)
            .limit(1);
        
        if (error || !products || products.length === 0) {
            console.error('❌ No products with stock found for order testing');
            return false;
        }
        
        const testProduct = products[0];
        console.log(`Testing order with product: ${testProduct.name}`);
        
        // Create test order items
        const orderItems = [{
            id: testProduct.id,
            name: testProduct.name,
            price: testProduct.price,
            quantity: 1,
            image: testProduct.image || testProduct.images?.[0],
            category: testProduct.category
        }];
        
        // Test stock validation
        console.log('Testing stock validation...');
        if (typeof validateOrderStock === 'function') {
            const validation = await validateOrderStock(orderItems);
            if (validation.valid) {
                console.log('✅ Stock validation passed');
            } else {
                console.error('❌ Stock validation failed:', validation.reason);
                return false;
            }
        }
        
        // Test stock reservation
        console.log('Testing stock reservation...');
        if (typeof reserveOrderStock === 'function') {
            const reservation = await reserveOrderStock(orderItems);
            if (reservation.success) {
                console.log('✅ Stock reservation successful');
                
                // Restore stock after test
                if (typeof restoreOrderStock === 'function') {
                    await restoreOrderStock(orderItems);
                    console.log('✅ Stock restored after test');
                }
            } else {
                console.error('❌ Stock reservation failed:', reservation.error);
                return false;
            }
        }
        
        console.log('✅ Order processing test completed');
        return true;
        
    } catch (error) {
        console.error('❌ Error testing order processing:', error);
        return false;
    }
}

// Run comprehensive test
async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Stock System Test...');
    console.log('================================================');
    
    const stockTest = await testStockSystem();
    const orderTest = await testOrderProcessing();
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Stock System: ${stockTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Order Processing: ${orderTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (stockTest && orderTest) {
        console.log('\n🎉 All tests passed! Stock system is working correctly.');
        console.log('\n📝 Next steps:');
        console.log('1. Place a test order on the website');
        console.log('2. Check admin panel for stock updates');
        console.log('3. Verify real-time updates are working');
    } else {
        console.log('\n❌ Some tests failed. Please check the issues above.');
    }
}

// Make functions globally available for testing
window.testStockSystem = testStockSystem;
window.testOrderProcessing = testOrderProcessing;
window.runComprehensiveTest = runComprehensiveTest;

// Auto-run test if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🔧 Development mode detected. Run window.runComprehensiveTest() to test the stock system.');
        }, 2000);
    });
}