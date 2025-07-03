require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Artisan = require('../models/Artisan');

const entrepreneurs = [
  {
    name: "Amara Okafor",
    story: "Creating eco-friendly fashion that celebrates African heritage while promoting sustainability.",
    imageUrl: "/placeholder.svg?height=120&width=120",
    location: "Lagos, Nigeria",
    specialty: "Fashion",
    isActive: true,
  },
  {
    name: "Kwame Asante",
    story: "Handcrafting premium leather goods using traditional Ghanaian techniques passed down through generations.",
    imageUrl: "/placeholder.svg?height=120&width=120",
    location: "Accra, Ghana",
    specialty: "Accessories",
    isActive: true,
  },
  {
    name: "Zara Mwangi",
    story: "Developing innovative tech solutions to empower small businesses across East Africa.",
    imageUrl: "/placeholder.svg?height=120&width=120",
    location: "Nairobi, Kenya",
    specialty: "Technology",
    isActive: true,
  },
  {
    name: "Ibrahim Diallo",
    story: "Bringing authentic West African flavors to the world through premium spice blends and sauces.",
    imageUrl: "/placeholder.svg?height=120&width=120",
    location: "Dakar, Senegal",
    specialty: "Food & Beverage",
    isActive: true,
  },
  {
    name: "Fatima Al-Rashid",
    story: "Creating organic skincare products using traditional Moroccan ingredients and modern science.",
    imageUrl: "/placeholder.svg?height=120&width=120",
    location: "Marrakech, Morocco",
    specialty: "Beauty & Wellness",
    isActive: true,
  },
  {
    name: "Nomsa Dlamini",
    story: "Crafting contemporary jewelry inspired by traditional South African beadwork and symbolism.",
    imageUrl: "/placeholder.svg?height=120&width=120",
    location: "Cape Town, South Africa",
    specialty: "Jewelry",
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_PROD, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await Artisan.deleteMany({});
  await Artisan.insertMany(entrepreneurs);
  console.log('Artisans seeded!');
  await mongoose.disconnect();
}

seed(); 