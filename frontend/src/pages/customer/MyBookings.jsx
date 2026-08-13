import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaParking,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaCar,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaQrcode,
  FaEye,
  FaTrash,
  FaTimes,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaHourglassHalf,
  FaChartLine,
} from "react-icons/fa";

import API from "../../api/axios";
import { toast } from "react-hot-toast";

function MyBookings() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);

  // =====================================================
  // LOAD BOOKINGS
  // =====================================================

  const loadBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await API.get("/booking/my-bookings");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings:", error);

      const message =
        error?.response?.data?.detail ||
        "Failed to load your bookings.";

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadBookings();
  }, []);

  // =====================================================
  // STATUS CONFIG
  // =====================================================

  const getStatusConfig = (status) => {
    switch (status) {
      case "Booked":
        return {
          label: "Booked",
          icon: <FaCalendarAlt />,
          badge:
            "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
        };

      case "Active":
        return {
          label: "Active",
          icon: <FaCheckCircle />,
          badge:
            "bg-green-50 text-green-700 border-green-200",
          dot: "bg-green-500",
        };

      case "Completed":
        return {
          label: "Completed",
          icon: <FaCheckCircle />,
          badge:
            "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-500",
        };

      case "Cancelled":
        return {
          label: "Cancelled",
          icon: <FaTimesCircle />,
          badge:
            "bg-red-50 text-red-700 border-red-200",
          dot: "bg-red-500",
        };

      default:
        return {
          label: status || "Unknown",
          icon: <FaHourglassHalf />,
          badge:
            "bg-yellow-50 text-yellow-700 border-yellow-200",
          dot: "bg-yellow-500",
        };
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    return {
      total: bookings.length,

      booked: bookings.filter(
        (booking) => booking.status === "Booked"
      ).length,

      active: bookings.filter(
        (booking) => booking.status === "Active"
      ).length,

      completed: bookings.filter(
        (booking) => booking.status === "Completed"
      ).length,

      cancelled: bookings.filter(
        (booking) => booking.status === "Cancelled"
      ).length,
    };
  }, [bookings]);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const bookingId = String(
        booking.id || ""
      ).toLowerCase();

      const parkingId = String(
        booking.parking_id || ""
      ).toLowerCase();

      const slotId = String(
        booking.slot_id || ""
      ).toLowerCase();

      const bookingDate = String(
        booking.booking_date || ""
      ).toLowerCase();

      const matchesSearch =
        !search ||
        bookingId.includes(search) ||
        parkingId.includes(search) ||
        slotId.includes(search) ||
        bookingDate.includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // =====================================================
  // CANCEL BOOKING
  // =====================================================

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const closeCancelModal = () => {
    if (cancellingId) return;

    setSelectedBooking(null);
    setShowDeleteModal(false);
  };

  const cancelBooking = async () => {
    if (!selectedBooking) return;

    const bookingId = selectedBooking.id;

    try {
      setCancellingId(bookingId);

      await API.delete(`/booking/${bookingId}`);

      setBookings((previous) =>
        previous.filter(
          (booking) => booking.id !== bookingId
        )
      );

      toast.success(
        "Booking cancelled successfully."
      );

      setSelectedBooking(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error(
        "Failed to cancel booking:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Unable to cancel booking.";

      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  // =====================================================
  // QR CODE
  // =====================================================

  const showQR = (bookingId) => {
    navigate(`/qr?booking=${bookingId}`);
  };

  // =====================================================
  // VIEW PARKING
  // =====================================================

  const viewParking = (parkingId) => {
    navigate(`/customer/parking/${parkingId}`);
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
            <FaParking />
          </div>

          <div className="w-10 h-10 mx-auto mt-6 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Loading your bookings...
          </h2>

          <p className="text-slate-500 mt-2">
            Please wait while we fetch your reservations.
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
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-4">
            {/* LEFT */}

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
                title="Go back"
              >
                <FaArrowLeft />
              </button>

              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-200">
                <FaParking />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  My Bookings
                </h1>

                <p className="hidden sm:block text-xs text-slate-500">
                  ParkEase Reservations
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <button
              onClick={() => loadBookings(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
            >
              <FaSyncAlt
                className={
                  refreshing ? "animate-spin" : ""
                }
              />

              <span className="hidden sm:inline font-medium">
                Refresh
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PAGE INTRO */}

        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-2">
                <FaChartLine />
                RESERVATION OVERVIEW
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Your Parking Bookings
              </h2>

              <p className="text-slate-500 mt-3 max-w-2xl">
                View, manage and access all your ParkEase
                parking reservations from one place.
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/customer/dashboard")
              }
              className="self-start lg:self-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <FaParking />
              Find Parking
            </button>
          </div>
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* TOTAL */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Total
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {statistics.total}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FaCalendarAlt />
              </div>
            </div>
          </div>

          {/* BOOKED */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Booked
                </p>

                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {statistics.booked}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FaClock />
              </div>
            </div>
          </div>

          {/* ACTIVE */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="text-3xl font-bold text-green-600 mt-1">
                  {statistics.active}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <FaCar />
              </div>
            </div>
          </div>

          {/* COMPLETED */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="text-3xl font-bold text-slate-700 mt-1">
                  {statistics.completed}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <FaCheckCircle />
              </div>
            </div>
          </div>

          {/* CANCELLED */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Cancelled
                </p>

                <p className="text-3xl font-bold text-red-600 mt-1">
                  {statistics.cancelled}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <FaTimesCircle />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        {bookings.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              {/* SEARCH */}

              <div className="relative w-full lg:max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  placeholder="Search by booking, parking or slot..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                />
              </div>

              {/* FILTER */}

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-slate-500 mr-1">
                  <FaFilter />

                  <span className="text-sm font-medium">
                    Filter:
                  </span>
                </div>

                {[
                  "ALL",
                  "Booked",
                  "Active",
                  "Completed",
                  "Cancelled",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(status)
                    }
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "ALL"
                      ? "All"
                      : status}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            SECTION TITLE
        ================================================= */}

        <section className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Booking History
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Showing {filteredBookings.length} of{" "}
              {bookings.length} bookings
            </p>
          </div>
        </section>

        {/* =================================================
            NO BOOKINGS
        ================================================= */}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">
              <FaParking />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-6">
              No bookings yet
            </h3>

            <p className="text-slate-500 mt-3 max-w-md mx-auto">
              You haven't booked a parking slot yet.
              Find an available parking location and make
              your first reservation.
            </p>

            <button
              onClick={() =>
                navigate("/customer/dashboard")
              }
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              <FaParking />
              Find Parking
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          /* =================================================
              NO FILTER RESULTS
          ================================================= */

          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl">
              <FaSearch />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-5">
              No bookings found
            </h3>

            <p className="text-slate-500 mt-2">
              Try changing your search or status filter.
            </p>

            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* =================================================
              BOOKINGS GRID
          ================================================= */

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => {
              const status = getStatusConfig(
                booking.status
              );

              const canCancel =
                booking.status === "Booked";

              const canShowQR =
                booking.status === "Booked" ||
                booking.status === "Active";

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* CARD HEADER */}

                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                          <FaCalendarAlt />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                            Booking ID
                          </p>

                          <h3 className="text-xl font-bold text-slate-900">
                            #{booking.id}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.badge}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY */}

                  <div className="p-6">
                    {/* PARKING */}

                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 text-slate-500">
                        <FaMapMarkerAlt className="text-blue-500" />

                        <span className="text-sm">
                          Parking
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          viewParking(
                            booking.parking_id
                          )
                        }
                        className="font-semibold text-blue-600 hover:text-blue-700"
                      >
                        #{booking.parking_id}
                      </button>
                    </div>

                    {/* SLOT */}

                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 text-slate-500">
                        <FaParking className="text-indigo-500" />

                        <span className="text-sm">
                          Parking Slot
                        </span>
                      </div>

                      <span className="font-semibold text-slate-900">
                        #{booking.slot_id}
                      </span>
                    </div>

                    {/* DATE */}

                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 text-slate-500">
                        <FaCalendarAlt className="text-blue-500" />

                        <span className="text-sm">
                          Date
                        </span>
                      </div>

                      <span className="font-semibold text-slate-900">
                        {formatDate(
                          booking.booking_date
                        )}
                      </span>
                    </div>

                    {/* TIME */}

                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 text-slate-500">
                        <FaClock className="text-orange-500" />

                        <span className="text-sm">
                          Time
                        </span>
                      </div>

                      <span className="font-semibold text-slate-900">
                        {booking.start_time} -{" "}
                        {booking.end_time}
                      </span>
                    </div>

                    {/* AMOUNT */}

                    <div className="flex items-center justify-between pt-4">
                      <span className="text-slate-500 font-medium">
                        Total Amount
                      </span>

                      <span className="text-2xl font-bold text-green-600">
                        ₹{booking.amount ?? 0}
                      </span>
                    </div>

                    {/* BOOKED MESSAGE */}

                    {booking.status === "Booked" && (
                      <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex gap-3">
                          <FaCalendarAlt className="text-blue-600 mt-1 shrink-0" />

                          <div>
                            <p className="font-semibold text-blue-700">
                              Booking Confirmed
                            </p>

                            <p className="text-sm text-blue-600 mt-1">
                              Your parking reservation is
                              confirmed. Show your QR code
                              when you arrive.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACTIVE MESSAGE */}

                    {booking.status === "Active" && (
                      <div className="mt-5 p-4 bg-green-50 border border-green-100 rounded-xl">
                        <div className="flex gap-3">
                          <FaCheckCircle className="text-green-600 mt-1 shrink-0" />

                          <div>
                            <p className="font-semibold text-green-700">
                              Parking Session Active
                            </p>

                            <p className="text-sm text-green-600 mt-1">
                              Your vehicle is currently
                              inside the parking location.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* COMPLETED MESSAGE */}

                    {booking.status === "Completed" && (
                      <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex gap-3">
                          <FaCheckCircle className="text-slate-600 mt-1 shrink-0" />

                          <div>
                            <p className="font-semibold text-slate-700">
                              Parking Completed
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              Your parking session has been
                              completed successfully.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CANCELLED MESSAGE */}

                    {booking.status === "Cancelled" && (
                      <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <div className="flex gap-3">
                          <FaTimesCircle className="text-red-600 mt-1 shrink-0" />

                          <div>
                            <p className="font-semibold text-red-700">
                              Booking Cancelled
                            </p>

                            <p className="text-sm text-red-600 mt-1">
                              This booking is no longer
                              active.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-100">
                      {/* VIEW PARKING */}

                      <button
                        onClick={() =>
                          viewParking(
                            booking.parking_id
                          )
                        }
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm font-semibold"
                      >
                        <FaEye />
                        View
                      </button>

                      {/* QR */}

                      {canShowQR && (
                        <button
                          onClick={() =>
                            showQR(booking.id)
                          }
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition text-sm font-semibold"
                        >
                          <FaQrcode />
                          QR Code
                        </button>
                      )}

                      {/* CANCEL */}

                      {canCancel && (
                        <button
                          onClick={() =>
                            openCancelModal(booking)
                          }
                          disabled={
                            cancellingId ===
                            booking.id
                          }
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition text-sm font-semibold disabled:opacity-50"
                        >
                          <FaTrash />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =================================================
          CANCEL CONFIRMATION MODAL
      ================================================= */}

      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeCancelModal}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* CLOSE */}

            <button
              onClick={closeCancelModal}
              disabled={Boolean(cancellingId)}
              className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition disabled:opacity-50"
            >
              <FaTimes />
            </button>

            {/* ICON */}

            <div className="p-7 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl">
                <FaTrash />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mt-5">
                Cancel Booking?
              </h3>

              <p className="text-slate-500 mt-3 leading-relaxed">
                Are you sure you want to cancel booking{" "}
                <strong className="text-slate-800">
                  #{selectedBooking.id}
                </strong>
                ? This action will release your parking
                slot.
              </p>

              {/* BOOKING SUMMARY */}

              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Parking
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    #{selectedBooking.parking_id}
                  </span>
                </div>

                <div className="flex justify-between gap-4 mt-2">
                  <span className="text-sm text-slate-500">
                    Slot
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    #{selectedBooking.slot_id}
                  </span>
                </div>

                <div className="flex justify-between gap-4 mt-2">
                  <span className="text-sm text-slate-500">
                    Date
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {formatDate(
                      selectedBooking.booking_date
                    )}
                  </span>
                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeCancelModal}
                  disabled={Boolean(cancellingId)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Keep Booking
                </button>

                <button
                  onClick={cancelBooking}
                  disabled={Boolean(cancellingId)}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancellingId ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Cancel Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;