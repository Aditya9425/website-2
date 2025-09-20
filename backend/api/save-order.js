const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const orderData = req.body;

        // Validate required fields
        if (!orderData.user_id || !orderData.total_amount || !orderData.items || !orderData.shipping_addr) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: user_id, total_amount, items, shipping_addr'
            });
        }

        // Generate order ID if not provided
        const orderId = orderData.id || `ORD${Date.now()}`;

        // Prepare order data for database
        const dbOrderData = {
            id: orderId,
            user_id: orderData.user_id,
            total_amount: parseFloat(orderData.total_amount),
            status: orderData.status || 'pending',
            shipping_addr: orderData.shipping_addr,
            items: orderData.items,
            created_at: new Date().toISOString()
        };

        // Insert order into database
        const { data, error } = await supabase
            .from('orders')
            .insert([dbOrderData])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save order to database'
            });
        }

        console.log('Order saved successfully:', data);

        res.json({
            success: true,
            order: data,
            message: 'Order saved successfully'
        });

    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};