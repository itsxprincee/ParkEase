import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiMapPin,
  FiCheckCircle,
  FiRefreshCw,
  FiNavigation,
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiTruck,
  FiShield,
  FiShare2,
  FiCompass,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { CardSkeleton } from "../../components/Skeleton";
import FindMyCarModal from "../../components/FindMyCarModal";

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

// ── Date Formatter ────────────────────────────────────────────────────────────
function formatPassDate(dateVal) {
  if (!dateVal) return "Today";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return String(dateVal).split("T")[0] || "Today";
    }
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return String(dateVal).split("T")[0] || "Today";
  }
}

export default function QRCode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qrRef = useRef(null);

  const queryBookingId = searchParams.get("booking");
  const stateBookingId = location.state?.bookingId || location.state?.booking?.id;
  const targetBookingId = queryBookingId || stateBookingId;

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [showLocateModal, setShowLocateModal] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBooking = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (!booking) setLoading(true);
      const response = await API.get("/booking/my-bookings");
      const list = Array.isArray(response.data) ? response.data : response.data?.bookings || [];
      let found = targetBookingId ? list.find((item) => String(item.id) === String(targetBookingId)) : null;
      if (!found && targetBookingId && list.length > 0) {
        found = list[0];
        showToast(`Pass #${targetBookingId} not found. Showing your active pass #${found.id}.`, "error");
      } else if (!found && list.length > 0) {
        found = list[0];
      }
      setBooking(found);
    } catch (_) {
      showToast("Unable to load pass.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBooking(); }, [targetBookingId]);

  const handleDownloadQR = () => {
    try {
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) return showToast("QR not ready.", "error");
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `ParkEase-Pass-${booking?.id || "ticket"}.png`;
      link.click();
      showToast("Pass QR downloaded to device!", "success");
    } catch (_) {
      showToast("Download failed.", "error");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ParkEase Pass #${booking?.id} - Spot ${booking?.slot_number}`,
          text: `My ParkEase reservation at ${booking?.parking_name}, Spot ${booking?.slot_number}.`,
          url: window.location.href,
        });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Pass link copied to clipboard!", "success");
    }
  };

  const qrValue = JSON.stringify({
    type: "PARKEASE_BOOKING",
    booking_id: booking?.id,
    user_id: booking?.user_id,
    parking_location_id: booking?.parking_location_id || booking?.parking_id,
    slot_id: booking?.slot_id,
    slot: booking?.slot_number,
    vehicle: booking?.vehicle_number || booking?.vehicle || "MH-01-AB-1234",
    facility: booking?.parking_name,
    date: booking?.booking_date,
    pass_type: booking?.pass_type || "HOURLY",
    last_exit_rule: booking?.last_exit_rule,
    valid: true,
  });

  const isDaily = booking?.pass_type === "DAILY_PASS";
  const isInside = booking?.is_inside;
  const statusUpper = String(booking?.status || "ACTIVE").toUpperCase();
  const vehiclePlate = booking?.vehicle_number || booking?.vehicle || "MH-01-AB-1234";

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#08080c] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/my-bookings")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>My Bookings</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer"
              title="Share Pass"
            >
              <FiShare2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => loadBooking(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !booking ? (
          <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">No Active Pass Found</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              You don't have an active booking. Book a parking spot to get your instant QR pass.
            </p>
            <Button onClick={() => navigate("/customer/dashboard")} variant="primary">Find Parking</Button>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════
             DIGITAL PARKING BOARDING PASS CARD (AIRLINE & WALLET STYLE)
          ══════════════════════════════════════════════════════════════════ */
          <div id="printable-receipt" className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl overflow-hidden">

            {/* Dark Brand Header */}
            <div className="bg-gradient-to-r from-[#090b10] via-zinc-950 to-black text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    {isDaily ? "🎟️ Full-Day Pass" : "⏱️ Hourly Parking"}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono font-black">Pass #{booking.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {booking.parking_name || "ParkEase Hub"}
                </h2>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                  <FiMapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{booking.parking_address || "City Center Location"}</span>
                </p>
              </div>

              {/* Assigned Spot Badge */}
              <div className="text-left sm:text-right bg-zinc-900 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto border border-zinc-800 sm:border-0">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Assigned Bay</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                  {booking.slot_number || "A-01"}
                </p>
              </div>
            </div>

            {/* Perforated Ticket Notch Divider */}
            <div className="relative flex items-center justify-between px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-y border-dashed border-zinc-200 dark:border-zinc-750">
              <div className="w-5 h-8 rounded-r-full bg-slate-50/80 dark:bg-[#08080c] border-r border-t border-b border-zinc-200 dark:border-zinc-750 -ml-6 shadow-inner" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">
                  Scan at Automated Gate Barrier
                </span>
              </div>
              <div className="w-5 h-8 rounded-l-full bg-slate-50/80 dark:bg-[#08080c] border-l border-t border-b border-zinc-200 dark:border-zinc-750 -mr-6 shadow-inner" />
            </div>

            {/* Day Pass Alert Banner */}
            {isDaily && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <FiCheckCircle className="w-4 h-4" />
                    Full-Day Pass Active (Entry #{booking.entry_count || 1})
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    Unlimited daily entries & exits allowed using this QR pass.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-500/30 text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                  Must exit before: {booking.last_exit_rule || "11:00 PM"}
                </div>
              </div>
            )}

            {/* Ticket Body */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* QR Code Container */}
              <div className="flex flex-col items-center space-y-3 shrink-0">
                <div ref={qrRef} className="p-4 bg-white rounded-3xl border-2 border-zinc-900 dark:border-zinc-700 shadow-xl">
                  <QRCodeCanvas value={qrValue} size={180} level="H" includeMargin={false} />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black">
                  {statusUpper === "COMPLETED" ? (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Checked Out
                    </span>
                  ) : isInside ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Vehicle Parked Inside
                    </span>
                  ) : (
                    <span className="text-sky-500 flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5" /> Ready for Check-in
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata Details & Actions */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Date
                    </p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">
                      {formatPassDate(booking.booking_date)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      {isDaily ? "Valid Until" : "Time Window"}
                    </p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white truncate">
                      {isDaily
                        ? `Before ${booking.last_exit_rule || "11:00 PM"}`
                        : `${booking.start_time || "10:00 AM"} – ${booking.end_time || "12:00 PM"}`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Plan</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">
                      {isDaily ? "Full-Day Pass" : `${booking.duration_hours || 2} Hours`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{booking.amount || booking.total_amount || 40}
                    </p>
                  </div>
                </div>

                {/* Vehicle License Plate Display */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Registered Vehicle
                    </p>
                    <div className="license-plate text-xs shrink-0 shadow-xs inline-flex">
                      <span className="license-plate-ind">IND</span>
                      <span className="font-mono font-black tracking-wider">
                        {vehiclePlate}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusUpper === "COMPLETED" ? "default" : "success"} dot>
                    {statusUpper}
                  </Badge>
                </div>

                {/* Integrated Tax Receipt & Payment Breakdown */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-750 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60 dark:border-zinc-700">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <FiPrinter className="w-3.5 h-3.5 text-emerald-500" />
                      Payment & Tax Invoice
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      PAID ✓
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Parking Rate ({booking.duration_hours || 2}h)</span>
                    <span className="font-mono text-zinc-900 dark:text-white">
                      ₹{Math.max(0, (booking.amount || booking.total_amount || 40) - 5)}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Convenience & Platform Fee</span>
                    <span className="font-mono text-zinc-900 dark:text-white">₹5.00</span>
                  </div>

                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>GST (18% Included)</span>
                    <span className="font-mono text-zinc-900 dark:text-white">
                      ₹{Math.round((booking.amount || booking.total_amount || 40) * 0.18)}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700 flex justify-between font-black text-zinc-900 dark:text-white">
                    <span>Total Paid</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{booking.amount || booking.total_amount || 40}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const dest = booking.parking_latitude && booking.parking_longitude
                          ? `${booking.parking_latitude},${booking.parking_longitude}`
                          : encodeURIComponent(booking.parking_name || "Parking");
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
                      }}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <FiNavigation className="w-4 h-4" />
                      <span>Get Directions</span>
                    </button>

                    <button
                      onClick={() => setShowLocateModal(true)}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer border border-zinc-800 dark:border-zinc-200"
                    >
                      <FiCompass className="w-4 h-4 text-emerald-400" />
                      <span>
                        {String(booking.vehicle_type || "").toLowerCase().includes("bike")
                          ? "Locate My Bike Spot"
                          : "Locate My Car Spot"}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      <span>Save QR Pass</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                      <span>Print Tax Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIND MY CAR / BIKE MODAL */}
        <FindMyCarModal
          isOpen={showLocateModal}
          onClose={() => setShowLocateModal(false)}
          booking={booking}
        />
      </main>
    </div>
  );
}