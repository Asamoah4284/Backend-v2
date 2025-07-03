const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Admin stats endpoint
router.get('/stats', (req, res) => {
  res.json({ 
    message: 'Internal stats endpoint',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 