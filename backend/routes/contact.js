const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendEmailNotification } = require('../utils/email');

// POST /api/contact - Submit contact form
router.post('/', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
    .isLength({ max: 2000 }).withMessage('Message too long')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, message } = req.body;

    // Get client info
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create contact entry
    const contact = new Contact({
      name,
      email,
      message,
      ip,
      userAgent
    });

    await contact.save();

    // Send email notification (don't wait for it)
    sendEmailNotification({
      name,
      email,
      message,
      submittedAt: contact.createdAt
    }).catch(err => console.error('Email notification error:', err));

    res.status(201).json({
      success: true,
      message: `Thanks ${name}! Your message was sent. I'll get back to you soon.`,
      data: {
        id: contact._id,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or email me directly.'
    });
  }
});

module.exports = router;
