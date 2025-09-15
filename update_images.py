import os
from supabase import create_client, Client

# Supabase configuration
url = "https://ixqjqvqhqjqjqvqhqjqj.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxdnFocWpxanF2cWhxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDI0MDAsImV4cCI6MjA1MTQ3ODQwMH0.placeholder"

# Initialize Supabase client
supabase: Client = create_client(url, key)

def update_placeholder_images():
    try:
        # Fetch all products
        response = supabase.table('products').select('*').execute()
        products = response.data
        
        placeholder_url = "https://placehold.co/300x400?text=Sample"
        
        for product in products:
            # Update images array with placeholder
            updated_data = {
                'images': [placeholder_url]
            }
            
            # Update the product
            supabase.table('products').update(updated_data).eq('id', product['id']).execute()
            print(f"Updated product: {product['name']}")
        
        print(f"Successfully updated {len(products)} products with placeholder images")
        
    except Exception as e:
        print(f"Error updating images: {e}")

if __name__ == "__main__":
    update_placeholder_images()