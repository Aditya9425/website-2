from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from datetime import datetime
from config import Config

app = Flask(__name__)
CORS(app)

# Supabase configuration
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

@app.route('/')
def home():
    return jsonify({
        "message": "Shagun Saree E-commerce API",
        "version": "1.0",
        "endpoints": {
            "GET /": "API info",
            "GET /products": "Get all products",
            "GET /products/<id>": "Get product by ID",
            "POST /products": "Add new product"
        }
    })

@app.route('/products', methods=['GET'])
def get_products():
    try:
        response = supabase.table('products').select('*').execute()
        return jsonify({
            "success": True,
            "data": response.data,
            "count": len(response.data)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        response = supabase.table('products').select('*').eq('id', product_id).execute()
        if response.data:
            return jsonify({"success": True, "data": response.data[0]})
        return jsonify({"success": False, "error": "Product not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/products', methods=['POST'])
def add_product():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'price', 'category', 'fabric']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        # Prepare product data
        product_data = {
            "name": data['name'],
            "price": float(data['price']),
            "original_price": float(data.get('original_price', data['price'])),
            "category": data['category'],
            "fabric": data['fabric'],
            "description": data.get('description', ''),
            "images": data.get('images', []),
            "colors": data.get('colors', []),
            "sizes": data.get('sizes', ['Free Size']),
            "rating": float(data.get('rating', 0)),
            "reviews": int(data.get('reviews', 0)),
            "in_stock": bool(data.get('in_stock', True)),
            "linked_variants": data.get('linked_variants', []),
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table('products').insert(product_data).execute()
        return jsonify({"success": True, "data": response.data[0]}), 201
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        data['updated_at'] = datetime.now().isoformat()
        
        response = supabase.table('products').update(data).eq('id', product_id).execute()
        if response.data:
            return jsonify({"success": True, "data": response.data[0]})
        return jsonify({"success": False, "error": "Product not found"}), 404
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        response = supabase.table('products').delete().eq('id', product_id).execute()
        return jsonify({"success": True, "message": "Product deleted"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=Config.PORT)