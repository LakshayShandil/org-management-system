# Organization Management System

   

A complete full-stack multi-tenant system for managing organizations. This project implements a dynamic architecture where every organization gets its own isolated MongoDB collection, managed by a central master database.

It goes beyond the basic requirements by including a **modern React frontend**, a **Superadmin dashboard**, **automatic backups**, and a **serverless API proxy** to handle CORS in production.

-----

## 🚀 Live Demo

  - **Frontend:** [https://your-frontend.vercel.app](https://www.google.com/search?q=https://your-frontend.vercel.app) *(Replace with your actual link)*
  - **Backend:** [https://your-backend.onrender.com](https://your-backend.onrender.com) *(Replace with your actual link)*
  - **API Docs (Swagger):** [https://your-backend.onrender.com/docs](https://www.google.com/search?q=https://your-backend.onrender.com/docs)

-----

## 🏗️ Architecture

The system uses a **Serverless Proxy** pattern to ensure secure and CORS-free communication between the frontend and backend.

```mermaid
graph TD
    User[User / Admin] --> |HTTPS| Frontend[React Frontend (Vercel)]
    Frontend --> |/api/proxy/*| Proxy[Serverless Proxy (Vercel Edge)]
    Proxy --> |Forward Request| Backend[FastAPI Backend (Render)]
    Backend --> |Read/Write| DB[(MongoDB Atlas)]
    
    subgraph Database Architecture
    DB --> Master[Master DB (Metadata)]
    DB --> Org1[Collection: org_acme]
    DB --> Org2[Collection: org_beta]
    end
```

### Key Design Choices

1.  **Multi-Tenancy:** Each organization has a dedicated collection (`org_<name>`) for data isolation.
2.  **Master Metadata:** A `master_organizations` collection tracks all orgs and their admin credentials.
3.  **Dynamic Migration:** Renaming an organization automatically migrates its entire collection to a new name and drops the old one.
4.  **Safety First:** Deleting an organization triggers an automatic JSON backup before data destruction.

-----

## ✨ Features

### Backend (FastAPI)

  - **Dynamic Collection Management:** Creates and drops collections on the fly.
  - **JWT Authentication:** Secure login for Org Admins and Superadmins.
  - **Role-Based Access:** - **Org Admin:** Manage own organization (Update/Delete).
      - **Superadmin:** View/Edit/Delete ALL organizations.
  - **Rate Limiting:** Protects auth endpoints against brute-force attacks.
  - **Auto-Backups:** JSON dumps are created before any destructive action.

### Frontend (React + Vite)

  - **Dashboard:** Metadata view for organizations.
  - **Admin Tools:** Update org name/email, delete org.
  - **Superadmin Panel:** A master list to manage the entire system.
  - **Auth Persistence:** JWT handling with automatic decoding.
  - **Responsive UI:** Built with Tailwind CSS.

-----

## 🛠️ Tech Stack

  - **Frontend:** React 19, Vite, Tailwind CSS, Axios, React Router v7.
  - **Backend:** FastAPI, Uvicorn, Motor (Async MongoDB), Pydantic.
  - **Database:** MongoDB Atlas (Cloud).
  - **Security:** Bcrypt (hashing), PyJWT (tokens), SlowAPI (rate limiting).
  - **Deployment:** Vercel (Frontend + Proxy), Render (Backend).

-----

## ⚡ Local Setup Guide

Follow these steps to run the full stack locally.

### Prerequisites

  - Python 3.11+
  - Node.js 18+
  - A MongoDB Atlas connection string (or local MongoDB).

### 1\. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "MONGODB_URI=your_mongodb_connection_string" > .env
echo "MONGODB_NAME=org_management" >> .env
echo "JWT_SECRET=super_secret_key" >> .env

# Run the server
uvicorn app.main:app --reload
```

*Backend runs at: `http://127.0.0.1:8000`*

### 2\. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

*Frontend runs at: `http://localhost:5173`*

-----

## 📮 API Testing (Postman)

We have provided a complete Postman collection to test the API directly.

### Option 1: Import from File

You can find the collection file in this repository:
📂 `backend/docs/postman_collection.json`

1.  Open Postman.
2.  Click **Import**.
3.  Drag and drop the `postman_collection.json` file.
4.  **Important:** Create a collection variable named `access_token` in Postman to store your JWT after login.

### Option 2: Public Link

[**Click here to view the Postman Collection**](https://www.google.com/search?q=YOUR_POSTMAN_PUBLIC_LINK_HERE)

### Demo Credentials

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Superadmin** | `superadmin` | `SuperSecret123!` |
| **Org Admin** | *(Created during "Create Org")* | *(User defined)* |

-----

## 📚 API Endpoints Summary

### Public

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/org/create` | Register a new organization & admin. |
| `POST` | `/admin/login` | Login as an Organization Admin. |
| `POST` | `/super/login` | Login as Superadmin. |
| `GET` | `/health` | Server health check. |

### Protected (Org Admin)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/org/get` | Get details of your organization. |
| `PUT` | `/org/update` | Rename org or change admin email. |
| `DELETE` | `/org/delete` | Delete your organization (Backup created). |

### Protected (Superadmin)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/master-list` | View all organizations. |
| `PUT` | `/admin/update-org/{name}` | Force update any organization. |
| `DELETE` | `/admin/delete-org/{name}` | Force delete any organization. |

-----

## 🔒 Security Notes

  - **CORS:** In production, the backend allows requests only from the Vercel proxy, preventing direct unauthorized browser access.
  - **Passwords:** All admin passwords are salted and hashed using `bcrypt`.
  - **Validation:** Input sanitization prevents MongoDB injection attacks.

-----

## 📄 License

This project is open-source and available under the MIT License.
