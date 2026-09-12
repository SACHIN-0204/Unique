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
].flatMap(origin => origin ? origin.split(',').map(value => {
  const trimmed = value.trim();
  return trimmed && /^https?:\/\//i.test(trimmed)
    ? trimmed.replace(/\/$/, '')
    : trimmed ? `https://${trimmed.replace(/\/$/, '')}` : null;
}).filter(Boolean) : []);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments and Render-hosted frontends.
    if (
      /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(origin) ||
      /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.onrender\.com$/i.test(origin)
    ) {
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