import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({
  children,
  ownerOnly = false,
  adminOnly = false,
}) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // =====================================================
  // USER NOT LOGGED IN
  // =====================================================

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

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const role = user?.role;

  // =====================================================
  // ADMIN ONLY ROUTE
  // =====================================================

  if (adminOnly && role !== "admin") {
    if (role === "owner") {
      return (
        <Navigate
          to="/owner"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  // =====================================================
  // OWNER ONLY ROUTE
  // =====================================================

  if (ownerOnly && !["owner", "admin"].includes(role)) {
    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  // =====================================================
  // NORMAL CUSTOMER ROUTES
  // =====================================================

  if (!ownerOnly && !adminOnly) {
    if (role === "owner") {
      return (
        <Navigate
          to="/owner"
          replace
        />
      );
    }

    if (role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }
  }

  // =====================================================
  // ALLOW ACCESS
  // =====================================================

  return children;
}

export default ProtectedRoute;