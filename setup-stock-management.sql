-- Ensure stock column exists in products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing products to have stock if they don't
UPDATE products SET stock = 10 WHERE stock IS NULL OR stock = 0;
UPDATE products SET status = 'active' WHERE status IS NULL;

-- Create function to safely deduct stock and update status
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