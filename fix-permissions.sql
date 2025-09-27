-- Check and fix RLS policies for products table
-- Disable RLS temporarily to test
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows updates
DROP POLICY IF EXISTS "Allow public updates on products" ON products;
CREATE POLICY "Allow public updates on products" ON products
FOR UPDATE USING (true) WITH CHECK (true);

-- Also allow select for stock checks
DROP POLICY IF EXISTS "Allow public select on products" ON products;
CREATE POLICY "Allow public select on products" ON products
FOR SELECT USING (true);

-- Re-enable RLS with the new policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;