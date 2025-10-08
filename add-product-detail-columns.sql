-- Add product detail columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS design_details TEXT,
ADD COLUMN IF NOT EXISTS blouse_info TEXT,
ADD COLUMN IF NOT EXISTS ornamentation TEXT,
ADD COLUMN IF NOT EXISTS border TEXT,
ADD COLUMN IF NOT EXISTS blouse_fabric TEXT,
ADD COLUMN IF NOT EXISTS blouse_type TEXT,
ADD COLUMN IF NOT EXISTS saree_fabric TEXT,
ADD COLUMN IF NOT EXISTS wash_care TEXT,
ADD COLUMN IF NOT EXISTS complete_look TEXT;