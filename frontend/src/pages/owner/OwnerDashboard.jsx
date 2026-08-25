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
  FiCheck,
  FiTruck,
  FiArrowUpRight,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import { useLanguage } from "../../context/LanguageContext";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border backdrop-blur-xl text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
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

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active View Tab: 'VEHICLES' | 'FACILITIES'
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
  const occupancyPercent = totalSlots > 0 ? Math.round(((enteredCount + bookedCount) / totalSlots) * 100) : 0;

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
        const matchPlate = b.vehicle_number && b.vehicle_number.toLowerCase().includes(q);
        const matchDriver = b.customer_name && b.customer_name.toLowerCase().includes(q);
        const matchSlot = b.slot_number && String(b.slot_number).toLowerCase().includes(q);
        const matchFacility = b.parking_name && b.parking_name.toLowerCase().includes(q);
        return matchPlate || matchDriver || matchSlot || matchFacility;
      }
      return true;
    });
  }, [liveBookings, selectedFacility, vehicleFilter, search]);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return parkingList.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q))
      );
    });
  }, [parkingList, search]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting accents */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. HERO HEADER WITH SOPHISTICATED GRADIENTS & GLASSMORPHISM               */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live System Active
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                · {parkingList.length} Facilities Online
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
              Facility Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl font-medium leading-relaxed">
              Live gate operations, vehicle check-in verification, and parking inventory.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all shadow-xs active:scale-95"
              title="Refresh live feed"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-500" : "text-zinc-500 dark:text-zinc-400"}`} />
            </button>
            <Button
              variant="outline"
              size="md"
              icon={FiCamera}
              onClick={() => navigate("/owner/scan-qr")}
              className="border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white shadow-xs"
            >
              Scan Pass
            </Button>
            <button
              onClick={() => navigate("/owner/add-parking")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Facility</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. 4 LUXURY KPI METRIC CARDS WITH ACCENT TOP STRIPES                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          
          {/* Card 1: Parked Inside */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`group relative p-5 sm:p-6 rounded-3xl border-t-4 border-t-emerald-500 border border-zinc-200/90 dark:border-zinc-800/90 transition-all duration-300 cursor-pointer bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl hover:-translate-y-1 hover:shadow-lg ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "ring-4 ring-emerald-500/15 shadow-md border-emerald-500"
                : "shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Parked Inside
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <FiLogIn className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{enteredCount}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                Active Bays
              </span>
            </div>
            <div className="mt-3.5 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${totalSlots > 0 ? (enteredCount / totalSlots) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Card 2: Arriving Soon */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`group relative p-5 sm:p-6 rounded-3xl border-t-4 border-t-blue-500 border border-zinc-200/90 dark:border-zinc-800/90 transition-all duration-300 cursor-pointer bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl hover:-translate-y-1 hover:shadow-lg ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "ring-4 ring-blue-500/15 shadow-md border-blue-500"
                : "shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Arriving Soon
              </span>
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{bookedCount}</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                Booked
              </span>
            </div>
            <div className="mt-3.5 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${totalSlots > 0 ? (bookedCount / totalSlots) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Card 3: Available Slots */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className={`group relative p-5 sm:p-6 rounded-3xl border-t-4 border-t-zinc-900 dark:border-t-white border border-zinc-200/90 dark:border-zinc-800/90 transition-all duration-300 cursor-pointer bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl hover:-translate-y-1 hover:shadow-lg ${
              activeTab === "FACILITIES"
                ? "ring-4 ring-zinc-950/10 dark:ring-white/10 shadow-md"
                : "shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Free Slots
              </span>
              <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{availableSlots}</span>
              <span className="text-xs font-semibold text-zinc-400">of {totalSlots} total</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">
              <span>Occupancy</span>
              <span className="text-zinc-900 dark:text-white">{occupancyPercent}%</span>
            </div>
          </div>

          {/* Card 4: Total Revenue */}
          <div className="group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Total Revenue
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-xs">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-3.5 flex items-center justify-between text-[11px] font-bold text-zinc-400">
              <span>Today</span>
              <span className="text-emerald-400 font-black">+₹{todayRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SEGMENTED TAB CONTROLS & FILTER BAR                                    */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-2.5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            
            {/* Pill Toggle Bar */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl">
              <button
                onClick={() => {
                  setActiveTab("VEHICLES");
                  setVehicleFilter("ALL");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === "VEHICLES"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm scale-100"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiActivity className="w-4 h-4 text-emerald-500" />
                <span>Live Gate Feed ({liveBookings.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("FACILITIES")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === "FACILITIES"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm scale-100"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiGrid className="w-4 h-4 text-blue-500" />
                <span>My Facilities ({parkingList.length})</span>
              </button>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {parkingList.length > 1 && (
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="pe-input text-xs font-bold py-2.5 px-3.5 sm:w-48 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl shadow-xs"
                >
                  <option value="ALL">All Facilities</option>
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
                  type="text"
                  placeholder={
                    activeTab === "VEHICLES"
                      ? "Search plate, driver, or slot..."
                      : "Search facilities..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: LIVE VEHICLE FEED                                                  */}
          {/* ========================================================================= */}
          {activeTab === "VEHICLES" && (
            <div className="space-y-3.5">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "ALL", label: `All Vehicles (${liveBookings.length})` },
                  { id: "INSIDE", label: `🟢 Parked Inside (${enteredCount})` },
                  { id: "BOOKED", label: `🔵 Arriving Soon (${bookedCount})` },
                  { id: "EXITED", label: `✅ Completed Exits` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                      vehicleFilter === chip.id
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md"
                        : "bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs"
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
                  icon={FiTruck}
                  title="No vehicle activity right now"
                  description={
                    liveBookings.length === 0
                      ? "No vehicles are booked or checked in yet. When drivers reserve spots, real-time cards will appear here with 1-click Check In and Check Out controls."
                      : "No vehicles match the selected search or status filter."
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
                        className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Left: Plate + Driver info */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* License Plate Badge */}
                          <div className="license-plate text-xs shrink-0 shadow-xs">
                            <span className="license-plate-ind">IND</span>
                            <span className="font-mono font-black tracking-wider">{b.vehicle_number}</span>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                Slot {b.slot_number}
                              </span>
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                {b.customer_name}
                              </span>
                              <span className="text-xs text-zinc-400">
                                ({b.vehicle_type || "Car"})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-xs">{b.parking_name}</span>
                              <span>·</span>
                              <span>{b.start_time} - {b.end_time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Status badge & 1-Click Action */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                          {isEntered && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/25">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Parked in Bay
                            </span>
                          )}

                          {isBooked && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black border border-blue-500/25">
                              <FiClock className="w-3.5 h-3.5" />
                              Arriving Soon
                            </span>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold">
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Exited
                            </span>
                          )}

                          {/* 1-Click Check In Button */}
                          {isBooked && (
                            <button
                              onClick={() => handleMarkEntry(b.id)}
                              disabled={actionLoading[b.id] === "entry"}
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
                            >
                              <FiLogIn className="w-4 h-4" />
                              <span>{actionLoading[b.id] === "entry" ? "Checking In..." : "Check In"}</span>
                            </button>
                          )}

                          {/* 1-Click Check Out Button */}
                          {isEntered && (
                            <button
                              onClick={() => handleMarkExit(b.id)}
                              disabled={actionLoading[b.id] === "exit"}
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 active:scale-95"
                            >
                              <FiLogOut className="w-4 h-4" />
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

          {/* ========================================================================= */}
          {/* TAB 2: MY FACILITIES                                                      */}
          {/* ========================================================================= */}
          {activeTab === "FACILITIES" && (
            <div className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filteredFacilities.length === 0 ? (
                <EmptyState
                  icon={FiGrid}
                  title="No facilities listed"
                  description="List your parking facility to start receiving automated bookings and digital pass verification."
                  actionLabel="Add Facility"
                  onAction={() => navigate("/owner/add-parking")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredFacilities.map((p) => {
                    const status = (p.verification_status || p.status || "PENDING").toUpperCase();
                    const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                    const isRejected = status === "REJECTED";
                    const isFree = (p.hourly_rate ?? -1) === 0;

                    return (
                      <div
                        key={p.id}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-zinc-400 dark:hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
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
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
                              <FiGrid className="w-8 h-8 text-zinc-600 mb-1" />
                              <span className="text-xs font-semibold text-zinc-400">Parking Facility</span>
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                            <Badge
                              variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                              dot
                              size="sm"
                            >
                              {isApproved ? "Active" : isRejected ? "Rejected" : "In Review"}
                            </Badge>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-md">
                              {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h3 className="font-black text-base text-zinc-900 dark:text-white line-clamp-1">{p.name}</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 mt-1 line-clamp-1">
                              <FiMapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                              {p.address || p.location || "City Location"}
                            </p>

                            <div className="mt-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold">
                              <span className="text-zinc-600 dark:text-zinc-400">Total Capacity:</span>
                              <span className="text-zinc-900 dark:text-white font-black">{p.total_slots || 12} Bays</span>
                            </div>
                          </div>

                          {/* Action Grid */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
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

                            <div className="flex items-center justify-between pt-1 text-xs font-bold">
                              <button
                                onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                                className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              >
                                <FiEdit2 className="w-3 h-3" />
                                Edit Details
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, id: p.id, name: p.name })}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
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
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto">
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">Delete "{deleteModal.name}"?</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
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