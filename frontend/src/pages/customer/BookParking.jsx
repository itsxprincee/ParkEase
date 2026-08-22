import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiMapPin,
  FiTruck,
  FiZap,
  FiShield,
  FiPlus,
  FiInfo,
  FiAlertCircle,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import Modal from "../../components/Modal";
import { Skeleton } from "../../components/Skeleton";

export default function BookParking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Facility & Slots
  const [parking, setParking] = useState(location.state?.parking || null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotFilter, setSlotFilter] = useState("ALL"); // ALL, EV, CAR, BIKE

  // Vehicles
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    vehicle_name: "",
  });
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Time & Duration
  const now = new Date();
  const formattedToday = now.toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(formattedToday);

  const currentHour = now.getHours() + 1;
  const initialStartTime = `${String(currentHour % 24).padStart(2, "0")}:00`;
  const initialEndTime = `${String((currentHour + 2) % 24).padStart(2, "0")}:00`;

  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [selectedDurationHours, setSelectedDurationHours] = useState(2);

  // State & Loading
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // Dynamic rate from parking API, fallback to 50
  const HOURLY_RATE = parking?.price_per_hour || parking?.hourly_rate || 50;
  const PLATFORM_FEE = 5;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadParking = async () => {
    try {
      const response = await API.get(`/parking/${id}`);
      setParking(response.data);
    } catch (error) {
      console.error("Failed to load parking:", error);
      showToast(
        error?.response?.data?.detail || "Unable to load parking details.",
        "error"
      );
    }
  };

  const loadSlots = async () => {
    try {
      const response = await API.get(`/parking/${id}/slots`);
      let allSlots = [];

      if (Array.isArray(response.data)) {
        allSlots = response.data;
      } else if (Array.isArray(response.data?.slots)) {
        allSlots = response.data.slots;
      }

      setSlots(allSlots);

      // Auto-select first available slot
      const firstAvailable = allSlots.find(
        (s) =>
          !s.is_occupied &&
          s.status?.toLowerCase() !== "occupied" &&
          s.status?.toLowerCase() !== "maintenance"
      );
      if (firstAvailable) {
        setSelectedSlot(firstAvailable);
      }
    } catch (error) {
      console.error("Failed to load slots:", error);
      showToast("Could not load parking slots.", "error");
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await API.get("/vehicles/my");
      const list = Array.isArray(response.data) ? response.data : [];
      setVehicles(list);
      if (list.length > 0) {
        setSelectedVehicle(list[0]);
      }
    } catch (error) {
      console.error("Failed to load vehicles:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadParking(), loadSlots(), loadVehicles()]);
      setLoading(false);
    };
    init();
  }, [id]);

  // Recalculate end time when duration changes
  const handleDurationChange = (hours) => {
    setSelectedDurationHours(hours);
    const [startH, startM] = startTime.split(":").map(Number);
    const endH = (startH + hours) % 24;
    setEndTime(`${String(endH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`);
  };

  // Handle start time change and recalculate end time preserving minutes
  const handleStartTimeChange = (value) => {
    setStartTime(value);
    const [startH, startM] = value.split(":").map(Number);
    const endH = (startH + selectedDurationHours) % 24;
    setEndTime(`${String(endH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`);
  };

  // Add vehicle handler
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number.trim()) {
      showToast("Please enter a vehicle license plate number.", "error");
      return;
    }

    try {
      setAddingVehicle(true);
      const response = await API.post("/vehicles/", newVehicle);
      showToast("Vehicle registered successfully!", "success");
      setVehicles((prev) => [...prev, response.data]);
      setSelectedVehicle(response.data);
      setShowAddVehicleModal(false);
      setNewVehicle({ vehicle_number: "", vehicle_type: "Car", vehicle_name: "" });
    } catch (error) {
      showToast(
        error?.response?.data?.detail || "Failed to register vehicle.",
        "error"
      );
    } finally {
      setAddingVehicle(false);
    }
  };

  // Calculated Costs
  const subtotal = selectedDurationHours * HOURLY_RATE;
  const grandTotal = subtotal + PLATFORM_FEE;

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (slotFilter === "EV") return slot.is_ev || slot.vehicle_type?.toUpperCase() === "EV";
      if (slotFilter === "CAR") return slot.vehicle_type?.toUpperCase() === "CAR" || !slot.vehicle_type;
      if (slotFilter === "BIKE") return slot.vehicle_type?.toUpperCase() === "BIKE";
      return true;
    });
  }, [slots, slotFilter]);

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      showToast("Please select an available parking slot.", "error");
      return;
    }
    if (!selectedVehicle) {
      showToast("Please add and select a vehicle before booking.", "error");
      return;
    }

    try {
      setBookingLoading(true);

      const payload = {
        parking_id: parseInt(id),
        slot_id: selectedSlot.id,
        vehicle_id: selectedVehicle.id,
        vehicle_number: selectedVehicle.vehicle_number,
        vehicle_type: selectedVehicle.vehicle_type,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        duration_hours: selectedDurationHours,
        total_amount: grandTotal,
      };

      const response = await API.post("/booking/book", payload);
      const bookedData = response.data || {
        id: Math.floor(1000 + Math.random() * 9000),
        ...payload,
        parking_name: parking?.name || "ParkEase Central",
        slot_number: selectedSlot?.slot_number,
      };

      setSuccessModal(bookedData);
    } catch (error) {
      console.error("Booking error:", error);
      showToast(
        error?.response?.data?.detail || "Booking failed. Please try again.",
        "error"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <SaaSNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-28 w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-xs sm:text-sm font-semibold ${
              toast.type === "error"
                ? "bg-rose-50/95 text-rose-800 border-rose-200"
                : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              Instant Reservation
            </Badge>
            <Badge variant="success" size="sm" dot>
              Live Availability
            </Badge>
          </div>
        </div>

        {/* FACILITY TITLE BANNER */}
        <div className="apple-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-extrabold tracking-wide uppercase">
                Instant Reservation
              </span>
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Availability
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {parking?.name || "ParkEase Smart Facility"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <FiMapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {parking?.address || parking?.location || "Premium City Hub, Zone 1"}
              </span>
            </p>

            {/* SECURITY & AMENITIES BADGES */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {parking?.has_cctv && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                  📹 24/7 CCTV
                </span>
              )}
              {parking?.has_security_guard && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                  🛡️ Security Guard
                </span>
              )}
              {parking?.has_ev && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                  ⚡ EV Charging
                </span>
              )}
              {parking?.has_covered_roof && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                  🏢 Covered Parking
                </span>
              )}
              {parking?.is_24_7 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                  ⏰ 24/7 Access
                </span>
              )}
              {parking?.has_valet && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                  🔑 Valet Service
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-right min-w-[140px]">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Parking Rate
              </p>
              {HOURLY_RATE === 0 ? (
                <p className="text-2xl font-black text-emerald-600">
                  FREE
                  <span className="text-xs text-slate-400 font-medium ml-1">parking</span>
                </p>
              ) : (
                <p className="text-2xl font-black text-slate-900">
                  ₹{HOURLY_RATE}
                  <span className="text-xs text-slate-400 font-normal">/hr</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FREE PARKING BANNER */}
        {HOURLY_RATE === 0 && (
          <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-emerald-50/90 border border-emerald-200 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
              🆓
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Free Parking Facility!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                This location provides free parking. You only pay the ₹5 ParkEase digital gate fee.
              </p>
            </div>
          </div>
        )}

        {/* BOOKING WORKFLOW GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: CONFIGURATION & SLOT SELECTION */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: TIME & VEHICLE CONFIG */}
            <div className="apple-card p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Duration & Vehicle
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select how long you need and choose your vehicle.
                    </p>
                  </div>
                </div>
              </div>

              {/* DURATION PRESET BUTTONS */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Parking Duration
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 6, 8].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => handleDurationChange(hrs)}
                      className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                        selectedDurationHours === hrs
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-[1.02]"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {hrs} {hrs === 1 ? "Hour" : "Hours"}
                    </button>
                  ))}
                </div>
              </div>

              {/* DATE & TIME PICKERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Booking Date
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                    <FiCalendar className="text-indigo-600 w-4 h-4" />
                    <input
                      type="date"
                      value={bookingDate}
                      min={formattedToday}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-800 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Entry Time
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                    <FiClock className="text-indigo-600 w-4 h-4" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-800 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Expected Exit
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-500">
                    <FiClock className="text-slate-400 w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">
                      {endTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* VEHICLE PICKER */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Your Vehicle
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>+ Add Vehicle</span>
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <FiAlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">No vehicle registered yet</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">Please add your car/bike license plate to proceed.</p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddVehicleModal(true)}
                    >
                      Add Vehicle
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vehicles.map((veh) => {
                      const isSelected = selectedVehicle?.id === veh.id;
                      return (
                        <div
                          key={veh.id}
                          onClick={() => setSelectedVehicle(veh)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-50/90 border-indigo-600 shadow-sm"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="license-plate text-xs">
                              <span className="license-plate-ind">IND</span>
                              <span>{veh.vehicle_number}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 truncate">
                              {veh.vehicle_name || veh.vehicle_type || "Vehicle"}
                            </span>
                          </div>

                          {isSelected && (
                            <FiCheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: INTERACTIVE VISUAL SLOT MATRIX */}
            <div className="apple-card p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Choose Your Parking Spot
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select any available slot from the visual floorplan below.
                    </p>
                  </div>
                </div>

                {/* Filter slot types */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                  {[
                    { id: "ALL", label: "All Spots" },
                    { id: "EV", label: "⚡ EV Only" },
                    { id: "CAR", label: "🚗 Cars" },
                    { id: "BIKE", label: "🏍️ Bikes" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSlotFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        slotFilter === filter.id
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SLOT LEGEND */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-white border-2 border-emerald-500" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-indigo-600" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold">⚡</span>
                  <span>EV Ready</span>
                </div>
              </div>

              {/* INTERACTIVE SLOT MAP GRID */}
              {slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <FiMapPin className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">No slots available</p>
                    <p className="text-xs text-slate-500 mt-0.5">This facility has no configured slots.</p>
                  </div>
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-600">No slots match this filter.</p>
                  <button
                    onClick={() => setSlotFilter("ALL")}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Show all slots
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredSlots.map((slot) => {
                    const isOccupied =
                      slot.is_occupied ||
                      slot.status?.toLowerCase() === "occupied" ||
                      slot.status?.toLowerCase() === "maintenance";
                    const isSelected = selectedSlot?.id === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setSelectedSlot(slot)}
                        className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 border-2 cursor-pointer disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-105"
                            : isOccupied
                            ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
                            : "bg-white border-emerald-400 hover:border-emerald-500 text-slate-900 hover:shadow-xs"
                        }`}
                      >
                        {slot.is_ev && (
                          <span
                            className={`absolute top-1.5 right-1.5 text-[10px] ${
                              isSelected ? "text-amber-300" : "text-amber-500"
                            }`}
                          >
                            ⚡
                          </span>
                        )}

                        <span className="text-xs font-black tracking-tight">
                          {slot.slot_number}
                        </span>

                        <span
                          className={`text-[9px] font-black uppercase tracking-wider ${
                            isSelected
                              ? "text-indigo-100"
                              : isOccupied
                              ? "text-slate-400"
                              : "text-emerald-600"
                          }`}
                        >
                          {isSelected ? "Selected" : isOccupied ? "Occupied" : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: FARE SUMMARY & CHECKOUT */}
          <div className="space-y-6">
            <div className="apple-card p-6 sm:p-7 sticky top-24 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Reservation Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Instant QR gate ticket generation.
                </p>
              </div>

              {/* SELECTION RECAP */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Facility</span>
                  <span className="font-bold text-slate-900">
                    {parking?.name || "ParkEase Hub"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Selected Spot</span>
                  <span className="font-extrabold text-indigo-600">
                    {selectedSlot ? selectedSlot.slot_number : "None Selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Vehicle</span>
                  <span className={`font-bold ${selectedVehicle ? "text-slate-900" : "text-rose-500"}`}>
                    {selectedVehicle?.vehicle_number || "Not Selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Time Window</span>
                  <span className="font-bold text-slate-900">
                    {startTime} - {endTime} ({selectedDurationHours}h)
                  </span>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>
                    {HOURLY_RATE === 0
                      ? `Free Parking (${selectedDurationHours}h)`
                      : `Parking (${selectedDurationHours}h × ₹${HOURLY_RATE})`}
                  </span>
                  <span className={`font-bold ${HOURLY_RATE === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                    {HOURLY_RATE === 0 ? "FREE" : `₹${subtotal}.00`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>Platform Gate Fee</span>
                    <FiInfo className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-bold text-slate-900">
                    ₹{PLATFORM_FEE}.00
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black text-indigo-600">
                    ₹{grandTotal}.00
                  </span>
                </div>

                {HOURLY_RATE === 0 && (
                  <p className="text-[11px] text-emerald-600 font-bold text-center pt-1">
                    ✅ Free parking facility — only ₹5 platform fee.
                  </p>
                )}
              </div>

              {/* CHECKOUT ACTION */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={bookingLoading}
                disabled={!selectedSlot || !selectedVehicle}
                onClick={handleConfirmBooking}
              >
                Confirm & Generate QR Pass &rarr;
              </Button>

              {(!selectedSlot || !selectedVehicle) && (
                <p className="text-[11px] text-amber-600 font-bold text-center">
                  {!selectedVehicle
                    ? "⚠ Select a vehicle to continue."
                    : "⚠ Choose a parking spot to continue."}
                </p>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant QR pass guaranteed upon confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD VEHICLE MODAL */}
      <Modal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        title="Register Vehicle"
        subtitle="Add your vehicle details for quick pass generation."
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              License Plate Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH-02-CD-5678"
              value={newVehicle.vehicle_number}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_number: e.target.value.toUpperCase() })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Vehicle Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. My Tesla / Daily Honda"
              value={newVehicle.vehicle_name}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Vehicle Type
            </label>
            <select
              value={newVehicle.vehicle_type}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="Car">Car (Sedan/SUV/Hatchback)</option>
              <option value="EV">Electric Vehicle (EV)</option>
              <option value="Bike">Motorcycle / Scooter</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setShowAddVehicleModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={addingVehicle}
            >
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        isOpen={!!successModal}
        onClose={() => {}}
        title="Reservation Confirmed! 🎉"
        maxWidth="max-w-md"
        showClose={false}
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <FiCheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-lg font-extrabold text-slate-900">
              Pass #{successModal?.id} Generated
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Your slot <span className="font-bold text-indigo-600">{successModal?.slot_number}</span> has been locked at {parking?.name || "the facility"}.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-bold text-slate-800">{successModal?.booking_date || bookingDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time Window</span>
              <span className="font-bold text-slate-800">{successModal?.start_time} – {successModal?.end_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-bold text-slate-800">{successModal?.vehicle_number || selectedVehicle?.vehicle_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-bold text-emerald-600">₹{grandTotal}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/customer/my-bookings")}
            >
              All Passes
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                navigate(`/customer/qr?booking=${successModal?.id}`, {
                  state: { booking: successModal },
                })
              }
            >
              View QR Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}