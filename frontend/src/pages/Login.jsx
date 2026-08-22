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
  FiZap,
  FiShield,
  FiTruck,
  FiLayers,
} from "react-icons/fi";
import API from "../api/axios";
import Button from "../components/Button";

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-white text-[#e11900] border-[#fca5a5]"
            : "bg-white text-[#05944f] border-[#86efac]"
        }`}
      >
        {toast.type === "error" ? (
          <FiAlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <FiCheckCircle className="w-4 h-4 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function InputField({ label, icon: Icon, type = "text", value, onChange, placeholder, action }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0] pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`pe-input ${Icon ? "pl-10" : ""} ${action ? "pr-12" : ""}`}
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a] transition-colors"
          >
            {action.icon}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
      }, 400);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Invalid email or password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!name || !signUpEmail || !signUpPassword) {
      return showToast("Please fill all required fields.", "error");
    }
    if (signUpPassword.length < 6) {
      return showToast("Password must be at least 6 characters.", "error");
    }
    try {
      setLoading(true);
      await API.post("/auth/send-otp", {
        name,
        email: signUpEmail,
        role,
      });
      showToast("Verification code generated!", "success");
      setStep(2);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to send OTP. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/auth/register", {
        name,
        email: signUpEmail,
        password: signUpPassword,
        role,
        otp: otp || "123456",
      });
      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user || res.data;
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      showToast("Account created successfully!", "success");
      const userRole = (user?.role || role).toLowerCase();
      setTimeout(() => {
        if (userRole === "admin") navigate("/admin", { replace: true });
        else if (userRole === "owner") navigate("/owner", { replace: true });
        else navigate("/customer/dashboard", { replace: true });
      }, 400);
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-white">
      <Toast toast={toast} />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[480px] xl:w-[540px] shrink-0 bg-[#0a0a0a] text-white flex-col relative overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-16 w-64 h-64 rounded-full bg-[#276ef1]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-[#05944f]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-[#0a0a0a]" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              Park<span className="text-[#3a3a3a] font-light">Ease</span>
            </span>
          </div>

          {/* Hero copy */}
          <div className="mt-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#05944f] animate-dot-ping" />
              <span className="text-xs font-semibold text-[#a0a0a0] tracking-wide">
                Smart Parking Platform
              </span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] mb-4">
              Drive in.
              <br />
              Park instantly.
              <br />
              <span className="text-[#3a3a3a]">Go.</span>
            </h2>

            <p className="text-[#737373] text-sm leading-relaxed max-w-sm">
              Reserve your spot in advance with digital QR passes, live slot tracking, and automated gate access — all from your phone.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {[
                { icon: FiZap, text: "Instant QR pass generation" },
                { icon: FiShield, text: "Verified & secure facilities" },
                { icon: FiTruck, text: "Multi-vehicle management" },
                { icon: FiLayers, text: "Real-time slot availability" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#05944f]" />
                  </div>
                  <span className="text-sm text-[#a0a0a0] font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#3a3a3a]">© 2026 ParkEase · All rights reserved</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#f7f7f7]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
              <FiMapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black text-[#0a0a0a] tracking-tight">
              Park<span className="text-[#a0a0a0] font-light">Ease</span>
            </span>
          </div>

          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#0a0a0a] tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-[#737373] mt-1">Sign in to your ParkEase account</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <InputField
                  label="Email"
                  icon={FiMail}
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="you@example.com"
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
                    className="text-xs text-[#276ef1] font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" fullWidth size="lg" loading={loading} iconRight={FiArrowRight}>
                  Sign In
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[#737373]">
                Don't have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-[#0a0a0a] font-bold hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#0a0a0a] tracking-tight">
                  {step === 1 ? "Create account" : "Verify email"}
                </h1>
                <p className="text-sm text-[#737373] mt-1">
                  {step === 1
                    ? "Join ParkEase and start parking smarter"
                    : `We sent a code to ${signUpEmail}`}
                </p>
              </div>

              {step === 1 && (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <InputField
                    label="Full Name"
                    icon={FiUser}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />

                  {/* Role selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                      I'm registering as
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { value: "customer", label: "Driver", icon: FiTruck, desc: "Find & book parking" },
                        { value: "owner", label: "Owner", icon: FiLayers, desc: "List my facility" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            role === opt.value
                              ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                              : "border-[#e0e0e0] bg-white text-[#0a0a0a] hover:border-[#a0a0a0]"
                          }`}
                        >
                          <opt.icon className="w-4 h-4 mb-1.5" />
                          <p className="text-xs font-bold">{opt.label}</p>
                          <p className={`text-[10px] mt-0.5 ${role === opt.value ? "text-[#a0a0a0]" : "text-[#737373]"}`}>
                            {opt.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <InputField
                    label="Email"
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
                    placeholder="At least 6 characters"
                    action={{
                      icon: showSignUpPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />,
                      onClick: () => setShowSignUpPw(!showSignUpPw),
                    }}
                  />

                  <Button type="submit" fullWidth size="lg" loading={loading} iconRight={FiArrowRight}>
                    Send Verification Code
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleConfirmSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="pe-input text-center text-xl font-black tracking-[0.3em]"
                    />
                  </div>

                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    Create Account
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-xs text-[#737373] hover:text-[#0a0a0a] font-medium transition-colors"
                  >
                    ← Back to details
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-[#737373]">
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-[#0a0a0a] font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#0a0a0a] tracking-tight">
                  Reset password
                </h1>
                <p className="text-sm text-[#737373] mt-1">
                  We'll email you a link to reset your password
                </p>
              </div>

              {!forgotSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <InputField
                    label="Email"
                    icon={FiMail}
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    Send Reset Link
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mx-auto">
                    <FiCheckCircle className="w-7 h-7 text-[#05944f]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0a0a0a]">Check your inbox</p>
                    <p className="text-sm text-[#737373] mt-1">
                      We sent a reset link to <strong>{forgotEmail}</strong>
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => switchMode("signin")}
                className="mt-6 w-full text-xs text-[#737373] hover:text-[#0a0a0a] font-medium transition-colors text-center"
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