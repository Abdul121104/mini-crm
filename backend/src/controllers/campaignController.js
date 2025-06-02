const Campaign = require('../models/Campaign');
const Segment = require('../models/Segment');
const Customer = require('../models/Customer');
const vendorService = require('../services/vendorService');

class CampaignController {
  async createCampaign(req, res) {
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
  }

  async getCampaigns(req, res) {
    try {
      const campaigns = await Campaign.find()
        .sort({ createdAt: -1 })
        .populate('segment', 'name customerCount')
        .populate('createdBy', 'name email');

      res.json(campaigns);
    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch campaigns',
        error: error.message 
      });
    }
  }

  async getCampaignStats(req, res) {
    try {
      const campaign = await Campaign.findById(req.params.id)
        .populate('segment', 'name customerCount');

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      res.json({
        campaign,
        stats: campaign.stats
      });
    } catch (error) {
      console.error('Get campaign stats error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch campaign stats',
        error: error.message 
      });
    }
  }
}

module.exports = new CampaignController(); 