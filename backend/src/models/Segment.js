const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    required: true,
    enum: ['>', '<', '>=', '<=', '==', '!=', 'contains', 'startsWith', 'endsWith']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const ruleSchema = new mongoose.Schema({
  operator: {
    type: String,
    required: true,
    enum: ['AND', 'OR']
  },
  conditions: [{
    type: mongoose.Schema.Types.Mixed,
    required: true
  }]
}, { _id: false });

const segmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  rules: {
    type: ruleSchema,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

segmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Segment', segmentSchema);
