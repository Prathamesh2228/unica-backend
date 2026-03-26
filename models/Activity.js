const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'USER_REGISTERED',
      'ITEM_LISTED',
      'ITEM_PURCHASED',
      'BID_PLACED',
      'AUCTION_WON',
      'TRADE_PROPOSED',
      'TRADE_ACCEPTED',
      'TRADE_REJECTED',
      'TRADE_CANCELLED',
      'PREMIUM_UPGRADE',
      'ITEM_DELETED',
      'DEALER_STORY_POSTED',  // ✅ NEW: For dealer stories
      'DEALER_POST_CREATED'   // ✅ NEW: For dealer posts
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  trade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  },
  amount: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days
  }
});

// Index for faster queries
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ isRead: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);