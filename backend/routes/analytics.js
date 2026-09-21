const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Analytics = require('../models/Analytics');

// Helper to detect device type from user agent
function detectDevice(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
  return 'desktop';
}

// Helper to detect browser
function detectBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
}

// POST /api/analytics/event - Track analytics event
router.post('/event', [
  body('event')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isIn([
      'page_view',
      'project_click',
      'social_click',
      'download_resume',
      'theme_toggle',
      'color_change',
      'sound_toggle',
      'section_view'
    ]).withMessage('Invalid event type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { event, data, page, sessionId } = req.body;

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer') || req.get('referrer');

    const analyticsEntry = new Analytics({
      event,
      data: data || {},
      page: page || '/',
      referrer,
      ip,
      userAgent,
      sessionId,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent)
    });

    await analyticsEntry.save();

    res.status(201).json({
      success: true,
      message: 'Event tracked'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't send error to client for analytics failures
    res.status(200).json({ success: true });
  }
});

// POST /api/analytics/batch - Track multiple events at once
router.post('/batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Events array is required'
      });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer') || req.get('referrer');

    const analyticsEntries = events.map(e => ({
      event: e.event,
      data: e.data || {},
      page: e.page || '/',
      referrer,
      ip,
      userAgent,
      sessionId: e.sessionId,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent)
    }));

    await Analytics.insertMany(analyticsEntries);

    res.status(201).json({
      success: true,
      message: `${analyticsEntries.length} events tracked`
    });

  } catch (error) {
    console.error('Batch analytics error:', error);
    res.status(200).json({ success: true });
  }
});

module.exports = router;
