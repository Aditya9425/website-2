// Stock Management Module - Minimal Implementation

// Check product stock from Supabase
async function checkStock(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();
        return error ? 0 : (data?.stock || 0);
    } catch {
        return 0;
    }
}

// Deduct stock on purchase
async function deductStock(productId) {
    try {
        const { data, error } = await supabase.rpc('deduct_stock', { product_id: productId });
        if (!error && data) {
            updateStockUI(productId, data.new_stock);
        }
        return !error;
    } catch {
        return false;
    }
}

// Update stock UI elements
function updateStockUI(productId, stock) {
    const isOutOfStock = stock <= 0;
    
    // Update all product cards with this ID
    document.querySelectorAll(`[data-product-id="${productId}"]`).forEach(card => {
        const buyBtn = card.querySelector('.buy-now-btn, .btn-buy-now');
        const addBtn = card.querySelector('.add-to-cart-btn, .btn-add-cart');
        
        if (isOutOfStock) {
            // Add out of stock badge
            if (!card.querySelector('.stock-badge')) {
                const badge = document.createElement('div');
                badge.className = 'stock-badge';
                badge.textContent = 'Out of Stock';
                badge.style.cssText = 'position:absolute;top:10px;right:10px;background:#dc3545;color:white;padding:4px 8px;border-radius:4px;font-size:12px;z-index:2;';
                const imgContainer = card.querySelector('.product-image, .featured-image') || card;
                if (imgContainer.style.position !== 'relative') imgContainer.style.position = 'relative';
                imgContainer.appendChild(badge);
            }
            
            // Disable buttons
            if (buyBtn) {
                buyBtn.disabled = true;
                buyBtn.textContent = 'Out of Stock';
                buyBtn.style.backgroundColor = '#6c757d';
                buyBtn.style.cursor = 'not-allowed';
            }
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.textContent = 'Out of Stock';
                addBtn.style.backgroundColor = '#6c757d';
                addBtn.style.cursor = 'not-allowed';
            }
        } else {
            // Remove out of stock badge
            const badge = card.querySelector('.stock-badge');
            if (badge) badge.remove();
            
            // Enable buttons
            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.textContent = 'Buy Now';
                buyBtn.style.backgroundColor = '';
                buyBtn.style.cursor = '';
            }
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.textContent = 'Add to Cart';
                addBtn.style.backgroundColor = '';
                addBtn.style.cursor = '';
            }
        }
    });
}

// Setup realtime stock updates
function setupStockRealtime() {
    if (typeof supabase === 'undefined') return;
    
    supabase
        .channel('stock-updates')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'products'
        }, (payload) => {
            if (payload.new.stock !== undefined) {
                updateStockUI(payload.new.id, payload.new.stock);
            }
        })
        .subscribe();
}

// Initialize stock management
function initStockManager() {
    setupStockRealtime();
    
    // Check stock for all visible products
    document.querySelectorAll('[data-product-id]').forEach(async (card) => {
        const productId = card.dataset.productId;
        if (productId) {
            const stock = await checkStock(productId);
            updateStockUI(productId, stock);
        }
    });
}

// Override existing buyNow function to include stock deduction
const originalBuyNow = window.buyNow;
window.buyNow = async function(productId) {
    const stock = await checkStock(productId);
    if (stock <= 0) {
        alert('Sorry, this product is out of stock!');
        return;
    }
    
    // Proceed with original buy now logic
    if (originalBuyNow) {
        const result = await originalBuyNow(productId);
        // Deduct stock after successful purchase
        if (result !== false) {
            await deductStock(productId);
        }
        return result;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStockManager);
} else {
    initStockManager();
}