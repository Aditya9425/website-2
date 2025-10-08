-- Add columns for Partial COD support to the orders table
-- Run this in your Supabase SQL editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS partial_payment_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remaining_due DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'full';

-- Add comments for documentation
COMMENT ON COLUMN orders.partial_payment_amount IS 'Amount paid upfront for partial COD orders (e.g., ₹200)';
COMMENT ON COLUMN orders.remaining_due IS 'Amount to be paid on delivery for partial COD orders';
COMMENT ON COLUMN orders.payment_type IS 'Payment type: full or partial';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_orders_partial_payment ON orders(partial_payment_amount) WHERE partial_payment_amount IS NOT NULL;