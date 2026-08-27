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
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { CardSkeleton } from "../../components/Skeleton";

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
      if (!found && list.length > 0) found = list[0];
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
      showToast("Pass QR downloaded!", "success");
    } catch (_) {
      showToast("Download failed.", "error");
    }
  };

  const qrValue = JSON.stringify({
    type: "PARKEASE_BOOKING",
    booking_id: booking?.id,
    user_id: booking?.user_id,
    parking_location_id: booking?.parking_location_id || booking?.parking_id,
    slot_id: booking?.slot_id,
    slot: booking?.slot_number,
    vehicle: booking?.vehicle_number,
    facility: booking?.parking_name,
    date: booking?.booking_date,
    pass_type: booking?.pass_type || "HOURLY",
    last_exit_rule: booking?.last_exit_rule,
    valid: true,
  });

  const isDaily = booking?.pass_type === "DAILY_PASS";
  const isInside = booking?.is_inside;
  const statusUpper = String(booking?.status || "ACTIVE").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/my-bookings")}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>My Bookings</span>
          </button>
          <button
            onClick={() => loadBooking(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
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
              You don't have an active booking. Book a parking spot to get your QR pass.
            </p>
            <Button onClick={() => navigate("/customer/dashboard")} variant="primary">Find Parking</Button>
          </div>
        ) : (
          /* DIGITAL PARKING PASS CARD */
          <div id="printable-receipt" className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl overflow-hidden">

            {/* Dark header */}
            <div className="bg-gradient-to-r from-zinc-950 via-[#0d0d14] to-black text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    {isDaily ? "🎟️ Full-Day Pass" : "⏱️ Hourly Parking"}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono font-bold">Pass #{booking.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {booking.parking_name || "Parking Location"}
                </h2>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{booking.parking_address || "City Location"}</span>
                </p>
              </div>
              <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Assigned Spot</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">{booking.slot_number || "A-1"}</p>
              </div>
            </div>

            {/* Perforated divider */}
            <div className="relative flex items-center justify-between px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-y border-dashed border-zinc-200 dark:border-zinc-700">
              <div className="w-5 h-8 rounded-r-full bg-slate-50/80 dark:bg-[#0a0a0f] border-r border-t border-b border-zinc-200 dark:border-zinc-700 -ml-6 shadow-inner" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400">
                  Scan at Parking Gate
                </span>
              </div>
              <div className="w-5 h-8 rounded-l-full bg-slate-50/80 dark:bg-[#0a0a0f] border-l border-t border-b border-zinc-200 dark:border-zinc-700 -mr-6 shadow-inner" />
            </div>

            {/* Day Pass Alert */}
            {isDaily && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <FiCheckCircle className="w-4 h-4" />
                    Full-Day Pass Active (Entry #{booking.entry_count || 1})
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Drive in and out freely all day. Valid until final exit tonight.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-500/30 text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                  Must exit before: {booking.last_exit_rule || "11:00 PM"}
                </div>
              </div>
            )}

            {/* Ticket body */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* QR Code */}
              <div className="flex flex-col items-center space-y-3 shrink-0">
                <div ref={qrRef} className="p-4 bg-white rounded-3xl border-2 border-zinc-900 dark:border-zinc-700 shadow-xl">
                  <QRCodeCanvas value={qrValue} size={180} level="H" includeMargin={false} />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {statusUpper === "COMPLETED" ? (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Checked Out
                    </span>
                  ) : isInside ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Currently Parked
                    </span>
                  ) : (
                    <span className="text-sky-500 flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5" /> Ready for Check-in
                    </span>
                  )}
                </div>
              </div>

              {/* Details + Actions */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-black font-mono text-zinc-900 dark:text-white">{booking.booking_date || "Today"}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      {isDaily ? "Valid Until" : "Time Window"}
                    </p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white truncate">
                      {isDaily ? `Before ${booking.last_exit_rule || "11:00 PM"}` : `${booking.start_time || "10:00"} – ${booking.end_time || "12:00"}`}
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
                    <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">₹{booking.amount || booking.total_amount || 15}</p>
                  </div>
                </div>

                {/* Vehicle plate */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Vehicle Number</p>
                    <div className="license-plate text-xs shrink-0 shadow-xs inline-flex">
                      <span className="license-plate-ind">IND</span>
                      <span className="font-mono font-black tracking-wider">
                        {booking.vehicle_number || "MH-01-AB-1234"}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusUpper === "COMPLETED" ? "default" : "success"} dot>
                    {statusUpper}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      const dest = booking.parking_latitude && booking.parking_longitude
                        ? `${booking.parking_latitude},${booking.parking_longitude}`
                        : encodeURIComponent(booking.parking_name || "Parking");
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <FiNavigation className="w-4 h-4" />
                    <span>Get Directions on Map</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      <span>Save QR Image</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}