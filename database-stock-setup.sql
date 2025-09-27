-- Enhanced Stock Management Database Setup
-- Run this SQL in your Supabase SQL editor

-- Ensure products table has proper stock columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing products to have stock if they don't
UPDATE products 
SET stock = 10 
WHERE stock IS NULL;

UPDATE products 
SET status = 'active' 
WHERE status IS NULL;

-- Create or replace the stock deduction function
CREATE OR REPLACE FUNCTION deduct_stock(product_id bigint, quantity_to_deduct integer)
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

-- Create function to restore stock (for failed orders)
CREATE OR REPLACE FUNCTION restore_stock(product_id bigint, quantity_to_restore integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE products 
    SET 
        stock = stock + quantity_to_restore,
        status = 'active'
    WHERE id = product_id;
    
    RETURN true;
END;
$$;

-- Drop and recreate function to check stock availability
DROP FUNCTION IF EXISTS check_stock_availability(bigint, integer);
CREATE FUNCTION check_stock_availability(product_id bigint, required_quantity integer)
RETURNS TABLE(available boolean, current_stock integer, product_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (p.stock >= required_quantity AND p.status != 'out-of-stock') as available,
        p.stock as current_stock,
        p.name as product_name
    FROM products p
    WHERE p.id = product_id;
END;
$$;

-- Create trigger to automatically update product status based on stock
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update status based on stock level
    IF NEW.stock <= 0 THEN
        NEW.status = 'out-of-stock';
    ELSIF NEW.stock > 0 AND OLD.status = 'out-of-stock' THEN
        NEW.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_product_status ON products;
CREATE TRIGGER trigger_update_product_status
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock, status);

-- Update existing products to have stock
UPDATE products SET stock = 5 WHERE stock IS NULL OR stock = 0;
UPDATE products SET status = 'active' WHERE status IS NULL OR status = '';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION deduct_stock(bigint, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION restore_stock(bigint, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_stock_availability(bigint, integer) TO anon, authenticated;