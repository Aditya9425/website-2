-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public insert to users" ON users;

-- Create new policies with proper permissions
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for anonymous users" ON users
    FOR INSERT WITH CHECK (true);

-- Alternative: Disable RLS temporarily for testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;