// backend/scripts/seedDatabase.js
// Run with: node scripts/seedDatabase.js
// ✅ Creates 10 Dealer users + 100 total items + 75 new items (27 March 2026 auctions)

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Item = require('../models/Item');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unica_db');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// ========== DEALER USERS (10) ==========
const dealerUsers = [
  {
    username: 'VintageVault',
    email: 'vintagevault@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Curating timeless fashion treasures since 2010 🎩',
    location: 'Mumbai, Maharashtra',
    rating: 4.8
  },
  {
    username: 'CardKingdom',
    email: 'cardkingdom@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Your one-stop shop for rare trading cards 🎴',
    location: 'Delhi, India',
    rating: 4.9
  },
  {
    username: 'AntiqueHaven',
    email: 'antiquehaven@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Preserving history, one piece at a time 🏛️',
    location: 'Bangalore, Karnataka',
    rating: 4.7
  },
  {
    username: 'GamingLegends',
    email: 'gaminglegends@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Retro gaming collectibles expert 🎮',
    location: 'Pune, Maharashtra',
    rating: 4.9
  },
  {
    username: 'SportsMemories',
    email: 'sportsmemories@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Authentic sports memorabilia dealer ⚽',
    location: 'Hyderabad, Telangana',
    rating: 4.6
  },
  {
    username: 'ComicVerse',
    email: 'comicverse@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Comic books from Golden Age to Modern 📚',
    location: 'Chennai, Tamil Nadu',
    rating: 4.8
  },
  {
    username: 'EliteCollectibles',
    email: 'elitecollectibles@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Premium collectibles for discerning buyers 💎',
    location: 'Kolkata, West Bengal',
    rating: 4.9
  },
  {
    username: 'TreasureTraders',
    email: 'treasuretraders@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Trading the world\'s finest collectibles 🌍',
    location: 'Ahmedabad, Gujarat',
    rating: 4.7
  },
  {
    username: 'RarityRealm',
    email: 'rarityrealm@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Where rarity meets reality ✨',
    location: 'Jaipur, Rajasthan',
    rating: 4.8
  },
  {
    username: 'HeritageHouse',
    email: 'heritagehouse@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'dealer',
    userType: 'seller',
    bio: 'Your heritage, our passion 🏺',
    location: 'Lucknow, Uttar Pradesh',
    rating: 4.9
  }
];

// ========== EXISTING DEMO USERS (5) ==========
const sampleUsers = [
  {
    username: 'CardCollector',
    email: 'cardcollector@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'pro',
    userType: 'seller',
    bio: 'Passionate Pokemon card collector',
    location: 'Mumbai, India',
    rating: 4.5
  },
  {
    username: 'RetroGamer',
    email: 'retrogamer@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'pro',
    userType: 'seller',
    bio: 'Vintage gaming enthusiast',
    location: 'Bangalore, India',
    rating: 4.3
  },
  {
    username: 'SportsVault',
    email: 'sportsvault@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'pro',
    userType: 'seller',
    bio: 'Sports memorabilia specialist',
    location: 'Delhi, India',
    rating: 4.6
  },
  {
    username: 'ComicGeek',
    email: 'comicgeek@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'pro',
    userType: 'seller',
    bio: 'Comic book lover and trader 📚',
    location: 'Pune, India',
    rating: 4.2
  },
  {
    username: 'AntiqueElite',
    email: 'antiqueelite@unica.com',
    password: 'password123',
    isPremium: true,
    premiumTier: 'pro',
    userType: 'seller',
    bio: 'Elite antique connoisseur',
    location: 'Chennai, India',
    rating: 4.7
  }
];

// Function to create all items
const createAllItems = (users) => {
  const userMap = {};

  // Map existing users
  ['CardCollector', 'RetroGamer', 'SportsVault', 'ComicGeek', 'AntiqueElite'].forEach(name => {
    const user = users.find(u => u.username === name);
    if (user) userMap[name] = user._id;
  });

  // Map dealer users
  dealerUsers.forEach(dealer => {
    const user = users.find(u => u.username === dealer.username);
    if (user) userMap[dealer.username] = user._id;
  });

  const getRandomSeller = (category) => {
    const sellers = {
      'Trading Cards': ['CardCollector', 'CardKingdom', 'RarityRealm'],
      'Gaming Collectibles': ['RetroGamer', 'GamingLegends', 'TreasureTraders'],
      'Sports Memorabilia': ['SportsVault', 'SportsMemories', 'EliteCollectibles'],
      'Comic Books': ['ComicGeek', 'ComicVerse', 'TreasureTraders'],
      'Elite Antiquities': ['AntiqueElite', 'AntiqueHaven', 'HeritageHouse', 'EliteCollectibles'],
      'Vintage Fashion': ['VintageVault', 'EliteCollectibles', 'RetroGamer']
    };

    const categorySellerNames = sellers[category] || Object.keys(userMap);
    const randomName = categorySellerNames[Math.floor(Math.random() * categorySellerNames.length)];
    return userMap[randomName];
  };

  // ── Auction times for 27 March 2026 (9:30AM to 4:30PM IST) ──
  const auctionTimes = [
    new Date('2026-03-27T04:00:00.000Z'), // 9:30 AM IST
    new Date('2026-03-27T04:30:00.000Z'), // 10:00 AM IST
    new Date('2026-03-27T05:00:00.000Z'), // 10:30 AM IST
    new Date('2026-03-27T05:30:00.000Z'), // 11:00 AM IST
    new Date('2026-03-27T06:00:00.000Z'), // 11:30 AM IST
    new Date('2026-03-27T06:30:00.000Z'), // 12:00 PM IST
    new Date('2026-03-27T07:00:00.000Z'), // 12:30 PM IST
    new Date('2026-03-27T07:30:00.000Z'), // 1:00 PM IST
    new Date('2026-03-27T08:00:00.000Z'), // 1:30 PM IST
    new Date('2026-03-27T08:30:00.000Z'), // 2:00 PM IST
    new Date('2026-03-27T09:00:00.000Z'), // 2:30 PM IST
    new Date('2026-03-27T09:30:00.000Z'), // 3:00 PM IST
    new Date('2026-03-27T10:00:00.000Z'), // 3:30 PM IST
    new Date('2026-03-27T10:30:00.000Z'), // 4:00 PM IST
    new Date('2026-03-27T11:00:00.000Z'), // 4:30 PM IST
  ];

  return [
    // ========== ORIGINAL ITEMS (from first seed) ==========

    // ── TRADING CARDS (8) ──
    {
      title: "Charizard 1st Edition PSA 10",
      description: "Mint condition first edition Charizard from Base Set. Graded PSA 10 - the highest grade possible.",
      price: 500000,
      category: "Trading Cards",
      condition: "mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Holographic Pikachu Pokemon Card",
      description: "First edition holographic Pikachu from Base Set. Near mint condition.",
      price: 12000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Pikachu Illustrator Card",
      description: "One of the rarest Pokemon cards ever made. Only 39 exist worldwide.",
      price: 1000000,
      currentBid: 1050000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Black Lotus Alpha Edition",
      description: "Magic: The Gathering Black Lotus from Alpha set. The holy grail of MTG cards.",
      price: 750000,
      category: "Trading Cards",
      condition: "excellent",
      type: "trade",
      tradePreference: "Power Nine cards or complete Pokemon Base Set 1st Edition",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Yu-Gi-Oh! Blue-Eyes White Dragon 1st Ed",
      description: "LOB-001 1st Edition Blue-Eyes White Dragon in near mint condition.",
      price: 22000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Babe Ruth Baseball Card 1933",
      description: "1933 Goudey Babe Ruth #53. Graded PSA 7.",
      price: 180000,
      currentBid: 200000,
      category: "Trading Cards",
      condition: "excellent",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Mewtwo Shadowless Holographic",
      description: "Shadowless Mewtwo from Base Set. Highly sought after variant.",
      price: 18000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Mox Sapphire Unlimited",
      description: "MTG Mox Sapphire from Unlimited edition. Part of the Power Nine.",
      price: 120000,
      category: "Trading Cards",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },

    // ── GAMING COLLECTIBLES (8) ──
    {
      title: "Nintendo Game Boy Color Pikachu Edition",
      description: "Limited edition Pikachu Game Boy Color in excellent condition.",
      price: 15000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Original PlayStation PSP Console",
      description: "Classic PSP-1000 series with charger and 5 games.",
      price: 8000,
      category: "Gaming Collectibles",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Nintendo 64 Console Bundle",
      description: "N64 with 4 controllers and 8 games including GoldenEye and Mario Kart 64.",
      price: 15000,
      category: "Gaming Collectibles",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Sega Genesis Console Complete",
      description: "Complete in box Sega Genesis with all original packaging.",
      price: 8000,
      currentBid: 9000,
      category: "Gaming Collectibles",
      condition: "good",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Original Game Boy with 10 Games",
      description: "Classic Game Boy with Tetris, Pokemon Red, Super Mario Land and more.",
      price: 10000,
      currentBid: 12000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Super Mario Bros NES Sealed",
      description: "Factory sealed Super Mario Bros for NES. Graded WATA 9.4 A+.",
      price: 85000,
      currentBid: 92000,
      category: "Gaming Collectibles",
      condition: "mint",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Sega Dreamcast Complete Set",
      description: "Dreamcast with 2 controllers, VMU cards, and 12 games.",
      price: 9500,
      category: "Gaming Collectibles",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Nintendo Virtual Boy Collection",
      description: "Complete Virtual Boy collection with every game released.",
      price: 35000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "trade",
      tradePreference: "Rare Sega Saturn games or Neo Geo AES console",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },

    // ── SPORTS MEMORABILIA (5) ──
    {
      title: "Signed Cristiano Ronaldo Jersey",
      description: "Portugal national team Euro 2016 jersey signed by Ronaldo with COA.",
      price: 45000,
      category: "Sports Memorabilia",
      condition: "mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Vintage Manchester United Jersey 1999",
      description: "Treble winning season jersey signed by key players with authentication.",
      price: 20000,
      currentBid: 25000,
      category: "Sports Memorabilia",
      condition: "good",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Signed LeBron James Basketball",
      description: "Official NBA basketball signed by LeBron James with Upper Deck COA.",
      price: 28000,
      category: "Sports Memorabilia",
      condition: "mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Michael Jordan Signed Championship Ball",
      description: "Signed during Bulls' 1996 championship run. PSA/DNA authenticated.",
      price: 45000,
      currentBid: 52000,
      category: "Sports Memorabilia",
      condition: "mint",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Kobe Bryant Game-Worn Jersey 2010",
      description: "Authentic game-worn Lakers jersey from 2010 NBA Finals.",
      price: 65000,
      category: "Sports Memorabilia",
      condition: "good",
      type: "trade",
      tradePreference: "Michael Jordan signed items with authentication",
      images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },

    // ── COMIC BOOKS (4) ──
    {
      title: "Spider-Man #1 Comic (1963)",
      description: "Amazing Spider-Man #1 from 1963. CGC 6.5 graded.",
      price: 125000,
      category: "Comic Books",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Marvel Comics Collection 90s",
      description: "25 vintage Marvel comics from 90s in protective sleeves.",
      price: 15000,
      category: "Comic Books",
      condition: "good",
      type: "trade",
      tradePreference: "DC Comics collection or vintage gaming consoles",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Action Comics #1 (1938)",
      description: "First appearance of Superman! CGC 2.0 graded. Holy grail of comics.",
      price: 500000,
      currentBid: 550000,
      category: "Comic Books",
      condition: "fair",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Batman Animated Series Production Cels",
      description: "Collection of 15 production animation cels from Batman TAS.",
      price: 28000,
      category: "Comic Books",
      condition: "mint",
      type: "trade",
      tradePreference: "X-Men animated series cels or Jim Lee original art",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },

    // ── ELITE ANTIQUITIES (4) ──
    {
      title: "Antique Victorian Chair 1880s",
      description: "Authentic Victorian wooden chair with intricate carvings. Professionally restored.",
      price: 75000,
      category: "Elite Antiquities",
      condition: "fair",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Antique French Grandfather Clock",
      description: "19th century French clock with working mechanism. Walnut wood with brass.",
      price: 95000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Antique Persian Rug Handwoven",
      description: "Hand-woven Persian rug from 1920s. Silk and wool. 6x9 feet.",
      price: 85000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Vintage Rolex Submariner 1970s",
      description: "1970s Rolex Submariner ref. 1680. Serviced with box and papers.",
      price: 250000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1587836374492-4d1e0d0d0a8e?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },

    // ── VINTAGE FASHION (4) ──
    {
      title: "Vintage Nike Air Jordan 1 (1985)",
      description: "Original 1985 Air Jordan 1 Chicago colorway. Size 10.",
      price: 35000,
      currentBid: 38000,
      category: "Vintage Fashion",
      condition: "good",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Supreme Box Logo Hoodie 2016",
      description: "Supreme Box Logo black hoodie size L from fall/winter 2016. Authenticated.",
      price: 18000,
      category: "Vintage Fashion",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Yeezy Boost 350 V2 Pirate Black",
      description: "First release Yeezy 350 V2 2015. Size 9. Deadstock in original box.",
      price: 25000,
      currentBid: 28000,
      category: "Vintage Fashion",
      condition: "mint",
      type: "auction",
      auctionEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Vintage Chanel 2.55 Handbag",
      description: "Classic Chanel 2.55 from 1980s in excellent condition.",
      price: 120000,
      category: "Vintage Fashion",
      condition: "excellent",
      type: "trade",
      tradePreference: "Hermès Birkin 30 or Kelly bag with authentication papers",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },

    // ========== NEW ITEMS — 27 MARCH 2026 ==========

    // ── AUCTIONS (25) ──
    {
      title: "Dragonball Z Goku 1st Edition Holo Card 1999",
      description: "Ultra rare 1999 Dragonball Z CCG holographic Goku card. First edition print run. Graded BGS 9.",
      price: 18000,
      currentBid: 20000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "auction",
      auctionEndDate: auctionTimes[0],
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "One Piece Luffy Rare Holo Promo Card",
      description: "Extremely rare One Piece TCG holographic Luffy promo. Only distributed at 2023 World Championships.",
      price: 25000,
      currentBid: 27500,
      category: "Trading Cards",
      condition: "mint",
      type: "auction",
      auctionEndDate: auctionTimes[1],
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Naruto Shippuden Itachi 1st Edition Holo",
      description: "First edition holographic Itachi Uchiha card from Naruto CCG. BGS 9.5 graded. Fan favourite.",
      price: 12000,
      currentBid: 14000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "auction",
      auctionEndDate: auctionTimes[2],
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Sachin Tendulkar Rookie Cricket Card PSA 9",
      description: "Ultra rare Sachin Tendulkar 1989 rookie card. PSA 9 graded. One of very few known to exist.",
      price: 95000,
      currentBid: 105000,
      category: "Trading Cards",
      condition: "mint",
      type: "auction",
      auctionEndDate: auctionTimes[3],
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Digimon Metalgreymon 1st Edition Holo",
      description: "First edition holographic MetalGreymon from the original Digimon Card Game set 1. BGS 8.5.",
      price: 8000,
      currentBid: 9200,
      category: "Trading Cards",
      condition: "near-mint",
      type: "auction",
      auctionEndDate: auctionTimes[4],
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Vintage Indian Stamps Collection 1940s",
      description: "Set of 12 rare pre-independence Indian stamps from 1940-1947. Includes the rare Anna stamps.",
      price: 35000,
      currentBid: 38000,
      category: "Elite Antiquities",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[5],
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "1947 Indian Independence Commemorative Coin Set",
      description: "Complete set of 5 coins minted to commemorate Indian independence. Original government packaging.",
      price: 55000,
      currentBid: 62000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "auction",
      auctionEndDate: auctionTimes[6],
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Antique Mughal Era Bronze Dagger",
      description: "Authentic Mughal era ornamental bronze dagger with detailed engravings. Circa 17th century.",
      price: 150000,
      currentBid: 165000,
      category: "Elite Antiquities",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[7],
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Original Star Wars 1977 Movie Poster",
      description: "Original theatrical release Star Wars A New Hope 1977 poster. NSS style B. Linen backed.",
      price: 80000,
      currentBid: 88000,
      category: "Vintage Fashion",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[8],
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Hot Wheels Redline Collection 1968 (Set of 8)",
      description: "Eight original 1968 Hot Wheels Redline cars in original blister packaging. Extremely rare set.",
      price: 42000,
      currentBid: 47000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "auction",
      auctionEndDate: auctionTimes[9],
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage GI Joe Action Figure Set 1982",
      description: "Original 1982 GI Joe 3.75 inch figure complete set of 13. All accessories included. C8 condition.",
      price: 28000,
      currentBid: 31000,
      category: "Gaming Collectibles",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[10],
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "MS Dhoni Signed Test Match Bat 2011",
      description: "Willow cricket bat signed by MS Dhoni during the 2011 World Cup campaign. COA included.",
      price: 75000,
      currentBid: 82000,
      category: "Sports Memorabilia",
      condition: "excellent",
      type: "auction",
      auctionEndDate: auctionTimes[11],
      images: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Vintage Levi's 501 Selvedge Denim 1970s",
      description: "Authentic 1970s Levi's 501 selvedge denim jeans. Size 32x32. Big E tag. Excellent fade.",
      price: 22000,
      currentBid: 24500,
      category: "Vintage Fashion",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[12],
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "X-Men #1 Jim Lee Cover CGC 9.6",
      description: "1991 X-Men #1 Jim Lee cover variant. CGC graded 9.6 white pages. Iconic cover art.",
      price: 18000,
      currentBid: 21000,
      category: "Comic Books",
      condition: "near-mint",
      type: "auction",
      auctionEndDate: auctionTimes[13],
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Incredible Hulk #181 First Wolverine CGC 7.0",
      description: "First full appearance of Wolverine. CGC 7.0 graded. Key silver age book.",
      price: 220000,
      currentBid: 240000,
      category: "Comic Books",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[14],
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Vintage Omega Seamaster 1960s",
      description: "1965 Omega Seamaster 300 ref 165.024. Cal 552 movement. Original dial and hands. Serviced.",
      price: 185000,
      currentBid: 200000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "auction",
      auctionEndDate: auctionTimes[0],
      images: ["https://images.unsplash.com/photo-1587836374492-4d1e0d0d0a8e?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Beyblade G-Revolution Dranzer MS Sealed",
      description: "Factory sealed Beyblade Dranzer MS from G-Revolution series 2003. Never opened.",
      price: 9000,
      currentBid: 10500,
      category: "Gaming Collectibles",
      condition: "mint",
      type: "auction",
      auctionEndDate: auctionTimes[1],
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Tintin Herge Print 1950s",
      description: "Original 1950s Tintin lithograph print signed by Herge studio. Framed. COA included.",
      price: 65000,
      currentBid: 72000,
      category: "Comic Books",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[2],
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Virat Kohli Signed ODI Jersey 2023",
      description: "Signed India ODI jersey from 2023 World Cup campaign. COA from BCCI official merchandise.",
      price: 55000,
      currentBid: 61000,
      category: "Sports Memorabilia",
      condition: "mint",
      type: "auction",
      auctionEndDate: auctionTimes[3],
      images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Vintage Casio G-Shock DW-5000 1983",
      description: "Original 1983 first generation Casio G-Shock DW-5000C. Working condition with original box.",
      price: 48000,
      currentBid: 53000,
      category: "Vintage Fashion",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[4],
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Pokemon Jungle Set Booster Box Sealed",
      description: "Factory sealed Pokemon Jungle set booster box 1999. 36 packs. WATA authenticated.",
      price: 280000,
      currentBid: 310000,
      category: "Trading Cards",
      condition: "mint",
      type: "auction",
      auctionEndDate: auctionTimes[5],
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Antique Rajasthani Miniature Painting 18th Century",
      description: "Original 18th century Rajasthani school miniature painting on ivory. Museum quality piece.",
      price: 120000,
      currentBid: 135000,
      category: "Elite Antiquities",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[6],
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Transformers G1 Optimus Prime 1984 Sealed",
      description: "Factory sealed Generation 1 Optimus Prime from 1984. C9 box condition. Extremely rare find.",
      price: 95000,
      currentBid: 105000,
      category: "Gaming Collectibles",
      condition: "mint",
      type: "auction",
      auctionEndDate: auctionTimes[7],
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Air Jordan 3 Black Cement 1988",
      description: "Original 1988 Air Jordan 3 Black Cement. Size 9. Used but well preserved. COA from StockX.",
      price: 68000,
      currentBid: 75000,
      category: "Vintage Fashion",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[8],
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Detective Comics #27 First Batman Reprint 1939",
      description: "High quality 1939 reprint of Detective Comics #27. First appearance of Batman. CGC 8.0.",
      price: 45000,
      currentBid: 50000,
      category: "Comic Books",
      condition: "good",
      type: "auction",
      auctionEndDate: auctionTimes[9],
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },

    // ── BUY NOW (25) ──
    {
      title: "Pokemon Base Set Complete 102/102",
      description: "Complete 102 card Pokemon Base Set including all holos. All cards in near mint condition.",
      price: 45000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Magic The Gathering Dual Land Plateau",
      description: "Unlimited edition Plateau dual land. Lightly played. One of the most sought after lands in MTG.",
      price: 32000,
      category: "Trading Cards",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Vintage Zippo Lighter Collection 1950s (Set of 6)",
      description: "Six authentic 1950s Zippo lighters with original engravings. All working. Original boxes.",
      price: 28000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Lego Star Wars Millennium Falcon 2007 Sealed",
      description: "Factory sealed Lego Star Wars Millennium Falcon set 10179 from 2007. Rarest Lego set ever made.",
      price: 180000,
      category: "Gaming Collectibles",
      condition: "mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Rajasthani Silver Anklets Pair 1900s",
      description: "Pair of antique Rajasthani pure silver anklets from early 1900s. Intricate tribal work.",
      price: 42000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Vintage He-Man Masters of the Universe 1982 Set",
      description: "Original 1982 He-Man figure with Battle Cat, Skeletor, and Castle Grayskull playset.",
      price: 35000,
      category: "Gaming Collectibles",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Pendleton Wool Blanket 1960s",
      description: "Authentic 1960s Pendleton wool blanket in Chief Joseph pattern. Full size. Excellent condition.",
      price: 18000,
      category: "Vintage Fashion",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Spider-Man Maximum Carnage Complete Arc",
      description: "Complete 14-part Maximum Carnage crossover arc. All in near mint condition with bags and boards.",
      price: 12000,
      category: "Comic Books",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Antique Brass Telescope 19th Century",
      description: "Victorian era brass telescope circa 1870. Fully functional. 3 draw extension. Leather wrapped.",
      price: 55000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Yu-Gi-Oh! Dark Magician Girl Ultra Rare LOD",
      description: "Legend of Duelist Dark Magician Girl Ultra Rare 1st edition. BGS 9. Fan favourite card.",
      price: 15000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Vintage Polaroid SX-70 Camera 1972",
      description: "Original 1972 Polaroid SX-70 Land Camera. Fully working. Comes with leather case and film.",
      price: 22000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Gundam RX-78-2 Perfect Grade 1/60 Sealed",
      description: "Bandai Perfect Grade RX-78-2 Gundam 1/60 scale. Factory sealed. 2019 release.",
      price: 18000,
      category: "Gaming Collectibles",
      condition: "mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Silk Banarasi Saree 1950s",
      description: "Hand-woven pure silk Banarasi saree from 1950s. Zari work intact. Collector's piece.",
      price: 35000,
      category: "Vintage Fashion",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Invincible Iron Man #128 Demon in a Bottle",
      description: "Classic Demon in a Bottle arc issue #128. CGC 9.2. Key issue in Iron Man history.",
      price: 8500,
      category: "Comic Books",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Vintage Tambola Set 1960s Wooden",
      description: "Complete vintage wooden Tambola (Bingo) set from 1960s India. Hand carved tokens and board.",
      price: 12000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Dragon Ball Z Cell Saga Action Figure Set",
      description: "Complete set of 8 DBZ Cell Saga Irwin figures from 1999. All original accessories included.",
      price: 14000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Kolhapuri Chappals Hand Tooled 1970s",
      description: "Authentic hand-tooled Kolhapuri chappals from master craftsman in Kolhapur. 1970s make.",
      price: 8500,
      category: "Vintage Fashion",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Antique Tanjore Painting Krishna 19th Century",
      description: "Original 19th century Tanjore painting of Krishna on wood panel. Gold leaf work intact.",
      price: 95000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Vintage Coca-Cola Tin Sign 1950s USA",
      description: "Original 1950s embossed Coca-Cola tin sign from USA. 18x24 inches. Minor surface wear.",
      price: 22000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Ninja Turtles Original Figure Set 1988 Playmates",
      description: "Original 1988 Playmates TMNT set of 4 turtles with all accessories. C8.5 condition.",
      price: 32000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Daredevil #168 First Elektra CGC 9.4",
      description: "First appearance of Elektra. CGC 9.4 white pages. Frank Miller art. Key Marvel book.",
      price: 28000,
      category: "Comic Books",
      condition: "near-mint",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Vintage Mumbai Local Train Season Pass 1950s",
      description: "Rare printed card season pass for Bombay local trains from 1952. Collector's curiosity.",
      price: 5500,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Vintage Kodak Brownie Camera 1950s",
      description: "Original 1950s Kodak Brownie Hawkeye camera. Working condition. Original flash attachment.",
      price: 9500,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Rare India Post Stamp Error Print 1968",
      description: "Rare India Post stamp with printing error from 1968. Double impression variety. Certified.",
      price: 18000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Vintage Hercules Bicycle 1970s India",
      description: "Fully restored vintage Hercules roadster bicycle from 1970s India. Original paintwork preserved.",
      price: 35000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Vintage HMV Gramophone Record Player 1940s",
      description: "Working 1940s HMV gramophone with original horn. Comes with 12 original 78 RPM records.",
      price: 65000,
      category: "Elite Antiquities",
      condition: "good",
      type: "buy",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },

    // ── TRADE (25) ──
    {
      title: "Pokemon Gold Star Espeon BGS 9",
      description: "Gold Star Espeon from EX Team Rocket Returns. BGS 9 graded. One of the rarest Pokemon cards.",
      price: 85000,
      category: "Trading Cards",
      condition: "near-mint",
      type: "trade",
      tradePreference: "Gold Star Umbreon or Charizard 1st Edition Base Set",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Vintage Seiko 6105 Diver 1970s",
      description: "1973 Seiko 6105-8110 Captain Willard dive watch. All original. Great patina on dial.",
      price: 95000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Vintage Rolex Explorer or Omega Constellation from same era",
      images: ["https://images.unsplash.com/photo-1587836374492-4d1e0d0d0a8e?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Original NES Famicom Disk System Complete",
      description: "Complete Famicom Disk System with RAM adapter, power supply, and 15 disk games.",
      price: 28000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "trade",
      tradePreference: "Sega Saturn with CPS2 games or Neo Geo MVS cartridges",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Antique Brass Hookah 1800s Mughal",
      description: "Authentic Mughal period brass hookah from 1800s with detailed floral engravings. Museum piece.",
      price: 65000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Antique Mughal jewellery or rare Indian coins collection",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "MTG Power Nine - Time Walk Unlimited",
      description: "Time Walk from MTG Unlimited edition. Lightly played. Part of the legendary Power Nine.",
      price: 180000,
      category: "Trading Cards",
      condition: "excellent",
      type: "trade",
      tradePreference: "Ancestral Recall or Mox Ruby from Alpha or Beta edition",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Vintage Rajput Sword Talwar 18th Century",
      description: "18th century Rajput cavalry talwar with original scabbard. Steel blade with gold inlay handle.",
      price: 120000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Mughal era armour pieces or antique firearms with paperwork",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Neo Geo AES Console with 10 Games",
      description: "Neo Geo AES home console with 10 AES cartridges including Metal Slug and King of Fighters 98.",
      price: 95000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "trade",
      tradePreference: "CPS2 arcade board collection or complete TurboGrafx-16 library",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Amazing Fantasy #15 Facsimile CGC 9.8",
      description: "CGC 9.8 graded facsimile edition of Amazing Fantasy #15. First Spider-Man. Perfect condition.",
      price: 8500,
      category: "Comic Books",
      condition: "mint",
      type: "trade",
      tradePreference: "Fantastic Four #1 facsimile CGC 9.8 or X-Men #1 CGC 9.6",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Vintage Hermes Silk Scarf 1970s",
      description: "Authentic 1970s Hermes silk scarf in Brides de Gala print. 90x90cm. Original box.",
      price: 45000,
      category: "Vintage Fashion",
      condition: "excellent",
      type: "trade",
      tradePreference: "Vintage Louis Vuitton Speedy 30 or Chanel classic flap bag",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Sourav Ganguly Signed Test Match Gloves",
      description: "Match worn and signed batting gloves by Sourav Ganguly from 2001 India vs Australia series.",
      price: 55000,
      category: "Sports Memorabilia",
      condition: "good",
      type: "trade",
      tradePreference: "Sachin Tendulkar or Rahul Dravid signed memorabilia with COA",
      images: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Vintage Meccano Construction Set 1960s Complete",
      description: "Complete 1960s Meccano set No.10 with original manual. All parts present. Original wooden box.",
      price: 32000,
      category: "Gaming Collectibles",
      condition: "good",
      type: "trade",
      tradePreference: "Vintage Hornby train set or Corgi diecast collection",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Antique Kashida Embroidery Panel Kashmir 1900s",
      description: "Hand embroidered Kashida panel from Kashmir circa 1900. Silk thread on wool. Framed.",
      price: 48000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Antique Pashmina shawl or Phulkari embroidery from Punjab",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Dragon Ball Super Card Game Sealed Case",
      description: "Factory sealed Dragon Ball Super Card Game Extreme Evolution booster case. 12 boxes.",
      price: 35000,
      category: "Trading Cards",
      condition: "mint",
      type: "trade",
      tradePreference: "One Piece TCG sealed case or Flesh and Blood sealed product",
      images: ["https://images.unsplash.com/photo-1606509026399-e5c9b6b1f72f?w=800"],
      seller: getRandomSeller('Trading Cards'),
      status: 'active'
    },
    {
      title: "Vintage Enfield Bullet 350 1960s Parts Collection",
      description: "Rare original spare parts collection for 1960s Royal Enfield Bullet 350. 40+ pieces.",
      price: 42000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Vintage Yezdi or Jawa motorcycle parts or Lambretta scooter",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Spawn #1 Todd McFarlane CGC 9.8",
      description: "Spawn #1 first issue CGC 9.8 white pages. Todd McFarlane signature series. Key Image book.",
      price: 22000,
      category: "Comic Books",
      condition: "mint",
      type: "trade",
      tradePreference: "Sandman #1 CGC 9.6 or Preacher #1 CGC 9.8",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Vintage Louis Vuitton Keepall 55 1980s",
      description: "Authentic 1980s Louis Vuitton Keepall 55 in monogram canvas. Date code SP0938. Good patina.",
      price: 85000,
      category: "Vintage Fashion",
      condition: "good",
      type: "trade",
      tradePreference: "Vintage Gucci or Fendi travel bag from same era",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Antique Saraswati Bronze Idol 15th Century",
      description: "Rare 15th century South Indian bronze Saraswati idol. Chola style casting. Patina intact.",
      price: 250000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Nataraja bronze idol of similar age or antique temple jewellery",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Original Xbox Dev Kit Console",
      description: "Rare original Xbox development kit console. Works perfectly. Extremely rare piece of gaming history.",
      price: 65000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "trade",
      tradePreference: "PS2 dev kit or Gamecube development hardware",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Bata Catalogue Shoes 1960s India",
      description: "Pair of deadstock 1960s Bata catalogue shoes never worn. Original box with price tag. Size 9.",
      price: 12000,
      category: "Vintage Fashion",
      condition: "mint",
      type: "trade",
      tradePreference: "Other deadstock Indian footwear from pre-1970s era",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Wolverine #1 Limited Series CGC 9.6",
      description: "1982 Wolverine Limited Series #1 by Chris Claremont and Frank Miller. CGC 9.6 white pages.",
      price: 35000,
      category: "Comic Books",
      condition: "near-mint",
      type: "trade",
      tradePreference: "X-Men #1 1963 in similar grade or Giant Size X-Men #1 CGC 7.0",
      images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800"],
      seller: getRandomSeller('Comic Books'),
      status: 'active'
    },
    {
      title: "Anil Kumble Match Worn Bowling Spikes 1999",
      description: "Match worn bowling spikes by Anil Kumble from the famous 10 wicket haul against Pakistan 1999.",
      price: 75000,
      category: "Sports Memorabilia",
      condition: "good",
      type: "trade",
      tradePreference: "Kapil Dev or Sunil Gavaskar signed equipment with authentication",
      images: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"],
      seller: getRandomSeller('Sports Memorabilia'),
      status: 'active'
    },
    {
      title: "Vintage Parker 51 Fountain Pen Set 1950s",
      description: "Parker 51 Aerometric set in Cordovan Brown from 1952. Gold nib. Original box and papers.",
      price: 18000,
      category: "Elite Antiquities",
      condition: "excellent",
      type: "trade",
      tradePreference: "Montblanc 149 or Pelikan M1000 vintage set from same era",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
    {
      title: "Digimon Adventure Original Production Cel",
      description: "Original animation production cel from Digimon Adventure anime 1999. Agumon featured.",
      price: 28000,
      category: "Gaming Collectibles",
      condition: "excellent",
      type: "trade",
      tradePreference: "Pokemon anime original cel or Dragon Ball Z production art",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800"],
      seller: getRandomSeller('Gaming Collectibles'),
      status: 'active'
    },
    {
      title: "Vintage Cotton Mill Worker Jacket 1940s India",
      description: "Authentic 1940s Bombay cotton mill worker's jacket. Rare piece of Indian industrial history.",
      price: 15000,
      category: "Vintage Fashion",
      condition: "good",
      type: "trade",
      tradePreference: "Other pre-independence Indian workwear or military uniform",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
      seller: getRandomSeller('Vintage Fashion'),
      status: 'active'
    },
    {
      title: "Antique Kerala Bronze Oil Lamp Nilavilakku",
      description: "Traditional Kerala Nilavilakku bronze oil lamp circa 1850. 5 feet tall. Temple grade casting.",
      price: 85000,
      category: "Elite Antiquities",
      condition: "good",
      type: "trade",
      tradePreference: "Antique Nettipattam elephant headgear or temple bronze collection",
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"],
      seller: getRandomSeller('Elite Antiquities'),
      status: 'active'
    },
  ];
};

const seedDatabase = async () => {
  try {
    console.log('\n🔍 Checking database...');

    // Delete demo accounts only
    const demoEmails = [...sampleUsers.map(u => u.email), ...dealerUsers.map(u => u.email)];
    await User.deleteMany({ email: { $in: demoEmails } });
    await Item.deleteMany({ seller: { $in: await User.find({ email: { $in: demoEmails } }).select('_id') } });

    // Preserve real users
    const realUsers = await User.find({ email: { $nin: demoEmails } });
    console.log(`✅ Preserved ${realUsers.length} real user(s)`);

    // Create all users (dealers + sample users)
    console.log('\n👥 Creating users...');
    const allDemoUsers = [...dealerUsers, ...sampleUsers];
    const users = await User.create(allDemoUsers);
    console.log(`✅ Created ${users.length} users (${dealerUsers.length} dealers, ${sampleUsers.length} others)`);

    // Create all items
    console.log('\n📦 Creating items...');
    const allItems = createAllItems(users);
    const items = await Item.insertMany(allItems);
    console.log(`✅ Created ${items.length} items`);

    // Summary
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const dealers = await User.countDocuments({ premiumTier: 'dealer' });

    console.log('\n📊 Database Summary:');
    console.log(`   ├─ Total Users: ${totalUsers}`);
    console.log(`   │  ├─ Dealers: ${dealers}`);
    console.log(`   │  ├─ Pro: ${await User.countDocuments({ premiumTier: 'pro' })}`);
    console.log(`   │  └─ Basic: ${await User.countDocuments({ premiumTier: 'basic' })}`);
    console.log(`   └─ Total Items: ${totalItems}`);
    console.log(`      ├─ Buy: ${items.filter(i => i.type === 'buy').length}`);
    console.log(`      ├─ Auction: ${items.filter(i => i.type === 'auction').length}`);
    console.log(`      └─ Trade: ${items.filter(i => i.type === 'trade').length}`);

    console.log('\n✨ Database seeded successfully!');
    console.log('🔐 All users password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

connectDB().then(seedDatabase);