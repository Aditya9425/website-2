# Supabase Integration Setup Guide

## Step 1: Update Supabase Configuration

In `main.js`, replace the placeholder values with your actual Supabase credentials:

```javascript
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

## Step 2: Create Products Table in Supabase

Create a table named `Products` with the following columns:

```sql
CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    originalPrice INTEGER,
    original_price INTEGER, -- Alternative column name for compatibility
    image TEXT,
    category VARCHAR(100),
    rating DECIMAL(2,1) DEFAULT 4.5,
    description TEXT,
    colors TEXT[], -- Array of colors
    sizes TEXT[], -- Array of sizes
    fabric VARCHAR(100),
    reviews INTEGER DEFAULT 50
);
```

## Step 3: Insert Sample Data

```sql
INSERT INTO Products (name, price, originalPrice, image, category, rating, description, colors, sizes, fabric, reviews) VALUES
('Silk Banarasi Saree', 15000, 18000, 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Silk+Banarasi', 'silk', 4.8, 'Exquisite Banarasi silk saree with intricate zari work', ARRAY['Red', 'Green', 'Blue'], ARRAY['Free Size'], 'Silk', 156),
('Cotton Handloom Saree', 2500, 3000, 'https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Cotton+Handloom', 'cotton', 4.5, 'Comfortable cotton handloom saree for daily wear', ARRAY['White', 'Beige', 'Pink'], ARRAY['Free Size'], 'Cotton', 89),
('Designer Georgette Saree', 8000, 10000, 'https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=Designer+Georgette', 'designer', 4.7, 'Elegant designer georgette saree with modern aesthetics', ARRAY['Purple', 'Teal', 'Maroon'], ARRAY['Free Size'], 'Georgette', 203);
```

## Step 4: Enable Row Level Security (Optional)

If you want to enable RLS for security:

```sql
ALTER TABLE Products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON Products
FOR SELECT USING (true);
```

## Step 5: Test the Integration

1. Open your website in a browser
2. Check the browser console for any errors
3. Verify that products are loading from Supabase
4. If Supabase fails, the system will fallback to hardcoded products

## Troubleshooting

- Make sure your Supabase URL and anon key are correct
- Check that the Products table exists and has data
- Verify that the table columns match the expected structure
- Check browser console for any JavaScript errors