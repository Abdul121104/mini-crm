const express = require('express');
const router = express.Router();
const CommunicationLog = require('../models/CommunicationLog');

router.get('/', async (req, res) => {
  try {
    const logs = await CommunicationLog.find()
      .populate('customer', 'name email')
      .populate('campaign', 'name')
      .sort({ createdAt: -1 })
    res.json(logs);
  } catch (error) {
    console.error('Error fetching communication logs:', error);
    res.status(500).json({ message: 'Error fetching communication logs' });
  }
});

module.exports = router;
