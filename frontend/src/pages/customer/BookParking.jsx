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

        {/* UBER FACILITY HEADER */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[11px] font-black uppercase">
                ParkEase
              </span>
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Spot Locking
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              {parking?.name || "ParkEase Facility"}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1.5 font-medium">
              <FiMapPin className="w-4 h-4 text-black shrink-0" />
              <span>{parking?.address || parking?.location || "City Location"}</span>
            </p>

            {/* AMENITIES */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {parking?.has_ev && (
                <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-black text-xs font-bold border border-neutral-200">
                  ⚡ EV Ready
                </span>
              )}
              {parking?.has_security_guard && (
                <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-black text-xs font-bold border border-neutral-200">
                  🛡️ Guarded
                </span>
              )}
              {parking?.has_cctv && (
                <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-black text-xs font-bold border border-neutral-200">
                  📹 CCTV
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-right min-w-[130px]">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Rate</p>
            {HOURLY_RATE === 0 ? (
              <p className="text-2xl font-black text-emerald-600">FREE</p>
            ) : (
              <p className="text-2xl font-black text-black">
                ₹{HOURLY_RATE}<span className="text-xs text-neutral-400 font-normal">/hr</span>
              </p>
            )}
          </div>
        </div>

        {/* 3-STEP RESERVATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: DURATION */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Duration</h3>
                  <p className="text-xs text-neutral-500">Select hours needed.</p>
                </div>
              </div>

              {/* DURATION PILLS */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 6, 8].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => handleDurationChange(hrs)}
                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                      selectedDurationHours === hrs
                        ? "bg-black text-white border-black shadow-md scale-105"
                        : "bg-neutral-100 border-transparent text-black hover:bg-neutral-200"
                    }`}
                  >
                    {hrs} {hrs === 1 ? "Hour" : "Hours"}
                  </button>
                ))}
              </div>

              {/* DATE & TIME */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Date</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
                    <FiCalendar className="text-black w-4 h-4" />
                    <input
                      type="date"
                      value={bookingDate}
                      min={formattedToday}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-transparent text-xs text-black font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Entry Time</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
                    <FiClock className="text-black w-4 h-4" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-transparent text-xs text-black font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Estimated Exit</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500">
                    <FiClock className="text-neutral-400 w-4 h-4" />
                    <span className="text-xs font-bold text-black">{endTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: SELECT VEHICLE */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-black text-black">Vehicle</h3>
                    <p className="text-xs text-neutral-500">Select which car or bike is parking.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-black hover:bg-neutral-800 transition"
                >
                  + Add Vehicle
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs font-bold text-neutral-700">
                    No vehicle added yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold"
                  >
                    + Add Vehicle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicles.map((veh) => {
                    const isSelected = selectedVehicle?.id === veh.id;
                    return (
                      <div
                        key={veh.id}
                        onClick={() => setSelectedVehicle(veh)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-neutral-50 border-black shadow-sm"
                            : "bg-white border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="license-plate text-xs">
                            <span className="license-plate-ind">IND</span>
                            <span>{veh.vehicle_number}</span>
                          </div>
                          <span className="text-xs font-bold text-neutral-600 truncate">
                            {veh.vehicle_name || veh.vehicle_type || "Vehicle"}
                          </span>
                        </div>

                        {isSelected && (
                          <FiCheckCircle className="w-5 h-5 text-black shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 3: PICK SPOT */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-black text-black">Select Spot</h3>
                    <p className="text-xs text-neutral-500">Tap an available spot to lock it.</p>
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "EV", label: "⚡ EV" },
                    { id: "CAR", label: "🚗 Car" },
                    { id: "BIKE", label: "🏍️ Bike" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSlotFilter(filter.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        slotFilter === filter.id
                          ? "bg-black text-white shadow-sm"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SLOTS GRID */}
              {slots.length === 0 ? (
                <p className="text-center py-6 text-sm text-neutral-500 font-bold">
                  No slots configured yet.
                </p>
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
                        className={`relative p-3.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                          isSelected
                            ? "bg-black border-black text-white shadow-md scale-105"
                            : isOccupied
                            ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-50"
                            : "bg-white border-neutral-300 hover:border-black text-black"
                        }`}
                      >
                        {slot.is_ev && (
                          <span className="absolute top-1.5 right-1.5 text-[10px]">⚡</span>
                        )}
                        <span className="text-sm font-black">{slot.slot_number}</span>
                        <span
                          className={`text-[9px] font-black uppercase ${
                            isSelected ? "text-neutral-200" : isOccupied ? "text-neutral-400" : "text-emerald-600"
                          }`}
                        >
                          {isSelected ? "Selected" : isOccupied ? "Busy" : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: UBER CHECKOUT CARD */}
          <div>
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm sticky top-24 space-y-4">
              <h3 className="text-lg font-black text-black border-b border-neutral-100 pb-3">
                Fare Summary
              </h3>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Spot:</span>
                  <span className="font-black text-black">
                    {selectedSlot ? selectedSlot.slot_number : "None selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vehicle:</span>
                  <span className="font-bold text-black">
                    {selectedVehicle?.vehicle_number || "None selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Duration:</span>
                  <span className="font-bold text-black">
                    {startTime} - {endTime} ({selectedDurationHours}h)
                  </span>
                </div>
              </div>

              {/* PRICING */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Parking ({selectedDurationHours}h):</span>
                  <span className="font-bold text-black">
                    {HOURLY_RATE === 0 ? "FREE" : `₹${subtotal}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Platform Fee:</span>
                  <span className="font-bold text-black">₹{PLATFORM_FEE}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-base">
                  <span className="font-black text-black">Total:</span>
                  <span className="text-2xl font-black text-black">₹{grandTotal}</span>
                </div>
              </div>

              {/* UBER JET BLACK CONFIRM BUTTON */}
              <button
                type="button"
                disabled={!selectedSlot || !selectedVehicle || bookingLoading}
                onClick={handleConfirmBooking}
                className="w-full py-4 px-4 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-black shadow-md transition active:scale-95 text-center"
              >
                {bookingLoading ? "Locking Spot..." : "Confirm Reservation &rarr;"}
              </button>

              {(!selectedSlot || !selectedVehicle) && (
                <p className="text-xs text-rose-600 font-bold text-center">
                  {!selectedVehicle ? "⚠ Please choose a vehicle" : "⚠ Please pick a spot"}
                </p>
              )}
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