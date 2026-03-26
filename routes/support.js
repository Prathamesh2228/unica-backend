// ✅ GROQ VERSION - 100% FREE AI CHATBOT

const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { logActivity } = require('../utils/activityLogger');

// @route   POST /api/support/ticket
// @desc    Create a new support ticket
// @access  Private
router.post('/ticket', auth, async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      user: req.user.id,
      subject,
      category: category || 'general',
      messages: [{
        sender: req.user.id,
        senderType: 'user',
        content: message
      }]
    });

    await ticket.populate('user', 'username email');

    // Log activity
    await logActivity({
      type: 'SUPPORT_TICKET_CREATED',
      user: req.user.id,
      metadata: { ticketId: ticket._id, subject },
      description: `New support ticket: ${subject}`
    });

    res.status(201).json({ ticket });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/support/tickets
// @desc    Get user's support tickets
// @access  Private
router.get('/tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id })
      .populate('user', 'username email')
      .populate('messages.sender', 'username')
      .sort({ createdAt: -1 });

    res.json({ tickets });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/support/ticket/:ticketId
// @desc    Get single ticket
// @access  Private
router.get('/ticket/:ticketId', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate('user', 'username email')
      .populate('messages.sender', 'username');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns ticket or is admin
    const user = await User.findById(req.user.id);
    if (ticket.user._id.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ ticket });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/support/ticket/:ticketId/reply
// @desc    Reply to a ticket (user or admin)
// @access  Private
router.post('/ticket/:ticketId/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const user = await User.findById(req.user.id);

    // Check authorization
    if (ticket.user.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add message
    ticket.messages.push({
      sender: req.user.id,
      senderType: user.isAdmin ? 'admin' : 'user',
      content: message.trim()
    });

    ticket.lastReplyAt = new Date();

    // If admin replies, change status to pending
    if (user.isAdmin) {
      ticket.status = 'pending';
    }

    await ticket.save();
    await ticket.populate('messages.sender', 'username');

    res.json({ ticket });

  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/support/admin/tickets
// @desc    Get all support tickets (admin only)
// @access  Private + Admin
router.get('/admin/tickets', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .populate('user', 'username email')
      .populate('messages.sender', 'username')
      .sort({ lastReplyAt: -1 });

    res.json({ tickets });

  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/support/admin/ticket/:ticketId/status
// @desc    Update ticket status (admin only)
// @access  Private + Admin
router.patch('/admin/ticket/:ticketId/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'pending', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.ticketId,
      { status },
      { new: true }
    ).populate('user', 'username email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ ticket });

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GROQ AI RESPONSE - 100% FREE & FAST!
// @route   POST /api/support/ai-response
// @desc    Get AI response using FREE Groq API
// @access  Public
router.post('/ai-response', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // ✅ USE GROQ AI (FREE & FAST)
    const response = await getGroqAIResponse(question.toLowerCase());

    res.json({ response });

  } catch (error) {
    console.error('AI response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GROQ AI FUNCTION - FREE & BLAZING FAST
async function getGroqAIResponse(question) {
  try {
    const systemPrompt = `You are UNICA's helpful AI assistant. UNICA is a premium collectibles marketplace for trading cards, vintage items, and rare collectibles.

Key information about UNICA:

PRICING PLANS:
- FREE: 5 item listings
- PRO (₹499/month): 20 listings, featured items, priority support
- DEALER (₹1,999/month): Unlimited listings, analytics, dedicated support, community profile
- ENTERPRISE (₹4,999/month): Everything + custom branding, API access, white-glove support

HOW TO SELL:
1. Click '💰 Sell' button in navbar
2. Fill item details (title, price, category, condition)
3. Upload photos
4. Choose type: Buy Now, Auction, or Trade
5. Submit listing

SHIPPING:
- Peer-to-peer marketplace
- Sellers arrange shipping directly with buyers
- Always use tracking
- Ship within 2-3 business days
- Free shipping on all items

AUCTIONS:
- Bid higher than current bid
- Highest bidder when timer expires wins
- You'll be notified if outbid
- Pay immediately after winning

TRADING:
- Find 'TRADE' listings
- Propose trade with your items
- Both parties must agree
- Trade is finalized when accepted

ACCOUNT HELP:
- Reset password on login page
- Update profile from avatar dropdown
- Upgrade premium anytime

COMMUNITY:
- Only for DEALER-tier members
- Featured profiles
- Unlimited listings
- Direct messaging

Answer questions helpfully and concisely. Keep responses friendly and under 150 words.`;

    // ✅ GROQ API CALL (FREE!)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Fast & FREE model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API error:', data.error);
      return getFallbackResponse(question);
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error('Groq API error:', error);
    return getFallbackResponse(question);
  }
}

// ✅ FALLBACK RESPONSES (if API is down)
function getFallbackResponse(question) {
  const responses = {
    pricing: "💎 **UNICA Premium Plans:**\n\n**PRO - ₹499/month**\n- 20 item listings\n- Featured listings\n- Priority support\n\n**DEALER - ₹1,999/month**\n- Unlimited listings\n- Advanced analytics\n- Dedicated support\n- Community featured profile\n\n**ENTERPRISE - ₹4,999/month**\n- Everything in Dealer\n- Custom branding\n- API access\n- White-glove support",
    
    sell: "🏪 **How to Sell on UNICA:**\n\n1. Click '💰 Sell' button in navbar\n2. Fill in item details (title, price, category)\n3. Upload photos\n4. Choose listing type: Buy Now, Auction, or Trade\n5. Submit listing\n\n**Fees:** Free for basic users (5 item limit). Upgrade to PRO for 20 items or DEALER for unlimited!",
    
    shipping: "📦 **Shipping on UNICA:**\n\nUNICA is a peer-to-peer marketplace. Shipping is arranged directly between buyer and seller.\n\n**Tips:**\n- Always use tracking\n- Package items securely\n- Communicate shipping timeframes\n- Keep proof of shipment\n\nWe recommend shipping within 2-3 business days of purchase.",
    
    account: "👤 **Account Help:**\n\n**Reset Password:** Click 'Forgot Password' on login page\n\n**Update Profile:** Click your avatar → My Profile\n\n**Upgrade Premium:** Click avatar → Upgrade to Premium\n\n**Need more help?** Click 'Escalate to Support' below!",
    
    trade: "🔄 **How Trading Works:**\n\n1. Find a 'TRADE' listing\n2. Click 'Propose Trade'\n3. Select an item from your inventory\n4. Add a message\n5. Wait for seller to accept/reject\n\nBoth parties must agree before trade is finalized!",
    
    auction: "🏆 **Auction Guide:**\n\n**Bidding:**\n- Enter bid higher than current bid\n- You'll be notified if outbid\n- Highest bidder when time expires wins\n\n**Winning:**\n- Pay immediately after winning\n- Seller ships within 2-3 days\n\n**Can't afford to lose? Set a max bid!**",
    
    help: "🆘 **I'm here to help!**\n\nI can answer questions about:\n- Pricing & plans\n- How to sell\n- Shipping\n- Account issues\n- Trading & auctions\n- Payments\n- Community\n\n**Just ask your question!**\n\nIf I can't help, click 'Escalate to Support' to chat with our team! 😊"
  };

  // Keyword matching
  if (question.includes('price') || question.includes('plan') || question.includes('cost') || question.includes('premium')) {
    return responses.pricing;
  }
  if (question.includes('sell') || question.includes('list') || question.includes('upload')) {
    return responses.sell;
  }
  if (question.includes('ship') || question.includes('delivery') || question.includes('deliver')) {
    return responses.shipping;
  }
  if (question.includes('account') || question.includes('password') || question.includes('profile')) {
    return responses.account;
  }
  if (question.includes('trade') || question.includes('swap') || question.includes('exchange')) {
    return responses.trade;
  }
  if (question.includes('auction') || question.includes('bid')) {
    return responses.auction;
  }
  
  return responses.help;
}

module.exports = router;