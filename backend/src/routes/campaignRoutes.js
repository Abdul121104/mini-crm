const express = require('express');
const Campaign = require('../models/Campaign');
const Segment = require('../models/Segment');
const Customer = require('../models/Customer');
const { catchAsync } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/auth');
const campaignController = require('../controllers/campaignController');
const vendorService = require('../services/vendorService');
const CommunicationLog = require('../models/CommunicationLog');

const router = express.Router();

const buildQuery = (rules) => {
  const query = {};
  
  if (!rules) return query;

  if (rules.operator === 'AND') {
    query.$and = rules.conditions.map(condition => {
      if (condition.operator && Array.isArray(condition.conditions)) { 
        return buildQuery(condition);
      } else {
        return buildCondition(condition);
      }
    });
    if (query.$and.length === 0) delete query.$and;
  } else if (rules.operator === 'OR') {
    query.$or = rules.conditions.map(condition => {
      if (condition.operator && Array.isArray(condition.conditions)) { 
        return buildQuery(condition);
      } else {
        return buildCondition(condition);
      }
    });
    if (query.$or.length === 0) delete query.$or;
  } else if (rules.field && rules.operator && rules.value !== undefined) {
     return buildCondition(rules);
  }

  return query;
};

function buildCondition(condition) {
  const { field, operator, value } = condition;
  const query = {};

  switch (operator) {
    case '>':
      if (typeof value !== 'number') throw new Error(`Invalid value for > operator: ${value}`);
      query[field] = { $gt: value };
      break;
    case '<':
      if (typeof value !== 'number') throw new Error(`Invalid value for < operator: ${value}`);
      query[field] = { $lt: value };
      break;
    case '>=':
      if (typeof value !== 'number') throw new Error(`Invalid value for >= operator: ${value}`);
      query[field] = { $gte: value };
      break;
    case '<=':
      if (typeof value !== 'number') throw new Error(`Invalid value for <= operator: ${value}`);
      query[field] = { $lte: value };
      break;
    case '==':
      query[field] = value;
      break;
    case '!=':
      query[field] = { $ne: value };
      break;
    case 'contains':
      if (!Array.isArray(value)) throw new Error(`Invalid value for contains operator: ${value}. Expected an array.`);
      query[field] = { $all: value };
      break;
    case 'startsWith':
       if (typeof value !== 'string') throw new Error(`Invalid value for startsWith operator: ${value}. Expected a string.`);
      query[field] = { $regex: `^${value}`, $options: 'i' };
      break;
    case 'endsWith':
       if (typeof value !== 'string') throw new Error(`Invalid value for endsWith operator: ${value}. Expected a string.`);
      query[field] = { $regex: `${value}$`, $options: 'i' };
      break;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }

  return query;
}

router.get('/', catchAsync(async (req, res) => {
  const campaigns = await Campaign.find()
    .populate('segment', 'name')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(campaigns);
}));

router.get('/:id/stats', catchAsync(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .select('name status stats');
  
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }

  res.json({
    name: campaign.name,
    status: campaign.status,
    stats: campaign.stats
  });
}));

router.get('/:id', catchAsync(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('segment', 'name')
    .populate('createdBy', 'name email');
  
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }
  res.json(campaign);
}));

router.post('/', catchAsync(async (req, res) => {
  try {
    const { name, description, segment, message, schedule } = req.body;

    if (!name || !segment || !message || !message.subject || !message.content || !message.template) {
      return res.status(400).json({ 
        message: 'Missing required fields. Please provide name, segment, and message details.' 
      });
    }

    const segmentExists = await Segment.findById(segment);
    if (!segmentExists) {
      return res.status(400).json({ message: 'Invalid segment ID' });
    }

    const campaign = new Campaign({
      name,
      description,
      segment,
      message: {
        subject: message.subject,
        content: message.content,
        template: message.template
      },
      schedule: schedule || {},
      status: 'draft',
      createdBy: req.user._id,
      stats: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        clicked: 0
      }
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create campaign',
      error: error.message 
    });
  }
}));

router.post('/:id/send', catchAsync(async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('segment', 'name rules');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ 
        message: `Campaign cannot be sent. Current status: ${campaign.status}` 
      });
    }

    const segment = campaign.segment;
    if (!segment) {
      return res.status(400).json({ message: 'Segment not found' });
    }

    campaign.status = 'running';
    await campaign.save();

    try {
      const customerQuery = buildQuery(segment.rules);
      const customers = await Customer.find(customerQuery);

      if (!customers || customers.length === 0) {
        campaign.status = 'failed';
        campaign.stats.totalRecipients = 0;
        await campaign.save();
        return res.status(400).json({ message: 'No customers found in the segment' });
      }

      campaign.stats.totalRecipients = customers.length;
      await campaign.save();

      const sendPromises = customers.map(customer => 
        vendorService.sendMessage(
          customer,
          campaign.message.content,
          campaign._id
        )
      );

      const results = await Promise.allSettled(sendPromises);
      
      const successfulSends = results.filter(r => r.status === 'fulfilled').length;
      const failedSends = results.filter(r => r.status === 'rejected').length;

      campaign.stats.sent = successfulSends;
      campaign.stats.failed = failedSends;
      
      campaign.status = failedSends === 0 ? 'completed' : 'failed';
      await campaign.save();

      res.json({ 
        message: 'Campaign sent successfully',
        campaign: {
          id: campaign._id,
          status: campaign.status,
          stats: campaign.stats
        }
      });
    } catch (error) {
      campaign.status = 'failed';
      await campaign.save();
      throw error;
    }
  } catch (error) {
    console.error('Campaign sending error:', error);
    res.status(500).json({ 
      message: 'Failed to send campaign',
      error: error.message 
    });
  }
}));

router.put('/:id', catchAsync(async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }
  res.json(campaign);
}));

router.delete('/:id', authorize('admin'), catchAsync(async (req, res) => {
  const campaign = await Campaign.findByIdAndDelete(req.params.id);
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }
  res.json({ message: 'Campaign deleted successfully' });
}));

router.get('/:id/logs', catchAsync(async (req, res) => {
  const logs = await CommunicationLog.find({ campaign: req.params.id })
    .populate('customer', 'name email')
    .sort({ sentAt: -1 });
  
  res.json(logs);
}));

module.exports = router; 