import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  FaArrowLeft,
  FaQrcode,
  FaCamera,
  FaStop,
  FaCheckCircle,
  FaTimesCircle,
  FaCar,
  FaParking,
  FaClock,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaSyncAlt,
  FaSearch,
  FaExclamationTriangle,
  FaDoorOpen,
  FaKey,
} from "react-icons/fa";
import API from "../../api/axios";

function ScanQR() {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [manualBookingId, setManualBookingId] = useState("");
  const [verifiedData, setVerifiedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [banner, setBanner] = useState(null);

  const scannerRef = useRef(null);

  const playChime = (type = "success") => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio context may require gesture
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error("Scanner stop error:", error);
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setVerifiedData(null);
      setBanner({
        type: "info",
        title: "Camera Active",
        message: "Align customer's QR code within the scanning frame.",
      });
      setScanning(true);

      const html5Qr = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopScanner();
          handleScannedData(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error("Camera start error:", error);
      setScanning(false);

      const isPerm =
        error?.message?.toLowerCase().includes("permission") ||
        error?.name === "NotAllowedError";

      setBanner({
        type: "error",
        title: "Camera Unavailable",
        message: isPerm
          ? "Camera permission was denied. Please allow camera access or enter the Booking ID manually below."
          : "Unable to access camera. Please enter the Booking ID manually below.",
      });
    }
  };

  const handleScannedData = async (rawText) => {
    let payload = null;

    try {
      payload = JSON.parse(rawText);
    } catch {
      if (!isNaN(rawText) && Number(rawText) > 0) {
        payload = { booking_id: Number(rawText), type: "PARKEASE_BOOKING" };
      }
    }

    if (!payload || !payload.booking_id) {
      setBanner({
        type: "error",
        title: "Invalid QR Code",
        message: "The scanned QR code is not a valid ParkEase booking pass.",
      });
      playChime("error");
      return;
    }

    await verifyBooking(payload.booking_id, payload);
  };

  const verifyBooking = async (bookingId, extraData = {}) => {
    try {
      setLoading(true);
      setBanner(null);

      const response = await API.post("/qr/verify", {
        type: "PARKEASE_BOOKING",
        booking_id: Number(bookingId),
        user_id: extraData.user_id ? Number(extraData.user_id) : null,
        parking_location_id: extraData.parking_id
          ? Number(extraData.parking_id)
          : null,
        slot_id: extraData.slot_id ? Number(extraData.slot_id) : null,
      });

      if (response.data?.success) {
        setVerifiedData(response.data);
        playChime("success");

        const status = String(
          response.data.booking?.status || ""
        ).toUpperCase();

        if (status === "BOOKED" || status === "CONFIRMED") {
          setBanner({
            type: "success",
            title: "Ready for Entry (Check-In)",
            message: "Booking verified! Vehicle is arriving. Click Check-In below.",
          });
        } else if (status === "ACTIVE" || status === "PARKED") {
          setBanner({
            type: "info",
            title: "Parked - Ready for Exit (Check-Out)",
            message: "Vehicle is currently parked. Click Check-Out to release the slot.",
          });
        } else if (status === "COMPLETED") {
          setBanner({
            type: "info",
            title: "Already Completed",
            message: "This booking has already checked out and completed parking.",
          });
        }
      }
    } catch (error) {
      console.error("Verification failed:", error);
      playChime("error");
      setVerifiedData(null);

      setBanner({
        type: "error",
        title: "Verification Failed",
        message:
          error?.response?.data?.detail ||
          "Could not verify this booking. Please ensure this booking belongs to your parking location.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualBookingId.trim()) return;
    verifyBooking(manualBookingId.trim());
  };

  const handleCheckIn = async () => {
    if (!verifiedData?.booking?.id) return;

    try {
      setProcessingAction(true);
      const response = await API.post(
        `/booking/entry/${verifiedData.booking.id}`
      );

      if (response.data?.success) {
        playChime("success");
        setVerifiedData((prev) => ({
          ...prev,
          can_enter: false,
          can_exit: true,
          booking: {
            ...prev.booking,
            status: "ACTIVE",
          },
        }));

        setBanner({
          type: "success",
          title: "Check-In Confirmed! 🚗",
          message:
            response.data?.message ||
            "Vehicle successfully checked in! The slot is marked OCCUPIED.",
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      playChime("error");
      setBanner({
        type: "error",
        title: "Check-In Error",
        message:
          error?.response?.data?.detail || "Check-in failed. Please try again.",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCheckOut = async () => {
    if (!verifiedData?.booking?.id) return;

    try {
      setProcessingAction(true);
      const response = await API.post(
        `/booking/exit/${verifiedData.booking.id}`
      );

      if (response.data?.success) {
        playChime("success");
        setVerifiedData((prev) => ({
          ...prev,
          can_enter: false,
          can_exit: false,
          is_completed: true,
          booking: {
            ...prev.booking,
            status: "COMPLETED",
          },
        }));

        setBanner({
          type: "success",
          title: "Check-Out Confirmed! 🚪",
          message:
            response.data?.message ||
            "Vehicle checked out successfully. Parking slot is now FREE and AVAILABLE.",
        });
      }
    } catch (error) {
      console.error("Check-out error:", error);
      playChime("error");
      setBanner({
        type: "error",
        title: "Check-Out Error",
        message:
          error?.response?.data?.detail || "Check-out failed. Please try again.",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const resetScanner = async () => {
    setVerifiedData(null);
    setManualBookingId("");
    setBanner(null);
    await stopScanner();
  };

  const booking = verifiedData?.booking;
  const status = String(booking?.status || "").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition text-sm font-semibold shadow-sm"
          >
            <FaArrowLeft /> Owner Dashboard
          </button>

          <div className="flex items-center gap-2 text-xs text-blue-700 font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Gate QR Scanner
          </div>
        </div>

        {/* SCANNER CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-md shadow-blue-500/20 mb-4">
              <FaQrcode />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Scan Customer QR Pass
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Verify customer booking for seamless Entry (Check-In) and Exit (Check-Out)
            </p>
          </div>

          {/* BANNER NOTIFICATION */}
          {banner && (
            <div
              className={`mb-6 p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm animate-fadeIn ${
                banner.type === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : banner.type === "error"
                  ? "bg-red-50 border-red-300 text-red-800"
                  : "bg-blue-50 border-blue-300 text-blue-800"
              }`}
            >
              <div className="text-lg mt-0.5 shrink-0">
                {banner.type === "success" ? (
                  <FaCheckCircle className="text-emerald-600" />
                ) : banner.type === "error" ? (
                  <FaTimesCircle className="text-red-600" />
                ) : (
                  <FaExclamationTriangle className="text-blue-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm">{banner.title}</h4>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                  {banner.message}
                </p>
              </div>
            </div>
          )}

          {/* CAMERA SCANNER VIEW */}
          {!verifiedData && (
            <div>
              <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-inner flex flex-col items-center justify-center min-h-[280px]">
                <div id="qr-reader" className="w-full" />

                {!scanning && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-2xl mb-3">
                      <FaCamera />
                    </div>
                    <p className="text-slate-200 font-semibold text-sm">
                      Camera is currently idle
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Click below to activate the live scanner
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                {!scanning ? (
                  <button
                    onClick={startScanner}
                    className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FaCamera /> Start Camera Scanner
                  </button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="flex-1 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FaStop /> Stop Scanner
                  </button>
                )}
              </div>

              {/* MANUAL INPUT FALLBACK */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider text-center mb-3">
                  Or Enter Booking ID Manually
                </p>

                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FaKey />
                    </span>
                    <input
                      type="number"
                      value={manualBookingId}
                      onChange={(e) => setManualBookingId(e.target.value)}
                      placeholder="Enter Booking ID (e.g. 1)"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !manualBookingId.trim()}
                    className="py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <FaSyncAlt className="animate-spin" />
                    ) : (
                      <FaSearch />
                    )}
                    Verify
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VERIFIED BOOKING DETAILS */}
          {verifiedData && booking && (
            <div className="animate-fadeIn">
              
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                      #{booking.id}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {booking.customer_name || "Customer Booking"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {booking.customer_email || "Verified ParkEase User"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : status === "COMPLETED"
                        ? "bg-slate-200 text-slate-700 border border-slate-300"
                        : status === "CANCELLED"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FaParking className="text-blue-600" /> Slot Number
                    </span>
                    <p className="font-extrabold text-blue-700 text-sm mt-1">
                      {booking.slot_number || `Slot #${booking.slot_id || "N/A"}`}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FaCar className="text-blue-600" /> Vehicle
                    </span>
                    <p className="font-bold text-slate-800 mt-1 truncate">
                      {booking.vehicle_number || "4-Wheeler"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FaMoneyBillWave className="text-emerald-600" /> Amount
                    </span>
                    <p className="font-bold text-emerald-700 text-sm mt-1">
                      ₹{booking.amount || 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FaCalendarAlt className="text-blue-600" /> Booking Date
                    </span>
                    <p className="font-bold text-slate-800 mt-1 truncate">
                      {booking.booking_date
                        ? new Date(booking.booking_date).toLocaleDateString()
                        : "Today"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 col-span-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FaClock className="text-blue-600" /> Reserved Window
                    </span>
                    <p className="font-bold text-slate-800 mt-1">
                      {booking.start_time || "00:00"} - {booking.end_time || "23:59"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION TRIGGER BUTTONS */}
              <div className="mt-6 flex flex-col gap-3">
                {(status === "BOOKED" || status === "CONFIRMED") && (
                  <button
                    onClick={handleCheckIn}
                    disabled={processingAction}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md shadow-emerald-500/20 transition active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {processingAction ? (
                      <FaSyncAlt className="animate-spin" />
                    ) : (
                      <FaCar />
                    )}
                    Check-In Vehicle (Grant Entry)
                  </button>
                )}

                {(status === "ACTIVE" || status === "PARKED") && (
                  <button
                    onClick={handleCheckOut}
                    disabled={processingAction}
                    className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-md shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {processingAction ? (
                      <FaSyncAlt className="animate-spin" />
                    ) : (
                      <FaDoorOpen />
                    )}
                    Check-Out Vehicle (Grant Exit & Free Slot)
                  </button>
                )}

                {status === "COMPLETED" && (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-slate-700">
                    <p className="font-bold text-sm text-emerald-700 flex items-center justify-center gap-2">
                      <FaCheckCircle /> Parking Session Completed
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Slot {booking.slot_number} was successfully freed for other drivers.
                    </p>
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  disabled={processingAction}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
                >
                  <FaQrcode /> Scan Next Customer QR
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ScanQR;