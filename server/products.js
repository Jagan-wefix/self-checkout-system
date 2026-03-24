// hardcoded product list extracted from config

const now = () => new Date().toISOString();

export const products = [
  { id: 'PROD-0001', name: 'T-shirt', description: 'Premium cotton T-shirt with a comfortable fit', price: 11, stock: 10, rfid_uid: 'A7F45C21', paid: false, created_at: now() },
  { id: 'PROD-0002', name: 'Pant', description: 'Comfortable and durable cotton pants', price: 1, stock: 8, rfid_uid: 'B8G56D32', paid: false, created_at: now() },
  { id: 'PROD-0003', name: 'shirt', description: 'Stylish and breathable cotton shirt', price: 1, stock: 15, rfid_uid: 'C9H67E43', paid: false, created_at: now() },
  { id: 'PROD-0004', name: 'Shoes', description: 'Durable and comfortable running shoes', price: 1, stock: 20, rfid_uid: 'D0I78F54', paid: false, created_at: now() },
  { id: 'PROD-0005', name: 'Sneakers', description: 'Trendy and versatile sneakers for everyday wear', price: 1, stock: 12, rfid_uid: 'E1J89G65', paid: false, created_at: now() }
];
