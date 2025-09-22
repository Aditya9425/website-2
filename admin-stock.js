// Admin Panel Stock Management

// Update stock from admin panel
async function updateProductStock(productId, newStock) {
    try {
        const { data, error } = await supabase.rpc('update_stock', {
            product_id: productId,
            new_stock: newStock
        });
        
        if (error) {
            console.error('Stock update error:', error);
            return false;
        }
        
        return data?.success || false;
    } catch (error) {
        console.error('Stock update failed:', error);
        return false;
    }
}

// Get all products with stock info for admin
async function getProductsWithStock() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, stock, price')
            .order('id');
        
        return error ? [] : data;
    } catch {
        return [];
    }
}

// Setup admin stock table
async function setupAdminStockTable() {
    const products = await getProductsWithStock();
    const tableBody = document.getElementById('stockTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = products.map(product => `
        <tr data-product-id="${product.id}" ${product.stock <= 0 ? 'class="out-of-stock"' : ''}>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td class="stock-cell">${product.stock}</td>
            <td>₹${product.price.toLocaleString()}</td>
            <td>
                <input type="number" min="0" value="${product.stock}" 
                       onchange="updateStock(${product.id}, this.value)">
            </td>
        </tr>
    `).join('');
}

// Update stock from admin input
async function updateStock(productId, newStock) {
    const success = await updateProductStock(productId, parseInt(newStock));
    
    if (success) {
        // Update table row
        const row = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (row) {
            const stockCell = row.querySelector('.stock-cell');
            stockCell.textContent = newStock;
            
            // Update row styling
            if (newStock <= 0) {
                row.classList.add('out-of-stock');
            } else {
                row.classList.remove('out-of-stock');
            }
        }
        
        alert('Stock updated successfully!');
    } else {
        alert('Failed to update stock. Please try again.');
    }
}

// Setup realtime updates for admin
function setupAdminRealtime() {
    supabase
        .channel('admin-stock-updates')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'products'
        }, (payload) => {
            const { id, stock } = payload.new;
            const row = document.querySelector(`tr[data-product-id="${id}"]`);
            
            if (row) {
                const stockCell = row.querySelector('.stock-cell');
                const input = row.querySelector('input');
                
                stockCell.textContent = stock;
                input.value = stock;
                
                if (stock <= 0) {
                    row.classList.add('out-of-stock');
                } else {
                    row.classList.remove('out-of-stock');
                }
            }
        })
        .subscribe();
}

// Initialize admin stock management
function initAdminStock() {
    setupAdminStockTable();
    setupAdminRealtime();
}

// Make functions global
window.updateStock = updateStock;
window.initAdminStock = initAdminStock;