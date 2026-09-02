import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiSave, FiShield, FiCheckCircle, FiAlertCircle, FiSliders, FiGlobe, FiCheck, FiExternalLink } from "react-icons/fi";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Footer from "../../components/Footer";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-3.5 h-3.5" />
          </div>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-base font-black text-zinc-900 dark:text-white">{title}</h3>
        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
      </div>
      {children}
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, required = false }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">{label}</label>
      <input type={type} required={required} value={value} onChange={onChange} className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full" />
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

  const loadUserData = async () => {
    try {
      const stored = localStorage.getItem("user");
      let currentUser = stored ? JSON.parse(stored) : null;
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || currentUser.full_name || currentUser.username || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "");
      }
      try {
        const res = await API.get("/auth/me");
        if (res.data) {
          currentUser = { ...currentUser, ...res.data };
          setUser(currentUser);
          setName(currentUser.name || currentUser.full_name || currentUser.username || "");
          setEmail(currentUser.email || "");
          setPhone(currentUser.phone || "");
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (_) {}
    } catch (_) {}
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await API.put("/auth/profile", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      const updated = {
        ...user,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        ...(res.data?.user || res.data || {}),
      };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile details saved successfully!", "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to update profile details.", "error");
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
      await API.put("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      showToast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to update password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black font-black text-2xl shrink-0 shadow-lg shadow-emerald-500/20">
            {name ? name.slice(0, 2).toUpperCase() : "OP"}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{name || "Facility Owner"}</h1>
              <Badge variant="success" size="sm" dot>Parking Owner</Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{email || "owner@parkease.io"}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              <span>Owner Account</span>
              <span>•</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentLanguage.flag} {currentLanguage.native}</span>
              <span>•</span>
              <span className="capitalize">{theme} mode</span>
            </div>
          </div>
        </div>

        {/* Display Mode & Indian Languages Section */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <FiSliders className="w-5 h-5 text-emerald-500" />
              {t("appearance", "Appearance & Display Theme")}
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
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-400"
                  }`}
                >
                  <span className="text-xl block mb-1">{tItem.icon}</span>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">{tItem.label}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{tItem.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="notranslate pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="notranslate text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
              <FiGlobe className="w-4 h-4 text-emerald-500" />
              Indian Languages (Default: English)
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
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{lang.native}</p>
                        <p className="text-[10px] text-zinc-400">({lang.name})</p>
                      </div>
                    </div>
                    {isActive && <FiCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSection title="Owner Account" icon={FiUser}>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <InputField label="Owner Name / Business" value={name} onChange={(e) => setName(e.target.value)} required />
              <InputField label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <InputField label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button type="submit" variant="primary" icon={FiSave} loading={savingProfile}>{t("save", "Save Changes")}</Button>
            </form>
          </FormSection>

          <FormSection title="Password & Security" icon={FiShield}>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <InputField label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <InputField label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <InputField label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <Button type="submit" variant="outline" icon={FiLock} loading={savingPassword}>Update Password</Button>
            </form>
          </FormSection>
        </div>

        {/* Official Social Media Connections Card */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">Das & Singh Exports - Social & Community</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Stay connected for facility operator updates and network announcements</p>
            </div>
            <Badge variant="verified">Official</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <a
              href="https://www.linkedin.com/in/das-and-singh-exports-758973398?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#0077b5] bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-[#0077b5]/5 dark:hover:bg-[#0077b5]/10 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center font-black">
                  <FaLinkedin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-[#0077b5] transition-colors">
                    LinkedIn Network
                  </h4>
                  <p className="text-xs text-zinc-400">Das and Singh Exports</p>
                </div>
              </div>
              <FiExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-[#0077b5]" />
            </a>

            <a
              href="https://www.instagram.com/dassinghexports?igsi=MWdkbmQwMXVxM3c1cg=="
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-pink-500 bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-pink-500/5 dark:hover:bg-pink-500/10 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-[#E4405F] flex items-center justify-center font-black">
                  <FaInstagram className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-pink-500 transition-colors">
                    Instagram Feed
                  </h4>
                  <p className="text-xs text-zinc-400">@dassinghexports</p>
                </div>
              </div>
              <FiExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-pink-500" />
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer className="mt-16 pb-20 md:pb-0" />
    </div>
  );
}
