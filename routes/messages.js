const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/messages/conversations
// @desc    Get all conversations for logged-in user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      deletedFor: { $ne: req.user.id }
    })
    .populate('participants', 'username avatar isPremium premiumTier')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username' }
    })
    .sort({ lastMessageAt: -1 });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,  // ✅ FIXED: was 'conversation'
          receiver: req.user.id,
          read: false
        });

        // Get other participant
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.user.id
        );

        return {
          _id: conv._id,
          otherUser: otherParticipant,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation with a specific user (or create if doesn't exist)
// @access  Private
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    }).populate('participants', 'username email isPremium premiumTier avatar');

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId]
      });
      
      // Populate after creation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username email isPremium premiumTier avatar');
    }

    // Get all messages in this conversation - ✅ FIXED: was 'conversation'
    const messages = await Message.find({ conversationId: conversation._id })
      .populate('sender', 'username email avatar')
      .populate('receiver', 'username email avatar')
      .populate('attachedProduct', 'title price images category condition _id')
      .sort({ createdAt: 1 });

    // Mark messages as read - ✅ FIXED: was 'conversation'
    await Message.updateMany(
      {
        conversationId: conversation._id,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    // Format conversation for response
    const otherUser = conversation.participants.find(
      p => p._id.toString() !== req.user.id
    );

    res.json({
      conversation: {
        _id: conversation._id,
        otherUser
      },
      messages
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/send
// @desc    Send a message (with optional product attachment)
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content, productId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, receiverId]
      });
    }

    // Detect message type
    let messageType = 'text';
    if (productId) {
      messageType = 'product';
    } else if (content.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
               content.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)) {
      messageType = 'image';
    }

    // Create message - ✅ FIXED: use conversationId instead of conversation
    const message = await Message.create({
      conversationId: conversation._id,  // ✅ FIXED FIELD NAME
      sender: req.user.id,
      receiver: receiverId,
      content,
      messageType,
      attachedProduct: productId || null,
      read: false
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message
    await message.populate([
      { path: 'sender', select: 'username email avatar' },
      { path: 'receiver', select: 'username email avatar' },
      { path: 'attachedProduct', select: 'title price images category condition' }
    ]);

    res.status(201).json({
      message: 'Message sent',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    // Get all conversations for this user
    const conversations = await Conversation.find({
      participants: req.user.id
    }).select('_id');

    const conversationIds = conversations.map(c => c._id);

    // Only count unread messages that belong to ACTIVE conversations
    const count = await Message.countDocuments({
      receiver: req.user.id,
      read: false,
      conversationId: { $in: conversationIds } // ✅ FIXED: was 'conversation'
    });

    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/conversation/:userId
// @desc    Delete conversation for current user only
// @access  Private
router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, req.params.userId] }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Add user to "deletedFor" array
    if (!conversation.deletedFor) conversation.deletedFor = [];
    if (!conversation.deletedFor.includes(req.user.id)) {
      conversation.deletedFor.push(req.user.id);
    }
    await conversation.save();

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;