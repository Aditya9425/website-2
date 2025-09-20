const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:5500', 
        'http://localhost:5500', 
        'http://127.0.0.1:5502', 
        'http://localhost:5502',
        'https://shagunsaree.vercel.app',
        /\.vercel\.app$/,
        /\.railway\.app$/
    ],
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Shagun Saree Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Shagun Saree Backend API',
        endpoints: {
            'GET /health': 'Health check',
            'POST /api/create-order': 'Create Razorpay order',
            'POST /api/verify-payment': 'Verify payment',
            'POST /api/save-order': 'Save order to database',
            'GET /api/get-orders': 'Get user orders',
            'GET /api/admin-orders': 'Get all orders (admin)'
        }
    });
});

// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        // Create order options
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt: receipt || `order_${Date.now()}`,
            payment_capture: 1
        };

        // Create order with Razorpay
        const order = await razorpay.orders.create(options);

        console.log('Order created:', order.id);

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order'
        });
    }
});

// Verify payment
app.post('/api/verify-payment', (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment details'
            });
        }

        // Create signature for verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            console.log('Payment verified successfully:', razorpay_payment_id);
            
            // Here you can save payment details to database
            // savePaymentToDatabase(razorpay_payment_id, razorpay_order_id);

            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            });
        } else {
            console.log('Payment verification failed');
            res.status(400).json({
                success: false,
                error: 'Payment verification failed'
            });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            error: 'Payment verification error'
        });
    }
});

// Webhook endpoint for Razorpay
app.post('/api/webhook', (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (webhookSignature === expectedSignature) {
            const event = req.body.event;
            const paymentEntity = req.body.payload.payment.entity;

            console.log('Webhook received:', event);

            switch (event) {
                case 'payment.captured':
                    console.log('Payment captured:', paymentEntity.id);
                    // Handle successful payment
                    handlePaymentSuccess(paymentEntity);
                    break;

                case 'payment.failed':
                    console.log('Payment failed:', paymentEntity.id);
                    // Handle failed payment
                    handlePaymentFailure(paymentEntity);
                    break;

                default:
                    console.log('Unhandled webhook event:', event);
            }

            res.status(200).json({ status: 'ok' });
        } else {
            console.log('Invalid webhook signature');
            res.status(400).json({ error: 'Invalid signature' });
        }

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Import order management endpoints
const saveOrderHandler = require('./api/save-order');
const getOrdersHandler = require('./api/get-orders');
const adminOrdersHandler = require('./api/admin-orders');

// Order management endpoints
app.post('/api/save-order', saveOrderHandler);
app.get('/api/get-orders', getOrdersHandler);
app.get('/api/admin-orders', adminOrdersHandler);

// Get payment status
app.get('/api/payment-status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const payment = await razorpay.payments.fetch(paymentId);
        
        res.json({
            success: true,
            payment: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
                created_at: payment.created_at
            }
        });

    } catch (error) {
        console.error('Error fetching payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment status'
        });
    }
});

// Handle payment success (webhook)
function handlePaymentSuccess(paymentEntity) {
    console.log('Processing successful payment:', paymentEntity.id);
    // Add your business logic here:
    // - Update order status in database
    // - Send confirmation email
    // - Update inventory
    // - Generate invoice
}

// Handle payment failure (webhook)
function handlePaymentFailure(paymentEntity) {
    console.log('Processing failed payment:', paymentEntity.id);
    // Add your business logic here:
    // - Update order status
    // - Send failure notification
    // - Release inventory hold
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Shagun Saree Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💳 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Missing'}`);
    console.log(`🔐 Razorpay Secret: ${process.env.RAZORPAY_KEY_SECRET ? 'Configured' : 'Missing'}`);
});

module.exports = app;