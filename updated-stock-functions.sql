-- Drop existing function first
DROP FUNCTION IF EXISTS deduct_stock(bigint, integer);

-- Create enhanced function with atomic operations and proper validation
CREATE OR REPLACE FUNCTION deduct_stock(product_id bigint, quantity_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_stock integer;
    updated_rows integer;
BEGIN
    -- Input validation
    IF product_id IS NULL OR quantity_to_deduct IS NULL OR quantity_to_deduct <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Lock the row and get current stock
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = product_id 
    FOR UPDATE;
    
    -- Check if product exists
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if sufficient stock is available
    IF current_stock < quantity_to_deduct THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct stock atomically and update status
    UPDATE products 
    SET stock = stock - quantity_to_deduct,
        status = CASE 
            WHEN (stock - quantity_to_deduct) <= 0 THEN 'out-of-stock'
            ELSE 'active'
        END,
        updated_at = NOW()
    WHERE id = product_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    -- Return success if exactly one row was updated
    RETURN updated_rows = 1;
END;
$$;

-- Function to restore stock (for failed orders)
CREATE OR REPLACE FUNCTION restore_stock(product_id bigint, quantity_to_restore integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_rows integer;
BEGIN
    -- Input validation
    IF product_id IS NULL OR quantity_to_restore IS NULL OR quantity_to_restore <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Restore stock and update status if needed
    UPDATE products 
    SET stock = stock + quantity_to_restore,
        status = CASE 
            WHEN status = 'out-of-stock' AND (stock + quantity_to_restore) > 0 THEN 'active'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = product_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows = 1;
END;
$$;

-- Function to update stock (for admin)
CREATE OR REPLACE FUNCTION update_stock(product_id bigint, new_stock integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_rows integer;
BEGIN
    -- Input validation
    IF product_id IS NULL OR new_stock IS NULL OR new_stock < 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Update stock and status
    UPDATE products 
    SET stock = new_stock,
        status = CASE 
            WHEN new_stock = 0 THEN 'out-of-stock'
            WHEN new_stock > 0 AND status = 'out-of-stock' THEN 'active'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = product_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows = 1;
END;
$$;