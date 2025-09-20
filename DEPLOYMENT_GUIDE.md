# Backend Integration & Deployment Guide

## Current Status
- **Frontend**: https://shagunsaree.vercel.app/ ✅
- **Backend**: https://backend-pink-nine-27.vercel.app/ ⚠️ (needs redeployment)

## Issues Fixed
1. ✅ Updated backend URL in config.js
2. ✅ Created Vercel-compatible API structure
3. ✅ Fixed CORS configuration
4. ✅ Created separate endpoint files for serverless functions

## Steps to Fix Backend

### 1. Redeploy Backend to Vercel

Navigate to your backend directory and redeploy:

```bash
cd "a:\Shagun saree\old files\website 2\backend"
vercel --prod
```

### 2. Set Environment Variables in Vercel

Go to your Vercel dashboard for the backend project and add these environment variables:

```
RAZORPAY_KEY_ID=rzp_live_RJncjoroiyYe1k
RAZORPAY_KEY_SECRET=ZGu0ojYoTP1MrgyHMVj0hGoW
NODE_ENV=production
```

### 3. Test Backend Connection

After redeployment, test your backend:
1. Open: https://shagunsaree.vercel.app/test-backend.html
2. Click "Test Health Check" - should show ✅ success
3. Click "Test Create Order" - should create a Razorpay order

### 4. Update Frontend if Needed

If your backend URL changes after redeployment, update `config.js`:

```javascript
BACKEND_URL: {
    development: 'http://localhost:5000',
    production: 'https://YOUR_NEW_BACKEND_URL.vercel.app'
}
```

## File Structure Created

```
backend/
├── api/
│   ├── index.js          # Main API handler
│   ├── health.js         # Health check endpoint
│   ├── create-order.js   # Create Razorpay order
│   └── verify-payment.js # Verify payment
├── vercel.json           # Updated Vercel config
└── package.json          # Dependencies
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/create-order` - Create Razorpay order
- `POST /api/verify-payment` - Verify payment signature

## Testing Payment Flow

1. Go to your website: https://shagunsaree.vercel.app/
2. Add items to cart
3. Go to checkout
4. Fill address details
5. Click "Pay with Razorpay"
6. Complete payment with test card: 4111 1111 1111 1111

## Troubleshooting

### Backend Not Responding
- Check Vercel deployment logs
- Verify environment variables are set
- Test health endpoint directly

### Payment Errors
- Verify Razorpay keys are correct
- Check browser console for errors
- Ensure CORS is properly configured

### CORS Issues
- Backend now includes proper CORS headers
- Frontend domain is whitelisted

## Next Steps

1. **Redeploy backend** with the new structure
2. **Test the integration** using the test page
3. **Update environment variables** in Vercel dashboard
4. **Test payment flow** end-to-end

## Support

If you encounter issues:
1. Check browser console for errors
2. Test backend endpoints directly
3. Verify Razorpay credentials
4. Check Vercel deployment logs