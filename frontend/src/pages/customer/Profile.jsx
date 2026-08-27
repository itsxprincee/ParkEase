import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiShield,
  FiTruck,
  FiPlus,
  FiTrash2,
  FiZap,
  FiCalendar,
  FiKey,
  FiGlobe,
  FiMoon,
  FiSun,
  FiSliders,
  FiCheck,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-white dark:bg-zinc-900 text-[#e11900] border-red-200 dark:border-red-900/50"
            : "bg-white dark:bg-zinc-900 text-[#05944f] border-green-200 dark:border-green-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <FiAlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <FiCheckCircle className="w-4 h-4 shrink-0" />
        )}
        {toast.message}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { theme, setTheme, THEMES } = useTheme();
  const { language, setLanguage, LANGUAGES, currentLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState("PROFILE"); // PROFILE, VEHICLES, PREFERENCES, SECURITY

  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Vehicle Modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    vehicle_name: "",
  });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem("user");
      let currentUser = stored ? JSON.parse(stored) : null;
      if (currentUser?.role === "owner") {
        navigate("/owner/profile", { replace: true });
        return;
      }
      try {
        const res = await API.get("/auth/me");
        if (res.data) {
          currentUser = res.data;
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (_) {}
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || currentUser.full_name || currentUser.username || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "");
      }

      // Load fleet
      try {
        const vRes = await API.get("/vehicles/my");
        setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
      } catch (_) {}
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await API.put("/auth/profile", { name, email, phone });
      const updated = { ...user, name, email, phone, ...(res.data || {}) };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile details updated successfully!", "success");
    } catch (_) {
      const updated = { ...user, name, email, phone };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile saved!", "success");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      setSavingPassword(true);
      await API.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to update password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const plate = newVehicle.vehicle_number.trim().toUpperCase();
    if (!plate) {
      showToast("License plate number is required", "error");
      return;
    }
    try {
      setAddingVehicle(true);
      const res = await API.post("/vehicles", {
        vehicle_number: plate,
        vehicle_type: newVehicle.vehicle_type,
        vehicle_name: newVehicle.vehicle_name || `${newVehicle.vehicle_type} (${plate.slice(-4)})`,
      });
      setVehicles((prev) => [res.data, ...prev]);
      setShowAddVehicleModal(false);
      setNewVehicle({ vehicle_number: "", vehicle_type: "Car", vehicle_name: "" });
      showToast("Vehicle registered to your fleet!", "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to add vehicle", "error");
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vId) => {
    try {
      setDeletingVehicleId(vId);
      await API.delete(`/vehicles/${vId}`);
      setVehicles((prev) => prev.filter((v) => v.id !== vId));
      showToast("Vehicle removed from fleet", "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to remove vehicle", "error");
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const initials = (name || user?.username || "DR").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header Profile Card */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black font-black text-2xl shrink-0 shadow-lg shadow-emerald-500/20">
              {initials}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {name || "Driver Account"}
                </h1>
                <Badge variant="success" size="sm" dot>
                  Active Account
                </Badge>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{email || "user@parkease.io"}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                <span>{vehicles.length} Saved Vehicles</span>
                <span>•</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentLanguage.flag} {currentLanguage.native}
                </span>
                <span>•</span>
                <span className="capitalize">{theme} mode</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={FiCalendar}
              onClick={() => navigate("/customer/my-bookings")}
            >
              My Passes
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: "PROFILE", label: "Profile & Contact", icon: FiUser },
            { id: "PREFERENCES", label: `Theme & Language (${currentLanguage.name})`, icon: FiSliders },
            { id: "VEHICLES", label: `Saved Vehicles (${vehicles.length})`, icon: FiTruck },
            { id: "SECURITY", label: "Password & Security", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs font-black"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROFILE DETAILS */}
        {activeTab === "PROFILE" && (
          <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Personal Information</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                Update your contact details for booking confirmations
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pe-input text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pe-input text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" icon={FiSave} loading={savingProfile} size="lg">
                  {t("save", "Save Changes")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: APPEARANCE & INDIAN LANGUAGES */}
        {activeTab === "PREFERENCES" && (
          <div className="space-y-6 animate-fade-in">
            {/* Theme Mode Card */}
            <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-5">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <FiSliders className="w-5 h-5 text-emerald-500" />
                    {t("appearance", "Appearance & Display Theme")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Choose between Light, Dark, or System mode
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                  Current: {theme}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map((tItem) => {
                  const isActive = theme === tItem.id;
                  return (
                    <button
                      key={tItem.id}
                      onClick={() => {
                        setTheme(tItem.id);
                        showToast(`Switched to ${tItem.label} theme!`, "success");
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-32 cursor-pointer ${
                        isActive
                          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{tItem.icon}</span>
                        {isActive && <FiCheck className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tItem.label}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{tItem.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Indian Languages Card */}
            <div className="notranslate bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-5">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <FiGlobe className="w-5 h-5 text-emerald-500" />
                    Indian Languages
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Select your preferred language (Default: English)
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {currentLanguage.flag} {currentLanguage.native} ({currentLanguage.name})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {LANGUAGES.map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        showToast(`Language changed to ${lang.native} (${lang.name})`, "success");
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{lang.native}</span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">({lang.name})</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{lang.region}</p>
                        </div>
                      </div>
                      {isActive && <FiCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY VEHICLES */}
        {activeTab === "VEHICLES" && (
          <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Saved Vehicles</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Vehicles saved for 1-tap fast booking
                </p>
              </div>
              <Button
                variant="primary"
                icon={FiPlus}
                size="sm"
                onClick={() => setShowAddVehicleModal(true)}
              >
                Add Vehicle
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <FiTruck className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No Vehicles Saved</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Add your car, EV, or motorcycle plate for instant spot booking.
                </p>
                <Button variant="primary" size="md" onClick={() => setShowAddVehicleModal(true)}>
                  + Add First Vehicle
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          {v.vehicle_number}
                        </span>
                        {v.vehicle_type === "EV" && (
                          <span className="text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                            ⚡ EV
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 truncate">
                        {v.vehicle_name || v.vehicle_type || "Vehicle"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      disabled={deletingVehicleId === v.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SECURITY & PASSWORD */}
        {activeTab === "SECURITY" && (
          <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Password & Security</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Update your login password and security settings
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" icon={FiLock} loading={savingPassword} size="lg">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ADD VEHICLE MODAL */}
      <Modal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        title="Add Vehicle"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              License Plate (e.g. MH 02 AB 1234) *
            </label>
            <input
              type="text"
              required
              placeholder="MH 02 AB 1234"
              value={newVehicle.vehicle_number}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_number: e.target.value.toUpperCase() })
              }
              className="pe-input uppercase font-mono font-bold tracking-widest text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Vehicle Type
            </label>
            <select
              value={newVehicle.vehicle_type}
              onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
              className="pe-input text-sm font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            >
              <option value="Car">Car / Sedan / SUV 🚗</option>
              <option value="Bike">Motorcycle / Scooter 🏍️</option>
              <option value="Truck">Truck / Commercial 🚛</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Nickname / Model (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. White Creta, Red Pulsar"
              value={newVehicle.vehicle_name}
              onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })}
              className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setShowAddVehicleModal(false)}
            >
              {t("cancel", "Cancel")}
            </Button>
            <Button type="submit" variant="primary" loading={addingVehicle}>
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}