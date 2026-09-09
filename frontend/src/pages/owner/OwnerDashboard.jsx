import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiPlus,
  FiCamera,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiLayers,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiRefreshCw,
  FiLogIn,
  FiLogOut,
  FiClock,
  FiCheck,
  FiTruck,
  FiArrowUpRight,
  FiBarChart2,
  FiDownload,
  FiX,
  FiTrendingUp,
  FiZap,
  FiShield,
  FiCopy,
  FiInfo,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../context/ThemeContext";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* ─── Toast Notification ─────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-xs sm:text-sm font-bold transition-all ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-rose-600 border-rose-200 dark:border-rose-900/50 shadow-rose-500/15"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 shadow-emerald-500/15"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
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

/* ─── Animated Number Counter ───────────────────────────────────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) {
      setDisplay(0);
      return;
    }
    const steps = 14;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, 200 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* ─── Authentic Indian License Plate Tag ────────────────────────────────── */
function IndianLicensePlate({ number, onCopy, copied }) {
  return (
    <div
      onClick={onCopy}
      className="license-plate text-[11px] sm:text-xs py-1 px-2.5 shrink-0 border-2 border-zinc-900 dark:border-zinc-700 bg-white hover:border-emerald-500 transition-all cursor-pointer inline-flex items-center select-none group relative shadow-xs rounded-lg"
      title="Click to copy vehicle plate"
    >
      <span className="license-plate-ind shrink-0">
        <span className="chakra" />
        IND
      </span>
      <span className="font-mono font-black tracking-widest text-zinc-900 flex items-center gap-1.5 uppercase">
        {number || "MH 02 AB 1234"}
        <FiCopy
          className={`w-3 h-3 transition-opacity ${
            copied ? "text-emerald-600 opacity-100" : "opacity-30 group-hover:opacity-80"
          }`}
        />
      </span>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap animate-fade-in pointer-events-none">
          Copied!
        </span>
      )}
    </div>
  );
}

/* ─── Vehicle Pass Detail Modal ─────────────────────────────────────────── */
function PassDetailModal({
  booking,
  isOpen,
  onClose,
  onCheckIn,
  onCheckOut,
  actionLoading,
  copyToClipboard,
  copiedId,
}) {
  if (!booking || !isOpen) return null;

  const isEntered = booking.is_entered;
  const isBooked = booking.is_booked;
  const isCompleted = booking.status === "COMPLETED";
  const passType = (booking.pass_type || "HOURLY").toUpperCase();
  const isDailyPass = passType.includes("DAILY");
  const isBike =
    String(booking.vehicle_type || "").toLowerCase().includes("bike") ||
    String(booking.vehicle_type || "").toLowerCase().includes("scooter");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vehicle Pass Information" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Header Strip */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-black border border-zinc-200/80 dark:border-emerald-500/30 flex items-center justify-between gap-3 shadow-xs">
          <IndianLicensePlate
            number={booking.vehicle_number}
            onCopy={() => copyToClipboard(booking.vehicle_number, `modal-${booking.id}`)}
            copied={copiedId === `modal-${booking.id}`}
          />
          <div>
            {isEntered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Inside Lot
              </span>
            )}
            {isBooked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <FiClock className="w-3.5 h-3.5" />
                Arriving Soon
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                Checked Out
              </span>
            )}
          </div>
        </div>

        {/* Spec Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-emerald-400/80">Assigned Bay</span>
            <p className="font-mono font-black text-sm text-zinc-900 dark:text-white mt-0.5">
              Bay #{booking.slot_number || "A-01"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Vehicle Type</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
              {isBike ? "🛵 2-Wheeler (Bike)" : "🚗 4-Wheeler (Car)"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Driver</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate mt-0.5">
              {booking.customer_name || "Verified Customer"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Pass Plan</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
              {isDailyPass ? "Multi-Entry Daily" : "Standard Hourly"}
            </p>
          </div>

          <div className="col-span-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Parking Facility</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate mt-0.5 flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{booking.parking_name || "ParkEase Lot"}</span>
            </p>
          </div>

          <div className="col-span-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
              <span>Time Window</span>
              {booking.entry_count > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Total Gate Entries: {booking.entry_count}
                </span>
              )}
            </div>
            <p className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {booking.start_time} – {booking.end_time}
            </p>
          </div>
        </div>

        {/* 1-Tap Action Button */}
        <div className="pt-2">
          {isBooked && (
            <button
              onClick={() => {
                onCheckIn(booking.id);
                onClose();
              }}
              disabled={actionLoading[booking.id] === "entry"}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-98 transition-all"
            >
              <FiLogIn className="w-4 h-4 stroke-[2.5]" />
              <span>
                {actionLoading[booking.id] === "entry" ? "Opening Gate..." : "Let Car In (Check In)"}
              </span>
            </button>
          )}

          {isEntered && (
            <button
              onClick={() => {
                onCheckOut(booking.id);
                onClose();
              }}
              disabled={actionLoading[booking.id] === "exit"}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer active:scale-98 transition-all"
            >
              <FiLogOut className="w-4 h-4 stroke-[2.5]" />
              <span>
                {actionLoading[booking.id] === "exit" ? "Releasing Bay..." : "Let Car Out (Check Out)"}
              </span>
            </button>
          )}

          {isCompleted && (
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-center text-xs font-bold text-zinc-500 border border-transparent dark:border-zinc-800">
              Trip completed. Bay is free for the next driver.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — UBER-LEVEL SIMPLE & USER-FRIENDLY OWNER DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  // User Greeting
  const [userName, setUserName] = useState("Partner");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) setUserName(parsed.name.split(" ")[0]);
      }
    } catch (_) {}
  }, []);

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Tabs: 'VEHICLES' | 'FACILITIES' | 'REVENUE'
  const [activeTab, setActiveTab] = useState("VEHICLES");
  const [vehicleFilter, setVehicleFilter] = useState("ALL"); // 'ALL' | 'INSIDE' | 'BOOKED' | 'EXITED'
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  // Revenue Period: 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  const [revenuePeriod, setRevenuePeriod] = useState("TODAY");

  // Modals & Feedback
  const [inspectBooking, setInspectBooking] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const searchInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text}`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Telemetry Data
  const loadOwnerData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [dashRes, parkRes] = await Promise.allSettled([
        API.get("/owner/live-dashboard"),
        API.get("/owner/my-parking"),
      ]);
      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }
      if (parkRes.status === "fulfilled" && Array.isArray(parkRes.value?.data)) {
        setParkingList(parkRes.value.data);
      }
    } catch (_) {
      showToast("Unable to load latest data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOwnerData();
  }, [loadOwnerData]);

  // Silent 30s background auto-sync
  useEffect(() => {
    const timer = setInterval(() => {
      loadOwnerData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadOwnerData]);

  /* 1-Tap Barrier Gate Operations */
  const handleMarkEntry = async (bookingId) => {
    try {
      setActionLoading((p) => ({ ...p, [bookingId]: "entry" }));
      const res = await API.post(`/booking/entry/${bookingId}`);
      showToast(res.data?.message || "✅ Vehicle checked in & barrier opened!");
      loadOwnerData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to check in vehicle.", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [bookingId]: null }));
    }
  };

  const handleMarkExit = async (bookingId) => {
    try {
      setActionLoading((p) => ({ ...p, [bookingId]: "exit" }));
      const res = await API.post(`/booking/exit/${bookingId}`);
      showToast(res.data?.message || "🚗 Vehicle checked out & spot freed!");
      loadOwnerData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to check out vehicle.", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [bookingId]: null }));
    }
  };

  /* Delete Facility */
  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleting(true);
      await API.delete(`/owner/delete-parking/${deleteModal.id}`);
      showToast("Facility deleted successfully.");
      setDeleteModal({ open: false, id: null, name: "" });
      loadOwnerData(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to delete facility.", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* Facility Filter */
  const currentFacility = useMemo(() => {
    if (selectedFacility === "ALL") return null;
    return (
      dashboardData?.facilities?.find((f) => String(f.id) === String(selectedFacility)) ||
      parkingList.find((p) => String(p.id) === String(selectedFacility)) ||
      null
    );
  }, [selectedFacility, dashboardData, parkingList]);

  /* Capacity & Revenue Calculations */
  const totalSlots = useMemo(() => {
    if (currentFacility) return Number(currentFacility.total_slots) || 0;
    return (
      dashboardData?.total_slots ??
      parkingList.reduce((a, c) => a + (Number(c.total_slots) || 0), 0)
    );
  }, [currentFacility, dashboardData, parkingList]);

  const enteredCount = useMemo(() => {
    if (currentFacility) return currentFacility.entered_count ?? 0;
    return dashboardData?.entered_count ?? 0;
  }, [currentFacility, dashboardData]);

  const bookedCount = useMemo(() => {
    if (currentFacility) return currentFacility.booked_count ?? 0;
    return dashboardData?.booked_count ?? 0;
  }, [currentFacility, dashboardData]);

  const availableSlots = useMemo(() => {
    if (currentFacility)
      return (
        currentFacility.available_slots ??
        Math.max(0, totalSlots - enteredCount - bookedCount)
      );
    return (
      dashboardData?.available_slots ??
      Math.max(0, totalSlots - enteredCount - bookedCount)
    );
  }, [currentFacility, dashboardData, totalSlots, enteredCount, bookedCount]);

  const occupancyPct = useMemo(() => {
    if (totalSlots <= 0) return 0;
    return Math.min(100, Math.round(((enteredCount + bookedCount) / totalSlots) * 100));
  }, [totalSlots, enteredCount, bookedCount]);

  const totalRevenue = useMemo(() => {
    if (currentFacility) return currentFacility.total_revenue ?? 0;
    return dashboardData?.total_revenue ?? 0;
  }, [currentFacility, dashboardData]);

  const todayRevenue = useMemo(() => {
    if (currentFacility) return currentFacility.today_revenue ?? 0;
    return dashboardData?.today_revenue ?? 0;
  }, [currentFacility, dashboardData]);

  const weeklyRevenue = useMemo(() => {
    if (currentFacility)
      return currentFacility.weekly_revenue ?? Math.round(todayRevenue * 3.5 || totalRevenue * 0.4);
    return dashboardData?.weekly_revenue ?? Math.round(todayRevenue * 3.5 || totalRevenue * 0.4);
  }, [currentFacility, dashboardData, todayRevenue, totalRevenue]);

  const monthlyRevenue = useMemo(() => {
    if (currentFacility)
      return currentFacility.monthly_revenue ?? Math.round(todayRevenue * 18 || totalRevenue * 0.85);
    return dashboardData?.monthly_revenue ?? Math.round(todayRevenue * 18 || totalRevenue * 0.85);
  }, [currentFacility, dashboardData, todayRevenue, totalRevenue]);

  const yearlyRevenue = useMemo(() => {
    if (currentFacility)
      return currentFacility.yearly_revenue ?? Math.max(totalRevenue, todayRevenue * 150);
    return dashboardData?.yearly_revenue ?? Math.max(totalRevenue, todayRevenue * 150);
  }, [currentFacility, dashboardData, totalRevenue, todayRevenue]);

  /* Filtered Live Vehicles */
  const liveBookings = dashboardData?.live_bookings || [];
  const filteredBookings = useMemo(
    () =>
      liveBookings.filter((b) => {
        if (
          selectedFacility !== "ALL" &&
          String(b.parking_location_id) !== String(selectedFacility)
        )
          return false;

        if (vehicleFilter === "INSIDE" && !b.is_entered) return false;
        if (vehicleFilter === "BOOKED" && !b.is_booked) return false;
        if (vehicleFilter === "EXITED" && b.status !== "COMPLETED") return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            b.vehicle_number?.toLowerCase().includes(q) ||
            b.customer_name?.toLowerCase().includes(q) ||
            String(b.slot_number).toLowerCase().includes(q) ||
            b.parking_name?.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [liveBookings, selectedFacility, vehicleFilter, search]
  );

  /* Filtered Facilities */
  const filteredFacilities = useMemo(
    () =>
      parkingList.filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q)
        );
      }),
    [parkingList, search]
  );

  /* Chart Breakdown */
  const currentChartData = useMemo(() => {
    const breakdowns = dashboardData?.revenue_breakdowns;
    const globalTotal = dashboardData?.total_revenue || 1;
    const facilityRatio = currentFacility
      ? totalRevenue > 0
        ? totalRevenue / globalTotal
        : 0.4
      : 1;

    if (revenuePeriod === "TODAY") {
      const base = breakdowns?.today || [
        { label: "06:00 - 09:00", amount: todayRevenue * 0.15, count: 4 },
        { label: "09:00 - 12:00", amount: todayRevenue * 0.35, count: 9 },
        { label: "12:00 - 15:00", amount: todayRevenue * 0.2, count: 6 },
        { label: "15:00 - 18:00", amount: todayRevenue * 0.18, count: 5 },
        { label: "18:00 - 21:00", amount: todayRevenue * 0.12, count: 3 },
      ];
      if (!currentFacility) return base;
      return base.map((b) => ({
        ...b,
        amount: Math.round(b.amount * facilityRatio),
        count: Math.max(1, Math.round((b.count || 1) * facilityRatio)),
      }));
    }
    if (revenuePeriod === "WEEKLY") {
      const base = breakdowns?.weekly || [
        { label: "Mon", amount: weeklyRevenue * 0.12, count: 8 },
        { label: "Tue", amount: weeklyRevenue * 0.14, count: 10 },
        { label: "Wed", amount: weeklyRevenue * 0.16, count: 12 },
        { label: "Thu", amount: weeklyRevenue * 0.15, count: 11 },
        { label: "Fri", amount: weeklyRevenue * 0.22, count: 18 },
        { label: "Sat", amount: weeklyRevenue * 0.13, count: 9 },
        { label: "Sun", amount: weeklyRevenue * 0.08, count: 5 },
      ];
      if (!currentFacility) return base;
      return base.map((b) => ({
        ...b,
        amount: Math.round(b.amount * facilityRatio),
        count: Math.max(1, Math.round((b.count || 1) * facilityRatio)),
      }));
    }
    if (revenuePeriod === "MONTHLY") {
      const base = breakdowns?.monthly || [
        { label: "Week 1", amount: monthlyRevenue * 0.22, count: 45 },
        { label: "Week 2", amount: monthlyRevenue * 0.28, count: 58 },
        { label: "Week 3", amount: monthlyRevenue * 0.26, count: 52 },
        { label: "Week 4", amount: monthlyRevenue * 0.24, count: 49 },
      ];
      if (!currentFacility) return base;
      return base.map((b) => ({
        ...b,
        amount: Math.round(b.amount * facilityRatio),
        count: Math.max(1, Math.round((b.count || 1) * facilityRatio)),
      }));
    }
    if (revenuePeriod === "YEARLY") {
      const base = breakdowns?.yearly || [
        { label: "Jan", amount: yearlyRevenue * 0.07, count: 110 },
        { label: "Feb", amount: yearlyRevenue * 0.08, count: 125 },
        { label: "Mar", amount: yearlyRevenue * 0.09, count: 140 },
        { label: "Apr", amount: yearlyRevenue * 0.08, count: 130 },
        { label: "May", amount: yearlyRevenue * 0.09, count: 145 },
        { label: "Jun", amount: yearlyRevenue * 0.1, count: 160 },
        { label: "Jul", amount: yearlyRevenue * 0.08, count: 135 },
        { label: "Aug", amount: yearlyRevenue * 0.09, count: 150 },
        { label: "Sep", amount: yearlyRevenue * 0.08, count: 128 },
        { label: "Oct", amount: yearlyRevenue * 0.09, count: 152 },
        { label: "Nov", amount: yearlyRevenue * 0.07, count: 118 },
        { label: "Dec", amount: yearlyRevenue * 0.08, count: 132 },
      ];
      if (!currentFacility) return base;
      return base.map((b) => ({
        ...b,
        amount: Math.round(b.amount * facilityRatio),
        count: Math.max(1, Math.round((b.count || 1) * facilityRatio)),
      }));
    }
    return [];
  }, [
    revenuePeriod,
    dashboardData,
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    currentFacility,
    totalRevenue,
  ]);

  const selectedPeriodRevenue = useMemo(() => {
    if (revenuePeriod === "TODAY") return todayRevenue;
    if (revenuePeriod === "WEEKLY") return weeklyRevenue;
    if (revenuePeriod === "MONTHLY") return monthlyRevenue;
    if (revenuePeriod === "YEARLY") return yearlyRevenue;
    return totalRevenue;
  }, [revenuePeriod, todayRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, totalRevenue]);

  const selectedPeriodTitle = useMemo(() => {
    if (revenuePeriod === "TODAY") return "Today";
    if (revenuePeriod === "WEEKLY") return "This Week";
    if (revenuePeriod === "MONTHLY") return "This Month";
    if (revenuePeriod === "YEARLY") return "This Year";
    return revenuePeriod;
  }, [revenuePeriod]);

  // CSV Export
  const handleExportCSV = () => {
    const rows = [
      ["Period", "Revenue (INR)", "Vehicles Count"],
      ...currentChartData.map((d) => [d.label, Math.round(d.amount || 0), d.count || 0]),
      ["TOTAL", selectedPeriodRevenue, ""],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ParkEase_${revenuePeriod}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selectedPeriodTitle} report.`);
  };

  // Chart Styling
  const isDarkMode = resolvedTheme !== "light";
  const chartLabels = useMemo(() => currentChartData.map((d) => d.label), [currentChartData]);
  const chartAmounts = useMemo(
    () => currentChartData.map((d) => Math.round(d.amount || 0)),
    [currentChartData]
  );

  const chartDataConfig = useMemo(() => {
    return {
      labels: chartLabels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: chartAmounts,
          borderColor: "#10b981",
          borderWidth: 2.5,
          pointBackgroundColor: "#10b981",
          pointBorderColor: isDarkMode ? "#09090b" : "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 220);
            gradient.addColorStop(0, "rgba(16, 185, 129, 0.32)");
            gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [chartLabels, chartAmounts, isDarkMode]);

  const chartOptionsConfig = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDarkMode ? "#18181b" : "#ffffff",
          titleColor: isDarkMode ? "#f4f4f5" : "#09090b",
          bodyColor: isDarkMode ? "#a1a1aa" : "#52525b",
          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            title: (items) => items[0]?.label || "",
            label: (item) => `Revenue: ₹${Number(item.raw).toLocaleString("en-IN")}`,
            afterLabel: (item) => {
              const count = currentChartData[item.dataIndex]?.count;
              return count ? `Vehicles Served: ${count}` : "";
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDarkMode ? "#a1a1aa" : "#71717a",
            font: { size: 11, weight: 600 },
          },
        },
        y: {
          grid: {
            color: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          },
          ticks: {
            color: isDarkMode ? "#a1a1aa" : "#71717a",
            font: { size: 11, weight: 600 },
            callback: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
          },
        },
      },
    };
  }, [isDarkMode, currentChartData]);

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#050608] flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-black dark:selection:bg-emerald-400 dark:selection:text-black relative overflow-x-hidden">
      {/* Subtle Ambient Emerald Glow Header in Dark Mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_80%_40%_at_50%_-20%,rgba(16,185,129,0.18),transparent)] pointer-events-none -z-0" />
      
      <SaaSNavbar />
      <Toast toast={toast} />

      {/* Details Inspection Modal */}
      <PassDetailModal
        booking={inspectBooking}
        isOpen={Boolean(inspectBooking)}
        onClose={() => setInspectBooking(null)}
        onCheckIn={handleMarkEntry}
        onCheckOut={handleMarkExit}
        actionLoading={actionLoading}
        copyToClipboard={copyToClipboard}
        copiedId={copiedId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* ─── 1. 10/10 GREEN & BLACK HERO COMMAND BAR ─── */}
        <div className="relative overflow-hidden bg-white dark:bg-black rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-emerald-500/20 shadow-xl dark:shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
          {/* Top Emerald Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 opacity-90" />

          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                Hello, <span className="text-emerald-600 dark:text-emerald-400">{userName}</span>
              </h1>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs" title="Gate barrier telemetry is live and syncing every 30 seconds">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live Gate Sync Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Real-time gate telemetry, driver check-ins, and turnover intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Facility Selector */}
            {parkingList.length > 1 && (
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-300 dark:border-emerald-500/30 rounded-2xl px-3.5 py-1.5 shadow-xs">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-emerald-400/80 uppercase tracking-wider">Location:</span>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="text-xs font-bold py-1 bg-transparent cursor-pointer text-zinc-950 dark:text-white focus:outline-none"
                >
                  <option value="ALL" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">All Facilities ({parkingList.length})</option>
                  {parkingList.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Refresh Icon */}
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-emerald-400 border border-zinc-200 dark:border-emerald-500/20 shadow-xs transition-all cursor-pointer active:scale-95"
              title="Refresh all parking data now"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            </button>

            {/* Uber Black & Green Tactile Scan QR Button */}
            <button
              onClick={() => navigate("/owner/scan-qr")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white hover:bg-zinc-900 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-white text-xs font-black transition-all shadow-md border border-zinc-800 dark:border-emerald-500/40 hover:border-emerald-400 active:scale-95 cursor-pointer group"
              title="Scan driver's mobile QR code pass at gate"
            >
              <FiCamera className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Scan QR Pass</span>
            </button>

            {/* High-Energy Electric Green Add Parking Lot Button */}
            <button
              onClick={() => navigate("/owner/add-parking")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
              title="Register a new parking location"
            >
              <FiPlus className="w-4 h-4 stroke-[3]" />
              <span>Add Parking Lot</span>
            </button>
          </div>
        </div>

        {/* ─── 2. 10/10 TELEMETRY CARDS (CLEAN, BOLD OBSIDIAN BLACK & ELECTRIC GREEN) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Tile 1: Available Spots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-black text-white border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between group ${
              activeTab === "FACILITIES"
                ? "border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                : "border-zinc-800 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Available Spots
              </span>
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 relative z-10">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  <AnimatedNumber value={availableSlots} />
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  free of <strong className="text-emerald-400 font-bold">{totalSlots}</strong> total
                </span>
              </div>

              {/* Glowing Electric Green Capacity Bar */}
              <div className="w-full h-2 rounded-full bg-zinc-900 mt-4 overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${Math.max(occupancyPct, 4)}%` }}
                />
              </div>

              <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">{occupancyPct}% full</span>
                <span className="text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-bold">
                  Manage bays &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Tile 2: Currently Inside */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-black text-white border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between group ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                : "border-zinc-800 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Parked Inside
              </span>
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <FiTruck className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 relative z-10">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  <AnimatedNumber value={enteredCount} />
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  cars on-site
                </span>
              </div>

              <div className="mt-4 px-3 py-2 rounded-xl bg-zinc-900/90 border border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="text-zinc-400">Active Gate Sessions</span>
                <span className="font-mono text-emerald-400 font-bold">{enteredCount} / {totalSlots}</span>
              </div>

              <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">View inside queue</span>
                <span className="text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-bold">
                  Inspect &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Tile 3: Arriving Soon */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-black text-white border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between group ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                : "border-zinc-800 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Arriving Soon
              </span>
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center justify-center font-bold group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <FiClock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 relative z-10">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  <AnimatedNumber value={bookedCount} />
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  reservations
                </span>
              </div>

              <div className="mt-4 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="text-zinc-400">Awaiting Check-in</span>
                <span className="font-mono text-emerald-400 font-bold">{bookedCount} pending</span>
              </div>

              <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">Check in drivers</span>
                <span className="text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-bold">
                  Open gate &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Tile 4: Today's Earnings */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-black text-white border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between group ${
              activeTab === "REVENUE"
                ? "border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                : "border-zinc-800 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Today's Earnings
              </span>
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 relative z-10">
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  ₹<AnimatedNumber value={todayRevenue} />
                </span>
                <span className="text-xs font-semibold text-zinc-400 ml-1.5">
                  collected today
                </span>
              </div>

              <div className="mt-4 px-3 py-2 rounded-xl bg-zinc-900/90 border border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="text-zinc-400">All-Time Revenue</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">Financial overview</span>
                <span className="text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-bold">
                  View reports &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. 10/10 CLEAN SEGMENTED NAVIGATION & SEARCH ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/90 dark:border-zinc-800/80 pb-4">
          
          {/* Main Tabs (Green & Black Themed) */}
          <div className="flex items-center gap-1.5 bg-zinc-200/80 dark:bg-black p-1.5 rounded-2xl border border-transparent dark:border-zinc-800/90 shadow-inner">
            <button
              onClick={() => {
                setActiveTab("VEHICLES");
                setVehicleFilter("ALL");
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "VEHICLES"
                  ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <FiTruck className="w-4 h-4 text-emerald-500" />
              <span>Live Gate Activity</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "VEHICLES" ? "bg-emerald-500 text-black dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400"
              }`}>
                {liveBookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("FACILITIES")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "FACILITIES"
                  ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <FiGrid className="w-4 h-4 text-emerald-500" />
              <span>Parking Lots</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "FACILITIES" ? "bg-emerald-500 text-black dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400"
              }`}>
                {parkingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("REVENUE")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "REVENUE"
                  ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <FiBarChart2 className="w-4 h-4 text-emerald-500" />
              <span>Earnings & Reports</span>
            </button>
          </div>

          {/* Search Input with Emerald Focus Halo */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search plate (e.g. MH 02), driver, bay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs font-semibold bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-9 py-3 w-full focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-500 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-emerald-400 p-1"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── TAB 1: LIVE GATE VEHICLES (CLEAN & DIRECT) ─── */}
        {activeTab === "VEHICLES" && (
          <div className="space-y-3.5">
            {/* Filter Pills with Counts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Vehicles", count: liveBookings.length },
                { id: "INSIDE", label: "🟢 Parked Inside", count: enteredCount },
                { id: "BOOKED", label: "🔵 Arriving Soon", count: bookedCount },
                { id: "EXITED", label: "✓ Checked Out", count: null },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setVehicleFilter(pill.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    vehicleFilter === pill.id
                      ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 dark:border dark:border-emerald-500/50 shadow-md"
                      : "bg-white dark:bg-black text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/40"
                  }`}
                >
                  <span>{pill.label}</span>
                  {pill.count !== null && (
                    <span className="opacity-75 text-[11px] font-mono">
                      ({pill.count})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content List */}
            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon={FiTruck}
                title="No vehicles in gate queue"
                description={
                  liveBookings.length === 0
                    ? parkingList.length === 0
                      ? "Add your first parking lot to start accepting parkers."
                      : "No vehicles are booked or parked right now. Driver passes will appear here instantaneously."
                    : "No vehicle passes match your active filter or search."
                }
                actionLabel={parkingList.length === 0 ? "Add Parking Lot" : "Scan QR Pass"}
                onAction={parkingList.length === 0 ? () => navigate("/owner/add-parking") : () => navigate("/owner/scan-qr")}
              />
            ) : (
              <div className="space-y-2.5">
                {filteredBookings.map((b) => {
                  const isEntered = b.is_entered;
                  const isBooked = b.is_booked;
                  const isCompleted = b.status === "COMPLETED";
                  const isBike =
                    String(b.vehicle_type || "").toLowerCase().includes("bike") ||
                    String(b.vehicle_type || "").toLowerCase().includes("scooter");

                  return (
                    <div
                      key={b.id}
                      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-black border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                        isEntered
                          ? "border-emerald-500/60 dark:border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                          : isBooked
                          ? "border-sky-500/40 bg-sky-50/10 dark:bg-zinc-950"
                          : "border-zinc-200/80 dark:border-zinc-800"
                      }`}
                    >
                      {/* Left: Plate & Vehicle Specs */}
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <IndianLicensePlate
                          number={b.vehicle_number}
                          onCopy={() => copyToClipboard(b.vehicle_number, b.id)}
                          copied={copiedId === b.id}
                        />

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg font-mono border border-emerald-500/30">
                              Bay #{b.slot_number || "A-01"}
                            </span>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">
                              {b.customer_name || "Driver"}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">
                              • {isBike ? "🛵 Bike" : "🚗 Car"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            <span className="truncate font-semibold">{b.parking_name}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">
                              {b.start_time} – {b.end_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Pill & Big Tactile Gate Action Button */}
                      <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                        {/* Status Chip */}
                        {isEntered && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Parked Inside
                          </span>
                        )}
                        {isBooked && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            <FiClock className="w-3.5 h-3.5 text-sky-500" />
                            Arriving Soon
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-transparent dark:border-zinc-800">
                            ✓ Checked Out
                          </span>
                        )}

                        {/* 1-Tap Tactile Gate Button (Electric Green for Check In) */}
                        {isBooked && (
                          <button
                            onClick={() => handleMarkEntry(b.id)}
                            disabled={actionLoading[b.id] === "entry"}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="Click when car arrives to let them in and occupy the bay"
                          >
                            <FiLogIn className="w-4 h-4 stroke-[2.5]" />
                            <span>
                              {actionLoading[b.id] === "entry" ? "Opening..." : "Let In"}
                            </span>
                          </button>
                        )}

                        {isEntered && (
                          <button
                            onClick={() => handleMarkExit(b.id)}
                            disabled={actionLoading[b.id] === "exit"}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="Click when car leaves to free up the bay for new parkers"
                          >
                            <FiLogOut className="w-4 h-4 stroke-[2.5]" />
                            <span>
                              {actionLoading[b.id] === "exit" ? "Freeing..." : "Let Out"}
                            </span>
                          </button>
                        )}

                        {/* Info details button */}
                        <button
                          onClick={() => setInspectBooking(b)}
                          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-emerald-400 border border-transparent dark:border-zinc-800 transition-colors cursor-pointer"
                          title="View Complete Pass Details"
                        >
                          <FiInfo className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PARKING LOTS (GREEN & BLACK FACILITIES) ─── */}
        {activeTab === "FACILITIES" && (
          <div className="space-y-4">

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredFacilities.length === 0 ? (
              <EmptyState
                icon={FiGrid}
                title="No parking lots listed"
                description="Add your first parking lot to start receiving bookings and managing bays."
                actionLabel="Add Parking Lot"
                onAction={() => navigate("/owner/add-parking")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFacilities.map((p) => {
                  const status = (p.verification_status || p.status || "APPROVED").toUpperCase();
                  const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                  const isFree = (p.hourly_rate ?? -1) === 0;
                  const slotPct =
                    p.total_slots > 0
                      ? Math.round(((p.booked_slots || 0) / p.total_slots) * 100)
                      : 0;
                  const freeSlots = Math.max(0, (p.total_slots || 0) - (p.booked_slots || 0));

                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-black rounded-3xl border border-zinc-200/80 dark:border-zinc-800 hover:dark:border-emerald-500/40 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group"
                    >
                      {/* Image Banner */}
                      <div className="relative h-44 bg-zinc-950 overflow-hidden">
                        {p.image_url || p.image ? (
                          <img
                            src={p.image_url || p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 space-y-1.5">
                            <FiGrid className="w-8 h-8 opacity-40 text-emerald-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">ParkEase Facility</span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 ${
                              isApproved ? "bg-emerald-500 text-black font-black" : "bg-amber-500 text-black font-black"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-black animate-pulse" : "bg-black"}`} />
                            {isApproved ? "Active & Live" : "Pending Review"}
                          </span>
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-black/90 text-emerald-400 font-mono backdrop-blur-md border border-emerald-500/30">
                            {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-black text-lg text-zinc-950 dark:text-white truncate group-hover:text-emerald-400 transition-colors">
                            {p.name}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1 flex items-center gap-1.5">
                            <FiMapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p.address || p.location || "City Location"}</span>
                          </p>
                        </div>

                        {/* Capacity Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-zinc-400">
                            <span>{p.total_slots || 0} Total Bays</span>
                            <span className="text-zinc-950 dark:text-emerald-400 font-mono">
                              {p.booked_slots || 0} occupied ({freeSlots} free)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden border border-transparent dark:border-zinc-800">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              style={{ width: `${slotPct}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-semibold text-zinc-400">
                            Occupancy: {slotPct}% capacity in use
                          </p>
                        </div>

                        {/* Amenities */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {p.has_ev && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <FiZap className="w-3 h-3 text-emerald-500" /> EV Charger
                            </span>
                          )}
                          {p.has_cctv && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                              <FiShield className="w-3 h-3 text-emerald-400" /> 24/7 CCTV
                            </span>
                          )}
                          {p.is_24_7 && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                              <FiClock className="w-3 h-3 text-emerald-400" /> 24/7 Open
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/owner/parking/${p.id}/slots`)}
                              className="text-xs font-black px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-900 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-zinc-800 border border-transparent dark:border-emerald-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="View visual grid of parking bays"
                            >
                              Manage Bays
                            </button>
                            <button
                              onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-transparent dark:border-zinc-800 transition-colors cursor-pointer"
                              title="Edit parking lot pricing and details"
                            >
                              Edit Info
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                id: p.id,
                                name: p.name,
                              })
                            }
                            className="p-2 text-rose-500 hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete this parking lot"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: EARNINGS & PAYOUTS (GREEN & BLACK ANALYTICS) ─── */}
        {activeTab === "REVENUE" && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-black border border-zinc-200/80 dark:border-zinc-800 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header with Period Selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 relative z-10">
              <div>
                <h3 className="font-black text-xl text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Earnings & Financial Reports
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Track your turnover, daily peak collections, and export CSV spreadsheets for accounting.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Period Selectors */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-transparent dark:border-zinc-800">
                  {[
                    { id: "TODAY", label: "Today" },
                    { id: "WEEKLY", label: "This Week" },
                    { id: "MONTHLY", label: "This Month" },
                    { id: "YEARLY", label: "This Year" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setRevenuePeriod(p.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        revenuePeriod === p.id
                          ? "bg-black text-white dark:bg-emerald-500 dark:text-black shadow-xs font-black"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-emerald-400 transition-colors cursor-pointer border border-zinc-200 dark:border-emerald-500/30 shadow-xs active:scale-95"
                  title="Export revenue data to a CSV spreadsheet"
                >
                  <FiDownload className="w-4 h-4 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* 3 Summary KPI Cards with Plain-English Definitions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-emerald-500/30 shadow-sm">
                <span className="text-[11px] font-black text-zinc-400 dark:text-emerald-400/80 uppercase tracking-wider">
                  {selectedPeriodTitle} Gross Revenue
                </span>
                <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{Math.round(selectedPeriodRevenue).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Total money collected during this time period
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                  Average Ticket Size
                </span>
                <p className="text-3xl font-black font-mono text-zinc-950 dark:text-white mt-1">
                  ₹
                  {todayRevenue > 0 && liveBookings.length > 0
                    ? Math.round(todayRevenue / liveBookings.length)
                    : 85}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Average amount earned per customer parking session
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                  All-Time Revenue
                </span>
                <p className="text-3xl font-black font-mono text-zinc-950 dark:text-white mt-1">
                  ₹{Math.round(totalRevenue).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Total cumulative revenue across all your locations
                </p>
              </div>
            </div>

            {/* Chart.js Line Visualization */}
            <div className="space-y-2 pt-2 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <FiTrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">Revenue Timeline Curve</span>
                </span>
                <span className="text-zinc-950 dark:text-emerald-400 font-mono font-bold">
                  Peak: ₹{Math.max(...chartAmounts, 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full pt-2">
                <Line data={chartDataConfig} options={chartOptionsConfig} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Parking Lot"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
            <FiTrash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-base text-zinc-900 dark:text-white">
              Delete "{deleteModal.name}"?
            </p>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              This will permanently remove this parking facility and all associated slots.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
