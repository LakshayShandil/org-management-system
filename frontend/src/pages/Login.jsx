import React, { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "../utils/jwt";   // <--- Make sure this path is correct

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // Call API (through Vercel proxy)
      const res = await api.loginAdmin(form);

      // Extract JWT
      const token = res.data.access_token;

      // Store token in AuthContext
      loginWithToken(token);

      // Store token in axios instance
      api.setToken(token);

      // 🔥 DEBUG: Decode JWT payload and print it
      const payload = decodeToken(token);
      console.log("Decoded JWT:", payload);

      // Go to dashboard
      nav("/");
    } catch (e) {
      console.error("Login error:", e);
      setErr(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card">
      <h2>Admin Login</h2>
      <p className="muted">Log in with the email you used when creating the organization.</p>

      {err && <div className="alert error">{err}</div>}

      <form onSubmit={submit} className="form">
        <label>Email
          <input
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>

        <label>Password
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
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
