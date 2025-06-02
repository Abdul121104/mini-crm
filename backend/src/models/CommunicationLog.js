const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    required: true
  },
  sentAt: {
    type: Date,
    required: true
  },
  deliveredAt: {
    type: Date
  },
  error: {
    code: String,
    message: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

communicationLogSchema.index({ customer: 1, campaign: 1 });
communicationLogSchema.index({ status: 1 });
communicationLogSchema.index({ sentAt: 1 });

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);
