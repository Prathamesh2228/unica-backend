const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: 2000
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Trading Cards', 'Gaming Collectibles', 'Sports Memorabilia', 'Vintage Fashion', 'Elite Antiquities', 'Comic Books', 'Other']
  },
  type: {
    type: String,
    required: true,
    enum: ['buy', 'auction', 'trade'],
    default: 'buy'
  },
  condition: {
    type: String,
    required: true,
    enum: ['mint', 'near-mint', 'excellent', 'good', 'fair', 'poor']
  },
  images: [{
    type: String,
    default: 'https://via.placeholder.com/400'
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Auction specific fields
  auctionEndDate: {
    type: Date
  },
  currentBid: {
    type: Number,
    default: 0
  },
  bidders: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Trade specific fields
  tradePreference: {
    type: String,
    maxlength: 500
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'sold', 'pending', 'cancelled'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search
ItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', ItemSchema);