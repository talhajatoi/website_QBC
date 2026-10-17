import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner label="Checking administrator access" />;
  return admin ? (
    children
  ) : (
    <Navigate to="/admin/login" state={{ from: location }} replace />
  );
}
