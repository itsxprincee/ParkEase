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
  FiBarChart2,
  FiTrendingUp,
  FiUser,
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
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Active View Tab: 'VEHICLES' | 'FACILITIES' | 'ANALYTICS'
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* HEADER BAR                                                                */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live System Active
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                · {parkingList.length} Facilities Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Facility Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Live gate operations, vehicle check-ins, and slot occupancy.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all shadow-xs active:scale-95"
              title="Refresh Data"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : "text-zinc-500 dark:text-zinc-400"}`} />
            </button>
            <Button
              variant="outline"
              size="md"
              icon={FiCamera}
              onClick={() => navigate("/owner/scan-qr")}
            >
              Scan Pass
            </Button>
            <Button
              size="md"
              icon={FiPlus}
              onClick={() => navigate("/owner/add-parking")}
            >
              Add Facility
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 SUMMARY STAT CARDS                                                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1 */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("INSIDE");
            }}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
              activeTab === "VEHICLES" && vehicleFilter === "INSIDE"
                ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Parked Inside
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <FiLogIn className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{enteredCount}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => {
              setActiveTab("VEHICLES");
              setVehicleFilter("BOOKED");
            }}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
              activeTab === "VEHICLES" && vehicleFilter === "BOOKED"
                ? "border-blue-500 ring-4 ring-blue-500/10 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Arriving Soon
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{bookedCount}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                Booked
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => setActiveTab("FACILITIES")}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
              activeTab === "FACILITIES"
                ? "border-zinc-900 dark:border-white ring-4 ring-zinc-900/10 dark:ring-white/10 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Available Slots
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-bold">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{availableSlots}</span>
              <span className="text-xs text-zinc-400">of {totalSlots} total</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-3xl bg-zinc-950 dark:bg-zinc-900 text-white border border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">
                Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                +₹{todayRevenue} today
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTROLS & FILTER BAR                                                 */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            
            {/* Tab Pills */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab("VEHICLES");
                  setVehicleFilter("ALL");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "VEHICLES"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiActivity className="w-4 h-4 text-emerald-500" />
                <span>Live Gate Feed ({liveBookings.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("FACILITIES")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "FACILITIES"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FiGrid className="w-4 h-4 text-blue-500" />
                <span>My Facilities ({parkingList.length})</span>
              </button>
            </div>

            {/* Search & Facility Selector */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {parkingList.length > 1 && (
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="pe-input text-xs font-semibold py-2 px-3 sm:w-44 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                >
                  <option value="ALL">All Facilities</option>
                  {parkingList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "VEHICLES"
                      ? "Search plate, driver, slot..."
                      : "Search facilities..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: LIVE VEHICLES FEED (FULL WIDTH, SPACIOUS)                          */}
          {/* ========================================================================= */}
          {activeTab === "VEHICLES" && (
            <div className="space-y-3">
              {/* Quick Status Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "ALL", label: `All Vehicles (${liveBookings.length})` },
                  { id: "INSIDE", label: `🟢 Parked Inside (${enteredCount})` },
                  { id: "BOOKED", label: `🔵 Arriving Soon (${bookedCount})` },
                  { id: "EXITED", label: `✅ Exited` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setVehicleFilter(chip.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      vehicleFilter === chip.id
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                        : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Vehicle Items */}
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
                      ? "No vehicles are booked or checked in yet. When drivers reserve slots, they will appear here with 1-click Check In and Check Out buttons."
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
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Vehicle details */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* License Plate Badge */}
                          <div className="license-plate text-xs shrink-0 shadow-xs">
                            <span className="license-plate-ind">IND</span>
                            <span className="font-mono font-black">{b.vehicle_number}</span>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md">
                                Slot {b.slot_number}
                              </span>
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                {b.customer_name}
                              </span>
                              <span className="text-xs text-zinc-400">
                                ({b.vehicle_type || "Car"})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                              <span className="truncate max-w-xs">{b.parking_name}</span>
                              <span>·</span>
                              <span>{b.start_time} - {b.end_time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & 1-Click Gate Action */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                          {isEntered && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Inside Bay
                            </span>
                          )}

                          {isBooked && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800">
                              <FiClock className="w-3.5 h-3.5" />
                              Arriving
                            </span>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-semibold">
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Exited
                            </span>
                          )}

                          {/* 1-Click Check In */}
                          {isBooked && (
                            <button
                              onClick={() => handleMarkEntry(b.id)}
                              disabled={actionLoading[b.id] === "entry"}
                              className="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                            >
                              <FiLogIn className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{actionLoading[b.id] === "entry" ? "Checking In..." : "Check In"}</span>
                            </button>
                          )}

                          {/* 1-Click Check Out */}
                          {isEntered && (
                            <button
                              onClick={() => handleMarkExit(b.id)}
                              disabled={actionLoading[b.id] === "exit"}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                            >
                              <FiLogOut className="w-3.5 h-3.5" />
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
          {/* TAB 2: MY FACILITIES (CLEAN 3-COL GRID)                                   */}
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
                  title="No facilities listed"
                  description="List your parking lot to start accepting digital bookings and QR gate passes."
                  actionLabel="Add Facility"
                  onAction={() => navigate("/owner/add-parking")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFacilities.map((p) => {
                    const status = (p.verification_status || p.status || "PENDING").toUpperCase();
                    const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                    const isRejected = status === "REJECTED";
                    const isFree = (p.hourly_rate ?? -1) === 0;

                    return (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all overflow-hidden flex flex-col group"
                      >
                        {/* Image banner */}
                        <div className="relative h-40 bg-zinc-950 overflow-hidden">
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

                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <Badge
                              variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                              dot
                              size="sm"
                            >
                              {isApproved ? "Active" : isRejected ? "Rejected" : "In Review"}
                            </Badge>
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-black/80 text-white backdrop-blur-md border border-white/20">
                              {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h3 className="font-bold text-base text-zinc-900 dark:text-white line-clamp-1">{p.name}</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1 mt-1 line-clamp-1">
                              <FiMapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                              {p.address || p.location || "City Location"}
                            </p>

                            <div className="mt-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold">
                              <span className="text-zinc-700 dark:text-zinc-300">Total Capacity:</span>
                              <span className="text-zinc-900 dark:text-white">{p.total_slots || 12} Bays</span>
                            </div>
                          </div>

                          {/* Quick Action Grid */}
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

                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                                className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              >
                                <FiEdit2 className="w-3 h-3" />
                                Edit Info
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, id: p.id, name: p.name })}
                                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
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