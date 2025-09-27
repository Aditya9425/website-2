-- Simple stock deduction function for UUID product IDs
CREATE OR REPLACE FUNCTION deduct_stock(product_id uuid, quantity_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_stock integer;
BEGIN
    -- Check if product exists and get current stock
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = product_id;
    
    -- Return false if product doesn't exist or insufficient stock
    IF current_stock IS NULL OR current_stock < quantity_to_deduct THEN
        RETURN false;
    END IF;
    
    -- Deduct stock and update status
    UPDATE products 
    SET 
        stock = stock - quantity_to_deduct,
        status = CASE 
            WHEN (stock - quantity_to_deduct) <= 0 THEN 'out-of-stock'
            ELSE 'active'
        END
    WHERE id = product_id;
    
    RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_stock(uuid, integer) TO anon, authenticated;