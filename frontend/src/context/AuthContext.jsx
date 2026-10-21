import { createContext, useEffect, useState } from "react";
import * as auth from "../services/auth.service";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const clear = () => {
      sessionStorage.removeItem("qb_admin_token");
      setAdmin(null);
      setLoading(false);
    };
    if (!sessionStorage.getItem("qb_admin_token")) {
      setLoading(false);
      return undefined;
    }
    auth
      .getProfile()
      .then((r) => setAdmin(r.data.admin))
      .catch(clear)
      .finally(() => setLoading(false));
    window.addEventListener("qb:auth-expired", clear);
    return () => window.removeEventListener("qb:auth-expired", clear);
  }, []);
  const signIn = async (credentials) => {
    const response = await auth.login(credentials);
    sessionStorage.setItem("qb_admin_token", response.data.token);
    setAdmin(response.data.admin);
    return response;
  };
  const signOut = async () => {
    try {
      await auth.logout();
    } finally {
      sessionStorage.removeItem("qb_admin_token");
      setAdmin(null);
    }
  };
  const updateProfile = async (data) => {
    const response = await auth.updateProfile(data);
    setAdmin(response.data.admin);
    return response;
  };
  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        signIn,
        signOut,
        updateProfile,
        changePassword: auth.changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
