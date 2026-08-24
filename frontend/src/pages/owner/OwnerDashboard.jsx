import React, { useEffect, useState, useMemo } from "react";
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
  FiUser,
  FiArrowRight,
  FiCheck,
  FiTrendingUp,
  FiBarChart2,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-white dark:bg-zinc-900 text-[#e11900] border-red-200 dark:border-red-900/50"
            : "bg-white dark:bg-zinc-900 text-[#05944f] border-green-200 dark:border-green-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <FiAlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <FiCheckCircle className="w-4 h-4 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const { theme } = useTheme();

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active view: 'VEHICLES' (Live Gate Feed) | 'FACILITIES' | 'ANALYTICS'
  const [activeTab, setActiveTab] = useState("VEHICLES");
  const [vehicleFilter, setVehicleFilter] = useState("ALL"); // 'ALL' | 'INSIDE' | 'BOOKED' | 'EXITED'
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [search, setSearch] = useState("");

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

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
        API.get("/parking/owner/my-parking"),
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

  // Check in vehicle
  const handleMarkEntry = async (bookingId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: "entry" }));
      const res = await API.post(`/booking/entry/${bookingId}`);
      showToast(res.data?.message || "Vehicle checked in & marked as entered!", "success");
      loadOwnerData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to check in vehicle.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: null }));
    }
  };

  // Check out vehicle
  const handleMarkExit = async (bookingId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: "exit" }));
      const res = await API.post(`/booking/exit/${bookingId}`);
      showToast(res.data?.message || "Vehicle checked out & slot freed!", "success");
      loadOwnerData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to check out vehicle.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: null }));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleting(true);
      await API.delete(`/parking/owner/${deleteModal.id}`);
      showToast("Facility removed successfully.", "success");
      setDeleteModal({ open: false, id: null, name: "" });
      loadOwnerData(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to delete facility.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalSlots = dashboardData?.total_slots ?? parkingList.reduce((acc, curr) => acc + (Number(curr.total_slots) || 0), 0);
  const enteredCount = dashboardData?.entered_count ?? 0;
  const bookedCount = dashboardData?.booked_count ?? 0;
  const availableSlots = dashboardData?.available_slots ?? Math.max(0, totalSlots - enteredCount - bookedCount);
  const totalRevenue = dashboardData?.total_revenue ?? 0;
  const todayRevenue = dashboardData?.today_revenue ?? 0;
  const occupancyPercentage = totalSlots > 0 ? Math.round(((enteredCount + bookedCount) / totalSlots) * 100) : 0;

  // Filtered live vehicles feed
  const liveBookings = dashboardData?.live_bookings || [];
  const filteredBookings = useMemo(() => {
    return liveBookings.filter((b) => {
      if (selectedFacility !== "ALL" && String(b.parking_location_id) !== String(selectedFacility)) {
        return false;
      }
      if (vehicleFilter === "INSIDE" && !b.is_entered) return false;
      if (vehicleFilter === "BOOKED" && !b.is_booked) return false;
      if (vehicleFilter === "EXITED" && b.status !== "COMPLETED") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          b.customer_name?.toLowerCase().includes(q) ||
          b.vehicle_number?.toLowerCase().includes(q) ||
          b.parking_name?.toLowerCase().includes(q) ||
          b.slot_number?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [liveBookings, selectedFacility, vehicleFilter, search]);

  // Facilities list filter
  const filteredFacilities = useMemo(() => {
    return parkingList.filter((item) => {
      const q = search.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.address?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q)
      );
    });
  }, [parkingList, search]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ========================================================================= */}
        {/* SAAS TOP BAR & CONTROL CENTER                                             */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("systemOnline", "Live Gate Sync Active")}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden sm:inline">
                · {parkingList.length} {t("totalFacilities", "Active Facilities")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {t("dashboard", "Facility Operations Hub")}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {t("realtimeSync", "Real-time vehicle check-in verification, occupancy meters, and smart gate controls.")}
            </p>
          </div>

          {/* Quick Actions & Switchers */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>

            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-2.5 sm:p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all shadow-xs"
              title="Refresh live stream"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`} />
            </button>
            <Button
              variant="outline"
              size="md"
              icon={FiCamera}
              onClick={() => navigate("/owner/scan-qr")}
            >
              {t("scanPass", "Scan Pass")}
            </Button>
            <Button
              size="md"
              icon={FiPlus}
              onClick={() => navigate("/owner/add-parking")}
            >
              {t("addFacility", "Add Facility")}
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXECUTIVE KPI RIBBON (4 STRIPE/LINEAR STYLE CARDS)                        */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Parked Inside */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-[#05944f] ring-4 ring-[#05944f]/10 shadow-sm"
                : "border-[#e0e0e0] hover:border-[#a0a0a0] shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#737373]">
                Parked (Inside)
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#f0fdf4] text-[#05944f] flex items-center justify-center font-bold">
                <FiLogIn className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0a0a0a] tracking-tight">{enteredCount}</span>
              <span className="text-xs font-bold text-[#05944f] bg-[#f0fdf4] px-2 py-0.5 rounded-md border border-[#86efac]">
                Active Inside
              </span>
            </div>
            <div className="mt-3 w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#05944f] h-full rounded-full transition-all duration-500"
                style={{ width: `${totalSlots > 0 ? (enteredCount / totalSlots) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 2. Booked (Awaiting) */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-[#276ef1] ring-4 ring-[#276ef1]/10 shadow-sm"
                : "border-[#e0e0e0] hover:border-[#a0a0a0] shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#737373]">
                Booked (Reserved)
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#f0f4ff] text-[#276ef1] flex items-center justify-center font-bold">
                <FiClock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0a0a0a] tracking-tight">{bookedCount}</span>
              <span className="text-xs font-bold text-[#276ef1] bg-[#f0f4ff] px-2 py-0.5 rounded-md border border-[#bfdbfe]">
                Arriving
              </span>
            </div>
            <div className="mt-3 w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#276ef1] h-full rounded-full transition-all duration-500"
                style={{ width: `${totalSlots > 0 ? (bookedCount / totalSlots) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 3. Available Slots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${
              activeTab === "FACILITIES"
                ? "border-[#0a0a0a] ring-4 ring-black/10 shadow-sm"
                : "border-[#e0e0e0] hover:border-[#a0a0a0] shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#737373]">
                Available Bays
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#f0f0f0] text-[#0a0a0a] flex items-center justify-center font-bold">
                <FiLayers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0a0a0a] tracking-tight">{availableSlots}</span>
              <span className="text-xs font-semibold text-[#737373]">of {totalSlots}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#737373] font-medium">
              <span>Occupancy rate</span>
              <span className="font-bold text-[#0a0a0a]">{occupancyPercentage}%</span>
            </div>
          </div>

          {/* 4. Total Earnings */}
          <div className="p-5 rounded-3xl bg-[#0a0a0a] text-white border border-[#262626] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#a0a0a0]">
                Gross Earnings
              </span>
              <div className="w-7 h-7 rounded-xl bg-white/10 text-[#05944f] flex items-center justify-center font-bold">
                <FiDollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-3 text-[11px] text-[#a0a0a0] flex items-center justify-between font-medium">
              <span>Today's volume</span>
              <span className="font-bold text-white">₹{todayRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SAAS SEGMENTED TABS & FILTERS                                             */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="bg-white p-2 rounded-2xl border border-[#e0e0e0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1 bg-[#f0f0f0] p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab("VEHICLES");
                  setVehicleFilter("ALL");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "VEHICLES"
                    ? "bg-white text-[#0a0a0a] shadow-xs"
                    : "text-[#737373] hover:text-[#0a0a0a]"
                }`}
              >
                <FiActivity className="w-3.5 h-3.5 text-[#05944f]" />
                <span>Live Vehicles Feed ({liveBookings.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("FACILITIES")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "FACILITIES"
                    ? "bg-white text-[#0a0a0a] shadow-xs"
                    : "text-[#737373] hover:text-[#0a0a0a]"
                }`}
              >
                <FiGrid className="w-3.5 h-3.5" />
                <span>Facility Hub ({parkingList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("ANALYTICS")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ANALYTICS"
                    ? "bg-white text-[#0a0a0a] shadow-xs"
                    : "text-[#737373] hover:text-[#0a0a0a]"
                }`}
              >
                <FiBarChart2 className="w-3.5 h-3.5 text-[#276ef1]" />
                <span>Occupancy Matrix</span>
              </button>
            </div>

            {/* Filter by facility & search */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {activeTab === "VEHICLES" && (
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="pe-input text-xs font-semibold py-2 px-3 sm:w-44 bg-[#f7f7f7] border-0"
                >
                  <option value="ALL">All Facilities</option>
                  {parkingList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative w-full sm:w-56">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#737373] pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "VEHICLES"
                      ? "Search plate, driver, slot..."
                      : "Search facilities..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left text-xs bg-[#f7f7f7] border-0"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: LIVE VEHICLE FEED (CLEAN SAAS ROWS)                                */}
          {/* ========================================================================= */}
          {activeTab === "VEHICLES" && (
            <div className="space-y-3">
              {/* Filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "ALL", label: `All Vehicles (${liveBookings.length})` },
                  { id: "INSIDE", label: `🟢 Parked Inside (${enteredCount})` },
                  { id: "BOOKED", label: `🔵 Booked / Arriving (${bookedCount})` },
                  { id: "EXITED", label: `✅ Completed Exits` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      vehicleFilter === chip.id
                        ? "bg-[#0a0a0a] text-white shadow-xs"
                        : "bg-white text-[#545454] border border-[#e0e0e0] hover:border-[#a0a0a0]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Feed items */}
              {loading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filteredBookings.length === 0 ? (
                <EmptyState
                  icon={FiActivity}
                  title="No vehicle activity"
                  description={
                    liveBookings.length === 0
                      ? "No driver bookings yet. When drivers reserve slots or scan gate passes, real-time cards with check-in/out controls will appear here."
                      : "No vehicles match the selected filter."
                  }
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
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#a0a0a0] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Vehicle plate + Driver details */}
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                              isEntered
                                ? "bg-[#f0fdf4] text-[#05944f] border-[#86efac]"
                                : isBooked
                                ? "bg-[#f0f4ff] text-[#276ef1] border-[#bfdbfe]"
                                : "bg-[#f0f0f0] text-[#545454] border-[#e0e0e0]"
                            }`}
                          >
                            {isEntered ? <FiLogIn className="w-5 h-5" /> : isBooked ? <FiClock className="w-5 h-5" /> : <FiCheck className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-black font-mono tracking-tight bg-[#0a0a0a] text-white px-2.5 py-0.5 rounded-lg">
                                {b.vehicle_number}
                              </span>
                              <span className="text-xs font-bold text-[#0a0a0a] bg-[#f0f0f0] px-2 py-0.5 rounded-md">
                                Slot {b.slot_number}
                              </span>
                              <span className="text-xs text-[#737373] font-medium">
                                ({b.vehicle_type || "Car"})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#737373] flex-wrap">
                              <span className="font-bold text-[#0a0a0a]">{b.customer_name}</span>
                              <span>·</span>
                              <span className="truncate max-w-xs">{b.parking_name}</span>
                              <span>·</span>
                              <span>{b.start_time} - {b.end_time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status + 1-Click Action Buttons */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                          {b.pass_type === "DAILY_PASS" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0fdf4] text-[#05944f] text-[11px] font-bold border border-[#86efac]">
                              🎟️ Day Pass (Entry #{b.entry_count || 1}) · Curfew {b.last_exit_rule || "11:00 PM"}
                            </span>
                          )}

                          {isEntered && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f0fdf4] text-[#05944f] text-xs font-black border border-[#86efac]">
                              <span className="w-2 h-2 rounded-full bg-[#05944f] animate-pulse" />
                              Parked Inside
                            </span>
                          )}

                          {isBooked && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f0f4ff] text-[#276ef1] text-xs font-black border border-[#bfdbfe]">
                              <FiClock className="w-3.5 h-3.5" />
                              Booked (Arriving)
                            </span>
                          )}

                          {!isEntered && !isBooked && b.pass_type === "DAILY_PASS" && b.status === "ACTIVE" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fffbeb] text-[#b45309] text-xs font-bold border border-[#fde68a]">
                              ⚪ Out (Pass Active)
                            </span>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f0f0f0] text-[#737373] text-xs font-semibold">
                              <FiCheck className="w-3.5 h-3.5 text-[#05944f]" />
                              Completed Exit
                            </span>
                          )}

                          {/* 1-Click Entry / Re-Entry Button */}
                          {(isBooked || (!isEntered && b.pass_type === "DAILY_PASS" && b.status === "ACTIVE")) && (
                            <button
                              onClick={() => handleMarkEntry(b.id)}
                              disabled={actionLoading[b.id] === "entry"}
                              className="px-4 py-2 rounded-xl bg-[#0a0a0a] hover:bg-[#262626] disabled:opacity-50 text-white text-xs font-black transition-colors shadow-xs flex items-center gap-1.5"
                            >
                              <FiLogIn className="w-3.5 h-3.5 text-[#05944f]" />
                              <span>
                                {actionLoading[b.id] === "entry"
                                  ? "Checking in..."
                                  : b.entry_count > 0
                                  ? "Re-Enter Vehicle"
                                  : "Check In Vehicle"}
                              </span>
                            </button>
                          )}

                          {/* 1-Click Exit Button */}
                          {isEntered && (
                            <button
                              onClick={() => handleMarkExit(b.id)}
                              disabled={actionLoading[b.id] === "exit"}
                              className="px-4 py-2 rounded-xl bg-[#e11900] hover:bg-[#c51500] disabled:opacity-50 text-white text-xs font-black transition-colors shadow-xs flex items-center gap-1.5"
                            >
                              <FiLogOut className="w-3.5 h-3.5" />
                              <span>
                                {actionLoading[b.id] === "exit"
                                  ? "Checking out..."
                                  : b.pass_type === "DAILY_PASS"
                                  ? "Temporary Exit"
                                  : "Check Out Vehicle"}
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

          {/* ========================================================================= */}
          {/* TAB 2: FACILITY HUB (CLEAN DECK CARDS)                                   */}
          {/* ========================================================================= */}
          {activeTab === "FACILITIES" && (
            <div className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filteredFacilities.length === 0 ? (
                <EmptyState
                  icon={FiGrid}
                  title="No facilities found"
                  description="List your parking facility to start receiving automated bookings and digital pass verification."
                  actionLabel="Add Facility"
                  onAction={() => navigate("/owner/add-parking")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFacilities.map((p) => {
                    const status = (p.verification_status || p.status || "PENDING").toUpperCase();
                    const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                    const isRejected = status === "REJECTED";
                    const total = p.total_slots || 20;
                    const isFree = (p.hourly_rate ?? -1) === 0;

                    const breakdown = dashboardData?.facilities?.find((f) => f.id === p.id);
                    const facilityEntered = breakdown?.entered_count ?? 0;
                    const facilityBooked = breakdown?.booked_count ?? 0;
                    const facilityAvailable = breakdown?.available_slots ?? Math.max(0, total - facilityEntered - facilityBooked);

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#a0a0a0] transition-all overflow-hidden flex flex-col group"
                      >
                        {/* Image */}
                        <div className="relative h-44 bg-[#0a0a0a] overflow-hidden">
                          {p.image_url || p.image ? (
                            <img
                              src={p.image_url || p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
                              <FiGrid className="w-8 h-8 text-[#545454] mb-2" />
                              <span className="text-xs font-semibold text-[#737373]">Parking Facility</span>
                            </div>
                          )}

                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <Badge
                              variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                              dot
                              size="sm"
                            >
                              {isApproved ? "Active" : isRejected ? "Rejected" : "In Review"}
                            </Badge>
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-black/70 text-white backdrop-blur-md border border-white/20">
                              {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h3 className="font-bold text-base text-[#0a0a0a] line-clamp-1">{p.name}</h3>
                            <p className="text-xs text-[#737373] flex items-start gap-1 mt-1 line-clamp-1">
                              <FiMapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              {p.address || p.location || "City Location"}
                            </p>

                            {/* Occupancy pill */}
                            <div className="mt-3.5 p-3 rounded-2xl bg-[#f7f7f7] border border-[#f0f0f0] flex items-center justify-between text-xs font-bold">
                              <span className="text-[#05944f]">🟢 {facilityEntered} Inside</span>
                              <span className="text-[#276ef1]">🔵 {facilityBooked} Booked</span>
                              <span className="text-[#0a0a0a]">{facilityAvailable} Free</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-[#f0f0f0] space-y-2">
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
                                Scan Gate
                              </Button>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                                className="flex items-center gap-1 text-xs font-semibold text-[#545454] hover:text-[#0a0a0a]"
                              >
                                <FiEdit2 className="w-3 h-3" />
                                Edit Info
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, id: p.id, name: p.name })}
                                className="flex items-center gap-1 text-xs font-semibold text-[#e11900] hover:text-[#c51500]"
                              >
                                <FiTrash2 className="w-3 h-3" />
                                Remove
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

          {/* ========================================================================= */}
          {/* TAB 3: OCCUPANCY & ANALYTICS MATRIX                                       */}
          {/* ========================================================================= */}
          {activeTab === "ANALYTICS" && (
            <div className="bg-white rounded-3xl border border-[#e0e0e0] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
              <div>
                <h3 className="text-base font-black text-[#0a0a0a] tracking-tight">
                  Facility Utilization Breakdown
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Detailed distribution of parked, reserved, and available slot inventory across all decks.
                </p>
              </div>

              <div className="divide-y divide-[#f0f0f0]">
                {(dashboardData?.facilities || []).map((f) => {
                  const tot = f.total_slots || 1;
                  const enteredPct = Math.round((f.entered_count / tot) * 100);
                  const bookedPct = Math.round((f.booked_count / tot) * 100);
                  const availPct = Math.max(0, 100 - enteredPct - bookedPct);

                  return (
                    <div key={f.id} className="py-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-[#0a0a0a]">{f.name}</p>
                          <p className="text-xs text-[#737373]">{f.address}</p>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-[#0a0a0a] text-white">
                          {f.occupancy_rate}% Occupancy
                        </span>
                      </div>

                      {/* Stacked bar */}
                      <div className="w-full bg-[#f0f0f0] h-3 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="bg-[#05944f] h-full transition-all duration-500"
                          style={{ width: `${enteredPct}%` }}
                          title={`${f.entered_count} inside`}
                        />
                        <div
                          className="bg-[#276ef1] h-full transition-all duration-500"
                          style={{ width: `${bookedPct}%` }}
                          title={`${f.booked_count} booked`}
                        />
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-between text-xs font-semibold text-[#737373]">
                        <span className="text-[#05944f]">🟢 {f.entered_count} Parked ({enteredPct}%)</span>
                        <span className="text-[#276ef1]">🔵 {f.booked_count} Booked ({bookedPct}%)</span>
                        <span className="text-[#0a0a0a]">⚡ {f.available_slots} Available ({availPct}%)</span>
                        <span>Total: {f.total_slots} slots</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Facility"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto">
            <FiTrash2 className="w-6 h-6 text-[#e11900]" />
          </div>
          <div>
            <p className="font-bold text-[#0a0a0a]">Delete "{deleteModal.name}"?</p>
            <p className="text-sm text-[#737373] mt-1">
              This will remove the facility and all associated parking slot records.
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