-- Enhanced SQL functions for secure stock management

-- Enhanced SQL function to safely deduct stock with atomic operations
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
    
    -- Deduct stock atomically
    UPDATE products 
    SET stock = stock - quantity_to_deduct,
        updated_at = NOW()
    WHERE id = product_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    -- Return success if exactly one row was updated
    RETURN updated_rows = 1;
END;
$$;

-- Enhanced SQL function to update stock (for admin)
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
    
    -- Return success if exactly one row was updated
    RETURN updated_rows = 1;
END;
$$;

-- Function to check and update product status based on stock
CREATE OR REPLACE FUNCTION update_product_status_by_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update products to out-of-stock when stock is 0
    UPDATE products 
    SET status = 'out-of-stock',
        updated_at = NOW()
    WHERE stock = 0 AND status != 'out-of-stock';
    
    -- Update products to active when stock is available and currently out-of-stock
    UPDATE products 
    SET status = 'active',
        updated_at = NOW()
    WHERE stock > 0 AND status = 'out-of-stock';
END;
$$;

-- Function to process order stock deduction atomically
CREATE OR REPLACE FUNCTION process_order_stock(order_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
    product_id_val bigint;
    quantity_val integer;
    result jsonb := '{"success": true, "errors": []}'::jsonb;
    error_msg text;
BEGIN
    -- Process each item in the order
    FOR item IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
        product_id_val := (item->>'id')::bigint;
        quantity_val := (item->>'quantity')::integer;
        
        -- Attempt to deduct stock
        IF NOT deduct_stock(product_id_val, quantity_val) THEN
            error_msg := 'Failed to deduct stock for product ID: ' || product_id_val;
            result := jsonb_set(result, '{success}', 'false'::jsonb);
            result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array(error_msg));
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;