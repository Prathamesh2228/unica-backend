const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['purchase', 'auction', 'trade'],
    default: 'purchase'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'crypto', 'cash'],
    default: 'stripe'
  },
  
  // ✅ RATING FIELDS
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  },
  ratedAt: {
    type: Date
  },
  
  // ✅ DELIVERY TRACKING FIELDS (NEW)
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
    default: 'pending'
  },
  shippingSpeed: {
    type: String,
    enum: ['standard', 'express', 'overnight'],
    default: 'standard'
  },
  deliveryDays: {
    type: Number,
    default: 5 // Business days
  },
  carrier: {
    type: String,
    enum: ['India Post', 'FedEx', 'DHL', 'Blue Dart', 'DTDC', 'Delhivery'],
    default: 'India Post'
  },
  
  // For trade transactions
  tradedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  
  // Shipping info
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  trackingNumber: {
    type: String
  },
  
  // Timestamps
  completedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ INDEX FOR FASTER QUERIES
TransactionSchema.index({ buyer: 1, createdAt: -1 });
TransactionSchema.index({ seller: 1, createdAt: -1 });
TransactionSchema.index({ deliveryStatus: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);