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
const tokenExpiration = (token) => {
  const payload = token?.split(".")[1];
  if (!payload) return 0;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")),
    );
    return Number.isFinite(decoded.exp) ? decoded.exp : 0;
  } catch {
    return 0;
  }
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
    if (status === 401 && sessionStorage.getItem("qb_admin_token"))
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
