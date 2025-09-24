-- Fix products that have incorrect stock/status after admin operations
UPDATE products 
SET status = CASE 
    WHEN stock > 0 THEN 'active'
    ELSE 'out-of-stock'
END
WHERE status != CASE 
    WHEN stock > 0 THEN 'active'
    ELSE 'out-of-stock'
END;