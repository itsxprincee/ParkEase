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
        className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-xl text-xs sm:text-sm font-semibold transition-all ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-rose-600 border-rose-200 dark:border-rose-900/50 shadow-rose-500/10"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 shadow-emerald-500/10"
        }`}
      >
        {toast.type === "error" ? (
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
        ) : (
          <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
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
    const steps = 12;
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

/* ─── Clean Indian License Plate ────────────────────────────────────────── */
function IndianLicensePlate({ number, onCopy, copied }) {
  return (
    <div
      onClick={onCopy}
      className="license-plate text-[11px] sm:text-xs py-1 px-2.5 shrink-0 border border-zinc-300 dark:border-zinc-700 bg-white hover:border-emerald-500 transition-all cursor-pointer inline-flex items-center select-none group relative shadow-xs"
      title="Click to copy plate number"
    >
      <span className="license-plate-ind shrink-0">
        <span className="chakra" />
        IND
      </span>
      <span className="font-mono font-black tracking-wider text-zinc-900 flex items-center gap-1.5 uppercase">
        {number || "MH 02 AB 1234"}
        <FiCopy
          className={`w-3 h-3 transition-opacity ${
            copied ? "text-emerald-600 opacity-100" : "opacity-30 group-hover:opacity-80"
          }`}
        />
      </span>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap animate-fade-in pointer-events-none">
          Copied!
        </span>
      )}
    </div>
  );
}

/* ─── Pass Detail Modal ─────────────────────────────────────────────────── */
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
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Pass Details" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Header Strip */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3">
          <IndianLicensePlate
            number={booking.vehicle_number}
            onCopy={() => copyToClipboard(booking.vehicle_number, `modal-${booking.id}`)}
            copied={copiedId === `modal-${booking.id}`}
          />
          <div>
            {isEntered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Parked Inside
              </span>
            )}
            {isBooked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <FiClock className="w-3.5 h-3.5" />
                Arriving Soon
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                Checked Out
              </span>
            )}
          </div>
        </div>

        {/* Spec Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Assigned Bay</span>
            <p className="font-mono font-black text-sm text-zinc-900 dark:text-white mt-0.5">
              Bay #{booking.slot_number || "A-01"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Vehicle Type</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
              {isBike ? "🛵 2-Wheeler" : "🚗 4-Wheeler"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Customer</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate mt-0.5">
              {booking.customer_name || "Verified Driver"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Pass Plan</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
              {isDailyPass ? "Daily Multi-Entry" : "Hourly Pass"}
            </p>
          </div>

          <div className="col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Location</span>
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate mt-0.5 flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{booking.parking_name || "Facility"}</span>
            </p>
          </div>

          <div className="col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
              <span>Time Slot</span>
              {booking.entry_count > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Gate Entries: {booking.entry_count}
                </span>
              )}
            </div>
            <p className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {booking.start_time} – {booking.end_time}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isBooked && (
            <button
              onClick={() => {
                onCheckIn(booking.id);
                onClose();
              }}
              disabled={actionLoading[booking.id] === "entry"}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow cursor-pointer active:scale-98 transition-all"
            >
              <FiLogIn className="w-4 h-4 stroke-[2.5]" />
              <span>
                {actionLoading[booking.id] === "entry" ? "Checking In..." : "Check In Driver"}
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
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow cursor-pointer active:scale-98 transition-all"
            >
              <FiLogOut className="w-4 h-4 stroke-[2.5]" />
              <span>
                {actionLoading[booking.id] === "exit" ? "Checking Out..." : "Check Out Driver & Free Spot"}
              </span>
            </button>
          )}

          {isCompleted && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-center text-xs font-semibold text-zinc-500">
              Trip completed. Bay is ready for next driver.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — CLEAN, USER-FRIENDLY OWNER DASHBOARD
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

  // Fetch Data
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

  /* 1-Click Barrier Gate Operations */
  const handleMarkEntry = async (bookingId) => {
    try {
      setActionLoading((p) => ({ ...p, [bookingId]: "entry" }));
      const res = await API.post(`/booking/entry/${bookingId}`);
      showToast(res.data?.message || "Driver checked in successfully!");
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
      showToast(res.data?.message || "Driver checked out. Bay is now free!");
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
      ["Period", "Revenue (INR)", "Vehicles"],
      ...currentChartData.map((d) => [d.label, Math.round(d.amount || 0), d.count || 0]),
      ["TOTAL", selectedPeriodRevenue, ""],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ParkEase_${revenuePeriod}_Revenue.csv`);
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
          borderWidth: 2,
          pointBackgroundColor: "#10b981",
          pointBorderColor: isDarkMode ? "#18181b" : "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 6,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, "rgba(16, 185, 129, 0.28)");
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
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: (items) => items[0]?.label || "",
            label: (item) => `Revenue: ₹${Number(item.raw).toLocaleString("en-IN")}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDarkMode ? "#a1a1aa" : "#71717a",
            font: { size: 11 },
          },
        },
        y: {
          grid: {
            color: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: isDarkMode ? "#a1a1aa" : "#71717a",
            font: { size: 10 },
            callback: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
          },
        },
      },
    };
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors">
      <SaaSNavbar />
      <Toast toast={toast} />

      {/* Details Modal */}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ─── 1. CLEAN HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Welcome, {userName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage live parking operations, customer entries, and facility capacity.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Facility Selector */}
            {parkingList.length > 1 && (
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="text-xs font-semibold py-2 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer text-zinc-800 dark:text-zinc-200 shadow-xs"
              >
                <option value="ALL">All Facilities ({parkingList.length})</option>
                {parkingList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {/* Quick Refresh Icon */}
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            </button>

            {/* Scan QR */}
            <button
              onClick={() => navigate("/owner/scan-qr")}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FiCamera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scan QR</span>
            </button>

            {/* Add Facility */}
            <button
              onClick={() => navigate("/owner/add-parking")}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Facility</span>
            </button>
          </div>
        </div>

        {/* ─── 2. SIMPLE, HIGH-CONTRAST METRIC CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Available Slots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Available Bays</span>
              <FiLayers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
                  <AnimatedNumber value={availableSlots} />
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  / {totalSlots}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Ready for parking</span>
              </p>
            </div>
          </div>

          {/* Card 2: Parked Now */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer shadow-xs flex flex-col justify-between group ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Parked Inside</span>
              <FiTruck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
                  <AnimatedNumber value={enteredCount} />
                </span>
                <span className="text-xs text-zinc-400 font-semibold">vehicles</span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <span>View inside queue &rarr;</span>
              </p>
            </div>
          </div>

          {/* Card 3: Arriving Soon */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer shadow-xs flex flex-col justify-between group ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-sky-500 ring-2 ring-sky-500/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Arriving Soon</span>
              <FiClock className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
                  <AnimatedNumber value={bookedCount} />
                </span>
                <span className="text-xs text-zinc-400 font-semibold">bookings</span>
              </div>
              <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1">
                <span>Ready for gate check-in &rarr;</span>
              </p>
            </div>
          </div>

          {/* Card 4: Today's Revenue */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer shadow-xs flex flex-col justify-between group ${
              activeTab === "REVENUE"
                ? "border-amber-500 ring-2 ring-amber-500/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Today's Revenue</span>
              <FiDollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
                  ₹<AnimatedNumber value={todayRevenue} />
                </span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-400 mt-1">
                All-Time: ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* ─── 3. TAB CONTROLS & UNIFIED SEARCH ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          
          {/* Primary View Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("VEHICLES");
                setVehicleFilter("ALL");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "VEHICLES"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiTruck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Activity</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 font-mono">
                {liveBookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("FACILITIES")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "FACILITIES"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiGrid className="w-3.5 h-3.5 text-indigo-500" />
              <span>Facilities</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 font-mono">
                {parkingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("REVENUE")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "REVENUE"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiBarChart2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Earnings</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search plate, driver, bay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ─── TAB 1: LIVE VEHICLE ACTIVITY ─── */}
        {activeTab === "VEHICLES" && (
          <div className="space-y-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Passes", count: liveBookings.length },
                { id: "INSIDE", label: "Parked Inside", count: enteredCount },
                { id: "BOOKED", label: "Arriving Soon", count: bookedCount },
                { id: "EXITED", label: "Exited / Completed", count: null },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setVehicleFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    vehicleFilter === pill.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{pill.label}</span>
                  {pill.count !== null && (
                    <span className="opacity-70 ml-1.5 text-[11px] font-mono">
                      ({pill.count})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* List Content */}
            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon={FiTruck}
                title="No vehicles found"
                description={
                  liveBookings.length === 0
                    ? parkingList.length === 0
                      ? "Add your first parking facility to start receiving bookings."
                      : "No vehicles are currently booked or parked in your lots."
                    : "No vehicle passes match your search or filter."
                }
                actionLabel={parkingList.length === 0 ? "Add Facility" : "Scan QR Pass"}
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
                      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      {/* Left: Plate & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <IndianLicensePlate
                          number={b.vehicle_number}
                          onCopy={() => copyToClipboard(b.vehicle_number, b.id)}
                          copied={copiedId === b.id}
                        />

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white">
                              Bay #{b.slot_number || "A-01"}
                            </span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
                              {b.customer_name || "Driver"}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              • {isBike ? "🛵 Bike" : "🚗 Car"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
                            <span className="truncate">{b.parking_name}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">
                              {b.start_time} – {b.end_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Action Button */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Info details button */}
                        <button
                          onClick={() => setInspectBooking(b)}
                          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <FiInfo className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Chip */}
                        {isEntered && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ● In Lot
                          </span>
                        )}
                        {isBooked && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            🕒 Arriving
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            ✓ Out
                          </span>
                        )}

                        {/* 1-Click Action Buttons */}
                        {isBooked && (
                          <button
                            onClick={() => handleMarkEntry(b.id)}
                            disabled={actionLoading[b.id] === "entry"}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <FiLogIn className="w-3.5 h-3.5" />
                            <span>
                              {actionLoading[b.id] === "entry" ? "Checking In..." : "Check In"}
                            </span>
                          </button>
                        )}

                        {isEntered && (
                          <button
                            onClick={() => handleMarkExit(b.id)}
                            disabled={actionLoading[b.id] === "exit"}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <FiLogOut className="w-3.5 h-3.5" />
                            <span>
                              {actionLoading[b.id] === "exit" ? "Checking Out..." : "Check Out"}
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

        {/* ─── TAB 2: FACILITIES DIRECTORY ─── */}
        {activeTab === "FACILITIES" && (
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredFacilities.length === 0 ? (
              <EmptyState
                icon={FiGrid}
                title="No facilities listed"
                description="Add your first parking facility to begin receiving parkers."
                actionLabel="Add Facility"
                onAction={() => navigate("/owner/add-parking")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredFacilities.map((p) => {
                  const status = (p.verification_status || p.status || "APPROVED").toUpperCase();
                  const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                  const isFree = (p.hourly_rate ?? -1) === 0;
                  const slotPct =
                    p.total_slots > 0
                      ? Math.round(((p.booked_slots || 0) / p.total_slots) * 100)
                      : 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                    >
                      {/* Image Banner */}
                      <div className="relative h-44 bg-zinc-900 overflow-hidden">
                        {p.image_url || p.image ? (
                          <img
                            src={p.image_url || p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-500 space-y-1.5">
                            <FiGrid className="w-8 h-8 opacity-40" />
                            <span className="text-xs font-semibold">ParkEase Facility</span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isApproved ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                            }`}
                          >
                            {isApproved ? "Approved & Live" : "Pending Review"}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-950/80 text-white font-mono backdrop-blur-md">
                            {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate">
                            {p.name}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                            <FiMapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p.address || p.location || "City Location"}</span>
                          </p>
                        </div>

                        {/* Capacity Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-zinc-400">
                            <span>{p.total_slots || 0} Total Bays</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                              {p.booked_slots || 0} filled ({slotPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${slotPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {p.has_ev && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <FiZap className="w-3 h-3" /> EV Charging
                            </span>
                          )}
                          {p.has_cctv && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center gap-1">
                              <FiShield className="w-3 h-3" /> CCTV
                            </span>
                          )}
                          {p.is_24_7 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center gap-1">
                              <FiClock className="w-3 h-3" /> 24/7
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/owner/parking/${p.id}/slots`)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              Manage Slots
                            </button>
                            <button
                              onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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
                            className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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

        {/* ─── TAB 3: EARNINGS & REVENUE ─── */}
        {activeTab === "REVENUE" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xs">
            
            {/* Header & Period Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  Earnings Breakdown
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  View revenue trends and download statements.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Period Selectors */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {[
                    { id: "TODAY", label: "Today" },
                    { id: "WEEKLY", label: "Week" },
                    { id: "MONTHLY", label: "Month" },
                    { id: "YEARLY", label: "Year" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setRevenuePeriod(p.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        revenuePeriod === p.id
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <FiDownload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* 3 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[11px] font-bold text-zinc-400 uppercase">
                  {selectedPeriodTitle} Revenue
                </span>
                <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{Math.round(selectedPeriodRevenue).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[11px] font-bold text-zinc-400 uppercase">
                  Avg Ticket Size
                </span>
                <p className="text-2xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                  ₹
                  {todayRevenue > 0 && liveBookings.length > 0
                    ? Math.round(todayRevenue / liveBookings.length)
                    : 85}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[11px] font-bold text-zinc-400 uppercase">
                  All-Time Revenue
                </span>
                <p className="text-2xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                  ₹{Math.round(totalRevenue).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Clean Chart.js Line / Area Chart */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Revenue Trend</span>
                </span>
                <span>Peak: ₹{Math.max(...chartAmounts, 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="h-60 sm:h-64 w-full">
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
        title="Delete Facility"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
            <FiTrash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base text-zinc-900 dark:text-white">
              Delete "{deleteModal.name}"?
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              This will remove this parking facility and its slots.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
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
