-- Supabase SQL Functions for Stock Management

-- Function to deduct stock safely
CREATE OR REPLACE FUNCTION deduct_stock(product_id bigint)
RETURNS json AS $$
DECLARE
    current_stock integer;
    new_stock integer;
BEGIN
    -- Get current stock with row lock
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = product_id 
    FOR UPDATE;
    
    -- Check if product exists and has stock
    IF current_stock IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    IF current_stock <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Out of stock');
    END IF;
    
    -- Deduct 1 from stock
    new_stock := current_stock - 1;
    
    UPDATE products 
    SET stock = new_stock 
    WHERE id = product_id;
    
    RETURN json_build_object(
        'success', true, 
        'new_stock', new_stock,
        'product_id', product_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update stock (for admin panel)
CREATE OR REPLACE FUNCTION update_stock(product_id bigint, new_stock integer)
RETURNS json AS $$
BEGIN
    -- Validate input
    IF new_stock < 0 THEN
        RETURN json_build_object('success', false, 'error', 'Stock cannot be negative');
    END IF;
    
    -- Update stock
    UPDATE products 
    SET stock = new_stock 
    WHERE id = product_id;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'new_stock', new_stock,
        'product_id', product_id
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);

-- Create policy for authenticated users to update stock
-- CREATE POLICY "Authenticated can update stock" ON products FOR UPDATE USING (auth.role() = 'authenticated');