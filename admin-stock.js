// Admin Stock Management

// Update stock from admin
async function updateProductStock(productId, newStock) {
    try {
        const { data } = await supabase.rpc('update_stock', {
            product_id: productId,
            new_stock: newStock
        });
        return data?.success || false;
    } catch {
        return false;
    }
}

// Get products with stock
async function getProductsWithStock() {
    try {
        const { data } = await supabase.from('products').select('id, name, stock, price').order('id');
        return data || [];
    } catch {
        return [];
    }
}

// Setup admin table
async function setupAdminStockTable() {
    const products = await getProductsWithStock();
    const tableBody = document.getElementById('stockTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = products.map(p => `
        <tr data-product-id="${p.id}" ${p.stock <= 0 ? 'style="background:#ffe6e6;color:#dc3545;"' : ''}>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td><strong>${p.stock}</strong></td>
            <td>₹${p.price.toLocaleString()}</td>
            <td>
                <input type="number" min="0" value="${p.stock}" 
                       onchange="updateStock(${p.id}, this.value)" 
                       style="width:80px;padding:5px;border:1px solid #ddd;border-radius:4px;">
            </td>
        </tr>
    `).join('');
}

// Update stock from admin
async function updateStock(productId, newStock) {
    const success = await updateProductStock(productId, parseInt(newStock));
    
    if (success) {
        const row = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (row) {
            row.children[2].innerHTML = `<strong>${newStock}</strong>`;
            
            if (newStock <= 0) {
                row.style.cssText = 'background:#ffe6e6;color:#dc3545;';
            } else {
                row.style.cssText = '';
            }
        }
        alert('Stock updated successfully!');
    } else {
        alert('Failed to update stock.');
    }
}

// Setup realtime for admin
function setupAdminRealtime() {
    supabase.channel('admin-stock').on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'products'
    }, payload => {
        const { id, stock } = payload.new;
        const row = document.querySelector(`tr[data-product-id="${id}"]`);
        
        if (row) {
            row.children[2].innerHTML = `<strong>${stock}</strong>`;
            row.querySelector('input').value = stock;
            
            if (stock <= 0) {
                row.style.cssText = 'background:#ffe6e6;color:#dc3545;';
            } else {
                row.style.cssText = '';
            }
        }
    }).subscribe();
}

// Initialize admin
function initAdminStock() {
    setupAdminStockTable();
    setupAdminRealtime();
}

window.updateStock = updateStock;
window.initAdminStock = initAdminStock;