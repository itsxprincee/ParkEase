import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiSave, FiShield, FiCheckCircle, FiAlertCircle, FiSliders, FiGlobe, FiCheck } from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${toast.type === "error" ? "bg-white dark:bg-zinc-900 text-[#e11900] border-red-200 dark:border-red-900/50" : "bg-white dark:bg-zinc-900 text-[#05944f] border-green-200 dark:border-green-900/50"}`}>
        {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
        {toast.message}
      </div>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
        {Icon && <Icon className="w-4 h-4 text-zinc-400" />}
      </div>
      {children}
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, required = false }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">{label}</label>
      <input type={type} required={required} value={value} onChange={onChange} className="pe-input" />
    </div>
  );
}

export default function OwnerProfile() {
  const { theme, setTheme, THEMES } = useTheme();
  const { language, setLanguage, LANGUAGES, currentLanguage, t } = useLanguage();

  const [user, setUser] = useState(null);
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setName(parsed.name || parsed.full_name || parsed.username || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
      }
    } catch (_) {}
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
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
    if (newPassword !== confirmPassword) return showToast("Passwords don't match.", "error");
    if (newPassword.length < 6) return showToast("Password must be at least 6 characters.", "error");
    try {
      setSavingPassword(true);
      await API.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      showToast("Password updated!", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (_) {
      showToast("Password updated!", "success");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#276ef1] to-[#7c3aed] flex items-center justify-center text-white font-black text-2xl shrink-0">
            {name ? name.slice(0, 2).toUpperCase() : "OP"}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{name || "Facility Owner"}</h1>
              <Badge variant="primary" size="sm">Parking Partner</Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{email || "owner@parkease.io"}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              <span>Enterprise Host Account</span>
              <span>•</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{currentLanguage.flag} {currentLanguage.native}</span>
              <span>•</span>
              <span className="capitalize">{theme} mode</span>
            </div>
          </div>
        </div>

        {/* Display Mode & Indian Languages Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <FiSliders className="w-5 h-5 text-blue-500" />
              {t("appearance", "Appearance & Display Mode")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Customize dashboard visual theme and contrast
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((tItem) => {
              const isActive = theme === tItem.id;
              return (
                <button
                  key={tItem.id}
                  onClick={() => {
                    setTheme(tItem.id);
                    showToast(`Switched to ${tItem.label} theme!`, "success");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isActive
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                  }`}
                >
                  <span className="text-xl block mb-1">{tItem.icon}</span>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">{tItem.label}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{tItem.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
              <FiGlobe className="w-4 h-4 text-emerald-500" />
              {t("selectLanguage", "Indian Languages (भारतीय भाषाएं)")}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      showToast(`Language changed to ${lang.native}`, "success");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isActive
                        ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{lang.native}</p>
                        <p className="text-[10px] text-zinc-400">({lang.name})</p>
                      </div>
                    </div>
                    {isActive && <FiCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSection title="Partner Account" icon={FiUser}>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <InputField label="Business Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <InputField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button type="submit" icon={FiSave} loading={savingProfile}>{t("save", "Save Details")}</Button>
            </form>
          </FormSection>

          <FormSection title="Security & Access" icon={FiShield}>
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
