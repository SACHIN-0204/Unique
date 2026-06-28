const router = require('express').Router();
const Sale = require('../models/Sale');

// GET sales for a product (last N days)
router.get('/:productId', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sales = await Sale.find({
      productId: req.params.productId,
      date: { $gte: since }
    }).sort({ date: 1 });

    res.json(sales);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET daily summary across all products ─────────────────
router.get('/summary/daily', async (req, res) => {
  try {
    const days  = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const summary = await Sale.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: {
            date:     { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            category: '$productName',
          },
          totalQty:     { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$revenue' },
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET category-wise summary ─────────────────────────────
router.get('/summary/category', async (req, res) => {
  try {
    const days  = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Join with products to get category
    const summary = await Sale.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $lookup: {
          from:         'products',
          localField:   'productId',
          foreignField: '_id',
          as:           'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id:          '$product.category',
          totalQty:     { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$revenue' },
          topProduct: { $first: '$productName' },
          salesCount:   { $sum: 1 },
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST record single sale + update stock ────────────────
router.post('/', async (req, res) => {
  try {
    const { productId, productName, date, quantitySold, revenue } = req.body;

    const sale = await Sale.create({
      productId, productName,
      date: new Date(date),
      quantitySold,
      revenue: revenue || 0,
    });

    // Deduct from current stock
    await Product.findByIdAndUpdate(productId, {
      $inc: { currentStock: -quantitySold }
    });

    res.status(201).json(sale);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── POST bulk record multiple sales at once ───────────────
router.post('/bulk', async (req, res) => {
  try {
    const { sales } = req.body; // array of sale objects

    const created = await Sale.insertMany(
      sales.map(s => ({
        ...s,
        date: new Date(s.date),
      }))
    );

    // Update stock for each product
    for (const sale of sales) {
      await Product.findByIdAndUpdate(sale.productId, {
        $inc: { currentStock: -sale.quantitySold }
      });
    }

    res.status(201).json({
      message: `${created.length} sales recorded`,
      sales: created
    });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;