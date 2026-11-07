# Amar Shopping

Bangladesh-focused Bengali-first multi-vendor marketplace using BDT (৳), Supabase Auth, database and Storage.

## Live preview
https://ranaahmmed7262.github.io/Amar-shopping-/

## Implemented
- Bengali storefront with product search and category filters
- Customer signup/login using Supabase Auth
- Product catalog, cart and stock-checked checkout via Supabase RPC
- Seller applications and admin approval workflow
- Seller product submission with image upload to Supabase Storage
- Customer order history, seller panel and admin order status controls
- Cash on Delivery plus manual bKash/Nagad selection
- SEO metadata, sitemap.xml and robots.txt

## Not yet production-complete
- Admin account has not been provisioned; the owner's email is needed to establish the first admin.
- bKash/Nagad are manual payment choices only. No live merchant gateway or payment callback is connected.
- Courier integration, SMS/OTP, seller payouts and a custom domain are not configured.
- Google indexing is not guaranteed; verify the site in Google Search Console and submit the sitemap.
- GitHub Pages hosts a static frontend. Keep Supabase service-role/secret keys out of all browser code; only the publishable key belongs in the frontend.

## Deployment
A push to `main` triggers `.github/workflows/pages.yml` and deploys to GitHub Pages. Supabase schema, RLS, Storage and RPC are configured separately in the connected Supabase project.
