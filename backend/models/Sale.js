const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: { type: String },    // denormalized for ML
  date: { type: Date, required: true },
  quantitySold: { type: Number, required: true },
  revenue: { type: Number },
}, { timestamps: true });

// Index for fast time-series queries
SaleSchema.index({ productId: 1, date: 1 });

module.exports = mongoose.model('Sale', SaleSchema);