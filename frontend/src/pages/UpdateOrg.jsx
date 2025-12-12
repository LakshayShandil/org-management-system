import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function UpdateOrg(){
  const [form, setForm] = useState({ new_organization_name: "", new_admin_email: "" });
  const [msg, setMsg] = useState(null);
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await api.updateOrg(form);
      setMsg({ type: "success", text: "Updated successfully." });
      setTimeout(()=> nav("/"), 800);
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.detail || err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Update Organization</h2>
      <p className="muted">You can rename the organization or change the admin email. Both are optional — fill only the fields you want to change.</p>

      {msg && <div className={msg.type === "error" ? "alert error" : "alert success"}>{msg.text}</div>}

      <form onSubmit={submit} className="form">
        <label>New organization name (optional)
          <input placeholder="new_org_name" value={form.new_organization_name} onChange={e=>setForm({...form,new_organization_name:e.target.value})} />
        </label>

        <label>New admin email (optional)
          <input placeholder="newadmin@example.com" value={form.new_admin_email} onChange={e=>setForm({...form,new_admin_email:e.target.value})} />
        </label>

        <div className="form-row">
          <button className="btn" type="submit" disabled={loading}>{loading ? "Updating…" : "Update"}</button>
          <button type="button" className="btn ghost" onClick={()=>{ setForm({ new_organization_name: "", new_admin_email: "" }); setMsg(null); }}>Clear</button>
        </div>
      </form>
    </div>
  );
}
