# Portfolio Backend API

Backend API for Shitalendra's portfolio website with contact form handling, analytics tracking, and admin dashboard.

## Features

✅ **Contact Form API** - Handle form submissions with validation and email notifications  
✅ **Analytics Tracking** - Track page views, interactions, and user behavior  
✅ **Admin Dashboard API** - Secure endpoints to view messages and analytics  
✅ **Email Notifications** - Get notified when someone fills the contact form  
✅ **Rate Limiting** - Protect against spam and abuse  
✅ **Security** - Helmet, CORS, input validation, JWT authentication

## Tech Stack

- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Nodemailer** - Email notifications
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **Rate Limiter** - DOS protection

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB from https://www.mongodb.com/try/download/community
# Or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your settings
```

**Required configurations:**

```env
# MongoDB (use Atlas URL for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NOTIFY_EMAIL=Shitalendrak@gmail.com

# Admin credentials
ADMIN_EMAIL=admin@yourportfolio.com
ADMIN_PASSWORD=your-secure-password

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### 4. Setup Gmail App Password (for email notifications)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate new app password for "Mail"
5. Copy the 16-character password to `.env` as `EMAIL_PASS`

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Public Endpoints

#### 1. Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "Ravi Sharma",
  "email": "ravi@example.com",
  "message": "Hi, I'd like to discuss an internship opportunity..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thanks Ravi! Your message was sent. I'll get back to you soon.",
  "data": {
    "id": "...",
    "submittedAt": "2026-09-11T09:22:22.209Z"
  }
}
```

#### 2. Analytics Tracking
```http
POST /api/analytics/event
Content-Type: application/json

{
  "event": "page_view",
  "page": "/",
  "sessionId": "unique-session-id",
  "data": {}
}
```

**Available events:**
- `page_view` - Page visit
- `project_click` - Project card clicked
- `social_click` - Social media link clicked
- `download_resume` - Resume downloaded
- `theme_toggle` - Dark/light mode toggled
- `color_change` - Accent color changed
- `sound_toggle` - Ambient sound toggled
- `section_view` - Section scrolled into view

### Admin Endpoints (Protected)

#### 3. Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@yourportfolio.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

#### 4. Get All Contacts
```http
GET /api/admin/contacts?status=unread&page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 5. Get Contact Details
```http
GET /api/admin/contacts/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 6. Update Contact Status
```http
PATCH /api/admin/contacts/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "replied",
  "notes": "Responded via email",
  "replied": true
}
```

#### 7. Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 8. Analytics Summary
```http
GET /api/admin/analytics/summary?days=30
Authorization: Bearer YOUR_JWT_TOKEN
```

## Integrate with Frontend

Update your `script.js` contact form handler:

```javascript
// Replace the existing handleSubmit function with:
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const note = document.getElementById('formNote');
  const btn = form.querySelector('[type="submit"]');
  
  const formData = {
    name: document.getElementById('cname').value.trim(),
    email: document.getElementById('cemail').value.trim(),
    message: document.getElementById('cmessage').value.trim()
  };

  btn.disabled = true;
  btn.textContent = '⏳ Sending…';

  try {
    const response = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      note.style.color = '#10b981';
      note.textContent = result.message;
      form.reset();
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (error) {
    note.style.color = '#ef4444';
    note.textContent = '❌ Oops! Something went wrong. Please email me directly.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-paper-plane"></i> Send Message';
  }
}
```

### Add Analytics Tracking

Add this to your `script.js`:

```javascript
// Analytics helper
const trackEvent = (event, data = {}) => {
  fetch('http://localhost:5000/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      page: window.location.pathname,
      sessionId: sessionStorage.getItem('sessionId') || Math.random().toString(36),
      data
    })
  }).catch(() => {}); // Silent fail
};

// Track page view on load
trackEvent('page_view');

// Track project clicks
document.querySelectorAll('.project-card a').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('project_click', { 
      project: link.closest('.project-card').querySelector('h3').textContent 
    });
  });
});

// Track resume download
document.querySelector('a[download]')?.addEventListener('click', () => {
  trackEvent('download_resume');
});

// Track theme toggle
themeToggle.addEventListener('click', () => {
  trackEvent('theme_toggle', { 
    theme: document.documentElement.getAttribute('data-theme') 
  });
});
```

## Deployment

### Deploy to Render / Railway / Heroku

1. Push your code to GitHub
2. Connect your repository to the platform
3. Set environment variables in the dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all variables from `.env` in your hosting platform's dashboard.

## Security Notes

🔒 **Never commit `.env` to Git**  
🔒 **Use strong JWT_SECRET in production**  
🔒 **Use HTTPS in production**  
🔒 **Set FRONTEND_URL to your actual domain**  
🔒 **Change default admin password**

## Testing the API

### Using curl:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Hello from curl!"}'
```

### Using Postman:

Import the API endpoints and test them with Postman or Thunder Client.

## Troubleshooting

**MongoDB connection error:**
- Check if MongoDB is running locally, or
- Verify MongoDB Atlas connection string is correct

**Email not sending:**
- Verify Gmail app password is correct
- Check if 2FA is enabled on Google account
- Try with a different email provider

**CORS errors:**
- Set `FRONTEND_URL` in `.env` to match your frontend URL
- For local development, use `http://localhost:3000` or `*`

## Next Steps

- [ ] Create an admin dashboard UI
- [ ] Add pagination to contacts list
- [ ] Add search/filter functionality
- [ ] Export contacts to CSV
- [ ] Add reply-from-dashboard feature
- [ ] Set up automated backups

## License

MIT - Feel free to use for your own portfolio!
