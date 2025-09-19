// Razorpay Frontend Integration
class RazorpayPayment {
    constructor(backendUrl = 'http://localhost:5000') {
        this.backendUrl = backendUrl;
    }

    async createOrder(amount, currency = 'INR') {
        try {
            const response = await fetch(`${this.backendUrl}/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount, currency })
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
            const response = await fetch(`${this.backendUrl}/verify-payment`, {
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
        alert('Payment successful! Order placed.');
        // Process successful order here
        if (typeof processOrder === 'function') {
            processOrder(data.payment_id, 'razorpay');
        }
    }

    onPaymentFailure(data) {
        console.error('Payment failed:', data);
        alert('Payment failed: ' + (data.message || 'Unknown error'));
    }

    onPaymentCancel() {
        console.log('Payment cancelled by user');
        alert('Payment cancelled');
    }
}

// Initialize Razorpay payment instance
const razorpayPayment = new RazorpayPayment();

// Function to integrate with existing checkout
function initializeRazorpayCheckout(orderAmount, customerDetails) {
    razorpayPayment.initiatePayment(orderAmount, customerDetails);
}