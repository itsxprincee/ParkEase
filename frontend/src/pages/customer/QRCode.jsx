import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import API from "../../api/axios";

function QRCode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get("booking");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);

      const response = await API.get("/booking/my-bookings");

      console.log("All bookings:", response.data);
      console.log("Selected booking ID:", bookingId);

      let selectedBooking;

      if (bookingId) {
        selectedBooking = response.data.find(
          (item) => String(item.id) === String(bookingId)
        );
      } else {
        selectedBooking = response.data.find(
          (item) =>
            item.status === "Booked" ||
            item.status === "Active"
        );
      }

      console.log("Selected booking:", selectedBooking);

      setBooking(selectedBooking || null);

    } catch (error) {
      console.error("QR booking error:", error);
      alert("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <h2 className="text-2xl font-bold">
          Loading QR Code...
        </h2>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">

          <div className="text-6xl mb-4">
            🎫
          </div>

          <h1 className="text-2xl font-bold mb-3">
            Booking Not Found
          </h1>

          <p className="text-gray-500 mb-6">
            This booking could not be found or is no longer active.
          </p>

          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            ← Back to My Bookings
          </button>

        </div>

      </div>
    );
  }

  /*
    Data stored inside the QR.
    The owner scanner will read this later.
  */

  const qrData = JSON.stringify({
    type: "PARKEASE_BOOKING",

    booking_id: booking.id,

    user_id: booking.user_id,

    parking_id: booking.parking_id,

    slot_id: booking.slot_id,

    booking_date: booking.booking_date,

    start_time: booking.start_time,

    end_time: booking.end_time,

  });

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">

        {/* HEADER */}

        <div className="mb-6">

          <div className="text-5xl mb-3">
            🚗
          </div>

          <h1 className="text-3xl font-bold">
            ParkEase
          </h1>

          <p className="text-gray-500 mt-2">
            Parking Entry QR
          </p>

        </div>


        {/* QR CODE */}

        <div className="flex justify-center mb-6">

          <div className="bg-white p-5 rounded-2xl border-4 border-blue-600 shadow-lg">

            <QRCodeCanvas
              value={qrData}
              size={240}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={true}
            />

          </div>

        </div>


        {/* INSTRUCTION */}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">

          <p className="text-blue-700 font-semibold">
            📱 Show this QR to the parking owner
          </p>

          <p className="text-blue-600 text-sm mt-1">
            The owner will scan this QR to verify your booking.
          </p>

        </div>


        {/* BOOKING INFORMATION */}

        <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3">

          <div className="flex justify-between">
            <span className="text-gray-500">
              Booking ID
            </span>

            <strong>
              #{booking.id}
            </strong>
          </div>


          <div className="flex justify-between">
            <span className="text-gray-500">
              Parking
            </span>

            <strong>
              #{booking.parking_id}
            </strong>
          </div>


          <div className="flex justify-between">
            <span className="text-gray-500">
              Slot
            </span>

            <strong>
              #{booking.slot_id}
            </strong>
          </div>


          <div className="flex justify-between">
            <span className="text-gray-500">
              Date
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


          <div className="border-t pt-3 flex justify-between">

            <span className="text-gray-500">
              Amount
            </span>

            <strong className="text-green-600 text-lg">
              ₹{booking.amount}
            </strong>

          </div>


          <div className="text-center pt-2">

            <span
              className={`px-4 py-2 rounded-full font-bold ${
                booking.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {booking.status}
            </span>

          </div>

        </div>


        {/* BACK BUTTON */}

        <button
          onClick={() => navigate("/my-bookings")}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-bold"
        >
          ← Back to My Bookings
        </button>

      </div>

    </div>
  );
}

export default QRCode;