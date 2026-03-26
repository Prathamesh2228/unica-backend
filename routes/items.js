const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper function to get item limit based on tier
const getItemLimit = (user) => {
  if (!user.isPremium || user.premiumTier === 'basic') return 5;
  if (user.premiumTier === 'pro') return 20;
  if (user.premiumTier === 'dealer') return Infinity;
  return 5; // Default to basic
};

// @route   GET /api/items
// @desc    Get all items (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, type, status, search } = req.query;
    
    let query = {};
    
    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type;
    if (status) query.status = status;
    else query.status = 'active';
    
    if (search) {
      query.$text = { $search: search };
    }

    const items = await Item.find(query)
      .populate('seller', 'username email isPremium rating createdAt avatar premiumTier location bio') // ✅ ADDED bio
      .sort({ createdAt: -1 })
      .limit(100);

    const validItems = items.filter(item => item.seller);
    res.json(validItems);
  } catch (error) {
    console.error('Get Items Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching items',
      error: error.message 
    });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'username email isPremium rating createdAt avatar premiumTier location bio'); // ✅ ADDED location bio

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }

    item.views += 1;
    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Get Item Error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching item',
      error: error.message 
    });
  }
});

// @route   POST /api/items
// @desc    Create new item
// @access  Private (sellers only)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      price, 
      category, 
      type, 
      condition, 
      images, 
      auctionEndDate, 
      tradePreference 
    } = req.body;

    // Validation
    if (!title || !description || !price || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // ✅ CHECK UPLOAD LIMIT
    const user = await User.findById(req.user.id);
    const itemLimit = getItemLimit(user);
    
    // Count user's active items
    const activeItemCount = await Item.countDocuments({ 
      seller: req.user.id, 
      status: 'active' 
    });

    console.log(`User ${user.username} (${user.premiumTier}): ${activeItemCount}/${itemLimit} items`);

    if (activeItemCount >= itemLimit) {
      return res.status(403).json({
        success: false,
        message: `You've reached your ${user.premiumTier === 'basic' ? 'Basic' : user.premiumTier.toUpperCase()} tier limit of ${itemLimit} active items. Upgrade to list more!`,
        currentCount: activeItemCount,
        limit: itemLimit,
        tier: user.premiumTier
      });
    }

    const item = await Item.create({
      title,
      description,
      price,
      category,
      type: type || 'buy',
      condition,
      images: images || [],
      seller: req.user.id,
      auctionEndDate: type === 'auction' ? auctionEndDate : undefined,
      currentBid: type === 'auction' ? price : undefined,
      tradePreference: type === 'trade' ? tradePreference : undefined
    });

    await item.populate('seller', 'username email isPremium rating createdAt avatar premiumTier location bio'); // ✅ ADDED location bio

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item,
      remainingSlots: itemLimit === Infinity ? Infinity : itemLimit - activeItemCount - 1
    });
  } catch (error) {
    console.error('Create Item Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating item',
      error: error.message 
    });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }

    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this item' 
      });
    }

    item = await Item.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('seller', 'username email isPremium rating createdAt avatar premiumTier location bio'); // ✅ ADDED location bio

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update Item Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating item',
      error: error.message 
    });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }

    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this item' 
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting item',
      error: error.message 
    });
  }
});

// @route   GET /api/items/seller/:sellerId
// @desc    Get items by seller
// @access  Public
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const items = await Item.find({ 
      seller: req.params.sellerId,
      status: 'active'
    })
    .populate('seller', 'username email isPremium rating createdAt avatar premiumTier location bio') // ✅ ADDED location bio
    .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error('Get Seller Items Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching seller items' 
    });
  }
});

module.exports = router;