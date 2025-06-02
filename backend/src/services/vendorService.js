const axios = require('axios');
const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');

class VendorService {
  constructor() {
    this.baseUrl = process.env.VENDOR_API_URL || 'http://localhost:3001/api/vendor';
  }

  async sendMessage(customer, message, campaignId) {
    try {
      if (!customer || !message || !campaignId) {
        throw new Error('Missing required parameters for sending message');
      }

      const formattedMessage = this.formatMessage(message, customer);

      const isSuccess = Math.random() < 0.9;

      const log = new CommunicationLog({
        customer: customer._id,
        campaign: campaignId,
        message: formattedMessage,
        status: isSuccess ? 'sent' : 'failed',
        sentAt: new Date()
      });
      await log.save();

      if (isSuccess) {
        setTimeout(async () => {
          try {
            const deliveryStatus = Math.random() < 0.8 ? 'delivered' : 'failed';
            log.status = deliveryStatus;
            log.deliveredAt = new Date();
            await log.save();

            await this.updateCampaignStats(campaignId, deliveryStatus);
          } catch (error) {
            console.error('Error updating delivery status:', error);
          }
        }, Math.random() * 4000 + 1000);
      } else {
        await this.updateCampaignStats(campaignId, 'failed');
      }

      return { success: isSuccess, logId: log._id };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  formatMessage(message, customer) {
    let formattedMessage = message;
    const placeholders = {
      '{{name}}': customer.name || 'Customer',
      '{{email}}': customer.email || '',
      '{{phone}}': customer.phone || '',
      '{{discount}}': '10%',
    };

    if (!formattedMessage) {
      formattedMessage = "Hi {{name}}, here's {{discount}} off on your next order!";
    }

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), value);
    });

    return formattedMessage;
  }

  async updateCampaignStats(campaignId, status) {
    try {
      const update = {};
      switch (status) {
        case 'delivered':
          update['stats.delivered'] = 1;
          break;
        case 'failed':
          update['stats.failed'] = 1;
          break;
      }

      await Campaign.findByIdAndUpdate(
        campaignId,
        { $inc: update }
      );
    } catch (error) {
      console.error('Error updating campaign stats:', error);
    }
  }

  async processDeliveryReceipt(receipt) {
    const { messageId, status, metadata } = receipt;
    
    const log = await CommunicationLog.findOne({ messageId });
    if (!log) {
      throw new Error('Message not found');
    }

    log.status = status;
    if (status === 'delivered') {
      log.deliveredAt = new Date();
    }
    if (metadata) {
      log.metadata = metadata;
    }
    
    await log.save();
    return log;
  }

  async processBatchDeliveryReceipts(receipts) {
    const batchId = receipts[0]?.batchId;
    if (!batchId) {
      throw new Error('Batch ID is required');
    }

    const status = receipts[0]?.status;
    const metadata = receipts[0]?.metadata;

    return await CommunicationLog.processBatch(batchId, status, metadata);
  }
}

module.exports = new VendorService(); 