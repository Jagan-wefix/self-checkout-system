# Razorpay Integration Guide

This guide explains how to set up and use Razorpay payment integration in the Self Billing System.

## Overview

Razorpay has been integrated as a payment method alongside the existing UPI payment option. Customers can now choose between:
- **Razorpay**: Card, Wallet, UPI, and other payment methods
- **UPI**: Direct UPI app payment

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Razorpay API keys (Key ID and Key Secret)
3. Node.js backend server running
4. Frontend React application

## Getting Razorpay API Keys

1. Log in to your Razorpay Dashboard: https://dashboard.razorpay.com
2. Navigate to **Settings > API Keys**
3. You'll see two keys:
   - **Key ID**: Public key (safe to expose in frontend)
   - **Key Secret**: Private key (keep this secret, only use in backend)
4. Copy both keys - you'll need them for the next step

## Environment Configuration

### Backend Configuration (.env)

Add the following environment variables to your `.env` file in the project root:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### Example .env file

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here

# UPI Configuration (optional)
MERCHANT_UPI_ID=merchant@bank

# Server Configuration
PORT=3001
```

## How It Works

### Payment Flow

1. **User Selects Razorpay**: Customer clicks "Pay with Razorpay" button
2. **Order Creation**: Frontend sends request to backend to create Razorpay order
3. **Razorpay Checkout**: Razorpay Checkout modal opens with payment options
4. **Payment Processing**: Customer completes payment in the modal
5. **Payment Verification**: Frontend sends payment details to backend for verification
6. **Database Update**: On success, products are marked as PAID in Firebase
7. **Success Confirmation**: User sees confirmation message

### Backend Endpoints

#### 1. Create Order
- **Route**: `POST /api/razorpay/create-order`
- **Request Body**:
  ```json
  {
    "amount": 299.99,
    "productIds": ["product1", "product2"],
    "description": "Self Billing System Payment"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "order": {
      "id": "order_xxxxxxxxxxxxx",
      "amount": 29999,
      "currency": "INR",
      "key_id": "rzp_test_xxxxx",
      "productIds": ["product1", "product2"]
    }
  }
  ```

#### 2. Verify Payment
- **Route**: `POST /api/razorpay/verify-payment`
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_xxxxxxxxxxxxx",
    "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
    "razorpay_signature": "signature_xxxxxxxxxxxxx",
    "productIds": ["product1", "product2"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "payment_id": "pay_xxxxxxxxxxxxx"
  }
  ```

## Frontend Integration

The Payment component automatically:
1. Loads the Razorpay checkout script
2. Displays Razorpay payment option when available
3. Handles payment flow and verification
4. Updates UI based on payment status

No additional configuration needed on the frontend - it reads the Key ID from the backend response.

## Testing

### Test Credentials for Razorpay

When using **Test Mode** (before going live):

**Credit Card**:
- Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3 digits

**Debit Card**:
- Number: `5555 5555 5555 4444`
- Expiry: Any future date
- CVV: Any 3 digits

**UPI**:
- Handle: `success@razorpay`

### Testing Payment Flow

1. Run the dev server: `npm run dev`
2. Run the backend: `npm run server`
3. Add items to cart
4. Go to Payment page
5. Click "Pay with Razorpay"
6. Use test credentials above
7. Complete the payment
8. Check Firebase to verify products are marked as paid

## Switching to Production

1. In Razorpay Dashboard, switch from **Test Mode** to **Live Mode**
2. Get your **Live Keys** (Key ID and Key Secret)
3. Update environment variables with live keys
4. Test thoroughly with real transactions
5. Deploy the backend with updated configuration

## Error Handling

The integration includes error handling for:
- Missing Razorpay configuration
- Network errors
- Payment verification failures
- Invalid payment signatures
- Firebase update failures

Errors are displayed to the user with actionable messages.

## Security Considerations

1. **Key Secret**: Never expose `RAZORPAY_KEY_SECRET` in frontend code or version control
2. **Signature Verification**: All payments are verified server-side using HMAC-SHA256
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Use `.env` file and never commit it to version control

## Troubleshooting

### Razorpay modal not opening
- Ensure Razorpay script loaded successfully
- Check browser console for errors
- Verify Razorpay Key ID is correct

### Payment verification fails
- Check that Key Secret is correct
- Ensure backend environment variables are set
- Verify server logs for detailed error messages

### Firebase not updating
- Check Firebase configuration
- Verify products exist in database
- Check Firebase permissions/security rules

### Products not marked as PAID
- Verify payment was actually completed
- Check Firebase Firestore database
- Look for payment method and razorpay_payment_id fields

## Database Changes

When a payment is verified successfully, the following fields are added to product documents in Firebase:

```javascript
{
  paid: true,
  paid_at: Timestamp,
  payment_method: 'razorpay',
  razorpay_payment_id: 'pay_xxxxxxxxxxxxx'
}
```

For UPI payments, `payment_method` will be 'upi' without razorpay_payment_id.

## Support

For Razorpay support:
- Dashboard: https://dashboard.razorpay.com
- Documentation: https://razorpay.com/docs
- Support Email: support@razorpay.com

For this project's support, refer to the main README.md and QUICK_START.md files.

## Next Steps

1. Set up Razorpay account and get API keys
2. Add environment variables to `.env`
3. Restart the backend server
4. Test the payment flow
5. Deploy to production when ready
