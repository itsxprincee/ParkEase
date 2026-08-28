import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiSearch,
  FiRefreshCw,
  FiSliders,
  FiCompass,
  FiXCircle,
  FiCheck,
  FiDownload,
  FiPrinter,
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

// ── Date & Time Formatters (Bulletproof Zero-NaN) ─────────────────────────────
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

function cleanSingleTime(str) {
  if (!str) return "";
  const cleaned = String(str).trim();

  // If already "11:00 AM" or "01:00 PM"
  const ampmMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }

  // If 24hr "14:00" or "2026-08-24 14:00"
  const match24 = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = match24[2];
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }

  return cleaned;
}

function formatTimeWindow(startStr, endStr) {
  if (!startStr && !endStr) return "Flexible Timing";
  if (startStr && startStr.includes("–")) return startStr;
  const start = cleanSingleTime(startStr || "10:00");
  const end = cleanSingleTime(endStr || "12:00");
  return `${start} – ${end}`;
}

// ── Bulletproof Countdown Calculator ─────────────────────────────────────────
function getRemainingTime(booking) {
  if (booking.pass_type === "DAILY_PASS") {
    return {
      label: `Valid until ${booking.last_exit_rule || "11:00 PM"}`,
      isUrgent: false,
      isExpired: false,
    };
  }

  const endStr = booking.end_time;
  if (!endStr) return null;

  try {
    const now = new Date();
    const targetDate = booking.booking_date ? new Date(booking.booking_date) : new Date();
    const end = isNaN(targetDate.getTime()) ? new Date() : new Date(targetDate);

    // Extract hours and minutes safely
    let h = 0;
    let m = 0;
    const isPM = /pm/i.test(endStr);
    const isAM = /am/i.test(endStr);
    const match = endStr.match(/(\d{1,2}):(\d{2})/);

    if (match) {
      h = parseInt(match[1], 10);
      m = parseInt(match[2], 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
    } else {
      return null;
    }

    end.setHours(h, m, 0, 0);

    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) {
      return {
        label: "Expired",
        isUrgent: true,
        isExpired: true,
      };
    }

    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return {
      label: hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`,
      isUrgent: diffMins <= 20,
      isExpired: false,
    };
  } catch (_) {
    return null;
  }
}

export default function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
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
      showToast(`Parking pass extended by ${extendingMinutes} minutes!`, "success");
      setExtendModalBooking(null);
      loadBookings(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to extend pass.", "error");
    } finally {
      setExtending(false);
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

      const rawStatus = (item.status || "ACTIVE").toUpperCase();
      if (statusFilter === "ACTIVE") return rawStatus === "ACTIVE" || rawStatus === "BOOKED";
      if (statusFilter === "UPCOMING") return rawStatus === "UPCOMING" || rawStatus === "CONFIRMED";
      if (statusFilter === "COMPLETED") return rawStatus === "COMPLETED";
      if (statusFilter === "CANCELLED") return rawStatus === "CANCELLED";
      return true;
    });
  }, [bookings, search, statusFilter]);

  const tabs = [
    { id: "ALL", label: `All Passes (${bookings.length})` },
    {
      id: "ACTIVE",
      label: `🟢 Active (${bookings.filter((b) => (b.status || "").toUpperCase() === "ACTIVE" || (b.status || "").toUpperCase() === "BOOKED").length})`,
    },
    {
      id: "COMPLETED",
      label: `⚪ Completed (${bookings.filter((b) => (b.status || "").toUpperCase() === "COMPLETED").length})`,
    },
    {
      id: "CANCELLED",
      label: `🔴 Cancelled (${bookings.filter((b) => (b.status || "").toUpperCase() === "CANCELLED").length})`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#08080c] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Command Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#090b10] via-zinc-950 to-black text-white shadow-2xl p-6 sm:p-8 border border-zinc-800">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black tracking-wide border border-emerald-500/25">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MY PARKING PASSES & TAX RECEIPTS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                My Parking Activity
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Live gate entry passes, active parking timers, receipts, and vehicle spot recall.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => loadBookings(true)}
                disabled={refreshing}
                className="p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-white transition-all active:scale-95 shadow-md cursor-pointer"
                title="Refresh Bookings"
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <FiMapPin className="w-4 h-4" />
                <span>Book a Spot</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search Filter Bar */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl p-3 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  statusFilter === tab.id
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-black"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative lg:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by facility, spot, pass #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-input pe-input-icon-left text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs"
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BOOKING CARDS GRID (DISTINCT HIGH-CONTRAST PASS STATUSES)
        ══════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={FiClock}
            title="No parking passes found"
            description="You don't have any bookings matching this category."
            actionLabel="Reserve a Spot Now"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBookings.map((b) => {
              const rawStatus = (b.status || "ACTIVE").toUpperCase();
              const isCompleted = rawStatus === "COMPLETED";
              const isCancelled = rawStatus === "CANCELLED";
              const isActive = rawStatus === "ACTIVE" || rawStatus === "BOOKED";
              const remaining = isActive ? getRemainingTime(b) : null;
              const isExpired = remaining?.isExpired;
              const isBike = String(b.vehicle_type || "").toLowerCase().includes("bike");

              return (
                <div
                  key={b.id}
                  className={`group relative rounded-3xl backdrop-blur-xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? isExpired
                        ? "bg-amber-500/5 dark:bg-amber-950/10 border-amber-500/50 shadow-[0_4px_24px_rgba(245,158,11,0.15)]"
                        : "bg-white/95 dark:bg-zinc-900/90 border-emerald-500/40 dark:border-emerald-500/40 shadow-[0_4px_25px_rgba(16,185,129,0.15)] hover:shadow-2xl"
                      : isCompleted
                      ? "bg-white/90 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-90 shadow-xs"
                      : "bg-red-500/5 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 opacity-75"
                  }`}
                >
                  {/* Top Status Header Bar */}
                  <div
                    className={`p-4 border-b flex items-center justify-between ${
                      isActive
                        ? isExpired
                          ? "bg-amber-500/10 border-amber-500/20"
                          : "bg-emerald-500/10 border-emerald-500/20"
                        : isCompleted
                        ? "bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Distinct Status Badges */}
                      {isActive ? (
                        isExpired ? (
                          <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                            <span>⚠️ TIME EXPIRED</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                            <span>🟢 ACTIVE GATE PASS</span>
                          </span>
                        )
                      ) : isCompleted ? (
                        <span className="px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>COMPLETED</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <FiXCircle className="w-3 h-3 text-red-500" />
                          <span>CANCELLED</span>
                        </span>
                      )}

                      {/* Remaining Time Pill */}
                      {remaining && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border flex items-center gap-1 ${
                            remaining.isUrgent
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          <FiClock className="w-3 h-3" />
                          <span>{remaining.label}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-black font-mono text-zinc-500 dark:text-zinc-400">
                      Pass #{b.id}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="text-base font-black text-zinc-900 dark:text-white truncate">
                            {b.parking_name || "ParkEase Hub"}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate font-medium">
                            <FiMapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span>{b.parking_address || "City Center Location"}</span>
                          </p>
                        </div>

                        {/* Assigned Bay Badge */}
                        <div className="px-3 py-1.5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-black shrink-0 font-mono shadow-xs">
                          Bay {b.slot_number || "A-01"}
                        </div>
                      </div>

                      {/* Metadata Triple Grid */}
                      <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-750 text-xs">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">Date</p>
                          <p className="text-xs font-black text-zinc-900 dark:text-white truncate">
                            {formatPassDate(b.booking_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                            {b.pass_type === "DAILY_PASS" ? "Validity" : "Time Window"}
                          </p>
                          <p className="text-xs font-black text-zinc-900 dark:text-white truncate font-mono">
                            {b.pass_type === "DAILY_PASS"
                              ? `< ${b.last_exit_rule || "11 PM"}`
                              : formatTimeWindow(b.start_time, b.end_time)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                            Vehicle Plate
                          </p>
                          <div className="license-plate text-[10px] shrink-0 inline-flex shadow-xs">
                            <span className="license-plate-ind">IND</span>
                            <span className="font-mono font-black tracking-wider">
                              {b.vehicle_number || "MH-01"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Day Pass Alert */}
                      {b.pass_type === "DAILY_PASS" && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                          <span>🎟️ Unlimited Full-Day Pass</span>
                          <span>{b.is_inside ? "🟢 Vehicle Inside" : "⚪ Ready for Entry"}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isActive && !isExpired && (
                          <button
                            onClick={() => {
                              setExtendModalBooking(b);
                              setExtendingMinutes(60);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <FiClock className="w-3.5 h-3.5 text-amber-500" />
                            <span>+ Extend</span>
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => setFindCarModalBooking(b)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <FiCompass className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{isBike ? "Locate Bike" : "Locate Car"}</span>
                          </button>
                        )}
                        {isActive && !b.is_inside && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Primary Pass / Receipt Trigger */}
                      <button
                        onClick={() =>
                          navigate(`/customer/qr?booking=${b.id}`, { state: { booking: b } })
                        }
                        className={`px-4.5 py-2 rounded-full text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                            : "bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950"
                        }`}
                      >
                        <span>{isActive ? "🎟️ Gate Boarding Pass" : "🧾 View Tax Receipt & Pass"}</span>
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
          isOpen={!!extendModalBooking}
          onClose={() => setExtendModalBooking(null)}
          title="Extend Parking Duration"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-1">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <p className="text-xs text-zinc-400">Current Facility & Spot</p>
              <p className="text-sm font-black text-zinc-900 dark:text-white">
                {extendModalBooking.parking_name} • Spot {extendModalBooking.slot_number}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Scheduled End Time: {cleanSingleTime(extendModalBooking.end_time || "12:00")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Select Additional Time:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mins: 30, price: 20 },
                  { mins: 60, price: 40 },
                  { mins: 120, price: 75 },
                ].map((opt) => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setExtendingMinutes(opt.mins)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                      extendingMinutes === opt.mins
                        ? "border-emerald-500 bg-emerald-500/10 text-zinc-900 dark:text-white font-black"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                    }`}
                  >
                    <p className="text-sm font-black">+{opt.mins} min</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{opt.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setExtendModalBooking(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={extending}
                onClick={handleExtendBooking}
              >
                Confirm Extension
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── CANCEL BOOKING MODAL ─── */}
      {cancelModalBooking && (
        <Modal
          isOpen={!!cancelModalBooking}
          onClose={() => setCancelModalBooking(null)}
          title="Cancel Parking Pass"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-1">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1">
              <p className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <FiAlertCircle className="w-4 h-4" />
                Are you sure you want to cancel Pass #{cancelModalBooking.id}?
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Your spot reservation for <strong>Spot {cancelModalBooking.slot_number}</strong> will be released immediately for other drivers. Full refund will be credited.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setCancelModalBooking(null)}
              >
                Keep Pass
              </Button>
              <Button
                variant="danger"
                loading={cancelling}
                onClick={handleCancelBooking}
              >
                Yes, Cancel Pass
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── FIND MY CAR / BIKE MODAL ─── */}
      <FindMyCarModal
        isOpen={!!findCarModalBooking}
        onClose={() => setFindCarModalBooking(null)}
        booking={findCarModalBooking}
      />
    </div>
  );
}
