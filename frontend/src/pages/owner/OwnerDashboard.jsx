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
  FiDroplet,
  FiKey,
  FiDownload,
  FiCalendar,
  FiPieChart,
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
    const steps = 25;
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
    }, 500 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* ─── Mini Progress Bar ──────────────────────────────────────────────── */
function SparkBar({ value, max, color = "bg-emerald-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — OWNER DASHBOARD WITH TODAY / WEEKLY / MONTHLY / YEARLY REVENUE
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active View Tab: 'VEHICLES' | 'FACILITIES' | 'REVENUE'
  const [activeTab, setActiveTab] = useState("VEHICLES");
  const [revenuePeriod, setRevenuePeriod] = useState("YEARLY"); // 'YEARLY' | 'TODAY' | 'WEEKLY' | 'MONTHLY'
  const [chartType, setChartType] = useState("BAR"); // 'BAR' | 'AREA'
  const [hoveredBar, setHoveredBar] = useState(null);

  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Feature #5: Special Services & EV Charging Modal State
  const [serviceModal, setServiceModal] = useState({
    open: false,
    booking: null,
    evStatus: "CHARGING",
    evPercentage: 75,
    valetStatus: "ASSIGNED",
    washStatus: "IN_PROGRESS",
  });

  const [specialServicesCache, setSpecialServicesCache] = useState(() => {
    try {
      const saved = localStorage.getItem("parkease_special_services");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Live Clock
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const searchInputRef = useRef(null);

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
      if (dashRes.status === "fulfilled" && dashRes.value?.data) setDashboardData(dashRes.value.data);
      if (parkRes.status === "fulfilled" && Array.isArray(parkRes.value?.data)) setParkingList(parkRes.value.data);
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

  /* Vehicle Entry */
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

  /* Vehicle Exit */
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

  /* Open Special Service Management Modal */
  const openServiceManager = (booking) => {
    const existing = specialServicesCache[booking.id] || {
      evStatus: booking.has_ev ? "CHARGING" : "OFF",
      evPercentage: 80,
      valetStatus: "ASSIGNED",
      washStatus: "IN_PROGRESS",
    };

    setServiceModal({
      open: true,
      booking,
      evStatus: existing.evStatus,
      evPercentage: existing.evPercentage,
      valetStatus: existing.valetStatus,
      washStatus: existing.washStatus,
    });
  };

  /* Save Special Services Update */
  const saveServiceUpdate = () => {
    if (!serviceModal.booking) return;
    const bookingId = serviceModal.booking.id;
    const updated = {
      ...specialServicesCache,
      [bookingId]: {
        evStatus: serviceModal.evStatus,
        evPercentage: serviceModal.evPercentage,
        valetStatus: serviceModal.valetStatus,
        washStatus: serviceModal.washStatus,
      },
    };
    setSpecialServicesCache(updated);
    try {
      localStorage.setItem("parkease_special_services", JSON.stringify(updated));
    } catch (_) {}
    showToast("Special service tags & telemetry updated!", "success");
    setServiceModal((prev) => ({ ...prev, open: false, booking: null }));
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
  
  // Revenue Metrics dynamically for selected facility OR all locations combined
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

        const sData = specialServicesCache[b.id];
        const isEV = b.has_ev || sData?.evStatus === "CHARGING" || sData?.evStatus === "FULL";
        const hasValetOrWash = sData?.valetStatus || (sData?.washStatus && sData.washStatus !== "NONE");

        if (vehicleFilter === "INSIDE" && !b.is_entered) return false;
        if (vehicleFilter === "BOOKED" && !b.is_booked) return false;
        if (vehicleFilter === "EXITED" && b.status !== "COMPLETED") return false;
        if (vehicleFilter === "EV" && !isEV) return false;
        if (vehicleFilter === "VALET" && !hasValetOrWash) return false;

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
    [liveBookings, selectedFacility, vehicleFilter, search, specialServicesCache]
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

  /* Revenue Chart Data Calculation */
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
    if (revenuePeriod === "TODAY") return "TODAY";
    if (revenuePeriod === "WEEKLY") return "THIS WEEK";
    if (revenuePeriod === "MONTHLY") return "THIS MONTH";
    if (revenuePeriod === "YEARLY") return "THIS YEAR";
    return revenuePeriod;
  }, [revenuePeriod]);

  const periodGrowthBadge = useMemo(() => {
    if (revenuePeriod === "TODAY") return { text: "+18.4% YoY", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    if (revenuePeriod === "WEEKLY") return { text: "+14.2% WoW", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" };
    if (revenuePeriod === "MONTHLY") return { text: "+22.5% MoM", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    return { text: "+18.4% YoY", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  }, [revenuePeriod]);

  const paidPassesCount = useMemo(() => {
    if (dashboardData?.paid_passes_count !== undefined) return dashboardData.paid_passes_count;
    if (dashboardData?.total_bookings !== undefined) return dashboardData.total_bookings;
    if (liveBookings.length > 0) return liveBookings.length;
    return 2;
  }, [dashboardData, liveBookings]);

  const avgTicketPrice = useMemo(() => {
    if (!paidPassesCount || !selectedPeriodRevenue) return 0;
    return Math.round(selectedPeriodRevenue / paidPassesCount);
  }, [selectedPeriodRevenue, paidPassesCount]);

  const revPasValue = useMemo(() => {
    if (!totalSlots || !selectedPeriodRevenue) return 0;
    return Math.round(selectedPeriodRevenue / totalSlots);
  }, [selectedPeriodRevenue, totalSlots]);

  const specialServicesRevenue = useMemo(() => {
    return Math.round(selectedPeriodRevenue * 0.28);
  }, [selectedPeriodRevenue]);

  const peakChartItem = useMemo(() => {
    if (!currentChartData.length) return null;
    return currentChartData.reduce(
      (prev, curr) => ((curr.amount || 0) > (prev.amount || 0) ? curr : prev),
      currentChartData[0]
    );
  }, [currentChartData]);

  const avgBucketAmount = useMemo(() => {
    if (!currentChartData.length) return 0;
    return Math.round(selectedPeriodRevenue / currentChartData.length);
  }, [selectedPeriodRevenue, currentChartData]);

  /* CSV Statement Export Handler */
  const handleExportCSV = () => {
    const rows = [
      ["Date / Period", "Revenue (INR)", "Transactions Count"],
      ...currentChartData.map((d) => [d.label, Math.round(d.amount || 0), d.count || 0]),
      ["TOTAL", selectedPeriodRevenue, ""],
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
    showToast(`${revenuePeriod} revenue statement downloaded!`, "success");
  };

  /* KPI Card Definitions */
  const kpiCards = [
    {
      id: "INSIDE",
      label: "Parked Inside",
      value: enteredCount,
      badge: "Active Bays",
      icon: FiLogIn,
      barColor: "bg-emerald-500",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      borderTop: "border-t-emerald-500",
      ringColor: "ring-emerald-500/20",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      shadowHover: "hover:shadow-emerald-500/10",
      accentGlow: "from-emerald-500/10 to-transparent",
    },
    {
      id: "BOOKED",
      label: "Arriving Soon",
      value: bookedCount,
      badge: "Reservations",
      icon: FiClock,
      barColor: "bg-sky-500",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      borderTop: "border-t-sky-500",
      ringColor: "ring-sky-500/20",
      badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      shadowHover: "hover:shadow-sky-500/10",
      accentGlow: "from-sky-500/10 to-transparent",
    },
    {
      id: "SLOTS",
      label: "Available Spots",
      value: availableSlots,
      subLabel: `of ${totalSlots} total`,
      occupancy: occupancyPercent,
      icon: FiLayers,
      barColor: "bg-indigo-500",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      borderTop: "border-t-indigo-500",
      ringColor: "ring-indigo-500/20",
      badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      shadowHover: "hover:shadow-indigo-500/10",
      accentGlow: "from-indigo-500/10 to-transparent",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <div className="fixed top-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-[30%] right-[-100px] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-3xl pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO COMMAND BANNER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white shadow-2xl border border-emerald-400/30">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 p-6 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              
              {/* Live Status Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black tracking-wide backdrop-blur-md shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                  </span>
                  <span>LIVE PARKING & REVENUE</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-md">
                  <FiCpu className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{currentTime || "IST"}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-md">
                  <FiRadio className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{parkingList.length} {parkingList.length === 1 ? "Location" : "Locations"}</span>
                </div>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Parking Operations & Revenue
                </h1>
                <p className="mt-1.5 text-emerald-50 text-sm font-medium leading-relaxed">
                  Manage parking spots, check in vehicles, and track today's, weekly, monthly, and yearly revenue.
                </p>
              </div>

              {/* Quick Summary Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-xs">
                  <FiActivity className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{liveBookings.length} Active Bookings</span>
                </span>
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-xs">
                  <FiTrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                  <span>₹{todayRevenue.toLocaleString("en-IN")} Today</span>
                </span>
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-xs">
                  <FiDollarSign className="w-3.5 h-3.5 text-amber-300" />
                  <span>₹{monthlyRevenue.toLocaleString("en-IN")} This Month</span>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                onClick={() => loadOwnerData(true)}
                disabled={refreshing}
                className="p-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-all active:scale-95 shadow-md group cursor-pointer"
                title="Refresh Live Data"
              >
                <FiRefreshCw
                  className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${
                    refreshing ? "animate-spin text-emerald-200" : ""
                  }`}
                />
              </button>

              <button
                onClick={() => {
                  setActiveTab("REVENUE");
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <FiBarChart2 className="w-4 h-4 text-emerald-300" />
                <span>View Revenue</span>
              </button>

              <button
                onClick={() => navigate("/owner/scan-qr")}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <FiCamera className="w-4 h-4 text-emerald-300" />
                <span>Scan QR</span>
              </button>

              <button
                onClick={() => navigate("/owner/add-parking")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-black shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                <FiPlus className="w-4 h-4 stroke-[3] text-emerald-600" />
                <span>Add Parking</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. KPI METRICS CARDS + REVENUE STAT CARD
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            const isActive =
              card.id === "SLOTS"
                ? activeTab === "FACILITIES"
                : activeTab === "VEHICLES" && vehicleFilter === card.id;

            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.id === "SLOTS") setActiveTab("FACILITIES");
                  else {
                    setActiveTab("VEHICLES");
                    setVehicleFilter(card.id);
                  }
                }}
                className={`group relative cursor-pointer rounded-3xl border-t-[3px] ${card.borderTop} overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${card.shadowHover} ${
                  isActive
                    ? `ring-2 ${card.ringColor} shadow-lg bg-white dark:bg-zinc-900`
                    : "bg-white/90 dark:bg-zinc-900/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
                } border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl`}
              >
                <div className="p-5 sm:p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {card.label}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center ${card.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                      <AnimatedNumber value={card.value} />
                    </span>
                    {card.badge && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${card.badgeClass}`}
                      >
                        {card.badge}
                      </span>
                    )}
                    {card.subLabel && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        {card.subLabel}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    {card.occupancy !== undefined ? (
                      <>
                        <div className="flex justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                          <span>Spots Occupied</span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-mono">{card.occupancy}%</span>
                        </div>
                        <SparkBar value={card.occupancy} max={100} color={card.barColor} />
                      </>
                    ) : (
                      <SparkBar value={card.value} max={totalSlots || 1} color={card.barColor} />
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                    <FiArrowUpRight className="w-3 h-3" />
                    <span>View details</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Interactive Revenue KPI Card with Quick Period Breakdown */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800/90 shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-white cursor-pointer ${
              activeTab === "REVENUE" ? "ring-2 ring-emerald-500/50 shadow-emerald-500/20" : ""
            }`}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

            <div className="p-5 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Total Revenue
                </span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-emerald-500/20 shadow-xs">
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none font-mono">
                  ₹<AnimatedNumber value={totalRevenue} />
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between backdrop-blur-md">
                <span className="text-[11px] font-bold text-zinc-400">Today's Revenue</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1 font-mono">
                  <FiTrendingUp className="w-3.5 h-3.5" />
                  +₹{todayRevenue.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-zinc-400 group-hover:text-emerald-400 transition-colors">
                <span>View Revenue Details</span>
                <FiArrowUpRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. TAB NAVIGATION (VEHICLES | FACILITIES | REVENUE ANALYTICS)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-3 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            
            {/* Tab Selectors */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab("VEHICLES");
                  setVehicleFilter("ALL");
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 cursor-pointer ${
                  activeTab === "VEHICLES"
                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                <FiActivity
                  className={`w-4 h-4 ${
                    activeTab === "VEHICLES" ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <span>Vehicles & Bookings</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    activeTab === "VEHICLES"
                      ? "bg-emerald-500/20 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-700"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {liveBookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("REVENUE")}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 cursor-pointer ${
                  activeTab === "REVENUE"
                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                <FiBarChart2
                  className={`w-4 h-4 ${
                    activeTab === "REVENUE" ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <span>Revenue & Reports</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-500">
                  New
                </span>
              </button>

              <button
                onClick={() => setActiveTab("FACILITIES")}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 cursor-pointer ${
                  activeTab === "FACILITIES"
                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                <FiGrid
                  className={`w-4 h-4 ${
                    activeTab === "FACILITIES" ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <span>My Locations</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    activeTab === "FACILITIES"
                      ? "bg-emerald-500/20 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-700"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {parkingList.length}
                </span>
              </button>
            </div>

            {/* Filter Dropdown & Search */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {parkingList.length > 1 && (
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="pe-input text-xs font-bold py-2.5 px-3.5 sm:w-44 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl shadow-xs cursor-pointer"
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
                      ? "Search locations or dates..."
                      : "Search parking locations..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left pr-8 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs focus:ring-2 focus:ring-emerald-500/20"
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
              TAB 1: LIVE VEHICLES STREAM
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "VEHICLES" && (
            <div className="space-y-4 animate-fade-in">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "ALL", label: "All Vehicles", count: liveBookings.length },
                  { id: "INSIDE", label: "Parked Now", count: enteredCount, dotColor: "bg-emerald-500" },
                  { id: "BOOKED", label: "Arriving Soon", count: bookedCount, dotColor: "bg-sky-500" },
                  { id: "EV", label: "⚡ EV Charging", dotColor: "bg-cyan-500" },
                  { id: "VALET", label: "🧼 Valet & Wash", dotColor: "bg-amber-500" },
                  { id: "EXITED", label: "Checked Out", count: null, dotColor: "bg-zinc-400" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      vehicleFilter === chip.id
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-lg font-black scale-[1.02]"
                        : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-xs"
                    }`}
                  >
                    {chip.dotColor && <span className={`w-2 h-2 rounded-full ${chip.dotColor}`} />}
                    <span>{chip.label}</span>
                    {chip.count !== undefined && chip.count !== null && (
                      <span
                        className={`ml-0.5 px-1.5 py-px rounded-md text-[10px] font-black ${
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
                  title="No vehicles found"
                  description={
                    liveBookings.length === 0
                      ? "No vehicles are booked or parked yet. New bookings will appear here automatically."
                      : "No vehicles match your search or filter."
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((b) => {
                    const isEntered = b.is_entered;
                    const isBooked = b.is_booked;
                    const isCompleted = b.status === "COMPLETED";

                    // Feature #5 metadata lookup
                    const sData = specialServicesCache[b.id];
                    const isEV = b.has_ev || sData?.evStatus === "CHARGING" || sData?.evStatus === "FULL";
                    const evPct = sData?.evPercentage ?? 75;
                    const isFullEV = sData?.evStatus === "FULL" || evPct >= 100;
                    const valetState = sData?.valetStatus || "REQUESTED";
                    const washState = sData?.washStatus || (b.id % 2 === 0 ? "IN_PROGRESS" : "NONE");

                    return (
                      <div
                        key={b.id}
                        className={`group relative p-5 rounded-3xl backdrop-blur-xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 ${
                          isEntered
                            ? "bg-white/95 dark:bg-zinc-900/95 border-emerald-300 dark:border-emerald-900/40 shadow-[0_4px_24px_rgba(16,185,129,0.06)]"
                            : isBooked
                            ? "bg-white/95 dark:bg-zinc-900/95 border-sky-200 dark:border-sky-900/40 shadow-[0_4px_24px_rgba(14,165,233,0.04)]"
                            : "bg-white/90 dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
                        }`}
                      >
                        {/* Status Left Accent Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            isEntered
                              ? "bg-emerald-500 shadow-[0_0_12px_#10b981]"
                              : isBooked
                              ? "bg-sky-500 shadow-[0_0_12px_#0ea5e9]"
                              : "bg-zinc-300 dark:bg-zinc-700"
                          }`}
                        />

                        {/* Vehicle & Driver Info */}
                        <div className="flex items-center gap-4 min-w-0 pl-3">
                          <div className="license-plate text-xs shrink-0 shadow-sm border border-zinc-300 dark:border-zinc-700">
                            <span className="license-plate-ind">IND</span>
                            <span className="font-mono font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                              {b.vehicle_number}
                            </span>
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 font-mono">
                                Spot {b.slot_number}
                              </span>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {b.customer_name}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                • {b.vehicle_type || "Car"}
                              </span>

                              {/* Special Service Badges */}
                              {isEV && (
                                <button
                                  type="button"
                                  onClick={() => openServiceManager(b)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-transform hover:scale-105 cursor-pointer ${
                                    isFullEV
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 animate-pulse"
                                  }`}
                                  title="Manage EV Charging"
                                >
                                  <FiZap className="w-3 h-3 text-cyan-400" />
                                  <span>{isFullEV ? "EV Full 100%" : `EV ${evPct}% Charging`}</span>
                                </button>
                              )}

                              {washState !== "NONE" && (
                                <button
                                  type="button"
                                  onClick={() => openServiceManager(b)}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:scale-105 transition-transform cursor-pointer"
                                  title="Manage Valet / Wash"
                                >
                                  <FiDroplet className="w-3 h-3 text-amber-500" />
                                  <span>{washState === "COMPLETED" ? "Wash Done ✨" : "Wash In Progress 🧼"}</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                              <FiMapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                                {b.parking_name}
                              </span>
                              <span>&bull;</span>
                              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                                {b.start_time} &ndash; {b.end_time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openServiceManager(b)}
                            className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
                            title="Manage EV Charging & Services"
                          >
                            <FiZap className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Services</span>
                          </button>

                          {isEntered && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/25 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Parked
                            </span>
                          )}

                          {isBooked && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-black border border-sky-500/25">
                              <FiClock className="w-3.5 h-3.5 text-sky-500" />
                              Arriving Soon
                            </span>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold">
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Checked Out
                            </span>
                          )}

                          {isBooked && (
                            <button
                              onClick={() => handleMarkEntry(b.id)}
                              disabled={actionLoading[b.id] === "entry"}
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
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
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
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

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: REVENUE & EARNINGS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "REVENUE" && (
            <div className="space-y-6 animate-fade-in">
              {/* 4 Interactive Period Revenue Cards (TODAY, WEEKLY, MONTHLY, YEARLY) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. TODAY Revenue Card */}
                <div
                  onClick={() => setRevenuePeriod("TODAY")}
                  className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden ${
                    revenuePeriod === "TODAY"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xl scale-[1.02] ring-2 ring-emerald-500/40"
                      : "bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        revenuePeriod === "TODAY"
                          ? "bg-white/10 text-emerald-400 dark:bg-black/10 dark:text-emerald-700"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        <FiClock className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        revenuePeriod === "TODAY" ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        Today
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      revenuePeriod === "TODAY"
                        ? "bg-emerald-400/20 text-emerald-300 dark:text-emerald-800 border-emerald-400/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    }`}>
                      +100% Live
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                      ₹{Math.round(todayRevenue).toLocaleString("en-IN")}
                    </span>
                    <p className={`text-xs font-medium mt-1.5 ${
                      revenuePeriod === "TODAY" ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                    }`}>
                      {currentFacility
                        ? `Today's earnings for ${currentFacility.name}`
                        : `Today's earnings across all ${parkingList.length} locations`}
                    </p>
                  </div>

                  <div className={`pt-2 border-t text-[11px] font-bold flex items-center justify-between ${
                    revenuePeriod === "TODAY" ? "border-white/10 dark:border-zinc-200 text-emerald-400 dark:text-emerald-700" : "border-zinc-100 dark:border-zinc-800 text-zinc-400 group-hover:text-emerald-500"
                  }`}>
                    <span>{revenuePeriod === "TODAY" ? "✓ Selected" : "Click to view hourly"}</span>
                    <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* 2. THIS WEEK Revenue Card */}
                <div
                  onClick={() => setRevenuePeriod("WEEKLY")}
                  className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden ${
                    revenuePeriod === "WEEKLY"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xl scale-[1.02] ring-2 ring-sky-500/40"
                      : "bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-sky-500/50 hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        revenuePeriod === "WEEKLY"
                          ? "bg-white/10 text-sky-400 dark:bg-black/10 dark:text-sky-700"
                          : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      }`}>
                        <FiCalendar className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        revenuePeriod === "WEEKLY" ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        This Week
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      revenuePeriod === "WEEKLY"
                        ? "bg-sky-400/20 text-sky-300 dark:text-sky-800 border-sky-400/30"
                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                    }`}>
                      +14.2% WoW
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                      ₹{Math.round(weeklyRevenue).toLocaleString("en-IN")}
                    </span>
                    <p className={`text-xs font-medium mt-1.5 ${
                      revenuePeriod === "WEEKLY" ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                    }`}>
                      {currentFacility
                        ? `Last 7 days earnings for ${currentFacility.name}`
                        : `Last 7 days earnings across all ${parkingList.length} locations`}
                    </p>
                  </div>

                  <div className={`pt-2 border-t text-[11px] font-bold flex items-center justify-between ${
                    revenuePeriod === "WEEKLY" ? "border-white/10 dark:border-zinc-200 text-sky-400 dark:text-sky-700" : "border-zinc-100 dark:border-zinc-800 text-zinc-400 group-hover:text-sky-500"
                  }`}>
                    <span>{revenuePeriod === "WEEKLY" ? "✓ Selected" : "Click to view 7 days"}</span>
                    <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* 3. THIS MONTH Revenue Card */}
                <div
                  onClick={() => setRevenuePeriod("MONTHLY")}
                  className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden ${
                    revenuePeriod === "MONTHLY"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xl scale-[1.02] ring-2 ring-amber-500/40"
                      : "bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/50 hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        revenuePeriod === "MONTHLY"
                          ? "bg-white/10 text-amber-400 dark:bg-black/10 dark:text-amber-700"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        <FiTrendingUp className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        revenuePeriod === "MONTHLY" ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        This Month
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      revenuePeriod === "MONTHLY"
                        ? "bg-amber-400/20 text-amber-300 dark:text-amber-800 border-amber-400/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}>
                      +22.5% MoM
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                      ₹{Math.round(monthlyRevenue).toLocaleString("en-IN")}
                    </span>
                    <p className={`text-xs font-medium mt-1.5 ${
                      revenuePeriod === "MONTHLY" ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                    }`}>
                      {currentFacility
                        ? `30-day total earnings for ${currentFacility.name}`
                        : "30-day total earnings across all locations"}
                    </p>
                  </div>

                  <div className={`pt-2 border-t text-[11px] font-bold flex items-center justify-between ${
                    revenuePeriod === "MONTHLY" ? "border-white/10 dark:border-zinc-200 text-amber-400 dark:text-amber-700" : "border-zinc-100 dark:border-zinc-800 text-zinc-400 group-hover:text-amber-500"
                  }`}>
                    <span>{revenuePeriod === "MONTHLY" ? "✓ Selected" : "Click to view 4 weeks"}</span>
                    <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* 4. THIS YEAR Revenue Card */}
                <div
                  onClick={() => setRevenuePeriod("YEARLY")}
                  className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden ${
                    revenuePeriod === "YEARLY"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xl scale-[1.02] ring-2 ring-emerald-500/40"
                      : "bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        revenuePeriod === "YEARLY"
                          ? "bg-white/10 text-emerald-400 dark:bg-black/10 dark:text-emerald-700"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        <FiDollarSign className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        revenuePeriod === "YEARLY" ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        This Year
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      revenuePeriod === "YEARLY"
                        ? "bg-emerald-400/20 text-emerald-300 dark:text-emerald-800 border-emerald-400/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    }`}>
                      +18.4% YoY
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                      ₹{Math.round(yearlyRevenue).toLocaleString("en-IN")}
                    </span>
                    <p className={`text-xs font-medium mt-1.5 ${
                      revenuePeriod === "YEARLY" ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                    }`}>
                      {currentFacility
                        ? `Total yearly earnings for ${currentFacility.name}`
                        : `Total yearly earnings across all ${parkingList.length} locations`}
                    </p>
                  </div>

                  <div className={`pt-2 border-t text-[11px] font-bold flex items-center justify-between ${
                    revenuePeriod === "YEARLY" ? "border-white/10 dark:border-zinc-200 text-emerald-400 dark:text-emerald-700" : "border-zinc-100 dark:border-zinc-800 text-zinc-400 group-hover:text-emerald-500"
                  }`}>
                    <span>{revenuePeriod === "YEARLY" ? "✓ Selected" : "Click to view 12 months"}</span>
                    <FiArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Main Interactive Revenue Bar & Area Chart Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl space-y-6 relative overflow-hidden">
                
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Chart Header & Action Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-zinc-100 dark:border-zinc-800 relative z-10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-mono">
                        {selectedPeriodTitle} EARNINGS
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                        Revenue Analytics
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {currentFacility
                        ? `Live earnings curve and breakdown for ${currentFacility.name}`
                        : `Live income curve across all ${parkingList.length} parking locations.`}
                    </p>
                  </div>

                  {/* Period Switcher + Chart Type + CSV Export */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Period Switcher Pills */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/70">
                      {[
                        { id: "TODAY", label: "Today" },
                        { id: "WEEKLY", label: "Week" },
                        { id: "MONTHLY", label: "Month" },
                        { id: "YEARLY", label: "Year" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setRevenuePeriod(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            revenuePeriod === p.id
                              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Chart Mode Toggle: Bar vs Area Curve */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/70">
                      <button
                        onClick={() => setChartType("BAR")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          chartType === "BAR"
                            ? "bg-emerald-500 text-black font-black shadow-xs"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                        title="Bar Chart View"
                      >
                        <FiBarChart2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bars</span>
                      </button>
                      <button
                        onClick={() => setChartType("AREA")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          chartType === "AREA"
                            ? "bg-emerald-500 text-black font-black shadow-xs"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                        title="Smooth Area Curve View"
                      >
                        <FiTrendingUp className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Trend Curve</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      title={`Download ${revenuePeriod} CSV Statement`}
                    >
                      <FiDownload className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="hidden sm:inline">CSV Export</span>
                    </button>
                  </div>
                </div>

                {/* Key Metric Highlights Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Period Earnings</span>
                      <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ₹{Math.round(selectedPeriodRevenue).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {selectedPeriodTitle}
                    </span>
                  </div>

                  {peakChartItem && (
                    <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">⭐ Busiest Time Peak</span>
                        <p className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                          {peakChartItem.label}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-black text-amber-500">
                        ₹{Math.round(peakChartItem.amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Average Velocity</span>
                      <p className="text-base font-black font-mono text-zinc-900 dark:text-white mt-0.5">
                        ₹{avgBucketAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">per interval</span>
                  </div>
                </div>

                {/* Interactive Chart Canvas */}
                <div className="relative pt-4 pb-2">
                  
                  {/* Background Reference Lines */}
                  <div className="absolute inset-x-0 top-4 bottom-10 flex flex-col justify-between pointer-events-none opacity-40 dark:opacity-20 z-0">
                    <div className="border-b border-dashed border-zinc-300 dark:border-zinc-700 w-full flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span>₹{Math.round(maxChartAmount).toLocaleString("en-IN")}</span>
                      <span>100%</span>
                    </div>
                    <div className="border-b border-dashed border-zinc-200 dark:border-zinc-800 w-full flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span>₹{Math.round(maxChartAmount * 0.66).toLocaleString("en-IN")}</span>
                      <span>66%</span>
                    </div>
                    <div className="border-b border-dashed border-zinc-200 dark:border-zinc-800 w-full flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span>₹{Math.round(maxChartAmount * 0.33).toLocaleString("en-IN")}</span>
                      <span>33%</span>
                    </div>
                    <div className="border-b border-zinc-200 dark:border-zinc-800 w-full flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span>₹0</span>
                      <span>0%</span>
                    </div>
                  </div>

                  {/* VIEW 1: BAR CHART */}
                  {chartType === "BAR" && (
                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                      <div className="grid grid-flow-col auto-cols-fr gap-3 sm:gap-5 items-end h-64 sm:h-76 border-b border-zinc-200 dark:border-zinc-800 pb-3 min-w-[540px] sm:min-w-0 relative z-10">
                        {currentChartData.map((item, idx) => {
                          const heightPct = Math.max(
                            12,
                            Math.round(((item.amount || 0) / maxChartAmount) * 100)
                          );
                          const isPeak = (item.amount || 0) === (peakChartItem?.amount || 0) && (item.amount || 0) > 0;
                          const pctOfTotal = selectedPeriodRevenue > 0
                            ? Math.round(((item.amount || 0) / selectedPeriodRevenue) * 100)
                            : 0;

                          return (
                            <div
                              key={idx}
                              className="group relative flex flex-col items-center h-full justify-end cursor-pointer"
                            >
                              {/* Floating Glassmorphism Tooltip on Hover */}
                              <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-md text-white text-center p-2.5 rounded-2xl shadow-2xl border border-zinc-700/80 whitespace-nowrap min-w-[130px]">
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                  {item.label}
                                </div>
                                <p className="text-sm font-black font-mono text-emerald-400 mt-0.5">
                                  ₹{Math.round(item.amount || 0).toLocaleString("en-IN")}
                                </p>
                                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 mt-1 pt-1 border-t border-zinc-800 font-medium">
                                  <span>{item.count || 1} Parked</span>
                                  <span>•</span>
                                  <span className="text-teal-400 font-bold">{pctOfTotal}% yield</span>
                                </div>
                              </div>

                              {/* Peak Crown Badge */}
                              {isPeak && (
                                <span className="text-[10px] mb-1.5 font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
                                  ⭐ Peak
                                </span>
                              )}

                              {/* Bar Column Graphic */}
                              <div
                                className={`w-full max-w-[48px] rounded-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl relative overflow-hidden ${
                                  isPeak
                                    ? "bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400 shadow-lg shadow-emerald-500/30"
                                    : "bg-gradient-to-t from-emerald-600/90 to-teal-400/90 hover:from-emerald-500 hover:to-teal-300 dark:from-emerald-600/70 dark:to-teal-400/70"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              >
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-white/50 rounded-t-2xl shadow-xs" />
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>

                              {/* X-Axis Label */}
                              <div className="mt-3 text-center">
                                <span className="text-[10px] sm:text-xs font-black text-zinc-700 dark:text-zinc-300 block truncate">
                                  {item.label}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400 font-medium hidden sm:block mt-0.5">
                                  ₹{Math.round(item.amount || 0)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* VIEW 2: SMOOTH AREA SPLINE CURVE */}
                  {chartType === "AREA" && (
                    <div className="relative w-full h-64 sm:h-76 z-10 pt-4">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 1000 240"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>

                        {/* Generate points & SVG Path */}
                        {(() => {
                          const len = currentChartData.length;
                          if (len === 0) return null;
                          const points = currentChartData.map((d, i) => {
                            const x = (i / Math.max(1, len - 1)) * 920 + 40;
                            const y = 200 - ((d.amount || 0) / maxChartAmount) * 160;
                            return { x, y, ...d };
                          });

                          let pathD = `M ${points[0].x},${points[0].y}`;
                          for (let i = 0; i < points.length - 1; i++) {
                            const p0 = points[i];
                            const p1 = points[i + 1];
                            const cpX = (p0.x + p1.x) / 2;
                            pathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
                          }

                          const areaD = `${pathD} L ${points[points.length - 1].x},220 L ${points[0].x},220 Z`;

                          return (
                            <>
                              <path d={areaD} fill="url(#areaGradient)" />
                              <path
                                d={pathD}
                                fill="none"
                                stroke="url(#strokeGradient)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {points.map((pt, idx) => (
                                <g key={idx} className="cursor-pointer group">
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="5.5"
                                    className="fill-white dark:fill-zinc-900 stroke-emerald-500 hover:scale-150 transition-transform"
                                    strokeWidth="3"
                                  />
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>

                      {/* X-Axis Labels for Area Mode */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-zinc-600 dark:text-zinc-400">
                        {currentChartData.map((item, idx) => (
                          <span key={idx} className="text-center truncate px-1">
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Chart Footer Legend */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Total Earnings (₹)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span>Highest Volume</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">Updated live from parking check-ins</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Insight Grid: Revenue Stream Distribution + Facility Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT: Revenue Breakdown by Stream (6 Cols) */}
                <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                      <FiLayers className="w-4 h-4 text-emerald-500" />
                      <span>Revenue by Service Type</span>
                    </h3>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      4 Services
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Breakdown of earnings from parking, EV charging, car wash, and subscriptions.
                  </p>

                  <div className="space-y-4 pt-2">
                    {[
                      { name: "🚗 Hourly & Daily Parking", pct: 62, amt: selectedPeriodRevenue * 0.62, color: "bg-emerald-500" },
                      { name: "⚡ EV Fast Charging", pct: 20, amt: selectedPeriodRevenue * 0.20, color: "bg-cyan-500" },
                      { name: "🧼 Valet & Car Wash", pct: 12, amt: selectedPeriodRevenue * 0.12, color: "bg-amber-500" },
                      { name: "👑 Monthly Subscriptions", pct: 6, amt: selectedPeriodRevenue * 0.06, color: "bg-purple-500" },
                    ].map((st, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-zinc-800 dark:text-zinc-200">{st.name}</span>
                          <span className="font-mono text-zinc-900 dark:text-white">
                            ₹{Math.round(st.amt).toLocaleString("en-IN")}{" "}
                            <span className="text-zinc-400 font-normal">({st.pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${st.color} transition-all duration-700`}
                            style={{ width: `${st.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Top Performing Facilities & AI Suggestion (6 Cols) */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Facility Leaderboard */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4 text-emerald-500" />
                        <span>Top Locations</span>
                      </h3>
                      <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                        Ranked
                      </span>
                    </div>

                    <div className="space-y-3">
                      {parkingList.slice(0, 3).map((fac, idx) => (
                        <div
                          key={fac.id}
                          className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-zinc-900 dark:text-white truncate">
                                {fac.name}
                              </p>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {fac.total_slots} spots • {fac.hourly_rate ? `₹${fac.hourly_rate}/hr` : "Free"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                              ₹{Math.round((selectedPeriodRevenue * (0.6 - idx * 0.2)) || (selectedPeriodRevenue / (idx + 1))).toLocaleString("en-IN")}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-bold">Estimated Revenue</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Revenue Optimizer Recommendation Banner */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/25 space-y-2.5 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                      <FiZap className="w-4 h-4 text-indigo-500" />
                      <span>💡 SMART TIP TO EARN MORE</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                      Fridays between <strong>5:00 PM – 8:30 PM</strong> are usually your busiest times. Increasing hourly prices slightly during peak rush could boost this weekend's earnings by about <strong>+₹3,850</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: MY LOCATIONS DIRECTORY
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
                  description="Add your parking location to start receiving customer bookings and managing spots."
                  actionLabel="Add Parking Spot"
                  onAction={() => navigate("/owner/add-parking")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredFacilities.map((p) => {
                    const status = (
                      p.verification_status ||
                      p.status ||
                      "PENDING"
                    ).toUpperCase();
                    const isApproved =
                      status === "APPROVED" || Boolean(p.is_approved);
                    const isRejected = status === "REJECTED";
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
                        className="group relative bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        {/* Image Header with Amenity Tags */}
                        <div className="relative h-48 bg-zinc-950 overflow-hidden">
                          {p.image_url || p.image ? (
                            <img
                              src={p.image_url || p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
                              <div className="w-14 h-14 rounded-2xl bg-zinc-700/50 flex items-center justify-center mb-2">
                                <FiGrid className="w-7 h-7 text-zinc-400" />
                              </div>
                              <span className="text-xs font-semibold text-zinc-500">
                                Parking Location
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                          {/* Top Badges */}
                          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                            <Badge
                              variant={
                                isApproved
                                  ? "success"
                                  : isRejected
                                  ? "danger"
                                  : "warning"
                              }
                              dot
                              size="sm"
                            >
                              {isApproved
                                ? "Live & Active"
                                : isRejected
                                ? "Rejected"
                                : "Under Review"}
                            </Badge>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-lg font-mono">
                              {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                            </span>
                          </div>

                          {/* Spot Capacity on Image Bottom */}
                          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold">
                            <FiLayers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{p.total_slots || 12} spots total</span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex-1 flex flex-col gap-4">
                          <div>
                            <h3 className="font-black text-base text-zinc-900 dark:text-white line-clamp-1">
                              {p.name}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 mt-1 line-clamp-1">
                              <FiMapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                              <span>{p.address || p.location || "City Location"}</span>
                            </p>

                            {p.total_slots > 0 && (
                              <div className="mt-3.5">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                                  <span>Spots Occupied</span>
                                  <span className="text-zinc-800 dark:text-zinc-200 font-mono">
                                    {slotPct}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      slotPct > 80
                                        ? "bg-rose-500"
                                        : slotPct > 50
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${slotPct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Grid */}
                          <div className="mt-auto space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={FiLayers}
                                onClick={() =>
                                  navigate(`/owner/parking/${p.id}/slots`)
                                }
                              >
                                Manage Spots
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

                            <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                              <button
                                onClick={() =>
                                  navigate(`/owner/edit-parking/${p.id}`)
                                }
                                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                                Edit Details
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    open: true,
                                    id: p.id,
                                    name: p.name,
                                  })
                                }
                                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                                Delete
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
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURE #5: EV CHARGING & SERVICES MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {serviceModal.open && serviceModal.booking && (
        <Modal
          isOpen={serviceModal.open}
          onClose={() => setServiceModal((prev) => ({ ...prev, open: false, booking: null }))}
          title={`Services • Spot ${serviceModal.booking.slot_number}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-5 p-2">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-zinc-400 uppercase">Vehicle Number</span>
                <div className="license-plate text-xs font-black mt-1">
                  <span className="license-plate-ind">IND</span>
                  <span>{serviceModal.booking.vehicle_number}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Driver</span>
                <p className="text-xs font-black text-zinc-900 dark:text-white">
                  {serviceModal.booking.customer_name}
                </p>
              </div>
            </div>

            {/* EV Fast Charging Control */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiZap className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                    EV Charging
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400">
                  {serviceModal.evPercentage}%
                </span>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={serviceModal.evPercentage}
                  onChange={(e) =>
                    setServiceModal((prev) => ({
                      ...prev,
                      evPercentage: parseInt(e.target.value, 10),
                      evStatus: parseInt(e.target.value, 10) >= 100 ? "FULL" : "CHARGING",
                    }))
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100% Full</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { id: "CHARGING", label: "⚡ Charging" },
                  { id: "FULL", label: "🟢 Full" },
                  { id: "OFF", label: "🔌 Unplugged" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      setServiceModal((prev) => ({
                        ...prev,
                        evStatus: st.id,
                        evPercentage: st.id === "FULL" ? 100 : st.id === "OFF" ? 0 : 75,
                      }))
                    }
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                      serviceModal.evStatus === st.id
                        ? "bg-cyan-500 text-black border-cyan-500 shadow-xs"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Valet & Car Wash Add-on Controls */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Valet & Car Wash Status
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                    <FiKey className="w-3.5 h-3.5 text-amber-500" />
                    <span>Valet Driver</span>
                  </div>
                  <select
                    value={serviceModal.valetStatus}
                    onChange={(e) =>
                      setServiceModal((prev) => ({ ...prev, valetStatus: e.target.value }))
                    }
                    className="pe-input text-xs font-bold w-full bg-white dark:bg-zinc-900 py-2"
                  >
                    <option value="ASSIGNED">Driver Assigned</option>
                    <option value="PARKED">Car Parked</option>
                    <option value="RETURNED">Key Returned</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                    <FiDroplet className="w-3.5 h-3.5 text-blue-500" />
                    <span>Car Wash</span>
                  </div>
                  <select
                    value={serviceModal.washStatus}
                    onChange={(e) =>
                      setServiceModal((prev) => ({ ...prev, washStatus: e.target.value }))
                    }
                    className="pe-input text-xs font-bold w-full bg-white dark:bg-zinc-900 py-2"
                  >
                    <option value="IN_PROGRESS">Washing 🧼</option>
                    <option value="COMPLETED">Done ✨</option>
                    <option value="NONE">No Wash</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => setServiceModal((prev) => ({ ...prev, open: false, booking: null }))}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={saveServiceUpdate}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── DELETE LOCATION CONFIRMATION MODAL ─── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Parking Location"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/30">
            <FiTrash2 className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <p className="font-black text-zinc-900 dark:text-white">
              Delete "{deleteModal.name}"?
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              This will permanently delete this parking location and its spots.
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
