-- Add color_variants column to products table
ALTER TABLE products 
ADD COLUMN color_variants JSONB DEFAULT '[]'::jsonb;

-- Update existing products to have empty color_variants array
UPDATE products 
SET color_variants = '[]'::jsonb 
WHERE color_variants IS NULL;