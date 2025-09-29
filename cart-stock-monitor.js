// Real-time cart stock monitoring
let cartStockSubscription = null;

function initializeCartStockMonitor() {
    if (!supabase) return;
    
    // Clean up existing subscription
    if (cartStockSubscription) {
        supabase.removeChannel(cartStockSubscription);
    }
    
    // Subscribe to product stock changes
    cartStockSubscription = supabase
        .channel('cart-stock-monitor')
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'products' },
            handleCartStockUpdate
        )
        .subscribe();
}

function handleCartStockUpdate(payload) {
    const updatedProduct = payload.new;
    
    // Check if this product is in the cart
    const cartItem = cart.find(item => item.id === updatedProduct.id);
    if (!cartItem) return;
    
    // Update cart item status
    cartItem.status = updatedProduct.status;
    cartItem.stock = updatedProduct.stock;
    
    // Save updated cart
    saveCart();
    
    // Update cart display
    updateCartStockStatus(updatedProduct);
    
    // Show notification if item went out of stock
    if (updatedProduct.status === 'out-of-stock') {
        showNotification(`${updatedProduct.name} is no longer available`, 'warning');
    }
}

function updateCartStockStatus(product) {
    // Update cart items display
    const cartItemElements = document.querySelectorAll(`[data-product-id="${product.id}"]`);
    
    cartItemElements.forEach(element => {
        if (product.status === 'out-of-stock') {
            element.classList.add('out-of-stock');
            
            // Add out of stock overlay
            const imageContainer = element.querySelector('.cart-item-image');
            if (imageContainer && !imageContainer.querySelector('.out-of-stock-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'out-of-stock-overlay';
                overlay.textContent = 'Out of Stock';
                imageContainer.style.position = 'relative';
                imageContainer.appendChild(overlay);
            }
            
            // Add out of stock message
            const infoContainer = element.querySelector('.cart-item-info');
            if (infoContainer && !infoContainer.querySelector('.out-of-stock-message')) {
                const message = document.createElement('div');
                message.className = 'out-of-stock-message';
                message.innerHTML = '<i class="fas fa-exclamation-triangle"></i> This product is no longer available';
                infoContainer.appendChild(message);
            }
        } else {
            element.classList.remove('out-of-stock');
            
            // Remove out of stock elements
            const overlay = element.querySelector('.out-of-stock-overlay');
            const message = element.querySelector('.out-of-stock-message');
            if (overlay) overlay.remove();
            if (message) message.remove();
        }
    });
    
    // Update checkout button state
    updateCheckoutButtonState();
    
    // Refresh cart display
    if (typeof displayCartItems === 'function') {
        displayCartItems();
    }
}

function updateCheckoutButtonState() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;
    
    // Check if any cart items are out of stock
    const hasOutOfStockItems = cart.some(item => item.status === 'out-of-stock');
    
    if (hasOutOfStockItems || cart.length === 0) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = hasOutOfStockItems ? 
            '<i class="fas fa-exclamation-triangle"></i> Remove unavailable items to checkout' :
            '<i class="fas fa-credit-card"></i> Proceed to Checkout';
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Checkout';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('cart.html')) {
        initializeCartStockMonitor();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (cartStockSubscription) {
        supabase.removeChannel(cartStockSubscription);
    }
});

// Make functions globally available
window.initializeCartStockMonitor = initializeCartStockMonitor;
window.updateCartStockStatus = updateCartStockStatus;