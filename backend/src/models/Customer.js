const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number
  }]
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  purchaseHistory: [purchaseSchema],
  totalSpend: {
    type: Number,
    default: 0
  },
  visits: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.pre('save', function(next) {
  this.totalSpend = this.purchaseHistory.reduce((total, purchase) => total + purchase.amount, 0);
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema); 