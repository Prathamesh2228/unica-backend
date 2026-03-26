const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumTier: {
    type: String,
    enum: ['basic', 'pro', 'dealer', 'enterprise'],
    default: 'basic'
  },
  premiumExpiryDate: {
    type: Date
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    enum: ['buyer', 'seller', 'both'],
    default: 'buyer'
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  bio: {
    type: String,
    maxlength: 150,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // ✅ GAMIFICATION FIELDS
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  achievements: [{
    id: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    perfectSales: {
      type: Number,
      default: 0 // 5-star sales count
    },
    fastSales: {
      type: Number,
      default: 0 // Sales within 24 hours
    },
    messagesReplied: {
      type: Number,
      default: 0
    },
    itemsWithMultipleImages: {
      type: Number,
      default: 0
    }
  },
  
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ XP LEVELS
UserSchema.virtual('levelInfo').get(function() {
  const levels = [
    { level: 1, name: 'Rookie Seller', minXP: 0, maxXP: 100, color: '#94a3b8' },
    { level: 2, name: 'Rising Star', minXP: 100, maxXP: 500, color: '#60a5fa' },
    { level: 3, name: 'Trusted Trader', minXP: 500, maxXP: 1500, color: '#a78bfa' },
    { level: 4, name: 'Elite Dealer', minXP: 1500, maxXP: 5000, color: '#fbbf24' },
    { level: 5, name: 'UNICA Legend', minXP: 5000, maxXP: Infinity, color: '#f59e0b' }
  ];
  
  const currentLevel = levels.find(l => this.xp >= l.minXP && this.xp < l.maxXP) || levels[levels.length - 1];
  const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
  
  const progress = nextLevel 
    ? ((this.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;
  
  return {
    ...currentLevel,
    xp: this.xp,
    progress: Math.min(progress, 100),
    nextLevelXP: nextLevel ? nextLevel.minXP : null
  };
});

UserSchema.virtual('itemLimit').get(function() {
  switch(this.premiumTier) {
    case 'basic': return 5;
    case 'pro': return 20;
    case 'dealer': return Infinity;
    case 'enterprise': return Infinity;
    default: return 5;
  }
});

UserSchema.methods.isPremiumActive = function() {
  if (this.premiumTier === 'basic') return false;
  if (!this.premiumExpiryDate) return false;
  return new Date() < this.premiumExpiryDate;
};

UserSchema.methods.getPremiumBadge = function() {
  if (!this.isPremiumActive()) return null;
  
  switch(this.premiumTier) {
    case 'pro': return { label: 'PRO', color: 'blue' };
    case 'dealer': return { label: 'DEALER', color: 'gold' };
    case 'enterprise': return { label: 'ELITE', color: 'purple' };
    default: return null;
  }
};

// ✅ ADD XP METHOD
UserSchema.methods.addXP = async function(amount, reason) {
  this.xp += amount;
  
  // Check for level up
  const levels = [0, 100, 500, 1500, 5000];
  const newLevel = levels.findIndex(xp => this.xp < xp);
  const calculatedLevel = newLevel === -1 ? 5 : newLevel;
  
  const leveledUp = calculatedLevel > this.level;
  this.level = calculatedLevel;
  
  await this.save();
  
  return { leveledUp, newLevel: this.level, xp: this.xp };
};

// ✅ CHECK AND UNLOCK ACHIEVEMENTS
UserSchema.methods.checkAchievements = async function() {
  const achievements = [
    {
      id: 'first_sale',
      name: 'First Sale',
      description: 'Made your first sale',
      icon: '🏆',
      xp: 50,
      condition: () => this.stats.totalSales >= 1
    },
    {
      id: 'trusted_seller',
      name: 'Trusted Seller',
      description: '10+ sales with 4.5+ rating',
      icon: '💎',
      xp: 100,
      condition: () => this.stats.totalSales >= 10 && this.rating >= 4.5
    },
    {
      id: 'hot_streak',
      name: 'Hot Streak',
      description: '5 sales in 7 days',
      icon: '🔥',
      xp: 75,
      condition: async () => {
        const Transaction = mongoose.model('Transaction');
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSales = await Transaction.countDocuments({
          seller: this._id,
          status: 'completed',
          completedAt: { $gte: sevenDaysAgo }
        });
        return recentSales >= 5;
      }
    },
    {
      id: 'top_dealer',
      name: 'Top Dealer',
      description: '100+ total sales',
      icon: '👑',
      xp: 500,
      condition: () => this.stats.totalSales >= 100
    },
    {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: '10 sales, all 5-star reviews',
      icon: '🎯',
      xp: 200,
      condition: () => this.stats.totalSales >= 10 && this.stats.perfectSales >= 10
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Sold item within 24 hours',
      icon: '⚡',
      xp: 50,
      condition: () => this.stats.fastSales >= 1
    },
    {
      id: 'photographer',
      name: 'Photographer',
      description: 'Uploaded 5+ images per item (10 times)',
      icon: '📸',
      xp: 75,
      condition: () => this.stats.itemsWithMultipleImages >= 10
    },
    {
      id: 'communicator',
      name: 'Communicator',
      description: 'Responded to 50+ messages',
      icon: '💬',
      xp: 100,
      condition: () => this.stats.messagesReplied >= 50
    },
    {
      id: 'money_maker',
      name: 'Money Maker',
      description: 'Generated ₹1,00,000+ in revenue',
      icon: '💰',
      xp: 300,
      condition: () => this.stats.totalRevenue >= 100000
    },
    {
      id: 'elite_revenue',
      name: 'Elite Revenue',
      description: 'Generated ₹5,00,000+ in revenue',
      icon: '💸',
      xp: 750,
      condition: () => this.stats.totalRevenue >= 500000
    },
    {
      id: 'five_star',
      name: 'Five Star Seller',
      description: 'Achieved 5.0 rating',
      icon: '⭐',
      xp: 150,
      condition: () => this.rating === 5.0 && this.stats.totalSales >= 5
    },
    {
      id: 'veteran',
      name: 'Veteran',
      description: 'Member for 6 months',
      icon: '🏅',
      xp: 200,
      condition: () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return this.createdAt <= sixMonthsAgo;
      }
    },
    {
      id: 'diverse_seller',
      name: 'Diverse Seller',
      description: 'Sold items in 5+ categories',
      icon: '🎨',
      xp: 100,
      condition: async () => {
        const Transaction = mongoose.model('Transaction');
        const categories = await Transaction.distinct('item.category', {
          seller: this._id,
          status: 'completed'
        });
        return categories.length >= 5;
      }
    },
    {
      id: 'premium_member',
      name: 'Premium Member',
      description: 'Upgraded to Pro or Dealer',
      icon: '👑',
      xp: 100,
      condition: () => this.premiumTier === 'pro' || this.premiumTier === 'dealer'
    }
  ];
  
  const newAchievements = [];
  
  for (const achievement of achievements) {
    // Check if already unlocked
    const alreadyHas = this.achievements.some(a => a.id === achievement.id);
    if (alreadyHas) continue;
    
    // Check condition
    const conditionMet = typeof achievement.condition === 'function' 
      ? await achievement.condition() 
      : false;
    
    if (conditionMet) {
      this.achievements.push({ id: achievement.id });
      await this.addXP(achievement.xp, `Unlocked: ${achievement.name}`);
      newAchievements.push(achievement);
    }
  }
  
  if (newAchievements.length > 0) {
    await this.save();
  }
  
  return newAchievements;
};

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ SET toJSON to include virtuals
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);