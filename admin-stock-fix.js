// Fix for admin panel stock issues
// Add this to your admin panel to ensure stock is saved correctly

// Override any stock functions that might be called during product save
window.deduct_stock = function() { return true; };
window.updateProductStock = function() { return true; };
window.updateOrderStock = function() { return true; };

// Ensure product data includes proper stock and status
function ensureProductData(productData) {
    // Make sure stock is a number
    if (productData.stock === undefined || productData.stock === null) {
        productData.stock = 0;
    } else {
        productData.stock = parseInt(productData.stock) || 0;
    }
    
    // Set status based on stock
    if (productData.stock > 0) {
        productData.status = 'active';
    } else {
        productData.status = 'out-of-stock';
    }
    
    return productData;
}

// Make function globally available
window.ensureProductData = ensureProductData;