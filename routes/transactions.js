const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const { calculateDeliveryDate, generateTrackingNumber } = require('../utils/deliveryUtils');

// @route   POST /api/transactions/purchase
// @desc    Purchase an item (Buy Now) - MOCK PAYMENT + GAMIFICATION
// @access  Private
router.post('/purchase', auth, async (req, res) => {
  console.log('\n🛒 Purchase started - User:', req.user.id, 'Item:', req.body.itemId);

  try {
    const { itemId, shippingSpeed = 'standard' } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      console.log('❌ Item not found');
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ message: 'Item is no longer available' });
    }

    if (item.type !== 'buy') {
      return res.status(400).json({ message: 'This item is not available for direct purchase' });
    }

    if (item.seller.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot buy your own item' });
    }

    const User = require('../models/User');
    const buyer = await User.findById(req.user.id);

    const { estimatedDeliveryDate, deliveryDays } = calculateDeliveryDate(shippingSpeed);
    const trackingNumber = generateTrackingNumber();

    const transaction = await Transaction.create({
      buyer: req.user.id,
      seller: item.seller,
      item: itemId,
      amount: item.price,
      transactionType: 'purchase',
      status: 'completed',
      paymentMethod: 'stripe',
      completedAt: Date.now(),
      estimatedDeliveryDate,
      deliveryDays,
      deliveryStatus: 'processing',
      shippingSpeed,
      trackingNumber,
      carrier: 'India Post'
    });

    await logActivity({
      type: 'ITEM_PURCHASED',
      user: req.user.id,
      targetUser: item.seller,
      item: item._id,
      transaction: transaction._id,
      amount: item.price,
      description: `${buyer.username} purchased "${item.title}" for ₹${item.price.toLocaleString()}`
    });

    item.status = 'sold';
    await item.save();

    await transaction.populate([
      { path: 'buyer', select: 'username email' },
      { path: 'seller', select: 'username email' },
      { path: 'item', select: 'title images price category' }
    ]);

    // ✅ GAMIFICATION: Award XP to seller
    const seller = await User.findById(item.seller);
    if (seller) {
      // Award 20 XP for sale
      await seller.addXP(20, 'Sale completed');
      
      // Update stats
      seller.stats.totalSales += 1;
      seller.stats.totalRevenue += item.price;
      
      // Check if sold within 24 hours (fast sale bonus)
      const hoursSinceListing = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceListing <= 24) {
        seller.stats.fastSales += 1;
        await seller.addXP(10, 'Fast sale bonus');
      }
      
      // Check if item has 5+ images (photographer bonus)
      if (item.images && item.images.length >= 5) {
        seller.stats.itemsWithMultipleImages += 1;
      }
      
      await seller.save();
      
      // Check for new achievements
      await seller.checkAchievements();
      
      console.log(`✨ Seller ${seller.username} earned XP! Now at Level ${seller.level} with ${seller.xp} XP`);
    }

    console.log('✅ Purchase completed successfully');

    res.status(201).json({
      message: 'Purchase successful!',
      transaction
    });

  } catch (error) {
    console.error('❌ Purchase error:', error.message);
    res.status(500).json({ 
      message: 'Server error during purchase',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/my-purchases
// @desc    Get user's purchase history
// @access  Private
router.get('/my-purchases', auth, async (req, res) => {
  try {
    console.log('📦 Fetching purchases for buyer:', req.user.id);

    const transactions = await Transaction.find({ buyer: req.user.id })
      .populate('item', 'title images price category')
      .populate('seller', 'username email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${transactions.length} purchases`);

    res.json({ purchases: transactions });

  } catch (error) {
    console.error('❌ Error fetching purchases:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/transactions/my-sales
// @desc    Get seller's sales history
// @access  Private
router.get('/my-sales', auth, async (req, res) => {
  try {
    console.log('📊 Fetching sales for seller:', req.user.id);

    const transactions = await Transaction.find({ 
      seller: req.user.id,
      status: 'completed'
    })
      .populate('item', 'title images price category')
      .populate('buyer', 'username email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${transactions.length} sales`);

    res.json({ sales: transactions });

  } catch (error) {
    console.error('❌ Error fetching sales:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ DAY 1: Seller's own analytics
// @route   GET /api/transactions/analytics
// @desc    Get seller's analytics data
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const sellerId = req.user.id;

    const sales = await Transaction.find({
      seller: sellerId,
      status: 'completed'
    }).populate('item', 'title price category views');

    const items = await Item.find({ seller: sellerId });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

    const revenueByDate = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + sale.amount;
    });

    const revenueOverTime = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const itemRevenue = {};
    sales.forEach(sale => {
      const itemId = sale.item?._id?.toString();
      const itemTitle = sale.item?.title || 'Unknown';
      if (!itemRevenue[itemId]) {
        itemRevenue[itemId] = { title: itemTitle, revenue: 0, sales: 0 };
      }
      itemRevenue[itemId].revenue += sale.amount;
      itemRevenue[itemId].sales += 1;
    });

    const topItems = Object.values(itemRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const mostViewed = items
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(item => ({
        title: item.title,
        views: item.views || 0,
        category: item.category
      }));

    const viewsByCategory = {};
    items.forEach(item => {
      viewsByCategory[item.category] = (viewsByCategory[item.category] || 0) + (item.views || 0);
    });

    const categoryData = Object.entries(viewsByCategory).map(([category, views]) => ({
      category,
      views
    }));

    const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalSales = sales.length;
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : 0;

    let totalDaysToSale = 0;
    let salesWithData = 0;

    sales.forEach(sale => {
      const item = items.find(i => i._id.toString() === sale.item?._id?.toString());
      if (item) {
        const daysDiff = Math.floor((new Date(sale.createdAt) - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
        totalDaysToSale += daysDiff;
        salesWithData++;
      }
    });

    const avgTimeToSale = salesWithData > 0 ? (totalDaysToSale / salesWithData).toFixed(1) : 0;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenue = sales
      .filter(sale => new Date(sale.createdAt) >= thisMonth)
      .reduce((sum, sale) => sum + sale.amount, 0);

    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthRevenue = sales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= lastMonth && saleDate < thisMonth;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);

    const monthlyGrowth = lastMonthRevenue > 0 
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : 0;

    const avgSale = totalSales > 0 ? (totalRevenue / totalSales).toFixed(0) : 0;

    let bestDay = { date: 'N/A', revenue: 0 };
    Object.entries(revenueByDate).forEach(([date, revenue]) => {
      if (revenue > bestDay.revenue) {
        bestDay = { date, revenue };
      }
    });

    res.json({
      overview: {
        totalRevenue,
        thisMonthRevenue,
        monthlyGrowth: parseFloat(monthlyGrowth),
        avgSale: parseInt(avgSale),
        bestDay
      },
      revenueOverTime,
      topItems,
      mostViewed,
      categoryData,
      metrics: {
        conversionRate: parseFloat(conversionRate),
        avgTimeToSale: parseFloat(avgTimeToSale),
        totalViews,
        totalSales
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ DAY 2: Admin can view ANY seller's analytics
// @route   GET /api/transactions/analytics/:sellerId
// @desc    Get specific seller's analytics (admin only)
// @access  Private + Admin
router.get('/analytics/:sellerId', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const admin = await User.findById(req.user.id);
    
    if (!admin.isAdmin) {
      return res.status(403).json({ message: 'Access denied - Admin only' });
    }

    const sellerId = req.params.sellerId;

    // Get seller info
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get all completed sales for this seller
    const sales = await Transaction.find({
      seller: sellerId,
      status: 'completed'
    }).populate('item', 'title price category views');

    // Get all items (for views data)
    const items = await Item.find({ seller: sellerId });

    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

    // Revenue by date (last 30 days)
    const revenueByDate = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + sale.amount;
    });

    const revenueOverTime = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Top performing items by revenue
    const itemRevenue = {};
    sales.forEach(sale => {
      const itemId = sale.item?._id?.toString();
      const itemTitle = sale.item?.title || 'Unknown';
      if (!itemRevenue[itemId]) {
        itemRevenue[itemId] = { title: itemTitle, revenue: 0, sales: 0 };
      }
      itemRevenue[itemId].revenue += sale.amount;
      itemRevenue[itemId].sales += 1;
    });

    const topItems = Object.values(itemRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Most viewed items
    const mostViewed = items
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(item => ({
        title: item.title,
        views: item.views || 0,
        category: item.category
      }));

    // Views by category
    const viewsByCategory = {};
    items.forEach(item => {
      viewsByCategory[item.category] = (viewsByCategory[item.category] || 0) + (item.views || 0);
    });

    const categoryData = Object.entries(viewsByCategory).map(([category, views]) => ({
      category,
      views
    }));

    // Calculate metrics
    const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalSales = sales.length;
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : 0;

    // Average time to sale
    let totalDaysToSale = 0;
    let salesWithData = 0;

    sales.forEach(sale => {
      const item = items.find(i => i._id.toString() === sale.item?._id?.toString());
      if (item) {
        const daysDiff = Math.floor((new Date(sale.createdAt) - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
        totalDaysToSale += daysDiff;
        salesWithData++;
      }
    });

    const avgTimeToSale = salesWithData > 0 ? (totalDaysToSale / salesWithData).toFixed(1) : 0;

    // This month's revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenue = sales
      .filter(sale => new Date(sale.createdAt) >= thisMonth)
      .reduce((sum, sale) => sum + sale.amount, 0);

    // Last month's revenue
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthRevenue = sales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= lastMonth && saleDate < thisMonth;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);

    const monthlyGrowth = lastMonthRevenue > 0 
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : 0;

    const avgSale = totalSales > 0 ? (totalRevenue / totalSales).toFixed(0) : 0;

    // Best day
    let bestDay = { date: 'N/A', revenue: 0 };
    Object.entries(revenueByDate).forEach(([date, revenue]) => {
      if (revenue > bestDay.revenue) {
        bestDay = { date, revenue };
      }
    });

    // Response with seller info
    res.json({
      seller: {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        premiumTier: seller.premiumTier || 'basic',
        rating: seller.rating || 0,
        createdAt: seller.createdAt
      },
      overview: {
        totalRevenue,
        thisMonthRevenue,
        monthlyGrowth: parseFloat(monthlyGrowth),
        avgSale: parseInt(avgSale),
        bestDay
      },
      revenueOverTime,
      topItems,
      mostViewed,
      categoryData,
      metrics: {
        conversionRate: parseFloat(conversionRate),
        avgTimeToSale: parseFloat(avgTimeToSale),
        totalViews,
        totalSales
      }
    });

  } catch (error) {
    console.error('Admin seller analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('item', 'title images price category')
      .populate('seller', 'username email')
      .populate('buyer', 'username email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (
      transaction.buyer._id.toString() !== req.user.id &&
      transaction.seller._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ transaction });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/transactions/:id/delivery-status
// @desc    Update delivery status
// @access  Private
router.patch('/:id/delivery-status', auth, async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (
      transaction.seller.toString() !== req.user.id &&
      !user.isAdmin
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    transaction.deliveryStatus = deliveryStatus;
    
    if (deliveryStatus === 'shipped' && !transaction.shippedAt) {
      transaction.shippedAt = new Date();
    }
    if (deliveryStatus === 'delivered') {
      transaction.deliveredAt = new Date();
      transaction.actualDeliveryDate = new Date();
    }
    
    await transaction.save();
    
    res.json({
      message: 'Delivery status updated',
      transaction
    });
    
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/transactions/:id/rate
// @desc    Rate a seller after purchase
// @access  Private
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    const transaction = await Transaction.findById(req.params.id)
      .populate('seller');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the buyer can rate' });
    }
    
    if (transaction.rating) {
      return res.status(400).json({ message: 'You already rated this seller' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    transaction.rating = rating;
    transaction.review = review;
    transaction.ratedAt = new Date();
    await transaction.save();
    
    const User = require('../models/User');
    const seller = await User.findById(transaction.seller);
    
    const allRatings = await Transaction.find({ 
      seller: transaction.seller,
      rating: { $exists: true }
    });
    
    const avgRating = allRatings.reduce((sum, t) => sum + t.rating, 0) / allRatings.length;
    
    seller.rating = Math.round(avgRating * 10) / 10;
    await seller.save();
    
    res.json({
      message: 'Rating submitted successfully',
      transaction,
      sellerRating: seller.rating
    });
    
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;