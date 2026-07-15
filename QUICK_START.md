# Firebase Integration Quick Start Guide

## What's New

Your Self Billing System now integrates with Firebase to:
- ✅ Fetch product details dynamically from Firestore
- ✅ Compare scanned QR codes with product database
- ✅ Mark products as paid after successful payment
- ✅ Track payment status in real-time

## 5-Minute Setup

### Step 1: Create Firebase Project (3 mins)
1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Enter project name → Continue
4. Continue through setup (disable Analytics if desired)
5. Click "Create Project"

### Step 2: Copy Firebase Config (1 min)
1. In Firebase Console, click ⚙️ → "Project Settings"
2. Scroll to "Your apps" section
3. Click "Web" app (or add one if needed)
4. Copy the configuration object

### Step 3: Update .env File (1 min)
Create/edit `.env` in your project root:
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Step 4: Create Firestore Database
1. In Firebase Console → "Firestore Database"
2. Click "Create Database"
3. Select **Production Mode** → Choose region → Create

### Step 5: Add Sample Products
In Firebase Console:
1. Go to Firestore Database
2. Create a collection named `products`
3. Create documents with IDs matching your QR codes (e.g., `PROD-0001`)

**Document template:**
```json
{
  "id": "PROD-0001",
  "name": "T-shirt",
  "description": "Premium cotton T-shirt",
  "price": 11.99,
  "rfid_uid": "A7F45C21",
  "paid": false,
  "stock": 10
}
```

## Running the App

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# In another terminal, start the backend server
npm run server
```

Open http://localhost:5173 in your browser.

## Payment Methods Setup

### UPI Payment (Default)
UPI payment is enabled by default. Just make sure your `MERCHANT_UPI_ID` is set in `.env`:
```
MERCHANT_UPI_ID=yourname@bankname
```

### Razorpay Payment (Optional)
To enable Razorpay payments:

1. **Create Razorpay Account**: Sign up at https://razorpay.com
2. **Get API Keys**: 
   - Go to Dashboard → Settings → API Keys
   - Copy Key ID and Key Secret
3. **Add to .env**:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key_here
   ```
4. **Restart backend**: Kill and restart `npm run server`
5. **Test**: The Payment page will show both UPI and Razorpay options

For detailed setup, see [RAZORPAY_INTEGRATION.md](RAZORPAY_INTEGRATION.md)

## Testing the Integration

### Test Scanning
1. Go to "Scanner" page
2. Click "Start Scanning"
3. Scan a QR code in format: `PROD-0001`
4. Product details should load from Firebase
5. Product is added to cart with price and description

**Expected behavior:**
- ✅ Product details fetched from Firestore
- ✅ Price and description displayed
- ✅ Product added to cart
- ❌ If product not in Firebase: "Product not found in database"

### Test Payment Flow

#### With Razorpay (if configured):
1. Add products to cart via scanning
2. Go to Cart → "Proceed to Payment"
3. Click "Pay with Razorpay"
4. Choose payment method (card, wallet, UPI, etc.)
5. Complete payment
6. See success confirmation

**Expected behavior:**
- ✅ Razorpay checkout modal opens
- ✅ Payment is processed
- ✅ Products marked as PAID in Firebase with `payment_method: 'razorpay'`

#### With UPI (always available):
1. Add products to cart via scanning
2. Go to Cart → "Proceed to Payment"
3. Click "Pay with UPI"
4. Complete payment in UPI app
5. Return to app and confirm payment

**Expected behavior:**
- ✅ UPI link opens in new window
- ✅ App polls for payment status
- ✅ On confirmation, products marked as paid in Firebase
- ✅ Check Firebase Console → Firestore: `paid` should be `true` and `paid_at` added

## File Structure

New/Modified files:
```
src/
├── lib/
│   ├── firebase.ts          ← Firebase initialization
│   ├── firebaseService.ts   ← Product & payment operations
│   └── firebaseAdmin.ts     ← Admin utilities
├── pages/
│   ├── Scanner.tsx          ← Updated: fetches from Firebase
│   └── Payment.tsx          ← Updated: marks as paid in Firebase

FIREBASE_SETUP.md            ← Detailed setup guide
FIREBASE_INTEGRATION.md      ← Implementation summary
```

## Common Issues & Solutions

### Issue: "Products not found in database"
**Solution:**
- Check `.env` variables are correct
- Verify Firestore `products` collection exists
- Ensure QR code format is `PROD-XXXX` (uppercase)
- Check document IDs match your QR codes exactly

### Issue: "Payment not confirmed"
**Solution:**
- Ensure backend server is running: `npm run server`
- Check RFID endpoint is accessible at `http://localhost:3001`
- Verify product has `rfid_uid` field

### Issue: "Products not marked as paid"
**Solution:**
- Check Firestore has write permissions
- Review security rules in Firebase Console
- Check browser console for Firebase errors
- Ensure products have valid document IDs

### Issue: Firebase errors in console
**Solution:**
- Enable debug logging: `firebase.initializeApp(config, options, DEBUG)`
- Check `.env` file exists and is not in `.gitignore`
- Verify all required variables are set
- Clear browser cache and reload

## Environment Variables Reference

| Variable | Value | Example |
|----------|-------|---------|
| VITE_FIREBASE_API_KEY | From Firebase Settings | AIzaSyD... |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase domain | project.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | Project ID | my-project-12345 |
| VITE_FIREBASE_STORAGE_BUCKET | Storage bucket | project.appspot.com |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Sender ID | 123456789 |
| VITE_FIREBASE_APP_ID | App ID | 1:123:web:abc |
| VITE_FIREBASE_DATABASE_URL | RTDB URL | https://project.firebaseio.com |

## Next Steps

1. **Add more products** via Firebase Console or using `firebaseAdmin.ts`
2. **Customize security rules** in Firebase Console
3. **Set up authentication** for admin panel (optional)
4. **Monitor usage** in Firebase Console → Usage tab
5. **Deploy** to production when ready

## Useful Commands

```bash
# Check products count in database
npm run db:info

# Reset all products to unpaid status (testing)
npm run db:reset

# Import sample products
npm run db:import-samples
```

## API Documentation

### In Scanner (src/pages/Scanner.tsx)
```typescript
// Automatically uses:
fetchProductById(productId)  // Fetches from Firestore
```

### In Payment (src/pages/Payment.tsx)
```typescript
// Automatically uses:
markProductsAsPaid(productIds)  // Updates in Firestore
```

### Available in firebaseService.ts
```typescript
fetchProductById(id)
fetchAllProducts()
fetchUnpaidProducts()
markProductAsPaid(id)
markProductsAsPaid([ids])
searchProducts(term)
```

## Support

- **Setup Issues**: See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- **Implementation Details**: See [FIREBASE_INTEGRATION.md](FIREBASE_INTEGRATION.md)
- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Guide**: https://firebase.google.com/docs/firestore

## Security Reminders

⚠️ **IMPORTANT:**
- Add `.env` to `.gitignore` (it's a secret file)
- Never commit `.env` to version control
- Rotate API keys if accidentally exposed
- Enable Firestore security rules before production
- Use authentication for admin operations

---

You're all set! Start by creating your Firebase project and the integration will handle the rest.
