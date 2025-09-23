# Order Management System - Shagun Saree Baran

## 📋 Order Flow Overview

### 1. **Customer Places Order**
```
Cart/Buy Now → Address → Checkout → Payment → Order Confirmation
```

### 2. **Order Processing Steps**
1. **Stock Validation** - Check product availability
2. **Payment Processing** - Razorpay integration
3. **Order Creation** - Save to Supabase database
4. **Stock Deduction** - Update product quantities
5. **Order Confirmation** - Show success message

## 🛒 Order Creation Process

### Frontend Flow (`main.js`)
```javascript
// 1. User clicks "Place Order" or "Pay Now"
handlePlaceOrderWithPayment(isBuyNow) 
  ↓
// 2. Validate user login and items
checkUserAuth() && validateItems()
  ↓
// 3. Initialize Razorpay payment
initializeRazorpay(total, orderItems, isBuyNow)
  ↓
// 4. On payment success
handlePaymentCompletion(paymentId, orderId)
  ↓
// 5. Process and save order
processOrder(total, 'razorpay', orderItems, isBuyNow, paymentId)
```

### Order Data Structure
```javascript
const order = {
    user_id: "user123",
    items: [
        {
            id: 1,
            name: "Silk Saree",
            price: 15000,
            quantity: 1,
            image: "image_url"
        }
    ],
    total_amount: 15000,
    shipping_addr: {
        firstName: "John",
        lastName: "Doe",
        email: "john@email.com",
        mobile: "9876543210",
        addressLine1: "123 Street",
        city: "City",
        state: "State",
        pincode: "123456"
    },
    status: "confirmed",
    payment_method: "razorpay",
    payment_id: "pay_xyz123"
}
```

## 💳 Payment Integration

### Razorpay Flow
1. **Create Order** - Backend creates Razorpay order
2. **Open Gateway** - Frontend opens Razorpay checkout
3. **Payment Success** - Razorpay returns payment details
4. **Verify Payment** - Backend verifies payment signature
5. **Complete Order** - Save order to database

### Payment Files
- `razorpay-frontend.js` - Frontend payment handling
- `payment-integration.js` - Payment manager
- `backend/api/create-order.js` - Create Razorpay order
- `backend/api/verify-payment.js` - Verify payment

## 🗄️ Database Schema

### Orders Table (Supabase)
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_addr JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Order Status Values
- `pending` - Order placed, awaiting confirmation
- `confirmed` - Payment confirmed, processing
- `shipped` - Order dispatched
- `delivered` - Order completed
- `cancelled` - Order cancelled

## 📱 Admin Order Management

### Admin Panel Features (`admin/app.js`)
1. **View All Orders** - `loadOrders()` function
2. **Order Details** - `viewOrder(orderId)` modal
3. **Status Updates** - `updateOrderStatus(orderId, status)`
4. **Customer Info** - Full shipping and contact details

### Admin Order Display
```javascript
// Orders table shows:
- Order ID (last 8 digits)
- Customer name
- Items count
- Total amount
- Status badge
- Payment method
- Order date
- Action buttons (View, Confirm, Ship)
```

## 🔄 Order Status Updates

### Frontend Status Update
```javascript
async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);
}
```

### Status Flow
```
pending → confirmed → shipped → delivered
    ↓
cancelled (can happen at any stage)
```

---

# Out-of-Stock Management System

## 🏗️ Database Structure

### Products Table Schema
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active',
    category VARCHAR(100),
    description TEXT,
    images JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Stock Status Values
- `active` - Product available for purchase
- `out-of-stock` - Product unavailable

## 📦 Stock Management Functions

### 1. **Stock Deduction** (`stock-functions.sql`)
```sql
CREATE OR REPLACE FUNCTION deduct_stock(product_id bigint, quantity_to_deduct integer)
RETURNS boolean AS $$
BEGIN
    UPDATE products 
    SET stock = GREATEST(0, stock - quantity_to_deduct),
        status = CASE 
            WHEN (stock - quantity_to_deduct) <= 0 THEN 'out-of-stock'
            ELSE 'active'
        END
    WHERE id = product_id AND stock >= quantity_to_deduct;
    
    RETURN FOUND;
END;
$$;
```

### 2. **Stock Validation** (`stock-manager.js`)
```javascript
// Check if product has sufficient stock
async function validateOrderStock(orderItems) {
    for (const item of orderItems) {
        const { data } = await supabase
            .from('products')
            .select('stock, status')
            .eq('id', item.id)
            .single();
        
        if (data.status === 'out-of-stock' || data.stock < item.quantity) {
            return { valid: false, productName: item.name };
        }
    }
    return { valid: true };
}
```

## 🔍 Stock Validation Points

### 1. **Pre-Order Validation** (Before payment)
- Check stock when user clicks "Place Order"
- Prevent payment if any item is out of stock

### 2. **Final Validation** (Before order creation)
- Real-time check against database
- Prevents race conditions between multiple users

### 3. **Stock Deduction** (After successful payment)
- Automatically deduct ordered quantities
- Update status to 'out-of-stock' if stock reaches 0

## 🎨 Frontend Display Logic

### 1. **Product Filtering** (`main.js`)
```javascript
// Products are shown but disabled if out-of-stock
// No filtering - all products visible with appropriate styling
```

### 2. **Out-of-Stock Styling** (`out-of-stock-styles.css`)
```css
/* Product card styling */
.product-card[data-status="out-of-stock"] {
    opacity: 0.6;
}

/* Image overlay */
.out-of-stock-overlay {
    position: absolute;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Button replacement */
.out-of-stock-label {
    background: #dc3545;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
}
```

### 3. **Conditional Rendering**
```javascript
// Replace action buttons with out-of-stock label
${product.status === 'out-of-stock' ? 
    '<div class="out-of-stock-label">Out of Stock</div>' :
    '<button class="add-to-cart-btn">Add to Cart</button>'
}

// Add overlay on product images
${product.status === 'out-of-stock' ? 
    '<div class="out-of-stock-overlay">Out of Stock</div>' : ''
}
```

## 🔄 Real-time Updates

### Supabase Real-time Subscription (`realtime-stock.js`)
```javascript
// Listen for product updates
supabase
    .channel('products-stock')
    .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => handleStockUpdate(payload)
    )
    .subscribe();

// Update UI when stock changes
function handleStockUpdate(payload) {
    // Refresh product displays
    displayProducts(products);
    loadFeaturedProducts();
}
```

## 🛡️ Error Handling

### Stock Validation Errors
```javascript
// Specific error messages based on validation failure
if (data.status === 'out-of-stock') {
    throw new Error(`${item.name}: Product is out of stock`);
}
if (data.stock < item.quantity) {
    throw new Error(`${item.name}: Only ${data.stock} items available`);
}
```

### User-Friendly Messages
- "Product is out of stock"
- "Only X items available"
- "Product not found"

## 📊 Admin Stock Management

### Admin Panel Features
1. **Stock Display** - Current stock levels in product table
2. **Out-of-Stock Badge** - Red badge for zero stock products
3. **Stock Updates** - Edit product stock quantities
4. **Real-time Sync** - Automatic updates across admin and website

### Admin Stock Indicators
```javascript
// Red badge for out-of-stock products
${(product.stock === 0 || product.status === 'out-of-stock') ? 
    '<span class="out-of-stock-badge">Out of Stock</span>' : ''
}
```

## 🔧 Configuration Files

### Key Files
- `stock-manager.js` - Stock validation functions
- `realtime-stock.js` - Real-time updates
- `out-of-stock-styles.css` - Visual styling
- `setup-stock-management.sql` - Database setup
- `stock-functions.sql` - Database functions

This system ensures accurate inventory management with real-time updates and prevents overselling through multiple validation layers.