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
  FiX,
  FiInfo,
  FiTag,
  FiChevronRight,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

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

  const HOURLY_RATE = 50;
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

      // If backend returned empty, generate standard demo slots
      if (allSlots.length === 0) {
        allSlots = Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          slot_number: `A-${i + 1}`,
          is_ev: i % 4 === 0,
          vehicle_type: i % 4 === 0 ? "EV" : i % 5 === 0 ? "Bike" : "Car",
          is_occupied: i === 2 || i === 5,
          status: i === 2 || i === 5 ? "occupied" : "available",
        }));
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
      // Fallback slots
      const fallback = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        slot_number: `P-${i + 1}`,
        is_ev: i === 0,
        vehicle_type: "Car",
        status: "available",
      }));
      setSlots(fallback);
      setSelectedSlot(fallback[0]);
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
    setEndTime(`${String(endH).padStart(2, "0")}:${String(startM || 0).padStart(2, "0")}`);
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

    try {
      setBookingLoading(true);

      const payload = {
        parking_id: parseInt(id),
        slot_id: selectedSlot.id,
        vehicle_id: selectedVehicle?.id || null,
        vehicle_number: selectedVehicle?.vehicle_number || "MH-01-AB-1234",
        vehicle_type: selectedVehicle?.vehicle_type || "Car",
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
        slot_number: selectedSlot.slot_number,
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
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Reserve Parking Spot
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {parking?.name || "ParkEase Smart Facility"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <FiMapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {parking?.address || parking?.location || "Premium City Hub, Zone 1"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-slate-400 font-semibold uppercase">
                Rate
              </p>
              <p className="text-2xl font-extrabold text-indigo-600">
                ₹{HOURLY_RATE}
                <span className="text-xs text-slate-400 font-normal">/hour</span>
              </p>
            </div>
          </div>
        </div>

        {/* BOOKING WORKFLOW GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: CONFIGURATION & SLOT SELECTION */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: TIME & VEHICLE CONFIG */}
            <Card className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Duration & Vehicle
                    </h3>
                    <p className="text-xs text-slate-500">
                      Choose when and which vehicle you are parking.
                    </p>
                  </div>
                </div>
              </div>

              {/* DURATION PRESET BUTTONS */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Duration (Hours)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 6, 8].map((hrs) => (
                    <button
                      key={hrs}
                      onClick={() => handleDurationChange(hrs)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedDurationHours === hrs
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {hrs} {hrs === 1 ? "Hr" : "Hrs"}
                    </button>
                  ))}
                </div>
              </div>

              {/* DATE & TIME PICKERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Date
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                    <FiCalendar className="text-slate-400 w-4 h-4" />
                    <input
                      type="date"
                      value={bookingDate}
                      min={formattedToday}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Start Time
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                    <FiClock className="text-slate-400 w-4 h-4" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        const [startH, startM] = e.target.value.split(":").map(Number);
                        const endH = (startH + selectedDurationHours) % 24;
                        setEndTime(`${String(endH).padStart(2, "0")}:${String(startM || 0).padStart(2, "0")}`);
                      }}
                      className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Estimated Exit
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
                    <FiClock className="text-slate-400 w-4 h-4" />
                    <span className="text-xs font-bold text-slate-700">
                      {endTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* VEHICLE PICKER */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Vehicle
                  </label>
                  <button
                    onClick={() => setShowAddVehicleModal(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Add New Vehicle</span>
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span>No vehicles registered. Add one for quick pass issuance.</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddVehicleModal(true)}
                    >
                      + Add
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
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-50/80 border-indigo-500 shadow-xs"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              <FiTruck />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {veh.vehicle_number}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {veh.vehicle_name || veh.vehicle_type || "Standard Vehicle"}
                              </p>
                            </div>
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
            </Card>

            {/* STEP 2: INTERACTIVE VISUAL SLOT MATRIX */}
            <Card className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Select Your Spot
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tap an available slot on the live map.
                    </p>
                  </div>
                </div>

                {/* Filter slot types */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "ALL", label: "All Spots" },
                    { id: "EV", label: "⚡ EV Only" },
                    { id: "CAR", label: "Car" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSlotFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        slotFilter === filter.id
                          ? "bg-white text-indigo-600 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SLOT LEGEND */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
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
                  <FiZap className="w-3.5 h-3.5 text-amber-500" />
                  <span>EV Charger</span>
                </div>
              </div>

              {/* INTERACTIVE SLOT MAP GRID */}
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
                      disabled={isOccupied}
                      onClick={() => setSelectedSlot(slot)}
                      className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 border-2 cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                          : isOccupied
                          ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
                          : "bg-white border-emerald-400/80 hover:border-emerald-500 text-slate-800 hover:shadow-xs"
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

                      <span className="text-xs font-extrabold tracking-tight">
                        {slot.slot_number}
                      </span>

                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isSelected
                            ? "text-indigo-100"
                            : isOccupied
                            ? "text-slate-400"
                            : "text-emerald-600"
                        }`}
                      >
                        {isSelected ? "Selected" : isOccupied ? "Busy" : "Free"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: FARE SUMMARY & CHECKOUT */}
          <div className="space-y-6">
            <Card className="sticky top-24 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Fare Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Transparent breakdown & instant pass generation.
                </p>
              </div>

              {/* SELECTION RECAP */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Facility</span>
                  <span className="font-bold text-slate-800">
                    {parking?.name || "ParkEase Hub"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Selected Spot</span>
                  <span className="font-bold text-indigo-600">
                    {selectedSlot ? selectedSlot.slot_number : "None Selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="font-bold text-slate-800">
                    {selectedVehicle?.vehicle_number || "MH-01-AB-1234"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Time Window</span>
                  <span className="font-bold text-slate-800">
                    {startTime} - {endTime} ({selectedDurationHours}h)
                  </span>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>
                    Parking Rate ({selectedDurationHours}h × ₹{HOURLY_RATE})
                  </span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>SaaS Convenience Fee</span>
                    <FiInfo className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-semibold text-slate-800">
                    ₹{PLATFORM_FEE}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    Total Amount
                  </span>
                  <span className="text-xl font-extrabold text-indigo-600">
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* CHECKOUT ACTION */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={bookingLoading}
                disabled={!selectedSlot}
                onClick={handleConfirmBooking}
              >
                Confirm & Get Digital Pass
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant QR pass guaranteed upon confirmation.</span>
              </div>
            </Card>
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
        onClose={() => navigate("/customer/my-bookings")}
        title="Reservation Confirmed! 🎉"
        maxWidth="max-w-md"
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
              <span className="font-bold text-slate-800">{successModal?.start_time} - {successModal?.end_time}</span>
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