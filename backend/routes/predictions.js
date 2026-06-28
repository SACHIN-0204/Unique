const router = require('express').Router();
const axios = require('axios');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
require('dotenv').config();

// Helper: fetch sales + call ML
async function predictForProduct(productId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const sales = await Sale.find({
    productId,
    date: { $gte: since }
  }).sort({ date: 1 });

  if (sales.length < 10) return null;

  const timeSeriesData = sales.map(s => ({
    ds: s.date.toISOString().split('T')[0],
    y: s.quantitySold
  }));

  const mlResponse = await axios.post(
    `${process.env.ML_SERVICE_URL}/predict`,
    { data: timeSeriesData, periods: days }
  );

  return mlResponse.data;
}

// ── Single product prediction ──────────────────────────────
router.get('/:productId', async (req, res) => {
  try {
    const result = await predictForProduct(
      req.params.productId,
      parseInt(req.query.days) || 7
    );
    if (!result) {
      return res.status(400).json({
        error: 'Not enough data. Need at least 10 days of sales history.'
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Batch prediction for ALL products ─────────────────────
router.get('/batch/all', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const products = await Product.find();

    const results = await Promise.all(
      products.map(async (product) => {
        try {
          const prediction = await predictForProduct(product._id, days);
          if (!prediction) {
            return {
              productId: product._id,
              productName: product.name,
              unit: product.unit,
              currentStock: product.currentStock,
              minThreshold: product.minThreshold,
              status: 'NO_DATA',
              forecast: [],
              totalPredictedDemand: 0,
              suggestedOrderQty: 0,
              urgency: 'UNKNOWN',
            };
          }

          const demand = prediction.totalPredictedDemand;
          const gap    = demand - product.currentStock;
          const urgency =
            product.currentStock <= product.minThreshold ? 'CRITICAL' :
            gap > 0                                      ? 'ORDER'    :
                                                           'SUFFICIENT';

          return {
            productId: product._id,
            productName: product.name,
            unit: product.unit,
            currentStock: product.currentStock,
            minThreshold: product.minThreshold,
            totalPredictedDemand: demand,
            suggestedOrderQty: Math.max(0, Math.ceil(gap)),
            urgency,
            forecast: prediction.forecast,
            modelInfo: prediction.modelInfo,
          };
        } catch {
          return {
            productId: product._id,
            productName: product.name,
            status: 'ERROR',
            urgency: 'UNKNOWN',
          };
        }
      })
    );

    // Sort: CRITICAL → ORDER → SUFFICIENT
    const order = { CRITICAL: 0, ORDER: 1, SUFFICIENT: 2, UNKNOWN: 3 };
    results.sort((a, b) => (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3));

    res.json({
      generatedAt: new Date().toISOString(),
      forecastDays: days,
      totalProducts: products.length,
      summary: {
        critical:   results.filter(r => r.urgency === 'CRITICAL').length,
        order:      results.filter(r => r.urgency === 'ORDER').length,
        sufficient: results.filter(r => r.urgency === 'SUFFICIENT').length,
      },
      products: results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;