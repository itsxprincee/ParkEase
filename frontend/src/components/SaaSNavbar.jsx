import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiHome,
  FiCalendar,
  FiTruck,
  FiGrid,
  FiPlusCircle,
  FiCamera,
  FiShield,
  FiUser,
  FiLogOut,
  FiBell,
  FiMenu,
  FiX,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiLayers,
} from "react-icons/fi";
import Badge from "./Badge";
import Modal from "./Modal";
import Button from "./Button";

export default function SaaSNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse stored user", err);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLogoutModalOpen(false);
    navigate("/login", { replace: true });
  };

  const role = user?.role?.toLowerCase() || "customer";
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isCustomer = !isOwner && !isAdmin;

  const getUserName = () => {
    if (!user) return "User";
    return (
      user.name ||
      user.full_name ||
      user.username ||
      user.email?.split("@")[0] ||
      "User"
    );
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Admin Super-User";
    if (isOwner) return "Parking Owner";
    return "Driver / Customer";
  };

  const getRoleBadgeVariant = () => {
    if (isAdmin) return "purple";
    if (isOwner) return "primary";
    return "info";
  };

  const navLinks = [
    ...(isCustomer
      ? [
          {
            name: "Explore & Book",
            path: "/customer/dashboard",
            icon: FiHome,
          },
          {
            name: "My Bookings",
            path: "/customer/my-bookings",
            icon: FiCalendar,
          },
          {
            name: "My Vehicles",
            path: "/customer/my-vehicles",
            icon: FiTruck,
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            name: "Overview",
            path: "/owner",
            icon: FiGrid,
          },
          {
            name: "Add Facility",
            path: "/owner/add-parking",
            icon: FiPlusCircle,
          },
          {
            name: "Scan QR Pass",
            path: "/owner/scan-qr",
            icon: FiCamera,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            name: "Command Center",
            path: "/admin",
            icon: FiShield,
          },
        ]
      : []),
  ];

  const notifications = [
    {
      id: 1,
      title: "Smart System Online",
      desc: "Real-time occupancy & pass sync is active.",
      time: "Just now",
      read: false,
    },
    {
      id: 2,
      title: "Pass Validation Ready",
      desc: "Digital QR passes generate instant verification.",
      time: "10m ago",
      read: true,
    },
  ];

  const brandHome = isAdmin
    ? "/admin"
    : isOwner
    ? "/owner"
    : "/customer/dashboard";

  return (
    <>
      <header className="sticky top-0 z-40 bg-black text-white border-b border-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-18 flex items-center justify-between gap-4">
            {/* BRAND LOGO */}
            <div className="flex items-center gap-3">
              <Link
                to={brandHome}
                className="flex items-center gap-2.5 group focus:outline-none"
              >
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center text-base font-black shadow-sm group-hover:scale-105 transition-transform">
                  <FiMapPin className="w-5 h-5 text-black" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                    Park<span className="font-light text-neutral-400">Ease</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                    {getRoleLabel()}
                  </span>
                </div>
              </Link>
            </div>

            {/* DESKTOP NAVIGATION LINKS */}
            <nav className="hidden md:flex items-center gap-1 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.path ||
                  (link.path !== "/owner" &&
                    location.pathname.startsWith(link.path));

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white text-black shadow-sm"
                        : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* USER & ACTIONS */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* NOTIFICATION BELL */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors relative focus:outline-none"
                  title="Notifications"
                >
                  <FiBell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Activity & Alerts
                      </span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                        Live Sync
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* USER PROFILE DROPDOWN */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 p-1 sm:pl-3 sm:pr-2 sm:py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-800 transition-all focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-extrabold text-xs uppercase shadow-xs">
                    {getUserName().charAt(0)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {getUserName()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium capitalize">
                      {role}
                    </span>
                  </div>
                  <FiChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {getUserName()}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user?.email || "user@parkease.io"}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate(isOwner ? "/owner/profile" : "/profile");
                        }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left"
                      >
                        <FiUser className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profile & Security</span>
                      </button>

                      {isCustomer && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/customer/my-vehicles");
                          }}
                          className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left"
                        >
                          <FiTruck className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Vehicles</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-left font-medium"
                      >
                        <FiLogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <FiX className="w-5 h-5" />
                ) : (
                  <FiMenu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/owner" &&
                  location.pathname.startsWith(link.path));

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(isOwner ? "/owner/profile" : "/profile");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out Confirmation"
        maxWidth="max-w-md"
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiLogOut className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Are you sure you want to log out?
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You will need to sign in again to access your active bookings and
            dashboard.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleLogout}>
              Confirm Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
