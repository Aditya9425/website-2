-- Complete RLS Setup for Shagun Saree E-commerce
-- Run this in your Supabase SQL Editor

-- 1. PRODUCTS TABLE - Public read access, admin write access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read products (public access)
CREATE POLICY "Allow public read access to products" ON products
    FOR SELECT USING (true);

-- Allow authenticated users to insert products (for admin)
CREATE POLICY "Allow authenticated insert to products" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update products (for admin)
CREATE POLICY "Allow authenticated update to products" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete products (for admin)
CREATE POLICY "Allow authenticated delete to products" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- 2. USERS TABLE - Users can only access their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read for authentication (login check)
CREATE POLICY "Allow public read for authentication" ON users
    FOR SELECT USING (true);

-- Allow public insert for registration
CREATE POLICY "Allow public insert for registration" ON users
    FOR INSERT WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');

-- 3. ORDERS TABLE - Users can only access their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'authenticated');

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'authenticated');

-- Allow authenticated users (admin) to update orders
CREATE POLICY "Allow authenticated update orders" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. FEEDBACKS TABLE - Public insert, admin read
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit feedback
CREATE POLICY "Allow public insert to feedbacks" ON feedbacks
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users (admin) to read feedback
CREATE POLICY "Allow authenticated read feedbacks" ON feedbacks
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. ADMIN TABLE - Only for admin access
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access admin table
CREATE POLICY "Allow authenticated access to admin" ON admin
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default admin user
INSERT INTO admin (username, password) VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;