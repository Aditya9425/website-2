# Shagun Saree Backend - Vercel Deployment

## Quick Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

## Environment Variables

Set these in Vercel dashboard:

- `RAZORPAY_KEY_ID` - Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay Key Secret
- `NODE_ENV` - Set to "production"

## API Endpoints

- `GET /health` - Health check
- `POST /api/create-order` - Create Razorpay order
- `POST /api/verify-payment` - Verify payment
- `GET /api/payment-status/:id` - Get payment status

## Frontend Integration

Update your frontend URLs from:
```javascript
const backendUrl = 'http://localhost:5000';
```

To your Vercel URL:
```javascript
const backendUrl = 'https://your-app.vercel.app';
```