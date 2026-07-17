import { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as loginApi, logout as logoutApi } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, senha) {
    const loggedUser = await loginApi(email, senha);
    setUser(loggedUser);
    localStorage.setItem("lastSessionAt", String(Date.now()));
    return loggedUser;
  }

  async function logout() {
    await logoutApi();
    setUser(null);
    localStorage.setItem("lastSessionAt", String(Date.now()));
  }

  async function refreshUser() {
    const refreshed = await getMe();
    setUser(refreshed);
    return refreshed;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
