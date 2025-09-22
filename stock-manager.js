// Stock Management - Minimal Implementation

// Check stock from Supabase
async function checkStock(productId) {
    try {
        const { data } = await supabase.from('products').select('stock').eq('id', productId).single();
        return data?.stock || 0;
    } catch { return 0; }
}

// Deduct stock after successful order
async function deductStock(productId) {
    try {
        const { data } = await supabase.rpc('deduct_stock', { product_id: productId });
        if (data?.success) {
            updateStockUI(productId, data.new_stock);
            return true;
        }
    } catch {}
    return false;
}

// Update UI based on stock
function updateStockUI(productId, stock) {
    document.querySelectorAll(`[data-product-id="${productId}"]`).forEach(card => {
        const buyBtn = card.querySelector('.buy-now-btn, .btn-buy-now, #buyNowBtn');
        const addBtn = card.querySelector('.add-to-cart-btn, .btn-add-cart, #addToCartBtn');
        const badge = card.querySelector('.stock-badge');
        
        if (stock <= 0) {
            // Add out of stock badge
            if (!badge) {
                const newBadge = document.createElement('div');
                newBadge.className = 'stock-badge';
                newBadge.textContent = 'Out of Stock';
                newBadge.style.cssText = 'position:absolute;top:8px;right:8px;background:#dc3545;color:white;padding:3px 6px;border-radius:3px;font-size:11px;z-index:10;font-weight:bold;';
                
                const container = card.querySelector('.product-image, .featured-image, .main-image-container') || card;
                container.style.position = 'relative';
                container.appendChild(newBadge);
            }
            
            // Disable buttons
            [buyBtn, addBtn].forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Out of Stock';
                    btn.style.cssText += 'background:#6c757d!important;cursor:not-allowed!important;';
                }
            });
        } else {
            // Remove badge and enable buttons
            if (badge) badge.remove();
            
            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.innerHTML = '<i class="fas fa-bolt"></i> Buy Now';
                buyBtn.style.cssText = buyBtn.style.cssText.replace(/background:[^;]*;?/g, '').replace(/cursor:[^;]*;?/g, '');
            }
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                addBtn.style.cssText = addBtn.style.cssText.replace(/background:[^;]*;?/g, '').replace(/cursor:[^;]*;?/g, '');
            }
        }
    });
}

// Setup realtime updates
function setupStockRealtime() {
    if (typeof supabase === 'undefined') return;
    
    supabase.channel('stock-channel')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, 
            payload => updateStockUI(payload.new.id, payload.new.stock))
        .subscribe();
}

// Hook into existing processOrder function
const originalProcessOrder = window.processOrder;
if (originalProcessOrder) {
    window.processOrder = async function(...args) {
        const result = await originalProcessOrder.apply(this, args);
        
        // If order successful, deduct stock for each item
        if (result && result.id) {
            const orderItems = args[2] || (args[4] ? [JSON.parse(localStorage.getItem('buyNowItem'))] : JSON.parse(localStorage.getItem('cart') || '[]'));
            
            for (const item of orderItems || []) {
                if (item.id) {
                    await deductStock(item.id);
                }
            }
        }
        
        return result;
    };
}

// Pre-checkout stock validation
const originalHandlePlaceOrderWithPayment = window.handlePlaceOrderWithPayment;
if (originalHandlePlaceOrderWithPayment) {
    window.handlePlaceOrderWithPayment = async function(isBuyNow) {
        // Check stock before proceeding
        const items = isBuyNow ? [JSON.parse(localStorage.getItem('buyNowItem') || '{}')] : JSON.parse(localStorage.getItem('cart') || '[]');
        
        for (const item of items) {
            if (item.id) {
                const stock = await checkStock(item.id);
                if (stock <= 0) {
                    alert(`${item.name || 'This product'} is currently out of stock.`);
                    return false;
                }
            }
        }
        
        return originalHandlePlaceOrderWithPayment.call(this, isBuyNow);
    };
}

// Initialize
function initStock() {
    setupStockRealtime();
    
    // Check initial stock for visible products
    setTimeout(() => {
        document.querySelectorAll('[data-product-id]').forEach(async card => {
            const id = card.dataset.productId;
            if (id) updateStockUI(id, await checkStock(id));
        });
    }, 1000);
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStock);
} else {
    initStock();
}

// Make functions global
window.checkStock = checkStock;
window.deductStock = deductStock;
window.updateStockUI = updateStockUI;