import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiMapPin,
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiShield,
  FiTruck,
  FiLayers,
  FiZap,
  FiStar,
  FiClock,
  FiRadio,
} from "react-icons/fi";
import API from "../api/axios";
import Button from "../components/Button";

// ── Toast Notification ────────────────────────────────────────────────────────
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

// ── Form Input Field ──────────────────────────────────────────────────────────
function InputField({ label, icon: Icon, type = "text", value, onChange, placeholder, action }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-zinc-400 z-10">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`pe-input ${Icon ? "pe-input-icon-left" : ""} ${action ? "pe-input-icon-right" : ""} text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs focus:ring-2 focus:ring-emerald-500/20`}
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors z-10 cursor-pointer"
          >
            {action.icon}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Login & Auth Page ───────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState("signin"); // signin | signup | forgot

  // Sign In
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPw, setShowSignInPw] = useState(false);

  // Sign Up
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (searchParams.get("session_expired") === "true") {
      showToast("Your session has expired. Please sign in again.", "error");
    }
  }, [searchParams]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      return showToast("Please enter your email and password.", "error");
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", {
        email: signInEmail,
        password: signInPassword,
      });
      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user || res.data;
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      showToast("Welcome back!", "success");
      const userRole = user?.role?.toLowerCase();
      setTimeout(() => {
        if (userRole === "admin") navigate("/admin", { replace: true });
        else if (userRole === "owner") navigate("/owner", { replace: true });
        else navigate("/customer/dashboard", { replace: true });
      }, 500);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Invalid email or password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!name || !signUpEmail || !signUpPassword) {
      return showToast("Please complete all registration fields.", "error");
    }
    if (signUpPassword.length < 6) {
      return showToast("Password must be at least 6 characters.", "error");
    }
    try {
      setLoading(true);
      await API.post("/auth/send-otp", { email: signUpEmail });
      setStep(2);
      showToast("Verification OTP sent to your email!", "success");
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to send verification code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    if (!otp) return showToast("Enter the 6-digit verification code.", "error");
    try {
      setLoading(true);
      const res = await API.post("/auth/register", {
        name,
        email: signUpEmail,
        password: signUpPassword,
        role,
        otp,
      });
      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user || res.data;
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      showToast("Account created successfully!", "success");
      const userRole = role?.toLowerCase();
      setTimeout(() => {
        if (userRole === "admin") navigate("/admin", { replace: true });
        else if (userRole === "owner") navigate("/owner", { replace: true });
        else navigate("/customer/dashboard", { replace: true });
      }, 600);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return showToast("Enter your email address.", "error");
    try {
      setLoading(true);
      await API.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSent(true);
      showToast("Password reset link generated!", "success");
    } catch (error) {
      showToast(error?.response?.data?.detail || "Unable to send reset link.", "error");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setStep(1);
    setOtp("");
    setForgotSent(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50/80 dark:bg-[#08080c] transition-colors relative selection:bg-emerald-500 selection:text-white">
      <Toast toast={toast} />

      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden lg:flex w-[480px] xl:w-[540px] shrink-0 bg-[#090b10] text-white flex-col relative overflow-hidden border-r border-zinc-800">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 -left-16 w-80 h-80 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-xl">
              <span className="font-mono text-base">PE</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight leading-none text-white">
                ParkEase
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 mt-0.5">
                Smart Mobility Network
              </span>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mt-auto mb-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black text-zinc-300 tracking-wide uppercase">
                Zero Friction Parking
              </span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.1]">
              Drive in.
              <br />
              <span className="text-emerald-400">Park instantly.</span>
              <br />
              Go hassle-free.
            </h2>

            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Reserve verified parking spots with encrypted QR passes, real-time floorplan maps, and automated barrier scans.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              {[
                { icon: FiZap, text: "Instant 1-tap QR gate access" },
                { icon: FiShield, text: "CCTV & Security verified parking hubs" },
                { icon: FiTruck, text: "Multi-vehicle & license plate memory" },
                { icon: FiLayers, text: "Real-time parking bay availability tracker" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-zinc-300 font-bold">{text}</span>
                </div>
              ))}
            </div>

            {/* Verified metric chip */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-white font-mono">99.8%</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Slot Accuracy</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-lg font-black text-emerald-400 font-mono">&lt; 12s</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Barrier Clearance</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-lg font-black text-white font-mono">4.9 ★</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Driver Rating</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-medium">© 2026 ParkEase Technologies · All rights reserved</p>
        </div>
      </div>

      {/* ── RIGHT AUTH FORM CARD ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 transition-colors relative">
        <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-7 sm:p-9 shadow-2xl space-y-6">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black">
              <span className="font-mono text-sm">PE</span>
            </div>
            <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              Park<span className="text-emerald-500 font-light">Ease</span>
            </span>
          </div>

          {/* ── SIGN IN MODE ── */}
          {mode === "signin" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  Sign in to manage your parking passes and reservations
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <InputField
                  label="Email Address"
                  icon={FiMail}
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="driver@parkease.io"
                />
                <InputField
                  label="Password"
                  icon={FiLock}
                  type={showSignInPw ? "text" : "password"}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Your password"
                  action={{
                    icon: showSignInPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />,
                    onClick: () => setShowSignInPw(!showSignInPw),
                  }}
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" fullWidth size="lg" variant="primary" loading={loading} iconRight={FiArrowRight}>
                  Sign In to Account
                </Button>
              </form>

              {/* 1-Tap Quick Demo Personas */}
              <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 text-center">
                  Instant Demo Persona Switcher
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail("customer@parkease.io");
                      setSignInPassword("password123");
                    }}
                    className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all active:scale-95 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-xs">
                      <FiTruck className="w-3.5 h-3.5 text-sky-500" />
                      <span>Driver</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5 truncate">customer@</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail("owner@parkease.io");
                      setSignInPassword("password123");
                    }}
                    className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all active:scale-95 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-xs">
                      <FiLayers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Owner</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5 truncate">owner@</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail("admin@parkease.io");
                      setSignInPassword("password123");
                    }}
                    className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all active:scale-95 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-xs">
                      <FiShield className="w-3.5 h-3.5 text-purple-500" />
                      <span>Admin</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5 truncate">admin@</p>
                  </button>
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                New to ParkEase?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-emerald-600 dark:text-emerald-400 font-black hover:underline cursor-pointer"
                >
                  Create free account
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP MODE ── */}
          {mode === "signup" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {step === 1 ? "Create account" : "Verify Email OTP"}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  {step === 1
                    ? "Join thousands of drivers finding seamless parking"
                    : `Enter the 6-digit code sent to ${signUpEmail}`}
                </p>
              </div>

              {step === 1 && (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <InputField
                    label="Full Name"
                    icon={FiUser}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />

                  {/* Role Switcher */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      I want to
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { value: "customer", label: "Driver", icon: FiTruck, desc: "Find & reserve spots" },
                        { value: "owner", label: "Facility Owner", icon: FiLayers, desc: "List & monetize space" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                            role === opt.value
                              ? "border-emerald-500 bg-emerald-500/10 text-zinc-900 dark:text-white font-black"
                              : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                          }`}
                        >
                          <opt.icon className="w-4 h-4 mb-1 text-emerald-500" />
                          <p className="text-xs font-black">{opt.label}</p>
                          <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <InputField
                    label="Email Address"
                    icon={FiMail}
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <InputField
                    label="Password"
                    icon={FiLock}
                    type={showSignUpPw ? "text" : "password"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    action={{
                      icon: showSignUpPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />,
                      onClick: () => setShowSignUpPw(!showSignUpPw),
                    }}
                  />

                  <Button type="submit" fullWidth size="lg" variant="primary" loading={loading} iconRight={FiArrowRight}>
                    Continue & Verify OTP
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleConfirmSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="pe-input text-center text-2xl font-black font-mono tracking-[0.35em] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full"
                    />
                  </div>

                  <Button type="submit" fullWidth size="lg" variant="primary" loading={loading}>
                    Confirm & Sign In
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors text-center cursor-pointer"
                  >
                    ← Edit details
                  </button>
                </form>
              )}

              <p className="text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Already registered?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-emerald-600 dark:text-emerald-400 font-black hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ── FORGOT PASSWORD MODE ── */}
          {mode === "forgot" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Reset Password
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  We'll generate a secure password reset link for your account
                </p>
              </div>

              {!forgotSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <InputField
                    label="Registered Email Address"
                    icon={FiMail}
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <Button type="submit" fullWidth size="lg" variant="primary" loading={loading}>
                    Send Reset Link
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <FiCheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-black text-zinc-900 dark:text-white">Reset link generated</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Check inbox at <strong>{forgotEmail}</strong>
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => switchMode("signin")}
                className="w-full text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors text-center cursor-pointer"
              >
                ← Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}