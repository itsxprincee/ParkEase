import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaParking,
} from "react-icons/fa";

import API from "../../api/axios";


function BookParking() {
  const { id } = useParams();

  const navigate = useNavigate();

  const location = useLocation();


  // =====================================================
  // STATES
  // =====================================================

  const [parking, setParking] = useState(
    location.state?.parking || null
  );

  const [slots, setSlots] = useState([]);

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [toast, setToast] =
    useState(null);


  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (
    message,
    type = "success"
  ) => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };


  // =====================================================
  // LOAD PARKING
  // =====================================================

  const loadParking = async () => {
    try {
      const response = await API.get(
        `/parking/${id}`
      );

      setParking(response.data);

    } catch (error) {

      console.error(
        "Failed to load parking:",
        error
      );

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

      const response = await API.get(
        `/parking/${id}/slots`
      );

      const allSlots =
        response.data?.slots ||
        response.data ||
        [];

      const availableSlots =
        allSlots.filter(
          (slot) =>
            String(
              slot.status
            )
              .toUpperCase() ===
            "AVAILABLE"
        );

      setSlots(
        availableSlots
      );

    } catch (error) {

      console.error(
        "Failed to load slots:",
        error
      );

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


    if (
      new Date(endTime) <=
      new Date(startTime)
    ) {

      showToast(
        "End time must be after start time.",
        "error"
      );

      return;
    }


    try {

      setBookingLoading(true);

      const response =
        await API.post(
          "/booking/create",
          {
            parking_location_id:
              Number(id),

            slot_id:
              Number(
                selectedSlot.id
              ),

            start_time:
              startTime,

            end_time:
              endTime,

            amount:
              0,
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
  // RENDER
  // =====================================================

  return (

    <div className="min-h-screen bg-slate-50">


      {/* TOAST */}

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
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
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

          </div>

        </div>

      )}


      {/* HEADER */}

      <header className="bg-white border-b border-slate-200">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">

          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
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

      </header>


      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">


        {/* PARKING INFO */}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl">

              <FaParking />

            </div>


            <div>

              <h2 className="text-2xl font-bold text-slate-900">

                {parking?.name ||
                  "Parking Location"}

              </h2>


              <div className="flex gap-2 mt-3 text-slate-500">

                <FaMapMarkerAlt className="text-blue-600 mt-1 shrink-0" />

                <p>

                  {parking?.address ||
                    "Address not available"}

                </p>

              </div>

            </div>

          </div>

        </div>


        {/* SELECT SLOT */}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mt-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Select Parking Slot
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Choose one of the available parking slots.
          </p>


          {slots.length === 0 ? (

            <div className="mt-6 border border-dashed border-red-300 bg-red-50 rounded-2xl p-8 text-center">

              <FaExclamationTriangle className="mx-auto text-3xl text-red-500" />

              <h3 className="font-bold text-slate-900 mt-4">
                No Slots Available
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                All parking slots are currently occupied.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">

              {slots.map((slot) => (

                <button
                  key={slot.id}
                  onClick={() =>
                    setSelectedSlot(slot)
                  }
                  className={`p-5 rounded-2xl border-2 font-bold transition ${
                    selectedSlot?.id ===
                    slot.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                >

                  <FaParking className="mx-auto mb-2 text-xl" />

                  {slot.slot_number}

                </button>

              ))}

            </div>

          )}

        </div>


        {/* SELECT TIME */}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mt-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Select Parking Time
          </h2>


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
                  setStartTime(
                    event.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-200"
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
                  setEndTime(
                    event.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-200"
              />

            </div>

          </div>

        </div>


        {/* CONFIRM BUTTON */}

        <button
          onClick={handleBookParking}
          disabled={
            bookingLoading ||
            slots.length === 0
          }
          className="w-full mt-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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