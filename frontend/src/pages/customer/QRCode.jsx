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
    valid: true,
  });

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/my-bookings")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            My Passes
          </button>
          <button
            onClick={() => loadBooking(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !booking ? (
          <div className="bg-white rounded-2xl border border-[#e0e0e0] p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-8 h-8 text-[#a0a0a0]" />
            </div>
            <h3 className="text-lg font-black text-[#0a0a0a]">No Active Pass</h3>
            <p className="text-sm text-[#737373]">
              You don't have an active booking. Reserve a spot to get your digital QR pass.
            </p>
            <Button onClick={() => navigate("/customer/dashboard")}>Find Parking</Button>
          </div>
        ) : (
          /* DIGITAL TICKET */
          <div id="printable-receipt" className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">

            {/* Dark header */}
            <div className="bg-[#0a0a0a] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#05944f] text-[10px] font-black uppercase tracking-wider">
                    Verified Ticket
                  </span>
                  <span className="text-xs text-[#545454] font-medium">Pass #{booking.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {booking.parking_name || "ParkEase Facility"}
                </h2>
                <p className="text-xs text-[#545454] flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-[#a0a0a0] shrink-0" />
                  {booking.parking_address || "Central Zone"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#545454] uppercase tracking-widest font-bold">Slot</p>
                <p className="text-4xl font-black text-white">{booking.slot_number || "A-1"}</p>
              </div>
            </div>

            {/* Perforated divider */}
            <div className="relative flex items-center justify-between px-6 py-2 bg-[#f7f7f7] border-y border-dashed border-[#e0e0e0]">
              <div className="w-4 h-8 rounded-r-full bg-white border-r border-t border-b border-[#e0e0e0] -ml-6" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#a0a0a0]">
                Present at barrier gate
              </span>
              <div className="w-4 h-8 rounded-l-full bg-white border-l border-t border-b border-[#e0e0e0] -mr-6" />
            </div>

            {/* Ticket body */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* QR Code */}
              <div className="flex flex-col items-center space-y-3 shrink-0">
                <div ref={qrRef} className="p-4 bg-white rounded-xl border-2 border-[#0a0a0a] shadow-sm">
                  <QRCodeCanvas value={qrValue} size={180} level="H" includeMargin={false} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#05944f] font-semibold">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Ready for scanning
                </div>
              </div>

              {/* Details + Actions */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Date", value: booking.booking_date || "Today" },
                    { label: "Time", value: `${booking.start_time || "10:00"} – ${booking.end_time || "12:00"}` },
                    { label: "Duration", value: `${booking.duration_hours || 2}h` },
                    { label: "Total Paid", value: `₹${booking.total_amount || 105}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0]">
                      <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-bold text-[#0a0a0a]">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Vehicle plate */}
                <div className="p-3 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0]">
                  <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Vehicle</p>
                  <div className="license-plate">
                    <div className="license-plate-ind">
                      <span>🇮🇳</span>
                      <span>IND</span>
                    </div>
                    <span>{booking.vehicle_number || "MH 01 AB 1234"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const dest = booking.parking_latitude && booking.parking_longitude
                        ? `${booking.parking_latitude},${booking.parking_longitude}`
                        : encodeURIComponent(booking.parking_name || "Parking");
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#0a0a0a] text-xs font-bold transition-colors"
                  >
                    <FiNavigation className="w-4 h-4" />
                    Get Directions
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#0a0a0a] text-xs font-bold transition-colors"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0a0a0a] hover:bg-[#242424] text-white text-xs font-bold transition-colors"
                    >
                      <FiPrinter className="w-3.5 h-3.5" />
                      Print
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