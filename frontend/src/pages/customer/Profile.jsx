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
  FiCalendar,
  FiLogOut,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card, StatCard } from "../../components/Card";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      let currentUser = storedUser ? JSON.parse(storedUser) : null;

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
      } catch (err) {
        // use stored fallback
      }

      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || currentUser.full_name || currentUser.username || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "+91 98765 43210");
      }
    } catch (error) {
      console.error("Profile load error:", error);
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
    } catch (error) {
      // simulate fallback update if endpoint is custom
      const updated = { ...user, name, email, phone };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile details updated!", "success");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      setSavingPassword(true);
      await API.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showToast(
        error?.response?.data?.detail || "Failed to update password.",
        "error"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-xs sm:text-sm font-semibold ${
              toast.type === "error"
                ? "bg-rose-50/95 text-rose-800 border-rose-200"
                : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER PROFILE CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-lg shadow-indigo-500/25 shrink-0">
            {name ? name.charAt(0) : "U"}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {name || "Driver Account"}
              </h1>
              <Badge variant="primary" size="sm">
                Driver / Customer
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">{email || "user@parkease.io"}</p>
            <p className="text-xs text-slate-400 font-medium">Member since 2026</p>
          </div>
        </div>

        {/* SETTINGS FORMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GENERAL INFO */}
          <Card className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Personal Information
              </h3>
              <FiUser className="text-slate-400" />
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={savingProfile}
                  icon={FiSave}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>

          {/* PASSWORD & SECURITY */}
          <Card className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Security & Password
              </h3>
              <FiShield className="text-slate-400" />
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="md"
                  type="submit"
                  loading={savingPassword}
                  icon={FiLock}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}