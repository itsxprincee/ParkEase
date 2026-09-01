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
  FiShield,
  FiSliders,
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
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-2xl text-xs sm:text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-rose-600 border-rose-200 dark:border-rose-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
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

/* ─── Animated Number ────────────────────────────────────────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const steps = 18;
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
    }, 350 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* ─── Progress Bar Component ─────────────────────────────────────────── */
function ProgressBar({ value, max, color = "bg-emerald-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — ULTRA-POLISHED OWNER DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();

  // User details
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
      showToast(res.data?.message || "Vehicle checked in successfully!");
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
      showToast("Location deleted successfully.");
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
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#090a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white">
      
      {/* Subtle Background Glow */}
      <div className="fixed top-[-80px] left-[-80px] w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[-80px] w-96 h-96 rounded-full bg-sky-500/5 blur-3xl pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-20 md:pb-10">
        
        {/* ─── 1. CLEAN REFINED HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Console
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                • {parkingList.length} {parkingList.length === 1 ? "Location" : "Locations"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live parking check-ins, spot availability, and earnings overview.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Refresh Data"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            </button>

            <button
              onClick={() => navigate("/owner/scan-qr")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FiCamera className="w-4 h-4 text-emerald-500 dark:text-emerald-600" />
              <span>Scan QR</span>
            </button>

            <button
              onClick={() => navigate("/owner/add-parking")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <FiPlus className="w-4 h-4 stroke-[3]" />
              <span>Add Parking</span>
            </button>
          </div>
        </div>

        {/* ─── 2. 4 REFINED METRIC SUMMARY CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Available Spots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/80 border border-zinc-200/90 dark:border-zinc-800/90 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Available Spots
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <FiLayers className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                  <AnimatedNumber value={availableSlots} />
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  / {totalSlots} total
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                <span>Occupancy</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-mono">{occupancyPercent}%</span>
              </div>
              <ProgressBar value={enteredCount + bookedCount} max={totalSlots || 1} color="bg-indigo-500" />
            </div>
          </div>

          {/* Card 2: Parked Inside */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`group relative p-5 rounded-2xl bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/80 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10"
                : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Parked Inside
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <FiLogIn className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                  <AnimatedNumber value={enteredCount} />
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <span>View live parked list</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Arriving Soon */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`group relative p-5 rounded-2xl bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/80 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sky-500/10"
                : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-sky-500/50 dark:hover:border-sky-500/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Arriving Soon
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
                  <FiClock className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                  <AnimatedNumber value={bookedCount} />
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  Incoming
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              <span>Ready for check-in</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Today's Revenue */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`group relative p-5 rounded-2xl bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/80 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] ${
              activeTab === "REVENUE"
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10"
                : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-amber-500/50 dark:hover:border-amber-500/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Today's Earnings
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                  ₹<AnimatedNumber value={todayRevenue} />
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              <span>Total: ₹{totalRevenue.toLocaleString("en-IN")}</span>
              <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* ─── 3. TAB NAVIGATION & GLOBAL SEARCH ─── */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          
          {/* Main 3 Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab("VEHICLES");
                setVehicleFilter("ALL");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "VEHICLES"
                  ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-xs font-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiTruck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Vehicles</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-zinc-200/70 dark:bg-zinc-700/70 font-semibold">
                {liveBookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("FACILITIES")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "FACILITIES"
                  ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-xs font-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiGrid className="w-3.5 h-3.5 text-indigo-500" />
              <span>My Locations</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-zinc-200/70 dark:bg-zinc-700/70 font-semibold">
                {parkingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("REVENUE")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "REVENUE"
                  ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-xs font-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FiBarChart2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Revenue & Analytics</span>
            </button>
          </div>

          {/* Location Selector & Search Input */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {parkingList.length > 1 && (
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="text-xs font-bold py-2 px-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer"
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
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search plate, driver, spot... (Press '/')"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-8 py-2 w-full focus:outline-none focus:border-zinc-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                >
                  <FiX className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── TAB 1: LIVE VEHICLES ─── */}
        {activeTab === "VEHICLES" && (
          <div className="space-y-4 animate-fade-in">
            {/* Status Filter Chips */}
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    vehicleFilter === chip.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black shadow-xs"
                      : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300"
                  }`}
                >
                  {chip.dot && <span className={`w-2 h-2 rounded-full ${chip.dot}`} />}
                  <span>{chip.label}</span>
                  {chip.count !== null && (
                    <span className="opacity-70 text-[11px] font-normal">({chip.count})</span>
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
                title="No vehicles found"
                description={
                  liveBookings.length === 0
                    ? parkingList.length === 0
                      ? "You haven't added any parking spaces yet. Add your first location to start accepting bookings."
                      : "No vehicles are booked or parked right now. When customers make a reservation, they will appear here."
                    : "No vehicles match your active search or filter."
                }
                actionLabel={parkingList.length === 0 ? "Add Parking Space" : "Scan Driver QR"}
                onAction={parkingList.length === 0 ? () => navigate("/owner/add-parking") : () => navigate("/owner/scan-qr")}
              />
            ) : (
              <div className="space-y-2.5">
                {filteredBookings.map((b) => {
                  const isEntered = b.is_entered;
                  const isBooked = b.is_booked;
                  const isCompleted = b.status === "COMPLETED";

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                        isEntered
                          ? "border-emerald-300 dark:border-emerald-900/40"
                          : isBooked
                          ? "border-sky-300 dark:border-sky-900/40"
                          : "border-zinc-200/80 dark:border-zinc-800/80"
                      }`}
                    >
                      {/* Vehicle Plate & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-black text-xs text-zinc-900 dark:text-zinc-100 tracking-wider shrink-0">
                          {b.vehicle_number || "REG-NUMBER"}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono">
                              Spot #{b.slot_number}
                            </span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {b.customer_name}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              • {b.vehicle_type || "Car"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                            <span className="truncate max-w-[220px] font-medium text-zinc-700 dark:text-zinc-300">
                              {b.parking_name}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-zinc-500 dark:text-zinc-400">
                              {b.start_time} – {b.end_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Action Buttons */}
                      <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                        {isEntered && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Parked Inside
                          </span>
                        )}

                        {isBooked && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-bold">
                            <FiClock className="w-3 h-3 text-sky-500" />
                            Arriving Soon
                          </span>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-medium">
                            <FiCheck className="w-3 h-3 text-emerald-500" />
                            Checked Out
                          </span>
                        )}

                        {isBooked && (
                          <button
                            onClick={() => handleMarkEntry(b.id)}
                            disabled={actionLoading[b.id] === "entry"}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs shadow-emerald-600/20"
                          >
                            <FiLogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{actionLoading[b.id] === "entry" ? "Checking In..." : "Check In"}</span>
                          </button>
                        )}

                        {isEntered && (
                          <button
                            onClick={() => handleMarkExit(b.id)}
                            disabled={actionLoading[b.id] === "exit"}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs shadow-rose-600/20"
                          >
                            <FiLogOut className="w-3.5 h-3.5 stroke-[2.5]" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredFacilities.length === 0 ? (
              <EmptyState
                icon={FiGrid}
                title="No parking locations"
                description="Add your first parking space to start receiving bookings."
                actionLabel="Add Parking Location"
                onAction={() => navigate("/owner/add-parking")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                    >
                      {/* Image Banner */}
                      <div className="relative h-40 bg-zinc-900 overflow-hidden">
                        {p.image_url || p.image ? (
                          <img
                            src={p.image_url || p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                            <FiGrid className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isApproved
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {isApproved ? "Live & Active" : "Under Review"}
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-black/75 text-white font-mono backdrop-blur-xs">
                            {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                          </span>
                        </div>
                      </div>

                      {/* Info & Action Footer */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                            {p.name}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                            <FiMapPin className="w-3 h-3 shrink-0" />
                            <span>{p.address || p.location || "City Location"}</span>
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                            <span>{p.total_slots || 0} spots capacity</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{slotPct}% occupied</span>
                          </div>
                          <ProgressBar value={p.booked_slots || 0} max={p.total_slots || 1} />
                        </div>

                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/owner/parking/${p.id}/slots`)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                              Manage Slots
                            </button>
                            <button
                              onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                              className="text-xs font-bold px-2 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
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
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
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

        {/* ─── TAB 3: REVENUE ANALYTICS ─── */}
        {activeTab === "REVENUE" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-6 animate-fade-in shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-black text-lg text-zinc-900 dark:text-white">
                  Revenue Summary
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Track performance and earnings across your parking locations.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
                  {["TODAY", "WEEKLY", "MONTHLY", "YEARLY"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setRevenuePeriod(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        revenuePeriod === p
                          ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-black shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {p === "TODAY" ? "Today" : p === "WEEKLY" ? "Week" : p === "MONTHLY" ? "Month" : "Year"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <FiDownload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CSV Export</span>
                </button>
              </div>
            </div>

            {/* Total Period Revenue Card */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {selectedPeriodTitle} Earnings
              </span>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{Math.round(selectedPeriodRevenue).toLocaleString("en-IN")}
              </p>
            </div>

            {/* Clean Bar Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Earnings Breakdown</span>
                <span>Max: ₹{Math.round(maxChartAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="grid grid-flow-col auto-cols-fr gap-3 items-end h-44 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
                {currentChartData.map((item, idx) => {
                  const heightPct = Math.max(
                    10,
                    Math.round(((item.amount || 0) / maxChartAmount) * 100)
                  );

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end">
                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 transition-all cursor-pointer"
                        style={{ height: `${heightPct}%` }}
                        title={`₹${Math.round(item.amount || 0)} (${item.count || 0} vehicles)`}
                      />
                      <span className="text-[10px] font-bold text-zinc-400 mt-1.5 truncate max-w-[60px] text-center">
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
        title="Delete Location"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
            <FiTrash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">
              Delete "{deleteModal.name}"?
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              This will permanently delete this parking location and associated slots.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
