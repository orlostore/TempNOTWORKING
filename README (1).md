# ORLO E-Commerce Platform

A modern, bilingual (English/Arabic) e-commerce website for the UAE market, built with vanilla JavaScript and Cloudflare Pages.

![ORLO Logo](logo.png)

---

## 🌟 Features

### Customer-Facing
- **Bilingual Support** - Full English/Arabic interface throughout
- **Mobile-First Design** - Responsive layout optimized for all devices
- **Product Catalog** - Category filtering, search, product details
- **Shopping Cart** - Add/remove items, quantity management
- **Smart Upselling** - Suggests products to reach free delivery threshold
- **Secure Checkout** - Stripe payment integration
- **Real-Time Inventory** - Out-of-stock items automatically disabled

### Admin Features
- **Admin Dashboard** - Beautiful, branded management interface
- **Product Management** - Add, edit, delete products
- **Inventory Tracking** - Real-time stock levels with color-coded alerts
- **Quick Stock Updates** - One-click quantity adjustments
- **Search & Filter** - Find products instantly

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare D1 (SQLite) |
| Payments | Stripe Checkout |
| Hosting | Cloudflare Pages |
| Fonts | Inter (English), Almarai (Arabic) |

---

## 📁 Project Structure

```
orlo/
├── index.html              # Homepage
├── product.html            # Product detail page
├── admin.html              # Admin dashboard
├── success.html            # Payment success page
├── cancel.html             # Payment cancelled page
├── app.js                  # Main application logic
├── products.js             # Product fetching & caching
├── product.js              # Product page logic
├── styles.css              # All styles
├── logo.png                # Brand logo
│
└── functions/              # Cloudflare Pages Functions
    ├── checkout.js         # Stripe checkout + stock verification
    ├── webhook.js          # Stripe webhook + inventory deduction
    │
    └── api/
        ├── products.js     # GET /api/products - Serve products
        │
        └── admin/
            ├── product.js  # CRUD operations for products
            ├── restock.js  # Quick stock updates
            └── import.js   # Import from Google Sheets (optional)
```

---

## ⚙️ Setup Guide

### Prerequisites
- GitHub account
- Cloudflare account (free tier works)
- Stripe account (for payments)

### Step 1: Deploy to Cloudflare Pages

1. Push this repository to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Workers & Pages** → **Create application** → **Pages**
4. Connect your GitHub repository
5. Deploy

### Step 2: Create D1 Database

1. In Cloudflare Dashboard, go to **Workers & Pages** → **D1**
2. Click **Create database**
3. Name it: `orlo-inventory`
4. Go to **Console** tab and run:

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nameAr TEXT,
  description TEXT,
  descriptionAr TEXT,
  price REAL NOT NULL,
  quantity INTEGER DEFAULT 0,
  category TEXT,
  categoryAr TEXT,
  featured INTEGER DEFAULT 0,
  mainImage TEXT,
  image2 TEXT,
  image3 TEXT,
  image4 TEXT,
  image5 TEXT,
  colors TEXT,
  colorsAr TEXT,
  packaging TEXT,
  packagingAr TEXT,
  specifications TEXT,
  specificationsAr TEXT
);
```

### Step 3: Bind D1 to Pages

1. Go to your Pages project → **Settings** → **Bindings**
2. Add binding:
   - Variable name: `DB`
   - D1 database: `orlo-inventory`
3. Save

### Step 4: Configure Stripe

1. Get your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. In Cloudflare Pages → **Settings** → **Environment variables**
3. Add:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (or `sk_test_...` for testing)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (optional, for webhook verification)

### Step 5: Set Up Stripe Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://your-site.pages.dev/webhook`
3. Select event: `checkout.session.completed`
4. Copy webhook secret to Cloudflare environment variables

---

## 🔐 Admin Access

### URL
```
https://your-site.pages.dev/admin.html
```

Or with auto-login:
```
https://your-site.pages.dev/admin.html?key=YOUR_ADMIN_KEY
```

### Default Admin Key
```
Sy$tem88
```

⚠️ **Change this in production!** Edit the `ADMIN_KEY` constant in:
- `/admin.html`
- `/functions/api/admin/product.js`
- `/functions/api/admin/restock.js`
- `/functions/api/admin/import.js`

---

## 📡 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| POST | `/checkout` | Create Stripe checkout session |
| POST | `/webhook` | Stripe webhook handler |

### Admin (requires `?key=ADMIN_KEY`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/product?action=add` | Add new product |
| POST | `/api/admin/product?action=update&id=X` | Update product |
| GET | `/api/admin/product?action=delete&id=X` | Delete product |
| GET | `/api/admin/restock?slug=X&set=50` | Set quantity to 50 |
| GET | `/api/admin/restock?slug=X&add=20` | Add 20 to quantity |
| GET | `/api/admin/import` | Import from Google Sheets |

---

## 🛒 How It Works

### Checkout Flow

```
1. Customer adds items to cart
           ↓
2. Customer clicks "Pay with Card"
           ↓
3. /checkout verifies stock in D1
           ↓
4. If stock OK → Create Stripe session
   If out of stock → Show error
           ↓
5. Customer completes payment on Stripe
           ↓
6. Stripe calls /webhook
           ↓
7. Webhook deducts quantities from D1
           ↓
8. Customer redirected to success.html
           ↓
9. Receipt email sent automatically
```

### Inventory Management

- **Real-time tracking** - Stock checked at checkout
- **Automatic deduction** - Webhook updates after payment
- **Out-of-stock protection** - Customers can't buy unavailable items
- **Low stock alerts** - Admin dashboard shows yellow/red warnings

---

## 🎨 Customization

### Branding
- Replace `logo.png` with your logo
- Edit colors in `styles.css` (`:root` section):
  ```css
  :root {
    --primary: #2c4a5c;    /* Main brand color */
    --accent: #e07856;     /* Accent/CTA color */
  }
  ```

### Delivery Settings
Edit in `app.js`:
```javascript
const FREE_DELIVERY_THRESHOLD = 75;  // AED

const deliveryZones = {
    dubai: { fee: 18, freeThreshold: 75 },
    // ...
};
```

### Adding New Fields
1. Add column to D1 table:
   ```sql
   ALTER TABLE products ADD COLUMN newField TEXT;
   ```
2. Update `/functions/api/products.js` to include field
3. Update `/functions/api/admin/product.js` for CRUD
4. Update `admin.html` form

---

## 🔧 Troubleshooting

### Products not loading
- Check D1 binding is configured
- Check `/api/products` returns data
- Check browser console for errors

### Checkout not working
- Verify `STRIPE_SECRET_KEY` is set
- Check Stripe dashboard for errors
- Ensure D1 binding exists

### Webhook not deducting stock
- Verify webhook URL in Stripe
- Check `STRIPE_WEBHOOK_SECRET` matches
- Check Cloudflare logs for errors

### Admin page not loading
- Clear browser cache
- Check admin key is correct
- Verify `/api/admin/product.js` is deployed

---

## 📊 D1 Database Commands

### View all products
```sql
SELECT slug, name, quantity FROM products;
```

### Update quantity manually
```sql
UPDATE products SET quantity = 50 WHERE slug = 'product-slug';
```

### Add product manually
```sql
INSERT INTO products (slug, name, price, quantity, category)
VALUES ('new-item', 'New Item', 25, 100, 'Category');
```

### Delete product
```sql
DELETE FROM products WHERE slug = 'product-slug';
```

### Check low stock
```sql
SELECT name, quantity FROM products WHERE quantity < 10;
```

---

## 💰 Pricing & Limits

### Cloudflare Free Tier
| Resource | Limit |
|----------|-------|
| Pages requests | Unlimited |
| D1 Storage | 5 GB |
| D1 Reads | 5 million/day |
| D1 Writes | 100,000/day |
| Workers requests | 100,000/day |

This is more than enough for most small-medium e-commerce stores.

### Stripe Fees (UAE)
- 2.9% + 1 AED per successful transaction
- No monthly fees
- No setup fees

---

## 🚀 Performance

- **Instant page loads** - Static HTML/CSS/JS served from Cloudflare edge
- **60-second cache** - Products API cached for fast repeat loads
- **LocalStorage cache** - Products load instantly from browser cache
- **Background refresh** - Fresh data fetched without blocking UI
- **Global CDN** - Cloudflare serves from 300+ locations worldwide

---

## 🔒 Security

- **Admin key protection** - All admin endpoints require authentication
- **Stripe webhook verification** - Optional signature validation
- **No sensitive data stored** - Payments handled entirely by Stripe
- **HTTPS everywhere** - Cloudflare provides free SSL
- **Input validation** - All user inputs sanitized

---

## 📱 Mobile Features

- **Bottom navigation** - Easy thumb access to Home, Cart, Menu
- **Swipeable gallery** - Product images carousel
- **Fixed checkout button** - Always visible in cart
- **Touch-optimized** - Large tap targets throughout
- **Fast loading** - Optimized for mobile networks

---

## 🌐 Bilingual Support

All user-facing content supports both English and Arabic:

| Element | Implementation |
|---------|----------------|
| Product names | `name` / `nameAr` fields |
| Descriptions | `description` / `descriptionAr` fields |
| Categories | `category` / `categoryAr` fields |
| UI text | Hardcoded in HTML with both languages |
| Arabic font | Almarai (Google Fonts) |
| RTL support | `dir="rtl"` and `.arabic-text` class |

---

## 📈 Future Enhancements

Potential features to add:

- [ ] Customer accounts & order history
- [ ] Discount codes / coupons
- [ ] Email notifications (order confirmation, shipping)
- [ ] Product reviews & ratings
- [ ] Wishlist functionality
- [ ] Multiple product variants (size, color)
- [ ] Analytics dashboard
- [ ] Bulk import/export
- [ ] Multi-currency support

---

## 🤝 Support

For questions or issues:

- **Email**: info@orlostore.com
- **WhatsApp**: +971 XX XXX XXXX

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Credits

Built with:
- [Cloudflare Pages](https://pages.cloudflare.com) - Hosting & Functions
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - Database
- [Stripe](https://stripe.com) - Payment processing
- [Google Fonts](https://fonts.google.com) - Inter & Almarai fonts

---

**Made with ❤️ in Dubai, UAE**
