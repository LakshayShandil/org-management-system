import React, { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider";

export default function SuperAdminModal({ open, onClose }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState(null);
  const { loginWithToken } = useAuth();

  // Safe error handler (same as all other components)
  function extractError(e) {
    const detail = e?.response?.data?.detail;

    if (Array.isArray(detail)) {
      // FastAPI validation array → join messages
      return detail.map((d) => d.msg).join(", ");
    }

    if (typeof detail === "string") return detail;

    return e?.message || "Login failed";
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);

    try {
      const res = await api.instance.post("/super/login", form);
      const token = res.data.access_token;

      if (!token) throw new Error("No token returned from backend");

      loginWithToken(token);
      onClose();
    } catch (e) {
      setErr(extractError(e)); // always safe
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[420px]">
        <h3 className="text-lg font-semibold mb-2">
          Username: <strong>superadmin</strong> &nbsp;•&nbsp;
          Password: <strong>SuperSecret123!</strong>
        </h3>

        {err && (
          <div className="text-red-600 mb-2">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="off"
          />

          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            placeholder="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1 rounded border"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-1 rounded bg-blue-600 text-white"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
