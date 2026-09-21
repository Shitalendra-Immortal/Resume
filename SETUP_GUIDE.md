# 🚀 Backend Setup Guide

Complete guide to get your portfolio backend up and running.

## 📋 Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - Choose one option:
  - Option A: MongoDB Atlas (Cloud - Free) ✅ Recommended
  - Option B: Local MongoDB installation

## 🎯 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install all required packages (~30 seconds).

### Step 2: Setup MongoDB Atlas (Free Cloud Database)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Click **"Build a Database"** → Select **"Free" (M0)** tier
4. Choose a cloud provider and region (choose closest to India)
5. Click **"Create Cluster"** (takes 3-5 minutes)
6. Create database user:
   - Click **"Database Access"** in left menu
   - Click **"Add New Database User"**
   - Choose **"Password"** authentication
   - Username: `portfolioadmin`
   - Password: Generate a secure password (save it!)
   - User Privileges: **"Read and write to any database"**
   - Click **"Add User"**
7. Allow network access:
   - Click **"Network Access"** in left menu
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (or add `0.0.0.0/0`)
   - Click **"Confirm"**
8. Get connection string:
   - Click **"Database"** in left menu
   - Click **"Connect"** on your cluster
   - Select **"Connect your application"**
   - Copy the connection string (looks like: `mongodb+srv://portfolioadmin:<password>@cluster0.xxxxx.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add database name at the end: `...mongodb.net/portfolio`

### Step 3: Setup Gmail for Email Notifications

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **"2-Step Verification"** if not already enabled
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select app: **"Mail"**, device: **"Other (Custom name)"** → Type: "Portfolio Backend"
5. Click **"Generate"**
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 4: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` file with your settings:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB - Paste your Atlas connection string here
MONGODB_URI=mongodb+srv://portfolioadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/portfolio

# JWT Secret - Generate a random string (can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=paste_a_long_random_string_here

# Gmail Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
NOTIFY_EMAIL=Shitalendrak@gmail.com

# Frontend URL (change to your actual domain in production)
FRONTEND_URL=*

# Admin Login Credentials
ADMIN_EMAIL=admin@shitalendra.com
ADMIN_PASSWORD=ChangeThisPassword123!
```

### Step 5: Start the Server

```bash
# Development mode (auto-restarts on changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📍 Environment: development
🌐 API URL: http://localhost:5000
```

### Step 6: Test the API

Open your browser and go to:
- [http://localhost:5000](http://localhost:5000) - Should show welcome message
- [http://localhost:5000/api/health](http://localhost:5000/api/health) - Should show `{"status":"OK"}`

### Step 7: Update Frontend API URLs

Open your portfolio's `analytics.js` and `admin/admin-script.js` files.

Find this line:
```javascript
: 'https://your-backend-url.com';
```

For now, keep it as is (will work with localhost). When you deploy to production, change it to your actual backend URL.

### Step 8: Test Contact Form

1. Open your portfolio: `index.html`
2. Scroll to the Contact section
3. Fill out the form and submit
4. You should see: "Thanks [Name]! Your message was sent..."
5. Check your email inbox for the notification!

### Step 9: Access Admin Dashboard

1. Open [http://localhost:3000/admin/](http://localhost:3000/admin/) or open `admin/index.html` directly
2. Login with credentials from your `.env` file:
   - Email: The `ADMIN_EMAIL` you set
   - Password: The `ADMIN_PASSWORD` you set
3. You should see your dashboard with stats!

## 🎉 Success!

Your backend is now running! You can:
- ✅ Receive contact form submissions
- ✅ Get email notifications
- ✅ Track analytics
- ✅ View messages in admin dashboard

---

## 🐛 Troubleshooting

### "MongoDB connection error"

**Solution 1:** Check your connection string
- Make sure you replaced `<password>` with your actual password
- Ensure password doesn't contain special characters (if it does, URL-encode them)
- Add `/portfolio` at the end of the connection string

**Solution 2:** Check network access
- Go to MongoDB Atlas → Network Access
- Make sure `0.0.0.0/0` is added (allows all IPs)

**Solution 3:** Wait a few minutes
- New clusters take 3-5 minutes to activate

### "Email not sending"

**Solution 1:** Verify Gmail app password
- Make sure you copied the full 16-character password
- Remove any spaces from the password in `.env`
- Make sure 2FA is enabled on your Google account

**Solution 2:** Try Gmail account
- Some Gmail accounts require "Less secure app access" to be enabled
- Or use a different email provider (see Alternative Email Providers below)

### "Port 5000 already in use"

**Solution:** Change the port
- Edit `.env` and set `PORT=3001` (or any available port)
- Update frontend API URLs to match

### "CORS Error" in browser console

**Solution:** Update CORS settings
- Make sure `FRONTEND_URL=*` in `.env`
- Or set it to your exact frontend URL: `http://localhost:3000`

### "npm install" fails

**Solution:** Update Node.js
- Make sure you have Node.js v16 or higher
- Run: `node --version` to check
- Download latest from [nodejs.org](https://nodejs.org/)

---

## 📧 Alternative Email Providers

### Using Outlook/Hotmail:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Using Yahoo:
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Using SendGrid (Recommended for production):
1. Sign up at [sendgrid.com](https://sendgrid.com/) (Free: 100 emails/day)
2. Create API key
3. Use these settings:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

---

## 🌐 Deploy to Production

Once everything works locally, deploy your backend to:

### Option 1: Render.com (Free)
1. Push code to GitHub
2. Sign up at [render.com](https://render.com/)
3. New Web Service → Connect repository
4. Set environment variables in dashboard
5. Deploy!

### Option 2: Railway.app (Free)
1. Sign up at [railway.app](https://railway.app/)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Get your deployment URL

### Option 3: Heroku
1. Install Heroku CLI
2. `heroku create your-portfolio-api`
3. `git push heroku main`
4. `heroku config:set KEY=value` for each env var

**After deployment:**
1. Copy your production URL (e.g., `https://your-app.onrender.com`)
2. Update `analytics.js` and `admin/admin-script.js`:
   ```javascript
   const API_URL = window.location.hostname === 'localhost'
     ? 'http://localhost:5000'
     : 'https://your-app.onrender.com'; // Your actual URL
   ```
3. Update `.env` on production:
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://your-portfolio-domain.com
   ```

---

## 📊 Next Steps

- [ ] Test all API endpoints
- [ ] Customize admin dashboard
- [ ] Set up automated backups
- [ ] Add more analytics events
- [ ] Deploy to production
- [ ] Point your domain to the backend
- [ ] Enable HTTPS/SSL

---

## 🆘 Still Having Issues?

1. Check the server logs in the terminal for error messages
2. Open browser DevTools (F12) → Console tab for frontend errors
3. Verify all environment variables are set correctly
4. Make sure MongoDB cluster is active (green status in Atlas)
5. Test API endpoints directly with curl or Postman

**Test contact endpoint:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Hello from curl!"}'
```

Should return:
```json
{"success":true,"message":"Thanks Test User! Your message was sent..."}
```

---

## 📚 Useful Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Check Node.js version
node --version

# Generate random JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test MongoDB connection
node -e "require('mongoose').connect('YOUR_MONGODB_URI').then(() => console.log('✅ Connected')).catch(e => console.log('❌ Error:', e.message))"
```

---

## 🔒 Security Checklist

- [x] JWT_SECRET is a strong random string
- [x] Admin password is strong and unique
- [x] MongoDB user has limited privileges
- [x] .env file is in .gitignore
- [x] Rate limiting is enabled
- [x] Input validation is in place
- [ ] HTTPS is enabled in production
- [ ] CORS is restricted to your domain
- [ ] Regular backups are scheduled

---

Need help? Your backend is ready to rock! 🚀
