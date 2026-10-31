import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "https://qbc-backend-3nj4.onrender.com/api"
      : "http://localhost:5000/api"),
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
const tokenClaims = (token) => {
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")),
    );
  } catch {
    return null;
  }
};
export const tokenExpiration = (token) => {
  const expiration = tokenClaims(token)?.exp;
  return Number.isFinite(expiration) ? expiration : 0;
};
export const tokenRenewalBuffer = (token) => {
  const claims = tokenClaims(token);
  const lifetime = claims?.exp - claims?.iat;
  return Number.isFinite(lifetime) && lifetime > 0
    ? Math.min(6 * 60 * 1000, Math.max(30 * 1000, (lifetime * 1000) / 3))
    : 5 * 60 * 1000;
};
const authorizationToken = (headers) => {
  const authorization = headers?.Authorization || headers?.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
};
const saveRenewedAdminToken = (response) => {
  const renewedToken = response.headers?.["x-admin-token"];
  if (!renewedToken) return;
  const currentToken = sessionStorage.getItem("qb_admin_token");
  if (
    currentToken &&
    tokenExpiration(renewedToken) > tokenExpiration(currentToken)
  ) {
    sessionStorage.setItem("qb_admin_token", renewedToken);
  }
};
api.interceptors.request.use((config) => {
  if (authorizationToken(config.headers)) {
    const token = sessionStorage.getItem("qb_admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;
  }
  return config;
});
api.interceptors.response.use(
  (response) => {
    saveRenewedAdminToken(response);
    return response.data;
  },
  (error) => {
    saveRenewedAdminToken(error.response);
    if (axios.isCancel(error))
      return Promise.reject({
        cancelled: true,
        message: "Request cancelled",
        errors: [],
      });
    const status = error.response?.status;
    const errors = error.response?.data?.errors || [];
    const validation = errors
      .map((issue) => issue.message)
      .filter(Boolean)
      .join(" ");
    const message =
      validation ||
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : status
          ? "The request could not be completed."
          : "The store service is unavailable. Please check your connection and try again.");
    const failedToken = authorizationToken(error.config?.headers);
    const currentToken = sessionStorage.getItem("qb_admin_token");
    if (status === 401 && failedToken && currentToken === failedToken)
      window.dispatchEvent(new Event("qb:auth-expired"));
    return Promise.reject({
      status,
      message,
      errors,
      retryable: !status || status >= 500,
    });
  },
);
export const authHeaders = () => {
  const token = sessionStorage.getItem("qb_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
export const healthCheck = () => api.get("/health");
export default api;
