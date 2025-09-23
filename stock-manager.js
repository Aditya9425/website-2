// Stock Management Functions
async function checkProductStock(productId, requiredQuantity) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();
        
        if (error || !data) return false;
        return data.stock >= requiredQuantity;
    } catch (error) {
        return false;
    }
}

async function validateOrderStock(orderItems) {
    for (const item of orderItems) {
        const { data, error } = await supabase
            .from('products')
            .select('stock, status')
            .eq('id', item.id)
            .single();
        
        if (error || !data) {
            return { valid: false, productName: item.name, reason: 'Product not found' };
        }
        
        if (data.status === 'out-of-stock') {
            return { valid: false, productName: item.name, reason: 'Product is out of stock' };
        }
        
        if (data.stock < item.quantity) {
            return { valid: false, productName: item.name, reason: `Only ${data.stock} items available` };
        }
    }
    return { valid: true };
}

async function updateProductStock(productId, quantityOrdered) {
    try {
        console.log(`Updating stock for product ${productId}, quantity: ${quantityOrdered}`);
        const { data, error } = await supabase.rpc('deduct_stock', {
            product_id: parseInt(productId),
            quantity_to_deduct: parseInt(quantityOrdered)
        });
        
        if (error) {
            console.error('Stock update error:', error);
            return false;
        }
        
        console.log(`Stock update result for product ${productId}:`, data);
        return data;
    } catch (error) {
        console.error('Stock update failed:', error);
        return false;
    }
}

// Update stock for all items in an order
async function updateOrderStock(orderItems) {
    const stockUpdates = [];
    
    for (const item of orderItems) {
        const success = await updateProductStock(item.id, item.quantity);
        stockUpdates.push({
            productId: item.id,
            quantity: item.quantity,
            success: success
        });
        
        if (!success) {
            console.warn(`Failed to update stock for product ${item.id}`);
        }
    }
    
    return stockUpdates;
}

// Make functions globally available
window.checkProductStock = checkProductStock;
window.validateOrderStock = validateOrderStock;
window.updateProductStock = updateProductStock;
window.updateOrderStock = updateOrderStock;