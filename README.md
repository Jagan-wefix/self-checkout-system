# Smart Self-Billing Retail System

A production-ready MVP web application for smart retail self-checkout where customers scan product QR codes, add them to cart, and complete payment. The system integrates with RFID IoT locks for physical product access control.

## Features

- **Mobile-First Design**: Optimized for smartphone usage
- **QR Code Scanning**: Uses device camera to scan product QR codes (format: PROD-XXXX)
- **Real-Time Cart Management**: Add/remove products with duplicate prevention
- **UPI Payment Integration**: Complete UPI payment flow with deep linking
- **RFID Gate Verification**: REST API for IoT locks to verify payment status
- **Database Persistence**: JSON file-based storage with RFID tracking

## System Architecture

### Frontend (React + TypeScript)
- **Home Page**: Welcome screen with navigation
- **Scanner Page**: QR code scanning using html5-qrcode
- **Cart Page**: View products, total price, and checkout
- **Payment Page**: Simulated payment processing
- **Cart Context**: Global state management for shopping cart

### Backend (Express + Node.js)
- **GET /api/product/:id**: Fetch product details and payment status
- **POST /api/payment/process**: Process payment and mark RFID tags as paid
- **GET /api/rfid/check/:rfid_uid**: RFID gate verification (ALLOW/ALARM)
- **GET /api/settings/merchant-upi**: Get merchant UPI ID for payment
- **GET /api/health**: Server health check

### UPI Payment Flow
1. **Checkout**: Customer clicks "Pay with UPI" button
2. **Deep Link**: Browser opens UPI app with payment details
3. **Payment**: Customer completes payment in UPI app
4. **Confirmation**: Customer clicks "I Have Completed Payment"
5. **Backend Update**: Server marks RFID tags as paid
6. **Gate Access**: RFID reader allows exit (ALLOW status)

### RFID Integration
- **Product Structure**: Each product has `rfid_uid` and `paid` status
- **Gate Verification**: GET /api/rfid/check/:rfid_uid returns ALLOW/ALARM
- **Payment Processing**: POST /api/payment/process updates paid status

### Database (JSON file storage)
- **products**: Product catalog with ID, name, price, rfid_uid, paid status
- **settings**: Merchant UPI ID configuration
- **Persistence**: Data stored in `server/data.json`

## Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser with camera access
- No external database required (data driven from `server/config.js` in code)

## Installation

1. **Clone the repository** (if applicable)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables** are already configured in `.env` file

## Running the Application

### Step 1: Start the Backend Server

In a terminal, run:
```bash
npm run server
```

The Express server will start on `http://localhost:3001`

### Step 2: Start the Frontend Development Server

In a new terminal, run:
```bash
npm run dev
```

The React app will start on `http://localhost:5173`

## Testing UPI Payment Integration

### API Endpoints Testing
Run the test script to verify all endpoints:
```bash
node test-payment.js
```

### Manual Testing Steps
1. **Scan Products**: Use QR scanner to add products to cart
2. **Checkout**: Click "Pay with UPI" button
3. **UPI App**: Deep link opens UPI app (Google Pay, PhonePe, etc.)
4. **Simulate Payment**: Complete payment in UPI app
5. **Confirm**: Click "I Have Completed Payment" button
6. **Verification**: Check RFID status changes from ALARM to ALLOW

### RFID Gate Testing
Test the exit gate verification:
```bash
curl http://localhost:3001/api/rfid/check/A7F45C21
# Should return {"status": "ALLOW"} after payment
```

### Step 3: Access the Application

Open your browser and navigate to `http://localhost:5173`

## Usage Guide

### For Customers:

1. **Home Page**: Click "Start Scanning" to begin shopping
2. **Scanner Page**:
   - Allow camera access when prompted
   - Point camera at product QR code (format: PROD-XXXX)
   - Product automatically adds to cart
3. **Cart Page**:
   - Review selected products and total price
   - Remove items if needed
   - Click "Proceed to Payment"
4. **Payment Page**:
   - Review order summary
   - Click "Pay" button
   - Products are marked as PAID in database

### For RFID IoT Locks (ESP32):

Query the payment status endpoint:

```bash
GET http://localhost:3001/api/rfid/check/PROD-0001
```

Response:
```json
{
  "productId": "PROD-0001",
  "productName": "Wireless Headphones",
  "paid": true,
  "paidAt": "2024-01-15T10:30:00.000Z"
}
```

The RFID lock should unlock only if `paid: true`.

## Sample Products

The database includes 5 test products:

- **PROD-0001**: Wireless Headphones - $79.99
- **PROD-0002**: Smart Watch - $149.99
- **PROD-0003**: Bluetooth Speaker - $49.99
- **PROD-0004**: Phone Charger - $24.99
- **PROD-0005**: Laptop Stand - $39.99

## Testing with QR Codes

Generate QR codes containing the text `PROD-0001`, `PROD-0002`, etc. using any QR code generator:
- https://www.qr-code-generator.com/
- https://www.the-qrcode-generator.com/

## API Endpoints

### 1. Get Product Details
```
GET /api/product/:id
```

Example: `GET /api/product/PROD-0001`

Response:
```json
{
  "id": "PROD-0001",
  "name": "Wireless Headphones",
  "description": "Premium noise-cancelling wireless headphones",
  "price": 79.99,
  "stock": 10,
  "paid": false
}
```

### 2. Process Payment
```
POST /api/payment/process
Content-Type: application/json

{
  "productIds": ["PROD-0001", "PROD-0002"],
  "totalAmount": 229.98
}
```

Response:
```json
{
  "success": true,
  "transactionId": "uuid",
  "message": "Payment processed successfully"
}
```

### 3. RFID Lock Check
```
GET /api/rfid/check/:productId
```

Example: `GET /api/rfid/check/PROD-0001`

Response:
```json
{
  "productId": "PROD-0001",
  "productName": "Wireless Headphones",
  "paid": true,
  "paidAt": "2024-01-15T10:30:00.000Z"
}
```

## Security Features

- Row Level Security (RLS) enabled on all database tables
- Public read access for products (browsing)
- Authenticated access for transactions
- Prevents duplicate product additions
- Prevents adding already-paid products to cart

## Production Build

To create a production build:

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

## Future Enhancements

- Real payment gateway integration (Stripe, PayPal)
- User authentication and order history
- Admin dashboard for inventory management
- Multiple payment methods
- Receipt generation
- Push notifications for order status

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: In‑memory JavaScript object (no external service)
- **QR Scanning**: html5-qrcode
- **Icons**: Lucide React
- **Build Tool**: Vite

## Troubleshooting

### Camera not working
- Ensure browser has camera permissions
- Use HTTPS in production (required for camera access)
- Try a different browser

### Products not loading
- Check if backend server is running on port 3001
- Verify `.env` file has correct Supabase credentials
- Check browser console for errors

### RFID queries failing
- Ensure backend server is accessible from IoT device network
- Verify product ID format (PROD-XXXX)
- Check CORS headers in backend

## License

MIT

## Support

For issues or questions, please contact the development team.
