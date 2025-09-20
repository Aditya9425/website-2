# Order Management Setup Guide

This guide will help you set up the order management system that stores orders in the database and allows users to view their orders.

## What's Been Added

### 1. Backend API Endpoints
- `POST /api/save-order` - Saves orders to Supabase database
- `GET /api/get-orders?user_id=<id>` - Gets orders for a specific user
- `GET /api/admin-orders` - Gets all orders for admin panel

### 2. Database Integration
- Orders are now saved to the Supabase `orders` table
- User authentication is required for order placement
- Orders are linked to user IDs for proper filtering

### 3. Frontend Updates
- Payment integration now saves orders to database
- Profile page shows orders from database with localStorage fallback
- Order details modal for viewing complete order information
- Admin panel displays orders from database

## Setup Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install @supabase/supabase-js
```

### 2. Environment Variables
Make sure your backend `.env` file includes:
```
SUPABASE_URL=https://jstvadizuzvwhabtfhfs.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Database Schema
Your `orders` table should have these columns:
- `id` (uuid, primary key, auto-generated)
- `user_id` (uuid, references users table)
- `total_amount` (numeric)
- `status` (text, default: 'pending')
- `shipping_addr` (jsonb)
- `items` (jsonb)
- `created_at` (timestamp, default: now())

### 4. Start the Backend Server
```bash
cd backend
npm start
```

### 5. Test the System

#### Place a Test Order:
1. Login to the website
2. Add items to cart or use "Buy Now"
3. Fill in delivery address
4. Complete payment with Razorpay
5. Order should be saved to database

#### View Orders:
1. Go to Profile page
2. Click on "Orders" tab
3. Orders should load from database
4. Click "View Details" to see full order information

#### Admin Panel:
1. Login to admin panel
2. Go to "Order Management" section
3. All orders should be visible
4. Click eye icon to view order details

## Features

### User Features
- ✅ Orders saved to database with user ID
- ✅ View order history in profile
- ✅ Order details modal
- ✅ Fallback to localStorage if database fails
- ✅ User-specific order filtering

### Admin Features
- ✅ View all orders in admin panel
- ✅ Order details view
- ✅ Order status management
- ✅ Customer information display

### Technical Features
- ✅ Database integration with Supabase
- ✅ User authentication required
- ✅ Error handling and fallbacks
- ✅ Proper data validation
- ✅ CORS configuration

## Troubleshooting

### Orders Not Saving
1. Check backend server is running
2. Verify Supabase credentials in .env
3. Check browser console for errors
4. Ensure user is logged in

### Orders Not Loading
1. Check network tab for API calls
2. Verify user ID is present in session
3. Check backend logs for errors
4. Fallback to localStorage should work

### Admin Panel Issues
1. Ensure backend API is accessible
2. Check CORS configuration
3. Verify admin authentication

## Next Steps

1. **Email Notifications**: Add order confirmation emails
2. **Order Status Updates**: Real-time status tracking
3. **Inventory Management**: Update stock after orders
4. **Payment Webhooks**: Handle payment status updates
5. **Order Cancellation**: Allow users to cancel orders
6. **Bulk Operations**: Admin bulk order management

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend server logs
3. Verify all environment variables are set
4. Test with a simple order first

The system is designed to be robust with fallbacks, so even if the database is unavailable, orders will be saved locally and can be synced later.