-- Supabase SQL Schema for Saree E-commerce

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]',
    linked_variants JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_charges DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample products
INSERT INTO products (name, price, original_price, category, fabric, description, images, colors, rating, reviews) VALUES
('Silk Banarasi Saree', 15000, 18000, 'silk', 'Silk', 'Exquisite Banarasi silk saree with intricate zari work', 
 '["https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Silk+Banarasi"]', 
 '["Red", "Green", "Blue"]', 4.8, 156),

('Cotton Handloom Saree', 2500, 3000, 'cotton', 'Cotton', 'Comfortable cotton handloom saree for daily wear',
 '["https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Cotton+Handloom"]',
 '["White", "Beige", "Pink"]', 4.5, 89),

('Designer Georgette Saree', 8000, 10000, 'designer', 'Georgette', 'Elegant designer georgette saree with modern aesthetics',
 '["https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=Designer+Georgette"]',
 '["Purple", "Teal", "Maroon"]', 4.7, 203);