const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'product'],
    default: 'text'
  },
  attachedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries - ✅ FIXED: conversationId instead of conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });

module.exports = mongoose.model('Message', MessageSchema);