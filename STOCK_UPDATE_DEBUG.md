# Stock Update Debugging Guide

## 🔍 Possible Reasons for Stock Update Failure

### 1. **Database Function Issues**
- `deduct_stock()` function not created or has errors
- Function permissions not granted to anon user
- RLS policies blocking function execution

### 2. **JavaScript Function Availability**
- `updateOrderStock()` function not loaded
- `stock-manager.js` not included in checkout page
- Function called but fails silently

### 3. **Supabase RPC Call Failures**
- Network connectivity issues
- Authentication problems
- Invalid product IDs or quantities

### 4. **Code Execution Flow Issues**
- Stock update code not reached after order save
- Error in processOrder function preventing stock update
- Async/await timing issues

## 🛠️ Step-by-Step Debugging Actions

### Step 1: Verify Database Function
```sql
-- Run in Supabase SQL Editor
SELECT deduct_stock(1, 1); -- Test with actual product ID
```

### Step 2: Check Function Permissions
```sql
-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION deduct_stock(bigint, integer) TO anon;
```

### Step 3: Test Stock Update Function
```javascript
// Add to browser console on checkout page
console.log('Testing stock update...');
updateProductStock(1, 1).then(result => {
    console.log('Stock update result:', result);
}).catch(error => {
    console.error('Stock update error:', error);
});
```

### Step 4: Add Debug Logging
```javascript
// Add to processOrder function in main.js after order save
console.log('🔍 DEBUG: About to update stock for items:', items);
console.log('🔍 DEBUG: updateOrderStock function available:', typeof updateOrderStock);

if (typeof updateOrderStock === 'function') {
    console.log('🔍 DEBUG: Calling updateOrderStock...');
    const stockUpdates = await updateOrderStock(items);
    console.log('🔍 DEBUG: Stock update results:', stockUpdates);
} else {
    console.error('🔍 DEBUG: updateOrderStock function not available');
}
```

### Step 5: Verify Script Loading Order
Check that scripts are loaded in correct order in checkout.html:
```html
<script src="stock-manager.js"></script>
<script src="main.js"></script>
```

### Step 6: Manual Stock Update Test
```javascript
// Test direct Supabase RPC call
supabase.rpc('deduct_stock', {
    product_id: 1,
    quantity_to_deduct: 1
}).then(result => {
    console.log('Direct RPC result:', result);
}).catch(error => {
    console.error('Direct RPC error:', error);
});
```

## 🔧 Quick Fixes

### Fix 1: Ensure Database Function Exists
```sql
-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION deduct_stock(product_id bigint, quantity_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products 
    SET stock = GREATEST(0, stock - quantity_to_deduct),
        status = CASE 
            WHEN (stock - quantity_to_deduct) <= 0 THEN 'out-of-stock'
            ELSE 'active'
        END
    WHERE id = product_id AND stock >= quantity_to_deduct;
    
    RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_stock(bigint, integer) TO anon;
```

### Fix 2: Add Error Handling to Stock Update
```javascript
// Replace updateOrderStock call in main.js
try {
    console.log('📦 Updating stock for ordered items...');
    if (typeof updateOrderStock === 'function') {
        const stockUpdates = await updateOrderStock(items);
        console.log('📊 Stock updates completed:', stockUpdates);
        
        // Check if any updates failed
        const failedUpdates = stockUpdates.filter(update => !update.success);
        if (failedUpdates.length > 0) {
            console.warn('⚠️ Some stock updates failed:', failedUpdates);
        }
    } else {
        console.error('❌ updateOrderStock function not available');
        // Fallback: try direct update
        for (const item of items) {
            try {
                await updateProductStock(item.id, item.quantity);
            } catch (error) {
                console.error(`❌ Failed to update stock for product ${item.id}:`, error);
            }
        }
    }
} catch (error) {
    console.error('❌ Stock update process failed:', error);
}
```

### Fix 3: Verify Script Inclusion
Add to checkout.html if missing:
```html
<script>
// Debug script loading
console.log('Stock manager loaded:', typeof updateOrderStock !== 'undefined');
console.log('Supabase loaded:', typeof supabase !== 'undefined');
</script>
```

## 🧪 Testing Steps

### 1. Browser Console Test
```javascript
// Run in browser console during checkout
console.log('Available functions:', {
    updateOrderStock: typeof updateOrderStock,
    updateProductStock: typeof updateProductStock,
    supabase: typeof supabase
});
```

### 2. Database Direct Test
```sql
-- Check current stock
SELECT id, name, stock, status FROM products WHERE id = 1;

-- Test function
SELECT deduct_stock(1, 1);

-- Check updated stock
SELECT id, name, stock, status FROM products WHERE id = 1;
```

### 3. Network Tab Check
- Open browser DevTools → Network tab
- Complete an order
- Look for RPC calls to Supabase
- Check for any failed requests

## 🎯 Most Likely Issues & Solutions

### Issue 1: Function Not Created
**Solution**: Run the SQL function creation script in Supabase

### Issue 2: Permission Denied
**Solution**: Grant execute permissions to anon role

### Issue 3: Script Not Loaded
**Solution**: Verify stock-manager.js is included before main.js

### Issue 4: Silent Failure
**Solution**: Add comprehensive error logging and try-catch blocks

## 🔍 Immediate Debug Steps

1. **Check browser console** for any JavaScript errors
2. **Verify Supabase connection** - test a simple query
3. **Test the deduct_stock function** directly in Supabase SQL editor
4. **Add console.log statements** to track execution flow
5. **Check Network tab** for failed API calls