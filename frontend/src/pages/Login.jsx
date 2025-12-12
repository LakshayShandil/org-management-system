import React, { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "../utils/jwt";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  // Universal error extractor (same fix as CreateOrg.jsx)
  function extractError(e) {
    let detail = e?.response?.data?.detail;

    if (Array.isArray(detail)) {
      // FastAPI validation errors
      return detail.map(d => d.msg).join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return e.message || "Unknown error";
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.loginAdmin(form);

      const token = res.data.access_token;
      if (!token) throw new Error("No token returned from server");

      // Store token for AuthProvider
      loginWithToken(token);

      // Store token inside axios instance
      api.setToken(token);

      // Debug (safe)
      const payload = decodeToken(token);
      console.log("Decoded JWT payload:", payload);

      // Navigate to dashboard
      nav("/");
    } catch (e) {
      console.error("Login error:", e);
      setErr(extractError(e));   // ← safe rendering
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card">
      <h2>Admin Login</h2>
      <p className="muted">
        Log in with the email you used when creating the organization.
      </p>

      {err && <div className="alert error">{err}</div>}

      <form onSubmit={submit} className="form">
        <label>Email
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>

        <label>Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>

        <div className="form-row">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setForm({ email: "", password: "" });
              setErr(null);
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
