const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// @route   POST /api/posts
// @desc    Create a new post (Dealers only)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { image, caption } = req.body;

    // Check if user is dealer
    const user = await User.findById(req.user.id);
    if (!user || user.premiumTier !== 'dealer') {
      return res.status(403).json({ message: 'Only dealers can create posts' });
    }

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const post = await Post.create({
      user: req.user.id,
      image,
      caption: caption || ''
    });

    await post.populate('user', 'username avatar premiumTier');

    // Log activity
    await logActivity({
      type: 'DEALER_POST_CREATED',
      user: req.user.id,
      metadata: { postId: post._id },
      description: `${user.username} created a new post`
    });

    res.status(201).json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get all posts by a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username avatar premiumTier')
      .sort({ createdAt: -1 });

    res.json({ posts });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/:postId
// @desc    Get single post
// @access  Public
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'username avatar premiumTier bio location');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:postId
// @desc    Delete a post
// @access  Private (owner only)
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:postId/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.json({ 
      likes: post.likes.length,
      isLiked: post.likes.includes(req.user.id)
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;