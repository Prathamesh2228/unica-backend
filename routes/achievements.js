const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// @route   GET /api/achievements
// @desc    Get all achievements (definitions)
// @access  Public
router.get('/', (req, res) => {
  const achievements = [
    {
      id: 'first_sale',
      name: 'First Sale',
      description: 'Made your first sale',
      icon: '🏆',
      xp: 50,
      rarity: 'common'
    },
    {
      id: 'trusted_seller',
      name: 'Trusted Seller',
      description: '10+ sales with 4.5+ rating',
      icon: '💎',
      xp: 100,
      rarity: 'rare'
    },
    {
      id: 'hot_streak',
      name: 'Hot Streak',
      description: '5 sales in 7 days',
      icon: '🔥',
      xp: 75,
      rarity: 'rare'
    },
    {
      id: 'top_dealer',
      name: 'Top Dealer',
      description: '100+ total sales',
      icon: '👑',
      xp: 500,
      rarity: 'legendary'
    },
    {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: '10 sales, all 5-star reviews',
      icon: '🎯',
      xp: 200,
      rarity: 'epic'
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Sold item within 24 hours',
      icon: '⚡',
      xp: 50,
      rarity: 'common'
    },
    {
      id: 'photographer',
      name: 'Photographer',
      description: 'Uploaded 5+ images per item (10 times)',
      icon: '📸',
      xp: 75,
      rarity: 'rare'
    },
    {
      id: 'communicator',
      name: 'Communicator',
      description: 'Responded to 50+ messages',
      icon: '💬',
      xp: 100,
      rarity: 'rare'
    },
    {
      id: 'money_maker',
      name: 'Money Maker',
      description: 'Generated ₹1,00,000+ in revenue',
      icon: '💰',
      xp: 300,
      rarity: 'epic'
    },
    {
      id: 'elite_revenue',
      name: 'Elite Revenue',
      description: 'Generated ₹5,00,000+ in revenue',
      icon: '💸',
      xp: 750,
      rarity: 'legendary'
    },
    {
      id: 'five_star',
      name: 'Five Star Seller',
      description: 'Achieved 5.0 rating',
      icon: '⭐',
      xp: 150,
      rarity: 'epic'
    },
    {
      id: 'veteran',
      name: 'Veteran',
      description: 'Member for 6 months',
      icon: '🏅',
      xp: 200,
      rarity: 'epic'
    },
    {
      id: 'diverse_seller',
      name: 'Diverse Seller',
      description: 'Sold items in 5+ categories',
      icon: '🎨',
      xp: 100,
      rarity: 'rare'
    },
    {
      id: 'premium_member',
      name: 'Premium Member',
      description: 'Upgraded to Pro or Dealer',
      icon: '👑',
      xp: 100,
      rarity: 'rare'
    }
  ];
  
  res.json({ achievements });
});

// @route   GET /api/achievements/my
// @desc    Get user's unlocked achievements
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      achievements: user.achievements,
      level: user.level,
      xp: user.xp,
      levelInfo: user.levelInfo,
      stats: user.stats
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/achievements/check
// @desc    Check and unlock new achievements
// @access  Private
router.post('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newAchievements = await user.checkAchievements();
    
    res.json({
      newAchievements,
      totalUnlocked: user.achievements.length,
      xp: user.xp,
      level: user.level,
      levelInfo: user.levelInfo
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/achievements/leaderboard
// @desc    Get top sellers leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period === 'month') {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      dateFilter.completedAt = { $gte: firstDayOfMonth };
    } else if (period === 'week') {
      const firstDayOfWeek = new Date();
      firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 7);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      dateFilter.completedAt = { $gte: firstDayOfWeek };
    }
    
    // Get top sellers by revenue
    const topSellers = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$seller',
          totalRevenue: { $sum: '$amount' },
          totalSales: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          totalSales: 1,
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          level: '$userInfo.level',
          xp: '$userInfo.xp',
          rating: '$userInfo.rating',
          premiumTier: '$userInfo.premiumTier'
        }
      }
    ]);
    
    res.json({ topSellers, period });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/achievements/update-stats
// @desc    Update user stats (called after transactions)
// @access  Private
router.post('/update-stats', auth, async (req, res) => {
  try {
    const { event, data } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let xpGained = 0;
    
    switch(event) {
      case 'sale_completed':
        user.stats.totalSales += 1;
        user.stats.totalRevenue += data.amount || 0;
        xpGained = 20;
        
        // Check if it's a perfect sale (5 stars)
        if (data.rating === 5) {
          user.stats.perfectSales += 1;
          xpGained += 10;
        }
        
        // Check if it's a fast sale (within 24 hours)
        if (data.soldWithin24Hours) {
          user.stats.fastSales += 1;
          xpGained += 10;
        }
        break;
        
      case 'item_listed':
        if (data.imageCount >= 5) {
          user.stats.itemsWithMultipleImages += 1;
          xpGained = 5;
        }
        break;
        
      case 'message_replied':
        user.stats.messagesReplied += 1;
        xpGained = 2;
        break;
        
      default:
        break;
    }
    
    if (xpGained > 0) {
      await user.addXP(xpGained, event);
    }
    
    await user.save();
    
    // Check for new achievements
    const newAchievements = await user.checkAchievements();
    
    res.json({
      success: true,
      xpGained,
      newAchievements,
      level: user.level,
      xp: user.xp
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;