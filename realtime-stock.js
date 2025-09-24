// Enhanced Real-time stock updates using Supabase
let stockSubscription = null;
let orderSubscription = null;

function initializeRealtimeStock() {
    if (stockSubscription) {
        supabase.removeChannel(stockSubscription);
    }
    if (orderSubscription) {
        supabase.removeChannel(orderSubscription);
    }
    
    // Subscribe to product stock changes
    stockSubscription = supabase
        .channel('products-stock')
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'products' },
            (payload) => handleStockUpdate(payload)
        )
        .subscribe();
    
    // Subscribe to new orders for admin panel
    orderSubscription = supabase
        .channel('orders-realtime')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
            (payload) => handleNewOrder(payload)
        )
        .subscribe();
    
    console.log('✅ Real-time subscriptions initialized');
}

function handleStockUpdate(payload) {
    const updatedProduct = payload.new;
    console.log('🔄 Stock update received:', updatedProduct);
    
    // Update products array if it exists
    if (typeof products !== 'undefined' && Array.isArray(products)) {
        const index = products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
            console.log(`✅ Updated product ${updatedProduct.id} in local array`);
        }
    }
    
    // Refresh product displays on frontend
    if (typeof displayProducts === 'function' && typeof products !== 'undefined') {
        displayProducts(products);
    }
    if (typeof loadFeaturedProducts === 'function') {
        loadFeaturedProducts();
    }
    if (typeof loadTrendingProducts === 'function') {
        loadTrendingProducts();
    }
    
    // Admin panel refresh
    if (typeof window.adminPanel !== 'undefined') {
        if (window.adminPanel.products) {
            const adminIndex = window.adminPanel.products.findIndex(p => p.id === updatedProduct.id);
            if (adminIndex !== -1) {
                window.adminPanel.products[adminIndex] = { ...window.adminPanel.products[adminIndex], ...updatedProduct };
                window.adminPanel.displayProducts(window.adminPanel.products);
                console.log('✅ Admin panel products updated');
            }
        }
        
        // Refresh dashboard stats
        if (window.adminPanel.loadDashboardData) {
            window.adminPanel.loadDashboardData();
        }
    }
    
    // Show notification for out-of-stock items
    if (updatedProduct.status === 'out-of-stock' && typeof showNotification === 'function') {
        showNotification(`${updatedProduct.name} is now out of stock`, 'warning');
    }
}

function handleNewOrder(payload) {
    const newOrder = payload.new;
    console.log('📦 New order received:', newOrder);
    
    // Refresh admin panel if available
    if (typeof window.adminPanel !== 'undefined') {
        // Refresh orders list
        if (window.adminPanel.loadOrders) {
            window.adminPanel.loadOrders();
        }
        
        // Refresh dashboard stats
        if (window.adminPanel.loadDashboardData) {
            window.adminPanel.loadDashboardData();
        }
        
        // Show notification
        if (window.adminPanel.showMessage) {
            window.adminPanel.showMessage(`New order received: #${newOrder.id.toString().slice(-8)}`, 'success');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        initializeRealtimeStock();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (stockSubscription) {
        supabase.removeChannel(stockSubscription);
    }
    if (orderSubscription) {
        supabase.removeChannel(orderSubscription);
    }
});

window.initializeRealtimeStock = initializeRealtimeStock;
window.handleStockUpdate = handleStockUpdate;
window.handleNewOrder = handleNewOrder;