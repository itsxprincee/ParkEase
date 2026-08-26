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
   MAIN COMPONENT — OWNER DASHBOARD
═════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active View Tab: 'VEHICLES' | 'FACILITIES' | 'BAY_RADAR'
  const [activeTab, setActiveTab] = useState("VEHICLES");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Live IST Clock
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

  /* Computed Metrics */
  const totalSlots =
    dashboardData?.total_slots ??
    parkingList.reduce((a, c) => a + (Number(c.total_slots) || 0), 0);
  const enteredCount = dashboardData?.entered_count ?? 0;
  const bookedCount = dashboardData?.booked_count ?? 0;
  const availableSlots =
    dashboardData?.available_slots ??
    Math.max(0, totalSlots - enteredCount - bookedCount);
  const totalRevenue = dashboardData?.total_revenue ?? 0;
  const todayRevenue = dashboardData?.today_revenue ?? 0;
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
      label: "Free Available Bays",
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
      {/* Subtle Background Glow Orbs */}
      <div className="fixed top-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-[30%] right-[-100px] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-3xl pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO COMMAND BANNER — JET BLACK OBSIDIAN OPERATIONS HUD
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#0d0d12] to-black border border-zinc-800/90 shadow-[0_16px_50px_rgba(0,0,0,0.35)] text-white">
          {/* Subtle Grid Accent */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Top Laser Emerald Glow Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
          <div className="absolute top-0 right-1/4 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              
              {/* Live Gate HUD Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  </span>
                  <span>LIVE GATE SYSTEM ACTIVE</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-xs font-semibold backdrop-blur-md">
                  <FiCpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{currentTime || "IST"}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-xs font-semibold backdrop-blur-md">
                  <FiRadio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{parkingList.length} {parkingList.length === 1 ? "Hub" : "Hubs"} Sync</span>
                </div>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Facility Control Dashboard
                </h1>
                <p className="mt-1.5 text-zinc-400 text-sm font-medium leading-relaxed">
                  Real-time bay operations, fast automated check-in verification, and revenue flow.
                </p>
              </div>

              {/* Quick Summary Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-zinc-200 text-xs font-bold border border-white/[0.1] backdrop-blur-md">
                  <FiActivity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{liveBookings.length} Active Drivers</span>
                </span>
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-zinc-200 text-xs font-bold border border-white/[0.1] backdrop-blur-md">
                  <FiBarChart2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>{occupancyPercent}% Total Occupancy</span>
                </span>
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-zinc-200 text-xs font-bold border border-white/[0.1] backdrop-blur-md">
                  <FiTrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>+₹{todayRevenue.toLocaleString("en-IN")} Today</span>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                onClick={() => loadOwnerData(true)}
                disabled={refreshing}
                className="p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.12] text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md group"
                title="Refresh Live Data"
              >
                <FiRefreshCw
                  className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${
                    refreshing ? "animate-spin text-emerald-400" : ""
                  }`}
                />
              </button>

              <button
                onClick={() => navigate("/owner/scan-qr")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.15] text-white text-xs font-bold transition-all active:scale-95 shadow-md hover:border-zinc-500"
              >
                <FiCamera className="w-4 h-4 text-emerald-400" />
                <span>Scan QR Pass</span>
              </button>

              <button
                onClick={() => navigate("/owner/add-parking")}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                <FiPlus className="w-4 h-4 stroke-[3]" />
                <span>Add Facility</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. KPI METRICS CARDS + REVENUE STAT
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
                          <span>Occupancy Rate</span>
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
                    <span>Filter stream</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Revenue Card — Luxury Jet Black Finish */}
          <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800/90 shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-white">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

            <div className="p-5 sm:p-6 relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Total Earnings
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
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. TAB BAR & ADVANCED FILTER CONTROLS
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
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 ${
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
                <span>Live Vehicle Stream</span>
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
                onClick={() => setActiveTab("FACILITIES")}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 ${
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
                <span>Facility Directory</span>
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

            {/* Filter Dropdown & Search with Keyboard Shortcut */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {parkingList.length > 1 && (
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="pe-input text-xs font-bold py-2.5 px-3.5 sm:w-44 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl shadow-xs cursor-pointer"
                >
                  <option value="ALL">All Parking Hubs</option>
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
                      ? "Plate, driver, slot (Press '/' to search)"
                      : "Search parking facilities..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left pr-8 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs focus:ring-2 focus:ring-emerald-500/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
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
                  { id: "INSIDE", label: "Parked in Bay", count: enteredCount, dotColor: "bg-emerald-500" },
                  { id: "BOOKED", label: "Arriving Soon", count: bookedCount, dotColor: "bg-sky-500" },
                  { id: "EXITED", label: "Completed Exits", count: null, dotColor: "bg-zinc-400" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                      vehicleFilter === chip.id
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-lg font-black scale-[1.02]"
                        : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-xs"
                    }`}
                  >
                    {chip.dotColor && <span className={`w-2 h-2 rounded-full ${chip.dotColor}`} />}
                    <span>{chip.label}</span>
                    {chip.count !== null && (
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
                  title="No vehicle activity right now"
                  description={
                    liveBookings.length === 0
                      ? "No vehicles are booked or checked in yet. Real-time passes will appear here when drivers reserve spots."
                      : "No vehicles match the selected filter query."
                  }
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
                          {/* Realistic Indian License Plate */}
                          <div className="license-plate text-xs shrink-0 shadow-sm border border-zinc-300 dark:border-zinc-700">
                            <span className="license-plate-ind">IND</span>
                            <span className="font-mono font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                              {b.vehicle_number}
                            </span>
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                                Bay {b.slot_number}
                              </span>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {b.customer_name}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                • {b.vehicle_type || "Car"}
                              </span>
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

                        {/* Status + 1-Click Operational Action */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                          {isEntered && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/25 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Parked Inside Bay
                            </span>
                          )}

                          {isBooked && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-black border border-sky-500/25">
                              <FiClock className="w-3.5 h-3.5 text-sky-500" />
                              Reservation Active
                            </span>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold">
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Checked Out
                            </span>
                          )}

                          {/* Quick Check-In Trigger */}
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
                                  : "Gate Entry Check In"}
                              </span>
                            </button>
                          )}

                          {/* Quick Check-Out Trigger */}
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
                                  : "Free Bay & Check Out"}
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
              TAB 2: MY FACILITIES DIRECTORY
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
                  title="No parking hubs listed"
                  description="List your parking facility to start receiving automated bookings and digital pass verification."
                  actionLabel="Add Facility"
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
                                Parking Facility
                              </span>
                            </div>
                          )}

                          {/* Gradient Vignette */}
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
                                ? "Verification Rejected"
                                : "In Review"}
                            </Badge>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-lg font-mono">
                              {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                            </span>
                          </div>

                          {/* Bay Capacity on Image Bottom */}
                          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold">
                            <FiLayers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{p.total_slots || 12} bays total</span>
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
                              <span>{p.address || p.location || "City Hub"}</span>
                            </p>

                            {p.total_slots > 0 && (
                              <div className="mt-3.5">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                                  <span>Live Occupancy</span>
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
                                Manage Bays
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={FiCamera}
                                onClick={() => navigate("/owner/scan-qr")}
                              >
                                Gate Pass Scan
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
                                Edit Settings
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
                                Remove Hub
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

      {/* ─── DELETE FACILITY CONFIRMATION MODAL ─── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Remove Parking Facility"
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
              This will permanently remove the facility and all associated parking slot records from the live map.
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
              Delete Hub
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
