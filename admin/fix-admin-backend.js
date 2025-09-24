// Fix Admin Backend - Remove Flask dependency

// Override loadProducts to work with Supabase only
if (typeof window.adminPanel !== 'undefined') {
    window.adminPanel.loadProducts = async function() {
        try {
            console.log('🔄 Loading products from Supabase...');
            
            const { data, error } = await supabase.from('products').select('*');
            
            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }
            
            console.log('✅ Products loaded from Supabase:', data?.length || 0);
            this.products = data || [];
            this.displayProducts(this.products);
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            this.showMessage(`Error loading products: ${error.message}`, 'error');
            this.products = [];
            this.displayProducts([]);
        }
    };
    
    // Override deleteProduct to work with Supabase only
    window.adminPanel.deleteProduct = async function(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting product:', productId);
            
            const { error } = await supabase.from('products').delete().eq('id', productId);
            
            if (error) {
                throw error;
            }
            
            this.showMessage('Product deleted successfully!', 'success');
            this.loadProducts();
            
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            this.showMessage(`Error deleting product: ${error.message}`, 'error');
        }
    };
    
    console.log('✅ Admin backend fixed - Flask dependency removed');
} else {
    // If adminPanel is not ready yet, wait for it
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof window.adminPanel !== 'undefined') {
                window.adminPanel.loadProducts = async function() {
                    try {
                        console.log('🔄 Loading products from Supabase...');
                        
                        const { data, error } = await supabase.from('products').select('*');
                        
                        if (error) {
                            console.error('❌ Supabase error:', error);
                            throw error;
                        }
                        
                        console.log('✅ Products loaded from Supabase:', data?.length || 0);
                        this.products = data || [];
                        this.displayProducts(this.products);
                        
                    } catch (error) {
                        console.error('❌ Error loading products:', error);
                        this.showMessage(`Error loading products: ${error.message}`, 'error');
                        this.products = [];
                        this.displayProducts([]);
                    }
                };
                
                window.adminPanel.deleteProduct = async function(productId) {
                    if (!confirm('Are you sure you want to delete this product?')) {
                        return;
                    }

                    try {
                        console.log('🗑️ Deleting product:', productId);
                        
                        const { error } = await supabase.from('products').delete().eq('id', productId);
                        
                        if (error) {
                            throw error;
                        }
                        
                        this.showMessage('Product deleted successfully!', 'success');
                        this.loadProducts();
                        
                    } catch (error) {
                        console.error('❌ Error deleting product:', error);
                        this.showMessage(`Error deleting product: ${error.message}`, 'error');
                    }
                };
                
                console.log('✅ Admin backend fixed - Flask dependency removed (delayed)');
            }
        }, 1000);
    });
}