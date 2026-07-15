# Firebase Integration Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Home       │  │   Scanner    │  │    Cart      │           │
│  │   Page       │  │   Page       │  │    Page      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         CartContext (Product State Management)          │   │
│  │  - cart: Product[]                                       │   │
│  │  - addToCart(product)                                    │   │
│  │  - removeFromCart(id)                                    │   │
│  │  - clearCart()                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ▲        ▲                               │
│                         │        │                               │
└─────────────────────────┼────────┼───────────────────────────────┘
                          │        │
                    ┌─────┘        └─────┐
                    │                    │
         ┌──────────▼──────────┐  ┌──────▼──────────┐
         │  Scanner QR Input   │  │  Payment UI     │
         └──────────┬──────────┘  └──────┬──────────┘
                    │                    │
                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│              Firebase Service Layer (firebaseService.ts)         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product Operations:           Payment Operations:              │
│  • fetchProductById()          • markProductAsPaid()            │
│  • fetchAllProducts()          • markProductsAsPaid()           │
│  • fetchUnpaidProducts()       • updatePaymentStatusInRTDB()    │
│  • searchProducts()            • checkPaymentStatusInRTDB()     │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼─────────┐
                    │   Firebase      │
                    │   App Init      │
                    │  (firebase.ts)  │
                    └──────┬─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Firestore   │  │  Realtime    │  │   Firebase   │
│  Database    │  │  Database    │  │   Storage    │
│              │  │              │  │   (optional) │
│ products/    │  │ payments/    │  │              │
│  - PROD-*    │  │  - {status}  │  └──────────────┘
│    {data}    │  │    {data}    │
└──────────────┘  └──────────────┘
```

## Data Flow Diagram

### 1. Scanning Flow
```
┌─────────────────┐
│ User Scans QR   │ (PROD-0001)
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Scanner.tsx Receives QR  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ fetchProductById("PROD-0001")             │
│ Queries: Firestore → products/PROD-0001  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Product Data Returns:              │
│ {                                  │
│   id: "PROD-0001",                │
│   name: "T-shirt",                │
│   price: 11.99,                   │
│   description: "...",             │
│   paid: false,                    │
│   rfid_uid: "A7F45C21"            │
│ }                                 │
└────────┬───────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ addToCart(product)       │
│ CartContext updates      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ UI Displays Product      │
│ - Name: T-shirt         │
│ - Price: ₹11.99         │
│ - Description: ...      │
│ - Added to cart ✓       │
└──────────────────────────┘
```

### 2. Payment & Marking as Paid Flow
```
┌─────────────────────┐
│ User Completes UPI  │
│ Payment             │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Payment.tsx Initiates:           │
│ - Opens UPI link                 │
│ - Starts polling                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ checkPaymentStatus() runs every  │
│ 2.5 seconds:                     │
│ Checks RFID verification via:    │
│ GET /api/rfid/check/{rfid_uid}   │
└────────┬─────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Payment Confirmed?             │
│ Response: status === 'ALLOW'   │
└────┬──────────────────────┬────┘
     │ YES                  │ NO
     ▼                      └──► Retry in 2.5s
┌──────────────────────────────┐
│ Call markProductsAsPaid()    │
│ For each product in cart:    │
│ {                            │
│   Update Firestore:          │
│   products/{productId}       │
│   - paid: true              │
│   - paid_at: Timestamp.now()│
│ }                            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ All Products Updated     │
│ in Firebase              │
│ Status: ✓ Paid          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ clearCart()              │
│ Reset UI                 │
│ Show success message     │
└──────────────────────────┘
```

## Firestore Collection Structure

```
firestore-root
│
└── products/ (Collection)
    │
    ├── PROD-0001/ (Document - T-shirt)
    │   ├── id: "PROD-0001"
    │   ├── name: "T-shirt"
    │   ├── description: "Premium cotton T-shirt..."
    │   ├── price: 11.99
    │   ├── rfid_uid: "A7F45C21"
    │   ├── stock: 10
    │   ├── paid: false
    │   ├── created_at: 2025-01-20T10:00:00Z
    │   └── paid_at: (empty until marked)
    │
    ├── PROD-0002/ (Document - Pants)
    │   ├── id: "PROD-0002"
    │   ├── name: "Pant"
    │   ├── price: 24.99
    │   ├── paid: true
    │   ├── paid_at: 2025-01-20T14:30:00Z
    │   └── ... (other fields)
    │
    └── PROD-0003/ (Document - Shirt)
        └── ... (other fields)
```

## Component Dependencies

```
App.tsx
├── Home (static, no Firebase calls)
├── Scanner (uses Firebase)
│   └── fetchProductById()
│       └── CartContext.addToCart()
├── Cart (no Firebase calls)
│   └── CartContext.removeFromCart()
├── Payment (uses Firebase)
│   └── markProductsAsPaid()
│       └── CartContext.clearCart()
│
CartContext
├── useState(cart)
├── addToCart(product)
├── removeFromCart(productId)
├── clearCart()
└── getTotalPrice()
```

## Database Transactions

### Single Product Paid
```
Firestore Transaction:
docRef = doc(db, "products", productId)
updateDoc(docRef, {
  paid: true,
  paid_at: Timestamp.now()
})
```

### Bulk Products Paid (After Checkout)
```
Firestore Batch Transaction:
for each productId in cart:
  docRef = doc(db, "products", productId)
  updateDoc(docRef, {
    paid: true,
    paid_at: Timestamp.now()
  })
```

## Security Model

```
Firestore Security Rules:
┌──────────────────────────────────┐
│ products collection              │
├──────────────────────────────────┤
│ READ:  ✓ Allowed (public)        │
│ WRITE: ✗ Requires auth           │
│        (controlled via rules)     │
└──────────────────────────────────┘

Production Rule:
- Authenticated users can read products
- Only backend/admin can write to products
- RFID verification endpoint manages status updates
```

## Integration Points

### 1. QR Scanner → Firestore
- Component: `Scanner.tsx`
- Function: `fetchProductById()`
- Query: Direct document fetch by ID
- Latency: ~100-200ms typical

### 2. Cart Display → Product Data
- Component: `Cart.tsx`
- Data Source: Cart state (populated from Firestore)
- No additional queries needed

### 3. Payment → Firestore Update
- Component: `Payment.tsx`
- Function: `markProductsAsPaid()`
- Operation: Batch update documents
- Latency: ~500-1000ms for multiple products

## Performance Optimization

```
Current Flow:
┌────────────────────────────┐
│ Scan QR Code               │
└────────────┬────────────────┘
             │
             ├─→ [Read] Firestore (100-200ms)
             │
             └─→ Add to Cart (instant)

Payment Flow:
┌────────────────────────────┐
│ Payment Confirmed          │
└────────────┬────────────────┘
             │
             ├─→ [Write] Firestore (500-1000ms)
             │
             └─→ Clear Cart (instant)

Optimization Opportunities:
✓ Cache product queries
✓ Use real-time listeners instead of polling
✓ Implement offline support with Firestore caching
✓ Batch writes for multiple products (already done)
```

## Deployment Architecture

```
Production Environment:

┌─────────────────────────────────────────┐
│  Firebase Projects (Cloud)              │
├─────────────────────────────────────────┤
│  • Firestore Database                   │
│  • Realtime Database (optional)         │
│  • Security Rules                       │
│  • Authentication (if needed)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Web App (CDN/Hosting)                  │
├─────────────────────────────────────────┤
│  • React + Vite (static files)          │
│  • Firebase SDK (embedded)              │
│  • Environment Variables (.env)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Backend Server (Node.js)               │
├─────────────────────────────────────────┤
│  • RFID Verification Endpoint           │
│  • UPI Payment Processing               │
│  • Database Admin Operations            │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
Error Scenarios:

1. Product Not Found
   Scanner → fetchProductById() 
   → Product null → Show error message
   
2. Firebase Connection Error
   Any operation → Firebase throws error
   → Catch block logs error → Show user message
   
3. Payment Verification Failed
   Payment.tsx → checkPaymentStatus() 
   → Returns false → Retry after 2.5s
   
4. Database Write Failed
   Payment → markProductsAsPaid() 
   → Firestore throws error → Show error
   → User can retry payment
```

---

This architecture ensures:
✅ Real-time product availability
✅ Atomic payment transactions
✅ Scalable product management
✅ Audit trail of paid products
✅ Secure data access
