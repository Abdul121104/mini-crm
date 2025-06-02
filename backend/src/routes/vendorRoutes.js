const express = require('express');
const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

// Mock delivery receipt endpoint
router.post('/delivery-receipt', catchAsync(async (req, res) => {
  const { messageId, status, timestamp, metadata } = req.body;

  if (!messageId || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const log = await CommunicationLog.findOne({ messageId });
  if (!log) {
    return res.status(404).json({ message: 'Message not found' });
  }

  // Update log status and timestamps
  log.status = status;
  const now = timestamp || new Date();

  switch (status) {
    case 'sent':
      log.sentAt = now;
      break;
    case 'delivered':
      log.deliveredAt = now;
      break;
    case 'opened':
      log.openedAt = now;
      break;
    case 'clicked':
      log.clickedAt = now;
      break;
    case 'failed':
      log.error = {
        code: 'DELIVERY_FAILED',
        message: metadata?.error || 'Message delivery failed',
        timestamp: now
      };
      break;
  }

  // Add delivery metadata if provided
  if (metadata) {
    log.metadata = {
      ...log.metadata,
      ...metadata,
      lastUpdated: now
    };
  }

  await log.save();

  // Update campaign stats
  const campaign = await Campaign.findById(log.campaign);
  if (campaign) {
    const statsUpdate = {};
    switch (status) {
      case 'sent':
        statsUpdate['stats.sent'] = 1;
        break;
      case 'delivered':
        statsUpdate['stats.delivered'] = 1;
        break;
      case 'opened':
        statsUpdate['stats.opened'] = 1;
        break;
      case 'clicked':
        statsUpdate['stats.clicked'] = 1;
        break;
      case 'failed':
        statsUpdate['stats.failed'] = 1;
        break;
    }

    if (Object.keys(statsUpdate).length > 0) {
      await Campaign.findByIdAndUpdate(
        campaign._id,
        { $inc: statsUpdate }
      );
    }
  }

  res.json({ 
    message: 'Delivery receipt processed successfully',
    status: log.status,
    timestamp: now
  });
}));

// Mock message status endpoint
router.get('/message-status/:messageId', catchAsync(async (req, res) => {
  const log = await CommunicationLog.findOne({ messageId: req.params.messageId });
  if (!log) {
    return res.status(404).json({ message: 'Message not found' });
  }

  res.json({
    messageId: log.messageId,
    status: log.status,
    sentAt: log.sentAt,
    deliveredAt: log.deliveredAt,
    openedAt: log.openedAt,
    clickedAt: log.clickedAt,
    error: log.error,
    metadata: log.metadata
  });
}));

module.exports = router; 