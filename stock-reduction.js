// Enhanced Stock Reduction System
// This file handles real-time stock updates and frontend refresh

// Refresh products after order completion
async function refreshProductsAfterOrder(orderItems) {
    try {
        console.log('🔄 Refreshing products after order...');
        
        // Fetch updated products from database
        const { data, error } = await supabase
            .from('products')
            .select('*');
        
        if (error) {
            console.error('❌ Error fetching updated products:', error);
            return;
        }
        
        // Update global products array
        if (typeof products !== 'undefined') {
            products = data || [];
            console.log('✅ Products array updated with latest stock');
        }
        
        // Refresh all product displays on current page
        refreshAllProductDisplays();
        
        // Update out-of-stock indicators
        updateOutOfStockIndicators(orderItems);
        
    } catch (error) {
        console.error('❌ Error refreshing products:', error);
    }
}

// Refresh all product displays on the current page
function refreshAllProductDisplays() {
    try {
        // Refresh featured products if on home page
        if (typeof loadFeaturedProducts === 'function') {
            loadFeaturedProducts();
        }
        
        // Refresh trending products if on home page
        if (typeof loadTrendingProducts === 'function') {
            loadTrendingProducts();
        }
        
        // Refresh products grid if on collections page
        if (typeof displayProducts === 'function' && typeof products !== 'undefined') {
            displayProducts(products);
        }
        
        console.log('✅ All product displays refreshed');
    } catch (error) {
        console.error('❌ Error refreshing product displays:', error);
    }
}

// Update out-of-stock indicators for specific products
function updateOutOfStockIndicators(orderItems) {
    try {
        orderItems.forEach(item => {
            // Find the updated product
            const updatedProduct = products.find(p => p.id == item.id);
            if (!updatedProduct) return;
            
            // Update all product cards for this product
            const productCards = document.querySelectorAll(`[data-product-id="${item.id}"]`);
            productCards.forEach(card => {
                updateProductCardStock(card, updatedProduct);
            });
        });
        
        console.log('✅ Out-of-stock indicators updated');
    } catch (error) {
        console.error('❌ Error updating out-of-stock indicators:', error);
    }
}

// Update individual product card stock status
function updateProductCardStock(card, product) {
    const isOutOfStock = product.stock === 0 || product.status === 'out-of-stock';
    const isLowStock = product.stock > 0 && product.stock <= 5;
    
    // Update card status
    card.dataset.status = isOutOfStock ? 'out-of-stock' : 'active';
    
    // Add/remove out-of-stock overlay
    let overlay = card.querySelector('.out-of-stock-overlay');
    if (isOutOfStock && !overlay) {
        const imageContainer = card.querySelector('.product-image-container');
        if (imageContainer) {
            overlay = document.createElement('div');
            overlay.className = 'out-of-stock-overlay';
            overlay.textContent = 'Out of Stock';
            imageContainer.appendChild(overlay);
        }
    } else if (!isOutOfStock && overlay) {
        overlay.remove();
    }
    
    // Update action buttons
    const actionButtons = card.querySelector('.action-buttons');
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    const buyNowBtn = card.querySelector('.buy-now-btn');
    
    if (isOutOfStock) {
        // Replace buttons with out-of-stock label
        if (actionButtons) {
            actionButtons.innerHTML = '<div class="out-of-stock-label">Out of Stock</div>';
        }
        if (addToCartBtn) addToCartBtn.style.display = 'none';
        if (buyNowBtn) buyNowBtn.style.display = 'none';
    } else {
        // Ensure buttons are visible and functional
        if (addToCartBtn) {
            addToCartBtn.style.display = 'block';
            addToCartBtn.disabled = false;
        }
        if (buyNowBtn) {
            buyNowBtn.style.display = 'block';
            buyNowBtn.disabled = false;
        }
    }
    
    // Add low stock indicator
    let lowStockIndicator = card.querySelector('.low-stock-indicator');
    if (isLowStock && !lowStockIndicator) {
        const productInfo = card.querySelector('.product-info');
        if (productInfo) {
            lowStockIndicator = document.createElement('div');
            lowStockIndicator.className = 'low-stock-indicator';
            lowStockIndicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Only ${product.stock} left!`;
            productInfo.appendChild(lowStockIndicator);
        }
    } else if (!isLowStock && lowStockIndicator) {
        lowStockIndicator.remove();
    }
}

// Check stock before adding to cart
async function checkStockBeforeAddToCart(productId, quantity = 1) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('stock, status, name')
            .eq('id', productId)
            .single();
        
        if (error || !data) {
            throw new Error('Product not found');
        }
        
        if (data.status === 'out-of-stock' || data.stock === 0) {
            showNotification(`${data.name} is out of stock`, 'warning');
            return false;
        }
        
        if (data.stock < quantity) {
            showNotification(`Only ${data.stock} units available for ${data.name}`, 'warning');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking stock:', error);
        showNotification('Unable to check stock availability', 'error');
        return false;
    }
}

// Enhanced add to cart with stock validation
async function addToCartWithStockCheck(button) {
    const productId = button.getAttribute('data-id');
    const product = products.find(p => p.id.toString() === productId);
    
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }
    
    // Check current stock
    const stockAvailable = await checkStockBeforeAddToCart(productId, 1);
    if (!stockAvailable) {
        return;
    }
    
    // Check if item already in cart
    const existingItem = cart.find(item => item.id.toString() === productId);
    const requestedQuantity = existingItem ? existingItem.quantity + 1 : 1;
    
    // Validate total quantity
    const finalStockCheck = await checkStockBeforeAddToCart(productId, requestedQuantity);
    if (!finalStockCheck) {
        return;
    }
    
    // Add to cart
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartCount();
    showNotification('Added to cart!', 'success');
}

// Real-time stock monitoring
function initializeStockMonitoring() {
    // Subscribe to product changes
    const stockChannel = supabase
        .channel('stock-changes')
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'products' },
            (payload) => {
                console.log('📦 Stock update received:', payload);
                handleRealTimeStockUpdate(payload.new);
            }
        )
        .subscribe();
    
    console.log('✅ Stock monitoring initialized');
    return stockChannel;
}

// Handle real-time stock updates
function handleRealTimeStockUpdate(updatedProduct) {
    // Update products array
    if (typeof products !== 'undefined') {
        const index = products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
        }
    }
    
    // Update UI
    const productCards = document.querySelectorAll(`[data-product-id="${updatedProduct.id}"]`);
    productCards.forEach(card => {
        updateProductCardStock(card, updatedProduct);
    });
    
    // Show notification if product went out of stock
    if (updatedProduct.status === 'out-of-stock' || updatedProduct.stock === 0) {
        showNotification(`${updatedProduct.name} is now out of stock`, 'info');
    }
}

// Initialize stock monitoring when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        initializeStockMonitoring();
    }
});

// Make functions globally available
window.refreshProductsAfterOrder = refreshProductsAfterOrder;
window.checkStockBeforeAddToCart = checkStockBeforeAddToCart;
window.addToCartWithStockCheck = addToCartWithStockCheck;
window.updateProductCardStock = updateProductCardStock;