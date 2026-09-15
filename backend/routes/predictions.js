const router = require('express').Router();
const axios = require('axios');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
require('dotenv').config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL?.replace(/\/$/, '');

if (!ML_SERVICE_URL) {
  console.error('❌ ML_SERVICE_URL is not configured');
}

async function predictForProduct(productId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const sales = await Sale.find({
    productId,
    date: { $gte: since }
  }).sort({ date: 1 });

  console.log(
    `📊 Product ${productId}: ${sales.length} sales records found`
  );

  if (sales.length < 10) {
    return null;
  }

  const timeSeriesData = sales
    .filter(
      (s) =>
        s.date &&
        Number.isFinite(Number(s.quantitySold))
    )
    .map((s) => ({
      ds: new Date(s.date).toISOString().split('T')[0],
      y: Number(s.quantitySold)
    }));

  if (timeSeriesData.length < 10) {
    return null;
  }

  if (!ML_SERVICE_URL) {
    throw new Error('ML_SERVICE_URL environment variable is missing');
  }

  console.log(`🤖 Calling ML service: ${ML_SERVICE_URL}/predict`);

  try {
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        data: timeSeriesData,
        periods: Number(days)
      },
      {
        timeout: 180000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ ML service response received');

    return mlResponse.data;

  } catch (error) {
    console.error('❌ ML SERVICE ERROR');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      console.error('No response from ML service');
      console.error('URL:', `${ML_SERVICE_URL}/predict`);
      console.error('Message:', error.message);
    } else {
      console.error('Message:', error.message);
    }

    throw new Error(
      `ML service failed: ${error.response?.data?.error || error.message}`
    );
  }
}


// ─────────────────────────────────────────────
// ML SERVICE HEALTH CHECK
// ─────────────────────────────────────────────

router.get('/health/ml', async (req, res) => {
  try {
    if (!ML_SERVICE_URL) {
      return res.status(500).json({
        ok: false,
        error: 'ML_SERVICE_URL is not configured'
      });
    }

    const response = await axios.get(
      `${ML_SERVICE_URL}/health`,
      {
        timeout: 30000
      }
    );

    res.json({
      ok: true,
      mlService: response.data
    });

  } catch (error) {
    console.error(
      '❌ ML health check failed:',
      error.message
    );

    res.status(502).json({
      ok: false,
      error: error.message
    });
  }
});


// ─────────────────────────────────────────────
// SINGLE PRODUCT PREDICTION
// ─────────────────────────────────────────────

router.get('/:productId', async (req, res) => {
  try {
    const days = Math.min(
      Math.max(parseInt(req.query.days) || 7, 1),
      30
    );

    const result = await predictForProduct(
      req.params.productId,
      days
    );

    if (!result) {
      return res.status(400).json({
        error:
          'Not enough valid sales data. Need at least 10 sales records from the last 90 days.'
      });
    }

    res.json(result);

  } catch (err) {
    console.error(
      '❌ Prediction route error:',
      err
    );

    res.status(502).json({
      error: err.message || 'Prediction service unavailable'
    });
  }
});


// ─────────────────────────────────────────────
// BATCH PREDICTION
// ─────────────────────────────────────────────

router.get('/batch/all', async (req, res) => {
  try {
    const days = Math.min(
      Math.max(parseInt(req.query.days) || 7, 1),
      30
    );

    const products = await Product.find();

    const results = await Promise.all(
      products.map(async (product) => {
        try {
          const prediction = await predictForProduct(
            product._id,
            days
          );

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
              urgency: 'UNKNOWN'
            };
          }

          const demand =
            prediction.totalPredictedDemand || 0;

          const gap =
            demand - product.currentStock;

          const urgency =
            product.currentStock <= product.minThreshold
              ? 'CRITICAL'
              : gap > 0
              ? 'ORDER'
              : 'SUFFICIENT';

          return {
            productId: product._id,
            productName: product.name,
            unit: product.unit,
            currentStock: product.currentStock,
            minThreshold: product.minThreshold,
            totalPredictedDemand: demand,
            suggestedOrderQty: Math.max(
              0,
              Math.ceil(gap)
            ),
            urgency,
            forecast: prediction.forecast || [],
            modelInfo: prediction.modelInfo
          };

        } catch (error) {
          console.error(
            `Prediction failed for ${product._id}:`,
            error.message
          );

          return {
            productId: product._id,
            productName: product.name,
            status: 'ERROR',
            error: error.message,
            urgency: 'UNKNOWN'
          };
        }
      })
    );

    const order = {
      CRITICAL: 0,
      ORDER: 1,
      SUFFICIENT: 2,
      UNKNOWN: 3
    };

    results.sort(
      (a, b) =>
        (order[a.urgency] ?? 3) -
        (order[b.urgency] ?? 3)
    );

    res.json({
      generatedAt: new Date().toISOString(),
      forecastDays: days,
      totalProducts: products.length,

      summary: {
        critical: results.filter(
          (r) => r.urgency === 'CRITICAL'
        ).length,

        order: results.filter(
          (r) => r.urgency === 'ORDER'
        ).length,

        sufficient: results.filter(
          (r) => r.urgency === 'SUFFICIENT'
        ).length
      },

      products: results
    });

  } catch (err) {
    console.error(
      '❌ Batch prediction error:',
      err
    );

    res.status(500).json({
      error: err.message
    });
  }
});


module.exports = router;