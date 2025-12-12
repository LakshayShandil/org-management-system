import React, { createContext, useContext, useState } from "react";
import { decodeToken } from "../utils/jwt";
import api from "../utils/api";

const AuthContext = createContext({
  auth: null,
  loginWithToken: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      const payload = decodeToken(token);
      if (!payload) {
        localStorage.removeItem("access_token");
        return null;
      }
      // Set token immediately on init
      api.setToken(token);
      return {
        token,
        role: payload?.role,
        admin_email: payload?.admin_email,
        organization_name: payload?.organization_name,
        ...payload,
      };
    } catch (e) {
      console.error("Auth init error:", e);
      return null;
    }
  });

  const loginWithToken = (token) => {
    try {
      const payload = decodeToken(token);
      if (!payload) {
        throw new Error("Failed to decode token payload");
      }
      const ctx = { token, ...payload };
      setAuth(ctx);
      localStorage.setItem("access_token", token);
      api.setToken(token);
    } catch (error) {
      console.error("Token decode error:", error);
      setAuth(null);
      localStorage.removeItem("access_token");
      alert("Invalid token payload: " + error.message);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("access_token");
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);