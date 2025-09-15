# Shagun Saree E-commerce Backend

Flask backend with Supabase integration for the saree e-commerce website.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Supabase:**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key
   - Run the SQL schema in your Supabase dashboard

3. **Run the application:**
   ```bash
   python app.py
   ```

## API Endpoints

- `GET /` - API information
- `GET /products` - Get all products
- `GET /products/<id>` - Get product by ID
- `POST /products` - Add new product
- `PUT /products/<id>` - Update product
- `DELETE /products/<id>` - Delete product

## Example Product JSON

```json
{
  "name": "Silk Saree",
  "price": 5000,
  "original_price": 6000,
  "category": "silk",
  "fabric": "Silk",
  "description": "Beautiful silk saree",
  "images": ["url1", "url2"],
  "colors": ["Red", "Blue"],
  "sizes": ["Free Size"],
  "rating": 4.5,
  "reviews": 10
}
```