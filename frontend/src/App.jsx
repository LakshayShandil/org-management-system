import React, { useState } from "react";
import { Routes, Route, Link, Outlet } from "react-router-dom";
import SuperAdminModal from "./components/SuperAdminModal";
import { useAuth } from "./auth/AuthProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateOrg from "./pages/CreateOrg";
import UpdateOrg from "./pages/UpdateOrg";
import Help from "./pages/Help";
import MasterList from "./pages/MasterList";

function Header() {
  const { auth, logout } = useAuth();
  const [superOpen, setSuperOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold tracking-tight hover:opacity-90">
                Org Manager
              </Link>
            </div>

            {/* Nav - center */}
            <nav className="hidden md:flex space-x-6">
              <Link to="/create-org" className="text-slate-100 hover:text-white">Create Org</Link>
              <Link to="/" className="text-slate-100 hover:text-white">Dashboard</Link>
              <Link to="/help" className="text-slate-100 hover:text-white">Help</Link>
              {/* show Master link if superadmin */}
              {auth?.role === "superadmin" && (
                <Link to="/master-list" className="text-slate-100 hover:text-white">Master</Link>
              )}
            </nav>

            {/* User area */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSuperOpen(true)}
                className="hidden sm:inline-block text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
                title="SuperAdmin demo"
              >
                Admin login
              </button>

              {auth ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{auth.admin_email ?? auth.username}</div>
                    <div className="text-xs text-slate-300">{auth.organization_name ?? auth.role}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="hover:bg-white text-white px-3 py-1 rounded text-sm">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SuperAdmin modal */}
      <SuperAdminModal open={superOpen} onClose={() => setSuperOpen(false)} />

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Header />}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-org" element={<CreateOrg />} />
        <Route path="/update-org" element={<UpdateOrg />} />
        <Route path="/help" element={<Help />} />
        <Route path="/master-list" element={<MasterList />} />
      </Route>
    </Routes>
  );
}
