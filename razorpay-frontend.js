// Razorpay Frontend Integration
class RazorpayPayment {
    constructor(backendUrl) {
        this.backendUrl = backendUrl || (window.CONFIG ? window.CONFIG.getBackendUrl() : 'http://localhost:5000');
    }

    async createOrder(amount, currency = 'INR') {
        try {
            const response = await fetch(`${this.backendUrl}/api/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    amount, 
                    currency,
                    receipt: `order_${Date.now()}`
                })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    async verifyPayment(paymentData) {
        try {
            const response = await fetch(`${this.backendUrl}/api/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    }

    async initiatePayment(orderAmount, customerDetails = {}) {
        try {
            // Create order on backend
            const orderData = await this.createOrder(orderAmount);

            // Razorpay options
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Shagun Saree Baran',
                description: 'Saree Purchase',
                order_id: orderData.order_id,
                handler: async (response) => {
                    // Verify payment on backend
                    const verificationResult = await this.verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (verificationResult.success) {
                        this.onPaymentSuccess(verificationResult);
                    } else {
                        this.onPaymentFailure(verificationResult);
                    }
                },
                prefill: {
                    name: customerDetails.name || '',
                    email: customerDetails.email || '',
                    contact: customerDetails.mobile || ''
                },
                theme: {
                    color: '#FF6B6B'
                },
                modal: {
                    ondismiss: () => {
                        this.onPaymentCancel();
                    }
                }
            };

            // Open Razorpay checkout
            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment initiation failed:', error);
            this.onPaymentFailure({ message: error.message });
        }
    }

    onPaymentSuccess(data) {
        console.log('Payment successful:', data);
        
        // Get order context to determine flow type
        const orderContext = JSON.parse(localStorage.getItem('orderContext') || '{}');
        const isBuyNow = orderContext.isBuyNow || false;
        const orderItems = orderContext.items || null;
        const orderAmount = orderContext.amount || 0;
        
        console.log('Processing order with context:', orderContext);
        
        // Process successful order
        if (typeof processOrder === 'function') {
            const result = processOrder(orderAmount, 'razorpay', orderItems, isBuyNow);
            if (result) {
                // Clean up order context
                localStorage.removeItem('orderContext');
                console.log('Order processed successfully, redirecting...');
            } else {
                // Fallback if processOrder fails
                alert('✅ Payment Successful! Your order has been placed.');
                setTimeout(() => window.location.href = 'index.html', 2000);
            }
        } else {
            // Fallback if processOrder function doesn't exist
            alert('✅ Payment Successful! Your order has been placed.');
            setTimeout(() => window.location.href = 'index.html', 2000);
        }
    }

    onPaymentFailure(data) {
        console.error('Payment failed:', data);
        alert('Payment failed: ' + (data.message || 'Unknown error'));
        
        // Re-enable payment button
        const activeBtn = document.getElementById('payNowBtn') || document.getElementById('placeOrderBtn');
        if (activeBtn) {
            activeBtn.disabled = false;
            activeBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pay Now with Razorpay';
        }
    }

    onPaymentCancel() {
        console.log('Payment cancelled by user');
        alert('Payment cancelled');
        
        // Re-enable payment button
        const activeBtn = document.getElementById('payNowBtn') || document.getElementById('placeOrderBtn');
        if (activeBtn) {
            activeBtn.disabled = false;
            activeBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pay Now with Razorpay';
        }
    }
}

// Initialize Razorpay payment instance
const razorpayPayment = new RazorpayPayment();

// Function to integrate with existing checkout
function initializeRazorpayCheckout(orderAmount, customerDetails) {
    razorpayPayment.initiatePayment(orderAmount, customerDetails);
}