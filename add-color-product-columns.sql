-- Add new columns for individual color products
-- Run this in Supabase SQL Editor

-- Add color column for individual color name
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add color_code column for hex color code
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color_code TEXT;

-- Add base_product_name column to group related color variants
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS base_product_name TEXT;

-- Add slug column for SEO-friendly URLs
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index on base_product_name for faster queries
CREATE INDEX IF NOT EXISTS idx_products_base_product_name ON products(base_product_name);

-- Create index on color for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);

-- Create index on slug for URL lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Update existing products to have a base_product_name if they don't have one
UPDATE products 
SET base_product_name = name 
WHERE base_product_name IS NULL;

-- Create a function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(input_text, '[^a-zA-Z0-9\s\-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Update existing products to have slugs if they don't have them
UPDATE products 
SET slug = generate_slug(name || '-' || COALESCE(color, ''))
WHERE slug IS NULL;

-- Add constraint to ensure slug uniqueness
ALTER TABLE products 
ADD CONSTRAINT unique_product_slug UNIQUE (slug);

-- Create a trigger to automatically generate slugs for new products
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name || '-' || COALESCE(NEW.color, ''));
        
        -- Ensure uniqueness by appending a number if needed
        WHILE EXISTS (SELECT 1 FROM products WHERE slug = NEW.slug AND id != COALESCE(NEW.id, 0)) LOOP
            NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_slug
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_slug();

-- Add comments to document the new columns
COMMENT ON COLUMN products.color IS 'Individual color name for this product variant (e.g., Red, Blue, Green)';
COMMENT ON COLUMN products.color_code IS 'Hex color code for this product variant (e.g., #FF0000, #0000FF)';
COMMENT ON COLUMN products.base_product_name IS 'Base product name to group color variants together';
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug for this product';

-- Create a view for easier querying of color variants
CREATE OR REPLACE VIEW product_color_variants AS
SELECT 
    base_product_name,
    COUNT(*) as variant_count,
    array_agg(
        json_build_object(
            'id', id,
            'name', name,
            'color', color,
            'color_code', color_code,
            'price', price,
            'stock', stock,
            'status', status,
            'images', images,
            'slug', slug
        ) ORDER BY color
    ) as variants
FROM products 
WHERE base_product_name IS NOT NULL
GROUP BY base_product_name;

COMMENT ON VIEW product_color_variants IS 'View to easily get all color variants for a base product';

-- Grant necessary permissions
GRANT SELECT ON product_color_variants TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;

-- Enable RLS (Row Level Security) policies if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the new structure
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
CREATE POLICY "Enable insert for authenticated users only" ON products
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
CREATE POLICY "Enable update for authenticated users only" ON products
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;
CREATE POLICY "Enable delete for authenticated users only" ON products
    FOR DELETE USING (true);

-- Create a function to get related color products
CREATE OR REPLACE FUNCTION get_related_color_products(product_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    color TEXT,
    color_code TEXT,
    price NUMERIC,
    stock INTEGER,
    status TEXT,
    images JSONB,
    slug TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.color,
        p.color_code,
        p.price,
        p.stock,
        p.status,
        p.images,
        p.slug
    FROM products p
    WHERE p.base_product_name = (
        SELECT base_product_name 
        FROM products 
        WHERE products.id = product_id
    )
    AND p.id != product_id
    ORDER BY p.color;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_related_color_products IS 'Get all related color products for a given product ID';

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_related_color_products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_slug TO anon, authenticated;