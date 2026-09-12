const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://kirana-ai.vercel.app',
  'https://kirana-ai-mu.vercel.app',
  process.env.FRONTEND_URL,
].flatMap(origin => origin ? origin.split(',').map(value => value.trim()) : []);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Render deployments can serve the frontend from the same host as the API.
    if (origin.startsWith('https://') && origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/products',    require('./routes/products'));
app.use('/api/sales',       require('./routes/sales'));
app.use('/api/predictions', require('./routes/predictions'));

// Health check
app.get('/', (req, res) => res.json({ status: 'Kirana API running ✅' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(process.env.PORT, () =>
      console.log(`Server on port ${process.env.PORT} ✅`)
    );
  })
  .catch(err => console.error(err));