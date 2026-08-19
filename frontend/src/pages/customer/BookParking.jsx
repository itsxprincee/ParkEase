import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaParking,
  FaCar,
  FaMotorcycle,
  FaBolt,
  FaShieldAlt,
  FaVideo,
  FaWarehouse,
  FaPlus,
  FaInfoCircle,
  FaReceipt,
  FaTimes,
  FaDirections,
  FaTag,
  FaChevronRight,
  FaStar,
} from "react-icons/fa";
import API from "../../api/axios";

function BookParking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Facility & Slots
  const [parking, setParking] = useState(location.state?.parking || null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotFilter, setSlotFilter] = useState("ALL"); // ALL, EV

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
        error?.response?.data?.detail || "Unable to load parking facility details.",
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

      const availableSlots = allSlots.filter(
        (slot) => String(slot.status || "").trim().toUpperCase() === "AVAILABLE"
      );

      setSlots(availableSlots);
      if (availableSlots.length > 0 && !selectedSlot) {
        setSelectedSlot(availableSlots[0]);
      }
    } catch (error) {
      console.error("Failed to load available slots:", error);
      setSlots([]);
      showToast(
        error?.response?.data?.detail || "Unable to load available parking slots.",
        "error"
      );
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

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number.trim()) {
      showToast("Please enter your vehicle license plate number.", "error");
      return;
    }

    try {
      setAddingVehicle(true);
      await API.post("/vehicles/add", {
        vehicle_number: newVehicle.vehicle_number.trim().toUpperCase(),
        vehicle_type: newVehicle.vehicle_type,
        vehicle_name: newVehicle.vehicle_name.trim() || `${newVehicle.vehicle_type}`,
      });

      showToast("Vehicle registered successfully!", "success");
      setShowAddVehicleModal(false);
      setNewVehicle({ vehicle_number: "", vehicle_type: "Car", vehicle_name: "" });

      const refreshed = await API.get("/vehicles/my");
      const list = Array.isArray(refreshed.data) ? refreshed.data : [];
      setVehicles(list);
      const added = list.find(
        (v) => v.vehicle_number === newVehicle.vehicle_number.trim().toUpperCase()
      ) || list[0];
      setSelectedVehicle(added);
    } catch (error) {
      console.error("Add vehicle error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to add vehicle.",
        "error"
      );
    } finally {
      setAddingVehicle(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadParking(), loadSlots(), loadVehicles()]);
      setLoading(false);
    };

    loadData();
  }, [id]);

  const applyDurationPreset = (hours) => {
    setSelectedDurationHours(hours);
    const [startH, startM] = startTime.split(":").map(Number);
    const endH = (startH + hours) % 24;
    setEndTime(`${String(endH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`);
  };

  const durationHours = useMemo(() => {
    if (!startTime || !endTime) return selectedDurationHours || 1;

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (diffMinutes <= 0) {
      diffMinutes += 24 * 60;
    }

    const calculated = Math.ceil(diffMinutes / 60);
    return Math.max(calculated, 1);
  }, [startTime, endTime, selectedDurationHours]);

  const subtotal = durationHours * HOURLY_RATE;
  const totalAmount = subtotal + PLATFORM_FEE;

  const filteredSlots = useMemo(() => {
    if (slotFilter === "EV") {
      return slots.filter(
        (s) =>
          s.slot_number.toUpperCase().includes("EV") ||
          s.slot_number.toUpperCase().includes("E")
      );
    }
    return slots;
  }, [slots, slotFilter]);

  const handleBookParking = async () => {
    if (!selectedSlot) {
      showToast("Please select a parking bay/slot to reserve.", "error");
      return;
    }

    if (!startTime || !endTime) {
      showToast("Please specify the reservation time window.", "error");
      return;
    }

    try {
      setBookingLoading(true);

      const response = await API.post("/booking/create", {
        parking_location_id: Number(id),
        slot_id: Number(selectedSlot.id),
        start_time: `${bookingDate} ${startTime}`,
        end_time: `${bookingDate} ${endTime}`,
        amount: totalAmount,
      });

      if (response.data?.booking || response.data?.success || response.data?.message) {
        const createdBooking = response.data.booking || {
          id: response.data.booking_id || "NEW",
          slot_number: selectedSlot.slot_number,
          parking_name: parking?.name,
          amount: totalAmount,
          start_time: startTime,
          end_time: endTime,
        };

        setSuccessModal(createdBooking);
      }
    } catch (error) {
      console.error("Booking failed:", error);
      showToast(
        error?.response?.data?.detail || "Unable to complete reservation. Please try again.",
        "error"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin" />
          <p className="mt-4 text-slate-600 font-medium text-sm">
            Loading parking reservation details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px] animate-fadeIn">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-xl backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}
          >
            <div className="text-xl shrink-0 mt-0.5">
              {toast.type === "success" ? <FaCheckCircle className="text-emerald-600" /> : <FaExclamationTriangle className="text-red-600" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">
                {toast.type === "success" ? "Success" : "Notice"}
              </p>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 transition">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-18 sm:h-20 flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center text-sm shadow-sm"
              >
                <FaArrowLeft />
              </button>
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                  Reserve Parking Slot
                </span>
                <h1 className="font-extrabold text-slate-900 text-base truncate max-w-[220px] sm:max-w-md">
                  {parking?.name || "Smart Parking Facility"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live: {slots.length} Free Bays
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: 8 COLS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. FACILITY OVERVIEW CARD */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
                
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md shadow-blue-500/20">
                    <FaParking />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {parking?.name || "Parking Location"}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase">
                        Verified
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                      <FaMapMarkerAlt className="text-blue-600 shrink-0" />
                      {parking?.address || "Address not available"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <FaShieldAlt className="text-emerald-600" /> 24/7 Security
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <FaVideo className="text-blue-600" /> CCTV
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <FaWarehouse className="text-amber-600" /> Covered
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <FaBolt className="text-teal-600" /> EV Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Base Rate
                  </span>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">
                    ₹{HOURLY_RATE}
                    <span className="text-xs text-slate-500 font-normal"> / hour</span>
                  </div>
                </div>

              </div>
            </section>

            {/* 2. SELECT VEHICLE */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FaCar className="text-blue-600" /> 1. Select Vehicle
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose which vehicle you are bringing today
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FaPlus /> Add Vehicle
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                  <p className="text-xs text-slate-600">
                    No registered vehicles found. Add your vehicle for quick entry.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(true)}
                    className="mt-2.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    + Register Vehicle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicle?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVehicle(v)}
                        className={`p-3.5 rounded-2xl border text-left transition relative flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {v.vehicle_type === "Bike" ? <FaMotorcycle /> : <FaCar />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate text-slate-900">
                            {v.vehicle_name || v.vehicle_type}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-500 tracking-wider">
                            {v.vehicle_number}
                          </p>
                        </div>
                        {isSelected && (
                          <FaCheckCircle className="text-blue-600 shrink-0 text-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. TIME WINDOW & DURATION */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <FaClock className="text-blue-600" /> 2. Reservation Time & Duration
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Set when you arrive and how long you plan to stay
              </p>

              {/* DURATION PRESETS */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[1, 2, 3, 4, 8].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => applyDurationPreset(hrs)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedDurationHours === hrs
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {hrs === 8 ? "8 Hrs (Day Pass)" : `${hrs} ${hrs === 1 ? "Hour" : "Hours"}`}
                  </button>
                ))}
              </div>

              {/* INPUTS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    min={formattedToday}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs text-slate-700">
                <span>Calculated Duration:</span>
                <span className="font-bold text-blue-700">
                  {durationHours} {durationHours === 1 ? "Hour" : "Hours"} reservation
                </span>
              </div>
            </section>

            {/* 4. SELECT PARKING BAY */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FaTag className="text-blue-600" /> 3. Select Parking Bay
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose your exact reserved parking spot
                  </p>
                </div>

                {/* FILTER PILLS */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      slotFilter === "ALL"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({slots.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("EV")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                      slotFilter === "EV"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FaBolt className="text-teal-500" /> EV Ready
                  </button>
                </div>
              </div>

              {/* SLOTS GRID */}
              {filteredSlots.length === 0 ? (
                <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-center">
                  <FaExclamationTriangle className="mx-auto text-3xl text-red-500 mb-2" />
                  <h4 className="font-bold text-slate-900 text-sm">No Matching Slots Available</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Try switching filters or check another location.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isEV = slot.slot_number.toUpperCase().includes("EV") || slot.slot_number.toUpperCase().includes("E");

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3.5 rounded-2xl border text-center transition relative flex flex-col items-center justify-center gap-1 group ${
                          isSelected
                            ? "bg-gradient-to-b from-blue-600 to-indigo-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.03]"
                            : "bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        {isEV && (
                          <span className={`text-[10px] absolute top-1.5 right-1.5 ${isSelected ? "text-teal-200" : "text-teal-600"}`}>
                            <FaBolt />
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          Bay
                        </span>
                        <span className="font-extrabold text-base tracking-tight">
                          {slot.slot_number}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          Available
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY (4 COLS) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <FaReceipt className="text-blue-600" /> Reservation Summary
                </h3>

                <div className="py-4 space-y-3 text-xs border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Facility</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[160px]">
                      {parking?.name || "Facility"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Reserved Slot</span>
                    <span className="font-black text-blue-600 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200">
                      {selectedSlot ? selectedSlot.slot_number : "Not Selected"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedVehicle ? selectedVehicle.vehicle_number : "Standard Vehicle"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Schedule</span>
                    <span className="font-bold text-slate-800">
                      {bookingDate} ({startTime} - {endTime})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-bold text-slate-800">
                      {durationHours} Hours
                    </span>
                  </div>
                </div>

                {/* PRICE BREAKDOWN */}
                <div className="py-4 space-y-2.5 text-xs border-b border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Parking Rate ({durationHours} hrs × ₹{HOURLY_RATE})</span>
                    <span className="text-slate-800 font-semibold">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Platform & Security Fee</span>
                    <span className="text-slate-800 font-semibold">₹{PLATFORM_FEE}</span>
                  </div>
                </div>

                {/* TOTAL AMOUNT */}
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Payable
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      ₹{totalAmount}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Guaranteed Bay
                  </span>
                </div>

                {/* CTA BUTTON */}
                <button
                  type="button"
                  onClick={handleBookParking}
                  disabled={bookingLoading || !selectedSlot}
                  className="mt-6 w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Confirm & Reserve Bay <FaChevronRight className="text-xs" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  🔒 FastPass QR Code generated instantly upon booking
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New Vehicle</h3>
                <p className="text-xs text-slate-500">Add vehicle for fast parking entry</p>
              </div>
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  License Plate Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-01-AB-1234"
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle Type
                </label>
                <select
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Car">Car (4-Wheeler)</option>
                  <option value="Bike">Bike (2-Wheeler)</option>
                  <option value="SUV">SUV / Van</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Tesla / Honda City"
                  value={newVehicle.vehicle_name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingVehicle}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm"
                >
                  {addingVehicle ? "Adding..." : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {successModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaCheckCircle />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Reservation Confirmed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your parking slot is reserved. Access your FastPass QR ticket anytime.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Slot:</span>
                <span className="font-bold text-blue-600">{successModal.slot_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-slate-800">₹{successModal.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-bold text-slate-800">{successModal.start_time} - {successModal.end_time}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/customer/qr?booking=${successModal.id}`)}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              Open Digital QR Pass
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default BookParking;