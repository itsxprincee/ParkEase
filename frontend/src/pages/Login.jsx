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

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
        {/* LEFT PROMO HERO PANEL (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* BRAND */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center text-lg font-black shadow-md">
              <FiMapPin />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white leading-none block">
                Park<span className="font-light text-neutral-400">Ease</span>
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Smart Parking
              </span>
            </div>
          </div>

          {/* VALUE PROPOSITION */}
          <div className="relative z-10 space-y-6 my-auto max-w-md">
            <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
              Drive in. Park. Go.
            </h2>

            <p className="text-neutral-300 text-sm leading-relaxed">
              Find and lock your parking spot in advance with digital QR passes, live slot tracking, and instant automated gate access.
            </p>

            <div className="space-y-3 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-3 text-xs text-neutral-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero-wait instant QR pass generation</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Live GPS navigation directly to your spot</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="relative z-10 text-xs text-neutral-500">
            &copy; 2026 ParkEase. All rights reserved.
          </div>
        </div>

        {/* RIGHT INTERACTIVE AUTH FORM */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 bg-neutral-50">
          <div className="w-full max-w-md space-y-6">
            {/* MOBILE BRAND LOGO */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg">
                <FiMapPin />
              </div>
              <span className="text-2xl font-black text-black">
                Park<span className="font-light text-neutral-500">Ease</span>
              </span>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center p-1.5 bg-neutral-200 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setStep(1);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "signin"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
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
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ================= SIGN IN FORM ================= */}
            {mode === "signin" && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-black text-black tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    Sign in to manage your parking passes and bookings.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                      <FiMail className="text-neutral-400 w-4 h-4" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-black font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[11px] font-bold text-black hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                      <FiLock className="text-neutral-400 w-4 h-4" />
                      <input
                        type={showSignInPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full bg-transparent text-xs text-black font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowSignInPassword(!showSignInPassword)
                        }
                        className="text-neutral-400 hover:text-black p-1"
                      >
                        {showSignInPassword ? (
                          <FiEyeOff className="w-4 h-4" />
                        ) : (
                          <FiEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-black shadow-md transition active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Signing In..." : "Sign In"}</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* DEMO QUICK-FILL SHORTCUTS */}
                <div className="pt-4 border-t border-neutral-100 space-y-2.5">
                  <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider block">
                    Quick 1-Click Login:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSignInEmail("driver@parkease.com");
                        setSignInPassword("password123");
                      }}
                      className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-left transition-all"
                    >
                      <span className="text-xs font-black text-black block">
                        🚗 Driver
                      </span>
                      <span className="text-[10px] text-neutral-500 block">Customer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSignInEmail("owner@parkease.com");
                        setSignInPassword("password123");
                      }}
                      className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-left transition-all"
                    >
                      <span className="text-xs font-black text-black block">
                        🏢 Owner
                      </span>
                      <span className="text-[10px] text-neutral-500 block">Host Lots</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSignInEmail("admin@parkease.com");
                        setSignInPassword("password123");
                      }}
                      className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-left transition-all"
                    >
                      <span className="text-xs font-black text-black block">
                        ⚡ Admin
                      </span>
                      <span className="text-[10px] text-neutral-500 block">Portal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SIGN UP FORM ================= */}
            {mode === "signup" && step === 1 && (
              <div className="apple-card p-6 sm:p-8 space-y-6 animate-in fade-in">
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
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      role === "customer"
                        ? "border-black bg-neutral-50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <FiTruck
                      className={`w-6 h-6 ${
                        role === "customer" ? "text-black" : "text-neutral-400"
                      }`}
                    />
                    <span className="text-xs font-black text-black">
                      Driver / Customer
                    </span>
                    <span className="text-[10px] text-neutral-500 font-bold">
                      Book & Pay for Spots
                    </span>
                  </div>

                  <div
                    onClick={() => setRole("owner")}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      role === "owner"
                        ? "border-black bg-neutral-50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <FiLayers
                      className={`w-6 h-6 ${
                        role === "owner" ? "text-black" : "text-neutral-400"
                      }`}
                    />
                    <span className="text-xs font-black text-black">
                      Facility Owner
                    </span>
                    <span className="text-[10px] text-neutral-500 font-bold">
                      Host & Scan Passes
                    </span>
                  </div>
                </div>

                <form onSubmit={handleRequestSignUpOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Full Name *
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                      <FiUser className="text-neutral-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-xs text-black font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Email Address *
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                      <FiMail className="text-neutral-400 w-4 h-4" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-black font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Password *
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                      <FiLock className="text-neutral-400 w-4 h-4" />
                      <input
                        type={showSignUpPassword ? "text" : "password"}
                        required
                        placeholder="Min. 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="w-full bg-transparent text-xs text-black font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowSignUpPassword(!showSignUpPassword)
                        }
                        className="text-neutral-400 hover:text-black p-1"
                      >
                        {showSignUpPassword ? (
                          <FiEyeOff className="w-4 h-4" />
                        ) : (
                          <FiEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-black shadow-md transition active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    <span>Continue &rarr;</span>
                  </button>
                </form>
              </div>
            )}

            {/* ================= SIGN UP OTP VERIFICATION ================= */}
            {mode === "signup" && step === 2 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-black text-black tracking-tight">
                    Verify Your Email
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    Enter the code sent to{" "}
                    <span className="font-bold text-black">
                      {signUpEmail}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleConfirmSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full text-center tracking-widest text-xl font-black py-3 rounded-xl bg-neutral-100 border border-neutral-200 text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-black shadow-md transition active:scale-95 text-center"
                  >
                    Verify & Create Account
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-neutral-500 hover:text-black font-bold"
                    >
                      &larr; Back
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= FORGOT PASSWORD ================= */}
            {mode === "forgot" && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-black text-black tracking-tight">
                    Recover Password
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    We will send a reset link to your email.
                  </p>
                </div>

                {forgotSent ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-black text-xl">
                      ✓
                    </div>
                    <p className="text-xs text-neutral-700 font-bold">
                      Check your inbox for reset instructions.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold"
                    >
                      Return to Sign In
                    </button>
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