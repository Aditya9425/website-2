# Partial COD Feature Implementation

## Overview
The Partial COD (Cash on Delivery) feature allows customers to pay ₹200 upfront via Razorpay and pay the remaining amount on delivery.

## How It Works

### Customer Flow
1. **Checkout Page**: Customer sees two payment options:
   - **Pay Full Amount**: Traditional full payment via Razorpay
   - **Partial COD**: Pay ₹200 now, rest on delivery (marked as "Popular")

2. **Payment Selection**: When Partial COD is selected:
   - Payment breakdown shows: "Pay Now: ₹200" and "Pay on Delivery: ₹(total-200)"
   - Pay button changes to "Pay ₹200 Now"

3. **Payment Process**: 
   - Customer pays ₹200 via Razorpay gateway
   - Order is confirmed only after successful ₹200 payment
   - Order confirmation shows payment breakdown

### Database Storage
Orders with Partial COD are stored with:
- `partial_payment_amount`: ₹200
- `remaining_due`: (total - ₹200)
- `payment_type`: 'partial'

### Admin Interface
- Access via `admin-partial-cod.html`
- Shows all partial COD orders with status "Partially Paid – COD balance due"
- Displays statistics: partial orders count, pending COD amount
- Real-time updates every 30 seconds

## Files Modified/Created

### Modified Files
1. **checkout.html**: Added payment type selection UI
2. **main.js**: Added Partial COD logic and payment processing

### New Files
1. **partial-cod-styles.css**: Styles for payment selection interface
2. **admin-partial-cod.html**: Admin panel for managing partial COD orders
3. **partial-cod-schema.sql**: Database schema updates
4. **PARTIAL-COD-README.md**: This documentation

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `partial-cod-schema.sql` in your Supabase SQL editor:
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS partial_payment_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remaining_due DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'full';
```

### 2. File Deployment
Ensure all files are uploaded to your web server:
- `partial-cod-styles.css`
- `admin-partial-cod.html`
- Updated `checkout.html`
- Updated `main.js`

### 3. Testing
1. Go to checkout page
2. Select "Partial COD" option
3. Verify payment breakdown shows correctly
4. Complete ₹200 payment
5. Check admin panel for the order

## Technical Details

### Payment Flow
```javascript
// Payment type detection
function getSelectedPaymentType() {
    const partialCOD = document.getElementById('partialCOD');
    return partialCOD && partialCOD.checked ? 'partial' : 'full';
}

// Payment amount calculation
const paymentAmount = paymentType === 'partial' ? 200 : total;
```

### Order Processing
```javascript
// Order object includes partial payment fields
const order = {
    // ... other fields
    partial_payment_amount: paymentType === 'partial' ? 200 : null,
    remaining_due: paymentType === 'partial' ? calculatedTotal - 200 : null,
    payment_type: paymentType
};
```

## Admin Features
- **Dashboard**: View all partial COD orders
- **Statistics**: Track partial vs full payments
- **Order Details**: See payment breakdown for each order
- **Real-time Updates**: Auto-refresh every 30 seconds

## Security Considerations
- ₹200 payment is processed through secure Razorpay gateway
- Order is created only after successful payment verification
- All payment data is encrypted and stored securely

## Future Enhancements
- Configurable partial payment amount (instead of fixed ₹200)
- SMS/Email notifications for delivery agents about COD balance
- Integration with delivery tracking systems
- Customer portal to view partial payment history

## Support
For any issues or questions regarding the Partial COD feature, please check:
1. Browser console for JavaScript errors
2. Supabase logs for database issues
3. Razorpay dashboard for payment issues