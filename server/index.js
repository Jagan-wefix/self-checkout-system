import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || '',
};

const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
const firebaseApp = isFirebaseConfigured ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig)) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

// Initialize Razorpay (only if configured)
const isRazorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const razorpay = isRazorpayConfigured ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Smart self-billing API is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'self-billing-express' });
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = await getAllProductsFromFirebase();
    res.json(products);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/products/unpaid', async (_req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Firebase is not configured.' });
    }

    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(query(productsRef, where('paid', '==', false)));

    const products = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    res.json(products);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const getProductFromFirebase = async (productId) => {
  if (!db) {
    throw new Error('Firebase is not configured. Set your Firebase environment variables first.');
  }

  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    return null;
  }

  return {
    id: productSnap.id,
    ...productSnap.data(),
  };
};

const getAllProductsFromFirebase = async () => {
  if (!db) {
    throw new Error('Firebase is not configured. Set your Firebase environment variables first.');
  }

  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

app.get('/api/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductFromFirebase(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/payment/process', async (req, res) => {
  try {
    const { productIds, totalAmount } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Invalid product IDs' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    if (!db) {
      return res.status(503).json({ error: 'Firebase is not configured.' });
    }

    await Promise.all(
      productIds.map(async (productId) => {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
          paid: true,
          paid_at: Timestamp.now(),
        });
      })
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/rfid/check/:rfid_uid', async (req, res) => {
  try {
    const { rfid_uid } = req.params;

    if (!db) {
      return res.status(503).json({ status: 'ALARM', error: 'Firebase is not configured.' });
    }

    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('rfid_uid', '==', rfid_uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ status: 'ALARM', error: 'Product not found' });
    }

    const product = snapshot.docs[0];
    const productData = { id: product.id, ...product.data() };
    const status = productData.paid ? 'ALLOW' : 'ALARM';
    res.json({ status });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ status: 'ALARM', error: error.message || 'Internal server error' });
  }
});

app.get('/api/settings/merchant-upi', (req, res) => {
  res.json({ merchant_upi_id: process.env.MERCHANT_UPI_ID || 'merchant@upi' });
});

// Razorpay Create Order
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    if (!isRazorpayConfigured) {
      return res.status(500).json({ error: 'Razorpay is not configured' });
    }

    const { amount, productIds, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'Invalid product IDs' });
    }

    // Amount should be in paise (multiply by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      description: description || 'Self Billing System Payment',
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        productIds: productIds,
      },
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Razorpay Verify Payment
app.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    if (!isRazorpayConfigured) {
      return res.status(500).json({ error: 'Razorpay is not configured' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productIds } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Mark products as paid in Firebase
    if (db && productIds && Array.isArray(productIds)) {
      await Promise.all(
        productIds.map(async (productId) => {
          const productRef = doc(db, 'products', productId);
          await updateDoc(productRef, {
            paid: true,
            paid_at: Timestamp.now(),
            payment_method: 'razorpay',
            razorpay_payment_id: razorpay_payment_id,
          });
        })
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!isFirebaseConfigured) {
    console.warn('Firebase config is incomplete. Set VITE_FIREBASE_* or FIREBASE_* environment variables to load products from Firestore.');
  }
  if (!isRazorpayConfigured) {
    console.warn('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables to enable Razorpay payments.');
  }
});
