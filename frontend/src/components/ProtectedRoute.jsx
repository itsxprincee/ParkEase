import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({
  children,
  ownerOnly = false,
  adminOnly = false,
}) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  let user;

  try {
    user = JSON.parse(userData);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  const role = user?.role;

  // ADMIN
  if (adminOnly && role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // OWNER
  if (ownerOnly && !["owner", "admin"].includes(role)) {
    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  // CUSTOMER
  if (!ownerOnly && !adminOnly && role === "owner") {
    return (
      <Navigate
        to="/owner/dashboard"
        replace
      />
    );
  }

  // CUSTOMER trying admin
  if (!adminOnly && role === "admin") {
    return (
      <Navigate
        to="/admin/verification"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;