// ✅ Fix: use process.env directly (Docker injects env vars)
require('dotenv').config(); // Remove the path: '../.env' part

const mongoose = require('mongoose');
const Product  = require('../models/Product');
const Sale     = require('../models/Sale');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/kirana_db';

const products = [
  { name: 'Rice',         category: 'Grains',   unit: 'kg',    currentStock: 50, minThreshold: 10 },
  { name: 'Dal',          category: 'Grains',   unit: 'kg',    currentStock: 4,  minThreshold: 8  },
  { name: 'Sunflower Oil',category: 'Oil',      unit: 'litre', currentStock: 15, minThreshold: 5  },
  { name: 'Sugar',        category: 'Grains',   unit: 'kg',    currentStock: 3,  minThreshold: 10 },
  { name: 'Tea Powder',   category: 'Beverage', unit: 'kg',    currentStock: 6,  minThreshold: 4  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected ✅');

    await Product.deleteMany();
    await Sale.deleteMany();

    const created = await Product.insertMany(products);
    console.log('Products seeded ✅');

    const salesDocs = [];
    const today = new Date();

    for (const product of created) {
      for (let i = 90; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const baseQty   = product.name === 'Rice' ? 8 : 3;
        const qty       = baseQty + (isWeekend ? 3 : 0) + (Math.random() * 3 - 1);

        salesDocs.push({
          productId:    product._id,
          productName:  product.name,
          date,
          quantitySold: Math.max(0.5, parseFloat(qty.toFixed(2))),
          revenue:      parseFloat((qty * 50).toFixed(2)),
        });
      }
    }

    await Sale.insertMany(salesDocs);
    console.log(`${salesDocs.length} sales records seeded ✅`);

  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Done! Disconnected ✅');
    process.exit(0);
  }
}

seed();