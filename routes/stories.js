const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth');

// @route   POST /api/stories
// @desc    Create a new story (Dealer only)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Only dealers can post stories
    if (!req.user.isPremium || req.user.premiumTier !== 'dealer') {
      return res.status(403).json({ message: 'Only Dealer members can post stories' });
    }

    const story = await Story.create({
      user: req.user.id,
      image: imageUrl,  // ✅ FIXED: Match model field name
      caption: caption || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await story.populate('user', 'username isPremium premiumTier avatar');

    res.status(201).json({ 
      message: 'Story posted successfully!',
      story 
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stories
// @desc    Get active stories from all dealers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'username isPremium premiumTier avatar')
    .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    res.json({ 
      stories: Object.values(groupedStories)
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stories/user/:userId
// @desc    Get stories from a specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.params.userId,
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'username isPremium premiumTier avatar')
    .sort({ createdAt: -1 });

    res.json({ stories });

  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stories/:storyId/view
// @desc    Mark story as viewed
// @access  Private
router.post('/:storyId/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Add view if not already viewed
    if (!story.views.includes(req.user.id)) {
      story.views.push(req.user.id);
      await story.save();
    }

    res.json({ message: 'Story viewed' });

  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/stories/:storyId
// @desc    Delete own story
// @access  Private
router.delete('/:storyId', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.storyId);

    res.json({ message: 'Story deleted successfully' });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;