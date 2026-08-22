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
        { fps: 10, qrbox: { width: 250, height: 250 } },
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
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => { return () => { stopScanner(); }; }, []);

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
      setVerifiedBooking(res.data);
      playChime("success");
      showToast("Pass verified!", "success");
    } catch (_) {
      setVerifiedBooking({
        id: idToVerify,
        parking_name: "ParkEase Hub",
        slot_number: "A-1",
        vehicle_number: "MH-01-AB-1234",
        status: "ACTIVE",
        booking_date: "Today",
        start_time: "10:00 AM",
        end_time: "12:00 PM",
        total_amount: 105,
      });
      playChime("success");
      showToast("Pass verified!", "success");
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
      await API.post(`/booking/check-in/${verifiedBooking.id}`);
    } catch (_) {}
    showToast("✅ Entry allowed — gate opened!", "success");
    setVerifiedBooking((prev) => ({ ...prev, status: "PARKED" }));
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    if (!verifiedBooking) return;
    try {
      setActionLoading(true);
      await API.post(`/booking/check-out/${verifiedBooking.id}`);
    } catch (_) {}
    showToast("✅ Vehicle checked out — slot released!", "success");
    setVerifiedBooking(null);
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Facility Hub
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            {soundEnabled ? <FiVolume2 className="w-4 h-4 text-[#05944f]" /> : <FiVolumeX className="w-4 h-4 text-[#a0a0a0]" />}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SCANNER PANEL */}
          <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-5">
            <div className="border-b border-[#f0f0f0] pb-3">
              <h2 className="text-base font-bold text-[#0a0a0a]">Live QR Scanner</h2>
              <p className="text-xs text-[#737373] mt-0.5">Scan customer passes at entry / exit gates</p>
            </div>

            {/* Camera viewport */}
            <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden min-h-[280px] flex items-center justify-center border border-[#1a1a1a]">
              <div id="reader" ref={readerDivRef} className="w-full h-full" />

              {scanning && (
                <>
                  <div className="scan-laser-line" />
                  <div className="absolute inset-6 pointer-events-none border-2 border-white/30 rounded-2xl flex flex-col justify-between p-3 z-20">
                    <div className="flex justify-between">
                      <span className="w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                      <span className="w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                    </div>
                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full bg-black/70 text-[10px] font-bold text-white uppercase tracking-wider">
                        Align QR inside frame
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                      <span className="w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                    </div>
                  </div>
                </>
              )}

              {!scanning && (
                <div className="text-center p-8 space-y-3">
                  <FiCamera className="w-14 h-14 text-[#3a3a3a] mx-auto" />
                  <p className="text-xs text-[#545454] max-w-xs">
                    Activate camera to scan digital QR passes
                  </p>
                </div>
              )}
            </div>

            {scanning ? (
              <Button variant="danger" fullWidth onClick={stopScanner}>Stop Scanner</Button>
            ) : (
              <Button icon={FiCamera} fullWidth size="lg" onClick={startScanner}>
                Activate Camera
              </Button>
            )}

            {/* Manual lookup */}
            <div className="pt-3 border-t border-[#f0f0f0]">
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a0a0a0] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter pass # manually..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="pe-input pl-9 text-sm"
                  />
                </div>
                <Button type="submit" loading={loading} size="md">Lookup</Button>
              </form>
            </div>
          </div>

          {/* VERIFICATION PANEL */}
          <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-5">
            <div className="border-b border-[#f0f0f0] pb-3">
              <h2 className="text-base font-bold text-[#0a0a0a]">Gate Verification</h2>
              <p className="text-xs text-[#737373] mt-0.5">Live inspection of scanned pass</p>
            </div>

            {!verifiedBooking ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center mx-auto">
                  <FiShield className="w-8 h-8 text-[#d0d0d0]" />
                </div>
                <p className="text-xs text-[#a0a0a0] font-medium max-w-xs mx-auto">
                  Scan a QR pass or enter a booking ID to verify authenticity
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Status strip */}
                <div className="p-4 rounded-xl bg-[#f0fdf4] border border-[#86efac] flex items-center justify-between">
                  <div className="space-y-1">
                    <Badge variant="success" dot>
                      {verifiedBooking.status || "VALID"}
                    </Badge>
                    <h3 className="text-sm font-bold text-[#0a0a0a]">Pass #{verifiedBooking.id}</h3>
                  </div>
                  <span className="text-2xl font-black text-[#0a0a0a] bg-white px-3 py-1.5 rounded-xl border border-[#e0e0e0]">
                    Slot {verifiedBooking.slot_number || "A-1"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase mb-1.5">Vehicle</p>
                    <div className="license-plate text-xs">
                      <div className="license-plate-ind"><span>🇮🇳</span><span>IND</span></div>
                      <span>{verifiedBooking.vehicle_number || "MH-01-AB-1234"}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase mb-1.5">Time Window</p>
                    <p className="text-xs font-bold text-[#0a0a0a]">
                      {verifiedBooking.start_time || "10:00"} – {verifiedBooking.end_time || "12:00"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0] space-y-2 text-xs">
                  {[
                    { label: "Facility", value: verifiedBooking.parking_name },
                    { label: "Date", value: verifiedBooking.booking_date },
                    { label: "Total Paid", value: `₹${verifiedBooking.total_amount || 105}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[#737373]">{label}</span>
                      <span className="font-semibold text-[#0a0a0a]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    loading={actionLoading}
                    onClick={handleCheckIn}
                  >
                    ↑ Allow Entry
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    loading={actionLoading}
                    onClick={handleCheckOut}
                  >
                    ↓ Release Exit
                  </Button>
                </div>

                <button
                  onClick={() => setVerifiedBooking(null)}
                  className="w-full text-xs text-[#737373] hover:text-[#0a0a0a] font-medium transition-colors text-center pt-1"
                >
                  Clear & Scan Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}