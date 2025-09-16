# Emerald Retail Site

A static, mobile-first storefront to showcase and sell natural emeralds. Includes products grid, product details, cart (localStorage), and checkout via WhatsApp or inquiry form.

## Structure

- `index.html`: Home with hero and featured products
- `pages/products.html`: Catalog with search and cut filter
- `pages/product.html`: Product details via `?id=`
- `pages/cart.html`: Cart management
- `pages/checkout.html`: Summary and WhatsApp/email checkout
- `data/products.json`: Product seed data
- `assets/css/styles.css`: Global styles
- `assets/js/app.js`: Logic for rendering and cart

## Run locally

You can open `index.html` directly, but for fetch of `data/products.json` most browsers require a local server.

Using Python:

```bash
cd /Users/Saksham/Desktop/Emerald
python3 -m http.server 5500
```

Then open `http://localhost:5500`.

## Deploy

- Any static hosting works (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
- Ensure the site is served from the repository root so relative links resolve.

## Customize

- Replace images in `assets/img/` and update `data/products.json` with your SKUs, prices (INR), and descriptions.
- Set WhatsApp phone number in `pages/checkout.html` via `data-phone` attribute of `#whatsappCheckout`.
- Update email in footer and form action as desired.

## License

Private use.


