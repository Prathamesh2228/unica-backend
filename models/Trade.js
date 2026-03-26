const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  // User who initiated the trade
  proposer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Item being offered by proposer
  proposerItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  // User receiving the trade proposal
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Item wanted by proposer (belongs to receiver)
  receiverItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  // Trade status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  // Optional message from proposer
  message: {
    type: String,
    maxlength: 500
  },
  // When trade was completed (if accepted)
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
TradeSchema.index({ proposer: 1, status: 1 });
TradeSchema.index({ receiver: 1, status: 1 });
TradeSchema.index({ proposerItem: 1 });
TradeSchema.index({ receiverItem: 1 });

module.exports = mongoose.model('Trade', TradeSchema);