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
  FiMoon,
  FiSun,
  FiGlobe,
  FiSliders,
  FiActivity,
  FiCpu,
} from "react-icons/fi";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import Modal from "./Modal";
import Button from "./Button";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function SaaSNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme, resolvedTheme } = useTheme();

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
    if (isOwner) return "Parking Owner";
    return "Driver";
  };

  const brandHome = isAdmin ? "/admin" : isOwner ? "/owner" : "/customer/dashboard";

  const navLinks = [
    ...(isCustomer
      ? [
          { name: t("findParking", "Find Parking"), path: "/customer/dashboard", icon: FiHome },
          { name: t("myBookings", "My Bookings"), path: "/customer/my-bookings", icon: FiCalendar },
          { name: t("subscriptions", "Subscriptions"), path: "/customer/subscriptions", icon: FiZap },
          { name: t("myVehicles", "My Vehicles"), path: "/customer/my-vehicles", icon: FiTruck },
        ]
      : []),
    ...(isOwner
      ? [
          { name: t("dashboard", "Dashboard"), path: "/owner", icon: FiGrid },
          { name: t("addFacility", "Add Parking"), path: "/owner/add-parking", icon: FiPlusCircle },
          { name: t("scanPass", "Scan QR"), path: "/owner/scan-qr", icon: FiCamera },
        ]
      : []),
    ...(isAdmin
      ? [{ name: t("commandCenter", "Approvals"), path: "/admin", icon: FiShield }]
      : []),
  ];

  // Mobile Bottom Dock Links
  const mobileDockLinks = isCustomer
    ? [
        { name: "Explore", path: "/customer/dashboard", icon: FiHome },
        { name: "Bookings", path: "/customer/my-bookings", icon: FiCalendar },
        { name: "Passes", path: "/customer/subscriptions", icon: FiZap },
        { name: "Vehicles", path: "/customer/my-vehicles", icon: FiTruck },
        { name: "Profile", path: "/customer/profile", icon: FiUser },
      ]
    : isOwner
    ? [
        { name: "Overview", path: "/owner", icon: FiGrid },
        { name: "New Hub", path: "/owner/add-parking", icon: FiPlusCircle },
        { name: "Scan QR", path: "/owner/scan-qr", icon: FiCamera },
        { name: "Profile", path: "/owner/profile", icon: FiUser },
      ]
    : [
        { name: "Admin", path: "/admin", icon: FiShield },
        { name: "Profile", path: "/customer/profile", icon: FiUser },
      ];

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] transition-all duration-300 ${
          scrolled
            ? "bg-white/85 dark:bg-[#090a0f]/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
            : "bg-white/70 dark:bg-[#090a0f]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-zinc-800/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* BRAND LOGO */}
            <Link
              to={brandHome}
              className="flex items-center gap-3 group focus:outline-hidden"
              id="navbar-brand-logo"
            >
              <div className="relative w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black shadow-lg group-hover:scale-105 group-hover:shadow-emerald-500/20 transition-all duration-300">
                <span className="text-sm font-mono tracking-tighter">PE</span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                    Park<span className="pe-gradient-text">Ease</span>
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {getRoleLabel()}
                </span>
              </div>
            </Link>

            {/* DESKTOP NAV PILLS */}
            <nav
              className="hidden md:flex items-center gap-1.5 bg-zinc-100/90 dark:bg-zinc-900/90 p-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs backdrop-blur-md"
              id="navbar-nav-links"
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-black"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400 dark:text-emerald-600" : ""}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT UTILITIES & USER PROFILE */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Theme Switcher */}
              <div className="hidden sm:block">
                <ThemeSwitcher />
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer relative shadow-xs"
                  title="Notifications"
                >
                  <FiBell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 space-y-3 z-50 animate-spring-in text-zinc-900 dark:text-white">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <FiBell className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                          Live Alerts
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        Connected
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs max-h-64 overflow-y-auto pr-1">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">Live Gate Telemetry Active</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Automated ANPR and QR barrier sync is operating normally.</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                        <FiZap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">EV Smart Charging Ready</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Fast-charging bays available at prime commercial hubs.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* USER PROFILE & PREFERENCES DROPDOWN */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[110px]">
                      {getUserName()}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize truncate">
                      {role}
                    </p>
                  </div>
                  <FiChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-72 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3.5 space-y-3 z-50 animate-spring-in text-zinc-900 dark:text-white">
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
                          {getInitials()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{getUserName()}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email || "driver@parkease.in"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-bold">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate(isOwner ? "/owner/profile" : "/customer/profile");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <FiUser className="w-4 h-4 text-zinc-400" />
                        <span>Account & Security</span>
                      </button>

                      {isCustomer && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/customer/subscriptions");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <FiZap className="w-4 h-4 text-amber-500" />
                          <span>Commuter Passes</span>
                        </button>
                      )}

                      {/* Social Channels */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold text-zinc-400">
                          <span>Das & Singh Exports</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href="https://www.linkedin.com/in/das-and-singh-exports-758973398?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#0077b5] text-zinc-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-[#0077b5] dark:hover:text-white transition-colors"
                              title="LinkedIn"
                            >
                              <FaLinkedin className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href="https://www.instagram.com/dassinghexports?igsi=MWdkbmQwMXVxM3c1cg=="
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-zinc-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-400 dark:hover:from-purple-600 dark:hover:to-pink-600 dark:hover:text-white transition-colors"
                              title="Instagram"
                            >
                              <FaInstagram className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer mt-1 border-t border-zinc-100 dark:border-zinc-800/80"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE MENU TRIGGER */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl p-4 space-y-3 animate-fade-in shadow-xl">
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold ${
                      isActive
                        ? "bg-emerald-500 text-white font-black shadow-md"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            {/* Social Links in Mobile Menu */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-zinc-400">Das & Singh Exports</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.linkedin.com/in/das-and-singh-exports-758973398?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  <FaLinkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="https://www.instagram.com/dassinghexports?igsi=MWdkbmQwMXVxM3c1cg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* FLOATING MOBILE BOTTOM NAVIGATION DOCK */}
      <div className="fixed bottom-3 inset-x-0 z-[990] flex justify-center px-4 md:hidden pointer-events-none">
        <div className="pointer-events-auto bg-white/90 dark:bg-[#0c0d14]/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] flex items-center gap-1 sm:gap-2 ring-1 ring-black/5 dark:ring-white/5">
          {mobileDockLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black shadow-sm scale-105"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400 dark:text-emerald-600" : ""}`} />
                <span className="text-[10px] font-bold mt-0.5 tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out of ParkEase"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4 p-1">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <FiLogOut className="w-7 h-7" />
          </div>
          <div>
            <p className="font-black text-zinc-900 dark:text-white text-base">Are you sure you want to sign out?</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">You will need to sign in again to access active parking passes.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
              Stay Signed In
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
