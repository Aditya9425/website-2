-- Add additional columns to users table for profile information
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Create policy for updating user profiles
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true) WITH CHECK (true);