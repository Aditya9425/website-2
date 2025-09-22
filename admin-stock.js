// Admin Stock Management
class AdminStockManager {
    constructor() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.loadProducts();
        this.setupRealTimeUpdates();
    }

    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('id, name, stock, price')
                .order('name');
            
            if (error) throw error;
            this.displayProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    displayProducts(products) {
        const container = document.getElementById('stockTable');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>₹${product.price.toLocaleString()}</td>
                <td class="stock-cell ${product.stock <= 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : ''}">
                    ${product.stock}
                </td>
                <td>
                    <input type="number" min="0" value="${product.stock}" 
                           id="stock-${product.id}" class="stock-input">
                    <button onclick="adminStock.updateStock(${product.id})" class="update-btn">
                        Update
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async updateStock(productId) {
        const input = document.getElementById(`stock-${productId}`);
        const newStock = parseInt(input.value);
        
        if (isNaN(newStock) || newStock < 0) {
            alert('Please enter a valid stock quantity');
            return;
        }

        try {
            const { error } = await this.supabase.rpc('update_stock', {
                product_id: productId,
                new_stock: newStock
            });
            
            if (error) throw error;
            
            showNotification('Stock updated successfully!', 'success');
            this.loadProducts(); // Refresh the table
        } catch (error) {
            console.error('Error updating stock:', error);
            showNotification('Failed to update stock', 'error');
        }
    }

    setupRealTimeUpdates() {
        this.supabase
            .channel('admin-stock-updates')
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'products' },
                () => {
                    this.loadProducts(); // Refresh when stock changes
                }
            )
            .subscribe();
    }
}

// Initialize admin stock manager
const adminStock = new AdminStockManager();