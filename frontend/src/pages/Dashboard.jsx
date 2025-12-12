import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard(){
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);
  const { auth, logout } = useAuth();
  const nav = useNavigate();

  useEffect(()=> {
    // Superadmins don't have an organization, so skip the org fetch
    if (auth?.role === "superadmin") {
      return;
    }

    async function load(){
      try {
        const res = await api.getOrg();
        setOrg(res.data);
      } catch (e) {
        setError(e?.response?.data?.detail || e.message);
      }
    }
    load();
  }, [auth]);

  async function handleDelete(){
    if (!confirm("Delete org? This creates a backup and then permanently deletes the organization. Proceed?")) return;
    try {
      await api.deleteOrg();
      alert("Organization deleted. You will be logged out.");
      logout();
      nav("/create-org");
    } catch(e) {
      alert(e?.response?.data?.detail || e.message);
    }
  }

  if (error) return <div className="card"><strong>Error:</strong> {error}</div>;
  
  // Superadmin doesn't have an org, show superadmin dashboard
  if (auth?.role === "superadmin") {
    return (
      <div className="card">
        <h2>Superadmin Dashboard</h2>
        <p>Welcome, superadmin! You have access to manage all organizations.</p>
        <p>Use the <strong>Master</strong> link in the navigation to view and manage all organizations.</p>
      </div>
    );
  }

  if (!org) return <div className="card">Loading organization data…</div>;

  const isAdmin = auth && auth.admin_email === org.admin_email;

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
              <div className="muted" style={{ marginTop: 8 }}>You are viewing admin controls because you are logged in as the org admin.</div>
            </>
          ) : (
            <div>
              <div className="muted">You are viewing as a non-admin. Admin controls are hidden. To manage this org, log in with the admin email.</div>
              <Link to="/login"><button className="btn" style={{ marginTop: 10 }}>Admin Login</button></Link>
            </div>
          )}
        </div>
      </div>

      <aside className="card side">
        <h3>Quick Steps</h3>
        <ol>
          <li>Create org (Create Org)</li>
          <li>Login as admin (Admin Login)</li>
          <li>Manage (Update / Delete)</li>
        </ol>

        <h4 style={{ marginTop: 10 }}>Notes</h4>
        <ul>
          <li>Delete creates a backup file automatically (server-side).</li>
          <li>Update may take a moment (collection migration).</li>
        </ul>
      </aside>
    </div>
  );
}
