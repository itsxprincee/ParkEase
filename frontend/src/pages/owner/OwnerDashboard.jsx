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
  FiActivity,
  FiUser,
  FiShield,
  FiCopy,
  FiPlay,
  FiPause,
  FiEye,
  FiCalendar,
  FiFilter,
  FiExternalLink,
  FiSliders,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../context/ThemeContext";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-2xl text-xs sm:text-sm font-bold transition-all ${
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
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const steps = 16;
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
    }, 300 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* ─── Authentic Indian License Plate Component ───────────────────────────── */
function IndianLicensePlate({ number, size = "md", onCopy, copied }) {
  const isSm = size === "sm";

  return (
    <div
      onClick={onCopy}
      className={`license-plate ${
        isSm ? "text-[11px] py-1 px-2.5" : "text-xs py-1.5 px-3"
      } shrink-0 shadow-sm border border-zinc-300 dark:border-zinc-700 bg-white hover:border-emerald-500 transition-all cursor-pointer inline-flex items-center select-none group relative`}
      title="Click to copy vehicle plate"
    >
      <span className="license-plate-ind shrink-0">
        <span className="chakra" />
        IND
      </span>
      <span className="font-mono font-black tracking-widest text-zinc-900 flex items-center gap-1.5 uppercase">
        {number || "MH 02 AB 1234"}
        <FiCopy
          className={`w-3 h-3 transition-colors ${
            copied ? "text-emerald-600 scale-110" : "opacity-30 group-hover:opacity-80"
          }`}
        />
      </span>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-fade-in pointer-events-none">
          Copied!
        </span>
      )}
    </div>
  );
}

/* ─── Circular Occupancy Ring Component with Dynamic Thresholds ───────── */
function OccupancyGauge({ percentage = 0, size = 88 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  const colorClass =
    percentage >= 90
      ? "stroke-rose-500"
      : percentage >= 75
      ? "stroke-amber-500"
      : "stroke-emerald-500";

  const badgeColor =
    percentage >= 90
      ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
      : percentage >= 75
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";

  const statusLabel =
    percentage >= 90 ? "Full" : percentage >= 75 ? "Busy" : "Optimal";

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-100 dark:stroke-zinc-800/90"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center select-none">
        <span className="text-base font-black font-mono text-zinc-900 dark:text-white leading-none">
          {percentage}%
        </span>
        <span
          className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border mt-1 ${badgeColor}`}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

/* ─── Micro Distribution Bar (Capacity Breakdown) ────────────────────────── */
function MicroDistributionBar({ total, entered, booked, available }) {
  if (total <= 0) return null;
  const pEntered = Math.round((entered / total) * 100);
  const pBooked = Math.round((booked / total) * 100);
  const pAvail = Math.max(0, 100 - pEntered - pBooked);

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-zinc-500 dark:text-zinc-400">Bay Utilization Breakdown</span>
        <span className="text-zinc-400 font-mono text-[10px]">{total} total bays</span>
      </div>
      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
        <div
          className="h-full bg-emerald-500 rounded-sm transition-all duration-500"
          style={{ width: `${pEntered}%` }}
          title={`Parked: ${entered} (${pEntered}%)`}
        />
        <div
          className="h-full bg-sky-500 rounded-sm transition-all duration-500"
          style={{ width: `${pBooked}%` }}
          title={`Arriving Soon: ${booked} (${pBooked}%)`}
        />
        <div
          className="h-full bg-indigo-200 dark:bg-indigo-950/60 rounded-sm transition-all duration-500"
          style={{ width: `${pAvail}%` }}
          title={`Available: ${available} (${pAvail}%)`}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Parked ({entered})</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Reserved ({booked})</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600" />
          <span>Open ({available})</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Pass Quick Inspection Modal ────────────────────────────────────────── */
function PassInspectionModal({
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
    <Modal isOpen={isOpen} onClose={onClose} title="Vehicle Pass Inspection" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Plate & Status Top Banner */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3">
          <IndianLicensePlate
            number={booking.vehicle_number}
            size="md"
            onCopy={() => copyToClipboard(booking.vehicle_number, `modal-${booking.id}`)}
            copied={copiedId === `modal-${booking.id}`}
          />
          <div>
            {isEntered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Parked Inside
              </span>
            )}
            {isBooked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <FiClock className="w-3.5 h-3.5 text-sky-500" />
                Arriving Soon
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Detailed Spec Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Assigned Bay
            </span>
            <p className="font-mono font-black text-sm text-zinc-900 dark:text-white">
              Bay #{booking.slot_number || "A-01"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Vehicle Type
            </span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1">
              <span>{isBike ? "🛵 2-Wheeler (Bike)" : "🚗 4-Wheeler (Car)"}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Driver Name
            </span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
              {booking.customer_name || "Verified Guest"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Pass Category
            </span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white">
              {isDailyPass ? "Multi-Entry Daily" : "Hourly Pass"}
            </p>
          </div>

          <div className="col-span-2 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Facility Location
            </span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{booking.parking_name || "ParkEase Facility"}</span>
            </p>
          </div>

          <div className="col-span-2 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Time Interval</span>
              {booking.entry_count > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Total Gate Entries: {booking.entry_count}
                </span>
              )}
            </div>
            <p className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {booking.start_time} ➔ {booking.end_time}
            </p>
          </div>
        </div>

        {/* Action Gate Button inside Modal */}
        <div className="pt-2">
          {isBooked && (
            <button
              onClick={() => {
                onCheckIn(booking.id);
                onClose();
              }}
              disabled={actionLoading[booking.id] === "entry"}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-98 transition-all"
            >
              <FiLogIn className="w-4 h-4 stroke-[2.5]" />
              <span>
                {actionLoading[booking.id] === "entry"
                  ? "Opening Barrier..."
                  : "Check In Driver & Open Gate"}
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer active:scale-98 transition-all"
            >
              <FiLogOut className="w-4 h-4 stroke-[2.5]" />
              <span>
                {actionLoading[booking.id] === "exit"
                  ? "Releasing Spot..."
                  : "Check Out Driver & Free Spot"}
              </span>
            </button>
          )}

          {isCompleted && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Pass completed. Spot was released successfully.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — ULTRA-MODERN OWNER OPERATIONS DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  // User details & Day-part greeting
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active View Tab: 'VEHICLES' | 'FACILITIES' | 'REVENUE'
  const [activeTab, setActiveTab] = useState("VEHICLES");
  const [vehicleFilter, setVehicleFilter] = useState("ALL"); // 'ALL' | 'INSIDE' | 'BOOKED' | 'EXITED'
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("ALL"); // 'ALL' | 'CAR' | 'BIKE'
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  // Chart Visual Mode: 'area' | 'bar'
  const [chartMode, setChartMode] = useState("area");

  // Revenue Period: 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  const [revenuePeriod, setRevenuePeriod] = useState("TODAY");

  // Modals & Inspection
  const [inspectBooking, setInspectBooking] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-refresh state engine (30s)
  const AUTO_REFRESH_SECS = 30;
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(AUTO_REFRESH_SECS);

  const searchInputRef = useRef(null);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      showToast("Unable to load dashboard data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOwnerData();
  }, [loadOwnerData]);

  // Live Auto-Refresh Countdown Timer Loop
  useEffect(() => {
    if (!isAutoRefresh) return;
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadOwnerData(true);
          return AUTO_REFRESH_SECS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoRefresh, loadOwnerData]);

  const handleManualRefresh = () => {
    setRefreshCountdown(AUTO_REFRESH_SECS);
    loadOwnerData(true);
  };

  /* Check In Vehicle */
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

  /* Check Out Vehicle */
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

  /* Facility Filter Selection */
  const currentFacility = useMemo(() => {
    if (selectedFacility === "ALL") return null;
    return (
      dashboardData?.facilities?.find((f) => String(f.id) === String(selectedFacility)) ||
      parkingList.find((p) => String(p.id) === String(selectedFacility)) ||
      null
    );
  }, [selectedFacility, dashboardData, parkingList]);

  /* Computed Metrics */
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

  // Revenue Metrics
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
      return (
        currentFacility.weekly_revenue ??
        Math.round(todayRevenue * 3.5 || totalRevenue * 0.4)
      );
    return (
      dashboardData?.weekly_revenue ??
      Math.round(todayRevenue * 3.5 || totalRevenue * 0.4)
    );
  }, [currentFacility, dashboardData, todayRevenue, totalRevenue]);

  const monthlyRevenue = useMemo(() => {
    if (currentFacility)
      return (
        currentFacility.monthly_revenue ??
        Math.round(todayRevenue * 18 || totalRevenue * 0.85)
      );
    return (
      dashboardData?.monthly_revenue ??
      Math.round(todayRevenue * 18 || totalRevenue * 0.85)
    );
  }, [currentFacility, dashboardData, todayRevenue, totalRevenue]);

  const yearlyRevenue = useMemo(() => {
    if (currentFacility)
      return (
        currentFacility.yearly_revenue ??
        Math.max(totalRevenue, todayRevenue * 150)
      );
    return (
      dashboardData?.yearly_revenue ??
      Math.max(totalRevenue, todayRevenue * 150)
    );
  }, [currentFacility, dashboardData, totalRevenue, todayRevenue]);

  const occupancyPercent =
    totalSlots > 0
      ? Math.round(((enteredCount + bookedCount) / totalSlots) * 100)
      : 0;

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

        if (vehicleTypeFilter !== "ALL") {
          const vType = String(b.vehicle_type || "").toLowerCase();
          const isBike = vType.includes("bike") || vType.includes("scooter");
          if (vehicleTypeFilter === "BIKE" && !isBike) return false;
          if (vehicleTypeFilter === "CAR" && isBike) return false;
        }

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
    [liveBookings, selectedFacility, vehicleFilter, vehicleTypeFilter, search]
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

  /* Revenue Chart Data */
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

  const maxChartAmount = useMemo(() => {
    const max = Math.max(...currentChartData.map((d) => d.amount || 0));
    return max > 0 ? max : 100;
  }, [currentChartData]);

  const selectedPeriodRevenue = useMemo(() => {
    if (revenuePeriod === "TODAY") return todayRevenue;
    if (revenuePeriod === "WEEKLY") return weeklyRevenue;
    if (revenuePeriod === "MONTHLY") return monthlyRevenue;
    if (revenuePeriod === "YEARLY") return yearlyRevenue;
    return totalRevenue;
  }, [
    revenuePeriod,
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    totalRevenue,
  ]);

  const selectedPeriodTitle = useMemo(() => {
    if (revenuePeriod === "TODAY") return "Today";
    if (revenuePeriod === "WEEKLY") return "This Week";
    if (revenuePeriod === "MONTHLY") return "This Month";
    if (revenuePeriod === "YEARLY") return "This Year";
    return revenuePeriod;
  }, [revenuePeriod]);

  /* CSV Export */
  const handleExportCSV = () => {
    const rows = [
      ["Date / Period", "Revenue (INR)", "Vehicles Count"],
      ...currentChartData.map((d) => [
        d.label,
        Math.round(d.amount || 0),
        d.count || 0,
      ]),
      ["TOTAL", selectedPeriodRevenue, ""],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ParkEase_${revenuePeriod}_Revenue.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selectedPeriodTitle} revenue statement!`, "success");
  };

  /* Chart.js Configuration Objects */
  const isDarkMode = resolvedTheme !== "light";

  const chartLabels = useMemo(
    () => currentChartData.map((d) => d.label),
    [currentChartData]
  );
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
          pointBorderColor: isDarkMode ? "#18181b" : "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 220);
            if (chartMode === "area") {
              gradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
              gradient.addColorStop(1, "rgba(16, 185, 129, 0.01)");
            } else {
              gradient.addColorStop(0, "rgba(16, 185, 129, 0.9)");
              gradient.addColorStop(1, "rgba(20, 184, 166, 0.6)");
            }
            return gradient;
          },
          fill: chartMode === "area",
          tension: 0.38,
          borderRadius: chartMode === "bar" ? 8 : 0,
        },
      ],
    };
  }, [chartLabels, chartAmounts, chartMode, isDarkMode]);

  const chartOptionsConfig = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDarkMode
            ? "rgba(15, 16, 20, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          titleColor: isDarkMode ? "#f4f4f5" : "#09090b",
          bodyColor: isDarkMode ? "#a1a1aa" : "#52525b",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
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
          grid: {
            display: false,
          },
          ticks: {
            color: isDarkMode ? "#a1a1aa" : "#71717a",
            font: {
              size: 11,
              weight: 600,
            },
          },
        },
        y: {
          grid: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
            drawBorder: false,
          },
          ticks: {
            color: isDarkMode ? "#a1a1aa" : "#71717a",
            font: {
              size: 10,
              weight: 600,
            },
            callback: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
          },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
    };
  }, [isDarkMode, currentChartData]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#07080c] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white">
      {/* Ambient Mesh Backdrops */}
      <div className="fixed top-[-120px] left-[-100px] w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[-100px] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      {/* Quick Pass Inspection Modal */}
      <PassInspectionModal
        booking={inspectBooking}
        isOpen={Boolean(inspectBooking)}
        onClose={() => setInspectBooking(null)}
        onCheckIn={handleMarkEntry}
        onCheckOut={handleMarkExit}
        actionLoading={actionLoading}
        copyToClipboard={copyToClipboard}
        copiedId={copiedId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
        {/* ─── 1. MODERN COMMAND HEADER & QUICK ACTIONS ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-6 sm:p-8 border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Ambient Glow Accent inside Header */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Hub Operations
              </span>
              <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                <span>•</span>
                <span>
                  {parkingList.length}{" "}
                  {parkingList.length === 1
                    ? "Facility Active"
                    : "Facilities Active"}
                </span>
              </span>
              {selectedFacility !== "ALL" && currentFacility && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Filtering: {currentFacility.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
              {greeting},{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                {userName}
              </span>{" "}
              👋
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
              Monitor live vehicle entries, automate barrier gate turnover, and oversee real-time parking revenue.
            </p>
          </div>

          {/* Quick Action Control Strip & Auto-Refresh Engine */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 relative z-10">
            {/* Live Auto-Refresh Module with Circular Countdown & Pause/Resume */}
            <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-800/90 p-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-90 cursor-pointer"
                title="Refresh Live Operations Data"
              >
                <FiRefreshCw
                  className={`w-3.5 h-3.5 ${
                    refreshing ? "animate-spin text-emerald-500" : ""
                  }`}
                />
              </button>

              <button
                onClick={() => setIsAutoRefresh((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isAutoRefresh
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                }`}
                title={
                  isAutoRefresh
                    ? "Live auto-sync is active. Click to pause."
                    : "Live auto-sync paused. Click to resume."
                }
              >
                {isAutoRefresh ? (
                  <>
                    <FiPause className="w-3 h-3" />
                    <span className="font-mono text-[11px] font-black">
                      {refreshCountdown}s
                    </span>
                  </>
                ) : (
                  <>
                    <FiPlay className="w-3 h-3" />
                    <span className="text-[11px]">Paused</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => navigate("/owner/scan-qr")}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-zinc-800 dark:border-zinc-200"
            >
              <FiCamera className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Scan QR Pass</span>
            </button>

            <button
              onClick={() => navigate("/owner/add-parking")}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer border border-emerald-400/20"
            >
              <FiPlus className="w-4 h-4 stroke-[3]" />
              <span>Add Facility</span>
            </button>
          </div>
        </div>

        {/* ─── 2. BENTO-GRID CAPACITY & METRIC TILES ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Bento Tile 1: Live Lot Capacity with Radial Gauge & Micro Breakdown */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FiLayers className="w-3.5 h-3.5" />
                  </div>
                  <span>Available Bays</span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                    <AnimatedNumber value={availableSlots} />
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    / {totalSlots}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate pt-0.5">
                  <FiCheckCircle className="w-3 h-3 shrink-0" />
                  <span>Ready for parkers</span>
                </p>
              </div>

              <OccupancyGauge percentage={occupancyPercent} size={84} />
            </div>

            <MicroDistributionBar
              total={totalSlots}
              entered={enteredCount}
              booked={bookedCount}
              available={availableSlots}
            />
          </div>

          {/* Bento Tile 2: Parked Inside (Active vehicles on site) */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20"
                : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-emerald-500/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FiTruck className="w-3.5 h-3.5" />
                  </div>
                  <span>Parked Inside</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  On-Site
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                  <AnimatedNumber value={enteredCount} />
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  vehicles in bays
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <span>View checked-in queue</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Bento Tile 3: Arriving Soon (Incoming reservations) */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-sky-500 ring-2 ring-sky-500/20"
                : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-sky-500/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <FiClock className="w-3.5 h-3.5" />
                  </div>
                  <span>Arriving Soon</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  Incoming
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                  <AnimatedNumber value={bookedCount} />
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  reservations
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              <span>Ready for gate check-in</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Bento Tile 4: Today's Earnings */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
              activeTab === "REVENUE"
                ? "border-amber-500 ring-2 ring-amber-500/20"
                : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-amber-500/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <FiDollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span>Today's Earnings</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  INR ₹
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                  ₹<AnimatedNumber value={todayRevenue} />
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              <span>All-Time: ₹{totalRevenue.toLocaleString("en-IN")}</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* ─── 3. TAB NAVIGATION, SEARCH & FACILITY SELECTOR ─── */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          {/* Main 3 View Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-100/90 dark:bg-zinc-800/80 p-1.5 rounded-xl overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab("VEHICLES");
                setVehicleFilter("ALL");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "VEHICLES"
                  ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-xs font-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiTruck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Vehicles</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 font-bold">
                {liveBookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("FACILITIES")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "FACILITIES"
                  ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-xs font-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiGrid className="w-3.5 h-3.5 text-indigo-500" />
              <span>Facilities</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 font-bold">
                {parkingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("REVENUE")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "REVENUE"
                  ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-xs font-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiBarChart2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Revenue & Analytics</span>
            </button>
          </div>

          {/* Location Dropdown & Instant Filter Search */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {parkingList.length > 1 && (
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="text-xs font-bold py-2.5 px-3.5 bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer text-zinc-800 dark:text-zinc-200 shadow-xs focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Facilities ({parkingList.length})</option>
                {parkingList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search plate, driver, bay... (Press '/')"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-9 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 shadow-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── TAB 1: LIVE VEHICLES PASS QUEUE ─── */}
        {activeTab === "VEHICLES" && (
          <div className="space-y-4 animate-fade-in">
            {/* Multi-Filter Bar: Status + Vehicle Type */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              {/* Status Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "ALL", label: "All Passes", count: liveBookings.length },
                  {
                    id: "INSIDE",
                    label: "Parked Inside",
                    count: enteredCount,
                    dot: "bg-emerald-500 animate-pulse",
                  },
                  {
                    id: "BOOKED",
                    label: "Arriving Soon",
                    count: bookedCount,
                    dot: "bg-sky-500",
                  },
                  {
                    id: "EXITED",
                    label: "Completed / Out",
                    count: null,
                    dot: "bg-zinc-400",
                  },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      vehicleFilter === chip.id
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black shadow-sm"
                        : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {chip.dot && (
                      <span className={`w-2 h-2 rounded-full ${chip.dot}`} />
                    )}
                    <span>{chip.label}</span>
                    {chip.count !== null && (
                      <span className="opacity-75 text-[11px] font-mono">
                        ({chip.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Vehicle Type Filter (All / Cars / Bikes) */}
              <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 self-start sm:self-auto">
                <button
                  onClick={() => setVehicleTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    vehicleTypeFilter === "ALL"
                      ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-black shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setVehicleTypeFilter("CAR")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    vehicleTypeFilter === "CAR"
                      ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-black shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span>🚗</span>
                  <span>Cars</span>
                </button>
                <button
                  onClick={() => setVehicleTypeFilter("BIKE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    vehicleTypeFilter === "BIKE"
                      ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-black shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span>🛵</span>
                  <span>Bikes</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon={FiTruck}
                title="No vehicles in queue"
                description={
                  liveBookings.length === 0
                    ? parkingList.length === 0
                      ? "You haven't listed any parking spaces yet. Add your first facility to begin receiving parkers."
                      : "No vehicles are booked or parked right now. Customer reservations will appear here instantaneously."
                    : "No vehicle passes match your active filters or search query."
                }
                actionLabel={
                  parkingList.length === 0
                    ? "Add Parking Facility"
                    : "Scan Driver QR Pass"
                }
                onAction={
                  parkingList.length === 0
                    ? () => navigate("/owner/add-parking")
                    : () => navigate("/owner/scan-qr")
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => {
                  const isEntered = b.is_entered;
                  const isBooked = b.is_booked;
                  const isCompleted = b.status === "COMPLETED";
                  const passType = (b.pass_type || "HOURLY").toUpperCase();
                  const isDailyPass = passType.includes("DAILY");
                  const vType = String(b.vehicle_type || "Car").toLowerCase();
                  const isBike =
                    vType.includes("bike") || vType.includes("scooter");

                  return (
                    <div
                      key={b.id}
                      className={`relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                        isEntered
                          ? "border-emerald-300 dark:border-emerald-900/50 shadow-emerald-500/5"
                          : isBooked
                          ? "border-sky-300 dark:border-sky-900/50 shadow-sky-500/5"
                          : "border-zinc-200/80 dark:border-zinc-800/80"
                      }`}
                    >
                      {/* Left Status Bar Accent */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isEntered
                            ? "bg-emerald-500"
                            : isBooked
                            ? "bg-sky-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                        }`}
                      />

                      {/* Left: Plate & Vehicle Information */}
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pl-1.5">
                        {/* Authentic Indian License Plate Tag */}
                        <IndianLicensePlate
                          number={b.vehicle_number}
                          onCopy={() => copyToClipboard(b.vehicle_number, b.id)}
                          copied={copiedId === b.id}
                        />

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg font-mono border border-zinc-200 dark:border-zinc-700">
                              Bay #{b.slot_number || "A-01"}
                            </span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {b.customer_name || "Driver"}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                              <span>•</span>
                              <span>
                                {isBike ? "🛵 2-Wheeler" : "🚗 4-Wheeler"}
                              </span>
                            </span>

                            {isDailyPass ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Multi-Entry Daily
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                Hourly Pass
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                            <span className="truncate max-w-[220px] font-semibold text-zinc-700 dark:text-zinc-300">
                              {b.parking_name}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-zinc-500 dark:text-zinc-400">
                              {b.start_time} – {b.end_time}
                            </span>
                            {b.entry_count > 0 && (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                • Entry #{b.entry_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Inspect, Status Badges & 1-Click Operations */}
                      <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
                        {/* Quick View Button */}
                        <button
                          onClick={() => setInspectBooking(b)}
                          className="p-2.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                          title="Inspect Pass Details"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                        </button>

                        {isEntered && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Parked Inside
                          </span>
                        )}

                        {isBooked && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20">
                            <FiClock className="w-3.5 h-3.5 text-sky-500" />
                            Arriving Soon
                          </span>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold">
                            <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Checked Out
                          </span>
                        )}

                        {isBooked && (
                          <button
                            onClick={() => handleMarkEntry(b.id)}
                            disabled={actionLoading[b.id] === "entry"}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            <FiLogIn className="w-4 h-4 stroke-[2.5]" />
                            <span>
                              {actionLoading[b.id] === "entry"
                                ? "Checking In..."
                                : "Check In"}
                            </span>
                          </button>
                        )}

                        {isEntered && (
                          <button
                            onClick={() => handleMarkExit(b.id)}
                            disabled={actionLoading[b.id] === "exit"}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-rose-600/20"
                          >
                            <FiLogOut className="w-4 h-4 stroke-[2.5]" />
                            <span>
                              {actionLoading[b.id] === "exit"
                                ? "Checking Out..."
                                : "Check Out"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: MY LOCATIONS DIRECTORY ─── */}
        {activeTab === "FACILITIES" && (
          <div className="space-y-4 animate-fade-in">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredFacilities.length === 0 ? (
              <EmptyState
                icon={FiGrid}
                title="No parking locations"
                description="Add your first parking space to start receiving bookings."
                actionLabel="Add Parking Facility"
                onAction={() => navigate("/owner/add-parking")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFacilities.map((p) => {
                  const status = (
                    p.verification_status ||
                    p.status ||
                    "APPROVED"
                  ).toUpperCase();
                  const isApproved =
                    status === "APPROVED" || Boolean(p.is_approved);
                  const isFree = (p.hourly_rate ?? -1) === 0;
                  const slotPct =
                    p.total_slots > 0
                      ? Math.round(
                          ((p.booked_slots || 0) / p.total_slots) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={p.id}
                      className="group bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Facility Photo Header */}
                      <div className="relative h-48 bg-zinc-900 overflow-hidden">
                        {p.image_url || p.image ? (
                          <img
                            src={p.image_url || p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500 space-y-2">
                            <FiGrid className="w-10 h-10 opacity-40" />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                              ParkEase Facility
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-center">
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 ${
                              isApproved
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isApproved ? "bg-white animate-pulse" : "bg-white"
                              }`}
                            />
                            {isApproved
                              ? "Approved & Live"
                              : "Pending Verification"}
                          </span>
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-zinc-950/80 text-white font-mono backdrop-blur-md border border-white/15">
                            {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                          </span>
                        </div>
                      </div>

                      {/* Info & Action Controls */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {p.name}
                            </h3>
                            <button
                              onClick={() => {
                                setSelectedFacility(String(p.id));
                                setActiveTab("VEHICLES");
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
                              title="Filter queue to this location"
                            >
                              Filter Queue
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400 truncate mt-1 flex items-center gap-1.5">
                            <FiMapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span>{p.address || p.location || "City Hub"}</span>
                          </p>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                            <span>{p.total_slots || 0} Total Bays</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                              {p.booked_slots || 0} occupied ({slotPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                slotPct >= 90
                                  ? "bg-rose-500"
                                  : slotPct >= 75
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${slotPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {p.has_ev && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <FiZap className="w-3 h-3" /> EV Charging
                            </span>
                          )}
                          {p.has_cctv && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                              <FiShield className="w-3 h-3" /> CCTV
                            </span>
                          )}
                          {p.is_24_7 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                              <FiClock className="w-3 h-3" /> 24/7
                            </span>
                          )}
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                navigate(`/owner/parking/${p.id}/slots`)
                              }
                              className="text-xs font-black px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              Manage Slots
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/owner/edit-parking/${p.id}`)
                              }
                              className="text-xs font-bold px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                              Edit
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
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete Facility"
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

        {/* ─── TAB 3: REVENUE ANALYTICS & BREAKDOWNS (CHART.JS) ─── */}
        {activeTab === "REVENUE" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 space-y-6 animate-fade-in shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            {/* Header with Period Selectors, Mode Toggle & CSV export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-black text-xl sm:text-2xl text-zinc-900 dark:text-white tracking-tight">
                  Revenue Analytics & Payouts
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Visualize earnings, driver receipts, and turnover metrics across your facilities.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Chart Mode Toggle: Area vs Bar */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
                  <button
                    onClick={() => setChartMode("area")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      chartMode === "area"
                        ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-black shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Area Trend
                  </button>
                  <button
                    onClick={() => setChartMode("bar")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      chartMode === "bar"
                        ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-black shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Bar Chart
                  </button>
                </div>

                {/* Period Selectors */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
                  {[
                    { id: "TODAY", label: "Today" },
                    { id: "WEEKLY", label: "Week" },
                    { id: "MONTHLY", label: "Month" },
                    { id: "YEARLY", label: "Year" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setRevenuePeriod(p.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        revenuePeriod === p.id
                          ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-black shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-xs border border-zinc-200/60 dark:border-zinc-700/60"
                >
                  <FiDownload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                  {selectedPeriodTitle} Gross Earnings
                </span>
                <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{Math.round(selectedPeriodRevenue).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                  Avg Ticket Value
                </span>
                <p className="text-3xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                  ₹
                  {todayRevenue > 0 && liveBookings.length > 0
                    ? Math.round(todayRevenue / liveBookings.length)
                    : 85}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                  All-Time Revenue
                </span>
                <p className="text-3xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                  ₹{Math.round(totalRevenue).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* High-Performance Chart.js Visualization */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Timeline Revenue Breakdown</span>
                </span>
                <span>
                  Peak Interval: ₹{Math.round(maxChartAmount).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                {chartMode === "area" ? (
                  <Line data={chartDataConfig} options={chartOptionsConfig} />
                ) : (
                  <Bar data={chartDataConfig} options={chartOptionsConfig} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── DELETE LOCATION MODAL ─── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Facility"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <FiTrash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-base text-zinc-900 dark:text-white">
              Delete "{deleteModal.name}"?
            </p>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              This will permanently remove this parking facility, slots, and related operational history.
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
