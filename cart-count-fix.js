// Cart Count Fix - Ensures cart count displays correctly

// Enhanced cart count update function
function updateCartCount() {
    // Refresh cart from localStorage first
    refreshCart();
    
    // Calculate total count
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update all cart count elements
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        if (el) {
            el.textContent = count;
            // Add visual feedback
            el.style.animation = 'bounce 0.5s ease-out';
            setTimeout(() => {
                el.style.animation = '';
            }, 500);
        }
    });
    
    console.log('Cart count updated:', count);
}

// Enhanced refresh cart function
function refreshCart() {
    const storedCart = localStorage.getItem('cart');
    
    if (storedCart) {
        try {
            cart = JSON.parse(storedCart);
            // Ensure cart is an array
            if (!Array.isArray(cart)) {
                cart = [];
            }
        } catch (error) {
            console.error('Error parsing cart from localStorage:', error);
            cart = [];
        }
    } else {
        cart = [];
    }
}

// Enhanced add to cart function
function addToCart(button) {
    const productId = button.getAttribute('data-id');
    console.log('🛒 Adding to cart - productId:', productId);
    
    const product = products.find(p => p.id.toString() === productId);
    console.log('🛒 Found product:', product);
    
    if (product) {
        // Refresh cart first
        refreshCart();
        
        const existingItem = cart.find(item => item.id.toString() === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        // Save and update immediately
        saveCart();
        updateCartCount();
        showNotification('Added to cart!');
        
        console.log('Cart after adding:', cart);
    } else {
        console.error('❌ Product not found for ID:', productId);
    }
}

// Initialize cart count on page load
function initializeCartCount() {
    // Refresh cart and update count immediately
    refreshCart();
    updateCartCount();
    
    console.log('Cart initialized with count:', cart.reduce((sum, item) => sum + item.quantity, 0));
}

// Override the existing functions
window.updateCartCount = updateCartCount;
window.refreshCart = refreshCart;
window.addToCart = addToCart;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartCount);
} else {
    initializeCartCount();
}