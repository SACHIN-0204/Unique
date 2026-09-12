const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,  // set in Render env vars
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
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