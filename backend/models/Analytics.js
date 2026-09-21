const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'project_click',
      'social_click',
      'download_resume',
      'theme_toggle',
      'color_change',
      'sound_toggle',
      'section_view'
    ]
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  page: {
    type: String,
    default: '/'
  },
  referrer: {
    type: String,
    default: null
  },
  ip: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  device: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown'
  },
  browser: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
