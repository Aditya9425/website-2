// Real-time Cart Stock Monitoring
let stockSubscription = null;

// Initialize real-time stock monitoring for cart items
function initializeCartStockMonitoring() {
    if (!cart || cart.length === 0) return;
    
    // Get all product IDs in cart
    const cartProductIds = cart.map(item => item.id);
    
    // Subscribe to stock changes for cart products
    stockSubscription = supabase
        .channel('cart-stock-updates')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'products',
            filter: `id=in.(${cartProductIds.join(',')})`
        }, handleStockUpdate)
        .subscribe();
}

// Handle stock update from real-time subscription
function handleStockUpdate(payload) {
    const updatedProduct = payload.new;
    const cartItem = cart.find(item => item.id === updatedProduct.id);
    
    if (!cartItem) return;
    
    // Check if product went out of stock
    if (updatedProduct.status === 'out-of-stock' || updatedProduct.stock === 0) {
        // Update cart item status
        cartItem.status = 'out-of-stock';
        cartItem.stock = 0;
        
        // Save updated cart
        saveCart();
        
        // Update cart display
        displayCartItems();
        
        // Show notification
        showNotification(`${cartItem.name} is now out of stock and has been updated in your cart.`, 'warning');
        
        // Update checkout button state
        updateCheckoutButtonState();
    }
}

// Update checkout button state based on cart items
function updateCheckoutButtonState() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;
    
    const hasOutOfStockItems = cart.some(item => item.status === 'out-of-stock' || item.stock === 0);
    
    if (hasOutOfStockItems) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Remove out-of-stock items to checkout';
        checkoutBtn.style.background = '#dc3545';
    } else {
        checkoutBtn.disabled = cart.length === 0;
        checkoutBtn.textContent = 'Proceed to Checkout';
        checkoutBtn.style.background = '';
    }
}

// Enhanced displayCartItems function with out-of-stock handling
function displayCartItemsWithStock() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const cartItemCount = document.getElementById('cartItemCount');
    
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        cartItemsList.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartItemCount) cartItemCount.textContent = '0';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    cartItemsList.style.display = 'block';
    
    if (cartItemCount) cartItemCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartItemsList.innerHTML = cart.map(item => {
        let imageUrl;
        if (item.image && item.image.startsWith('http')) {
            imageUrl = item.image;
        } else if (item.image) {
            imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${item.image}`;
        } else {
            imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(item.name || 'Product')}`;
        }
        
        const isOutOfStock = item.status === 'out-of-stock' || item.stock === 0;
        
        return `
        <div class="cart-item ${isOutOfStock ? 'out-of-stock-item' : ''}">
            <div class="cart-item-top">
                <img src="${imageUrl}" alt="${item.name}" class="cart-item-image ${isOutOfStock ? 'grayscale' : ''}">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">Quantity: ${item.quantity}</div>
                    ${isOutOfStock ? '<div class="out-of-stock-message">This product is no longer available</div>' : ''}
                </div>
            </div>
            <div class="cart-item-controls">
                <button class="remove-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="cart-item-total ${isOutOfStock ? 'disabled' : ''}">₹${(item.price * item.quantity).toLocaleString()}</div>
        </div>
        `;
    }).join('');
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            removeFromCart(productId);
        });
    });
    
    updateOrderSummary();
    updateCheckoutButtonState();
}

// Cleanup subscription when leaving cart page
function cleanupStockSubscription() {
    if (stockSubscription) {
        supabase.removeChannel(stockSubscription);
        stockSubscription = null;
    }
}

// Initialize monitoring when cart page loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('cart.html')) {
        initializeCartStockMonitoring();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupStockSubscription);