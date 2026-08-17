import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaParking,
  FaTimes,
} from "react-icons/fa";
import API from "../../api/axios";

function BookParking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [parking, setParking] = useState(
    location.state?.parking || null
  );

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [toast, setToast] = useState(null);

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // =====================================================
  // LOAD PARKING DETAILS
  // =====================================================

  const loadParking = async () => {
    try {
      const response = await API.get(`/parking/${id}`);

      setParking(response.data);
    } catch (error) {
      console.error("Failed to load parking:", error);

      showToast(
        error?.response?.data?.detail ||
          "Unable to load parking details.",
        "error"
      );
    }
  };

  // =====================================================
  // LOAD AVAILABLE SLOTS
  // =====================================================

  const loadSlots = async () => {
    try {
      /*
        Customer endpoint:

        GET /parking/{parking_id}/slots

        Expected response:

        {
          parking_id: 1,
          slots: [
            {
              id: 1,
              slot_number: "A1",
              status: "AVAILABLE"
            }
          ]
        }
      */

      const response = await API.get(
        `/parking/${id}/slots`
      );

      console.log(
        "Parking slots response:",
        response.data
      );

      let allSlots = [];

      if (Array.isArray(response.data)) {
        allSlots = response.data;
      } else if (
        Array.isArray(response.data?.slots)
      ) {
        allSlots = response.data.slots;
      }

      const availableSlots = allSlots.filter(
        (slot) =>
          String(slot.status || "")
            .trim()
            .toUpperCase() === "AVAILABLE"
      );

      setSlots(availableSlots);
    } catch (error) {
      console.error(
        "Failed to load available slots:",
        error
      );

      setSlots([]);

      showToast(
        error?.response?.data?.detail ||
          "Unable to load available parking slots.",
        "error"
      );
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        loadParking(),
        loadSlots(),
      ]);

      setLoading(false);
    };

    loadData();
  }, [id]);

  // =====================================================
  // BOOK PARKING
  // =====================================================

  const handleBookParking = async () => {
    if (!selectedSlot) {
      showToast(
        "Please select a parking slot.",
        "error"
      );
      return;
    }

    if (!startTime) {
      showToast(
        "Please select a start time.",
        "error"
      );
      return;
    }

    if (!endTime) {
      showToast(
        "Please select an end time.",
        "error"
      );
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      showToast(
        "End time must be after start time.",
        "error"
      );
      return;
    }

    try {
      setBookingLoading(true);

      const response = await API.post(
        "/booking/create",
        {
          parking_location_id: Number(id),

          slot_id: Number(selectedSlot.id),

          start_time: startTime,

          end_time: endTime,

          amount: 0,
        }
      );

      showToast(
        response.data?.message ||
          "Parking booked successfully."
      );

      setTimeout(() => {
        navigate(
          "/customer/my-bookings",
          {
            replace: true,
          }
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Booking failed:",
        error
      );

      showToast(
        error?.response?.data?.detail ||
          "Unable to book parking.",
        "error"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />

          <p className="mt-4 text-slate-500">
            Loading available parking slots...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px]">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-xl ${
              toast.type === "success"
                ? "bg-white border-green-200"
                : "bg-white border-red-200"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                toast.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {toast.type === "success" ? (
                <FaCheckCircle />
              ) : (
                <FaExclamationTriangle />
              )}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {toast.type === "success"
                  ? "Success"
                  : "Booking Error"}
              </p>

              <p className="text-sm text-slate-500 mt-1">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="h-20 flex items-center gap-4">

            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center"
            >
              <FaArrowLeft />
            </button>

            <div>
              <p className="text-xs text-slate-400">
                ParkEase
              </p>

              <h1 className="font-bold text-slate-900 text-xl">
                Book Parking
              </h1>
            </div>

          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* =====================================================
            PARKING INFORMATION
        ===================================================== */}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">

          <div className="flex items-start gap-5">

            <div className="w-16 h-16 shrink-0 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl">
              <FaParking />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {parking?.name ||
                  parking?.parking_name ||
                  "Parking Location"}
              </h2>

              <div className="flex items-start gap-2 mt-4 text-slate-500">
                <FaMapMarkerAlt className="text-blue-600 mt-1 shrink-0" />

                <p>
                  {parking?.address ||
                    "Address not available"}
                </p>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                {slots.length} available slot
                {slots.length !== 1 ? "s" : ""}
              </p>
            </div>

          </div>

        </section>

        {/* =====================================================
            SELECT SLOT
        ===================================================== */}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mt-6 shadow-sm">

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Select Parking Slot
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Choose one available parking slot.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-semibold text-sm">
              {slots.length} Available
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="mt-6 border border-dashed border-red-300 bg-red-50 rounded-2xl p-8 text-center">

              <FaExclamationTriangle className="mx-auto text-3xl text-red-500" />

              <h3 className="font-bold text-slate-900 mt-4">
                No Slots Available
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                All parking slots are currently occupied
                or unavailable.
              </p>

              <button
                onClick={loadSlots}
                className="mt-5 px-5 py-3 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
              >
                Refresh Slots
              </button>

            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">

              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    setSelectedSlot(slot)
                  }
                  className={`p-5 rounded-2xl border-2 font-bold transition ${
                    Number(selectedSlot?.id) ===
                    Number(slot.id)
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                >
                  <FaParking className="mx-auto mb-3 text-xl" />

                  <p>
                    {slot.slot_number}
                  </p>

                  <p className="text-xs font-medium mt-2 text-green-600">
                    Available
                  </p>
                </button>
              ))}

            </div>
          )}

        </section>

        {/* =====================================================
            SELECT TIME
        ===================================================== */}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mt-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Select Parking Time
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Select when you want to start and end your parking session.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">

            {/* START TIME */}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <FaClock className="text-blue-600" />
                Start Time
              </label>

              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            {/* END TIME */}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <FaCalendarAlt className="text-blue-600" />
                End Time
              </label>

              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
                min={startTime || undefined}
                className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

          </div>

        </section>

        {/* =====================================================
            SELECTED SLOT
        ===================================================== */}

        {selectedSlot && (
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FaParking />
            </div>

            <div>
              <p className="text-sm text-blue-600">
                Selected Slot
              </p>

              <p className="text-lg font-bold text-slate-900">
                {selectedSlot.slot_number}
              </p>
            </div>

          </div>
        )}

        {/* =====================================================
            CONFIRM BUTTON
        ===================================================== */}

        <button
          type="button"
          onClick={handleBookParking}
          disabled={
            bookingLoading ||
            slots.length === 0
          }
          className="w-full mt-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-100"
        >

          <FaCheckCircle />

          {bookingLoading
            ? "Booking Parking..."
            : "Confirm Booking"}

        </button>

      </main>
    </div>
  );
}

export default BookParking;