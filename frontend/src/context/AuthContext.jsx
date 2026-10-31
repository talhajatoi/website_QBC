import { createContext, useEffect, useState } from "react";
import * as auth from "../services/auth.service";
import { tokenExpiration, tokenRenewalBuffer } from "../services/api";
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
  useEffect(() => {
    if (!admin) return undefined;
    let timer;
    let active = true;
    let renewing = false;

    const scheduleRenewal = () => {
      window.clearTimeout(timer);
      const token = sessionStorage.getItem("qb_admin_token");
      const expiration = tokenExpiration(token);
      if (!expiration) return;
      const remaining = expiration * 1000 - Date.now();
      timer = window.setTimeout(renew, Math.max(0, remaining - tokenRenewalBuffer(token)));
    };

    const renew = async () => {
      if (!active || renewing) return;
      const token = sessionStorage.getItem("qb_admin_token");
      const expiration = tokenExpiration(token);
      if (!token || !expiration) return;
      if (expiration * 1000 <= Date.now()) {
        window.dispatchEvent(new Event("qb:auth-expired"));
        return;
      }

      renewing = true;
      try {
        await auth.getProfile();
      } catch (error) {
        if (error.status === 401) return;
        if (active) {
          const remaining = expiration * 1000 - Date.now();
          timer = window.setTimeout(renew, Math.max(1000, Math.min(60_000, remaining / 2)));
        }
        return;
      } finally {
        renewing = false;
      }
      if (active) {
        const renewedToken = sessionStorage.getItem("qb_admin_token");
        if (renewedToken === token) {
          const remaining = expiration * 1000 - Date.now();
          const untilServerRenewal = remaining - 5 * 60 * 1000;
          timer = window.setTimeout(
            renew,
            untilServerRenewal > 0 ? Math.min(60_000, untilServerRenewal) : 30_000,
          );
        } else {
          scheduleRenewal();
        }
      }
    };

    const renewWhenVisible = () => {
      const token = sessionStorage.getItem("qb_admin_token");
      if (tokenExpiration(token) * 1000 - Date.now() <= tokenRenewalBuffer(token)) renew();
    };

    scheduleRenewal();
    document.addEventListener("visibilitychange", renewWhenVisible);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", renewWhenVisible);
    };
  }, [admin]);
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
