const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

async function updateProducts() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/artisans-circle');
    console.log('Connected to MongoDB');

    // Update all products to be available
    const result = await Product.updateMany(
      {}, // Update all products
      { 
        $set: { 
          isAvailable: true,
          stockQuantity: 10
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} products to be available`);
    
    // Show current products
    const products = await Product.find({});
    console.log('\n📦 Current products:');
    products.forEach(product => {
      console.log(`- ${product.name}: $${product.price} (Available: ${product.isAvailable}, Stock: ${product.stockQuantity})`);
    });

  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  updateProducts();
}

module.exports = updateProducts; 