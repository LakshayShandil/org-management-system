import React, { createContext, useContext, useState, useEffect } from "react";
import { decodeToken } from "../utils/jwt";
import api from "../utils/api";

const AuthContext = createContext({
  auth: null,
  loginWithToken: () => {},
  logout: () => {},
});

const STORAGE_KEY = "token";  // <<<<<< STANDARD NAME (IMPORTANT)

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  // Load token on refresh
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    api.setToken(token);

    setAuth({
      token,
      ...payload,
    });
  }, []);

  const loginWithToken = (token) => {
    const payload = decodeToken(token);
    if (!payload) {
      alert("Invalid token received");
      return;
    }

    localStorage.setItem(STORAGE_KEY, token);
    api.setToken(token);

    setAuth({
      token,
      ...payload,
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    api.setToken(null);
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
