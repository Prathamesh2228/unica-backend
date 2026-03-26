const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deletedFor: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
});

// Ensure only 2 participants
ConversationSchema.index({ participants: 1 });

// Method to check if user is participant
ConversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

module.exports = mongoose.model('Conversation', ConversationSchema);