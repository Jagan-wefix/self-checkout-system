# Firebase Integration Guide

## Overview
This application integrates Firebase to manage product inventory and payment tracking. Products are fetched from Firestore based on QR code scans, and marked as paid after successful UPI payment.

## Setup Instructions

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter your project name (e.g., "Self Checkout System")
4. Complete the setup wizard

### 2. Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **Production mode** (or Testing mode for development)
4. Choose a region close to your deployment location
5. Click "Create"

### 3. Enable Realtime Database (Optional but Recommended)
1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose the same region as Firestore
4. Start in **Production mode**
5. Click "Create"

### 4. Get Firebase Configuration
1. In Firebase Console, go to "Project Settings" (⚙️ icon)
2. Scroll to "Your apps" section
3. If no app exists, click "Add app" and select "Web"
4. Copy the configuration object
5. Add the configuration to `.env` file

### 5. Create Firestore Collections and Documents

#### Products Collection
Create a collection named `products` in Firestore with documents in the following structure:

```json
{
  "id": "PROD-0001",
  "name": "T-shirt",
  "description": "Premium cotton T-shirt with a comfortable fit",
  "price": 10,
  "rfid_uid": "A7F45C21",
  "paid": false,
  "stock": 10,
  "created_at": "2025-01-20T10:00:00Z"
}
```

**Collection Path:** `products`
**Document ID:** Same as the product `id` field (e.g., `PROD-0001`)

**Fields:**
- `id` (string): Product identifier matching QR code format (PROD-XXXX)
- `name` (string): Product name
- `description` (string): Product description
- `price` (number): Price in INR
- `rfid_uid` (string): RFID tag UID for exit verification
- `paid` (boolean): Whether product has been paid
- `stock` (number): Current stock level
- `created_at` (timestamp): When product was added
- `paid_at` (timestamp): When product was marked as paid (auto-added)

#### Example Products
```
PROD-0001: T-shirt - ₹11.99
PROD-0002: Pants - ₹24.99
PROD-0003: Shirt - ₹19.99
PROD-0004: Shoes - ₹79.99
PROD-0005: Sneakers - ₹64.99
```

### 6. Configure Firestore Security Rules

Replace the default rules with:

```firebase
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all products
    match /products/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // Restrict writes to authenticated users only
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 7. Update Environment Variables

Create or update `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

**Note:** Keep `.env` file in `.gitignore` - never commit it to version control.

## How It Works

### Scanning Flow
1. User scans a QR code with format `PROD-XXXX`
2. Scanner calls `fetchProductById(productId)` from Firebase
3. Product details are fetched from Firestore `products` collection
4. Product is added to cart if not paid and not already in cart
5. UI displays product name, description, and price

### Payment Flow
1. User reviews cart and proceeds to payment
2. User opens UPI link and completes payment
3. Payment status is checked via RFID verification
4. Upon confirmation, `markProductsAsPaid()` is called
5. All products in cart are marked as `paid: true` in Firestore
6. `paid_at` timestamp is auto-added by the function
7. Cart is cleared and user redirected to home

## API Methods

### fetchProductById(productId: string)
Fetches a single product from Firestore.
```typescript
const product = await fetchProductById('PROD-0001');
```

### fetchAllProducts()
Fetches all products from the database.
```typescript
const products = await fetchAllProducts();
```

### fetchUnpaidProducts()
Fetches only unpaid products.
```typescript
const unpaidProducts = await fetchUnpaidProducts();
```

### markProductAsPaid(productId: string)
Marks a single product as paid.
```typescript
await markProductAsPaid('PROD-0001');
```

### markProductsAsPaid(productIds: string[])
Marks multiple products as paid (used after checkout).
```typescript
await markProductsAsPaid(['PROD-0001', 'PROD-0002', 'PROD-0003']);
```

## Troubleshooting

### Products Not Loading
- Check Firebase configuration in `.env`
- Ensure Firestore database is created and accessible
- Verify product documents exist in `products` collection
- Check browser console for Firebase errors

### Payment Confirmation Fails
- Verify RFID verification endpoint is running on `http://localhost:3001`
- Check that `rfid_uid` field exists for products
- Ensure payment gateway is properly configured

### Firestore Quota Exceeded
- Monitor usage in Firebase Console
- Optimize queries to reduce read operations
- Consider enabling Firestore caching

## Best Practices

1. **Never expose `.env` file** - Keep it in `.gitignore`
2. **Use environment variables** - Never hardcode API keys
3. **Test thoroughly** - Verify payment flow works end-to-end
4. **Monitor Firestore usage** - Check quota usage in Firebase Console
5. **Regular backups** - Export Firestore data periodically
6. **Security rules** - Only allow authenticated writes to products
7. **Error handling** - Always handle Firebase errors gracefully

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Database Guide](https://firebase.google.com/docs/firestore)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
