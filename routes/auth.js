const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const auth = require('../middleware/auth'); 

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or username' 
      });
    }

    const user = await User.create({ username, email, password });

    await logActivity({
      type: 'USER_REGISTERED',
      user: user._id,
      description: `New user registered: ${user.username}`
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isPremium: user.isPremium,
        premiumTier: user.premiumTier,
        userType: user.userType,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isPremium: user.isPremium,
        premiumTier: user.premiumTier,
        userType: user.userType,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        location: user.location,  // ✅ include location on login
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
});


// @route   PUT /api/auth/profile
// @desc    Update profile (location, bio, username)
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { location, bio, username } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { location, bio, username },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;