const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: String,
  description: String,
  category: String,
  isAvailable: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0 },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'Artisan', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 