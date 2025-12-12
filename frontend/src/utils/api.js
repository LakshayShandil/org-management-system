import axios from "axios";

// FRONTEND → VERCEL PROXY (NO CORS EVER AGAIN)
const API_BASE = "/api/proxy";

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

const api = {
  instance,

  setToken: (token) => {
    if (token)
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete instance.defaults.headers.common["Authorization"];
  },

  superLogin: (payload) => instance.post("/super/login", payload),
  masterList: () => instance.get("/admin/master-list"),
  createOrg: (payload) => instance.post("/org/create", payload),
  loginAdmin: (payload) => instance.post("/admin/login", payload),
  getOrg: () => instance.get("/org/get"),
  updateOrg: (payload) => instance.put("/org/update", payload),
  deleteOrg: () => instance.delete("/org/delete"),
};

export default api;
