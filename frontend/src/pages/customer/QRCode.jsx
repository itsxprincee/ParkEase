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
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col font-sans">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/my-bookings")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-all shadow-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            My Passes
          </button>
          <button
            onClick={() => loadBooking(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-all shadow-xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Live Sync
          </button>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !booking ? (
          <div className="bg-white rounded-3xl border border-[#e0e0e0] p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-8 h-8 text-[#a0a0a0]" />
            </div>
            <h3 className="text-lg font-black text-[#0a0a0a]">No Active Pass Found</h3>
            <p className="text-sm text-[#737373]">
              You don't have an active booking. Reserve a spot to get your digital gate QR pass.
            </p>
            <Button onClick={() => navigate("/customer/dashboard")}>Explore Parking</Button>
          </div>
        ) : (
          /* DIGITAL BOARDING PASS CARD */
          <div id="printable-receipt" className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">

            {/* Dark header */}
            <div className="bg-[#0a0a0a] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#05944f] text-[10px] font-black uppercase tracking-wider border border-[#05944f]/30">
                    {isDaily ? "🎟️ Unlimited Day Pass" : "⏱️ Hourly Parking Pass"}
                  </span>
                  <span className="text-xs text-[#737373] font-mono font-bold">Pass #{booking.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {booking.parking_name || "ParkEase Facility"}
                </h2>
                <p className="text-xs text-[#a0a0a0] flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-[#05944f] shrink-0" />
                  {booking.parking_address || "City Center Parking Zone"}
                </p>
              </div>
              <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto">
                <p className="text-[10px] text-[#a0a0a0] uppercase tracking-widest font-bold">Designated Slot</p>
                <p className="text-3xl sm:text-4xl font-black text-white font-mono">{booking.slot_number || "A-1"}</p>
              </div>
            </div>

            {/* Perforated divider */}
            <div className="relative flex items-center justify-between px-6 py-2.5 bg-[#f7f7f7] border-y border-dashed border-[#e0e0e0]">
              <div className="w-5 h-8 rounded-r-full bg-[#f7f7f7] border-r border-t border-b border-[#e0e0e0] -ml-6 shadow-inner" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#05944f] animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#545454]">
                  Present at Entry / Exit Gate Reader
                </span>
              </div>
              <div className="w-5 h-8 rounded-l-full bg-[#f7f7f7] border-l border-t border-b border-[#e0e0e0] -mr-6 shadow-inner" />
            </div>

            {/* Day Pass Curfew & Multi-Entry Alert */}
            {isDaily && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-[#f0fdf4] border border-[#86efac] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-[#05944f] flex items-center gap-1.5">
                    <FiCheckCircle className="w-4 h-4" />
                    Unlimited Multi-Entry Active (Entry #{booking.entry_count || 1})
                  </p>
                  <p className="text-xs text-[#545454]">
                    Drive in and out freely all day. Valid until final gate exit.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-white border border-[#86efac] text-xs font-black text-[#b45309] shrink-0">
                  Curfew: {booking.last_exit_rule || "11:00 PM"}
                </div>
              </div>
            )}

            {/* Ticket body */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* QR Code */}
              <div className="flex flex-col items-center space-y-3 shrink-0">
                <div ref={qrRef} className="p-4 bg-white rounded-2xl border-2 border-[#0a0a0a] shadow-md">
                  <QRCodeCanvas value={qrValue} size={180} level="H" includeMargin={false} />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {statusUpper === "COMPLETED" ? (
                    <span className="text-[#737373] flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5 text-[#05944f]" /> Completed Exit
                    </span>
                  ) : isInside ? (
                    <span className="text-[#05944f] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#05944f] animate-ping" /> Currently Inside Deck
                    </span>
                  ) : (
                    <span className="text-[#276ef1] flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5" /> Ready for Gate Entry
                    </span>
                  )}
                </div>
              </div>

              {/* Details + Actions */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-[#f7f7f7] border border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-black text-[#0a0a0a]">{booking.booking_date || "Today"}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f7f7f7] border border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">
                      {isDaily ? "Gate Curfew" : "Time Window"}
                    </p>
                    <p className="text-sm font-black text-[#0a0a0a]">
                      {isDaily ? `Before ${booking.last_exit_rule || "11:00 PM"}` : `${booking.start_time || "10:00"} – ${booking.end_time || "12:00"}`}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f7f7f7] border border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Plan</p>
                    <p className="text-sm font-black text-[#0a0a0a]">
                      {isDaily ? "Full-Day Pass" : `${booking.duration_hours || 2} Hours`}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f7f7f7] border border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-sm font-black text-[#05944f]">₹{booking.amount || booking.total_amount || 15}</p>
                  </div>
                </div>

                {/* Vehicle plate */}
                <div className="p-3.5 rounded-2xl bg-[#f7f7f7] border border-[#f0f0f0] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Registered Plate</p>
                    <span className="font-mono text-sm font-black text-[#0a0a0a] bg-[#e0e0e0] px-2.5 py-0.5 rounded-md">
                      {booking.vehicle_number || "MH-01-AB-1234"}
                    </span>
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
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0a0a0a] hover:bg-[#242424] text-white text-xs font-black transition-all shadow-xs"
                  >
                    <FiNavigation className="w-4 h-4 text-[#05944f]" />
                    Turn-by-Turn GPS Directions
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#0a0a0a] text-xs font-bold transition-colors"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      Save Pass PNG
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#0a0a0a] text-xs font-bold transition-colors"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                      Print Receipt
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