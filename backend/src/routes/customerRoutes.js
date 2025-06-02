const express = require('express');
const Customer = require('../models/Customer');
const { catchAsync } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

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

router.get('/:id', catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  res.json(customer);
}));

router.post('/', catchAsync(async (req, res) => {
  const customer = new Customer(req.body);
  await customer.save();
  res.status(201).json(customer);
}));

router.put('/:id', catchAsync(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  res.json(customer);
}));

router.delete('/:id', authorize('admin'), catchAsync(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  res.json({ message: 'Customer deleted successfully' });
}));

router.post('/:id/purchases', catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customer.purchaseHistory.push(req.body);
  await customer.save();
  res.json(customer);
}));

router.patch('/:id/tags', catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customer.tags = req.body.tags;
  await customer.save();
  res.json(customer);
}));

module.exports = router;
