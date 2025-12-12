# Org Management System - Complete Deployment Guide

A multi-tenant organization management system with React frontend and FastAPI backend.

**Live Demo**: 
- Frontend: (Deploy to Vercel/Netlify)
- Backend: (Deploy to Render)

---

## 🚀 Quick Start (Production Deployment)

### Prerequisites
- GitHub account (for code)
- Render account (for backend)
- Vercel or Netlify account (for frontend)
- MongoDB Atlas account (free tier available)

### 1. Backend Deployment (Render)

See: `backend/README.md`

**Summary**:
1. Create Render Web Service
2. Connect GitHub repo
3. Set environment variables:
   - `MONGODB_URL`
   - `MONGODB_DB_NAME`
   - `JWT_SECRET_KEY`
   - `SUPERADMIN_USERNAME`
   - `SUPERADMIN_PASSWORD`
4. Deploy & get URL (e.g., `https://org-management-backend.onrender.com`)

**Verify**: `curl https://your-backend-url/health`

### 2. Frontend Deployment (Vercel)

See: `frontend/README_DEPLOYMENT.md`

**Summary**:
1. Go to vercel.com, import GitHub repo
2. Select `frontend` folder as root
3. Set environment variable:
   - `VITE_API_BASE=https://your-backend-url.onrender.com`
4. Deploy
5. Get frontend URL (e.g., `https://org-management.vercel.app`)

---

## 📋 Project Structure

```
org-management-system/
├── backend/
│   ├── README.md                    # Backend setup & deployment
│   ├── requirements.txt             # Python dependencies
│   ├── app/
│   │   ├── main.py                 # FastAPI app
│   │   ├── routes/
│   │   │   ├── auth.py             # Auth endpoints
│   │   │   └── orgs.py             # Organization endpoints
│   │   └── core/
│   │       ├── auth.py             # JWT logic
│   │       ├── db.py               # MongoDB connection
│   │       └── config.py           # Settings
│   └── tests/                       # Unit tests
│
├── frontend/
│   ├── README_DEPLOYMENT.md        # Frontend deployment guide
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx                 # Main app with routes
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateOrg.jsx
│   │   │   ├── UpdateOrg.jsx
│   │   │   ├── MasterList.jsx      # Superadmin view
│   │   │   └── Help.jsx
│   │   ├── auth/
│   │   │   └── AuthProvider.jsx    # Auth context
│   │   └── utils/
│   │       ├── api.js              # API client
│   │       └── jwt.js              # JWT decoding
│   └── postcss.config.js           # Tailwind config
│
└── README.md                        # This file
```

---

## 🔐 Key Features

### For Organization Admins
- ✅ Create organization with unique email
- ✅ Secure login with JWT
- ✅ View organization details
- ✅ Update organization name/email
- ✅ Delete organization (with backup)

### For Superadmins
- ✅ Master list of all organizations
- ✅ Edit organization details globally
- ✅ Delete organizations with backups
- ✅ View system health

### Security
- ✅ JWT authentication with expiration
- ✅ Bcrypt password hashing
- ✅ Rate limiting on auth endpoints
- ✅ Input sanitization
- ✅ CORS configured
- ✅ Automatic backups

---

## 📡 API Endpoints

### Public
- `POST /org/create` — Create new organization
- `POST /admin/login` — Login as org admin
- `POST /super/login` — Login as superadmin
- `GET /health` — Health check

### Protected (Org Admin)
- `GET /org/get` — Organization details
- `PUT /org/update` — Update organization
- `DELETE /org/delete` — Delete organization

### Protected (Superadmin)
- `GET /admin/master-list` — All organizations
- `PUT /admin/update-org/{name}` — Update any organization
- `DELETE /admin/delete-org/{name}` — Delete any organization

See `docs/postman_collection.json` for detailed API requests.

---

## 🔧 Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env file with MongoDB URL and secrets
echo "MONGODB_URL=mongodb+srv://..." > .env

uvicorn app.main:app --reload
# http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:5174
```

---

## 🧪 Testing

### Backend Unit Tests

```bash
cd backend
pytest tests/ -v
```

### Manual API Testing

Import `backend/docs/postman_collection.json` into Postman.

---

## 🌍 Environment Variables

### Backend (.env or Render)

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true
MONGODB_DB_NAME=org_management
JWT_SECRET_KEY=your-secret-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=SuperSecret123!
TESTING=0
```

### Frontend (Vercel/Netlify)

```env
VITE_API_BASE=https://your-backend.onrender.com
```

---

## 📚 Tech Stack

### Backend
- **FastAPI** — Modern Python web framework
- **Motor** — Async MongoDB driver
- **JWT** — Secure token authentication
- **Bcrypt** — Password hashing
- **Uvicorn** — ASGI server

### Frontend
- **React 19** — UI framework
- **Vite** — Build tool
- **React Router** — Client-side routing
- **Tailwind CSS** — Styling
- **Axios** — HTTP client

### Database
- **MongoDB Atlas** — Managed MongoDB (free tier available)

### Deployment
- **Render** — Backend hosting (free tier available)
- **Vercel/Netlify** — Frontend hosting (free tier available)

---

## 📖 Usage Examples

### Create Organization

```bash
curl -X POST http://localhost:8000/org/create \
  -H "Content-Type: application/json" \
  -d {
    "organization_name": "Acme Corp",
    "admin_email": "admin@acme.com",
    "admin_password": "SecurePass123!"
  }
```

### Login as Admin

```bash
curl -X POST http://localhost:8000/admin/login \
  -H "Content-Type: application/json" \
  -d {
    "email": "admin@acme.com",
    "password": "SecurePass123!"
  }
```

### Get Organization Details

```bash
curl -X GET http://localhost:8000/org/get \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚠️ Important Notes

### Render Free Tier
- ⏱️ Services spin down after 15 min of inactivity
- 🔄 First request after spin-down takes ~30 seconds
- 📈 Upgrade to paid tier for production

### MongoDB Atlas Free Tier
- 💾 512MB storage
- 🌍 Shared cluster
- Sufficient for testing/demo
- Upgrade as you scale

### Environment Variables
- 🔒 Never commit `.env` files
- 🔒 Use platform's secret management
- 🔒 Rotate secrets regularly

---

## 🐛 Troubleshooting

### Frontend can't connect to backend

**Check**:
1. Backend is deployed and running (`/health` endpoint)
2. `VITE_API_BASE` environment variable is set correctly
3. Backend CORS allows your frontend domain
4. Check browser console (F12) for errors

### MongoDB connection fails

**Check**:
1. `MONGODB_URL` is correct
2. IP address is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for development)
3. Network connection is stable

### JWT token expired

**Fix**: User needs to re-login to get a new token

### Rate limit exceeded

**Fix**: Wait 1 minute, or adjust `SLOWAPI_LIMIT` in backend

---

## 📞 Support & Questions

1. **Backend issues**: Check `backend/README.md`
2. **Frontend issues**: Check `frontend/README_DEPLOYMENT.md`
3. **Postman collection**: Use `backend/docs/postman_collection.json` for API testing
4. **Logs**: Check deployment provider's logs (Render, Vercel)

---

## 📋 Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend `/health` endpoint accessible
- [ ] MongoDB Atlas database created and connected
- [ ] All backend environment variables set
- [ ] Frontend environment variable `VITE_API_BASE` points to backend
- [ ] Frontend built with `npm run build`
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Test login with demo credentials
- [ ] Test create organization
- [ ] Test superadmin master list access
- [ ] Verify all endpoints work end-to-end

---

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **MongoDB**: https://docs.mongodb.com/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 📄 License

MIT

---

**Ready to Deploy?** Start with `backend/README.md` for backend deployment, then `frontend/README_DEPLOYMENT.md` for frontend.
