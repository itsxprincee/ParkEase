import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
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
import Skeleton from "../../components/Skeleton";
import ParkingLotVisualizer from "../../components/ParkingLotVisualizer";
import PaymentModal from "../../components/PaymentModal";

const VEHICLE_TYPES = [
  { value: "Car", label: "🚗 Car", desc: "Sedan, SUV, Hatchback" },
  { value: "Bike", label: "🛵 Bike", desc: "Motorcycle / Scooter" },
];

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

  // Pricing Model & Pass Selection
  const isFacilityDailyOnly = parking?.pricing_type === "DAILY_PASS";
  const hasDailyOption = parking?.pricing_type === "DAILY_PASS" || parking?.pricing_type === "BOTH";
  const [passType, setPassType] = useState(isFacilityDailyOnly ? "DAILY_PASS" : "HOURLY");

  useEffect(() => {
    if (parking?.pricing_type === "DAILY_PASS") {
      setPassType("DAILY_PASS");
    }
  }, [parking]);

  // State & Loading
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // Dynamic rate from parking API, fallback to 50
  const HOURLY_RATE = parking?.price_per_hour || parking?.hourly_rate || 50;
  const DAILY_RATE = parseFloat(parking?.daily_rate) || 10;
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
      if (response.data?.pricing_type === "DAILY_PASS") {
        setPassType("DAILY_PASS");
      }
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
      const addedVehicle = response.data?.vehicle || response.data;
      showToast("Vehicle registered successfully!", "success");
      setVehicles((prev) => [...prev, addedVehicle]);
      setSelectedVehicle(addedVehicle);
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
  const isDaily = passType === "DAILY_PASS";
  const subtotal = isDaily ? DAILY_RATE : selectedDurationHours * HOURLY_RATE;
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

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Validate before opening payment
  const handleConfirmBooking = () => {
    if (!selectedSlot) {
      showToast("Please select an available parking slot.", "error");
      return;
    }
    if (!selectedVehicle) {
      showToast("Please add and select a vehicle before booking.", "error");
      return;
    }

    const supported = (parking?.supported_vehicles || "BOTH").toUpperCase();
    const vehType = (selectedVehicle.vehicle_type || "Car").toUpperCase();
    if (supported === "BIKE" && vehType.includes("CAR")) {
      showToast("⚠️ This location only accommodates Two-Wheelers / Bikes. Please select a bike.", "error");
      return;
    }
    if (supported === "CAR" && vehType.includes("BIKE")) {
      showToast("⚠️ This location only accommodates Cars. Please select a car.", "error");
      return;
    }

    setShowPaymentModal(true);
  };

  // Execute booking after payment authorization
  const handlePaymentSuccess = async (paymentData) => {
    try {
      setBookingLoading(true);

      const payload = {
        parking_id: parseInt(id),
        parking_location_id: parseInt(id),
        slot_id: selectedSlot.id,
        vehicle_id: selectedVehicle.id,
        vehicle_number: selectedVehicle.vehicle_number,
        vehicle_type: selectedVehicle.vehicle_type,
        booking_date: bookingDate,
        start_time: isDaily ? "Full Day" : startTime,
        end_time: isDaily ? (parking?.last_exit_time || "11:00 PM") : endTime,
        duration_hours: isDaily ? 24 : selectedDurationHours,
        amount: grandTotal,
        total_amount: grandTotal,
        pass_type: passType,
        payment_id: paymentData?.payment_id,
        payment_method: paymentData?.method,
      };

      const response = await API.post("/booking/create", payload);
      const bookedData = response.data?.booking || {
        id: Math.floor(1000 + Math.random() * 9000),
        ...payload,
        parking_name: parking?.name || "ParkEase Central",
        slot_number: selectedSlot?.slot_number,
        last_exit_rule: parking?.last_exit_time || "11:00 PM",
      };

      setShowPaymentModal(false);
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
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
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
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
              toast.type === "error"
                ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
                : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 transition shadow-xs cursor-pointer"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              Instant Booking
            </Badge>
            <Badge variant="success" size="sm" dot>
              Live Spots
            </Badge>
          </div>
        </div>

        {/* PARKING LOCATION HEADER CARD */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-black uppercase tracking-wider">
                ParkEase
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Spot Locking
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {parking?.name || "Parking Location"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
              <FiMapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{parking?.address || parking?.location || "City Location"}</span>
            </p>

            {/* AMENITIES */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {parking?.has_security_guard && (
                <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                  🛡️ Security Guard
                </span>
              )}
              {parking?.has_cctv && (
                <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                  📹 CCTV Monitored
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-right min-w-[140px] shrink-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Rate</p>
            {HOURLY_RATE === 0 ? (
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">FREE</p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
                ₹{HOURLY_RATE}<span className="text-xs text-zinc-400 font-normal">/hr</span>
              </p>
            )}
          </div>
        </div>

        {/* 3-STEP RESERVATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: PRICING PLAN & DURATION */}
            <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white">Booking Plan & Duration</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose between flat day pass or hourly booking.</p>
                  </div>
                </div>
              </div>

              {/* Pass Mode Toggle (if facility supports both or day pass) */}
              {hasDailyOption && !isFacilityDailyOnly && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPassType("HOURLY")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      passType === "HOURLY"
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md"
                        : "bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <p className="text-xs font-black">⏱️ Hourly Booking</p>
                    <p className={`text-[11px] mt-1 ${passType === "HOURLY" ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
                      ₹{HOURLY_RATE}/hr · Choose exact hours
                    </p>
                  </div>

                  <div
                    onClick={() => setPassType("DAILY_PASS")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      passType === "DAILY_PASS"
                        ? "bg-emerald-500 text-black border-emerald-500 shadow-md font-bold"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500"
                    }`}
                  >
                    <p className="text-xs font-black">🎟️ Full Day Pass (₹{DAILY_RATE})</p>
                    <p className={`text-[11px] mt-1 ${passType === "DAILY_PASS" ? "text-black/80" : "text-zinc-500 dark:text-zinc-400"}`}>
                      Unlimited entries & exits all day
                    </p>
                  </div>
                </div>
              )}

              {/* Day Pass Curfew Banner */}
              {passType === "DAILY_PASS" && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Flat Daily Pass — ₹{DAILY_RATE} for Entire Day</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    🚗 <strong>Unlimited Entry & Exit:</strong> You can drive in and out freely all day using your QR pass.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    ⚠️ <strong>Closing Time:</strong> Final exit must be before{" "}
                    <span className="underline">{parking?.last_exit_time || "11:00 PM"}</span> tonight.
                  </p>
                </div>
              )}

              {/* DURATION PILLS (Only for Hourly) */}
              {passType === "HOURLY" && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Quick Duration</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 6, 8].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => handleDurationChange(hrs)}
                        className={`py-3 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                          selectedDurationHours === hrs
                            ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md scale-105"
                            : "bg-zinc-100 dark:bg-zinc-800/80 border-transparent text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {hrs} {hrs === 1 ? "Hour" : "Hours"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DATE & TIME */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Date</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                    <FiCalendar className="text-zinc-500 dark:text-zinc-400 w-4 h-4" />
                    <input
                      type="date"
                      value={bookingDate}
                      min={formattedToday}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-transparent text-xs text-zinc-900 dark:text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {passType === "DAILY_PASS" ? "First Entry From" : "Entry Time"}
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                    <FiClock className="text-zinc-500 dark:text-zinc-400 w-4 h-4" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-transparent text-xs text-zinc-900 dark:text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {passType === "DAILY_PASS" ? "Final Gate Exit" : "Estimated Exit"}
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                    <FiClock className="text-zinc-400 w-4 h-4" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {passType === "DAILY_PASS" ? (parking?.last_exit_time || "11:00 PM") : endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: SELECT VEHICLE */}
            <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white">Vehicle</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Select which car or bike you are parking.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-xs cursor-pointer active:scale-95"
                >
                  + Add Vehicle
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    No vehicle added yet. Add one to generate your pass.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black cursor-pointer"
                  >
                    + Add Vehicle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicles.map((veh) => {
                    const isSelected = selectedVehicle?.id === veh.id;
                    const supported = (parking?.supported_vehicles || "BOTH").toUpperCase();
                    const vType = (veh.vehicle_type || "Car").toUpperCase();
                    const isIncompatible =
                      (supported === "BIKE" && vType.includes("CAR")) ||
                      (supported === "CAR" && vType.includes("BIKE"));

                    return (
                      <div
                        key={veh.id}
                        onClick={() => {
                          if (isIncompatible) {
                            showToast(
                              supported === "BIKE"
                                ? "This location only accepts Bikes/Scooters."
                                : "This location only accepts Cars.",
                              "error"
                            );
                          }
                          setSelectedVehicle(veh);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? isIncompatible
                              ? "bg-rose-500/10 border-rose-500 shadow-sm"
                              : "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                            : isIncompatible
                            ? "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100"
                            : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="license-plate text-xs">
                            <span className="license-plate-ind">IND</span>
                            <span>{veh.vehicle_number}</span>
                          </div>
                          <div>
                            <span
                              className={`text-xs font-bold block truncate ${
                                isSelected && !isIncompatible
                                  ? "text-white dark:text-black"
                                  : "text-zinc-700 dark:text-zinc-200"
                              }`}
                            >
                              {veh.vehicle_name || veh.vehicle_type || "Vehicle"}
                            </span>
                            {isIncompatible && (
                              <span className="text-[10px] text-rose-500 font-bold block">
                                Incompatible with this lot
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && !isIncompatible && (
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-xs shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 3: PICK SPOT (2D VISUAL LOT MAP & GRID) */}
            <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white">Select Spot on Layout</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Click an available spot on the 2D layout or switch to quick grid.</p>
                  </div>
                </div>

                {selectedSlot && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-bold hidden sm:inline">Selected:</span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500 text-black text-xs font-black font-mono shadow-xs">
                      Spot {selectedSlot.slot_number} ✓
                    </span>
                  </div>
                )}
              </div>

              {/* 2D VISUAL LOT PICKER */}
              {slots.length === 0 ? (
                <p className="text-center py-8 text-sm text-zinc-500 font-bold">
                  No spots configured yet.
                </p>
              ) : (
                <ParkingLotVisualizer
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(slot) => setSelectedSlot(slot)}
                  parkingName={parking?.name}
                />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CHECKOUT SUMMARY CARD */}
          <div className="sticky top-24">
            <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 shadow-xl space-y-5">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                Booking Summary
              </h3>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Plan:</span>
                  <span className="font-black text-zinc-900 dark:text-white">
                    {passType === "DAILY_PASS" ? "🎟️ Full-Day Pass" : "⏱️ Hourly"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Spot:</span>
                  <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedSlot ? selectedSlot.slot_number : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Vehicle:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">
                    {selectedVehicle?.vehicle_number || "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Validity:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {passType === "DAILY_PASS" ? `Until ${parking?.last_exit_time || "11:00 PM"}` : `${startTime} – ${endTime}`}
                  </span>
                </div>
              </div>

              {/* PRICING */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>{passType === "DAILY_PASS" ? "Day Pass:" : `Parking (${selectedDurationHours}h):`}</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">
                    {subtotal === 0 ? "FREE" : `₹${subtotal}`}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>Convenience Fee:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">₹{PLATFORM_FEE}</span>
                </div>
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-base">
                  <span className="font-black text-zinc-900 dark:text-white">Total:</span>
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">₹{grandTotal}</span>
                </div>
              </div>

              {passType === "DAILY_PASS" && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Unlimited Entries & Exits until {parking?.last_exit_time || "11:00 PM"}
                </div>
              )}

              {/* CONFIRM BUTTON (UBER-INSPIRED) */}
              <button
                type="button"
                disabled={!selectedSlot || !selectedVehicle || bookingLoading}
                onClick={handleConfirmBooking}
                className="w-full py-4 px-6 rounded-full bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-black text-base font-black shadow-xl transition-all active:scale-[0.98] text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{bookingLoading ? "Reserving Spot..." : "Reserve Spot Now"}</span>
                <FiArrowRight className="w-5 h-5" />
              </button>

              {(!selectedSlot || !selectedVehicle) && (
                <p className="text-xs text-rose-500 font-bold text-center">
                  {!selectedVehicle ? "⚠ Please choose your vehicle" : "⚠ Please select a parking spot"}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ADD/EDIT MODAL (SAME AS MY VEHICLES) */}
      <Modal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        title="Add New Vehicle"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              License Plate Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH-01-AB-1234"
              value={newVehicle.vehicle_number}
              onChange={(e) =>
                setNewVehicle({
                  ...newVehicle,
                  vehicle_number: e.target.value.toUpperCase(),
                })
              }
              className="pe-input font-mono tracking-widest text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Vehicle Nickname / Model
            </label>
            <input
              type="text"
              placeholder="e.g. White Creta, Red Pulsar, Nexon EV"
              value={newVehicle.vehicle_name}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })
              }
              className="pe-input text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Vehicle Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setNewVehicle({ ...newVehicle, vehicle_type: t.value })
                  }
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    newVehicle.vehicle_type === t.value
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xl leading-none">{t.label.split(" ")[0]}</p>
                  <p className="text-xs font-black mt-1">{t.label.split(" ")[1]}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAddVehicleModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={addingVehicle}>
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* PAYMENT GATEWAY MODAL */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={grandTotal}
        bookingDetails={{
          parking_name: parking?.name,
          slot_number: selectedSlot?.slot_number,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        isOpen={!!successModal}
        onClose={() => {}}
        title="Booking Confirmed!"
        maxWidth="max-w-md"
        showClose={false}
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm text-2xl font-bold">
            ✓
          </div>

          <div>
            <h4 className="text-xl font-black text-zinc-900 dark:text-white">
              Booking #{successModal?.id} Ready
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Your spot <span className="font-black text-zinc-900 dark:text-white">{successModal?.slot_number}</span> has been confirmed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-2.5 text-left">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Plan Type</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {successModal?.pass_type === "DAILY_PASS" ? "🎟️ Full-Day Pass" : "⏱️ Hourly"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Date</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {(() => {
                  const dVal = successModal?.booking_date || bookingDate;
                  try {
                    const d = new Date(dVal);
                    if (!isNaN(d.getTime())) {
                      return d.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    }
                  } catch (_) {}
                  return dVal;
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">
                {successModal?.pass_type === "DAILY_PASS" ? "Last Exit Rule" : "Time Window"}
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {successModal?.pass_type === "DAILY_PASS"
                  ? `Must exit before ${successModal?.last_exit_rule || parking?.last_exit_time || "11:00 PM"}`
                  : `${successModal?.start_time} – ${successModal?.end_time}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Vehicle</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-white">{successModal?.vehicle_number || selectedVehicle?.vehicle_number}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-500 dark:text-zinc-400">Total Paid</span>
              <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">₹{grandTotal}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate("/customer/my-bookings")}
            >
              My Bookings
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                navigate(`/customer/qr?booking=${successModal?.id}`, {
                  state: { booking: successModal },
                })
              }
            >
              View QR Pass →
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}