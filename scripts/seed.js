const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Log the MongoDB URI to see if it's being loaded correctly
console.log('MONGODB_URI from .env:', process.env.MONGODB_URI);
console.log('Current working directory:', process.cwd());
console.log('Looking for .env at:', path.join(__dirname, '../.env'));

const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Product = require('../models/Product');

// Sample data
const sampleUsers = [
  {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Doe',
    points: 150
  },
  {
    email: 'jane@example.com',
    password: 'password123',
    name: 'Jane Smith',
    points: 75
  },
  {
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Johnson',
    points: 200
  }
];

const sampleArtisans = [
  {
    name: 'Aisha Okechukwu',
    story: 'Aisha is a master weaver from Nigeria, creating beautiful traditional textiles that tell stories of her ancestors. Her work has been passed down through generations, preserving the rich cultural heritage of the Yoruba people.',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    location: 'Lagos, Nigeria',
    specialty: 'Textile Weaving',
    isActive: true
  },
  {
    name: 'Kwame Asante',
    story: 'Kwame is a skilled woodcarver from Ghana, specializing in traditional Ashanti stools and ceremonial objects. His intricate carvings reflect the spiritual and cultural significance of Ashanti traditions.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    location: 'Kumasi, Ghana',
    specialty: 'Wood Carving',
    isActive: true
  },
  {
    name: 'Fatima Benali',
    story: 'Fatima creates stunning ceramic pottery inspired by Moroccan geometric patterns and Islamic art. Her pieces blend traditional techniques with contemporary design, making them perfect for modern homes.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    location: 'Fez, Morocco',
    specialty: 'Ceramic Pottery',
    isActive: true
  },
  {
    name: 'David Mwangi',
    story: 'David is a talented jewelry maker from Kenya, working with recycled materials and traditional beadwork techniques. His pieces celebrate the beauty of African craftsmanship while promoting sustainability.',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    location: 'Nairobi, Kenya',
    specialty: 'Jewelry Making',
    isActive: true
  }
];

const sampleProducts = [
  // Aisha's products
  {
    name: 'Traditional Yoruba Wrapper',
    price: 89.99,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    description: 'Handwoven cotton wrapper with traditional Yoruba patterns. Perfect for special occasions and cultural celebrations.',
    category: 'Textiles',
    isAvailable: true,
    stockQuantity: 15
  },
  {
    name: 'Adire Indigo Scarf',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    description: 'Beautiful indigo-dyed scarf using traditional Adire techniques. Each piece is unique and tells a story.',
    category: 'Accessories',
    isAvailable: true,
    stockQuantity: 25
  },
  
  // Kwame's products
  {
    name: 'Ashanti Stool',
    price: 299.99,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    description: 'Hand-carved Ashanti stool with traditional symbols. A piece of cultural heritage for your home.',
    category: 'Furniture',
    isAvailable: true,
    stockQuantity: 8
  },
  {
    name: 'Ceremonial Mask',
    price: 199.99,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: 'Intricately carved ceremonial mask representing Ashanti spiritual traditions.',
    category: 'Decor',
    isAvailable: true,
    stockQuantity: 5
  },
  
  // Fatima's products
  {
    name: 'Moroccan Tea Set',
    price: 129.99,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
    description: 'Handcrafted ceramic tea set with traditional Moroccan geometric patterns.',
    category: 'Kitchenware',
    isAvailable: true,
    stockQuantity: 12
  },
  {
    name: 'Decorative Plate',
    price: 79.99,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: 'Beautiful decorative plate perfect for wall display or special occasions.',
    category: 'Decor',
    isAvailable: true,
    stockQuantity: 20
  },
  
  // David's products
  {
    name: 'Recycled Bead Necklace',
    price: 65.00,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    description: 'Handcrafted necklace using recycled materials and traditional Kenyan beadwork.',
    category: 'Jewelry',
    isAvailable: true,
    stockQuantity: 30
  },
  {
    name: 'Bone Carved Bracelet',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
    description: 'Elegant bracelet carved from sustainable bone materials with traditional patterns.',
    category: 'Jewelry',
    isAvailable: true,
    stockQuantity: 18
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/artisans-circle');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Artisan.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name}`);
    }

    // Create artisans
    const createdArtisans = [];
    for (const artisanData of sampleArtisans) {
      const artisan = new Artisan(artisanData);
      await artisan.save();
      createdArtisans.push(artisan);
      console.log(`Created artisan: ${artisan.name}`);
    }

    // Create products and associate with artisans
    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = sampleProducts[i];
      const artisanIndex = Math.floor(i / 2); // 2 products per artisan
      const artisan = createdArtisans[artisanIndex];
      
      const product = new Product({
        ...productData,
        artisan: artisan._id
      });
      
      await product.save();
      
      // Add product to artisan's products array
      artisan.products.push(product._id);
      await artisan.save();
      
      console.log(`Created product: ${product.name} for ${artisan.name}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`📊 Created ${createdUsers.length} users`);
    console.log(`🎨 Created ${createdArtisans.length} artisans`);
    console.log(`🛍️ Created ${sampleProducts.length} products`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 