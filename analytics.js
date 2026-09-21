/* ════════════════════════════════════════════════════════
   ANALYTICS TRACKING — sends events to backend API
════════════════════════════════════════════════════════ */

// Generate or retrieve session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('portfolioSessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('portfolioSessionId', sessionId);
  }
  return sessionId;
}

// Analytics helper function
window.trackEvent = (event, data = {}) => {
  // Don't track if user has DNT enabled
  if (navigator.doNotTrack === '1') return;

  const API_URL = (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:')
    ? 'http://localhost:5000'
    : 'https://your-backend-url.com';

  fetch(`${API_URL}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      page: window.location.pathname,
      sessionId: getSessionId(),
      data
    })
  }).catch(() => {}); // Silent fail for analytics
};

// Track page view on load
window.addEventListener('load', () => {
  trackEvent('page_view');
});

// Track project clicks
document.addEventListener('DOMContentLoaded', () => {
  // Project card clicks
  document.querySelectorAll('.project-card a').forEach(link => {
    link.addEventListener('click', () => {
      const projectName = link.closest('.project-card').querySelector('h3')?.textContent;
      trackEvent('project_click', { project: projectName });
    });
  });

  // Social media clicks
  document.querySelectorAll('.hero-socials a, .social-btn').forEach(link => {
    link.addEventListener('click', () => {
      const platform = link.getAttribute('aria-label') || 'social';
      trackEvent('social_click', { platform });
    });
  });

  // Resume download
  document.querySelector('a[download]')?.addEventListener('click', () => {
    trackEvent('download_resume');
  });

  // Section views (using IntersectionObserver)
  const sections = document.querySelectorAll('section[id]');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trackEvent('section_view', { section: entry.target.id });
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  sections.forEach(section => sectionObserver.observe(section));
});

// Export for use in main script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { trackEvent };
}
