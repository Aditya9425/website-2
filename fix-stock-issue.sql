-- Fix any products that might have incorrect stock/status
UPDATE products 
SET status = CASE 
    WHEN stock > 0 THEN 'active'
    WHEN stock = 0 THEN 'out-of-stock'
    ELSE 'active'
END
WHERE status IS NULL OR (stock > 0 AND status = 'out-of-stock');

-- Ensure all products have proper stock values
UPDATE products 
SET stock = COALESCE(stock, 10)
WHERE stock IS NULL;