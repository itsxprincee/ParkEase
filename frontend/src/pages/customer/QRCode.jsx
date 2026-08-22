import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiShield,
  FiRefreshCw,
  FiNavigation,
  FiAlertCircle,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";

export default function QRCode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qrRef = useRef(null);

  const queryBookingId = searchParams.get("booking");
  const stateBookingId =
    location.state?.bookingId || location.state?.booking?.id;
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
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.bookings || [];

      let found = null;
      if (targetBookingId) {
        found = list.find((item) => String(item.id) === String(targetBookingId));
      }
      if (!found && list.length > 0) {
        found = list[0];
      }

      setBooking(found);
    } catch (error) {
      console.error("Failed to load booking pass:", error);
      showToast("Unable to load booking pass.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [targetBookingId]);

  const handleDownloadQR = () => {
    try {
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) {
        showToast("QR Code image not ready.", "error");
        return;
      }
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `ParkEase-Pass-${booking?.id || "ticket"}.png`;
      link.click();
      showToast("Pass QR downloaded successfully!", "success");
    } catch (e) {
      console.error("Download error:", e);
      showToast("Failed to download image.", "error");
    }
  };

  const qrValue = JSON.stringify({
    app: "ParkEase",
    booking_id: booking?.id,
    slot: booking?.slot_number,
    vehicle: booking?.vehicle_number,
    facility: booking?.parking_name,
    date: booking?.booking_date,
    valid: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <SaaSNavbar />

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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* BACK & ACTIONS */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/my-bookings")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>My Bookings</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FiRefreshCw}
              loading={refreshing}
              onClick={() => loadBooking(true)}
            >
              Sync Pass
            </Button>
          </div>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !booking ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <FiAlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">
              No Active Pass Found
            </h3>
            <p className="text-xs text-slate-500">
              You do not have an active booking session. Reserve a parking spot to get your digital entry QR ticket.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/customer/dashboard")}
            >
              Explore Parking Spots
            </Button>
          </div>
        ) : (
          /* DIGITAL BOARDING PASS TICKET */
          <div
            id="printable-receipt"
            className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden"
          >
            {/* TICKET TOP HEADER */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm" dot>
                    Verified Digital Ticket
                  </Badge>
                  <span className="text-xs font-semibold text-slate-300">
                    Pass #{booking.id}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {booking.parking_name || "ParkEase Smart Facility"}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{booking.parking_address || "Central Zone"}</span>
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                  Designated Spot
                </span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-400">
                  {booking.slot_number || "A-1"}
                </span>
              </div>
            </div>

            {/* CUT-OUT TICKETS DIVIDER */}
            <div className="relative flex items-center justify-between px-6 py-2 bg-slate-100/60 border-y border-dashed border-slate-200">
              <div className="w-4 h-8 rounded-r-full bg-slate-50 border-r border-t border-b border-slate-200 -ml-6" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                Hold under scanner at barrier gate
              </span>
              <div className="w-4 h-8 rounded-l-full bg-slate-50 border-l border-t border-b border-slate-200 -mr-6" />
            </div>

            {/* TICKET BODY: QR CODE + METRICS */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* QR CODE CONTAINER */}
              <div className="flex flex-col items-center space-y-3">
                <div
                  ref={qrRef}
                  className="p-4 bg-white rounded-2xl border-2 border-indigo-500 shadow-md flex items-center justify-center"
                >
                  <QRCodeCanvas
                    value={qrValue}
                    size={190}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Ready for Instant Gate Scanning</span>
                </div>
              </div>

              {/* TICKET DETAILS MATRIX */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Booking Date
                    </span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                      {booking.booking_date || "Today"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Time Slot
                    </span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                      {booking.start_time || "10:00"} - {booking.end_time || "12:00"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Registered Vehicle
                    </span>
                    <div className="license-plate mt-1 text-xs">
                      <span className="license-plate-ind">IND</span>
                      <span>{booking.vehicle_number || "MH 01 AB 1234"}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Fare Paid
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-1 block">
                      ₹{booking.total_amount || 105}.00
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (booking.parking_latitude && booking.parking_longitude) {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${booking.parking_latitude},${booking.parking_longitude}`,
                          "_blank"
                        );
                      } else {
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.parking_name || booking.parking_address || "Parking")}`,
                          "_blank"
                        );
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition active:scale-95"
                  >
                    <FiNavigation className="w-4 h-4 text-indigo-600" />
                    <span>Get Turn-by-Turn Directions in Google Maps</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="md"
                      icon={FiDownload}
                      onClick={handleDownloadQR}
                    >
                      Save Image
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      icon={FiPrinter}
                      onClick={() => window.print()}
                    >
                      Print Ticket
                    </Button>
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