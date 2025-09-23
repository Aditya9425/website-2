-- Fix stock update issues
-- Run this in Supabase SQL Editor

-- 1. Create the deduct_stock function
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

-- 2. Grant permissions to anon role
GRANT EXECUTE ON FUNCTION deduct_stock(bigint, integer) TO anon;

-- 3. Test the function
SELECT deduct_stock(1, 1);