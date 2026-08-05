import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, ownerOnly = false }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (ownerOnly && user?.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;