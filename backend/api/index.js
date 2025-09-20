const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const helmet = require('helmet');

const app = express();

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
        /\.vercel\.app$/
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
app.get('/api/health', (req, res) => {
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
            'GET /api/health': 'Health check',
            'POST /api/create-order': 'Create Razorpay order',
            'POST /api/verify-payment': 'Verify payment'
        }
    });
});

// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: currency,
            receipt: receipt || `order_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

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

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment details'
            });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            });
        } else {
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

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

module.exports = app;