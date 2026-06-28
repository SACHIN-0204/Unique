const router = require('express').Router();
const Product = require('../models/Product');

// GET all products with stock status
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    const withStatus = products.map(p => ({
      ...p._doc,
      stockStatus: p.currentStock <= p.minThreshold ? 'LOW' : 'SUFFICIENT'
    }));
    res.json(withStatus);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update stock
router.put('/:id/stock', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { currentStock: req.body.currentStock },
      { new: true }
    );
    res.json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;