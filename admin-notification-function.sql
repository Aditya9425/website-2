-- Admin Notification Function for Stock Changes

CREATE OR REPLACE FUNCTION notify_admin_stock_change(changed_products JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert notification record for admin panel
    INSERT INTO admin_notifications (
        type,
        message,
        data,
        created_at
    ) VALUES (
        'STOCK_CHANGE',
        'Stock levels updated due to customer order',
        changed_products,
        NOW()
    );
    
    -- Return success
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main transaction
        RAISE WARNING 'Failed to create admin notification: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Create admin_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_notifications TO anon;
GRANT SELECT, INSERT, UPDATE ON admin_notifications TO authenticated;