const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const achievementRoutes = require('./routes/achievements');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/transactions', require('./routes/transactions')); // ✅ TRANSACTIONS ROUTE
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/premium', require('./routes/premium'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/community', require('./routes/community'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/support', require('./routes/support'));
app.use('/api/achievements', achievementRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'UNICA API is running! 🚀' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}`);
});