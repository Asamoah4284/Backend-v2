const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Artisan name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  story: {
    type: String,
    required: [true, 'Artisan story is required'],
    maxlength: [2000, 'Story cannot exceed 2000 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for total products count
artisanSchema.virtual('productCount').get(function() {
  return this.products ? this.products.length : 0;
});

// Ensure virtual fields are serialized
artisanSchema.set('toJSON', { virtuals: true });
artisanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Artisan', artisanSchema); 