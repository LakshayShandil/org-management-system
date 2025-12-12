import React, { useEffect, useState } from "react";
import api from "../utils/api";


export default function MasterList(){
  const [data, setData] = useState([]);
  const [err, setErr] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ organization_name: "", admin_email: "" });

  useEffect(()=>{
    loadData();
  }, []);

  async function loadData(){
    try {
      const res = await api.instance.get("/admin/master-list");
      setData(res.data.data || []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message);
    }
  }

  async function handleDelete(org){
    if (!confirm(`Delete organization "${org.organization_name}"? This will create a backup and then permanently delete the organization.`)) return;
    try {
      await api.instance.delete(`/admin/delete-org/${org.organization_name}`);
      alert("Organization deleted successfully!");
      await loadData();
    } catch (e) {
      alert("Error deleting organization: " + (e?.response?.data?.detail || e.message));
    }
  }

  function startEdit(org){
    setEditingId(org._id);
    setEditForm({
      organization_name: org.organization_name,
      admin_email: org.admin_email
    });
  }

  async function handleSaveEdit(orgId, oldOrgName){
    try {
      const updates = {};
      if (editForm.organization_name !== oldOrgName) {
        updates.new_organization_name = editForm.organization_name;
      }
      if (editForm.admin_email !== data.find(d => d._id === orgId)?.admin_email) {
        updates.new_admin_email = editForm.admin_email;
      }

      if (Object.keys(updates).length === 0) {
        alert("No changes to save");
        setEditingId(null);
        return;
      }

      await api.instance.put(`/admin/update-org/${oldOrgName}`, updates);
      alert("Organization updated successfully!");
      await loadData();
      setEditingId(null);
    } catch (e) {
      alert("Error updating organization: " + (e?.response?.data?.detail || e.message));
    }
  }

  function handleCancel(){
    setEditingId(null);
    setEditForm({ organization_name: "", admin_email: "" });
  }

  if (err) return (
    <div className="card" style={{ backgroundColor: "#fef2f2", color: "#7f1d1d", borderColor: "#fecaca" }}>
      <strong>Error:</strong> {err}
    </div>
  );
  
  return (
    <div className="card">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0" }}>Master Organizations</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>Manage all organizations in the system ({data.length} total)</p>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
          <p>No organizations found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {data.map(d => (
            editingId === d._id ? (
              <div key={d._id} style={{
                padding: "20px",
                border: "2px solid #2563eb",
                borderRadius: "10px",
                backgroundColor: "#f0f9ff"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#111827" }}>
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={editForm.organization_name}
                      onChange={e => setEditForm({...editForm, organization_name: e.target.value})}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        width: "100%",
                        fontSize: "14px",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#111827" }}>
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={editForm.admin_email}
                      onChange={e => setEditForm({...editForm, admin_email: e.target.value})}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        width: "100%",
                        fontSize: "14px",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "7px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f9fafb",
                        color: "#111827",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        transition: "all 0.2s ease"
                      }}
                      onMouseOver={e => e.target.style.backgroundColor = "#f3f4f6"}
                      onMouseOut={e => e.target.style.backgroundColor = "#f9fafb"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(d._id, d.organization_name)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "7px",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                      }}
                      onMouseOver={e => { e.target.backgroundColor = "#1d4ed8"; e.target.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)"; }}
                      onMouseOut={e => { e.target.backgroundColor = "#2563eb"; e.target.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)"; }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={d._id} style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s ease",
                backgroundColor: "white"
              }}
              onMouseOver={e => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseOut={e => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "white";
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "15px", marginBottom: "4px" }}>
                    {d.organization_name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {d.admin_email} • <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>{d.collection_name}</code>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", color: "#9ca3af", minWidth: "140px", textAlign: "right" }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => startEdit(d)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "#f59e0b",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = "#d97706"}
                    onMouseOut={e => e.target.style.backgroundColor = "#f59e0b"}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = "#dc2626"}
                    onMouseOut={e => e.target.style.backgroundColor = "#ef4444"}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
