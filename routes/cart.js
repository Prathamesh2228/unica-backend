const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.item',
        select: 'title images price category condition type status seller',
        populate: { path: 'seller', select: 'username isPremium' }
      })
      .populate({
        path: 'wishlist.item',
        select: 'title images price category condition type status seller',
        populate: { path: 'seller', select: 'username isPremium' }
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [], wishlist: [] });
    }

    // Filter out sold/deleted items
    cart.items = cart.items.filter(i => i.item && i.item.status === 'active');
    cart.wishlist = cart.wishlist.filter(i => i.item && i.item.status === 'active');

    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cart/add/:itemId
// @desc    Add item to cart
// @access  Private
router.post('/add/:itemId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ message: 'Item is not available' });
    }

    if (item.seller.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot add your own item to cart' });
    }

    if (item.type !== 'buy') {
      return res.status(400).json({ message: 'Only buy items can be added to cart' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [], wishlist: [] });
    }

    // Check if already in cart
    const existsInCart = cart.items.some(i => i.item.toString() === req.params.itemId);
    if (existsInCart) {
      return res.status(400).json({ message: 'Item already in cart' });
    }

    // Add to cart
    cart.items.push({ item: req.params.itemId });
    await cart.save();

    await cart.populate({
      path: 'items.item',
      select: 'title images price category condition type status seller',
      populate: { path: 'seller', select: 'username isPremium' }
    });

    res.json({ message: 'Added to cart', cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(i => i.item.toString() !== req.params.itemId);
    await cart.save();

    await cart.populate({
      path: 'items.item',
      select: 'title images price category condition type status seller',
      populate: { path: 'seller', select: 'username isPremium' }
    });

    res.json({ message: 'Removed from cart', cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cart/wishlist/add/:itemId
// @desc    Add item to wishlist
// @access  Private
router.post('/wishlist/add/:itemId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.seller.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot add your own item to wishlist' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [], wishlist: [] });
    }

    // Check if already in wishlist
    const existsInWishlist = cart.wishlist.some(i => i.item.toString() === req.params.itemId);
    if (existsInWishlist) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    // Add to wishlist
    cart.wishlist.push({ item: req.params.itemId });
    await cart.save();

    await cart.populate({
      path: 'wishlist.item',
      select: 'title images price category condition type status seller',
      populate: { path: 'seller', select: 'username isPremium' }
    });

    res.json({ message: 'Added to wishlist', cart });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/wishlist/remove/:itemId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/wishlist/remove/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.wishlist = cart.wishlist.filter(i => i.item.toString() !== req.params.itemId);
    await cart.save();

    await cart.populate({
      path: 'wishlist.item',
      select: 'title images price category condition type status seller',
      populate: { path: 'seller', select: 'username isPremium' }
    });

    res.json({ message: 'Removed from wishlist', cart });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;