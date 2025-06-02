const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  segment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Segment',
    required: true
  },
  message: {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    template: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed', 'failed'],
    default: 'draft'
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    timezone: String
  },
  stats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
