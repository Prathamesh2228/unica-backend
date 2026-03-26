const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// @route   POST /api/auctions/bid/:itemId
// @desc    Place a bid on an auction item
// @access  Private
router.post('/bid/:itemId', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const itemId = req.params.itemId;

    // Find the auction item
    const item = await Item.findById(itemId).populate('seller', 'username email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if it's an auction
    if (item.type !== 'auction') {
      return res.status(400).json({ message: 'This item is not an auction' });
    }

    // Check if auction has ended
    if (new Date() > new Date(item.auctionEndDate)) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // Check if user is trying to bid on their own item
    if (item.seller._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot bid on your own item' });
    }

    // Validate bid amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

    // Check if bid is higher than current bid
    const currentBid = item.currentBid || item.price;
    if (amount <= currentBid) {
      return res.status(400).json({ 
        message: `Bid must be higher than current bid of ₹${currentBid}` 
      });
    }

    // ✅ GET BIDDER INFO FOR ACTIVITY LOG
    const User = require('../models/User');
    const bidder = await User.findById(req.user.id);


    // Add bid to bidders array
    item.bidders.push({
      user: req.user.id,
      amount: amount,
      timestamp: new Date()
    });

    // Update current bid
    item.currentBid = amount;

    await item.save();

    // ✅ LOG ACTIVITY
    await logActivity({
      type: 'BID_PLACED',
      user: req.user.id,
      targetUser: item.seller._id,
      item: item._id,
      amount: amount,
      description: `${bidder.username} bid ₹${amount.toLocaleString()} on "${item.title}"`
    });

    // Populate the new bidder info
    await item.populate('bidders.user', 'username email');

    res.json({
      message: 'Bid placed successfully!',
      currentBid: item.currentBid,
      totalBids: item.bidders.length,
      item
    });

  } catch (error) {
    console.error('Bid placement error:', error);
    res.status(500).json({ message: 'Server error placing bid' });
  }
});

// @route   GET /api/auctions/bids/:itemId
// @desc    Get all bids for an auction item
// @access  Public
router.get('/bids/:itemId', async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId)
      .populate('bidders.user', 'username email isPremium')
      .select('bidders currentBid auctionEndDate');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Sort bidders by amount (highest first)
    const sortedBids = item.bidders.sort((a, b) => b.amount - a.amount);

    res.json({
      currentBid: item.currentBid,
      auctionEndDate: item.auctionEndDate,
      totalBids: sortedBids.length,
      bids: sortedBids
    });

  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ message: 'Server error fetching bids' });
  }
});

// @route   GET /api/auctions/my-bids
// @desc    Get user's active bids
// @access  Private
router.get('/my-bids', auth, async (req, res) => {
  try {
    // Find all auction items where user has placed a bid
    const items = await Item.find({
      type: 'auction',
      'bidders.user': req.user.id,
      status: 'active'
    })
    .populate('seller', 'username email isPremium')
    .sort({ auctionEndDate: 1 }); // Soonest ending first

    // Get user's bid for each item
    const myBids = items.map(item => {
      const userBids = item.bidders.filter(
        bid => bid.user.toString() === req.user.id
      );
      const highestUserBid = Math.max(...userBids.map(b => b.amount));
      const isWinning = highestUserBid === item.currentBid;

      return {
        item: {
          _id: item._id,
          title: item.title,
          images: item.images,
          category: item.category
        },
        myBid: highestUserBid,
        currentBid: item.currentBid,
        isWinning,
        auctionEndDate: item.auctionEndDate,
        totalBids: item.bidders.length
      };
    });

    res.json(myBids);

  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auctions/stats
// @desc    Get auction statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    
    // Count active auctions (not ended, status active)
    const activeAuctions = await Item.countDocuments({
      type: 'auction',
      status: 'active',
      auctionEndDate: { $gt: now }
    });

    // Count total bids across all active auctions
    const auctionItems = await Item.find({
      type: 'auction',
      status: 'active',
      auctionEndDate: { $gt: now }
    });

    const totalBids = auctionItems.reduce((sum, item) => sum + (item.bidders?.length || 0), 0);

    // Total auction value (sum of all current bids)
    const totalValue = auctionItems.reduce((sum, item) => sum + (item.currentBid || item.price), 0);

    // Highest current bid
    const highestBid = Math.max(...auctionItems.map(item => item.currentBid || item.price), 0);

    res.json({
      activeAuctions,
      totalBids,
      totalValue,
      highestBid,
      endingSoon: auctionItems.filter(item => {
        const hoursLeft = (new Date(item.auctionEndDate) - now) / (1000 * 60 * 60);
        return hoursLeft < 24;
      }).length
    });

  } catch (error) {
    console.error('Get auction stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auctions/close/:itemId
// @desc    Close auction and create transaction for winner
// @access  Private
router.post('/close/:itemId', auth, async (req, res) => {
  console.log('\n🏆 Closing auction:', req.params.itemId);

  try {
    const User = require('../models/User');
    const Transaction = require('../models/Transaction');
    
    const item = await Item.findById(req.params.itemId)
      .populate('seller', 'username email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.type !== 'auction') {
      return res.status(400).json({ message: 'This is not an auction item' });
    }

    if (new Date() < new Date(item.auctionEndDate)) {
      return res.status(400).json({ message: 'Auction has not ended yet' });
    }

    if (item.status === 'sold') {
      return res.status(400).json({ message: 'Auction already closed' });
    }

    // Get highest bidder
    if (!item.bidders || item.bidders.length === 0) {
      // No bids - mark as ended but not sold
      item.status = 'expired';
      await item.save();
      return res.json({ message: 'Auction ended with no bids' });
    }

    // Sort bidders by amount (highest first)
    const sortedBidders = item.bidders.sort((a, b) => b.amount - a.amount);
    const winner = sortedBidders[0];

    console.log('🎉 Winner:', winner.user, 'Amount:', winner.amount);

    // Create transaction
const transaction = await Transaction.create({
  item: item._id,
  buyer: winner.user,
  seller: item.seller._id,
  amount: winner.amount,
  transactionType: 'auction',  // ✅ This is correct now
  status: 'completed',
  completedAt: new Date()
});

    // Mark item as sold
    item.status = 'sold';
    await item.save();

    // Log activity
    const buyer = await User.findById(winner.user);
    await logActivity({
      type: 'AUCTION_WON',
      user: winner.user,
      targetUser: item.seller._id,
      item: item._id,
      transaction: transaction._id,
      amount: winner.amount,
      description: `${buyer.username} won "${item.title}" for ₹${winner.amount.toLocaleString()}`
    });

    console.log('✅ Auction closed successfully');

    res.json({
      message: 'Auction closed successfully',
      winner: {
        userId: winner.user,
        username: buyer.username,
        amount: winner.amount
      },
      transaction
    });

  } catch (error) {
    console.error('❌ Close auction error:', error);
    res.status(500).json({ message: 'Server error closing auction' });
  }
});

module.exports = router;