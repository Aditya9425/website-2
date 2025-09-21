-- Create orders table for Shagun Saree e-commerce website
-- This table will store all customer orders

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_addr JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    payment_method TEXT DEFAULT 'razorpay',
    payment_id TEXT,
    razorpay_order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow users to read their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (COALESCE(auth.uid()::text, '') = user_id);

-- Allow users to insert their own orders
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (COALESCE(auth.uid()::text, '') = user_id);

-- Admin policies commented out until role column is added to users table
-- CREATE POLICY "Admin can view all orders" ON orders
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM users 
--             WHERE users.id::text = auth.uid()::text 
--             AND users.role = 'admin'
--         )
--     );

-- CREATE POLICY "Admin can update all orders" ON orders
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM users 
--             WHERE users.id::text = auth.uid()::text 
--             AND users.role = 'admin'
--         )
--     );

-- For now, allow anonymous access (you can tighten this later)
CREATE POLICY "Allow anonymous read" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON orders FOR UPDATE USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO orders (user_id, items, total_amount, shipping_addr, status) VALUES
-- ('sample-user-1', 
--  '[{"id": "1", "name": "Sample Saree", "price": 2500, "quantity": 1}]'::jsonb,
--  2700,
--  '{"firstName": "Sample", "lastName": "User", "email": "sample@example.com", "mobile": "9999999999", "addressLine1": "123 Sample St", "city": "Sample City", "state": "Sample State", "pincode": "123456"}'::jsonb,
--  'pending');

-- Grant necessary permissions
GRANT ALL ON orders TO anon;
GRANT ALL ON orders TO authenticated;

-- Show table structure (remove this line for Supabase)
-- \d orders;