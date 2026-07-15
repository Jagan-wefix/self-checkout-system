import {
  db,
  rtdb,
} from './firebase';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { ref, get, update } from 'firebase/database';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rfid_uid?: string;
  paid: boolean;
  created_at?: string;
  stock?: number;
}

const getStringField = (product: Record<string, unknown>, keys: string[], defaultValue = ''): string => {
  for (const key of keys) {
    const value = product[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return defaultValue;
};

const getNumberField = (product: Record<string, unknown>, keys: string[], defaultValue = 0): number => {
  for (const key of keys) {
    const value = product[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return defaultValue;
};

export const isProductPaid = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y';
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return false;
};

const normalizeProduct = (product: Record<string, unknown>): Product => ({
  id: getStringField(product, ['id', 'ID'], ''),
  name: getStringField(product, ['name', 'Name'], ''),
  description: getStringField(product, ['description', 'Description'], ''),
  price: getNumberField(product, ['price', 'Price'], 0),
  rfid_uid: getStringField(product, ['rfid_uid', 'rfidUid', 'RFID_UID', 'RFIDUID'], ''),
  paid: isProductPaid(product.paid ?? product.Paid),
  created_at: getStringField(product, ['created_at', 'createdAt', 'Created_at', 'createdAt'], ''),
  stock: getNumberField(product, ['stock', 'Stock'], 0),
});

/**
 * Fetch a single product by ID from Firestore
 */
export const fetchProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return normalizeProduct({
        id: productSnap.id,
        ...productSnap.data(),
      });
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Fetch all products from Firestore
 */
export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    return snapshot.docs.map((doc) => normalizeProduct({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

/**
 * Fetch unpaid products from Firestore
 */
export const fetchUnpaidProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('paid', '==', false));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => normalizeProduct({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching unpaid products:', error);
    throw error;
  }
};

/**
 * Mark a product as paid in Firestore
 */
export const markProductAsPaid = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      paid: true,
      paid_at: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking product as paid:', error);
    throw error;
  }
};

/**
 * Mark multiple products as paid in Firestore
 */
export const markProductsAsPaid = async (productIds: string[]): Promise<void> => {
  try {
    const updatePromises = productIds.map((productId) => {
      const productRef = doc(db, 'products', productId);
      return updateDoc(productRef, {
        paid: true,
        paid_at: Timestamp.now(),
      });
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking products as paid:', error);
    throw error;
  }
};

/**
 * Update product payment status in Realtime Database (for real-time sync)
 */
export const updatePaymentStatusInRTDB = async (
  productId: string,
  paid: boolean,
  rfidUid?: string
): Promise<void> => {
  try {
    const paymentRef = ref(rtdb, `payments/${productId}`);
    await update(paymentRef, {
      paid,
      rfid_uid: rfidUid,
      updated_at: Timestamp.now().toMillis(),
    });
  } catch (error) {
    console.error('Error updating payment status in RTDB:', error);
    throw error;
  }
};

/**
 * Fetch payment status from Realtime Database
 */
export const checkPaymentStatusInRTDB = async (productId: string): Promise<boolean> => {
  try {
    const paymentRef = ref(rtdb, `payments/${productId}`);
    const snapshot = await get(paymentRef);

    if (snapshot.exists()) {
      return snapshot.val().paid === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking payment status in RTDB:', error);
    return false;
  }
};

/**
 * Search products by name or description
 */
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    const allProducts = snapshot.docs.map((doc) => normalizeProduct({
      id: doc.id,
      ...doc.data(),
    }));

    const lowerSearchTerm = searchTerm.toLowerCase();
    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerSearchTerm) ||
        product.description.toLowerCase().includes(lowerSearchTerm) ||
        product.id.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};
