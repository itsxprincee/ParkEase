import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiTruck,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiPrinter,
  FiX,
  FiArrowRight,
  FiRefreshCw,
  FiShield,
  FiZap,
  FiCompass,
  FiNavigation,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import FindMyCarModal from "../../components/FindMyCarModal";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-3.5 h-3.5" />
          </div>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

const STATUS_VARIANT = {
  ACTIVE: "success",
  BOOKED: "success",
  UPCOMING: "info",
  CONFIRMED: "info",
  COMPLETED: "default",
  CANCELLED: "danger",
};

export default function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [invoiceModalBooking, setInvoiceModalBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [findCarModalBooking, setFindCarModalBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await API.get("/booking/my-bookings");
      const list = Array.isArray(response.data) ? response.data : response.data?.bookings || [];
      setBookings(list);
    } catch (_) {
      showToast("Unable to load bookings.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      await API.post(`/booking/cancel/${cancelModalBooking.id}`);
      showToast("Booking cancelled successfully.", "success");
      setCancelModalBooking(null);
      loadBookings(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to cancel.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.parking_name?.toLowerCase().includes(q) ||
        item.slot_number?.toLowerCase().includes(q) ||
        String(item.id).includes(q) ||
        item.vehicle_number?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const status = item.status?.toUpperCase() || "ACTIVE";
      if (statusFilter === "ACTIVE") return status === "ACTIVE" || status === "BOOKED";
      if (statusFilter === "UPCOMING") return status === "UPCOMING" || status === "CONFIRMED";
      if (statusFilter === "COMPLETED") return status === "COMPLETED";
      if (statusFilter === "CANCELLED") return status === "CANCELLED";
      return true;
    });
  }, [bookings, search, statusFilter]);

  const tabs = [
    { id: "ALL", label: "All Passes" },
    { id: "ACTIVE", label: "Active Passes" },
    { id: "UPCOMING", label: "Upcoming" },
    { id: "COMPLETED", label: "Completed" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Hero Box */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#0d0d12] to-black border border-zinc-800/90 shadow-[0_16px_50px_rgba(0,0,0,0.35)] text-white p-6 sm:p-8">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MY DIGITAL PASS WALLET</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                My Passes & Reservations
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Instant contactless entry passes, barrier gate QR codes, and parking receipts.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => loadBookings(true)}
                disabled={refreshing}
                className="p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.12] text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md cursor-pointer"
                title="Refresh Passes"
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <FiMapPin className="w-4 h-4" />
                <span>Find Parking</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-3 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-black"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search passes, hub or slot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-input pe-input-icon-left text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-0.5"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Passes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No passes found"
            description="You don't have any bookings matching this filter."
            actionLabel="Book a Spot"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBookings.map((b) => {
              const status = b.status?.toUpperCase() || "ACTIVE";
              const isActive = status === "ACTIVE" || status === "BOOKED";

              return (
                <div
                  key={b.id}
                  className="group relative bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Top Status Header */}
                  <div className="p-4 bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Badge variant={STATUS_VARIANT[status] || "default"} dot>
                      {status}
                    </Badge>
                    <span className="text-[11px] font-black text-zinc-400 font-mono">
                      Pass #{b.id}
                    </span>
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-zinc-900 dark:text-white line-clamp-1">
                          {b.parking_name || "ParkEase Hub"}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span>{b.parking_address || "City Location"}</span>
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black shrink-0 font-mono shadow-xs">
                        Bay {b.slot_number || "A-1"}
                      </span>
                    </div>

                    {/* Metadata Triple Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">Date</p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white font-mono">
                          {b.booking_date || "Today"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                          {b.pass_type === "DAILY_PASS" ? "Curfew" : "Hours"}
                        </p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white font-mono truncate">
                          {b.pass_type === "DAILY_PASS"
                            ? `< ${b.last_exit_rule || "11 PM"}`
                            : `${b.start_time || "10:00"}–${b.end_time || "12:00"}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                          Vehicle
                        </p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white font-mono truncate">
                          {b.vehicle_number || "MH-01"}
                        </p>
                      </div>
                    </div>

                    {/* Unlimited Day Pass Strip */}
                    {b.pass_type === "DAILY_PASS" && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                        <span>🎟️ Multi-Entry Day Pass</span>
                        <span>{b.is_inside ? "🟢 Inside Bay" : "⚪ Out (Active)"}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isActive && (
                          <button
                            onClick={() => setFindCarModalBooking(b)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <FiCompass className="w-3.5 h-3.5 animate-spin-slow text-emerald-500" />
                            <span>Find Car</span>
                          </button>
                        )}
                        <button
                          onClick={() => setInvoiceModalBooking(b)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                        >
                          <FiPrinter className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                        {isActive && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          navigate(`/customer/qr?booking=${b.id}`, { state: { booking: b } })
                        }
                        className="px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{isActive ? "Gate Pass" : "View Ticket"}</span>
                        <FiArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── INVOICE RECEIPT MODAL ─── */}
      {invoiceModalBooking && (
        <Modal
          isOpen={Boolean(invoiceModalBooking)}
          onClose={() => setInvoiceModalBooking(null)}
          title="Digital Parking Receipt"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-2">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-zinc-900 dark:text-white">
                Payment Confirmed
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Receipt #{invoiceModalBooking.id} • ParkEase Verified
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: "Parking Hub", value: invoiceModalBooking.parking_name || "ParkEase Hub" },
                { label: "Bay Assigned", value: `Bay ${invoiceModalBooking.slot_number || "A-1"}` },
                { label: "Vehicle", value: invoiceModalBooking.vehicle_number || "MH-01" },
                { label: "Booking Date", value: invoiceModalBooking.booking_date || "Today" },
                {
                  label: "Amount Paid",
                  value: `₹${
                    invoiceModalBooking.amount || invoiceModalBooking.total_amount || 25
                  }`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white font-mono">{value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button fullWidth variant="primary" onClick={() => window.print()}>
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── CANCEL MODAL ─── */}
      {cancelModalBooking && (
        <Modal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => setCancelModalBooking(null)}
          title="Cancel Reservation"
          maxWidth="max-w-sm"
        >
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="font-black text-zinc-900 dark:text-white">
                Cancel Pass #{cancelModalBooking.id}?
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Your slot reservation will be released for other drivers.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button variant="outline" onClick={() => setCancelModalBooking(null)}>
                Keep Pass
              </Button>
              <Button variant="danger" loading={cancelling} onClick={handleCancelBooking}>
                Yes, Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── FIND MY CAR & WALKING RADAR MODAL ─── */}
      {findCarModalBooking && (
        <FindMyCarModal
          isOpen={Boolean(findCarModalBooking)}
          onClose={() => setFindCarModalBooking(null)}
          booking={findCarModalBooking}
        />
      )}
    </div>
  );
}
