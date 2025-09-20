# 🚀 Complete Razorpay Integration Setup Guide

## 📋 What's Been Created

### Backend (Node.js + Express)
- ✅ **server.js** - Main Express server with Razorpay integration
- ✅ **package.json** - All required dependencies
- ✅ **.env** - Environment variables with your Razorpay keys
- ✅ **install.bat** - Windows installation script
- ✅ **start.bat** - Windows server start script

### Frontend Integration
- ✅ **payment-integration.js** - Enhanced payment handling
- ✅ **razorpay-frontend.js** - Updated with new API endpoints
- ✅ **checkout.html** - Updated to include new payment scripts
- ✅ **test-payment.html** - Test page for payment verification

## 🛠️ Installation Steps

### Step 1: Install Backend Dependencies
```bash
# Navigate to backend folder
cd backend

# On Windows - double click install.bat OR run:
npm install
```

### Step 2: Start the Backend Server
```bash
# On Windows - double click start.bat OR run:
npm start

# For development with auto-reload:
npm run dev
```

### Step 3: Verify Backend is Running
- Open browser: http://localhost:5000/health
- Should show: `{"status":"OK","message":"Shagun Saree Backend is running"}`

### Step 4: Test Payment Integration
- Open: `test-payment.html` in your browser
- Fill in test details and click "Test Payment"
- Use test card: `4111 1111 1111 1111`

## 🔧 API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server health check |
| `/api/create-order` | POST | Create Razorpay order |
| `/api/verify-payment` | POST | Verify payment signature |
| `/api/webhook` | POST | Handle Razorpay webhooks |
| `/api/payment-status/:id` | GET | Get payment status |

## 💳 Payment Flow

1. **Customer clicks "Pay Now"** → Frontend calls `/api/create-order`
2. **Backend creates Razorpay order** → Returns order details
3. **Frontend opens Razorpay checkout** → Customer makes payment
4. **Payment success** → Frontend calls `/api/verify-payment`
5. **Backend verifies signature** → Confirms payment authenticity
6. **Order processed** → Customer sees confirmation

## 🔒 Security Features

- ✅ **HMAC-SHA256 signature verification** for all payments
- ✅ **CORS protection** for API endpoints
- ✅ **Environment variables** for sensitive data
- ✅ **Input validation** on all endpoints
- ✅ **Helmet.js** for security headers

## 🧪 Testing

### Test Cards (Razorpay Test Mode)
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI IDs
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F
```

### Payment Verification Fails
- Check Razorpay key secret in `.env`
- Verify signature generation logic
- Check network connectivity

### CORS Errors
- Ensure frontend runs on allowed origins
- Update CORS settings in `server.js`

## 📱 Frontend Integration

Your existing checkout process now automatically uses the new backend:

```javascript
// This function is already integrated in your checkout.html
function initializeRazorpayCheckout(orderAmount, customerDetails) {
    // Automatically uses the new backend API
    paymentManager.initiatePayment(orderData);
}
```

## 🔄 Production Deployment

### For Production Use:
1. **Change to production Razorpay keys** in `.env`
2. **Set NODE_ENV=production**
3. **Use HTTPS** for security
4. **Set up webhook URL** in Razorpay dashboard
5. **Add database** for order storage

### Webhook Setup (Optional)
1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Add webhook secret to `.env`

## 📊 Monitoring & Logs

The backend logs all important events:
- Order creation
- Payment verification
- Webhook events
- Errors and failures

## 🎯 Next Steps

1. **Test the integration** using `test-payment.html`
2. **Place a test order** through your website
3. **Verify payments** in Razorpay dashboard
4. **Add database integration** for production
5. **Set up email notifications** for orders

## 📞 Support

If you encounter issues:
1. Check backend console logs
2. Verify `.env` configuration
3. Test API endpoints individually
4. Check Razorpay dashboard for payment status

---

## 🎉 Ready to Go!

Your Razorpay integration is now complete and ready for use. The backend securely handles all payment operations while your frontend provides a smooth user experience.

**Test it now**: Open `test-payment.html` and make a test payment!

---

**Built with ❤️ for Shagun Saree Baran**