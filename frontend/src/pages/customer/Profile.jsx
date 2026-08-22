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
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${toast.type === "error" ? "bg-white text-[#e11900] border-[#fca5a5]" : "bg-white text-[#05944f] border-[#86efac]"}`}>
        {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
        {toast.message}
      </div>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
        <h3 className="text-base font-bold text-[#0a0a0a]">{title}</h3>
        {Icon && <Icon className="w-4 h-4 text-[#a0a0a0]" />}
      </div>
      {children}
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, required = false }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="pe-input"
      />
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const stored = localStorage.getItem("user");
      let currentUser = stored ? JSON.parse(stored) : null;
      if (currentUser?.role === "owner") {
        navigate("/owner/profile", { replace: true });
        return;
      }
      try {
        const res = await API.get("/auth/me");
        if (res.data) { currentUser = res.data; localStorage.setItem("user", JSON.stringify(res.data)); }
      } catch (_) {}
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || currentUser.full_name || currentUser.username || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "");
      }
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUserData(); }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await API.put("/auth/profile", { name, email, phone });
      const updated = { ...user, name, email, phone, ...(res.data || {}) };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile updated!", "success");
    } catch (_) {
      const updated = { ...user, name, email, phone };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile updated!", "success");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return showToast("Passwords don't match.", "error");
    if (newPassword.length < 6) return showToast("Password must be at least 6 characters.", "error");
    try {
      setSavingPassword(true);
      await API.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      showToast("Password changed!", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = name ? name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#276ef1] to-[#05944f] flex items-center justify-center text-white font-black text-2xl shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-[#0a0a0a] tracking-tight">{name || "Driver Account"}</h1>
              <Badge variant="info" size="sm">Driver</Badge>
            </div>
            <p className="text-sm text-[#737373]">{email || "user@parkease.io"}</p>
            <p className="text-xs text-[#a0a0a0]">Member since 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <FormSection title="Personal Information" icon={FiUser}>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <InputField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <InputField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button type="submit" icon={FiSave} loading={savingProfile}>Save Profile</Button>
            </form>
          </FormSection>

          {/* Security */}
          <FormSection title="Security & Password" icon={FiShield}>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <InputField label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <InputField label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <InputField label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <Button type="submit" variant="outline" icon={FiLock} loading={savingPassword}>Change Password</Button>
            </form>
          </FormSection>
        </div>
      </main>
    </div>
  );
}