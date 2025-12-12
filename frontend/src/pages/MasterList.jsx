import React, { useEffect, useState } from "react";
import api from "../utils/api";

export default function MasterList() {
  const [data, setData] = useState([]);
  const [err, setErr] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ organization_name: "", admin_email: "" });

  // UNIVERSAL SAFE ERROR PARSER
  function extractError(e) {
    const detail = e?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail.map(item => item.msg).join(", ");
    }

    if (typeof detail === "string") return detail;

    return e?.message || "Unknown error";
  }

  async function loadData() {
    try {
      const res = await api.instance.get("/admin/master-list");
      setData(res.data.data || []);
      setErr(null);
    } catch (e) {
      setErr(extractError(e));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(org) {
    if (!confirm(`Delete organization "${org.organization_name}"?`)) return;

    try {
      await api.instance.delete(`/admin/delete-org/${org.organization_name}`);
      alert("Organization deleted successfully!");
      await loadData();
    } catch (e) {
      alert("Error deleting organization: " + extractError(e));
    }
  }

  function startEdit(org) {
    setEditingId(org._id);
    setEditForm({
      organization_name: org.organization_name,
      admin_email: org.admin_email
    });
  }

  async function handleSaveEdit(orgId, oldOrgName) {
    try {
      const updates = {};

      const old = data.find(d => d._id === orgId);

      if (editForm.organization_name !== old?.organization_name) {
        updates.new_organization_name = editForm.organization_name;
      }

      if (editForm.admin_email !== old?.admin_email) {
        updates.new_admin_email = editForm.admin_email;
      }

      if (Object.keys(updates).length === 0) {
        alert("No changes to save.");
        setEditingId(null);
        return;
      }

      await api.instance.put(`/admin/update-org/${oldOrgName}`, updates);
      alert("Organization updated!");
      await loadData();
      setEditingId(null);
    } catch (e) {
      alert("Error updating: " + extractError(e));
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({ organization_name: "", admin_email: "" });
  }

  if (err) {
    return (
      <div
        className="card"
        style={{
          backgroundColor: "#fef2f2",
          color: "#7f1d1d",
          borderColor: "#fecaca",
        }}
      >
        <strong>Error:</strong> {err}
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0" }}>Master Organizations</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Manage all organizations ({data.length} total)
        </p>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
          No organizations found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {data.map((d) =>
            editingId === d._id ? (
              // EDIT MODE
              <div
                key={d._id}
                style={{
                  padding: "20px",
                  border: "2px solid #2563eb",
                  borderRadius: "10px",
                  backgroundColor: "#f0f9ff",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600 }}>Organization</label>
                    <input
                      type="text"
                      value={editForm.organization_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, organization_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: 600 }}>Admin Email</label>
                    <input
                      type="email"
                      value={editForm.admin_email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, admin_email: e.target.value })
                      }
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "end", gap: "10px" }}>
                    <button onClick={handleCancel}>Cancel</button>
                    <button onClick={() => handleSaveEdit(d._id, d.organization_name)}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // NORMAL LIST ITEM
              <div
                key={d._id}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{d.organization_name}</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {d.admin_email} •{" "}
                    <code>{d.collection_name}</code>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => startEdit(d)}>Edit</button>
                  <button onClick={() => handleDelete(d)}>Delete</button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
