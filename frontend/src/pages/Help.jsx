import React from "react";
import { Link } from "react-router-dom";

export default function Help(){
  return (
    <div className="card">
      <h2>Quick Start Guide</h2>
      <p>This guide walks a recruiter or admin through the app in three simple steps.</p>

      <ol>
        <li>
          <strong>Create the Organization</strong>
          <div className="muted">Go to <Link to="/create-org">Create Org</Link>. Fill organization name, admin email and password. This registers the org and creates an admin account.</div>
        </li>

        <li>
          <strong>Login as Admin</strong>
          <div className="muted">Go to <Link to="/login">Login</Link>. Use the email and password you entered during Create. On success you'll be returned to the Dashboard with admin controls.</div>
        </li>

        <li>
          <strong>Manage the Org</strong>
          <div className="muted">On the <Link to="/">Dashboard</Link> you will see metadata. If you are the admin, the page shows buttons to <em>Update</em> (rename or change admin email) and <em>Delete</em> (destructive — creates a backup first).</div>
        </li>
      </ol>

      <h3>Admin vs Viewer</h3>
      <p className="muted">Only the authenticated admin (the email used when creating the org) will see Update/Delete controls. Other visitors will see read-only data and a prompt to login.</p>

      <h3>Security Notes</h3>
      <ul>
        <li>JWT is stored in localStorage for demo purposes.</li>
        <li>In production, use httpOnly cookies and HTTPS.</li>
        <li>Delete is irreversible — backups are created automatically before deletion.</li>
      </ul>
    </div>
  );
}
