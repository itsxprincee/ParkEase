import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Invalid user data:", error);
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  const isOwner = user?.role === "owner";
  const isCustomer = user && user?.role !== "owner";

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow-md">

      {/* LOGO */}

      <Link
        to={
          isOwner
            ? "/owner/dashboard"
            : "/customer/dashboard"
        }
        className="text-3xl font-bold hover:text-gray-200 transition"
      >
        🚗 ParkEase
      </Link>


      {/* NAVIGATION */}

      <div className="flex items-center gap-6 text-lg">

        {/* =========================
            CUSTOMER NAVIGATION
        ========================== */}

        {token && isCustomer && (
          <>
            <Link
              to="/customer/dashboard"
              className="hover:text-yellow-300 transition"
            >
              🏠 Home
            </Link>

            <Link
              to="/customer/my-bookings"
              className="hover:text-yellow-300 transition"
            >
              🎫 My Bookings
            </Link>
          </>
        )}


        {/* =========================
            OWNER NAVIGATION
        ========================== */}

        {token && isOwner && (
          <>
            <Link
              to="/owner/dashboard"
              className="hover:text-yellow-300 transition"
            >
              📊 Dashboard
            </Link>

            <Link
              to="/owner/add-parking"
              className="hover:text-yellow-300 transition"
            >
              ➕ Add Parking
            </Link>

            <Link
              to="/owner/scan-qr"
              className="hover:text-yellow-300 transition"
            >
              📷 Scan QR
            </Link>
          </>
        )}


        {/* =========================
            LOGOUT
        ========================== */}

        {token && (
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        )}


        {/* =========================
            NOT LOGGED IN
        ========================== */}

        {!token && (
          <>
            <Link
              to="/login"
              className="hover:text-yellow-300 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition"
            >
              Register
            </Link>
          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;