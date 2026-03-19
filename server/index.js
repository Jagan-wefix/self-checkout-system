import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Helper function to read data
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { products: [], settings: { merchant_upi_id: 'merchant@upi' } };
  }
};

// Helper function to write data
const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
  }
};

app.get('/api/product/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const product = data.products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payment/process', (req, res) => {
  try {
    const { productIds, totalAmount } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Invalid product IDs' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const data = readData();

    // Mark products as paid
    productIds.forEach(productId => {
      const product = data.products.find(p => p.id === productId);
      if (product) {
        product.paid = true;
      }
    });

    writeData(data);

    res.json({
      success: true,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/rfid/check/:rfid_uid', (req, res) => {
  try {
    const { rfid_uid } = req.params;
    const data = readData();
    const product = data.products.find(p => p.rfid_uid === rfid_uid);

    if (!product) {
      return res.status(404).json({ status: 'ALARM', error: 'Product not found' });
    }

    const status = product.paid ? 'ALLOW' : 'ALARM';
    res.json({ status });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ status: 'ALARM', error: 'Internal server error' });
  }
});

app.get('/api/settings/merchant-upi', (req, res) => {
  try {
    const data = readData();
    res.json({ merchant_upi_id: data.settings.merchant_upi_id });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
