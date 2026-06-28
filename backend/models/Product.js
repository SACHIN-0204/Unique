const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },       // "Rice", "Dal"
  category: { type: String, required: true },   // "Grains", "Oil"
  unit: { type: String, default: 'kg' },        // kg, litre, piece
  currentStock: { type: Number, default: 0 },   // current qty
  minThreshold: { type: Number, default: 5 },   // reorder level
  costPrice: { type: Number },
  sellingPrice: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);