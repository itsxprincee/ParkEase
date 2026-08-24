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
    if (isAdmin) return "Admin";
    if (isOwner) return "Owner";
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
          { name: t("addFacility", "Add Facility"), path: "/owner/add-parking", icon: FiPlusCircle },
          { name: t("scanPass", "Scan Pass"), path: "/owner/scan-qr", icon: FiCamera },
        ]
      : []),
    ...(isAdmin
      ? [{ name: t("commandCenter", "Command Center"), path: "/admin", icon: FiShield }]
      : []),
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] transition-all duration-200 ${
          scrolled
            ? "bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            : "bg-zinc-950 border-b border-zinc-900"
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
                Park<span className="text-zinc-500 font-light">Ease</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 text-[10px] font-semibold uppercase tracking-widest border border-zinc-800">
                {getRoleLabel()}
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-0.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
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
                        ? "bg-white text-zinc-950 shadow-sm font-bold"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
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
                  className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <FiBell className="w-4.5 h-4.5" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#05944f]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.2)] border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-slide-down">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                        {t("notifications", "Notifications")}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#05944f]" />
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      <div className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <FiCheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#05944f]" />
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-white">System Online</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time slot sync is active.</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Just now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* USER PROFILE BUTTON & DROPDOWN WITH THEME & LANGUAGE CONTROLS */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#276ef1] to-[#05944f] flex items-center justify-center text-white font-black text-xs">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-none">{getUserName()}</p>
                  </div>
                  <FiChevronDown
                    className={`hidden sm:block w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-slide-down">
                    
                    {/* User Header */}
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{getUserName()}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user?.email || ""}</p>
                    </div>

                    {/* Quick Mode Switcher in Profile Menu */}
                    <div className="notranslate px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="notranslate text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FiSliders className="w-3 h-3 text-blue-500" />
                          Mode & Theme
                        </span>
                        <span className="notranslate text-[10px] text-zinc-400 capitalize font-medium">{theme}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {THEMES.map((tItem) => {
                          const isActive = theme === tItem.id;
                          return (
                            <button
                              key={tItem.id}
                              onClick={() => setTheme(tItem.id)}
                              className={`notranslate py-1.5 px-1 rounded-lg text-center transition-all ${
                                isActive
                                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs"
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
                          <FiGlobe className="w-3 h-3 text-emerald-500" />
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
                        className="w-full px-4 py-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                      >
                        <FiUser className="w-3.5 h-3.5 text-zinc-400" />
                        {t("profileSettings", "Profile & Settings")}
                      </button>
                      {isCustomer && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/customer/my-vehicles");
                          }}
                          className="w-full px-4 py-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                        >
                          <FiTruck className="w-3.5 h-3.5 text-zinc-400" />
                          {t("myVehicles", "My Vehicles")}
                        </button>
                      )}
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-xs font-medium text-[#e11900] hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                      >
                        <FiLogOut className="w-3.5 h-3.5" />
                        {t("signOut", "Sign Out")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-white text-zinc-950 font-bold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.name}
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
                className="px-4 py-2.5 text-xs font-bold text-[#e11900] hover:bg-zinc-900 rounded-xl transition-colors"
              >
                {t("signOut", "Sign Out")}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* LOGOUT MODAL */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title={t("signOut", "Sign Out")}
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto">
            <FiLogOut className="w-6 h-6 text-[#e11900]" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">Sign out of ParkEase?</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              You'll need to sign in again to access your bookings.
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
