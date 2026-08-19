import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  FaArrowLeft,
  FaParking,
  FaMapMarkerAlt,
  FaCar,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaDownload,
  FaPrint,
  FaSyncAlt,
  FaExclamationTriangle,
  FaShieldAlt,
  FaTicketAlt,
  FaDirections,
} from "react-icons/fa";
import API from "../../api/axios";

function QRCode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const queryBookingId = searchParams.get("booking");
  const stateBookingId = location.state?.bookingId || location.state?.booking?.id;
  const targetBookingId = queryBookingId || stateBookingId;

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [refreshing, setRefreshing] = useState(false);

  const loadBooking = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!booking) {
        setLoading(true);
      }

      const response = await API.get("/booking/my-bookings");
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.bookings || [];

      let selectedBooking = null;

      if (targetBookingId) {
        selectedBooking = list.find(
          (item) => String(item.id) === String(targetBookingId)
        );
      }

      if (!selectedBooking && list.length > 0) {
        selectedBooking =
          list.find(
            (item) =>
              String(item.status).toUpperCase() === "ACTIVE" ||
              String(item.status).toUpperCase() === "BOOKED" ||
              String(item.status).toUpperCase() === "CONFIRMED"
          ) || list[0];
      }

      if (selectedBooking) {
        setBooking(selectedBooking);
      }
    } catch (error) {
      console.error("Failed to load QR booking:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [targetBookingId]);

  const downloadQR = () => {
    const canvas = document.getElementById("parkease-qr-canvas");
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `ParkEase-Pass-Booking-${booking?.id || "Ticket"}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const printTicket = () => {
    window.print();
  };

  const status = String(booking?.status || "BOOKED").toUpperCase();
  const isActive = status === "ACTIVE" || status === "PARKED" || status === "CHECKED_IN";
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";

  const getPassHeaderConfig = () => {
    if (isActive) {
      return {
        tag: "EXIT PASS & PARKED",
        tagBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
        instruction: "Show this QR at the exit gate for seamless check-out",
        icon: <FaCar className="text-emerald-600" />,
        stepTitle: "Step 2: Exit & Release Slot",
      };
    }

    if (isCompleted) {
      return {
        tag: "COMPLETED RECEIPT",
        tagBg: "bg-slate-100 text-slate-700 border-slate-300",
        instruction: "Vehicle has checked out. Thank you for using ParkEase!",
        icon: <FaCheckCircle className="text-emerald-600" />,
        stepTitle: "Booking Completed",
      };
    }

    if (isCancelled) {
      return {
        tag: "CANCELLED",
        tagBg: "bg-red-100 text-red-700 border-red-300",
        instruction: "This reservation was cancelled.",
        icon: <FaExclamationTriangle className="text-red-600" />,
        stepTitle: "Reservation Cancelled",
      };
    }

    return {
      tag: "ENTRY PASS",
      tagBg: "bg-blue-100 text-blue-800 border-blue-300",
      instruction: "Present this QR at the entrance for quick vehicle check-in",
      icon: <FaTicketAlt className="text-blue-600" />,
      stepTitle: "Step 1: Check-in at Entry",
    };
  };

  const passConfig = getPassHeaderConfig();

  const qrPayload = JSON.stringify({
    type: "PARKEASE_BOOKING",
    booking_id: booking?.id,
    user_id: booking?.user_id,
    parking_id: booking?.parking_id || booking?.parking_location_id,
    slot_id: booking?.slot_id,
    slot_number: booking?.slot_number,
    status: booking?.status,
    booking_date: booking?.booking_date,
    start_time: booking?.start_time,
    end_time: booking?.end_time,
    amount: booking?.amount,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin" />
          <p className="mt-4 text-slate-600 font-medium text-sm">
            Generating your Digital Parking Pass...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-8 text-center text-slate-800 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-3xl mb-4 border border-red-200">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">No Active Booking Found</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            You don't have any selected booking right now. Please reserve a new slot or check your bookings history.
          </p>
          <button
            onClick={() => navigate("/customer/my-bookings")}
            className="mt-6 w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md shadow-blue-500/20"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 flex flex-col items-center justify-center text-slate-800 print:bg-white print:p-0 font-sans">
      
      {/* TOP NAV BAR */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/customer/my-bookings")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition text-sm font-semibold shadow-sm"
        >
          <FaArrowLeft /> My Bookings
        </button>

        <button
          onClick={() => loadBooking(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition text-sm font-semibold shadow-sm"
          title="Refresh Pass Status"
        >
          <FaSyncAlt className={refreshing ? "animate-spin text-blue-600" : ""} />
          {refreshing ? "Updating..." : "Live Status"}
        </button>
      </div>

      {/* MAIN PASS CONTAINER (Light Theme Ticket) */}
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        
        {/* PASS HEADER / BANNER */}
        <div className="p-6 sm:p-7 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-blue-500/20">
                <FaParking />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  ParkEase Pass
                </h1>
                <p className="text-xs text-slate-500">
                  Booking #{booking.id}
                </p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${passConfig.tagBg}`}>
              {passConfig.tag}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-extrabold text-lg text-slate-900 leading-snug">
                {booking.parking_name || "Smart Parking Facility"}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <FaMapMarkerAlt className="text-blue-600 shrink-0" />
                <span className="truncate">{booking.address || "Verified Parking Hub"}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Assigned Slot
              </span>
              <span className="inline-block mt-0.5 px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-base shadow-sm">
                {booking.slot_number ? booking.slot_number : `Slot #${booking.slot_id || "A1"}`}
              </span>
            </div>
          </div>
        </div>

        {/* PASS BODY */}
        <div className="p-6 sm:p-7 flex flex-col items-center">
          
          {/* QR CODE */}
          <div className="relative p-4 bg-white rounded-3xl shadow-md border-2 border-slate-200">
            <QRCodeCanvas
              id="parkease-qr-canvas"
              value={qrPayload}
              size={210}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={true}
            />

            {isActive && (
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                PARKED
              </div>
            )}
          </div>

          {/* INSTRUCTION CARD */}
          <div className={`mt-6 w-full p-4 rounded-2xl border text-center ${
            isActive
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : isCompleted
              ? "bg-slate-50 border-slate-200 text-slate-700"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}>
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              {passConfig.icon}
              <span>{passConfig.stepTitle}</span>
            </div>
            <p className="text-xs mt-1 text-slate-600 leading-relaxed">
              {passConfig.instruction}
            </p>
          </div>

          {/* PERFORATED TICKET DIVIDER */}
          <div className="relative w-full my-6 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-slate-200" />
            <span className="absolute px-3 bg-white text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Booking Details
            </span>
          </div>

          {/* DETAILS GRID */}
          <div className="w-full grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <FaCalendarAlt className="text-blue-600" /> Booking Date
              </span>
              <p className="font-bold text-slate-900 mt-1">
                {booking.booking_date
                  ? new Date(booking.booking_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Today"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <FaClock className="text-blue-600" /> Time Window
              </span>
              <p className="font-bold text-slate-900 mt-1 truncate">
                {booking.start_time || "00:00"} - {booking.end_time || "23:59"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <FaCar className="text-blue-600" /> Vehicle
              </span>
              <p className="font-bold text-slate-900 mt-1 truncate">
                {booking.vehicle_number || "4-Wheeler"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <FaShieldAlt className="text-emerald-600" /> Pass Status
              </span>
              <p className={`font-bold mt-1 ${
                isActive ? "text-emerald-600" : isCompleted ? "text-slate-500" : "text-blue-600"
              }`}>
                {booking.status || "CONFIRMED"}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 w-full flex items-center gap-3 print:hidden">
            <button
              onClick={downloadQR}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition"
            >
              <FaDownload /> Save Pass
            </button>

            <button
              onClick={printTicket}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition"
            >
              <FaPrint /> Print
            </button>
          </div>

          {booking.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                (booking.parking_name || "") + " " + booking.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20 print:hidden"
            >
              <FaDirections /> Navigate to Parking
            </a>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400 print:hidden flex items-center gap-1.5">
        <FaShieldAlt /> Secured by ParkEase FastPass™ System
      </div>
    </div>
  );
}

export default QRCode;