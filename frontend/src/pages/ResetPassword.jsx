import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiMapPin,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";
import API from "../api/axios";
import Button from "../components/Button";

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
        {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast("Invalid or expired password reset link.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/reset-password", { token, new_password: password });
      showToast("Password updated successfully!", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to reset password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <Toast toast={toast} />

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#e0e0e0] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] text-white flex items-center justify-center font-black text-base shadow-sm">
            <FiMapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0a0a0a] tracking-tight leading-none">
              Park<span className="text-[#276ef1]">Ease</span>
            </h1>
            <span className="text-[10px] text-[#a0a0a0] font-bold uppercase tracking-wider">
              Security Portal
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#0a0a0a] tracking-tight">
            Create New Password
          </h2>
          <p className="text-xs text-[#737373] mt-1">
            Choose a secure password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pe-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-[#0a0a0a] p-1"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pe-input"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="submit"
            loading={loading}
          >
            Reset & Sign In
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#0a0a0a] transition-colors"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}