# Portfolio Backend - Quick Reference

## 🚀 Start Server

```bash
cd backend
npm run dev
```

Server runs on: **http://localhost:5000**

## 🔑 Default Admin Login

- Email: `admin@shitalendra.com` (change in `.env`)
- Password: `ChangeThisPassword123!` (change in `.env`)

## 📡 API Endpoints

### Public
- `POST /api/contact` - Contact form submissions
- `POST /api/analytics/event` - Track analytics

### Admin (requires login)
- `POST /api/admin/login` - Login
- `GET /api/admin/contacts` - Get all messages
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/analytics/summary` - Analytics data

## 📋 Setup Checklist

- [ ] Install Node.js
- [ ] Run `npm install` in backend folder
- [ ] Setup MongoDB Atlas account
- [ ] Copy `.env.example` to `.env`
- [ ] Add MongoDB connection string to `.env`
- [ ] Add Gmail app password to `.env`
- [ ] Run `npm run dev`
- [ ] Test contact form
- [ ] Login to admin dashboard

## 🔧 Environment Variables Required

```env
MONGODB_URI=mongodb+srv://...
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
JWT_SECRET=random-string
```

## 📱 Access Points

- **API**: http://localhost:5000
- **Frontend**: ../index.html
- **Admin Dashboard**: ../admin/index.html

## ⚡ Quick Test

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Hello!"}'
```

## 🐛 Common Issues

**MongoDB Error**: Check connection string in `.env`
**Email Error**: Verify Gmail app password
**Port in use**: Change PORT in `.env`
**CORS Error**: Set FRONTEND_URL=* in `.env`

## 📚 Full Documentation

See `SETUP_GUIDE.md` for complete setup instructions.
