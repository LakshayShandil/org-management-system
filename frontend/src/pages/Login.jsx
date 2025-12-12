import React, { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.loginAdmin(form);
      const token = res.data.access_token;
      loginWithToken(token);
      api.setToken(token);
      nav("/");
    } catch (e) {
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
          <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        </label>

        <div className="form-row">
          <button className="btn" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          <button type="button" className="btn ghost" onClick={()=>{ setForm({email:"", password:""}); setErr(null); }}>Clear</button>
        </div>
      </form>
    </div>
  );
}
