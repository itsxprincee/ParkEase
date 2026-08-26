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
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function SaaSNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, THEMES } = useTheme();
  const { language, setLanguage, currentLanguage, t } = useLanguage();

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
    if (isAdmin) return "Super Admin";
    if (isOwner) return "Facility Owner";
    return "Verified Driver";
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
          { name: t("dashboard", "Operations"), path: "/owner", icon: FiGrid },
          { name: t("addFacility", "Add Facility"), path: "/owner/add-parking", icon: FiPlusCircle },
          { name: t("scanPass", "Gate Pass Scan"), path: "/owner/scan-qr", icon: FiCamera },
        ]
      : []),
    ...(isAdmin
      ? [{ name: t("commandCenter", "Compliance Queue"), path: "/admin", icon: FiShield }]
      : []),
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] transition-all duration-300 ${
          scrolled
            ? "bg-zinc-950/90 backdrop-blur-2xl border-b border-zinc-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "bg-zinc-950 border-b border-zinc-900/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        }`}
      >
        {/* Top subtle emerald gradient highlight line */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* BRAND LOGO */}
            <Link to={brandHome} className="flex items-center gap-3 group shrink-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-all duration-300">
                <FiMapPin className="w-4.5 h-4.5 text-black stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight leading-none">
                  Park<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Ease</span>
                </span>
                <span className="text-[10px] font-bold text-zinc-400 tracking-wider">
                  Smart Mobility Hub
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 text-[10px] font-bold tracking-wide border border-white/[0.1] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                {getRoleLabel()}
              </span>
            </Link>

            {/* DESKTOP NAV TABS */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800/90 shadow-inner backdrop-blur-md">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.path ||
                  (link.path !== "/owner" && location.pathname.startsWith(link.path));

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md font-black shadow-emerald-500/20"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2.5">

              {/* NOTIFICATION BELL */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.1] text-zinc-300 hover:text-white transition-all active:scale-95 shadow-xs cursor-pointer"
                  title="Notifications"
                >
                  <FiBell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white/95 dark:bg-zinc-900/95 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800/90 py-2.5 z-50 animate-slide-down backdrop-blur-2xl">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                        {t("notifications", "System Feed")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live Sync Active
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      <div className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <FiCheckCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Smart Gate Ready</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                              Real-time QR barcode verification & slot sync active.
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">Connected now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* USER PROFILE BUTTON & DROPDOWN */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.12] transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-black font-black text-xs shadow-xs">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-none">{getUserName()}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{getRoleLabel()}</p>
                  </div>
                  <FiChevronDown
                    className={`hidden sm:block w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2.5 w-76 bg-white/95 dark:bg-zinc-900/95 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-zinc-200/90 dark:border-zinc-800/90 py-2.5 z-50 animate-slide-down backdrop-blur-2xl">
                    
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{getUserName()}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-mono">{user?.email || ""}</p>
                    </div>

                    {/* Quick Theme Switcher in Profile Menu */}
                    <div className="notranslate px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="notranslate text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FiSliders className="w-3 h-3 text-emerald-500" />
                          Theme Mode
                        </span>
                        <span className="notranslate text-[10px] text-zinc-400 capitalize font-bold">{theme}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {THEMES.map((tItem) => {
                          const isActive = theme === tItem.id;
                          return (
                            <button
                              key={tItem.id}
                              onClick={() => setTheme(tItem.id)}
                              className={`notranslate py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                                isActive
                                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs scale-[1.02]"
                                  : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                              }`}
                            >
                              <span className="text-sm block leading-none">{tItem.icon}</span>
                              <span className="text-[9px] block mt-1 font-semibold">{tItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Language Selector in Profile Menu */}
                    <div className="notranslate px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="notranslate text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FiGlobe className="w-3 h-3 text-teal-500" />
                          Language
                        </span>
                      </div>
                      <div className="pt-0.5">
                        <LanguageSwitcher className="w-full" />
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate(isOwner ? "/owner/profile" : "/profile");
                        }}
                        className="w-full px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <FiUser className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{t("profileSettings", "Profile & Settings")}</span>
                      </button>
                      {isCustomer && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/customer/my-vehicles");
                          }}
                          className="w-full px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <FiTruck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{t("myVehicles", "My Registered Vehicles")}</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <FiLogOut className="w-3.5 h-3.5" />
                        <span>{t("signOut", "Sign Out")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-2xl bg-zinc-900 border border-white/[0.1] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950 border-t border-zinc-900 px-4 pt-3 pb-6 space-y-3 animate-slide-down">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/owner" && location.pathname.startsWith(link.path));

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Mobile Mode & Language */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-zinc-400">{t("appearance", "Mode")}:</span>
                <ThemeSwitcher variant="compact-buttons" />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-zinc-400">{t("language", "Language")}:</span>
                <LanguageSwitcher />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2">
              <button
                onClick={() => navigate(isOwner ? "/owner/profile" : "/profile")}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white text-left transition-colors"
              >
                {t("profileSettings", "Profile & Settings")}
              </button>
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-zinc-900 rounded-xl transition-colors"
              >
                {t("signOut", "Sign Out")}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title={t("signOut", "Sign Out")}
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto text-red-600 border border-red-200 dark:border-red-900/40">
            <FiLogOut className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-zinc-900 dark:text-white">Sign out of ParkEase?</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              You'll need to sign in again to access your passes and live operations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
              {t("cancel", "Cancel")}
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              {t("signOut", "Sign Out")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
