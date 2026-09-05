import React, { useEffect, useState, useMemo, useRef } from "react";
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
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

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

/* ─── Circular Occupancy Ring Component with Dynamic Thresholds ───────── */
function OccupancyGauge({ percentage = 0, size = 84 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  // Dynamic Color based on capacity stress
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

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-100 dark:stroke-zinc-800/80"
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
        <span className="text-sm font-black font-mono text-zinc-900 dark:text-white leading-none">
          {percentage}%
        </span>
        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full border mt-1 ${badgeColor}`}>
          {percentage >= 90 ? "Full" : percentage >= 75 ? "Busy" : "Optimal"}
        </span>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — ULTRA-MODERN BENTO OWNER DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();

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
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  // Revenue Period: 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  const [revenuePeriod, setRevenuePeriod] = useState("TODAY");

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const loadOwnerData = async (isRefresh = false) => {
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
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

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
    if (currentFacility) return currentFacility.available_slots ?? Math.max(0, totalSlots - enteredCount - bookedCount);
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
    if (currentFacility) return currentFacility.weekly_revenue ?? Math.round(todayRevenue * 3.5 || totalRevenue * 0.4);
    return dashboardData?.weekly_revenue ?? Math.round(todayRevenue * 3.5 || totalRevenue * 0.4);
  }, [currentFacility, dashboardData, todayRevenue, totalRevenue]);

  const monthlyRevenue = useMemo(() => {
    if (currentFacility) return currentFacility.monthly_revenue ?? Math.round(todayRevenue * 18 || totalRevenue * 0.85);
    return dashboardData?.monthly_revenue ?? Math.round(todayRevenue * 18 || totalRevenue * 0.85);
  }, [currentFacility, dashboardData, todayRevenue, totalRevenue]);

  const yearlyRevenue = useMemo(() => {
    if (currentFacility) return currentFacility.yearly_revenue ?? Math.max(totalRevenue, todayRevenue * 150);
    return dashboardData?.yearly_revenue ?? Math.max(totalRevenue, todayRevenue * 150);
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

  /* Revenue Chart Data */
  const currentChartData = useMemo(() => {
    const breakdowns = dashboardData?.revenue_breakdowns;
    const globalTotal = dashboardData?.total_revenue || 1;
    const facilityRatio = currentFacility
      ? (totalRevenue > 0 ? totalRevenue / globalTotal : 0.4)
      : 1;

    if (revenuePeriod === "TODAY") {
      const base = breakdowns?.today || [
        { label: "06:00 - 09:00", amount: todayRevenue * 0.15, count: 4 },
        { label: "09:00 - 12:00", amount: todayRevenue * 0.35, count: 9 },
        { label: "12:00 - 15:00", amount: todayRevenue * 0.20, count: 6 },
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
        { label: "Jun", amount: yearlyRevenue * 0.10, count: 160 },
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
  }, [revenuePeriod, dashboardData, todayRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, currentFacility, totalRevenue]);

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
  }, [revenuePeriod, todayRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, totalRevenue]);

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
    showToast(`Exported ${selectedPeriodTitle} revenue statement!`, "success");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#07080c] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white">
      
      {/* Subtle Ambient Mesh Backdrops */}
      <div className="fixed top-[-120px] left-[-100px] w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[-100px] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

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
                <span>{parkingList.length} {parkingList.length === 1 ? "Facility Listed" : "Facilities Listed"}</span>
              </span>
              {selectedFacility !== "ALL" && currentFacility && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Filtering: {currentFacility.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
              {greeting}, <span className="text-emerald-600 dark:text-emerald-400">{userName}</span> 👋
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
              Monitor live driver check-ins, oversee slot occupancy, and streamline gate turnover in real time.
            </p>
          </div>

          {/* Quick Action Control Strip */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 relative z-10">
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-all active:scale-90 shadow-xs cursor-pointer"
              title="Refresh Live Operations Data"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            </button>

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
          
          {/* Bento Tile 1: Live Lot Capacity with Radial Gauge (Visual Hero Tile) */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex items-center justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
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

            <OccupancyGauge percentage={occupancyPercent} size={82} />
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
                  Live
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                  <AnimatedNumber value={enteredCount} />
                </span>
                <span className="text-xs text-zinc-400 font-semibold">vehicles in lot</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <span>View live vehicle stream</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Bento Tile 3: Arriving Soon (Upcoming reservations) */}
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
                <span className="text-xs text-zinc-400 font-semibold">reservations</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              <span>Ready for gate check-in</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Bento Tile 4: Today's Revenue */}
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

        {/* ─── 3. TAB NAVIGATION, SEARCH & LOCATION SELECTOR ─── */}
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
            {/* Status Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "ALL", label: "All Passes", count: liveBookings.length },
                { id: "INSIDE", label: "Parked Inside", count: enteredCount, dot: "bg-emerald-500 animate-pulse" },
                { id: "BOOKED", label: "Arriving Soon", count: bookedCount, dot: "bg-sky-500" },
                { id: "EXITED", label: "Completed / Out", count: null, dot: "bg-zinc-400" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setVehicleFilter(chip.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    vehicleFilter === chip.id
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black shadow-sm"
                      : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {chip.dot && <span className={`w-2 h-2 rounded-full ${chip.dot}`} />}
                  <span>{chip.label}</span>
                  {chip.count !== null && (
                    <span className="opacity-75 text-[11px] font-mono">({chip.count})</span>
                  )}
                </button>
              ))}
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
                    : "No vehicle passes match your active filter or search query."
                }
                actionLabel={parkingList.length === 0 ? "Add Parking Facility" : "Scan Driver QR Pass"}
                onAction={parkingList.length === 0 ? () => navigate("/owner/add-parking") : () => navigate("/owner/scan-qr")}
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
                  const isBike = vType.includes("bike") || vType.includes("scooter");

                  return (
                    <div
                      key={b.id}
                      className={`relative overflow-hidden p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
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
                      <div className="flex items-center gap-4 min-w-0 pl-1.5">
                        
                        {/* 3D Embossed Indian License Plate Tag */}
                        <div
                          onClick={() => copyToClipboard(b.vehicle_number, b.id)}
                          className="license-plate text-xs shrink-0 shadow-xs border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:border-emerald-500 transition-colors"
                          title="Click to copy plate number"
                        >
                          <span className="license-plate-ind">IND</span>
                          <span className="font-mono font-black tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                            {b.vehicle_number || "REG-NUMBER"}
                            <FiCopy className={`w-2.5 h-2.5 opacity-40 ${copiedId === b.id ? "text-emerald-500 opacity-100" : ""}`} />
                          </span>
                        </div>

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
                              <span>{isBike ? "🛵 2-Wheeler" : "🚗 4-Wheeler"}</span>
                            </span>

                            {isDailyPass ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Multi-Entry Daily Pass
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

                      {/* Right: Status Badges & 1-Click Operation Buttons */}
                      <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
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
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            <FiLogIn className="w-4 h-4 stroke-[2.5]" />
                            <span>{actionLoading[b.id] === "entry" ? "Checking In..." : "Check In"}</span>
                          </button>
                        )}

                        {isEntered && (
                          <button
                            onClick={() => handleMarkExit(b.id)}
                            disabled={actionLoading[b.id] === "exit"}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-rose-600/20"
                          >
                            <FiLogOut className="w-4 h-4 stroke-[2.5]" />
                            <span>{actionLoading[b.id] === "exit" ? "Checking Out..." : "Check Out"}</span>
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
                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">ParkEase Facility</span>
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
                            <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-white animate-pulse" : "bg-white"}`} />
                            {isApproved ? "Approved & Live" : "Pending Verification"}
                          </span>
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-zinc-950/80 text-white font-mono backdrop-blur-md border border-white/15">
                            {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                          </span>
                        </div>
                      </div>

                      {/* Info & Action Controls */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {p.name}
                          </h3>
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
                              onClick={() => navigate(`/owner/parking/${p.id}/slots`)}
                              className="text-xs font-black px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              Manage Slots
                            </button>
                            <button
                              onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
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

        {/* ─── TAB 3: REVENUE ANALYTICS & BREAKDOWNS ─── */}
        {activeTab === "REVENUE" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 space-y-6 animate-fade-in shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            
            {/* Header with Period Selectors and CSV export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-black text-xl sm:text-2xl text-zinc-900 dark:text-white tracking-tight">
                  Revenue Analytics & Payouts
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Analyze performance, driver receipts, and turnover metrics across your facilities.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
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
                  ₹{todayRevenue > 0 && liveBookings.length > 0 ? Math.round(todayRevenue / liveBookings.length) : 85}
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

            {/* Elevated Dynamic Bar Chart */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Timeline Earnings Breakdown</span>
                </span>
                <span>Peak Interval: ₹{Math.round(maxChartAmount).toLocaleString("en-IN")}</span>
              </div>
              
              <div className="grid grid-flow-col auto-cols-fr gap-3 sm:gap-6 items-end h-52 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto">
                {currentChartData.map((item, idx) => {
                  const heightPct = Math.max(
                    12,
                    Math.round(((item.amount || 0) / maxChartAmount) * 100)
                  );

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                      <div
                        className="w-full max-w-[44px] rounded-xl bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 hover:from-emerald-500 hover:to-teal-300 transition-all group-hover:scale-105 shadow-sm group-hover:shadow-emerald-500/25"
                        style={{ height: `${heightPct}%` }}
                        title={`₹${Math.round(item.amount || 0)} (${item.count || 0} vehicles)`}
                      />
                      <span className="text-[10px] font-bold text-zinc-400 mt-2 truncate max-w-[70px] text-center">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
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
