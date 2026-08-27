import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  FiCamera,
  FiArrowLeft,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiVolume2,
  FiVolumeX,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiClock,
  FiLayers,
  FiUser,
  FiRadio,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

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

export default function ScanQR() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const readerDivRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [verifiedBooking, setVerifiedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const playChime = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(type === "success" ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  const startScanner = async () => {
    if (scannerRef.current) await stopScanner();
    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          handleDecodedData(decodedText);
          stopScanner();
        },
        () => {}
      );
      setScanning(true);
    } catch (_) {
      showToast("Unable to access device camera.", "error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleDecodedData = async (rawString) => {
    let bookingId = rawString;
    try {
      const parsed = JSON.parse(rawString);
      if (parsed.booking_id) bookingId = parsed.booking_id;
    } catch (_) {}
    verifyBookingId(bookingId);
  };

  const verifyBookingId = async (idToVerify) => {
    if (!idToVerify) return;
    try {
      setLoading(true);
      const res = await API.get(`/booking/verify/${idToVerify}`);
      const data = res.data?.booking || res.data;
      setVerifiedBooking(data);
      playChime("success");
      showToast("Pass verified successfully!", "success");
    } catch (_) {
      try {
        const res = await API.get(`/booking/${idToVerify}`);
        const data = res.data?.booking || res.data;
        setVerifiedBooking(data);
        playChime("success");
        showToast("Pass verified!", "success");
      } catch (e) {
        showToast("Invalid or expired booking pass.", "error");
        playChime("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return showToast("Enter a booking number.", "error");
    verifyBookingId(manualCode.trim());
  };

  const handleCheckIn = async () => {
    if (!verifiedBooking) return;
    try {
      setActionLoading(true);
      const res = await API.post(`/booking/entry/${verifiedBooking.id}`);
      playChime("success");
      showToast(res.data?.message || "✅ Vehicle checked in & barrier opened!", "success");
      setVerifiedBooking((prev) => ({
        ...prev,
        status: "ACTIVE",
        is_inside: true,
        entry_count: (prev?.entry_count || 0) + 1,
      }));
    } catch (err) {
      showToast(err?.response?.data?.detail || "Check-in failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!verifiedBooking) return;
    try {
      setActionLoading(true);
      const res = await API.post(`/booking/exit/${verifiedBooking.id}`);
      playChime("success");
      showToast(res.data?.message || "✅ Vehicle check-out completed & bay freed!", "success");
      if (verifiedBooking.pass_type === "DAILY_PASS") {
        setVerifiedBooking((prev) => ({
          ...prev,
          is_inside: false,
          status: "ACTIVE",
        }));
      } else {
        setVerifiedBooking((prev) => ({
          ...prev,
          is_inside: false,
          status: "COMPLETED",
        }));
      }
    } catch (err) {
      showToast(err?.response?.data?.detail || "Check-out failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const isDaily = verifiedBooking?.pass_type === "DAILY_PASS";
  const isInside =
    verifiedBooking?.is_inside ||
    (verifiedBooking?.status === "ACTIVE" && verifiedBooking?.entry_count > 0);
  const statusUpper = String(verifiedBooking?.status || "BOOKED").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer"
          >
            {soundEnabled ? (
              <FiVolume2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <FiVolumeX className="w-4 h-4 text-zinc-400" />
            )}
            <span>{soundEnabled ? "Sound On" : "Sound Muted"}</span>
          </button>
        </div>

        {/* Hero Banner Box */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#0d0d12] to-black border border-zinc-800/90 shadow-xl text-white p-6 sm:p-8">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>QR CODE SCANNER</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Scan Customer QR Pass
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Hold customer's QR pass under the camera for instant check-in or check-out.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold bg-white/[0.06] px-4 py-2 rounded-2xl border border-white/10">
              <FiRadio className="w-4 h-4 text-emerald-400" />
              <span>Camera Ready</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SCANNER PANEL */}
          <div className="lg:col-span-6 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 space-y-5 backdrop-blur-xl">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-black text-zinc-900 dark:text-white">
                Camera Feed
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Fast QR code recognition engine
              </p>
            </div>

            {/* Camera Viewport */}
            <div className="relative bg-zinc-950 rounded-3xl overflow-hidden min-h-[320px] flex items-center justify-center border border-zinc-800 shadow-inner">
              <div id="reader" ref={readerDivRef} className="w-full h-full" />

              {scanning && (
                <>
                  <div className="scan-laser-line" />
                  <div className="absolute inset-6 pointer-events-none border-2 border-white/20 rounded-2xl flex flex-col justify-between p-3 z-20">
                    <div className="flex justify-between">
                      <span className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                      <span className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                    </div>
                    <div className="text-center">
                      <span className="px-3.5 py-1.5 rounded-full bg-black/80 text-[10px] font-black text-emerald-400 uppercase tracking-wider border border-emerald-400/30 backdrop-blur-md">
                        Center QR Pass Here
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                      <span className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>
                </>
              )}

              {!scanning && (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <FiCamera className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-xs font-bold text-white">Camera is currently standby</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                    Activate camera to scan driver QR passes or enter reservation ID manually below
                  </p>
                </div>
              )}
            </div>

            {scanning ? (
              <Button variant="danger" fullWidth onClick={stopScanner}>
                Stop Camera
              </Button>
            ) : (
              <button
                onClick={startScanner}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <FiCamera className="w-4 h-4 stroke-[2.5]" />
                <span>Start Camera Scanner</span>
              </button>
            )}

            {/* Manual Lookup */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter Booking ID (e.g. 1042)..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="pe-input pl-10 text-xs font-mono font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs"
                  />
                </div>
                <Button type="submit" loading={loading} size="md">
                  Verify
                </Button>
              </form>
            </div>
          </div>

          {/* VERIFICATION PANEL */}
          <div className="lg:col-span-6 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 space-y-5 backdrop-blur-xl">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-black text-zinc-900 dark:text-white">
                Pass Authorization
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time validation & gate barrier triggers
              </p>
            </div>

            {!verifiedBooking ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto">
                  <FiShield className="w-8 h-8 text-zinc-400" />
                </div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                  Awaiting QR Scan
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xs mx-auto">
                  Scan driver's QR pass using the camera or enter the booking number to check in.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Status Strip */}
                <div className="p-4.5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="success" dot>
                        {statusUpper}
                      </Badge>
                      {isDaily && (
                        <span className="text-[10px] font-black bg-emerald-500 text-black px-2.5 py-0.5 rounded-full">
                          🎟️ Full-Day Pass
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                      Pass #{verifiedBooking.id}
                    </h3>
                  </div>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 px-4 py-1.5 rounded-2xl border border-emerald-500/30 font-mono shadow-xs">
                    Spot {verifiedBooking.slot_number || "A-1"}
                  </span>
                </div>

                {/* License Plate & Inside State */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1.5">
                      Vehicle Number
                    </p>
                    <div className="license-plate text-xs shrink-0 shadow-xs inline-flex">
                      <span className="license-plate-ind">IND</span>
                      <span className="font-mono font-black tracking-wider">
                        {verifiedBooking.vehicle_number || "MH-01-AB-1234"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1.5">
                      Current Status
                    </p>
                    <p className="text-xs font-black text-zinc-900 dark:text-white">
                      {isInside ? "🟢 Parked Now" : "⚪ Checked Out"}
                    </p>
                  </div>
                </div>

                {/* Details Table */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2.5 text-xs">
                  {[
                    { label: "Customer Name", value: verifiedBooking.customer_name || "Driver" },
                    { label: "Parking Location", value: verifiedBooking.parking_name || "Parking Location" },
                    { label: "Check-in Count", value: `${verifiedBooking.entry_count || 1} time(s)` },
                    {
                      label: "Total Paid",
                      value: `₹${verifiedBooking.amount || verifiedBooking.total_amount || 25}`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Gate Entry & Exit Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={actionLoading}
                    icon={FiLogIn}
                    onClick={handleCheckIn}
                  >
                    Check In
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    loading={actionLoading}
                    icon={FiLogOut}
                    onClick={handleCheckOut}
                  >
                    {isDaily ? "Exit (Temporary)" : "Check Out"}
                  </Button>
                </div>

                <button
                  onClick={() => setVerifiedBooking(null)}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors text-center pt-2 cursor-pointer"
                >
                  Clear & Scan Next Pass
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
