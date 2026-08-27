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

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-b border-slate-200/90 dark:border-zinc-800/90 shadow-md"
            : "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-900/80 shadow-xs"
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
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[2px] shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-emerald-500 rounded-[14px] flex items-center justify-center text-white">
                  <FiMapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center tracking-tight leading-none">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Park
                  </span>
                  <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    Ease
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </Link>

            {/* DESKTOP NAV LINKS */}
            <nav
              className="hidden md:flex items-center gap-1.5 bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80"
              id="navbar-nav-links"
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md font-black"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT UTILITIES & USER PROFILE */}
            <div className="flex items-center gap-2.5 sm:gap-3">

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer relative shadow-xs"
                  title="Notifications"
                >
                  <FiBell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-4 space-y-3 z-50 animate-fade-in text-slate-900 dark:text-white">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        System Notifications
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Live Sync
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Passes Synced</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">All live gate cameras are connected.</p>
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
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                      {getUserName()}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize truncate">
                      {role}
                    </p>
                  </div>
                  <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-72 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-3.5 space-y-3 z-50 animate-fade-in text-slate-900 dark:text-white">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{getUserName()}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user?.email || "driver@parkease.in"}</p>
                    </div>

                    {/* Preferences Controls (Organized inside Profile) */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                        Preferences
                      </span>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">Language</span>
                        <LanguageSwitcher />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">Theme</span>
                        <ThemeSwitcher />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs font-bold">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate(isOwner ? "/owner/profile" : "/customer/profile");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <FiUser className="w-4 h-4 text-slate-400" />
                        <span>Account Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
                className="md:hidden p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3 animate-fade-in shadow-xl">
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
                        ? "bg-emerald-500 text-white font-black"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </header>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out of ParkEase"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4 p-1">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
            <FiLogOut className="w-7 h-7" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white">Are you sure you want to sign out?</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">You will need to sign in again to access passes.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
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
