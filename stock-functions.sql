-- SQL function to safely deduct stock
CREATE OR REPLACE FUNCTION deduct_stock(product_id bigint, quantity_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products 
    SET stock = GREATEST(0, stock - quantity_to_deduct)
    WHERE id = product_id AND stock >= quantity_to_deduct;
    
    RETURN FOUND;
END;
$$;

-- SQL function to update stock (for admin)
DROP FUNCTION IF EXISTS update_stock(bigint, integer);
CREATE OR REPLACE FUNCTION update_stock(product_id bigint, new_stock integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products 
    SET stock = GREATEST(0, new_stock)
    WHERE id = product_id;
    
    RETURN FOUND;
END;
$$;