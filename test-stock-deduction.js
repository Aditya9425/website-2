// Simple test for stock deduction

async function testStockDeduction() {
    console.log('🧪 Testing Stock Deduction...');
    
    try {
        // Get a product with stock
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, stock')
            .gt('stock', 0)
            .limit(1);
        
        if (error || !products || products.length === 0) {
            console.error('❌ No products with stock found');
            return false;
        }
        
        const product = products[0];
        console.log(`Testing with: ${product.name} (Stock: ${product.stock})`);
        
        // Test deduction
        const { data: result, error: deductError } = await supabase.rpc('deduct_stock', {
            product_id: product.id,
            quantity_to_deduct: 1
        });
        
        if (deductError || !result) {
            console.error('❌ Stock deduction failed:', deductError);
            return false;
        }
        
        console.log('✅ Stock deduction successful');
        
        // Check new stock
        const { data: updatedProduct } = await supabase
            .from('products')
            .select('stock')
            .eq('id', product.id)
            .single();
        
        console.log(`Stock updated: ${product.stock} → ${updatedProduct.stock}`);
        
        // Restore stock
        await supabase.rpc('restore_stock', {
            product_id: product.id,
            quantity_to_restore: 1
        });
        
        console.log('✅ Stock restored for testing');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Make function globally available
window.testStockDeduction = testStockDeduction;

console.log('🔧 Stock deduction test loaded. Run window.testStockDeduction() to test.');