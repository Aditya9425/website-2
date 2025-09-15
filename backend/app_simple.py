from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Sample products data (in-memory for now)
products = [
    {
        "id": 1,
        "name": "Silk Banarasi Saree",
        "price": 15000,
        "original_price": 18000,
        "images": ["https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Silk+Banarasi"],
        "category": "silk",
        "rating": 4.8,
        "reviews": 156,
        "description": "Exquisite Banarasi silk saree with intricate zari work",
        "colors": ["Red", "Green", "Blue"],
        "sizes": ["Free Size"],
        "fabric": "Silk",
        "in_stock": True,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "id": 2,
        "name": "Cotton Handloom Saree",
        "price": 2500,
        "original_price": 3000,
        "images": ["https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Cotton+Handloom"],
        "category": "cotton",
        "rating": 4.5,
        "reviews": 89,
        "description": "Comfortable cotton handloom saree for daily wear",
        "colors": ["White", "Beige", "Pink"],
        "sizes": ["Free Size"],
        "fabric": "Cotton",
        "in_stock": True,
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "id": 3,
        "name": "Designer Georgette Saree",
        "price": 8000,
        "original_price": 10000,
        "images": ["https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=Designer+Georgette"],
        "category": "designer",
        "rating": 4.7,
        "reviews": 203,
        "description": "Elegant designer georgette saree with modern aesthetics",
        "colors": ["Purple", "Teal", "Maroon"],
        "sizes": ["Free Size"],
        "fabric": "Georgette",
        "in_stock": True,
        "created_at": "2024-01-01T00:00:00"
    }
]

@app.route('/')
def home():
    return jsonify({
        "message": "Shagun Saree E-commerce API",
        "version": "1.0",
        "status": "running"
    })

@app.route('/products', methods=['GET'])
def get_products():
    return jsonify({
        "success": True,
        "data": products,
        "count": len(products)
    })

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify({"success": True, "data": product})
    return jsonify({"success": False, "error": "Product not found"}), 404

@app.route('/products', methods=['POST'])
def add_product():
    data = request.get_json()
    new_id = max([p['id'] for p in products]) + 1 if products else 1
    
    new_product = {
        "id": new_id,
        "name": data.get('name'),
        "price": data.get('price'),
        "original_price": data.get('original_price', data.get('price')),
        "images": data.get('images', []),
        "category": data.get('category'),
        "rating": data.get('rating', 0),
        "reviews": data.get('reviews', 0),
        "description": data.get('description', ''),
        "colors": data.get('colors', []),
        "sizes": data.get('sizes', ['Free Size']),
        "fabric": data.get('fabric'),
        "in_stock": data.get('in_stock', True),
        "created_at": datetime.now().isoformat()
    }
    
    products.append(new_product)
    return jsonify({"success": True, "data": new_product}), 201

if __name__ == '__main__':
    print("🚀 Starting Shagun Saree Backend...")
    print("📍 Server running at: http://localhost:5000")
    print("🛍️ Products available:", len(products))
    app.run(debug=True, host='0.0.0.0', port=5000)