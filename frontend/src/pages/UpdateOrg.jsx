import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function UpdateOrg() {
  const [org, setOrg] = useState(null);
  const [form, setForm] = useState({ new_organization_name: "", new_admin_email: "" });
  const [msg, setMsg] = useState(null);
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();

  // SAFEST universal error parser
  function extractError(e) {
    let detail = e?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail.map(d => d.msg).join(", ");
    }
    if (typeof detail === "string") {
      return detail;
    }
    return e?.message || "Unknown error";
  }

  // Load org details on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await api.getOrg();
        setOrg(res.data);
        setMsg(null);
      } catch (e) {
        setMsg({
          type: "error",
          text: "Failed to load organization: " + extractError(e)
        });
      }
    }
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      // Require at least one field
      if (!form.new_organization_name && !form.new_admin_email) {
        setMsg({ type: "error", text: "Please fill in at least one field to update" });
        setLoading(false);
        return;
      }

      await api.updateOrg(form);

      setMsg({
        type: "success",
        text: "Organization updated successfully! Redirecting…"
      });

      setTimeout(() => nav("/"), 1500);

    } catch (e) {
      setMsg({
        type: "error",
        text: extractError(e)
      });
    } finally {
      setLoading(false);
    }
  }

  // Not logged in
  if (!auth) {
    return (
      <div className="card">
        <h2>Update Organization</h2>
        <div className="alert error">You must be logged in to update an organization.</div>
      </div>
    );
  }

  // Org still loading
  if (!org) {
    return (
      <div className="card">
        <h2>Update Organization</h2>
        <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
          Loading organization details…
        </div>
      </div>
    );
  }

  return (
    <div className="split">
      <div className="card">
        <h2>Update Organization</h2>
        <p className="muted">
          Rename the organization or change the admin email. Both fields are optional.
        </p>

        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px"
          }}
        >
          <strong>Current Organization:</strong> {org.organization_name}
          <br />
          <strong>Admin Email:</strong> {org.admin_email}
        </div>

        {msg && (
          <div className={msg.type === "error" ? "alert error" : "alert success"}>
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="form">

          <label>New organization name (optional)
            <input
              placeholder="Enter new organization name"
              value={form.new_organization_name}
              onChange={e =>
                setForm({ ...form, new_organization_name: e.target.value })
              }
            />
          </label>

          <label>New admin email (optional)
            <input
              type="email"
              placeholder="Enter new admin email"
              value={form.new_admin_email}
              onChange={e =>
                setForm({ ...form, new_admin_email: e.target.value })
              }
            />
          </label>

          <div className="form-row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update Organization"}
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setForm({ new_organization_name: "", new_admin_email: "" });
                setMsg(null);
              }}
            >
              Clear
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => nav("/")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <aside className="card side">
        <h3>Update Tips</h3>
        <ul>
          <li>Organization names are sanitized (lowercase + underscores)</li>
          <li>Email must be unique across all organizations</li>
          <li>Updating may take a moment (collection migration)</li>
          <li>A backup is created automatically</li>
        </ul>

        <h4 style={{ marginTop: 16 }}>Current Info</h4>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          <strong>Organization:</strong> {org.organization_name}
          <br />
          <strong>Admin:</strong> {org.admin_email}
          <br />
          <strong>Created:</strong> {org.created_at}
        </div>
      </aside>
    </div>
  );
}
