import razorpay
import hmac
import hashlib
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_SECRET')))

@app.route('/create-order', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        amount = int(data.get('amount', 0)) * 100  # Convert to paise
        currency = data.get('currency', 'INR')
        
        # Create Razorpay order
        order_data = {
            'amount': amount,
            'currency': currency,
            'payment_capture': 1
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        return jsonify({
            'success': True,
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'key_id': os.getenv('RAZORPAY_KEY_ID')
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/verify-payment', methods=['POST'])
def verify_payment():
    try:
        data = request.get_json()
        
        # Get payment details from frontend
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        
        # Create signature for verification
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        secret = os.getenv('RAZORPAY_SECRET')
        
        generated_signature = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Verify signature
        if hmac.compare_digest(generated_signature, razorpay_signature):
            # Payment is verified - save to database here
            return jsonify({
                'success': True,
                'message': 'Payment verified successfully',
                'payment_id': razorpay_payment_id
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Payment verification failed'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)