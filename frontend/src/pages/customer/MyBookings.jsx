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

function formatPassDate(dateVal) {
  if (!dateVal) return "Today";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).split("T")[0] || "Today";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return String(dateVal).split("T")[0] || "Today";
  }
}

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
  const [extendModalBooking, setExtendModalBooking] = useState(null);
  const [extendingMinutes, setExtendingMinutes] = useState(60);
  const [extending, setExtending] = useState(false);
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

  const handleExtendBooking = async () => {
    if (!extendModalBooking) return;
    const additionalAmount = extendingMinutes === 30 ? 20 : extendingMinutes === 60 ? 40 : 75;
    try {
      setExtending(true);
      await API.post(`/booking/extend/${extendModalBooking.id}`, {
        additional_minutes: extendingMinutes,
        additional_amount: additionalAmount,
      });
      showToast(
        `Parking pass extended by ${extendingMinutes} minutes!`,
        "success"
      );
      setExtendModalBooking(null);
      loadBookings(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to extend pass.", "error");
    } finally {
      setExtending(false);
    }
  };

  // Remaining time helper
  const getRemainingTime = (b) => {
    if (!b.end_time || b.pass_type === "DAILY_PASS") return null;
    try {
      const [endH, endM] = b.end_time.split(":").map(Number);
      const now = new Date();
      const end = new Date();
      end.setHours(endH, endM, 0, 0);
      const diffMs = end - now;
      if (diffMs <= 0) return { label: "Expired", isUrgent: true, expired: true };
      const diffMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return {
        label: hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`,
        isUrgent: diffMins <= 20,
        expired: false,
      };
    } catch (_) {
      return null;
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
        {/* UBER ACTIVITY COMMAND HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-black dark:bg-zinc-900 text-white shadow-2xl p-6 sm:p-8 border border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-black tracking-wide border border-zinc-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVITY & TRIPS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                My Parking Activity
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                View your active parking passes, digital gate QR tickets, and receipts.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => loadBookings(true)}
                disabled={refreshing}
                className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-all active:scale-95 shadow-md cursor-pointer"
                title="Refresh Bookings"
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-zinc-100 text-black hover:bg-zinc-200 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <FiMapPin className="w-4 h-4 text-emerald-600" />
                <span>Find Parking</span>
              </button>
            </div>
          </div>
        </div>

        {/* Uber Pill Filter Bar */}
        <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-xl p-3 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full overflow-x-auto border border-zinc-200/70 dark:border-zinc-750">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search bookings, location or spot..."
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
            title="No bookings found"
            description="You don't have any bookings matching this filter."
            actionLabel="Book a Spot"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBookings.map((b) => {
              const status = b.status?.toUpperCase() || "ACTIVE";
              const isActive = status === "ACTIVE" || status === "BOOKED";

              const remaining = isActive ? getRemainingTime(b) : null;

              return (
                <div
                  key={b.id}
                  className="group relative bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Top Status Header */}
                  <div className="p-4 bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[status] || "default"} dot>
                        {status}
                      </Badge>
                      {remaining && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border flex items-center gap-1 ${
                            remaining.isUrgent
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          <FiClock className="w-3 h-3" />
                          <span>{remaining.label}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-black text-zinc-400 font-mono">
                      Pass #{b.id}
                    </span>
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-zinc-900 dark:text-white line-clamp-1">
                          {b.parking_name || "Parking Location"}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span>{b.parking_address || "City Location"}</span>
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black shrink-0 font-mono shadow-xs">
                        Spot {b.slot_number || "A-1"}
                      </span>
                    </div>

                    {/* Metadata Triple Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">Date</p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white">
                          {formatPassDate(b.booking_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                          {b.pass_type === "DAILY_PASS" ? "Valid Until" : "Hours"}
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
                        <span>🎟️ Full-Day Pass</span>
                        <span>{b.is_inside ? "🟢 Inside Spot" : "⚪ Out (Active)"}</span>
                      </div>
                    )}

                    {/* Actions (Uber Style) */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isActive && (
                          <button
                            onClick={() => {
                              setExtendModalBooking(b);
                              setExtendingMinutes(60);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <FiClock className="w-3.5 h-3.5 text-amber-500" />
                            <span>+ Extend</span>
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => setFindCarModalBooking(b)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <FiCompass className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Locate</span>
                          </button>
                        )}
                        <button
                          onClick={() => setInvoiceModalBooking(b)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-700"
                        >
                          <FiPrinter className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                        {isActive && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          navigate(`/customer/qr?booking=${b.id}`, { state: { booking: b } })
                        }
                        className="px-4.5 py-2 rounded-full bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{isActive ? "QR Pass" : "View Trip"}</span>
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

      {/* ─── EXTEND PARKING MODAL ─── */}
      {extendModalBooking && (
        <Modal
          isOpen={Boolean(extendModalBooking)}
          onClose={() => setExtendModalBooking(null)}
          title="Extend Parking Time"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-2">
            <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Current End Time</p>
                <p className="text-lg font-black font-mono">{extendModalBooking.end_time || "12:00"}</p>
                <p className="text-xs text-emerald-400 font-bold truncate mt-0.5">{extendModalBooking.parking_name}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                  Spot {extendModalBooking.slot_number}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Choose Extra Time
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { mins: 30, label: "+30 Mins", price: "₹20" },
                  { mins: 60, label: "+1 Hour", price: "₹40", popular: true },
                  { mins: 120, label: "+2 Hours", price: "₹75" },
                ].map((opt) => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setExtendingMinutes(opt.mins)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer relative ${
                      extendingMinutes === opt.mins
                        ? "border-emerald-500 bg-emerald-500/10 text-zinc-900 dark:text-white font-black shadow-xs ring-1 ring-emerald-500"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black">
                        BEST
                      </span>
                    )}
                    <p className="text-sm font-black">{opt.label}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-0.5">{opt.price}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Total Due for Extension:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{extendingMinutes === 30 ? 20 : extendingMinutes === 60 ? 40 : 75}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => setExtendModalBooking(null)}>
                Cancel
              </Button>
              <Button variant="primary" loading={extending} onClick={handleExtendBooking}>
                Pay & Extend Pass
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── INVOICE RECEIPT MODAL ─── */}
      {invoiceModalBooking && (
        <Modal
          isOpen={Boolean(invoiceModalBooking)}
          onClose={() => setInvoiceModalBooking(null)}
          title="Parking Receipt"
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
                Receipt #{invoiceModalBooking.id} • ParkEase
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: "Parking Location", value: invoiceModalBooking.parking_name || "Parking Spot" },
                { label: "Spot Assigned", value: `Spot ${invoiceModalBooking.slot_number || "A-1"}` },
                { label: "Vehicle", value: invoiceModalBooking.vehicle_number || "MH-01" },
                { label: "Date", value: formatPassDate(invoiceModalBooking.booking_date) },
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
                Print / Save Receipt
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
