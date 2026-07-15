# Testing & Troubleshooting Guide

## Testing the Firebase Integration

### Unit Testing Checklist

#### 1. Product Fetching
```typescript
// Test: fetchProductById()
Test Case: Fetch existing product
- Input: "PROD-0001"
- Expected: Returns product object with all fields
- Status: ✓ PASS if product loads

Test Case: Fetch non-existing product
- Input: "PROD-9999"
- Expected: Returns null
- Status: ✓ PASS if null returned

Test Case: Invalid product ID
- Input: "" or null
- Expected: Throws error or returns null
- Status: ✓ PASS if handled gracefully
```

#### 2. Cart Management
```typescript
// Test: addToCart()
Test Case: Add new product to empty cart
- Initial: cart = []
- Action: addToCart(product)
- Expected: cart = [product], returns true
- Status: ✓ PASS

Test Case: Add duplicate product
- Initial: cart = [product]
- Action: addToCart(same_product)
- Expected: cart unchanged, returns false
- Status: ✓ PASS

Test Case: Add paid product
- Initial: cart = []
- Action: addToCart({...product, paid: true})
- Expected: cart unchanged, returns false
- Status: ✓ PASS
```

#### 3. Payment Processing
```typescript
// Test: markProductsAsPaid()
Test Case: Mark single product as paid
- Input: ["PROD-0001"]
- Expected: Firestore updates paid=true, paid_at=timestamp
- Status: ✓ PASS if Firestore reflects changes

Test Case: Mark multiple products as paid
- Input: ["PROD-0001", "PROD-0002", "PROD-0003"]
- Expected: All 3 products updated in Firestore
- Status: ✓ PASS

Test Case: Mark non-existing product as paid
- Input: ["PROD-9999"]
- Expected: Throws error or handles gracefully
- Status: ✓ PASS if error handled
```

## Manual Testing Steps

### Test 1: Complete Scanning Flow

**Prerequisites:**
- Firebase project created ✓
- Firestore database running ✓
- At least one product in `products` collection ✓
- `.env` file configured ✓

**Steps:**
```
1. Start app: npm run dev
2. Navigate to Scanner page
3. Click "Start Scanning"
4. Scan QR code matching product ID (PROD-0001)
5. Observe:
   ✓ Camera activates
   ✓ QR code detected
   ✓ Product loads from Firebase
   ✓ Success message: "Added [Product Name] to cart"
   ✓ Product appears in cart
   ✓ Price and description displayed
6. Scan another product (PROD-0002)
7. Verify:
   ✓ Second product added to cart
   ✓ Cart now shows 2 items
   ✓ Total price updated correctly
```

**Expected Output:**
```
Scanner Console:
✓ No Firebase errors
✓ Product data logged correctly
✓ Cart state updated

Firestore Console:
✓ Collections appear in left panel
✓ Product documents visible
✓ Fields readable

Browser Console:
✓ No red errors
✓ Debug messages appear
```

### Test 2: Complete Payment Flow

**Prerequisites:**
- Test 1 passed ✓
- Cart contains at least 2 products ✓
- Backend server running: npm run server ✓

**Steps:**
```
1. From Scanner, click "View Cart"
2. Verify:
   ✓ All products listed
   ✓ Prices correct
   ✓ Total calculated correctly
3. Click "Proceed to Payment"
4. Review order summary
5. Click "Pay [amount] with UPI"
6. Verify:
   ✓ UPI link opens in new window
   ✓ UPI app opens (if available) or shows payment form
7. Complete payment in UPI app
8. Return to app
9. Click "I Have Completed Payment"
10. Verify:
    ✓ "Checking payment..." message
    ✓ Auto-polling indicator
    ✓ Success message appears after ~2-5 seconds
    ✓ "Payment Confirmed!" displayed
11. Return to home page
    ✓ Cart cleared
    ✓ Ready to scan again
```

**Check Firebase:**
```
1. Go to Firestore Console
2. Open products collection
3. Find products added to cart
4. Verify:
   ✓ paid: true (changed from false)
   ✓ paid_at: [current timestamp]
   ✓ Other fields unchanged
```

### Test 3: Error Handling

**Test 3a: Invalid QR Code**
```
Steps:
1. Go to Scanner
2. Try to scan non-product QR code
3. Expected: "Invalid QR code format. Expected PROD-XXXX"
```

**Test 3b: Product Not in Database**
```
Steps:
1. Go to Scanner
2. Manually input: PROD-9999
3. Expected: "Product not found in database"
```

**Test 3c: Product Already Paid**
```
Steps:
1. Go to Firestore Console
2. Set a product's paid to true
3. Try to scan that product
4. Expected: "This product has already been paid for"
```

**Test 3d: Duplicate Product in Cart**
```
Steps:
1. Add product PROD-0001 to cart
2. Try to scan same product again
3. Expected: "Product already in cart"
```

**Test 3e: Payment Without Completing**
```
Steps:
1. Add products to cart
2. Go to Payment
3. Click "Pay with UPI"
4. Close UPI window without paying
5. Click "I Have Completed Payment"
6. Expected: "Payment not confirmed yet..."
```

## Troubleshooting Guide

### Issue 1: Products Not Loading from Firebase

**Symptom:**
- Scanner shows "Product not found in database" for valid products
- Browser console: no Firebase errors

**Checklist:**
- [ ] `.env` file exists in project root
- [ ] `VITE_FIREBASE_PROJECT_ID` is set
- [ ] Firestore database created in Firebase Console
- [ ] `products` collection exists in Firestore
- [ ] Product documents have correct IDs (PROD-0001, etc.)
- [ ] Product documents have required fields: id, name, price, description, paid
- [ ] Firestore security rules allow READ access

**Solutions:**
```
1. Verify Firestore connection:
   - Open DevTools → Network
   - Scan a product
   - Check for requests to firestore.googleapis.com
   - Should see 200 OK responses

2. Check product IDs:
   - QR code format: PROD-0001
   - Firestore document ID: PROD-0001
   - Must be EXACT match (case-sensitive)

3. Debug Firebase initialization:
   In browser console:
   > firebase.apps[0].options.projectId
   Should return your Firebase project ID

4. Check Firestore rules:
   Firebase Console → Firestore → Rules
   Should allow READ without authentication
```

### Issue 2: Firebase Initialization Errors

**Symptom:**
```
Uncaught Error: [firebase_util/initialize-app] Unable to parse project ID
```

**Solutions:**
```
1. Check .env variables:
   - Ensure NO SPACES around = sign
   - VITE_FIREBASE_API_KEY=key (correct)
   - VITE_FIREBASE_API_KEY = key (incorrect)

2. Verify all required variables:
   npm run dev
   Check console for which variable is missing

3. Reload app:
   - Clear browser cache
   - Close and reopen browser
   - Hard refresh: Ctrl+Shift+R

4. Check environment variable precedence:
   - `.env` file values override defaults
   - Restart dev server after changing .env
```

### Issue 3: Payment Status Not Checking

**Symptom:**
- Click "Pay with UPI" → Nothing happens
- Or: Payment doesn't auto-check

**Checklist:**
- [ ] Backend server running: `npm run server`
- [ ] Backend port 3001 not blocked
- [ ] RFID endpoint accessible: `http://localhost:3001/api/rfid/check/...`
- [ ] Products have `rfid_uid` field populated
- [ ] UPI link generation working

**Debug Steps:**
```
1. Verify backend is running:
   curl http://localhost:3001/api/rfid/check/A7F45C21
   Should return JSON response

2. Check product RFID UIDs:
   Firestore → products → Check each document
   rfid_uid should be set (not empty)

3. Monitor payment polling:
   DevTools → Network → Filter XHR
   After "Complete Payment" click:
   Should see repeated requests to /api/rfid/check
   Interval: Every 2.5 seconds
```

### Issue 4: Products Not Marked as Paid

**Symptom:**
- Payment completes successfully
- But `paid: false` in Firestore after payment
- Or: "Failed to update database" error

**Checklist:**
- [ ] Firestore has write permissions
- [ ] Security rules allow writes (or require auth)
- [ ] No network errors during write
- [ ] Product IDs are valid (not null/undefined)

**Debug Steps:**
```
1. Check Firestore Write permissions:
   Firebase Console → Firestore → Rules
   
   Current rule should allow writes:
   match /products/{document=**} {
     allow write: if request.auth != null;
     // or for testing:
     allow write: if true;
   }

2. Monitor Firestore operations:
   DevTools → Network
   After payment confirmation:
   Should see POST to firestore.googleapis.com
   Status: 200 OK

3. Check error details:
   Browser Console → Check for Firebase errors
   Example error:
   "Missing or insufficient permissions"
   → Firestore security rules issue

4. Test write permission directly:
   Firebase Console → Firestore → Try editing product
   Should allow edit without error
```

### Issue 5: QR Scanner Not Initializing

**Symptom:**
- Scanner page shows but no camera feed
- "Failed to access camera" error
- Black video element

**Checklist:**
- [ ] Browser has camera permission granted
- [ ] Camera is not in use by another app
- [ ] HTTP (not HTTPS required for localhost, but check)
- [ ] Device has working camera

**Solutions:**
```
1. Grant camera permission:
   Chrome: Settings → Privacy and security → Camera
   Firefox: about:preferences → Privacy → Permissions → Camera
   Select site → Allow

2. Check camera availability:
   Windows: Settings → Privacy → Camera
   Toggle camera on for apps

3. Clear browser data:
   Ctrl+Shift+Delete → Cookies and other site data
   Reload page

4. Try different browser:
   Edge, Firefox, Safari (if on Mac)
   Some browsers have better camera support

5. Check console for permission errors:
   DevTools → Console → Look for NotAllowedError
   Usually camera permission issue
```

### Issue 6: CORS or Network Errors

**Symptom:**
```
Error: Failed to fetch from Firebase
CORS error in console
```

**Solutions:**
```
1. Check dev server is running:
   npm run dev
   Should see "Local: http://localhost:5173"

2. Check backend is running:
   npm run server
   Should see "Server listening on port 3001"

3. For CORS issues:
   Backend should have CORS enabled
   Check server/index.js for:
   app.use(cors())

4. Check Firebase SDK version:
   npm list firebase
   Should be latest version
   Update if needed: npm install firebase@latest
```

### Issue 7: Cart State Not Persisting

**Symptom:**
- Products added to cart disappear on reload
- Cart empty after navigation

**This is expected behavior** ✓
- Cart is stored in React state
- Data is NOT persisted to localStorage
- Reload/navigation clears the cart

**Solutions (if persistence needed):**
```
Add localStorage integration:

// In CartContext.tsx
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cart));
}, [cart]);

useEffect(() => {
  const saved = localStorage.getItem('cart');
  if (saved) setCart(JSON.parse(saved));
}, []);
```

## Performance Testing

### Load Testing
```
Test: How many products can load?

Procedure:
1. Add 100 products to Firestore
2. Fetch all products: fetchAllProducts()
3. Measure time taken
4. Expected: < 2 seconds for 100 products

Test: Batch payment marking
Procedure:
1. Add 50 products to cart
2. Mark all as paid: markProductsAsPaid([...50 ids])
3. Monitor Firestore usage
4. Expected: All updated within 2-3 seconds
```

### Network Testing
```
Enable Network Throttling in DevTools:
Chrome DevTools → Network → Throttling (3G)

Repeat tests to verify performance under slower connection:
- Product fetching should work (may be slower)
- Payment status polling should complete
- No timeouts or failures
```

## Monitoring and Logging

### Enable Debug Logging
```javascript
// In src/main.tsx, add:
import { enableLogging } from 'firebase/app';
enableLogging(true);
```

### Monitor Firestore Usage
```
Firebase Console → Firestore → Usage & Quotas

Track:
- Read operations per day
- Write operations per day
- Storage usage
- Network usage
```

### Check Security Issues
```
Firebase Console → Firestore → Security Insights

Review:
- Failed read/write attempts
- Authentication failures
- Rule violations
```

## Automated Testing Commands

```bash
# Test TypeScript compilation
npm run typecheck

# Test linting
npm run lint

# Test build
npm run build
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Security rules reviewed and restricted
- [ ] HTTPS enabled
- [ ] Firebase API key restrictions set
- [ ] Database backups enabled
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Load testing completed
- [ ] Payment flow tested end-to-end
- [ ] User acceptance testing done

---

**Need help?** Check these files:
- Setup: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- Quick Start: [QUICK_START.md](QUICK_START.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Implementation: [FIREBASE_INTEGRATION.md](FIREBASE_INTEGRATION.md)
