// Stock Management System
class StockManager {
    constructor() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.initializeStockUpdates();
    }

    // Check stock for a product
    async checkStock(productId) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();
            
            if (error) throw error;
            return data?.stock || 0;
        } catch (error) {
            console.error('Error checking stock:', error);
            return 0;
        }
    }

    // Deduct stock after successful order
    async deductStock(productId, quantity) {
        try {
            const { data, error } = await this.supabase.rpc('deduct_stock', {
                product_id: productId,
                quantity_to_deduct: quantity
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error deducting stock:', error);
            throw error;
        }
    }

    // Update UI based on stock status
    updateProductUI(productId, stock) {
        const productCards = document.querySelectorAll(`[data-product-id="${productId}"]`);
        
        productCards.forEach(card => {
            const addToCartBtn = card.querySelector('.add-to-cart, .add-to-cart-btn');
            const buyNowBtn = card.querySelector('.buy-now-btn');
            
            if (stock <= 0) {
                // Out of stock
                if (addToCartBtn) {
                    addToCartBtn.disabled = true;
                    addToCartBtn.textContent = 'Out of Stock';
                    addToCartBtn.style.backgroundColor = '#ccc';
                }
                if (buyNowBtn) {
                    buyNowBtn.disabled = true;
                    buyNowBtn.textContent = 'Out of Stock';
                    buyNowBtn.style.backgroundColor = '#ccc';
                }
                
                // Add out of stock badge
                if (!card.querySelector('.stock-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'stock-badge out-of-stock';
                    badge.textContent = 'Out of Stock';
                    badge.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #dc3545;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        z-index: 2;
                    `;
                    card.style.position = 'relative';
                    card.appendChild(badge);
                }
            } else {
                // In stock
                if (addToCartBtn) {
                    addToCartBtn.disabled = false;
                    addToCartBtn.textContent = 'Add to Cart';
                    addToCartBtn.style.backgroundColor = '';
                }
                if (buyNowBtn) {
                    buyNowBtn.disabled = false;
                    buyNowBtn.textContent = 'Buy Now';
                    buyNowBtn.style.backgroundColor = '';
                }
                
                // Remove out of stock badge
                const badge = card.querySelector('.stock-badge');
                if (badge) badge.remove();
            }
        });
    }

    // Initialize real-time stock updates
    initializeStockUpdates() {
        this.supabase
            .channel('stock-updates')
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'products' },
                (payload) => {
                    const { id, stock } = payload.new;
                    this.updateProductUI(id, stock);
                }
            )
            .subscribe();
    }

    // Load and apply stock status for all products
    async loadStockStatus() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('id, stock');
            
            if (error) throw error;
            
            data.forEach(product => {
                this.updateProductUI(product.id, product.stock);
            });
        } catch (error) {
            console.error('Error loading stock status:', error);
        }
    }
}

// Initialize stock manager
const stockManager = new StockManager();

// Hook into existing order processing
const originalProcessOrder = window.processOrder;
window.processOrder = async function(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    try {
        // Process order first
        const order = await originalProcessOrder(total, paymentMethod, orderItems, isBuyNow, paymentId);
        
        if (order && order.items) {
            // Deduct stock for each item
            for (const item of order.items) {
                try {
                    await stockManager.deductStock(item.id, item.quantity);
                } catch (error) {
                    console.error(`Failed to deduct stock for product ${item.id}:`, error);
                }
            }
        }
        
        return order;
    } catch (error) {
        console.error('Error in enhanced processOrder:', error);
        throw error;
    }
};

// Load stock status when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        stockManager.loadStockStatus();
    }, 1000);
});