const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// @route   GET /api/premium/tiers
// @desc    Get all premium tier information
// @access  Public
router.get('/tiers', (req, res) => {
  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      period: 'Forever Free',
      itemLimit: 5,
      features: [
        '5 active listings',
        'Standard support',
        'Basic analytics',
        '10% platform fee'
      ],
      color: 'gray'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 999,
      period: '/month',
      itemLimit: 20,
      features: [
        '20 active listings',
        '✅ Verified badge',
        'Priority support',
        'Advanced analytics',
        '8% platform fee',
        'Featured in search'
      ],
      color: 'blue',
      popular: true
    },
    {
      id: 'dealer',
      name: 'Dealer',
      price: 2999,
      period: '/month',
      itemLimit: Infinity,
      features: [
        '∞ Unlimited listings',
        '🌟 Premium badge',
        'VIP support 24/7',
        'Full analytics suite',
        '5% platform fee',
        'Featured listings',
        'Custom storefront',
        'Bulk upload tools'
      ],
      color: 'gold'
    }
  ];

  res.json({ tiers });
});

// @route   POST /api/premium/upgrade
// @desc    Upgrade user to premium tier (MOCK PAYMENT)
// @access  Private
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { tier } = req.body;

    if (!['pro', 'dealer'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid tier selected' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ MOCK PAYMENT - In production, integrate Stripe/Razorpay here
    user.isPremium = true;
    user.premiumTier = tier;
    
    // Set expiry to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    user.premiumExpiryDate = expiryDate;

    await user.save();

    // ✅ LOG ACTIVITY
    await logActivity({
      type: 'PREMIUM_UPGRADE',
      user: req.user.id,
      description: `${user.username} upgraded to ${tier.toUpperCase()} tier`
    });

    res.json({
      message: `Successfully upgraded to ${tier.toUpperCase()} tier!`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isPremium: user.isPremium,
        premiumTier: user.premiumTier,
        premiumExpiryDate: user.premiumExpiryDate
      }
    });

  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ message: 'Server error during upgrade' });
  }
});



// @route   POST /api/premium/cancel
// @desc    Cancel premium subscription
// @access  Private
router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isPremium = false;
    user.premiumTier = 'basic';
    user.premiumExpiryDate = null;

    await user.save();

    res.json({
      message: 'Premium subscription cancelled',
      user: {
        id: user._id,
        username: user.username,
        isPremium: user.isPremium,
        premiumTier: user.premiumTier
      }
    });

  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/premium/my-status
// @desc    Get current user's premium status
// @access  Private
router.get('/my-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isActive = user.isPremiumActive();

    res.json({
      isPremium: user.isPremium,
      premiumTier: user.premiumTier,
      isActive,
      expiryDate: user.premiumExpiryDate,
      itemLimit: user.itemLimit,
      badge: user.getPremiumBadge()
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;