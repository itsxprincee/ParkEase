import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaParking,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaPlus,
  FaQrcode,
  FaSignOutAlt,
  FaSave,
  FaKey,
  FaExclamationTriangle,
  FaChevronRight,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import API from "../../api/axios";

export default function OwnerProfile() {
  const navigate = useNavigate();

  const [owner, setOwner] = useState(null);
  const [stats, setStats] = useState({
    total_locations: 0,
    total_slots: 0,
    available_slots: 0,
    occupied_slots: 0,
    approved: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Toast / notification
  const [message, setMessage] = useState(null);

  const showNotification = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadProfileAndStats = async () => {
    try {
      setLoading(true);

      // Load stored user or fetch from /auth/me
      const storedUser = localStorage.getItem("user");
      let currentUser = storedUser ? JSON.parse(storedUser) : null;

      try {
        const meRes = await API.get("/auth/me");
        if (meRes.data) {
          currentUser = meRes.data;
          localStorage.setItem("user", JSON.stringify(meRes.data));
        }
      } catch {
        // Fallback to stored user if /auth/me not available
      }

      setOwner(currentUser);
      if (currentUser) {
        setName(currentUser.name || "");
        setEmail(currentUser.email || "");
      }

      // Load owner facility stats
      try {
        const statsRes = await API.get("/owner/stats");
        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error("Failed to load owner stats:", err);
      }
    } catch (error) {
      console.error("Failed to load owner profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndStats();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification("Full name cannot be empty.", "error");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await API.put("/auth/profile", {
        name: name.trim(),
        email: email.trim(),
      });

      if (res.data?.user) {
        setOwner(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      showNotification("Profile details updated successfully!", "success");
    } catch (err) {
      showNotification(
        err?.response?.data?.detail || "Failed to update profile.",
        "error"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showNotification("Please enter your current password.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showNotification("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("New passwords do not match.", "error");
      return;
    }

    try {
      setSavingPassword(true);
      await API.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      showNotification("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showNotification(
        err?.response?.data?.detail || "Failed to change password.",
        "error"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const getOwnerInitial = () => {
    return (owner?.name || "O").charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">
            Loading Owner Management Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      
      {/* TOP NAV BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <FaArrowLeft /> Owner Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Owner Management Profile
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* BANNER NOTIFICATION */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 shadow-sm ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <FaCheckCircle className="text-emerald-600 text-lg shrink-0" />
            ) : (
              <FaExclamationTriangle className="text-red-600 text-lg shrink-0" />
            )}
            <p className="text-xs font-semibold">{message.text}</p>
          </div>
        )}

        {/* OWNER IDENTITY BANNER CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-blue-500/20">
                {getOwnerInitial()}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {owner?.name || "Facility Owner"}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
                    Owner
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <FaEnvelope className="text-blue-600" />
                    {owner?.email || "owner@parkease.com"}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <FaShieldAlt /> Verified Partner
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/owner/add-parking")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
              >
                <FaPlus /> Add New Facility
              </button>
            </div>
          </div>
        </div>

        {/* FACILITY METRICS OVERVIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Facilities</span>
              <FaBuilding className="text-blue-600 text-lg" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.total_locations || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Managed Locations</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Bays</span>
              <FaParking className="text-indigo-600 text-lg" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.total_slots || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Configured Capacity</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Available</span>
              <FaCheckCircle className="text-emerald-600 text-lg" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">
              {stats.available_slots || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Open Parking Slots</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Status</span>
              <FaClock className="text-amber-600 text-lg" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.approved || 0} <span className="text-xs font-normal text-slate-400">/ {stats.total_locations || 0}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Verified Live Lots</p>
          </div>
        </div>

        {/* TWO-COLUMN MANAGEMENT SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PROFILE DETAILS CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                <FaUser />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Owner Personal Information
                </h3>
                <p className="text-xs text-slate-500">
                  Update your contact and administrative identity
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  <FaSave />
                  {savingProfile ? "Saving Details..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>

          {/* SECURITY & PASSWORD CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                <FaLock />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Security & Password
                </h3>
                <p className="text-xs text-slate-500">
                  Keep your owner management portal secure
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <FaKey />
                  </span>
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    {showCurrentPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <FaLock />
                  </span>
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    {showNewPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <FaKey />
                  {savingPassword ? "Updating Password..." : "Update Security Password"}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* QUICK PORTAL ACTIONS */}
        <div className="mt-8">
          <h2 className="text-base font-extrabold text-slate-900 mb-4">
            Facility Management Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/owner/scan-qr")}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition">
                  <FaQrcode />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Gate QR Scanner</h4>
                  <p className="text-[11px] text-slate-500">Scan customer check-in & exit</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-400 group-hover:text-blue-600 transition" />
            </button>

            <button
              onClick={() => navigate("/owner/add-parking")}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                  <FaPlus />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Add New Facility</h4>
                  <p className="text-[11px] text-slate-500">Register parking lot for verification</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-400 group-hover:text-indigo-600 transition" />
            </button>

            <button
              onClick={() => navigate("/owner")}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                  <FaBuilding />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Overview Dashboard</h4>
                  <p className="text-[11px] text-slate-500">Manage all parking bays and lots</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-400 group-hover:text-emerald-600 transition" />
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <FaSignOutAlt /> Sign Out from Owner Account
          </button>
        </div>

      </main>
    </div>
  );
}
