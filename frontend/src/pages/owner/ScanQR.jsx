import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import API from "../../api/axios";

function ScanQR() {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState(
    "Click Start Scanner to scan a customer's QR code."
  );
  const [processing, setProcessing] = useState(false);

  const stopScanner = async () => {
    try {
      const scanner = window.parkeaseScanner;

      if (scanner) {
        const state = scanner.getState();

        if (state === 2 || state === 3) {
          await scanner.stop();
        }

        await scanner.clear();
        window.parkeaseScanner = null;
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
      setBooking(null);
      setMessage("📷 Starting camera...");
      setScanning(true);

      const scanner = new Html5Qrcode("qr-reader");

      window.parkeaseScanner = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          console.log("QR scanned:", decodedText);

          try {
            await scanner.stop();
          } catch (error) {
            console.error("Scanner stop error:", error);
          }

          setScanning(false);

          handleScannedQR(decodedText);
        },
        (errorMessage) => {
          // Ignore continuous scanner errors.
        }
      );

      setMessage("📷 Point the camera at the customer's QR code.");
    } catch (error) {
      console.error("Camera error:", error);

      setScanning(false);

      if (
        error?.message?.toLowerCase().includes("permission") ||
        error?.name === "NotAllowedError"
      ) {
        setMessage(
          "❌ Camera permission denied. Please allow camera access."
        );
      } else {
        setMessage(
          "❌ Unable to start camera. Please check camera permissions."
        );
      }
    }
  };

  const handleScannedQR = (qrText) => {
    try {
      let qrData;

      try {
        qrData = JSON.parse(qrText);
      } catch {
        setMessage("❌ Invalid ParkEase QR code.");
        return;
      }

      console.log("QR Data:", qrData);

      if (qrData.type !== "PARKEASE_BOOKING") {
        setMessage("❌ This is not a valid ParkEase booking QR.");
        return;
      }

      if (!qrData.booking_id) {
        setMessage("❌ Booking ID not found in QR code.");
        return;
      }

      setBooking({
        booking_id: qrData.booking_id,
        user_id: qrData.user_id,
        parking_id: qrData.parking_id,
        slot_id: qrData.slot_id,
        booking_date: qrData.booking_date,
        start_time: qrData.start_time,
        end_time: qrData.end_time,
        amount: qrData.amount,
        status: "Booked",
      });

      setMessage("✅ QR scanned successfully.");
    } catch (error) {
      console.error("QR processing error:", error);
      setMessage("❌ Unable to read this QR code.");
    }
  };

  const checkIn = async () => {
    if (!booking) {
      return;
    }

    try {
      setProcessing(true);
      setMessage("Checking in...");

      const response = await API.post(
        `/booking/entry/${booking.booking_id}`
      );

      console.log("Check-in response:", response.data);

      if (!response.data.success) {
        setMessage(
          `❌ ${response.data.message || "Check-in failed."}`
        );
        return;
      }

      setBooking((previous) => ({
        ...previous,
        status: "Active",
      }));

      setMessage("✅ Check-in successful. Vehicle has entered.");
    } catch (error) {
      console.error("Check-in error:", error);

      setMessage(
        error.response?.data?.detail ||
          "❌ Check-in failed."
      );
    } finally {
      setProcessing(false);
    }
  };

  const checkOut = async () => {
    if (!booking) {
      return;
    }

    try {
      setProcessing(true);
      setMessage("Checking out...");

      const response = await API.post(
        `/booking/exit/${booking.booking_id}`
      );

      console.log("Check-out response:", response.data);

      if (!response.data.success) {
        setMessage(
          `❌ ${response.data.message || "Check-out failed."}`
        );
        return;
      }

      setBooking((previous) => ({
        ...previous,
        status: "Completed",
      }));

      setMessage(
        "✅ Check-out successful. Parking slot is now available."
      );
    } catch (error) {
      console.error("Check-out error:", error);

      setMessage(
        error.response?.data?.detail ||
          "❌ Check-out failed."
      );
    } finally {
      setProcessing(false);
    }
  };

  const scanAnother = async () => {
    setBooking(null);
    setMessage("Click Start Scanner to scan another QR code.");

    await stopScanner();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-3xl mx-auto">

        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">

            <div className="text-6xl mb-4">
              📷
            </div>

            <h1 className="text-4xl font-bold">
              Scan Customer QR
            </h1>

            <p className="text-gray-500 mt-2">
              Scan the customer's ParkEase booking QR
            </p>

          </div>


          {/* SCANNER */}

          {!booking && (

            <>

              <div className="border-4 border-purple-500 rounded-2xl overflow-hidden bg-black">

                <div
                  id="qr-reader"
                  className="w-full"
                ></div>

              </div>


              {/* MESSAGE */}

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">

                <p className="text-blue-700 font-semibold">
                  {message}
                </p>

              </div>


              {/* START SCANNER */}

              {!scanning && (

                <button
                  onClick={startScanner}
                  className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-lg shadow-md transition"
                >
                  📷 Start Scanner
                </button>

              )}


              {/* STOP SCANNER */}

              {scanning && (

                <button
                  onClick={stopScanner}
                  className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition"
                >
                  ⛔ Stop Scanner
                </button>

              )}

            </>

          )}


          {/* BOOKING DETAILS */}

          {booking && (

            <div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-center">

                <div className="text-5xl mb-3">
                  ✅
                </div>

                <h2 className="text-2xl font-bold text-green-700">
                  QR Verified
                </h2>

                <p className="text-green-600 mt-1">
                  Customer booking found
                </p>

              </div>


              {/* DETAILS */}

              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Booking ID
                  </span>

                  <strong>
                    #{booking.booking_id}
                  </strong>

                </div>


                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Parking ID
                  </span>

                  <strong>
                    #{booking.parking_id}
                  </strong>

                </div>


                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Slot ID
                  </span>

                  <strong>
                    #{booking.slot_id}
                  </strong>

                </div>


                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Booking Date
                  </span>

                  <strong>
                    {booking.booking_date}
                  </strong>

                </div>


                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Time
                  </span>

                  <strong>
                    {booking.start_time} - {booking.end_time}
                  </strong>

                </div>


                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Amount
                  </span>

                  <strong className="text-green-600">
                    ₹{booking.amount || 50}
                  </strong>

                </div>


                {/* STATUS */}

                <div className="border-t pt-4 text-center">

                  <span
                    className={`inline-block px-5 py-2 rounded-full font-bold ${
                      booking.status === "Booked"
                        ? "bg-blue-100 text-blue-700"
                        : booking.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {booking.status}
                  </span>

                </div>

              </div>


              {/* CHECK IN */}

              {booking.status === "Booked" && (

                <button
                  onClick={checkIn}
                  disabled={processing}
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg shadow-md transition"
                >
                  {processing
                    ? "Processing..."
                    : "✅ Check In Vehicle"}
                </button>

              )}


              {/* CHECK OUT */}

              {booking.status === "Active" && (

                <button
                  onClick={checkOut}
                  disabled={processing}
                  className="mt-6 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg shadow-md transition"
                >
                  {processing
                    ? "Processing..."
                    : "🚪 Check Out Vehicle"}
                </button>

              )}


              {/* COMPLETED */}

              {booking.status === "Completed" && (

                <div className="mt-6 bg-gray-100 border border-gray-300 rounded-xl p-5 text-center">

                  <p className="text-gray-700 font-bold text-lg">
                    🏁 Parking Completed
                  </p>

                  <p className="text-gray-500 mt-1">
                    The vehicle has checked out successfully.
                  </p>

                </div>

              )}


              {/* SCAN AGAIN */}

              <button
                onClick={scanAnother}
                disabled={processing}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition"
              >
                📷 Scan Another QR
              </button>

            </div>

          )}


          {/* BACK */}

          <button
            onClick={() => navigate("/owner")}
            className="mt-6 w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl font-bold transition"
          >
            ← Back to Owner Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}

export default ScanQR;