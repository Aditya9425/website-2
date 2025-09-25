// Enhanced Stock Management Functions with Atomic Operations

// Check if product has sufficient stock
async function checkProductStock(productId, requiredQuantity) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('stock, status')
            .eq('id', productId)
            .single();
        
        if (error || !data) return false;
        if (data.status === 'out-of-stock') return false;
        return data.stock >= requiredQuantity;
    } catch (error) {
        console.error('Error checking stock:', error);
        return false;
    }
}

// Validate stock for all items in an order
async function validateOrderStock(orderItems) {
    try {
        for (const item of orderItems) {
            const { data, error } = await supabase
                .from('products')
                .select('stock, status, name')
                .eq('id', item.id)
                .single();
            
            if (error || !data) {
                return { valid: false, productName: item.name, reason: 'Product not found' };
            }
            
            if (data.status === 'out-of-stock') {
                return { valid: false, productName: data.name, reason: 'Product is out of stock' };
            }
            
            if (data.stock < item.quantity) {
                return { 
                    valid: false, 
                    productName: data.name, 
                    reason: `Only ${data.stock} items available, but ${item.quantity} requested` 
                };
            }
        }
        return { valid: true };
    } catch (error) {
        console.error('Error validating order stock:', error);
        return { valid: false, productName: 'Unknown', reason: 'Stock validation failed' };
    }
}

// Atomically reserve stock for an order (deduct stock immediately)
async function reserveOrderStock(orderItems) {
    try {
        console.log('🔒 Starting atomic stock reservation...');
        
        // Use a transaction-like approach by calling the secure SQL function
        for (const item of orderItems) {
            const { data, error } = await supabase.rpc('deduct_stock', {
                product_id: parseInt(item.id),
                quantity_to_deduct: parseInt(item.quantity)
            });
            
            if (error || data === null) {
                console.warn(`RPC deduct_stock failed for product ${item.id}. Falling back to direct update...`, error);
                // Fallback: direct stock decrement with check
                const { data: current, error: fetchErr } = await supabase
                    .from('products')
                    .select('stock, status')
                    .eq('id', item.id)
                    .single();
                
                if (fetchErr || !current) {
                    await restoreOrderStock(orderItems.slice(0, orderItems.indexOf(item)));
                    return { success: false, error: `Failed to fetch stock for ${item.name}` };
                }
                
                if (current.stock < item.quantity || current.status === 'out-of-stock') {
                    await restoreOrderStock(orderItems.slice(0, orderItems.indexOf(item)));
                    return { success: false, error: `Insufficient stock for ${item.name}` };
                }
                
                const newStock = current.stock - item.quantity;
                const updates = { stock: newStock };
                if (newStock === 0) {
                    updates.status = 'out-of-stock';
                }
                
                const { error: updateErr } = await supabase
                    .from('products')
                    .update(updates)
                    .eq('id', item.id);
                
                if (updateErr) {
                    await restoreOrderStock(orderItems.slice(0, orderItems.indexOf(item)));
                    return { success: false, error: `Failed to update stock for ${item.name}` };
                }
                
                console.log(`✅ Fallback: Stock updated for product ${item.id}: -${item.quantity} units`);
                continue;
            }
            
            console.log(`✅ Stock reserved for product ${item.id}: ${item.quantity} units`);
        }
        
        console.log('✅ All stock successfully reserved');
        return { success: true };
        
    } catch (error) {
        console.error('Error in stock reservation:', error);
        return { success: false, error: error.message };
    }
}

// Restore stock if order fails (add stock back)
async function restoreOrderStock(orderItems) {
    try {
        console.log('🔄 Restoring stock for failed order...');
        
        for (const item of orderItems) {
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.id)
                .single();
            
            if (!fetchError && product) {
                const { data, error } = await supabase
                    .from('products')
                    .update({ 
                        stock: product.stock + item.quantity,
                        status: 'active'
                    })
                    .eq('id', item.id);
                
                if (error) {
                    console.error(`Failed to restore stock for product ${item.id}:`, error);
                } else {
                    console.log(`✅ Stock restored for product ${item.id}: +${item.quantity} units`);
                }
            }
        }
    } catch (error) {
        console.error('Error restoring stock:', error);
    }
}

// Update product status to out-of-stock if stock reaches 0
async function updateProductStatusAfterOrder(orderItems) {
    try {
        console.log('🔄 Checking product status after order...');
        
        for (const item of orderItems) {
            const { data, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.id)
                .single();
            
            if (!error && data && data.stock === 0) {
                // Update status to out-of-stock
                await supabase
                    .from('products')
                    .update({ status: 'out-of-stock' })
                    .eq('id', item.id);
                
                console.log(`⚠️ Product ${item.id} marked as out-of-stock`);
            }
        }
    } catch (error) {
        console.error('Error updating product status:', error);
    }
}

// Legacy function for backward compatibility
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

// Legacy function for backward compatibility
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

// Trigger real-time stock update for admin panel
function triggerStockUpdate() {
    if (typeof window.adminPanel !== 'undefined' && window.adminPanel.loadProducts) {
        setTimeout(() => {
            window.adminPanel.loadProducts();
        }, 1000);
    }
}

// Make functions globally available
window.checkProductStock = checkProductStock;
window.validateOrderStock = validateOrderStock;
window.reserveOrderStock = reserveOrderStock;
window.restoreOrderStock = restoreOrderStock;
window.updateProductStatusAfterOrder = updateProductStatusAfterOrder;
window.updateProductStock = updateProductStock;
window.updateOrderStock = updateOrderStock;
window.triggerStockUpdate = triggerStockUpdate;