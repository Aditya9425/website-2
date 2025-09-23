-- Disable RLS for products table to allow admin operations
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Or create admin-friendly RLS policy
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for admin" ON products FOR ALL USING (true);