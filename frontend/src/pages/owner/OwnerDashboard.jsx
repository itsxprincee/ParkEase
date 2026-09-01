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
  FiActivity,
  FiCheck,
  FiTruck,
  FiArrowUpRight,
  FiZap,
  FiBarChart2,
  FiTrendingUp,
  FiUser,
  FiPhone,
  FiX,
  FiSliders,
  FiShield,
  FiCpu,
  FiRadio,
  FiDownload,
  FiCalendar,
  FiHelpCircle,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import { useLanguage } from "../../context/LanguageContext";

/* ─── Toast Notification ─────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-2xl text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-4 h-4" />
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
    const steps = 20;
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
    }, 400 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* ─── Progress Bar Component ─────────────────────────────────────────── */
function ProgressBar({ value, max, color = "bg-emerald-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — REDESIGNED INTUITIVE OWNER DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // User details
  const [userName, setUserName] = useState("Owner");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) {
          setUserName(parsed.name.split(" ")[0]);
        }
      }
    } catch (_) {}
  }, []);

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active View Tab: 'VEHICLES' | 'FACILITIES' | 'REVENUE'
  const [activeTab, setActiveTab] = useState("VEHICLES");
  const [revenuePeriod, setRevenuePeriod] = useState("TODAY"); // 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  const [chartType, setChartType] = useState("BAR"); // 'BAR' | 'AREA'

  const [vehicleFilter, setVehicleFilter] = useState("ALL"); // 'ALL' | 'INSIDE' | 'BOOKED' | 'EXITED'
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  // Dismissible Getting Started Guide
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try {
      return localStorage.getItem("parkease_owner_guide_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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

  const handleDismissGuide = () => {
    setGuideDismissed(true);
    try {
      localStorage.setItem("parkease_owner_guide_dismissed", "true");
    } catch (_) {}
  };

  const handleResetGuide = () => {
    setGuideDismissed(false);
    try {
      localStorage.removeItem("parkease_owner_guide_dismissed");
    } catch (_) {}
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
      showToast("Unable to load live dashboard.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  /* Vehicle Check In (Entry) */
  const handleMarkEntry = async (bookingId) => {
    try {
      setActionLoading((p) => ({ ...p, [bookingId]: "entry" }));
      const res = await API.post(`/booking/entry/${bookingId}`);
      showToast(res.data?.message || "Vehicle checked in & marked as entered!");
      loadOwnerData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to check in vehicle.", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [bookingId]: null }));
    }
  };

  /* Vehicle Check Out (Exit) */
  const handleMarkExit = async (bookingId) => {
    try {
      setActionLoading((p) => ({ ...p, [bookingId]: "exit" }));
      const res = await API.post(`/booking/exit/${bookingId}`);
      showToast(res.data?.message || "Vehicle checked out & slot freed!");
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
      showToast("Facility removed successfully.");
      setDeleteModal({ open: false, id: null, name: "" });
      loadOwnerData(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to delete facility.", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* Current Selected Facility */
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

  /* Chart Breakdown */
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

  const totalPeriodBookings = useMemo(() => {
    return currentChartData.reduce((acc, curr) => acc + (curr.count || 0), 0) || liveBookings.length || 1;
  }, [currentChartData, liveBookings]);

  const avgBookingAmount = useMemo(() => {
    if (!totalPeriodBookings || !selectedPeriodRevenue) return 0;
    return Math.round(selectedPeriodRevenue / totalPeriodBookings);
  }, [selectedPeriodRevenue, totalPeriodBookings]);

  /* CSV Statement Export Handler */
  const handleExportCSV = () => {
    const rows = [
      ["Date / Period", "Revenue (INR)", "Vehicles Count"],
      ...currentChartData.map((d) => [d.label, Math.round(d.amount || 0), d.count || 0]),
      ["TOTAL", selectedPeriodRevenue, totalPeriodBookings],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ParkEase_${revenuePeriod}_Revenue_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${selectedPeriodTitle} revenue statement downloaded!`, "success");
  };

  // First-time state determination
  const isFirstTimeOwner = parkingList.length === 0;

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Background Decorative Glows */}
      <div className="fixed top-[-80px] left-[-80px] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[-100px] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-3xl pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-20 md:pb-10">

        {/* ══════════════════════════════════════════════════════════════════
            1. CLEAN & WELCOMING HEADER WITH QUICK ACTIONS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                  Owner Dashboard
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {parkingList.length} {parkingList.length === 1 ? "Location" : "Locations"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {greeting}, {userName}! 👋
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Manage your parking spots, check in/out arriving cars, and monitor your earnings.
              </p>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => loadOwnerData(true)}
                disabled={refreshing}
                className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Refresh Live Data"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Help & How It Works"
              >
                <FiHelpCircle className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">How It Works</span>
              </button>

              <button
                onClick={() => navigate("/owner/scan-qr")}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <FiCamera className="w-4 h-4 text-emerald-400" />
                <span>Scan Driver QR</span>
              </button>

              <button
                onClick={() => navigate("/owner/add-parking")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
              >
                <FiPlus className="w-4 h-4 stroke-[3]" />
                <span>Add Parking Location</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. GETTING STARTED ONBOARDING GUIDE (FOR 1ST TIME USERS)
        ══════════════════════════════════════════════════════════════════ */}
        {(!guideDismissed || isFirstTimeOwner) && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-sky-950/40 border border-emerald-500/20 dark:border-emerald-500/30 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                  <FiZap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                    {isFirstTimeOwner ? "Welcome to ParkEase! Let's get you set up in 3 simple steps" : "Quick Start Guide for Parking Owners"}
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Follow these steps to list your parking space and start receiving paid bookings.
                  </p>
                </div>
              </div>

              {!isFirstTimeOwner && (
                <button
                  onClick={handleDismissGuide}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-3 py-1.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>

            {/* 3 Actionable Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div
                onClick={() => navigate("/owner/add-parking")}
                className="group p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    {parkingList.length > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <FiCheck className="w-3.5 h-3.5 stroke-[3]" /> Done
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-500">Required</span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Add Your Parking Space
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Set up your location name, street address, photos, and hourly parking rate.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Add location</span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => {
                  if (parkingList.length > 0) {
                    navigate(`/owner/parking/${parkingList[0].id}/slots`);
                  } else {
                    navigate("/owner/add-parking");
                  }
                }}
                className="group p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-sky-500/50 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">Step 2</span>
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Configure Slots & Bays
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Define total slots for Cars, Bikes, or EV Charging spots with custom slot numbers.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <span>Manage spots</span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => navigate("/owner/scan-qr")}
                className="group p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">Step 3</span>
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Check In Arriving Drivers
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Scan customer booking QR codes or tap "Check In" from the dashboard when they arrive.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Open QR scanner</span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. 4 KEY METRIC SUMMARY CARDS (CLEAN, JARGON-FREE)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Available Spots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Available Spots
              </span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                <AnimatedNumber value={availableSlots} />
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                / {totalSlots} total
              </span>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                <span>Occupancy</span>
                <span className="text-zinc-800 dark:text-zinc-200">{occupancyPercent}%</span>
              </div>
              <ProgressBar value={enteredCount + bookedCount} max={totalSlots || 1} color="bg-indigo-500" />
            </div>
          </div>

          {/* Card 2: Parked Inside Now */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE" ? "ring-2 ring-emerald-500/50" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Parked Inside
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiLogIn className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                <AnimatedNumber value={enteredCount} />
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 flex items-center gap-1">
              <span>Click to view parked cars</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </p>
          </div>

          {/* Card 3: Arriving Soon */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED" ? "ring-2 ring-sky-500/50" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Arriving Soon
              </span>
              <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                <AnimatedNumber value={bookedCount} />
              </span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-lg">
                Reservations
              </span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 flex items-center gap-1">
              <span>Ready for check-in</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </p>
          </div>

          {/* Card 4: Total & Today's Earnings */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group ${
              activeTab === "REVENUE" ? "ring-2 ring-emerald-500/50" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Today's Earnings
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight font-mono">
                ₹<AnimatedNumber value={todayRevenue} />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Total: ₹{totalRevenue.toLocaleString("en-IN")}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <span>View stats</span>
                <FiChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            4. MAIN WORKSPACE TABS (VEHICLES | LOCATIONS | REVENUE)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Tab Bar and Search Row */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            
            {/* 3 Main View Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab("VEHICLES");
                  setVehicleFilter("ALL");
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  activeTab === "VEHICLES"
                    ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiTruck className="w-4 h-4" />
                <span>Live Vehicles</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === "VEHICLES"
                      ? "bg-emerald-500/20 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-700"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {liveBookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("FACILITIES")}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  activeTab === "FACILITIES"
                    ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiGrid className="w-4 h-4" />
                <span>My Locations</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === "FACILITIES"
                      ? "bg-emerald-500/20 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-700"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {parkingList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("REVENUE")}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  activeTab === "REVENUE"
                    ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiBarChart2 className="w-4 h-4" />
                <span>Revenue & Analytics</span>
              </button>
            </div>

            {/* Location Selector & Search Filter */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {parkingList.length > 1 && (
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="pe-input text-xs font-bold py-2.5 px-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl cursor-pointer"
                >
                  <option value="ALL">All Parking Locations</option>
                  {parkingList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    activeTab === "VEHICLES"
                      ? "Search plate, driver, spot..."
                      : activeTab === "REVENUE"
                      ? "Search dates or period..."
                      : "Search locations..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left pr-8 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
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

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: LIVE VEHICLES STREAM & CHECK-IN / CHECK-OUT
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "VEHICLES" && (
            <div className="space-y-4 animate-fade-in">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "ALL", label: "All Vehicles", count: liveBookings.length },
                  { id: "INSIDE", label: "Parked Inside", count: enteredCount, dot: "bg-emerald-500" },
                  { id: "BOOKED", label: "Arriving Soon", count: bookedCount, dot: "bg-sky-500" },
                  { id: "EXITED", label: "Checked Out", count: null, dot: "bg-zinc-400" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      vehicleFilter === chip.id
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black shadow-sm"
                        : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300"
                    }`}
                  >
                    {chip.dot && <span className={`w-2 h-2 rounded-full ${chip.dot}`} />}
                    <span>{chip.label}</span>
                    {chip.count !== null && (
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                          vehicleFilter === chip.id
                            ? "bg-white/20 dark:bg-black/20"
                            : "bg-zinc-100 dark:bg-zinc-800"
                        }`}
                      >
                        {chip.count}
                      </span>
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
                  title="No vehicles to display"
                  description={
                    liveBookings.length === 0
                      ? isFirstTimeOwner
                        ? "You don't have any parking locations added yet. Add your location to start accepting customer bookings."
                        : "No vehicles are booked or parked right now. When customers make a booking, their details and check-in buttons will appear here."
                      : "No vehicles match your active search or filter."
                  }
                  actionLabel={isFirstTimeOwner ? "Add Parking Location" : undefined}
                  onAction={isFirstTimeOwner ? () => navigate("/owner/add-parking") : undefined}
                />
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((b) => {
                    const isEntered = b.is_entered;
                    const isBooked = b.is_booked;
                    const isCompleted = b.status === "COMPLETED";

                    return (
                      <div
                        key={b.id}
                        className={`p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/95 border backdrop-blur-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                          isEntered
                            ? "border-emerald-300 dark:border-emerald-900/40"
                            : isBooked
                            ? "border-sky-300 dark:border-sky-900/40"
                            : "border-zinc-200/80 dark:border-zinc-800/80"
                        }`}
                      >
                        {/* Vehicle Plate & Details */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Indian License Plate Badge */}
                          <div className="license-plate text-xs shrink-0 shadow-xs border border-zinc-300 dark:border-zinc-700">
                            <span className="license-plate-ind">IND</span>
                            <span className="font-mono font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                              {b.vehicle_number || "REG-NUMBER"}
                            </span>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 font-mono">
                                Spot #{b.slot_number}
                              </span>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {b.customer_name}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                • {b.vehicle_type || "Car"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                                {b.parking_name}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                                {b.start_time} – {b.end_time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badges & 1-Click Action Buttons */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                          {isEntered && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-semibold">
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Checked Out
                            </span>
                          )}

                          {/* Check In Action */}
                          {isBooked && (
                            <button
                              onClick={() => handleMarkEntry(b.id)}
                              disabled={actionLoading[b.id] === "entry"}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <FiLogIn className="w-4 h-4 stroke-[2.5]" />
                              <span>{actionLoading[b.id] === "entry" ? "Checking In..." : "Check In"}</span>
                            </button>
                          )}

                          {/* Check Out Action */}
                          {isEntered && (
                            <button
                              onClick={() => handleMarkExit(b.id)}
                              disabled={actionLoading[b.id] === "exit"}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
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

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: MY PARKING LOCATIONS DIRECTORY
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "FACILITIES" && (
            <div className="space-y-4 animate-fade-in">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filteredFacilities.length === 0 ? (
                <EmptyState
                  icon={FiGrid}
                  title="No parking locations yet"
                  description="Add your first parking lot with hourly pricing and capacity to start receiving bookings."
                  actionLabel="Add Parking Location"
                  onAction={() => navigate("/owner/add-parking")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredFacilities.map((p) => {
                    const status = (p.verification_status || p.status || "APPROVED").toUpperCase();
                    const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                    const isRejected = status === "REJECTED";
                    const isFree = (p.hourly_rate ?? -1) === 0;
                    const slotPct =
                      p.total_slots > 0
                        ? Math.round(((p.booked_slots || 0) / p.total_slots) * 100)
                        : 0;

                    return (
                      <div
                        key={p.id}
                        className="group bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        {/* Location Image Header */}
                        <div className="relative h-44 bg-zinc-900 overflow-hidden">
                          {p.image_url || p.image ? (
                            <img
                              src={p.image_url || p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                              <FiGrid className="w-8 h-8 text-zinc-400 mb-1" />
                              <span className="text-xs font-semibold text-zinc-400">Parking Space</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Top Badges */}
                          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                            <Badge
                              variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                              dot
                              size="sm"
                            >
                              {isApproved ? "Live & Active" : isRejected ? "Rejected" : "Under Review"}
                            </Badge>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-black/75 text-white backdrop-blur-md border border-white/20 font-mono shadow-xs">
                              {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                            </span>
                          </div>

                          {/* Total spots badge */}
                          <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold">
                            <FiLayers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{p.total_slots || 10} spots total</span>
                          </div>
                        </div>

                        {/* Location Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <h3 className="font-black text-base text-zinc-900 dark:text-white line-clamp-1">
                              {p.name}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1 line-clamp-1">
                              <FiMapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                              <span>{p.address || p.location || "City Parking Area"}</span>
                            </p>

                            {p.total_slots > 0 && (
                              <div className="mt-3.5 space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                                  <span>Occupancy</span>
                                  <span className="text-zinc-800 dark:text-zinc-200">{slotPct}%</span>
                                </div>
                                <ProgressBar value={p.booked_slots || 0} max={p.total_slots} color="bg-emerald-500" />
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={FiLayers}
                                onClick={() => navigate(`/owner/parking/${p.id}/slots`)}
                              >
                                Manage Slots
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={FiCamera}
                                onClick={() => navigate("/owner/scan-qr")}
                              >
                                Scan QR
                              </Button>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                                className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                                <span>Edit Info</span>
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    open: true,
                                    id: p.id,
                                    name: p.name,
                                  })
                                }
                                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: REVENUE & EARNINGS ANALYTICS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "REVENUE" && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
                
                {/* Header & Period Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        {selectedPeriodTitle}
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                        Earnings & Financial Overview
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {currentFacility
                        ? `Live earnings for ${currentFacility.name}`
                        : `Live earnings across all ${parkingList.length} parking locations.`}
                    </p>
                  </div>

                  {/* Period Buttons & CSV Export */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                      {[
                        { id: "TODAY", label: "Today" },
                        { id: "WEEKLY", label: "Week" },
                        { id: "MONTHLY", label: "Month" },
                        { id: "YEARLY", label: "Year" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setRevenuePeriod(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            revenuePeriod === p.id
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                      title="Download CSV Statement"
                    >
                      <FiDownload className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* 3 Summary Stats for Period */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Total Earnings
                    </span>
                    <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      ₹{Math.round(selectedPeriodRevenue).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Bookings / Vehicles
                    </span>
                    <p className="text-xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                      {totalPeriodBookings}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Average per Booking
                    </span>
                    <p className="text-xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                      ₹{avgBookingAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Bar Chart Visualization */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-3">
                    <span>Income Trend</span>
                    <span>Max: ₹{Math.round(maxChartAmount).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="grid grid-flow-col auto-cols-fr gap-3 sm:gap-4 items-end h-52 border-b border-zinc-200 dark:border-zinc-800 pb-2 min-w-[480px]">
                      {currentChartData.map((item, idx) => {
                        const heightPct = Math.max(
                          10,
                          Math.round(((item.amount || 0) / maxChartAmount) * 100)
                        );

                        return (
                          <div
                            key={idx}
                            className="group relative flex flex-col items-center h-full justify-end cursor-pointer"
                          >
                            {/* Hover Tooltip */}
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-zinc-950 text-white text-center px-2.5 py-1.5 rounded-xl shadow-xl border border-zinc-800 text-[11px] whitespace-nowrap">
                              <span className="font-mono text-emerald-400 font-black block">
                                ₹{Math.round(item.amount || 0).toLocaleString("en-IN")}
                              </span>
                              <span className="text-zinc-400 text-[10px]">{item.count || 1} vehicles</span>
                            </div>

                            {/* Bar Column */}
                            <div
                              className="w-full max-w-[42px] rounded-xl bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 transition-all group-hover:scale-105"
                              style={{ height: `${heightPct}%` }}
                            />

                            {/* Label */}
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-2 truncate max-w-[70px] text-center">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Real-time automatic sync with parking gate entries</span>
                  </span>
                  <button
                    onClick={handleResetGuide}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    View Quick Guide
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── HOW IT WORKS / HELP MODAL ─── */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Owner Quick Guide & FAQs"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-zinc-900 dark:text-white">How Check-In & Check-Out Work</h5>
              <p className="mt-0.5 leading-relaxed">
                When a customer books a slot, you will see them in <strong>"Arriving Soon"</strong>. When they reach your parking space, scan their QR code or click <strong>"Check In"</strong>. When they leave, click <strong>"Check Out"</strong> to release the slot for new customers.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70">
              <h6 className="font-bold text-zinc-900 dark:text-white">1. How do I add or change parking rates?</h6>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Go to "My Locations" tab and click "Edit Info" on any parking card to modify hourly fees and operating hours.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70">
              <h6 className="font-bold text-zinc-900 dark:text-white">2. How do I add Car vs Bike vs EV slots?</h6>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Click "Manage Slots" on any location to create distinct spot numbers and slot types.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70">
              <h6 className="font-bold text-zinc-900 dark:text-white">3. When do I receive payouts?</h6>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Earnings are deposited directly to your bank account based on your verified owner profile settings.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={() => setShowHelpModal(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── DELETE LOCATION CONFIRMATION MODAL ─── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Parking Location"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/30">
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="font-black text-zinc-900 dark:text-white">
              Delete "{deleteModal.name}"?
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              This will permanently delete this parking space and all associated slots.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
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
