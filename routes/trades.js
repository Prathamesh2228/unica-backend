const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// @route   POST /api/trades/propose
// @desc    Propose a trade
// @access  Private
router.post('/propose', auth, async (req, res) => {
  console.log('\n🔄 Trade Proposal Started');
  console.log('Proposer:', req.user.id);
  console.log('Request Body:', req.body);

  try {
    const { proposerItemId, receiverItemId, message } = req.body;

    if (!proposerItemId || !receiverItemId) {
      return res.status(400).json({ message: 'Both items are required' });
    }

    // Get both items
    const proposerItem = await Item.findById(proposerItemId);
    const receiverItem = await Item.findById(receiverItemId);

    if (!proposerItem || !receiverItem) {
      return res.status(404).json({ message: 'One or both items not found' });
    }

    console.log('Proposer Item:', proposerItem.title);
    console.log('Receiver Item:', receiverItem.title);

    // Validations
    if (proposerItem.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only trade your own items' });
    }

    if (receiverItem.seller.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot trade with yourself' });
    }

    if (proposerItem.status !== 'active') {
      return res.status(400).json({ message: 'Your item is not available for trade' });
    }

    if (receiverItem.status !== 'active') {
      return res.status(400).json({ message: 'That item is no longer available' });
    }

    if (receiverItem.type !== 'trade') {
      return res.status(400).json({ message: 'That item is not available for trade' });
    }

    // Check if trade proposal already exists
    const existingTrade = await Trade.findOne({
      proposer: req.user.id,
      receiver: receiverItem.seller,
      proposerItem: proposerItemId,
      receiverItem: receiverItemId,
      status: 'pending'
    });

    if (existingTrade) {
      return res.status(400).json({ message: 'You already have a pending trade for these items' });
    }

    // ✅ GET PROPOSER INFO FOR ACTIVITY LOG
    const User = require('../models/User');
    const proposer = await User.findById(req.user.id);

    // Create trade proposal
    const trade = await Trade.create({
      proposer: req.user.id,
      proposerItem: proposerItemId,
      receiver: receiverItem.seller,
      receiverItem: receiverItemId,
      message: message || '',
      status: 'pending'
    });

     // ✅ LOG ACTIVITY
    await logActivity({
      type: 'TRADE_PROPOSED',
      user: req.user.id,
      targetUser: receiverItem.seller,
      item: receiverItemId,
      trade: trade._id,
      description: `${proposer.username} proposed trading "${proposerItem.title}" for "${receiverItem.title}"`
    });

    // Populate for response
    await trade.populate([
      { path: 'proposer', select: 'username email' },
      { path: 'receiver', select: 'username email' },
      { path: 'proposerItem', select: 'title images price category' },
      { path: 'receiverItem', select: 'title images price category' }
    ]);

    console.log('✅ Trade proposal created successfully');

    res.status(201).json({
      message: 'Trade proposal sent successfully!',
      trade
    });

  } catch (error) {
    console.error('❌ Trade proposal error:', error);
    res.status(500).json({ 
      message: 'Server error creating trade proposal',
      error: error.message 
    });
  }
});

// @route   GET /api/trades/incoming
// @desc    Get received trade proposals
// @access  Private
router.get('/incoming', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ 
      receiver: req.user.id,
      status: 'pending'
    })
    .populate('proposer', 'username email isPremium')
    .populate('proposerItem', 'title images price category condition')
    .populate('receiverItem', 'title images price category condition')
    .sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    console.error('Error fetching incoming trades:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/trades/outgoing
// @desc    Get sent trade proposals
// @access  Private
router.get('/outgoing', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ 
      proposer: req.user.id,
      status: 'pending'
    })
    .populate('receiver', 'username email isPremium')
    .populate('proposerItem', 'title images price category condition')
    .populate('receiverItem', 'title images price category condition')
    .sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    console.error('Error fetching outgoing trades:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/trades/history
// @desc    Get completed/rejected trade history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ 
      $or: [
        { proposer: req.user.id },
        { receiver: req.user.id }
      ],
      status: { $in: ['accepted', 'rejected', 'cancelled'] }
    })
    .populate('proposer', 'username email')
    .populate('receiver', 'username email')
    .populate('proposerItem', 'title images price category')
    .populate('receiverItem', 'title images price category')
    .sort({ completedAt: -1, createdAt: -1 });

    res.json(trades);
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




// @route   PUT /api/trades/:id/accept
// @desc    Accept a trade proposal
// @access  Private
router.put('/:id/accept', auth, async (req, res) => {
  console.log('\n✅ Accepting trade:', req.params.id);

  try {
    const trade = await Trade.findById(req.params.id)
      .populate('proposerItem')
      .populate('receiverItem')
      .populate('proposer', 'username')
      .populate('receiver', 'username');

    if (!trade) {
      return res.status(404).json({ message: 'Trade proposal not found' });
    }

    // Verify user is the receiver
    if (trade.receiver._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ message: 'This trade is no longer pending' });
    }

    // Check both items are still available
    if (trade.proposerItem.status !== 'active' || trade.receiverItem.status !== 'active') {
      return res.status(400).json({ message: 'One or both items are no longer available' });
    }

    // Mark both items as traded
    trade.proposerItem.status = 'sold';
    trade.receiverItem.status = 'sold';
    
    await trade.proposerItem.save();
    await trade.receiverItem.save();

    // Update trade status
    trade.status = 'accepted';
    trade.completedAt = Date.now();
    await trade.save();

    // ✅ LOG ACTIVITY
    await logActivity({
      type: 'TRADE_ACCEPTED',
      user: req.user.id,
      targetUser: trade.proposer._id,
      trade: trade._id,
      description: `${trade.receiver.username} accepted trade: "${trade.proposerItem.title}" ↔ "${trade.receiverItem.title}"`
    });

    console.log('✅ Trade accepted successfully');

    res.json({
      message: 'Trade accepted! Both items exchanged.',
      trade
    });

  } catch (error) {
    console.error('❌ Accept trade error:', error);
    res.status(500).json({ 
      message: 'Server error accepting trade',
      error: error.message 
    });
  }
});

// @route   PUT /api/trades/:id/reject
// @desc    Reject a trade proposal
// @access  Private
router.put('/:id/reject', auth, async (req, res) => {
  console.log('\n❌ Rejecting trade:', req.params.id);

  try {
    const trade = await Trade.findById(req.params.id)
      .populate('proposer', 'username')
      .populate('receiver', 'username')
      .populate('proposerItem', 'title')
      .populate('receiverItem', 'title');

    if (!trade) {
      return res.status(404).json({ message: 'Trade proposal not found' });
    }

    // Verify user is the receiver
    if (trade.receiver._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reject this trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ message: 'This trade is no longer pending' });
    }

    // Update trade status
    trade.status = 'rejected';
    trade.completedAt = Date.now();
    await trade.save();

    // ✅ LOG ACTIVITY
    await logActivity({
      type: 'TRADE_REJECTED',
      user: req.user.id,
      targetUser: trade.proposer._id,
      trade: trade._id,
      description: `${trade.receiver.username} rejected trade: "${trade.proposerItem.title}" ↔ "${trade.receiverItem.title}"`
    });

    console.log('✅ Trade rejected');

    res.json({
      message: 'Trade proposal rejected',
      trade
    });

  } catch (error) {
    console.error('❌ Reject trade error:', error);
    res.status(500).json({ 
      message: 'Server error rejecting trade',
      error: error.message 
    });
  }
});

// @route   DELETE /api/trades/:id
// @desc    Cancel your own trade proposal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ message: 'Trade proposal not found' });
    }

    // Verify user is the proposer
    if (trade.proposer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending trades' });
    }

    trade.status = 'cancelled';
    await trade.save();

    res.json({ message: 'Trade proposal cancelled' });

  } catch (error) {
    console.error('Error cancelling trade:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;