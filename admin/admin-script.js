// API Configuration
const API_URL = localStorage.getItem('API_URL') ||
  ((window.location.hostname === 'localhost' || window.location.protocol === 'file:')
    ? 'http://localhost:5000'
    : 'https://your-backend-url.com'); // Change this in production

console.log('Admin Panel - Using API URL:', API_URL);

let authToken = localStorage.getItem('adminToken');
let currentContactId = null;

// ========== AUTH HELPERS ==========
function isAuthenticated() {
  return !!authToken;
}

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('adminToken', token);
}

function clearAuth() {
  authToken = null;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminEmail');
}

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      clearAuth();
      showLogin();
      throw new Error('Authentication required');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// ========== LOGIN ==========
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    loginError.textContent = '';
    const result = await apiCall('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setAuthToken(result.token);
    localStorage.setItem('adminEmail', email);
    showDashboard();
  } catch (error) {
    loginError.textContent = error.message || 'Login failed. Please try again.';
  }
});

function showLogin() {
  loginScreen.style.display = 'flex';
  dashboard.style.display = 'none';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';
  document.getElementById('userEmail').textContent = localStorage.getItem('adminEmail') || '';
  loadOverview();
}

// ========== LOGOUT ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
  clearAuth();
  showLogin();
});

// ========== NAVIGATION ==========
const navItems = document.querySelectorAll('.nav-item');
const sections = {
  overview: document.getElementById('overviewSection'),
  contacts: document.getElementById('contactsSection'),
  analytics: document.getElementById('analyticsSection')
};

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;

    // Update active nav
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    // Show section
    Object.values(sections).forEach(s => s.style.display = 'none');
    sections[section].style.display = 'block';

    // Update title
    document.getElementById('pageTitle').textContent =
      item.textContent.replace(/\d+/g, '').trim();

    // Load section data
    if (section === 'overview') loadOverview();
    if (section === 'contacts') loadContacts();
    if (section === 'analytics') loadAnalytics();
  });
});

// ========== OVERVIEW ==========
async function loadOverview() {
  try {
    const stats = await apiCall('/api/admin/stats');

    document.getElementById('todayViews').textContent = stats.data.views.today;
    document.getElementById('totalViews').textContent = stats.data.views.total;
    document.getElementById('unreadCount').textContent = stats.data.contacts.unread;
    document.getElementById('totalContacts').textContent = stats.data.contacts.total;
    document.getElementById('unreadBadge').textContent = stats.data.contacts.unread;

    // Load recent contacts for activity
    const contacts = await apiCall('/api/admin/contacts?limit=5');
    displayRecentActivity(contacts.data);

  } catch (error) {
    console.error('Failed to load overview:', error);
  }
}

function displayRecentActivity(contacts) {
  const container = document.getElementById('recentActivity');

  if (contacts.length === 0) {
    container.innerHTML = '<p style="color: var(--text-dim); text-align: center;">No recent activity</p>';
    return;
  }

  container.innerHTML = contacts.map(contact => `
    <div class="activity-item">
      <span><strong>${contact.name}</strong> sent a message</span>
      <span>${formatDate(contact.createdAt)}</span>
    </div>
  `).join('');
}

// ========== CONTACTS ==========
let currentStatusFilter = '';

document.getElementById('statusFilter').addEventListener('change', (e) => {
  currentStatusFilter = e.target.value;
  loadContacts();
});

async function loadContacts() {
  const loader = document.getElementById('contactsLoader');
  const container = document.getElementById('contactsList');

  try {
    loader.style.display = 'block';
    container.innerHTML = '';

    const query = currentStatusFilter ? `?status=${currentStatusFilter}` : '';
    const result = await apiCall(`/api/admin/contacts${query}`);

    loader.style.display = 'none';

    if (result.data.length === 0) {
      container.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 40px;">No messages found</p>';
      return;
    }

    container.innerHTML = result.data.map(contact => `
      <div class="contact-card ${contact.status}" onclick="viewContact('${contact._id}')">
        <div class="contact-header">
          <div>
            <div class="contact-name">${contact.name}</div>
            <div class="contact-email">${contact.email}</div>
          </div>
          <span class="contact-status status-${contact.status}">${contact.status}</span>
        </div>
        <div class="contact-message">${contact.message}</div>
        <div class="contact-footer">
          <i class="far fa-clock"></i> ${formatDate(contact.createdAt)}
        </div>
      </div>
    `).join('');

  } catch (error) {
    loader.style.display = 'none';
    container.innerHTML = '<p style="color: var(--danger); text-align: center;">Failed to load contacts</p>';
  }
}

async function viewContact(id) {
  try {
    currentContactId = id;
    const result = await apiCall(`/api/admin/contacts/${id}`);
    const contact = result.data;

    document.getElementById('modalBody').innerHTML = `
      <div class="detail-group">
        <div class="detail-label">Name</div>
        <div class="detail-value">${contact.name}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Email</div>
        <div class="detail-value"><a href="mailto:${contact.email}" style="color: var(--primary)">${contact.email}</a></div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Message</div>
        <div class="detail-value" style="white-space: pre-wrap; line-height: 1.8;">${contact.message}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Submitted</div>
        <div class="detail-value">${new Date(contact.createdAt).toLocaleString()}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="contact-status status-${contact.status}">${contact.status}</span>
        </div>
      </div>
      ${contact.notes ? `
        <div class="detail-group">
          <div class="detail-label">Notes</div>
          <div class="detail-value">${contact.notes}</div>
        </div>
      ` : ''}
    `;

    document.getElementById('contactModal').classList.add('active');

  } catch (error) {
    alert('Failed to load contact details');
  }
}

function closeContactModal() {
  document.getElementById('contactModal').classList.remove('active');
  currentContactId = null;
}

async function markAsReplied() {
  if (!currentContactId) return;

  try {
    await apiCall(`/api/admin/contacts/${currentContactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'replied', replied: true })
    });

    closeContactModal();
    loadContacts();
    loadOverview();
  } catch (error) {
    alert('Failed to update contact');
  }
}

async function deleteContact() {
  if (!currentContactId) return;

  if (!confirm('Are you sure you want to delete this message?')) return;

  try {
    await apiCall(`/api/admin/contacts/${currentContactId}`, {
      method: 'DELETE'
    });

    closeContactModal();
    loadContacts();
    loadOverview();
  } catch (error) {
    alert('Failed to delete contact');
  }
}

// Close modal on outside click
document.getElementById('contactModal').addEventListener('click', (e) => {
  if (e.target.id === 'contactModal') {
    closeContactModal();
  }
});

// ========== ANALYTICS ==========
let analyticsDays = 30;

document.getElementById('analyticsRange').addEventListener('change', (e) => {
  analyticsDays = parseInt(e.target.value);
  loadAnalytics();
});

async function loadAnalytics() {
  try {
    const result = await apiCall(`/api/admin/analytics/summary?days=${analyticsDays}`);
    const data = result.data;

    // Display events
    const eventsList = document.getElementById('eventsList');
    if (data.eventCounts.length === 0) {
      eventsList.innerHTML = '<p style="color: var(--text-dim);">No events recorded</p>';
    } else {
      eventsList.innerHTML = data.eventCounts.map(event => `
        <div class="list-item">
          <span>${event._id.replace(/_/g, ' ')}</span>
          <span>${event.count}</span>
        </div>
      `).join('');
    }

    // Display devices
    const devicesList = document.getElementById('devicesList');
    if (data.deviceBreakdown.length === 0) {
      devicesList.innerHTML = '<p style="color: var(--text-dim);">No data</p>';
    } else {
      devicesList.innerHTML = data.deviceBreakdown.map(device => `
        <div class="list-item">
          <span>${device._id || 'unknown'}</span>
          <span>${device.count}</span>
        </div>
      `).join('');
    }

    // Display browsers
    const browsersList = document.getElementById('browsersList');
    if (data.browserBreakdown.length === 0) {
      browsersList.innerHTML = '<p style="color: var(--text-dim);">No data</p>';
    } else {
      browsersList.innerHTML = data.browserBreakdown.map(browser => `
        <div class="list-item">
          <span>${browser._id || 'unknown'}</span>
          <span>${browser.count}</span>
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

// ========== HELPERS ==========
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// ========== INIT ==========
if (isAuthenticated()) {
  showDashboard();
} else {
  showLogin();
}
