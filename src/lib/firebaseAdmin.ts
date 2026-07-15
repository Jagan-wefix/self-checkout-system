import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { Product } from './firebaseService';

/**
 * Admin utilities for managing products in Firebase
 * Use these functions to bulk manage products
 */

/**
 * Add a new product to Firestore
 */
export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...product,
      created_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

/**
 * Delete a product from Firestore
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Bulk import products from array
 */
export const importProducts = async (products: Omit<Product, 'id'>[]): Promise<string[]> => {
  try {
    const productIds: string[] = [];
    
    for (const product of products) {
      const id = await addProduct(product);
      productIds.push(id);
    }
    
    return productIds;
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  }
};

/**
 * Update product information
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    const { id, ...updateData } = updates;
    await updateDoc(productRef, updateData);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Reset all products' paid status (for testing)
 */
export const resetAllProductsPaidStatus = async (): Promise<void> => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    const updatePromises = snapshot.docs.map((document) => {
      const productRef = doc(db, 'products', document.id);
      return updateDoc(productRef, { paid: false });
    });

    await Promise.all(updatePromises);
    console.log('All products reset to unpaid status');
  } catch (error) {
    console.error('Error resetting products:', error);
    throw error;
  }
};

/**
 * Get product count
 */
export const getProductCount = async (): Promise<number> => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting product count:', error);
    return 0;
  }
};

/**
 * Sample products for initial setup
 */
export const SAMPLE_PRODUCTS = [
  {
    name: 'T-shirt',
    description: 'Premium cotton T-shirt with a comfortable fit',
    price: 11.99,
    rfid_uid: 'A7F45C21',
    paid: false,
    stock: 10,
  },
  {
    name: 'Pant',
    description: 'Comfortable and durable cotton pants',
    price: 24.99,
    rfid_uid: 'B8G56D32',
    paid: false,
    stock: 8,
  },
  {
    name: 'Shirt',
    description: 'Stylish and breathable cotton shirt',
    price: 19.99,
    rfid_uid: 'C9H67E43',
    paid: false,
    stock: 15,
  },
  {
    name: 'Shoes',
    description: 'Durable and comfortable running shoes',
    price: 79.99,
    rfid_uid: 'D0I78F54',
    paid: false,
    stock: 20,
  },
  {
    name: 'Sneakers',
    description: 'Trendy and versatile sneakers for everyday wear',
    price: 64.99,
    rfid_uid: 'E1J89G65',
    paid: false,
    stock: 12,
  },
];
