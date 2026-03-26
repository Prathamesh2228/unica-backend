const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');
const Activity = require('../models/Activity');
const adminAuth = require('../middleware/adminAuth');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only - for demo, anyone can access)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // User stats
const totalUsers = await User.countDocuments();
const premiumUsers = await User.countDocuments({ 
  isPremium: true, 
  premiumTier: { $ne: 'basic' } 
});
const proUsers = await User.countDocuments({ premiumTier: 'pro' });
const dealerUsers = await User.countDocuments({ premiumTier: 'dealer' });
const enterpriseUsers = await User.countDocuments({ premiumTier: 'enterprise' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Item stats
    const totalItems = await Item.countDocuments();
    const activeItems = await Item.countDocuments({ status: 'active' });
    const soldItems = await Item.countDocuments({ status: 'sold' });
    const auctionItems = await Item.countDocuments({ type: 'auction', status: 'active' });
    const tradeItems = await Item.countDocuments({ type: 'trade', status: 'active' });

    // Transaction stats
    const totalTransactions = await Transaction.countDocuments({ status: 'completed' });
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenueToday = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Trade stats
    const totalTrades = await Trade.countDocuments();
    const pendingTrades = await Trade.countDocuments({ status: 'pending' });
    const acceptedTrades = await Trade.countDocuments({ status: 'accepted' });
    const rejectedTrades = await Trade.countDocuments({ status: 'rejected' });

    // Activity stats
    const totalActivities = await Activity.countDocuments();
    const unreadActivities = await Activity.countDocuments({ isRead: false });

    const stats = {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        pro: proUsers,
        dealer: dealerUsers,
        enterprise: enterpriseUsers,
        newToday: newUsersToday
      },
      items: {
        total: totalItems,
        active: activeItems,
        sold: soldItems,
        auctions: auctionItems,
        trades: tradeItems
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: revenueToday[0]?.total || 0,
        transactions: totalTransactions
      },
      trades: {
        total: totalTrades,
        pending: pendingTrades,
        accepted: acceptedTrades,
        rejected: rejectedTrades
      },
      activity: {
        total: totalActivities,
        unread: unreadActivities
      }
    };

    console.log('📊 Admin Stats Requested:', stats);
    res.json(stats);

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/activities
// @desc    Get recent activities (live feed)
// @access  Private
router.get('/activities', adminAuth, async (req, res) => {
  try {
    const { limit = 50, since } = req.query;

    let query = {};
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const activities = await Activity.find(query)
      .populate('user', 'username email avatar')
      .populate('targetUser', 'username')
      .populate('item', 'title images price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      activities,
      count: activities.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Activities fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/activities/mark-read
// @desc    Mark activities as read
// @access  Private
router.put('/activities/mark-read', adminAuth, async (req, res) => {
  try {
    const { activityIds } = req.body;

    if (activityIds && activityIds.length > 0) {
      await Activity.updateMany(
        { _id: { $in: activityIds } },
        { isRead: true }
      );
    } else {
      await Activity.updateMany({}, { isRead: true });
    }

    res.json({ message: 'Activities marked as read' });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with details
// @access  Private
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('username email isPremium premiumTier rating createdAt')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ users });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get recent transactions
// @access  Private
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: 'completed' })
      .populate('buyer', 'username email')
      .populate('seller', 'username email')
      .populate('item', 'title images price')
      .sort({ completedAt: -1 })
      .limit(50);

    res.json({ transactions });

  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/top-sellers
// @desc    Get most active sellers
// @access  Private
router.get('/top-sellers', adminAuth, async (req, res) => {
  try {
    const topSellers = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$seller',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Populate seller details
    await User.populate(topSellers, { path: '_id', select: 'username email avatar' });

    const formatted = topSellers.map(s => ({
      seller: s._id,
      totalSales: s.totalSales,
      totalRevenue: s.totalRevenue
    }));

    res.json({ topSellers: formatted });

  } catch (error) {
    console.error('Top sellers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/trending-items
// @desc    Get most viewed/bid items
// @access  Private
router.get('/trending-items', adminAuth, async (req, res) => {
  try {
    const trendingItems = await Item.find({ status: 'active' })
      .populate('seller', 'username')
      .sort({ views: -1 })
      .limit(10);

    res.json({ trendingItems });

  } catch (error) {
    console.error('Trending items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;