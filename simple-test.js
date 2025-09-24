// Simple Test - Test stock update without SQL functions

window.testStockUpdate = async function() {
    console.log('🧪 Testing direct stock update...');
    
    try {
        // Get a product to test with
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, stock')
            .gt('stock', 0)
            .limit(1);
        
        if (error || !products || products.length === 0) {
            console.log('❌ No products available for testing');
            return false;
        }
        
        const testProduct = products[0];
        console.log(`Testing with product: ${testProduct.name} (ID: ${testProduct.id}, Stock: ${testProduct.stock})`);
        
        // Test stock reduction
        const originalStock = testProduct.stock;
        const testQuantity = 1;
        const newStock = originalStock - testQuantity;
        
        console.log(`Reducing stock by ${testQuantity}: ${originalStock} → ${newStock}`);
        
        const { error: updateError } = await supabase
            .from('products')
            .update({ 
                stock: newStock,
                status: newStock <= 0 ? 'out-of-stock' : 'active'
            })
            .eq('id', testProduct.id);
        
        if (updateError) {
            console.error('❌ Stock update failed:', updateError);
            return false;
        }
        
        console.log('✅ Stock updated successfully');
        
        // Trigger admin refresh
        localStorage.setItem('adminRefreshTrigger', JSON.stringify({
            timestamp: Date.now(),
            orderId: 'test_' + Date.now(),
            type: 'STOCK_TEST'
        }));
        
        console.log('✅ Admin refresh trigger sent');
        
        // Restore original stock
        setTimeout(async () => {
            console.log('🔄 Restoring original stock...');
            await supabase
                .from('products')
                .update({ 
                    stock: originalStock,
                    status: 'active'
                })
                .eq('id', testProduct.id);
            console.log('✅ Stock restored');
        }, 3000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
};

// Auto-run test on admin page
if (window.location.pathname.includes('admin')) {
    setTimeout(() => {
        console.log('🧪 Auto-running stock update test...');
        window.testStockUpdate();
    }, 5000);
}

console.log('✅ Simple test loaded - Use testStockUpdate() to test');