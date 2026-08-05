import { Link } from "react-router-dom";
import {
  FaHome,
  FaParking,
  FaPlusCircle,
  FaChartBar,
  FaSignOutAlt
} from "react-icons/fa";

function Sidebar() {

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="w-64 h-screen bg-slate-900 text-white fixed">

      <h1 className="text-3xl font-bold text-center py-6">
        ParkEase
      </h1>

      <nav className="flex flex-col gap-2 px-4">

        <Link
          to="/owner"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700"
        >
          <FaHome />
          Dashboard
        </Link>

        <Link
          to="/add-parking"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700"
        >
          <FaPlusCircle />
          Add Parking
        </Link>

        <Link
          to="/my-bookings"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700"
        >
          <FaParking />
          Bookings
        </Link>

        <button
          onClick={logout}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 text-left"
        >
          <FaSignOutAlt />
          Logout
        </button>

      </nav>

    </div>
  );
}

export default Sidebar;