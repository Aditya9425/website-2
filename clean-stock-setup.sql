-- Drop ALL existing deduct_stock functions
DROP FUNCTION IF EXISTS public.deduct_stock(bigint, integer);
DROP FUNCTION IF EXISTS public.deduct_stock(integer, integer);
DROP FUNCTION IF EXISTS public.deduct_stock(uuid, integer);

-- Create single function with unique name
CREATE FUNCTION reduce_product_stock(product_id uuid, quantity_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_stock integer;
BEGIN
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = product_id;
    
    IF current_stock IS NULL OR current_stock < quantity_to_deduct THEN
        RETURN false;
    END IF;
    
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

GRANT EXECUTE ON FUNCTION reduce_product_stock(uuid, integer) TO anon, authenticated;