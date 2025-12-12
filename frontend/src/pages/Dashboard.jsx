import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);
  const { auth, logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    // Superadmins skip org fetch
    if (auth?.role === "superadmin") return;

    async function load() {
      try {
        const res = await api.getOrg();
        setOrg(res.data);
      } catch (e) {
        setError(e?.response?.data?.detail || e.message);
      }
    }

    load();
  }, [auth]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) return;

    try {
      await api.instance.delete("/org/delete");
      logout();
      nav("/login");
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    }
  }

  // ─────────────────────────────────────────────────────────
  // USER NOT LOGGED IN
  if (!auth) {
    return (
      <div className="card">
        <h3>You must log in to view your organization. If new user create organization</h3>
        <div className="form-row" style={{ marginTop: 16 }}>
          <Link to="/login"><button className="btn">Go to Login</button></Link>
          <Link to="/create-org"><button className="btn ghost">Create Organization</button></Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // USER LOGGED IN BUT NO ORG EXISTS YET
  if (error && (error.includes("Organization not found") || error.includes("404"))) {
    return (
      <div className="card">
        <h2>No Organization Found</h2>
        <p className="muted">You are logged in, but no organization is linked to your account yet.</p>

        <Link to="/create-org">
          <button className="btn">Create Organization</button>
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // OTHER ERRORS
  if (error) {
    return (
      <div className="card">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // SUPERADMIN VIEW
  if (auth?.role === "superadmin") {
    return (
      <div className="card">
        <h2>Superadmin Dashboard</h2>
        <p>Welcome, superadmin. Use the <strong>Master</strong> tab to manage all organizations.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // LOADING
  if (!org) {
    return <div className="card">Loading organization data…</div>;
  }

  const isAdmin = auth && auth.admin_email === org.admin_email;

  // ─────────────────────────────────────────────────────────

  return (
    <div className="grid">
      <div className="card">
        <h2>Organization Details</h2>
        <div className="meta-row"><strong>Name:</strong> {org.organization_name}</div>
        <div className="meta-row"><strong>Admin:</strong> {org.admin_email}</div>
        <div className="meta-row"><strong>Created:</strong> {org.created_at}</div>

        <div style={{ marginTop: 16 }}>
          {isAdmin ? (
            <>
              <Link to="/update-org"><button className="btn">Update Organization</button></Link>
              <button className="btn danger" onClick={handleDelete} style={{ marginLeft: 10 }}>Delete Organization</button>
            </>
          ) : (
            <>
              <p className="muted">You are logged in as a non-admin. Admin features are hidden.</p>
              <Link to="/login"><button className="btn">Admin Login</button></Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
