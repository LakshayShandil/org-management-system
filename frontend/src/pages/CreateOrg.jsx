import React, { useState } from "react";
import api from "../utils/api";

export default function CreateOrg() {
  const [form, setForm] = useState({
    organization_name: "",
    admin_email: "",
    admin_password: ""
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  function extractError(err) {
    // FastAPI validation errors → array of objects
    let detail = err?.response?.data?.detail;

    if (Array.isArray(detail)) {
      // Convert: [{msg:"field required"}] → "field required"
      return detail.map(d => d.msg).join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    // fallback
    return err.message || "Unknown error";
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await api.createOrg(form);
      setMsg({
        type: "success",
        text: `Organization created: ${res.data.organization}`
      });
      setForm({ organization_name: "", admin_email: "", admin_password: "" });
    } catch (err) {
      setMsg({
        type: "error",
        text: extractError(err)
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="split">
      <div className="card">
        <h2>Create Organization</h2>
        <p className="muted">
          Fill name, admin email, and a secure password. Organization names are
          sanitized (letters, numbers, underscores).
        </p>

        {msg && (
          <div className={msg.type === "error" ? "alert error" : "alert success"}>
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="form">
          <label>
            Organization name
            <input
              placeholder="e.g. MyCompany or my_company"
              value={form.organization_name}
              onChange={(e) =>
                setForm({ ...form, organization_name: e.target.value })
              }
              required
            />
          </label>

          <label>
            Admin email
            <input
              type="email"
              placeholder="admin@example.com"
              value={form.admin_email}
              onChange={(e) =>
                setForm({ ...form, admin_email: e.target.value })
              }
              required
            />
          </label>

          <label>
            Admin password
            <input
              type="password"
              placeholder="Choose a secure password"
              value={form.admin_password}
              onChange={(e) =>
                setForm({ ...form, admin_password: e.target.value })
              }
              required
            />
          </label>

          <div className="form-row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Organization"}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setForm({
                  organization_name: "",
                  admin_email: "",
                  admin_password: ""
                });
                setMsg(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <aside className="card side">
        <h3>Quick tips</h3>
        <ul>
          <li>Use a unique admin email for each organization.</li>
          <li>
            Organization name will be normalized (lowercase, spaces → underscore).
          </li>
          <li>
            After creation: go to <strong>Login</strong> to sign in as admin.
          </li>
        </ul>
      </aside>
    </div>
  );
}
