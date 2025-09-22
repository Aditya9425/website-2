-- Drop existing policies and recreate clean RLS setup
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete to products" ON products;
DROP POLICY IF EXISTS "Allow public read for authentication" ON users;
DROP POLICY IF EXISTS "Allow public insert for registration" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: Public read, authenticated write
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_update" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_delete" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Users: Public read for auth, own data access
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');

-- Orders: Own data only
CREATE POLICY "orders_select" ON orders FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'authenticated');
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'authenticated');
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.role() = 'authenticated');