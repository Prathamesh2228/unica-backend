const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    maxlength: 200,
    default: ''
  },
  views: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index - auto-deletes after expiresAt
  }
});

// Index for faster queries
StorySchema.index({ user: 1, expiresAt: 1 });

// Set expiry to 24 hours from creation
StorySchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

module.exports = mongoose.model('Story', StorySchema);