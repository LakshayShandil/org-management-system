# # Org Management Backend (FastAPI + MongoDB)

A lightweight multi-tenant backend for managing organizations with dynamic collection creation, admin authentication, and JWT-based security.

## Features

- ✅ **Multi-tenant architecture** — Each organization gets its own MongoDB collection
- ✅ **Dynamic org creation** — Automatically generate and sanitize organization collections
- ✅ **Admin authentication** — Secure JWT-based login for org admins
- ✅ **Superadmin dashboard** — Global management of all organizations
- ✅ **Protected routes** — Role-based access control for org admins and superadmins
- ✅ **Rate limiting** — Built-in protection against abuse with slowapi
- ✅ **Backup system** — Automatic backups before collection modifications
- ✅ **CORS enabled** — Ready for frontend integration

---

## Tech Stack

- **Framework**: FastAPI
- **Database**: MongoDB (with Motor async driver)
- **Authentication**: JWT (python-jose) + bcrypt
- **Rate Limiting**: slowapi
- **Server**: Uvicorn
- **Testing**: pytest + pytest-asyncio

---

## Quick Start (Local Development)

### 1. Clone & Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Create `.env` File

```env
# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=org_management

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Superadmin
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=SuperSecret123!

# Environment
TESTING=0
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`

**Health check**: `http://localhost:8000/health`

**API docs**: `http://localhost:8000/docs` (Swagger UI)

---

## Deployment on Render

### Prerequisites
- Render account (render.com)
- GitHub repository with this code
- MongoDB Atlas connection string
- JWT secret key

### 1. Create Web Service on Render

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `org-management-backend`
   - **Environment**: `Python 3.11`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### 2. Set Environment Variables

In Render dashboard, go to **Environment**:

```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=org_management
JWT_SECRET_KEY=your-secure-random-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=SuperSecret123!
TESTING=0
```

### 3. Deploy

- Click **Deploy**
- Wait for build to complete (2-3 minutes)
- Copy the Render URL (e.g., `https://org-management-backend.onrender.com`)

### 4. Verify Deployment

```bash
curl https://org-management-backend.onrender.com/health
# Response: {"status":"ok"}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URL` | ✅ | - | MongoDB connection string |
| `MONGODB_DB_NAME` | ✅ | - | Database name |
| `JWT_SECRET_KEY` | ✅ | - | Secret key for JWT (min 32 chars) |
| `JWT_ALGORITHM` | ❌ | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `1440` | Token expiration in minutes |
| `SUPERADMIN_USERNAME` | ✅ | - | Superadmin username |
| `SUPERADMIN_PASSWORD` | ✅ | - | Superadmin password |
| `TESTING` | ❌ | `0` | Set to `1` to disable rate limiting in tests |

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/org/create` | Create new organization |
| `POST` | `/admin/login` | Login as org admin |
| `POST` | `/super/login` | Login as superadmin |

### Protected Endpoints (Org Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/org/get` | Get organization details |
| `PUT` | `/org/update` | Update organization name or admin email |
| `DELETE` | `/org/delete` | Delete organization |

### Protected Endpoints (Superadmin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/master-list` | List all organizations |
| `PUT` | `/admin/update-org/{org_name}` | Update organization (superadmin) |
| `DELETE` | `/admin/delete-org/{org_name}` | Delete organization (superadmin) |

---

## Project Structure

```
backend/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (not committed)
│
├── app/
│   ├── main.py              # FastAPI app setup & routes
│   ├── core/
│   │   ├── auth.py          # JWT creation & decoding
│   │   ├── config.py        # Settings from environment
│   │   ├── db.py            # MongoDB connection
│   │   └── limiter.py       # Rate limiting setup
│   │
│   ├── routes/
│   │   ├── auth.py          # Auth endpoints
│   │   └── orgs.py          # Organization endpoints
│   │
│   ├── models/              # Pydantic models
│   ├── schemas/             # Request/response schemas
│   └── services/
│       └── backup.py        # Backup functionality
│
├── backups/                 # MongoDB backups (auto-created)
├── tests/                   # Unit & integration tests
└── docs/
    └── postman_collection.json  # API test collection
```

---

## Requirements.txt

All dependencies are listed in `requirements.txt`:

```
fastapi                   # Web framework
uvicorn[standard]         # ASGI server
motor                     # Async MongoDB driver
pydantic-settings         # Environment configuration
python-dotenv             # Load .env files
passlib[bcrypt]           # Password hashing
bcrypt==4.0.1            # Bcrypt library
python-jose               # JWT handling
email-validator           # Email validation
slowapi                   # Rate limiting
pytest                    # Testing framework
pytest-asyncio            # Async testing
httpx                     # HTTP client for tests
mongomock                 # Mock MongoDB for tests
```

Install all with: `pip install -r requirements.txt`

---

## Testing

### Run Tests Locally

```bash
pytest tests/ -v
```

### Run Tests with Coverage

```bash
pytest tests/ --cov=app --cov-report=html
```

Tests use `mongomock` for a in-memory MongoDB replacement, so no external database is needed.

---

## Common Issues

### MongoDB Connection Error

**Error**: `ServerSelectionTimeoutError`

**Solution**: 
- Verify `MONGODB_URL` is correct
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for development, restrict in production)
- Ensure network connection is stable

### JWT Token Expired

**Error**: `Invalid or expired token`

**Solution**: Re-login to get a new token. Adjust `ACCESS_TOKEN_EXPIRE_MINUTES` if needed.

### Rate Limit Exceeded

**Error**: `429 Too Many Requests`

**Solution**: Wait a minute or adjust rate limit in `app/core/limiter.py`

---

## Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiration
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Input sanitization for org names
- ✅ Protected routes with role checking

**For Production**:
- 🔒 Use strong JWT secret (32+ random chars)
- 🔒 Restrict MongoDB IP whitelist
- 🔒 Set `TESTING=0` (always)
- 🔒 Use HTTPS only
- 🔒 Rotate superadmin credentials regularly

---

## Monitoring

### Health Check

```bash
curl https://your-backend-url/health
```

### View Logs

On Render: Go to **Logs** tab in dashboard

On Local: Check terminal output

### Database Backups

Automatic backups are created in `backups/` before org modifications. Store them in a persistent volume for production.

---

## Support

For issues or questions:
1. Check the `.env` file has all required variables
2. Review error logs in Render dashboard
3. Verify MongoDB connection
4. Test locally first before deploying

---

## License

MIT

│   ├── main.py
│   ├── core/
│   │    ├── config.py        # loads env vars
│   │    ├── db.py            # MongoDB connection
│   │    └── auth.py          # JWT utilities
│   │
│   ├── routes/
│   │    ├── orgs.py          # org creation + protected endpoints
│   │    └── auth.py          # login + token validation
│   │
│   └── ...
│
└── docs/
     └── postman_collection.json
```

---

# ## Environment Setup

Create a `.env` inside `backend/`:

```
MONGODB_URI=mongodb+srv://admin:<encoded_pass>@cluster.mongodb.net/?retryWrites=true&w=majority&appName=org-management
MONGODB_NAME=org-management

JWT_SECRET=super_long_random_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200   # 30 days for recruiter demo
```

> **Password must be URL-encoded**
> `@` → `%40`, `#` → `%23`, etc.

---

# ## Installation

### **1. Create virtual environment**

```cmd
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
```

### **2. Install dependencies**

```cmd
pip install -r requirements.txt
```

### **3. Start the server**

```cmd
uvicorn app.main:app --reload
```

Open Swagger UI:
👉 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

# ## MongoDB Architecture

MongoDB contains two kinds of documents:

### 🗂 **1. Master collection**

```
master_organizations
```

Contains metadata:

```json
{
  "organization_name": "srkc",
  "collection_name": "org_srkc",
  "admin_id": "ObjectId",
  "admin_email": "admin@example.com"
}
```

### 🗄 **2. Dynamic organization collections**

Each org gets its own collection:

```
org_<sanitized_org_name>
```

Contains admin users + future org data:

```json
{
  "email": "admin@example.com",
  "password_hash": "...",
  "created_at": "..."
}
```

This mimics multi-tenant SaaS design.

---

# ## Authentication Flow

```
[ Admin Login ]
      |
POST /admin/login
      |
      V
[ JWT issued ]
- admin_id
- organization_name
- expires_in
      |
      V
Client stores token (Postman / frontend)
      |
      V
[ Protected API call ]
Authorization: Bearer <token>
      |
      V
Backend:
- Validates token
- Loads admin + org from DB
- Routes proceed
```

---

# ## Using the Postman Collection

File: `backend/docs/postman_collection.json`

### **Import**

Postman → Import → Choose JSON file.

### **Set Variables**

Collection → Variables:

| KEY          | EXAMPLE VALUE           |
| ------------ | ----------------------- |
| base_url     | `http://127.0.0.1:8000` |
| access_token | *(empty at first)*      |

### **Run Requests in Order**

1️⃣ `Create Org` → returns admin + org setup
2️⃣ `Admin Login` → returns `"access_token"`
3️⃣ Paste token into `access_token` variable
4️⃣ Run protected requests:

* `Get Org`
* `Update Org`
* `Delete Org`

---

# ## API Endpoints Summary

### 🔓 Public

| Method | Endpoint       | Description                         |
| ------ | -------------- | ----------------------------------- |
| POST   | `/org/create`  | Create organization + admin account |
| POST   | `/admin/login` | Login, receive JWT                  |

---

### 🔒 Protected (require `Authorization: Bearer <token>`)

| Method | Endpoint      | Description                      |
| ------ | ------------- | -------------------------------- |
| GET    | `/org/get`    | Fetch organization details       |
| PUT    | `/org/update` | Rename org or update admin email |
| DELETE | `/org/delete` | Delete org & its collection      |

---

# ## Troubleshooting

### ❌ JWT expired too fast

Set longer expiry in `.env`:

```
ACCESS_TOKEN_EXPIRE_MINUTES=43200
```

### ❌ 401 Unauthorized

* Token is expired → re-login
* Token not pasted into Postman variable
* Wrong `Authorization` header format
  Must be:

  ```
  Bearer <token>
  ```

### ❌ Missing env vars (ValidationError)

Start uvicorn **inside backend folder**:

```cmd
cd backend
uvicorn app.main:app --reload
```

---

# ## Future Improvements

* Add refresh tokens
* Add frontend (React + Vite)
* Add CI/CD (GitHub Actions)
* Add unit tests + mongomock
* Deploy to Render/Railway

---

# ## License

This project is for demonstration and interview usage.