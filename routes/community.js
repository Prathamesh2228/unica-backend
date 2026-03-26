const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');
const auth = require('../middleware/auth');

// @route   GET /api/community/members
// @desc    Get all community members (Dealers + Pro users)
// @access  Public
router.get('/members', async (req, res) => {
  try {
    console.log('📊 Fetching community members...');

    // Find ALL premium users (Dealers + Pro)
    const users = await User.find({
      isPremium: true,
      $or: [
        { premiumTier: 'dealer' },
        { premiumTier: 'pro' }
      ]
    }).select('username email avatar rating isPremium premiumTier createdAt bio location');

    console.log(`📊 Found ${users.length} premium users total`);

    // Get stats for each user
    const membersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get total sales
        const sales = await Transaction.countDocuments({
          seller: user._id,
          status: 'completed'
        });

        // Get total trades
        const trades = await Trade.countDocuments({
          $or: [
            { proposer: user._id, status: 'accepted' },
            { receiver: user._id, status: 'accepted' }
          ]
        });

        // Get active items
        const activeItems = await Item.countDocuments({
          seller: user._id,
          status: 'active'
        });

        // Determine specialization
        const items = await Item.find({ seller: user._id }).limit(20);
        const categories = items.map(item => item.category);
        const categoryCount = {};
        categories.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        
        const specialization = Object.keys(categoryCount).sort((a, b) => 
          categoryCount[b] - categoryCount[a]
        )[0] || user.bio?.split('🎯')[0]?.trim() || 'Collector';

        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          rating: user.rating,
          isPremium: user.isPremium,
          premiumTier: user.premiumTier,
          memberSince: user.createdAt,
          bio: user.bio,
          location: user.location,
          stats: {
            sales,
            trades,
            activeItems,
            totalTransactions: sales + trades
          },
          specialization,
          badge: user.getPremiumBadge()
        };
      })
    );

    // ❌ REMOVED: Don't filter by activity anymore
    // Show ALL premium users regardless of activity
    
    // Sort by: Dealers first, then by activity
    membersWithStats.sort((a, b) => {
      if (a.premiumTier === 'dealer' && b.premiumTier !== 'dealer') return -1;
      if (b.premiumTier === 'dealer' && a.premiumTier !== 'dealer') return 1;
      return b.stats.totalTransactions - a.stats.totalTransactions;
    });

    console.log(`✅ Returning ${membersWithStats.length} community members`);
    console.log(`   - Dealers: ${membersWithStats.filter(m => m.premiumTier === 'dealer').length}`);
    console.log(`   - Pro: ${membersWithStats.filter(m => m.premiumTier === 'pro').length}`);

    res.json({
      members: membersWithStats,
      count: membersWithStats.length
    });

  } catch (error) {
    console.error('Community members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/stats
// @desc    Get community statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Count ALL premium users (Dealers + Pro)
    const totalMembers = await User.countDocuments({
      isPremium: true,
      $or: [
        { premiumTier: 'dealer' },
        { premiumTier: 'pro' }
      ]
    });

    const dealerCount = await User.countDocuments({ premiumTier: 'dealer' });
    
    // Get average rating of premium users
    const premiumUsers = await User.find({
      isPremium: true,
      rating: { $gt: 0 }
    }).select('rating');
    
    const avgRating = premiumUsers.length > 0
      ? premiumUsers.reduce((sum, user) => sum + user.rating, 0) / premiumUsers.length
      : 0;

    // Active this week (premium users with recent transactions)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSellers = await Transaction.find({
      completedAt: { $gte: oneWeekAgo }
    }).distinct('seller');
    
    const activePremiumSellers = await User.countDocuments({
      _id: { $in: recentSellers },
      isPremium: true
    });

    res.json({
      totalMembers,
      dealerMembers: dealerCount,
      averageRating: avgRating.toFixed(1),
      activeThisWeek: activePremiumSellers
    });

  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/user/:userId
// @desc    Get user's collection
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username avatar rating isPremium premiumTier createdAt bio location');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const items = await Item.find({
      seller: req.params.userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    const sales = await Transaction.countDocuments({
      seller: req.params.userId,
      status: 'completed'
    });

    const trades = await Trade.countDocuments({
      $or: [
        { proposer: req.params.userId, status: 'accepted' },
        { receiver: req.params.userId, status: 'accepted' }
      ]
    });

    res.json({
      user: {
        ...user.toObject(),
        badge: user.getPremiumBadge()
      },
      items,
      stats: {
        sales,
        trades,
        activeItems: items.length,
        totalTransactions: sales + trades
      }
    });

  } catch (error) {
    console.error('Get user collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;