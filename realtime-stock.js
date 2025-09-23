// Real-time stock updates using Supabase
let stockSubscription = null;

function initializeRealtimeStock() {
    if (stockSubscription) {
        supabase.removeChannel(stockSubscription);
    }
    
    stockSubscription = supabase
        .channel('products-stock')
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'products' },
            (payload) => handleStockUpdate(payload)
        )
        .subscribe();
}

function handleStockUpdate(payload) {
    const updatedProduct = payload.new;
    
    // Update products array if it exists
    if (typeof products !== 'undefined' && Array.isArray(products)) {
        const index = products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
        }
    }
    
    // Refresh product displays
    if (typeof displayProducts === 'function') {
        displayProducts(products);
    }
    if (typeof loadFeaturedProducts === 'function') {
        loadFeaturedProducts();
    }
    
    // Admin panel refresh
    if (typeof window.adminPanel !== 'undefined' && window.adminPanel.displayProducts) {
        window.adminPanel.displayProducts(window.adminPanel.products);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        initializeRealtimeStock();
    }
});

window.initializeRealtimeStock = initializeRealtimeStock;