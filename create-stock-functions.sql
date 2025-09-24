-- Create Stock Management Functions

-- Function to deduct stock
CREATE OR REPLACE FUNCTION deduct_stock(product_id INTEGER, quantity_to_deduct INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if product exists and has enough stock
    IF NOT EXISTS (
        SELECT 1 FROM products 
        WHERE id = product_id AND stock >= quantity_to_deduct
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct stock
    UPDATE products 
    SET stock = stock - quantity_to_deduct,
        status = CASE 
            WHEN (stock - quantity_to_deduct) <= 0 THEN 'out-of-stock'
            ELSE status
        END
    WHERE id = product_id;
    
    RETURN TRUE;
END;
$$;

-- Function to restore stock
CREATE OR REPLACE FUNCTION restore_stock(product_id INTEGER, quantity_to_restore INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Restore stock
    UPDATE products 
    SET stock = stock + quantity_to_restore,
        status = CASE 
            WHEN status = 'out-of-stock' AND (stock + quantity_to_restore) > 0 THEN 'active'
            ELSE status
        END
    WHERE id = product_id;
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_stock(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION deduct_stock(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_stock(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION restore_stock(INTEGER, INTEGER) TO authenticated;