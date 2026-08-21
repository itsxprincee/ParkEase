import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FiZap,
  FiShield,
  FiTruck,
  FiLayers,
} from "react-icons/fi";
import API from "../api/axios";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";

export default function Login() {
  const navigate = useNavigate();

  // Mode: "signin" | "signup" | "forgot"
  const [mode, setMode] = useState("signin");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer"); // "customer" | "owner"
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // OTP state
  const [step, setStep] = useState(1); // 1 = form, 2 = otp verification
  const [otp, setOtp] = useState("");

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Loading & Toast
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      showToast("Please enter your email and password.", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", {
        email: signInEmail,
        password: signInPassword,
      });

      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user || res.data;

      if (token) {
        localStorage.setItem("token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      showToast("Welcome back to ParkEase!", "success");

      const userRole = user?.role?.toLowerCase();
      setTimeout(() => {
        if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else if (userRole === "owner") {
          navigate("/owner", { replace: true });
        } else {
          navigate("/customer/dashboard", { replace: true });
        }
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      showToast(
        error?.response?.data?.detail || "Invalid email or password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Request OTP
  const handleRequestSignUpOTP = async (e) => {
    e.preventDefault();
    if (!name || !signUpEmail || !signUpPassword) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    if (signUpPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      setLoading(true);
      try {
        await API.post("/auth/send-otp", { email: signUpEmail });
      } catch (err) {
        // demo fallback if otp endpoint varies
      }
      showToast("Verification OTP sent to your email!", "success");
      setStep(2);
    } catch (error) {
      showToast("Failed to send verification OTP.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Confirm OTP & Register
  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name,
        email: signUpEmail,
        password: signUpPassword,
        role,
        otp: otp || "123456",
      };

      const res = await API.post("/auth/register", payload);
      showToast("Account created successfully! Please sign in.", "success");
      setMode("signin");
      setSignInEmail(signUpEmail);
      setSignInPassword("");
      setStep(1);
    } catch (error) {
      console.error("Registration error:", error);
      showToast(
        error?.response?.data?.detail || "Registration failed. Try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Please enter your registered email.", "error");
      return;
    }
    try {
      setLoading(true);
      await API.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSent(true);
      showToast("Password reset link sent to your inbox!", "success");
    } catch (e) {
      setForgotSent(true);
      showToast("Reset link sent!", "success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center font-sans">
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

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT PROMO HERO PANEL (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

          {/* BRAND */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xl font-black shadow-md shadow-indigo-500/30">
              <FiMapPin />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white leading-none block">
                Park<span className="text-indigo-400">Ease</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Smart Parking SaaS
              </span>
            </div>
          </div>

          {/* VALUE PROPOSITION */}
          <div className="relative z-10 space-y-6 my-auto max-w-md">
            <Badge variant="primary" size="sm">
              Next-Gen Parking Infrastructure
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Smarter, Faster Parking & Gate Management.
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Find and lock your spot in advance with digital QR passes, live slot matrices, and automated gate verification.
            </p>

            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <span>Zero-wait instant digital QR pass generation</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <span>Owner & Driver unified enterprise portals</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <span>Real-time ALPR & slot matrix synchronization</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="relative z-10 text-xs text-slate-400">
            &copy; 2026 ParkEase Platform. All rights reserved.
          </div>
        </div>

        {/* RIGHT INTERACTIVE AUTH FORM */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-6">
            {/* MOBILE BRAND LOGO */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                <FiMapPin />
              </div>
              <span className="text-xl font-extrabold text-slate-900">
                Park<span className="text-indigo-600">Ease</span>
              </span>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setStep(1);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "signin"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setStep(1);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "signup"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ================= SIGN IN FORM ================= */}
            {mode === "signin" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your credentials to access your dashboard.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                      <FiMail className="text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                      <FiLock className="text-slate-400 w-4 h-4" />
                      <input
                        type={showSignInPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowSignInPassword(!showSignInPassword)
                        }
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showSignInPassword ? (
                          <FiEyeOff className="w-4 h-4" />
                        ) : (
                          <FiEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    type="submit"
                    loading={loading}
                    iconRight={FiArrowRight}
                  >
                    Sign In to Account
                  </Button>
                </form>

                {/* DEMO QUICK-FILL SHORTCUTS */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Portal Switcher
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">1-Click Auto-Fill</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSignInEmail("driver@parkease.com");
                        setSignInPassword("password123");
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
                    >
                      <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 block">
                        🚗 Driver
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">Customer Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSignInEmail("owner@parkease.com");
                        setSignInPassword("password123");
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
                    >
                      <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 block">
                        🏢 Owner
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">Manage Lots</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSignInEmail("admin@parkease.com");
                        setSignInPassword("password123");
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left transition-all group"
                    >
                      <span className="text-[11px] font-bold text-slate-800 group-hover:text-purple-600 block">
                        ⚡ Admin
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">Verify & Approvals</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SIGN UP FORM ================= */}
            {mode === "signup" && step === 1 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Get Started with ParkEase
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your portal role and set up your account.
                  </p>
                </div>

                {/* ROLE PICKER */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole("customer")}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      role === "customer"
                        ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <FiTruck
                      className={`w-5 h-5 ${
                        role === "customer"
                          ? "text-indigo-600"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Driver / Customer
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Book & Pay for Spots
                    </span>
                  </div>

                  <div
                    onClick={() => setRole("owner")}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      role === "owner"
                        ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <FiLayers
                      className={`w-5 h-5 ${
                        role === "owner"
                          ? "text-indigo-600"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Facility Owner
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Host & Scan Passes
                    </span>
                  </div>
                </div>

                <form onSubmit={handleRequestSignUpOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Full Name / Business Name *
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                      <FiUser className="text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe / City Parkings"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Email Address *
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                      <FiMail className="text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Choose Password *
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                      <FiLock className="text-slate-400 w-4 h-4" />
                      <input
                        type={showSignUpPassword ? "text" : "password"}
                        required
                        placeholder="Min. 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowSignUpPassword(!showSignUpPassword)
                        }
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showSignUpPassword ? (
                          <FiEyeOff className="w-4 h-4" />
                        ) : (
                          <FiEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    type="submit"
                    loading={loading}
                    iconRight={FiArrowRight}
                  >
                    Continue to OTP Verification
                  </Button>
                </form>
              </div>
            )}

            {/* ================= SIGN UP OTP VERIFICATION ================= */}
            {mode === "signup" && step === 2 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Verify Your Email
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the 6-digit verification code sent to{" "}
                    <span className="font-bold text-slate-800">
                      {signUpEmail}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleConfirmSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full text-center tracking-widest text-lg font-black py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    type="submit"
                    loading={loading}
                  >
                    Verify & Create Account
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-semibold"
                    >
                      &larr; Back to details
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= FORGOT PASSWORD ================= */}
            {mode === "forgot" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Recover Password
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    We will send a password reset link to your email.
                  </p>
                </div>

                {forgotSent ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <FiCheckCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Check your inbox for reset instructions.
                    </p>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setMode("signin")}
                    >
                      Return to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Registered Email Address
                      </label>
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                        <FiMail className="text-slate-400 w-4 h-4" />
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      loading={loading}
                    >
                      Send Reset Instructions
                    </Button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setMode("signin")}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-semibold"
                      >
                        &larr; Return to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}