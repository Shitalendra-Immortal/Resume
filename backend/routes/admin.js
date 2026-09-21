const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Contact = require('../models/Contact');
const Analytics = require('../models/Analytics');

// Simple auth middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple admin check (in production, use a database with hashed passwords)
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password (for now using plain text from .env, should be hashed in production)
    const isValid = password === process.env.ADMIN_PASSWORD;

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      expiresIn: 86400 // 24 hours in seconds
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/admin/contacts - Get all contacts
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetch contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/admin/contacts/:id - Get single contact
router.get('/contacts/:id', authenticate, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Mark as read
    if (contact.status === 'unread') {
      contact.status = 'read';
      await contact.save();
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Fetch contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// PATCH /api/admin/contacts/:id - Update contact status
router.patch('/contacts/:id', authenticate, async (req, res) => {
  try {
    const { status, notes, replied } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (replied !== undefined) {
      updates.replied = replied;
      if (replied) updates.repliedAt = new Date();
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/admin/contacts/:id - Delete contact
router.delete('/contacts/:id', authenticate, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      success: true,
      message: 'Contact deleted'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// GET /api/admin/analytics/summary - Get analytics summary
router.get('/analytics/summary', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalViews,
      eventCounts,
      deviceBreakdown,
      browserBreakdown
    ] = await Promise.all([
      Analytics.countDocuments({
        event: 'page_view',
        createdAt: { $gte: startDate }
      }),
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$device', count: { $sum: 1 } } }
      ]),
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$browser', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalViews,
        eventCounts,
        deviceBreakdown,
        browserBreakdown,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/stats - Dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [
      totalContacts,
      unreadContacts,
      todayViews,
      totalViews
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'unread' }),
      Analytics.countDocuments({
        event: 'page_view',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Analytics.countDocuments({ event: 'page_view' })
    ]);

    res.json({
      success: true,
      data: {
        contacts: {
          total: totalContacts,
          unread: unreadContacts
        },
        views: {
          today: todayViews,
          total: totalViews
        }
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
