How to set up Order Management in Supabase

1) Open Supabase SQL Editor
   - Copy contents of `order_management_setup.sql`
   - Paste and run once (this creates the RPC, schema, RLS, and realtime config)

2) Verify
   - `products` has `stock` (int) and `status` (text)
   - Function `public.deduct_stock(product_id int, quantity_to_deduct int)` exists
   - `orders` table exists with the listed columns
   - Realtime is enabled for `products` (UPDATE) and `orders` (INSERT)

3) Test
   - Set a product stock to 1
   - Place an order
   - Stock becomes 0 and `status` becomes `out-of-stock`
   - Admin Panel shows the new order; main site shows Out of Stock

CLI alternative (optional)
If you use Supabase CLI, you can run this file as part of your migrations or with `supabase db remote commit`.

