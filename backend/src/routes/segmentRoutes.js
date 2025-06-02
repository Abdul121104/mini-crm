const express = require('express');
const Segment = require('../models/Segment');
const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');
const { catchAsync } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/auth');
const vendorService = require('../services/vendorService');

const router = express.Router();

router.get('/', catchAsync(async (req, res) => {
  const segments = await Segment.find()
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(segments);
}));

router.get('/:id', catchAsync(async (req, res) => {
  const segment = await Segment.findById(req.params.id)
    .populate('createdBy', 'name email');
  
  if (!segment) {
    return res.status(404).json({ message: 'Segment not found' });
  }

  const customerCount = await Customer.countDocuments(buildQuery(segment.rules));
  segment.customerCount = customerCount;

  res.json(segment);
}));

router.post('/preview', catchAsync(async (req, res) => {
  const { rules } = req.body;
  const query = buildQuery(rules);
  const count = await Customer.countDocuments(query);
  res.json({ count });
}));

router.post('/', catchAsync(async (req, res) => {
  const { name, description, rules } = req.body;

  const segment = new Segment({
    name,
    description,
    rules,
    createdBy: req.user._id
  });
  await segment.save();

  const query = buildQuery(rules);
  const customers = await Customer.find(query);

  const campaign = new Campaign({
    name: `Campaign for ${name}`,
    description: `Automated campaign for segment: ${description}`,
    segment: segment._id,
    message: {
      subject: 'Special Offer for You!',
      content: 'Hi {{name}}, here\'s 10% off on your next order!',
      template: 'email'
    },
    status: 'running',
    createdBy: req.user._id
  });

  campaign.stats.totalRecipients = customers.length;
  await campaign.save();

  const sendPromises = customers.map(customer => 
    vendorService.sendMessage(
      customer,
      `Hi ${customer.name}, here's 10% off on your next order!`,
      campaign._id
    )
  );

  await Promise.allSettled(sendPromises);

  campaign.status = 'completed';
  await campaign.save();

  res.status(201).json({ segment, campaign });
}));

router.put('/:id', catchAsync(async (req, res) => {
  const segment = await Segment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!segment) {
    return res.status(404).json({ message: 'Segment not found' });
  }
  res.json(segment);
}));

router.delete('/:id', catchAsync(async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }

    if (segment.createdBy && segment.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this segment' });
    }

    await segment.deleteOne();
    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ message: 'Failed to delete segment. Please try again.' });
  }
}));

router.get('/:id/customers', catchAsync(async (req, res) => {
  const segment = await Segment.findById(req.params.id);
  if (!segment) {
    return res.status(404).json({ message: 'Segment not found' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = buildQuery(segment.rules);
  const customers = await Customer.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Customer.countDocuments(query);

  res.json({
    customers,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalCustomers: total
  });
}));

function buildQuery(rules) {
  const query = {};

  if (rules.operator === 'AND') {
    query.$and = rules.conditions.map(condition => {
      if (condition.operator) {
        return buildQuery(condition);
      } else {
        return buildCondition(condition);
      }
    });
  } else if (rules.operator === 'OR') {
    query.$or = rules.conditions.map(condition => {
      if (condition.operator) {
        return buildQuery(condition);
      } else {
        return buildCondition(condition);
      }
    });
  }

  return query;
}

function buildCondition(condition) {
  const { field, operator, value } = condition;
  const query = {};

  switch (operator) {
    case '>':
      query[field] = { $gt: parseFloat(value) };
      break;
    case '<':
      query[field] = { $lt: parseFloat(value) };
      break;
    case '>=':
      query[field] = { $gte: parseFloat(value) };
      break;
    case '<=':
      query[field] = { $lte: parseFloat(value) };
      break;
    case '==':
      query[field] = parseFloat(value);
      break;
    case '!=':
      query[field] = { $ne: parseFloat(value) };
      break;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }

  return query;
}

module.exports = router; 