-- Remove existing functions first
DROP FUNCTION IF EXISTS check_stock_availability(bigint, integer);
DROP FUNCTION IF EXISTS process_order_stock_deduction(jsonb);

-- Function to check stock availability without deducting
CREATE OR REPLACE FUNCTION check_stock_availability(product_id bigint, required_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_stock integer;
BEGIN
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = product_id AND status = 'active';
    
    RETURN COALESCE(current_stock, 0) >= required_quantity;
END;
$$;

-- Function to process multiple items atomically
CREATE OR REPLACE FUNCTION process_order_stock_deduction(order_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
    product_id_val bigint;
    quantity_val integer;
    success boolean;
    result jsonb := '{"success": true, "errors": []}'::jsonb;
BEGIN
    -- Process each item
    FOR item IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
        product_id_val := (item->>'id')::bigint;
        quantity_val := (item->>'quantity')::integer;
        
        -- Try to deduct stock
        SELECT deduct_stock(product_id_val, quantity_val) INTO success;
        
        IF NOT success THEN
            result := jsonb_set(result, '{success}', 'false'::jsonb);
            result := jsonb_set(result, '{errors}', 
                result->'errors' || jsonb_build_array('Failed to deduct stock for product ID: ' || product_id_val));
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;