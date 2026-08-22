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
  FiZap,
} from "react-icons/fi";
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
  const [scrolled, setScrolled] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to parse stored user", err);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    return user.name || user.full_name || user.username || user.email?.split("@")[0] || "User";
  };

  const getInitials = () => {
    const name = getUserName();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Admin";
    if (isOwner) return "Owner";
    return "Driver";
  };

  const brandHome = isAdmin ? "/admin" : isOwner ? "/owner" : "/customer/dashboard";

  const navLinks = [
    ...(isCustomer
      ? [
          { name: "Find Parking", path: "/customer/dashboard", icon: FiHome },
          { name: "My Bookings", path: "/customer/my-bookings", icon: FiCalendar },
          { name: "My Vehicles", path: "/customer/my-vehicles", icon: FiTruck },
        ]
      : []),
    ...(isOwner
      ? [
          { name: "Dashboard", path: "/owner", icon: FiGrid },
          { name: "Add Facility", path: "/owner/add-parking", icon: FiPlusCircle },
          { name: "Scan Pass", path: "/owner/scan-qr", icon: FiCamera },
        ]
      : []),
    ...(isAdmin
      ? [{ name: "Command Center", path: "/admin", icon: FiShield }]
      : []),
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? "bg-black/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.3)]"
            : "bg-[#0a0a0a] border-b border-[#1a1a1a]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* BRAND */}
            <Link to={brandHome} className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <FiMapPin className="w-4 h-4 text-[#0a0a0a]" />
              </div>
              <span className="text-lg font-black text-white tracking-tight leading-none">
                Park<span className="text-[#545454] font-light">Ease</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#737373] text-[10px] font-semibold uppercase tracking-widest">
                {getRoleLabel()}
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-0.5 bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a]">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.path ||
                  (link.path !== "/owner" && location.pathname.startsWith(link.path));

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-white text-[#0a0a0a] shadow-sm"
                        : "text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2">

              {/* NOTIFICATION BELL */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  <FiBell className="w-4.5 h-4.5" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#05944f]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.16)] border border-[#e0e0e0] py-2 z-50 animate-slide-down">
                    <div className="px-4 py-2 border-b border-[#f0f0f0] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                        Notifications
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#05944f]" />
                    </div>
                    <div className="divide-y divide-[#f5f5f5]">
                      {[
                        {
                          icon: FiCheckCircle,
                          title: "System Online",
                          desc: "Real-time slot sync is active.",
                          time: "Just now",
                          color: "text-[#05944f]",
                        },
                        {
                          icon: FiZap,
                          title: "QR Validation Ready",
                          desc: "Digital passes generate instantly.",
                          time: "10m ago",
                          color: "text-[#276ef1]",
                        },
                      ].map((n, i) => (
                        <div key={i} className="px-4 py-3 hover:bg-[#f7f7f7] transition-colors">
                          <div className="flex items-start gap-3">
                            <n.icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                            <div>
                              <p className="text-xs font-semibold text-[#0a0a0a]">{n.title}</p>
                              <p className="text-[11px] text-[#737373] mt-0.5">{n.desc}</p>
                              <p className="text-[10px] text-[#a0a0a0] mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* USER AVATAR DROPDOWN */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#276ef1] to-[#05944f] flex items-center justify-center text-white font-black text-xs">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-none">{getUserName()}</p>
                  </div>
                  <FiChevronDown
                    className={`hidden sm:block w-3.5 h-3.5 text-[#545454] transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.16)] border border-[#e0e0e0] py-2 z-50 animate-slide-down">
                    <div className="px-4 py-2.5 border-b border-[#f0f0f0]">
                      <p className="text-xs font-bold text-[#0a0a0a] truncate">{getUserName()}</p>
                      <p className="text-[11px] text-[#737373] truncate mt-0.5">{user?.email || ""}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate(isOwner ? "/owner/profile" : "/profile");
                        }}
                        className="w-full px-4 py-2.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f7f7f7] flex items-center gap-2.5 transition-colors"
                      >
                        <FiUser className="w-3.5 h-3.5 text-[#737373]" />
                        Profile & Settings
                      </button>
                      {isCustomer && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/customer/my-vehicles");
                          }}
                          className="w-full px-4 py-2.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f7f7f7] flex items-center gap-2.5 transition-colors"
                        >
                          <FiTruck className="w-3.5 h-3.5 text-[#737373]" />
                          My Vehicles
                        </button>
                      )}
                    </div>
                    <div className="border-t border-[#f0f0f0] py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-xs font-medium text-[#e11900] hover:bg-[#fef2f2] flex items-center gap-2.5 transition-colors"
                      >
                        <FiLogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0f0f0f] border-t border-[#1a1a1a] px-4 pt-3 pb-6 space-y-1 animate-slide-down">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/owner" && location.pathname.startsWith(link.path));

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-white text-[#0a0a0a]"
                      : "text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-[#1a1a1a] flex items-center gap-2">
              <button
                onClick={() => navigate(isOwner ? "/owner/profile" : "/profile")}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-[#a0a0a0] hover:text-white text-left transition-colors"
              >
                Profile & Settings
              </button>
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="px-4 py-2.5 text-xs font-bold text-[#e11900] hover:bg-[#1a1a1a] rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* LOGOUT MODAL */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto">
            <FiLogOut className="w-6 h-6 text-[#e11900]" />
          </div>
          <div>
            <p className="font-bold text-[#0a0a0a]">Sign out of ParkEase?</p>
            <p className="text-sm text-[#737373] mt-1">
              You'll need to sign in again to access your bookings.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
