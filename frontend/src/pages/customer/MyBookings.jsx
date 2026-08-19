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
  FaPlus,
  FaDirections,
  FaPrint,
  FaShieldAlt,
  FaBolt,
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

  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [deleteBooking, setDeleteBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // =========================================================
  // LOAD BOOKINGS
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
        error?.response?.data?.detail || "Unable to load your bookings.";
      showToast(message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
          title: "Booked (Ready for Entry)",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          dot: "bg-blue-400",
          icon: <FaCalendarAlt />,
        };

      case "ACTIVE":
      case "PARKED":
      case "ONGOING":
      case "CHECKED_IN":
        return {
          title: "Parked (Active)",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse",
          dot: "bg-emerald-400",
          icon: <FaCar />,
        };

      case "COMPLETED":
        return {
          title: "Completed",
          badge: "bg-slate-700/50 text-slate-300 border-slate-600",
          dot: "bg-slate-400",
          icon: <FaCheckCircle />,
        };

      case "CANCELLED":
      case "CANCELED":
        return {
          title: "Cancelled",
          badge: "bg-red-500/10 text-red-400 border-red-500/30",
          dot: "bg-red-400",
          icon: <FaTimes />,
        };

      default:
        return {
          title: status || "Unknown",
          badge: "bg-slate-800 text-slate-400 border-slate-700",
          dot: "bg-slate-500",
          icon: <FaClock />,
        };
    }
  };

  // =========================================================
  // KPI STATS
  // =========================================================

  const statistics = useMemo(() => {
    return {
      total: bookings.length,
      booked: bookings.filter((b) =>
        ["BOOKED", "CONFIRMED"].includes(normalizeStatus(b.status))
      ).length,
      active: bookings.filter((b) =>
        ["ACTIVE", "PARKED", "ONGOING", "CHECKED_IN"].includes(
          normalizeStatus(b.status)
        )
      ).length,
      completed: bookings.filter(
        (b) => normalizeStatus(b.status) === "COMPLETED"
      ).length,
    };
  }, [bookings]);

  // =========================================================
  // SEARCH & FILTER
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
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

      const matchesSearch =
        !search || values.some((val) => val.includes(search));

      const normalizedStatus = normalizeStatus(booking.status);

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizedStatus === statusFilter ||
        (statusFilter === "BOOKED" && normalizedStatus === "CONFIRMED") ||
        (statusFilter === "ACTIVE" &&
          ["ACTIVE", "PARKED", "ONGOING", "CHECKED_IN"].includes(
            normalizedStatus
          )) ||
        (statusFilter === "CANCELLED" && normalizedStatus === "CANCELED");

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
  // CANCEL RESERVATION
  // =========================================================

  const confirmCancelBooking = async () => {
    if (!deleteBooking) return;

    try {
      setCancelling(true);
      const response = await axios.delete(`/booking/${deleteBooking.id}`);

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Unable to cancel booking.");
      }

      showToast("Reservation cancelled successfully.", "success");
      setDeleteBooking(null);
      await loadBookings(true);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      showToast(
        error?.response?.data?.detail || "Failed to cancel booking.",
        "error"
      );
    } finally {
      setCancelling(false);
    }
  };

  // =========================================================
  // VIEW QR
  // =========================================================

  const handleViewQR = (booking) => {
    navigate(`/customer/qr?booking=${booking.id}`, {
      state: {
        booking,
        bookingId: booking.id,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px] animate-fadeIn">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-700/80 text-emerald-200"
                : "bg-red-950/90 border-red-700/80 text-red-200"
            }`}
          >
            <div className="text-xl shrink-0 mt-0.5">
              {toast.type === "success" ? (
                <FaCheckCircle className="text-emerald-400" />
              ) : (
                <FaExclamationTriangle className="text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">
                {toast.type === "success" ? "Success" : "Notice"}
              </p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center text-sm shadow-sm"
              >
                <FaArrowLeft />
              </button>
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                  Customer Workspace
                </span>
                <h1 className="font-black text-white text-base sm:text-lg">
                  My Parking Reservations
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadBookings(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
              >
                <FaSyncAlt className={refreshing ? "animate-spin text-blue-400" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => navigate("/customer/search")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition active:scale-95"
              >
                <FaPlus /> <span className="hidden sm:inline">Book Parking</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* KPI STATS SUMMARY */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Total Reservations
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {statistics.total}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                <FaParking />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Currently Parked
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {statistics.active}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">
                <FaCar />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Upcoming Bookings
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">
                {statistics.booked}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                <FaCalendarAlt />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Completed Trips
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-300">
                {statistics.completed}
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center text-sm">
                <FaCheckCircle />
              </div>
            </div>
          </div>

        </section>

        {/* SEARCH & FILTERS TOOLBAR */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 mb-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search facility, booking #, slot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* FILTER TABS */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {[
                { label: "All", value: "ALL" },
                { label: "Active Parked", value: "ACTIVE" },
                { label: "Booked", value: "BOOKED" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                    statusFilter === tab.value
                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SORT DROPDOWN */}
            <div className="w-full md:w-auto flex justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="NEWEST">Sort: Newest First</option>
                <option value="OLDEST">Sort: Oldest First</option>
                <option value="AMOUNT_HIGH">Sort: Highest Amount</option>
                <option value="AMOUNT_LOW">Sort: Lowest Amount</option>
              </select>
            </div>

          </div>
        </section>

        {/* BOOKINGS LISTING */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 mt-4">Loading your reservation history...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-3xl mb-4">
              <FaParking />
            </div>
            <h3 className="text-lg font-bold text-white">No Reservations Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "ALL"
                ? "No bookings matched your search filters."
                : "You have not reserved any parking slots yet."}
            </p>
            <button
              onClick={() => navigate("/customer/search")}
              className="mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
            >
              Explore Parking Locations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBookings.map((b) => {
              const statusCfg = getStatusConfig(b.status);
              const normalized = normalizeStatus(b.status);
              const isCancellable = normalized === "BOOKED" || normalized === "CONFIRMED";
              const hasQR = ["BOOKED", "CONFIRMED", "ACTIVE", "PARKED", "ONGOING", "CHECKED_IN"].includes(normalized);

              return (
                <div
                  key={b.id}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <div>
                    {/* TOP STATUS BAR */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{b.id}
                        </span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.title}
                        </div>
                      </div>

                      <span className="font-black text-emerald-400 text-base">
                        ₹{b.amount || 0}
                      </span>
                    </div>

                    {/* FACILITY & LOCATION */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-base text-white group-hover:text-blue-400 transition">
                          {b.parking_name || `Parking Facility #${b.parking_id}`}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 truncate max-w-xs">
                          <FaMapMarkerAlt className="text-blue-400 shrink-0" />
                          {b.address || "Verified Parking Hub"}
                        </p>
                      </div>

                      {/* SLOT BADGE */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          Slot
                        </span>
                        <span className="inline-block mt-0.5 px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-black text-sm">
                          {b.slot_number ? b.slot_number : `Bay #${b.slot_id || "A1"}`}
                        </span>
                      </div>
                    </div>

                    {/* DETAILS GRID */}
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                          Date & Window
                        </span>
                        <p className="font-bold text-slate-200 mt-0.5 truncate">
                          {b.booking_date ? new Date(b.booking_date).toLocaleDateString() : "Today"}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {b.start_time || "00:00"} - {b.end_time || "23:59"}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                          Vehicle
                        </span>
                        <p className="font-mono font-bold text-slate-200 mt-0.5 truncate">
                          {b.vehicle_number || "4-Wheeler"}
                        </p>
                        <p className="text-slate-400 text-[11px] truncate">
                          {b.vehicle_name || "Standard Vehicle"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS BAR */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
                    {hasQR && (
                      <button
                        onClick={() => handleViewQR(b)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-95"
                      >
                        <FaQrcode /> FastPass QR
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBookingForInvoice(b)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                      title="View Digital Invoice"
                    >
                      <FaReceipt />
                    </button>

                    {b.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          (b.parking_name || "") + " " + b.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                        title="Directions"
                      >
                        <FaDirections />
                      </a>
                    )}

                    {isCancellable && (
                      <button
                        onClick={() => setDeleteBooking(b)}
                        className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold transition"
                        title="Cancel Reservation"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* =====================================================
          INVOICE / RECEIPT MODAL
      ===================================================== */}
      {selectedBookingForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black">
                  <FaParking />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">ParkEase Tax Invoice</h3>
                  <p className="text-[10px] text-slate-400">Invoice #{selectedBookingForInvoice.id}-PE</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForInvoice(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-slate-800/50 border border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Facility</span>
                <strong className="text-white">{selectedBookingForInvoice.parking_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Bay</span>
                <strong className="text-blue-400 font-mono">Slot #{selectedBookingForInvoice.slot_number || selectedBookingForInvoice.slot_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Date</span>
                <span className="text-slate-200">{selectedBookingForInvoice.booking_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Time</span>
                <span className="text-slate-200">{selectedBookingForInvoice.start_time} - {selectedBookingForInvoice.end_time}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/80 pt-2.5">
                <span className="text-slate-300 font-bold">Total Paid</span>
                <strong className="text-emerald-400 text-sm font-black">₹{selectedBookingForInvoice.amount || 0}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <FaPrint /> Print Receipt
              </button>
              <button
                onClick={() => handleViewQR(selectedBookingForInvoice)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <FaQrcode /> View QR Pass
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          CANCEL CONFIRMATION MODAL
      ===================================================== */}
      {deleteBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 max-w-sm w-full rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-4">
              <FaExclamationTriangle />
            </div>

            <h3 className="text-lg font-bold text-white">Cancel Reservation?</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Are you sure you want to cancel booking <strong className="text-white">#{deleteBooking.id}</strong>? The reserved bay will be released for other drivers.
            </p>

            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setDeleteBooking(null)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Keep Booking
              </button>

              <button
                onClick={confirmCancelBooking}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5"
              >
                {cancelling ? <FaSyncAlt className="animate-spin" /> : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MyBookings;