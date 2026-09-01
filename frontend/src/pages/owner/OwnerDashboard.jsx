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
  FiList,
  FiNavigation,
  FiAward,
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

/* ─── Gradient Progress Bar ───────────────────────────────────────────── */
function GradientProgressBar({ value, max, colorClass = "from-emerald-500 to-teal-400" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden p-0.5">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 shadow-xs`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — CREATIVE & MODERN OWNER DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // User details from localStorage
  const [userName, setUserName] = useState("Partner");
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
  // Vehicles View Mode: 'MATRIX' (2D Bay Grid) | 'LIST'
  const [vehicleViewMode, setVehicleViewMode] = useState("MATRIX");
  const [vehicleFilter, setVehicleFilter] = useState("ALL"); // 'ALL' | 'INSIDE' | 'BOOKED' | 'EXITED'
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  // Revenue analytics period & chart mode
  const [revenuePeriod, setRevenuePeriod] = useState("TODAY"); // 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  const [chartType, setChartType] = useState("BAR"); // 'BAR' | 'AREA'

  // Selected Booking Drawer/Modal for instant inspection
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

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

  // Live Clock
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      if (selectedBookingDetail?.id === bookingId) {
        setSelectedBookingDetail((p) => (p ? { ...p, is_entered: true, is_booked: false } : null));
      }
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
      if (selectedBookingDetail?.id === bookingId) {
        setSelectedBookingDetail((p) => (p ? { ...p, is_entered: false, status: "COMPLETED" } : null));
      }
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

  /* Synthesized 2D Parking Matrix Bays */
  const parkingBayMatrix = useMemo(() => {
    const totalCount = Math.max(totalSlots, liveBookings.length, 12);
    const slotsMap = {};
    
    // Map active bookings to slot numbers
    liveBookings.forEach((b) => {
      const slotNum = b.slot_number || 1;
      slotsMap[slotNum] = b;
    });

    const bays = [];
    for (let i = 1; i <= Math.min(totalCount, 30); i++) {
      const activeBooking = slotsMap[i];
      bays.push({
        slotNumber: i,
        booking: activeBooking || null,
        isOccupied: Boolean(activeBooking?.is_entered),
        isReserved: Boolean(activeBooking?.is_booked),
        isEV: (i % 5 === 0), // highlight EV spots
        vehicleType: activeBooking?.vehicle_type || (i % 6 === 0 ? "Bike" : "Car"),
      });
    }
    return bays;
  }, [totalSlots, liveBookings]);

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

  const isFirstTimeOwner = parkingList.length === 0;

  // Milestone checklist progress computation
  const setupMilestones = useMemo(() => {
    const hasLocations = parkingList.length > 0;
    const hasSlots = parkingList.some((p) => Number(p.total_slots) > 0);
    const hasBookings = liveBookings.length > 0 || todayRevenue > 0;
    const count = (hasLocations ? 1 : 0) + (hasSlots ? 1 : 0) + (hasBookings ? 1 : 0);
    const pct = Math.round((count / 3) * 100);
    return { hasLocations, hasSlots, hasBookings, count, pct };
  }, [parkingList, liveBookings, todayRevenue]);

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#07070a] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* Background Ambient Lighting Mesh */}
      <div className="fixed top-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[-100px] w-[500px] h-[500px] rounded-full bg-sky-500/8 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-50px] left-[20%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">

        {/* ══════════════════════════════════════════════════════════════════
            1. CREATIVE COMMAND CENTER HEADER (PREMIUM GLASSERA)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white p-6 sm:p-8 border border-zinc-800/90 shadow-2xl">
          
          {/* Subtle Cyber Grid Background Overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              
              {/* Live Operation Status Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-wide backdrop-blur-md shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>LIVE OPERATIONS CONSOLE</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-300 text-xs font-semibold backdrop-blur-md">
                  <FiClock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{currentTime || "IST"}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-300 text-xs font-semibold backdrop-blur-md">
                  <FiRadio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{parkingList.length} {parkingList.length === 1 ? "Hub Active" : "Hubs Active"}</span>
                </div>
              </div>

              {/* Greeting & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {greeting}, {userName}! 👋
                </h1>
                <p className="mt-1.5 text-zinc-300 text-xs sm:text-sm font-medium leading-relaxed">
                  {isFirstTimeOwner
                    ? "Welcome to your parking hub. Follow the setup milestones below to list your spots and start receiving drivers."
                    : `You have ${enteredCount} vehicles parked inside, ${bookedCount} expected soon, and ₹${todayRevenue.toLocaleString("en-IN")} earned today.`}
                </p>
              </div>

              {/* Quick Operation Tags */}
              {!isFirstTimeOwner && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-zinc-200 text-xs font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {availableSlots} Spots Available
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-zinc-200 text-xs font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    {liveBookings.length} Active Bookings
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-zinc-200 text-xs font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    ₹{monthlyRevenue.toLocaleString("en-IN")} This Month
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Dock */}
            <div className="flex items-center gap-3 flex-wrap shrink-0">
              <button
                onClick={() => loadOwnerData(true)}
                disabled={refreshing}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95 shadow-md cursor-pointer group"
                title="Refresh Live Data"
              >
                <FiRefreshCw
                  className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${
                    refreshing ? "animate-spin text-emerald-400" : ""
                  }`}
                />
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <FiHelpCircle className="w-4 h-4 text-emerald-400" />
                <span>How It Works</span>
              </button>

              <button
                onClick={() => navigate("/owner/scan-qr")}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <FiCamera className="w-4 h-4 stroke-[2.5]" />
                <span>Scan Driver QR</span>
              </button>

              <button
                onClick={() => navigate("/owner/add-parking")}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <FiPlus className="w-4 h-4 stroke-[3] text-emerald-600" />
                <span>+ Add Location</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. GAMIFIED GETTING STARTED CHECKLIST / MILESTONES
        ══════════════════════════════════════════════════════════════════ */}
        {(!guideDismissed || isFirstTimeOwner) && (
          <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/20">
                  🚀
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                      Owner Launch Checklist
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {setupMilestones.pct}% Completed
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Complete these 3 simple milestones to start accepting paid bookings effortlessly.
                  </p>
                </div>
              </div>

              {!isFirstTimeOwner && (
                <button
                  onClick={handleDismissGuide}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Hide Guide
                </button>
              )}
            </div>

            {/* Overall Progress Meter */}
            <GradientProgressBar value={setupMilestones.count} max={3} colorClass="from-emerald-500 via-teal-400 to-sky-500" />

            {/* 3 Step Interactive Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {/* Step 1: Add Parking Space */}
              <div
                onClick={() => navigate("/owner/add-parking")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                  setupMilestones.hasLocations
                    ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30"
                    : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500/50"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                      Step 1 • Location
                    </span>
                    {setupMilestones.hasLocations ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                        <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        Action Required
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                    Add Your Parking Space
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Set up your location name, street address, and hourly parking rate.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{setupMilestones.hasLocations ? "Manage Location" : "+ Add Location"}</span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Step 2: Configure Slots */}
              <div
                onClick={() => {
                  if (parkingList.length > 0) {
                    navigate(`/owner/parking/${parkingList[0].id}/slots`);
                  } else {
                    navigate("/owner/add-parking");
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                  setupMilestones.hasSlots
                    ? "bg-sky-500/5 dark:bg-sky-950/20 border-sky-500/30"
                    : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 hover:border-sky-500/50"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                      Step 2 • Slots
                    </span>
                    {setupMilestones.hasSlots ? (
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">
                        <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-500">
                        Next Up
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white group-hover:text-sky-500 transition-colors">
                    Configure Slots & Bays
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Set up Car, Bike, or EV Charging spots with specific bay numbers.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                  <span>Configure Slots</span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Step 3: Scan QR & Check In */}
              <div
                onClick={() => navigate("/owner/scan-qr")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                  setupMilestones.hasBookings
                    ? "bg-indigo-500/5 dark:bg-indigo-950/20 border-indigo-500/30"
                    : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-500/50"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                      Step 3 • Check In
                    </span>
                    {setupMilestones.hasBookings ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                        <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-500">
                        Ready
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    Check In Arriving Drivers
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Scan customer QR passes or tap "Check In" from the live stream.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Open Scanner</span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. 4 HIGH-GLOSS INTERACTIVE KPI METRICS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Available Spots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className="p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                Available Spots
              </span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                <AnimatedNumber value={availableSlots} />
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                / {totalSlots} total
              </span>
            </div>
            <div className="space-y-1.5 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                <span>Current Occupancy</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-mono">{occupancyPercent}%</span>
              </div>
              <GradientProgressBar value={enteredCount + bookedCount} max={totalSlots || 1} colorClass="from-indigo-500 to-sky-400" />
            </div>
          </div>

          {/* Card 2: Parked Inside */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-emerald-500 ring-2 ring-emerald-500/30"
                : "border-zinc-200/80 dark:border-zinc-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                Parked Inside
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <FiLogIn className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                <AnimatedNumber value={enteredCount} />
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Active
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <span>View live parked list</span>
              <FiArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Arriving Soon */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-sky-500 ring-2 ring-sky-500/30"
                : "border-zinc-200/80 dark:border-zinc-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                Arriving Soon
              </span>
              <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                <AnimatedNumber value={bookedCount} />
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                Incoming
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              <span>Ready for check-in</span>
              <FiArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Today's Revenue */}
          <div
            onClick={() => setActiveTab("REVENUE")}
            className={`p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${
              activeTab === "REVENUE"
                ? "border-amber-500 ring-2 ring-amber-500/30"
                : "border-zinc-200/80 dark:border-zinc-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                Today's Earnings
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                ₹<AnimatedNumber value={todayRevenue} />
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Total: ₹{totalRevenue.toLocaleString("en-IN")}</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>View stats</span>
                <FiChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            4. FACILITY CAPSULE SELECTOR (WHEN MULTIPLE HUBS EXIST)
        ══════════════════════════════════════════════════════════════════ */}
        {parkingList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedFacility("ALL")}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                selectedFacility === "ALL"
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md"
                  : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80"
              }`}
            >
              <span>✨ All Locations</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {totalSlots} spots
              </span>
            </button>

            {parkingList.map((p) => {
              const isSelected = String(selectedFacility) === String(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedFacility(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md"
                      : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400"
                  }`}
                >
                  <FiMapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {p.total_slots || 10} spots
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            5. MAIN WORKSPACE TABS & CONTROLS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Main Tab Bar + Global Search */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-3 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            
            {/* 3 Main View Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab("VEHICLES");
                  setVehicleFilter("ALL");
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  activeTab === "VEHICLES"
                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiTruck className="w-4 h-4 text-emerald-400" />
                <span>Live Parking</span>
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
                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiGrid className="w-4 h-4 text-indigo-400" />
                <span>My Locations</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === "FACILITIES"
                      ? "bg-indigo-500/20 text-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-700"
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
                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiBarChart2 className="w-4 h-4 text-amber-400" />
                <span>Revenue & Reports</span>
              </button>
            </div>

            {/* Search Input with Keyboard Shortcut '/' */}
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search plate, driver, spot... (Press '/')"
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

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: LIVE PARKING OPERATIONS (GRID MATRIX & STREAM)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "VEHICLES" && (
            <div className="space-y-4 animate-fade-in">
              {/* Filter Pills & Matrix/List View Mode Switcher */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
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
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black shadow-sm"
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

                {/* View Switcher: Interactive Bay Matrix vs Clean List */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/70">
                  <button
                    onClick={() => setVehicleViewMode("MATRIX")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      vehicleViewMode === "MATRIX"
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <FiGrid className="w-3.5 h-3.5" />
                    <span>Bay Grid</span>
                  </button>

                  <button
                    onClick={() => setVehicleViewMode("LIST")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      vehicleViewMode === "LIST"
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <FiList className="w-3.5 h-3.5" />
                    <span>List View</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filteredBookings.length === 0 && liveBookings.length === 0 ? (
                <EmptyState
                  icon={FiTruck}
                  title="No vehicles in your parking lot yet"
                  description={
                    isFirstTimeOwner
                      ? "You haven't added a parking lot yet. Click the button below to list your first parking space!"
                      : "When customers reserve spots or arrive at your gate, their vehicle plate and check-in buttons will appear here in real time."
                  }
                  actionLabel={isFirstTimeOwner ? "Add Parking Location" : "Scan Driver QR"}
                  onAction={isFirstTimeOwner ? () => navigate("/owner/add-parking") : () => navigate("/owner/scan-qr")}
                />
              ) : (
                <>
                  {/* VIEW MODE 1: INTERACTIVE VISUAL 2D PARKING BAY MATRIX */}
                  {vehicleViewMode === "MATRIX" && (
                    <div className="space-y-4">
                      {/* Matrix Legend */}
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 flex-wrap gap-2">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-600" />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Parked Inside</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-sky-500 border border-sky-600" />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Reserved Arrival</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700" />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Available Spot</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-zinc-400">
                          Tip: Tap any occupied spot to check in/out
                        </span>
                      </div>

                      {/* The Grid of Parking Bays */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {parkingBayMatrix.map((bay) => {
                          const b = bay.booking;
                          const isOccupied = bay.isOccupied;
                          const isReserved = bay.isReserved;
                          const isFree = !isOccupied && !isReserved;

                          return (
                            <div
                              key={bay.slotNumber}
                              onClick={() => {
                                if (b) setSelectedBookingDetail(b);
                              }}
                              className={`group relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-2 overflow-hidden cursor-pointer ${
                                isOccupied
                                  ? "bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
                                  : isReserved
                                  ? "bg-sky-500/10 dark:bg-sky-950/30 border-sky-500/40 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1"
                                  : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600"
                              }`}
                            >
                              {/* Spot Number Header */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                                  #{bay.slotNumber}
                                </span>

                                {bay.isEV && (
                                  <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5">
                                    <FiZap className="w-3 h-3" /> EV
                                  </span>
                                )}
                              </div>

                              {/* Bay Status / Plate */}
                              <div className="py-2 text-center">
                                {isOccupied ? (
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-black font-mono tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                                      {b?.vehicle_number || "PARKED"}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-semibold">
                                      {b?.customer_name || "Driver"}
                                    </div>
                                  </div>
                                ) : isReserved ? (
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-black font-mono tracking-wider text-sky-600 dark:text-sky-400 truncate">
                                      {b?.vehicle_number || "RESERVED"}
                                    </div>
                                    <div className="text-[10px] text-sky-500 truncate font-semibold">
                                      {b?.customer_name || "Incoming"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                                      AVAILABLE
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block font-medium">
                                      {bay.vehicleType}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Footer */}
                              <div className="pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[10px] font-bold">
                                {isOccupied ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkExit(b.id);
                                    }}
                                    disabled={actionLoading[b.id] === "exit"}
                                    className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black transition-all flex items-center justify-center gap-1 shadow-xs"
                                  >
                                    <FiLogOut className="w-3 h-3" />
                                    <span>{actionLoading[b.id] === "exit" ? "..." : "Check Out"}</span>
                                  </button>
                                ) : isReserved ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkEntry(b.id);
                                    }}
                                    disabled={actionLoading[b.id] === "entry"}
                                    className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all flex items-center justify-center gap-1 shadow-xs"
                                  >
                                    <FiLogIn className="w-3 h-3" />
                                    <span>{actionLoading[b.id] === "entry" ? "..." : "Check In"}</span>
                                  </button>
                                ) : (
                                  <span className="text-zinc-400 dark:text-zinc-500 text-center w-full">
                                    Free Bay
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* VIEW MODE 2: STREAMLINED CARDS LIST */}
                  {vehicleViewMode === "LIST" && (
                    <div className="space-y-3">
                      {filteredBookings.map((b) => {
                        const isEntered = b.is_entered;
                        const isBooked = b.is_booked;
                        const isCompleted = b.status === "COMPLETED";

                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBookingDetail(b)}
                            className={`p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-zinc-900/95 border backdrop-blur-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md cursor-pointer ${
                              isEntered
                                ? "border-emerald-300 dark:border-emerald-900/40"
                                : isBooked
                                ? "border-sky-300 dark:border-sky-900/40"
                                : "border-zinc-200/80 dark:border-zinc-800/80"
                            }`}
                          >
                            {/* Plate and Details */}
                            <div className="flex items-center gap-4 min-w-0">
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

                            {/* Status & 1-Click Action Buttons */}
                            <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
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
                </>
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
                  description="Add your first parking space to start listing spots and receiving customer bookings."
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
                        {/* Location Header Image */}
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

                        {/* Location Details */}
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
                                <GradientProgressBar value={p.booked_slots || 0} max={p.total_slots} colorClass="from-emerald-500 to-teal-400" />
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

                  {/* Add New Location Prompt Card */}
                  <div
                    onClick={() => navigate("/owner/add-parking")}
                    className="group border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-emerald-500/5 min-h-[280px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FiPlus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                      Add Another Location
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px]">
                      List another commercial lot, basement, or residential parking spot.
                    </p>
                  </div>
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
                              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black shadow-xs"
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
                    <span>Income Curve</span>
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

      {/* ─── QUICK BOOKING DETAIL INSPECTION DRAWER / MODAL ─── */}
      <Modal
        isOpen={Boolean(selectedBookingDetail)}
        onClose={() => setSelectedBookingDetail(null)}
        title="Vehicle & Booking Details"
        maxWidth="max-w-md"
      >
        {selectedBookingDetail && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
              <div className="license-plate text-sm shrink-0 border border-zinc-300 dark:border-zinc-700">
                <span className="license-plate-ind">IND</span>
                <span className="font-mono font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                  {selectedBookingDetail.vehicle_number}
                </span>
              </div>
              <span className="text-xs font-black font-mono px-3 py-1 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                Spot #{selectedBookingDetail.slot_number}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-bold">Driver Name</span>
                <span className="font-black text-zinc-900 dark:text-white">{selectedBookingDetail.customer_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-bold">Parking Hub</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{selectedBookingDetail.parking_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-bold">Scheduled Window</span>
                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {selectedBookingDetail.start_time} – {selectedBookingDetail.end_time}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-bold">Status</span>
                <span className="font-bold">
                  {selectedBookingDetail.is_entered ? (
                    <span className="text-emerald-500 font-black">Parked Inside</span>
                  ) : selectedBookingDetail.is_booked ? (
                    <span className="text-sky-500 font-black">Arriving Soon</span>
                  ) : (
                    <span className="text-zinc-400 font-black">Checked Out</span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {selectedBookingDetail.is_booked && (
                <Button
                  variant="primary"
                  className="w-full"
                  icon={FiLogIn}
                  loading={actionLoading[selectedBookingDetail.id] === "entry"}
                  onClick={() => handleMarkEntry(selectedBookingDetail.id)}
                >
                  Check In Vehicle
                </Button>
              )}

              {selectedBookingDetail.is_entered && (
                <Button
                  variant="danger"
                  className="w-full"
                  icon={FiLogOut}
                  loading={actionLoading[selectedBookingDetail.id] === "exit"}
                  onClick={() => handleMarkExit(selectedBookingDetail.id)}
                >
                  Check Out & Free Slot
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setSelectedBookingDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
