import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiTruck,
  FiGrid,
  FiLogOut,
  FiChevronRight,
  FiHome,
} from "react-icons/fi";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }
  }, []);

  const getUserName = () => {
    if (!user) return "Customer";

    return (
      user.name ||
      user.full_name ||
      user.username ||
      user.email?.split("@")[0] ||
      "Customer"
    );
  };

  const getInitial = () => {
    return getUserName().charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const actions = [
    {
      title: "Find Parking",
      description: "Explore available parking spaces",
      icon: <FiMapPin />,
      action: () => navigate("/customer/dashboard"),
    },
    {
      title: "My Bookings",
      description: "View and manage your reservations",
      icon: <FiCalendar />,
      action: () => navigate("/customer/my-bookings"),
    },
    {
      title: "My Vehicles",
      description: "Add and manage your vehicles",
      icon: <FiTruck />,
      action: () => navigate("/customer/my-vehicles"),
    },
    {
      title: "Parking QR",
      description: "Access your active parking QR code",
      icon: <FiGrid />,
      action: () => navigate("/customer/qr"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <button
            onClick={() => navigate("/customer/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FiMapPin size={20} />
            </div>

            <div className="text-left">
              <h1 className="text-xl font-bold text-slate-900">
                ParkEase
              </h1>

              <p className="text-xs text-slate-500">
                Smart Parking
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/customer/dashboard")}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition"
          >
            <FiHome />
            Dashboard
          </button>

        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* PROFILE HEADER */}

        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
              {getInitial()}
            </div>

            <div className="flex-1">

              <p className="text-sm text-slate-500 mb-1">
                CUSTOMER PROFILE
              </p>

              <h2 className="text-3xl font-bold text-slate-900">
                {getUserName()}
              </h2>

              <div className="flex items-center gap-2 text-slate-500 mt-3">
                <FiMail />

                <span>
                  {user?.email || "Email not available"}
                </span>
              </div>

            </div>

            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
              Active Account
            </div>

          </div>

        </section>

        {/* ACCOUNT INFORMATION */}

        <section className="mt-8">

          <div className="mb-5">
            <p className="text-sm font-semibold tracking-wide text-blue-600">
              ACCOUNT
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Account Information
            </h2>

            <p className="text-slate-500 mt-1">
              Your ParkEase account details.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

            <div className="p-5 flex items-center gap-4 border-b border-slate-100">

              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FiUser size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Full Name
                </p>

                <p className="font-semibold text-slate-900">
                  {getUserName()}
                </p>
              </div>

            </div>

            <div className="p-5 flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FiMail size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Email Address
                </p>

                <p className="font-semibold text-slate-900">
                  {user?.email || "Not available"}
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* QUICK ACCESS */}

        <section className="mt-10">

          <div className="mb-5">

            <p className="text-sm font-semibold tracking-wide text-blue-600">
              QUICK ACCESS
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Manage Your ParkEase
            </h2>

            <p className="text-slate-500 mt-1">
              Quickly access your parking services.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {actions.map((item) => (

              <button
                key={item.title}
                onClick={item.action}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 text-left hover:border-blue-400 hover:shadow-md transition group"
              >

                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition">
                  {item.icon}
                </div>

                <div className="flex-1">

                  <h3 className="font-bold text-lg text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {item.description}
                  </p>

                </div>

                <FiChevronRight className="text-slate-400 group-hover:text-blue-600 transition" />

              </button>

            ))}

          </div>

        </section>

        {/* LOGOUT */}

        <section className="mt-10 pb-10">

          <button
            onClick={handleLogout}
            className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl p-5 flex items-center justify-between transition"
          >

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <FiLogOut size={21} />
              </div>

              <div className="text-left">

                <h3 className="font-bold">
                  Logout
                </h3>

                <p className="text-sm text-red-400">
                  Sign out securely from your ParkEase account
                </p>

              </div>

            </div>

            <FiChevronRight />

          </button>

        </section>

      </main>

    </div>
  );
};

export default Profile;