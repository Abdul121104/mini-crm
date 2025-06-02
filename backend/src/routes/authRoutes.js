const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const userData = encodeURIComponent(JSON.stringify(req.user));
      res.redirect(`${process.env.FRONTEND_URL}?user=${userData}`);
    } catch (error) {
      console.error('Login error:', error);
      res.redirect(`${process.env.FRONTEND_URL}?error=Login failed`);
    }
  }
);

router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'User ID required' });
    }

    const user = await User.findById(userId).select('-__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user info' });
  }
});

module.exports = router; 