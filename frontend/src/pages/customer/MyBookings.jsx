import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaParking,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaReceipt,
  FaMapMarkerAlt,
  FaQrcode,
  FaSortAmountDown,
  FaCreditCard,
} from "react-icons/fa";

import axios from "../../api/axios";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteBooking, setDeleteBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // =========================================================
  // LOAD BOOKINGS
  // Only loads when the page opens or when Refresh is clicked.
  // =========================================================

  const loadBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get("/booking/my-bookings");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.bookings || [];

      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings:", error);

      const message =
        error?.response?.data?.detail ||
        "Unable to load your bookings.";

      showToast(message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD ONLY
  // =========================================================

  useEffect(() => {
    loadBookings();
  }, []);

  // =========================================================
  // NORMALIZE STATUS
  // =========================================================

  const normalizeStatus = (status) => {
    if (!status) return "UNKNOWN";

    return String(status).trim().toUpperCase();
  };

  // =========================================================
  // STATUS CONFIG
  // =========================================================

  const getStatusConfig = (status) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "BOOKED":
      case "CONFIRMED":
        return {
          title: "Booked",
          icon: <FaCalendarAlt />,
          badge: "bg-blue-50 text-blue-700 border-blue-200",
        };

      case "ACTIVE":
      case "ONGOING":
        return {
          title: "Active",
          icon: <FaCar />,
          badge: "bg-green-50 text-green-700 border-green-200",
        };

      case "COMPLETED":
        return {
          title: "Completed",
          icon: <FaCheckCircle />,
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

      case "CANCELLED":
      case "CANCELED":
        return {
          title: "Cancelled",
          icon: <FaTimes />,
          badge: "bg-red-50 text-red-700 border-red-200",
        };

      default:
        return {
          title: status || "Unknown",
          icon: <FaClock />,
          badge: "bg-slate-100 text-slate-600 border-slate-200",
        };
    }
  };

  // =========================================================
  // PAYMENT CONFIG
  // =========================================================

  const getPaymentConfig = (status) => {
    const normalized = String(status || "PENDING")
      .trim()
      .toUpperCase();

    switch (normalized) {
      case "PAID":
      case "SUCCESS":
      case "COMPLETED":
        return {
          title: "Paid",
          className: "bg-green-50 text-green-700 border-green-200",
        };

      case "FAILED":
        return {
          title: "Failed",
          className: "bg-red-50 text-red-700 border-red-200",
        };

      case "REFUNDED":
        return {
          title: "Refunded",
          className: "bg-purple-50 text-purple-700 border-purple-200",
        };

      default:
        return {
          title: "Pending",
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
    }
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    return {
      total: bookings.length,

      booked: bookings.filter((booking) =>
        ["BOOKED", "CONFIRMED"].includes(
          normalizeStatus(booking.status)
        )
      ).length,

      active: bookings.filter((booking) =>
        ["ACTIVE", "ONGOING"].includes(
          normalizeStatus(booking.status)
        )
      ).length,

      completed: bookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "COMPLETED"
      ).length,

      cancelled: bookings.filter((booking) =>
        ["CANCELLED", "CANCELED"].includes(
          normalizeStatus(booking.status)
        )
      ).length,
    };
  }, [bookings]);

  // =========================================================
  // SEARCH + FILTER + SORT
  // =========================================================

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = bookings.filter((booking) => {
      const values = [
        booking.id,
        booking.parking_id,
        booking.slot_id,
        booking.slot_number,
        booking.status,
        booking.parking_name,
        booking.address,
        booking.vehicle_number,
        booking.vehicle_name,
        booking.vehicle_type,
        booking.payment_status,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !search ||
        values.some((value) => value.includes(search));

      const normalizedStatus = normalizeStatus(booking.status);

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizedStatus === statusFilter ||
        (statusFilter === "BOOKED" &&
          normalizedStatus === "CONFIRMED") ||
        (statusFilter === "ACTIVE" &&
          normalizedStatus === "ONGOING") ||
        (statusFilter === "CANCELLED" &&
          normalizedStatus === "CANCELED");

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "OLDEST") {
        return Number(a.id || 0) - Number(b.id || 0);
      }

      if (sortBy === "AMOUNT_HIGH") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }

      if (sortBy === "AMOUNT_LOW") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [bookings, searchTerm, statusFilter, sortBy]);

  // =========================================================
  // CANCEL BOOKING
  // =========================================================

  const confirmCancelBooking = async () => {
    if (!deleteBooking) return;

    try {
      setCancelling(true);

      const response = await axios.delete(
        `/booking/${deleteBooking.id}`
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
            "Unable to cancel booking."
        );
      }

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === deleteBooking.id
            ? {
                ...booking,
                status: "Cancelled",
              }
            : booking
        )
      );

      setDeleteBooking(null);

      showToast(
        response.data?.message ||
          "Booking cancelled successfully.",
        "success"
      );

      // Refresh once after successful cancellation
      await loadBookings(true);
    } catch (error) {
      console.error("Failed to cancel booking:", error);

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to cancel booking.";

      showToast(message, "error");
    } finally {
      setCancelling(false);
    }
  };

  // =========================================================
  // CAN CANCEL
  // =========================================================

  const canCancelBooking = (booking) => {
    const status = normalizeStatus(booking?.status);

    return (
      status === "BOOKED" ||
      status === "CONFIRMED"
    );
  };

  // =========================================================
  // CAN VIEW QR
  // =========================================================

  const canViewQR = (booking) => {
    const status = normalizeStatus(booking?.status);

    return (
      status === "BOOKED" ||
      status === "CONFIRMED" ||
      status === "ACTIVE" ||
      status === "ONGOING"
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return value;
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (value) => {
    if (!value) return "—";

    const valueString = String(value);
    const parts = valueString.split(":");

    if (parts.length < 2) {
      return valueString;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return valueString;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(
      2,
      "0"
    )} ${period}`;
  };

  // =========================================================
  // FORMAT AMOUNT
  // =========================================================

  const formatAmount = (amount) => {
    const number = Number(amount);

    if (Number.isNaN(number)) {
      return "₹0";
    }

    return `₹${number.toLocaleString("en-IN")}`;
  };

  // =========================================================
  // GET PARKING NAME
  // =========================================================

  const getParkingName = (booking) => {
    return (
      booking.parking_name ||
      booking.parking?.name ||
      booking.parking?.parking_name ||
      `Parking #${booking.parking_id || "—"}`
    );
  };

  // =========================================================
  // GET ADDRESS
  // =========================================================

  const getParkingAddress = (booking) => {
    return (
      booking.address ||
      booking.parking_address ||
      booking.parking?.address ||
      booking.parking?.location ||
      ""
    );
  };

  // =========================================================
  // GET VEHICLE DETAILS
  // =========================================================

  const getVehicleDetails = (booking) => {
    return {
      number:
        booking.vehicle_number ||
        booking.vehicle?.vehicle_number ||
        booking.vehicle?.number ||
        "Not available",

      type:
        booking.vehicle_type ||
        booking.vehicle?.vehicle_type ||
        booking.vehicle?.type ||
        "",

      name:
        booking.vehicle_name ||
        booking.vehicle?.vehicle_name ||
        booking.vehicle?.name ||
        "",
    };
  };

  // =========================================================
  // VIEW QR
  // =========================================================

  const handleViewQR = (booking) => {
    navigate("/customer/qr", {
      state: {
        booking,
        bookingId: booking.id,
      },
    });
  };

  // =========================================================
  // BACK
  // =========================================================

  const goBack = () => {
    navigate("/customer/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOAST */}

      {toast && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px]">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-2xl ${
              toast.type === "success"
                ? "bg-white border-green-200"
                : "bg-white border-red-200"
            }`}
          >
            <div
              className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
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
                  : "Something went wrong"}
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

      {/* HEADER */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
              >
                <FaArrowLeft />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-200">
                  <FaParking />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    My Bookings
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500">
                    Manage your parking reservations
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => loadBookings(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
            >
              <FaSyncAlt
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline font-medium">
                Refresh
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PAGE INTRO */}

        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-2">
                <FaReceipt />
                BOOKING MANAGEMENT
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Your Parking Bookings
              </h2>

              <p className="text-slate-500 mt-3 max-w-2xl">
                View, track, manage and access all your
                ParkEase parking reservations from one place.
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/customer/dashboard")
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <FaParking />
              Find Parking
            </button>
          </div>
        </section>

        {/* STATISTICS */}

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: statistics.total,
              icon: <FaReceipt />,
              valueClass: "text-slate-900",
              iconClass: "bg-blue-50 text-blue-600",
            },
            {
              label: "Booked",
              value: statistics.booked,
              icon: <FaCalendarAlt />,
              valueClass: "text-blue-600",
              iconClass: "bg-blue-50 text-blue-600",
            },
            {
              label: "Active",
              value: statistics.active,
              icon: <FaCar />,
              valueClass: "text-green-600",
              iconClass: "bg-green-50 text-green-600",
            },
            {
              label: "Completed",
              value: statistics.completed,
              icon: <FaCheckCircle />,
              valueClass: "text-emerald-600",
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Cancelled",
              value: statistics.cancelled,
              icon: <FaTimes />,
              valueClass: "text-red-600",
              iconClass: "bg-red-50 text-red-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {item.label}
                  </p>

                  <p
                    className={`text-3xl font-bold mt-1 ${item.valueClass}`}
                  >
                    {item.value}
                  </p>
                </div>

                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.iconClass}`}
                >
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* SEARCH / FILTER / SORT */}

        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search booking, parking, vehicle or slot..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-slate-500 mr-1">
                  <FaFilter />

                  <span className="text-sm font-medium">
                    Filter
                  </span>
                </div>

                {[
                  "ALL",
                  "BOOKED",
                  "ACTIVE",
                  "COMPLETED",
                  "CANCELLED",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(status)
                    }
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      statusFilter === status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "ALL"
                      ? "All"
                      : status.charAt(0) +
                        status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  className="w-full sm:w-auto appearance-none pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="NEWEST">
                    Newest First
                  </option>

                  <option value="OLDEST">
                    Oldest First
                  </option>

                  <option value="AMOUNT_HIGH">
                    Amount: High to Low
                  </option>

                  <option value="AMOUNT_LOW">
                    Amount: Low to High
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS HEADER */}

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

          {(searchTerm ||
            statusFilter !== "ALL" ||
            sortBy !== "NEWEST") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setSortBy("NEWEST");
              }}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Clear Filters
            </button>
          )}
        </section>

        {/* LOADING */}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
            <div className="w-11 h-11 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

            <p className="text-slate-500 mt-4">
              Loading your bookings...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">
              <FaCalendarAlt />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-6">
              No bookings yet
            </h3>

            <p className="text-slate-500 mt-3 max-w-md mx-auto">
              You haven't made any parking reservations
              yet. Find a parking location and make
              your first booking.
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
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => {
              const status = getStatusConfig(
                booking.status
              );

              const payment = getPaymentConfig(
                booking.payment_status
              );

              const vehicle = getVehicleDetails(
                booking
              );

              const parkingName =
                getParkingName(booking);

              const parkingAddress =
                getParkingAddress(booking);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                          <FaParking />
                        </div>

                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                            Booking #{booking.id}
                          </p>

                          <h3 className="text-lg font-bold text-slate-900 mt-1">
                            {parkingName}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.badge}`}
                      >
                        {status.icon}
                        {status.title}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <FaCalendarAlt />
                          Date
                        </div>

                        <p className="text-sm font-bold text-slate-900 mt-2">
                          {formatDate(
                            booking.booking_date
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <FaClock />
                          Parking Time
                        </div>

                        <p className="text-sm font-bold text-slate-900 mt-2">
                          {formatTime(
                            booking.start_time
                          )}{" "}
                          -{" "}
                          {formatTime(
                            booking.end_time
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <FaCar />
                          Vehicle
                        </div>

                        <p className="text-sm font-bold text-slate-900 mt-2 truncate">
                          {vehicle.number}
                        </p>

                        {(vehicle.name ||
                          vehicle.type) && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {[vehicle.name, vehicle.type]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <FaParking />
                          Parking Slot
                        </div>

                        <p className="text-sm font-bold text-slate-900 mt-2">
                          {booking.slot_number ||
                            `Slot #${booking.slot_id || "—"}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-blue-600 font-medium">
                              Booking Amount
                            </p>

                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${payment.className}`}
                            >
                              {payment.title}
                            </span>
                          </div>

                          <p className="text-2xl font-bold text-blue-700 mt-1">
                            {formatAmount(
                              booking.amount
                            )}
                          </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-white text-blue-600 flex items-center justify-center">
                          <FaCreditCard />
                        </div>
                      </div>
                    </div>

                    {parkingAddress && (
                      <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <FaMapMarkerAlt className="text-blue-600 mt-1 shrink-0" />

                        <div>
                          <p className="text-xs text-slate-400 font-medium">
                            Parking Location
                          </p>

                          <p className="text-sm text-slate-700 mt-1">
                            {parkingAddress}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
                      <span className="text-xs text-slate-400">
                        Booking ID: #{booking.id}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setSelectedBooking(booking)
                          }
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm font-medium"
                        >
                          <FaEye />
                          View
                        </button>

                        {canViewQR(booking) && (
                          <button
                            onClick={() =>
                              handleViewQR(booking)
                            }
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition text-sm font-medium"
                          >
                            <FaQrcode />
                            QR
                          </button>
                        )}

                        {canCancelBooking(booking) && (
                          <button
                            onClick={() =>
                              setDeleteBooking(booking)
                            }
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition text-sm font-medium"
                          >
                            <FaTrash />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* VIEW BOOKING MODAL */}

      {selectedBooking &&
        (() => {
          const status = getStatusConfig(
            selectedBooking.status
          );

          const payment = getPaymentConfig(
            selectedBooking.payment_status
          );

          const vehicle = getVehicleDetails(
            selectedBooking
          );

          const parkingName = getParkingName(
            selectedBooking
          );

          const parkingAddress = getParkingAddress(
            selectedBooking
          );

          return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                onClick={() =>
                  setSelectedBooking(null)
                }
              />

              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
                <div className="sticky top-0 z-10 bg-white p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                      Complete Booking Details
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      Booking #{selectedBooking.id}
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedBooking(null)
                    }
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">
                        Booking Status
                      </p>

                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.badge}`}
                        >
                          {status.icon}
                          {status.title}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        Payment
                      </p>

                      <span
                        className={`inline-flex mt-2 px-3 py-1.5 rounded-full border text-xs font-bold ${payment.className}`}
                      >
                        {payment.title}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-4">
                      Parking Information
                    </h4>

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FaParking />
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {parkingName}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            Parking ID: #
                            {selectedBooking.parking_id}
                          </p>

                          {parkingAddress && (
                            <p className="text-sm text-slate-500 mt-3 flex gap-2">
                              <FaMapMarkerAlt className="text-blue-500 mt-1 shrink-0" />
                              {parkingAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-400">
                        Parking Slot
                      </p>

                      <p className="font-bold text-slate-900 mt-2">
                        {selectedBooking.slot_number ||
                          `Slot #${selectedBooking.slot_id || "—"}`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-400">
                        Booking Date
                      </p>

                      <p className="font-bold text-slate-900 mt-2">
                        {formatDate(
                          selectedBooking.booking_date
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-400">
                        Start Time
                      </p>

                      <p className="font-bold text-slate-900 mt-2">
                        {formatTime(
                          selectedBooking.start_time
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-400">
                        End Time
                      </p>

                      <p className="font-bold text-slate-900 mt-2">
                        {formatTime(
                          selectedBooking.end_time
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-4">
                      Vehicle Information
                    </h4>

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                          <FaCar />
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {vehicle.number}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            {[vehicle.name, vehicle.type]
                              .filter(Boolean)
                              .join(" • ") ||
                              "Vehicle details not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">
                          Total Booking Amount
                        </p>

                        <p className="text-3xl font-bold text-blue-700 mt-1">
                          {formatAmount(
                            selectedBooking.amount
                          )}
                        </p>
                      </div>

                      <FaReceipt className="text-3xl text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white p-6 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                  {canViewQR(selectedBooking) && (
                    <button
                      onClick={() =>
                        handleViewQR(selectedBooking)
                      }
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    >
                      <FaQrcode />
                      View QR
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setSelectedBooking(null)
                    }
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* CANCEL CONFIRMATION MODAL */}

      {deleteBooking && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              if (!cancelling) {
                setDeleteBooking(null);
              }
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
                <FaTrash />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mt-5">
                Cancel booking?
              </h3>

              <p className="text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to cancel booking{" "}
                <strong className="text-slate-700">
                  #{deleteBooking.id}
                </strong>
                ? This action will release the parking slot.
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Date
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {formatDate(
                      deleteBooking.booking_date
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-slate-500">
                    Time
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {formatTime(
                      deleteBooking.start_time
                    )}{" "}
                    -{" "}
                    {formatTime(
                      deleteBooking.end_time
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-slate-500">
                    Amount
                  </span>

                  <span className="text-sm font-bold text-blue-600">
                    {formatAmount(
                      deleteBooking.amount
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  disabled={cancelling}
                  onClick={() =>
                    setDeleteBooking(null)
                  }
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Keep Booking
                </button>

                <button
                  disabled={cancelling}
                  onClick={confirmCancelBooking}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <FaSyncAlt className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Cancel
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