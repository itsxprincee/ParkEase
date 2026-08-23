import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiLayers,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiClock,
  FiVideo,
  FiShield,
  FiZap,
  FiKey,
  FiCheck,
  FiTrash2,
  FiTrendingUp,
  FiCamera,
  FiArrowRight,
  FiEye,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import LocationPickerMap from "../../components/LocationPickerMap";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-white text-[#e11900] border-[#fca5a5]"
            : "bg-white text-[#05944f] border-[#86efac]"
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

const CITY_PRESETS = [
  { name: "Mumbai (BKC)", lat: "19.0657", lng: "72.8687" },
  { name: "Delhi (Connaught)", lat: "28.6315", lng: "77.2167" },
  { name: "Bengaluru (Indiranagar)", lat: "12.9784", lng: "77.6408" },
  { name: "Hyderabad (Hitec City)", lat: "17.4435", lng: "78.3772" },
  { name: "Pune (Koregaon)", lat: "18.5362", lng: "73.8939" },
];

const STEPS = [
  { id: 1, title: "Identity & Location", desc: "Name, address & exact map pin" },
  { id: 2, title: "Capacity & Pricing", desc: "Slots, rates & amenities" },
  { id: 3, title: "Photo & Preview", desc: "Entrance photo & live preview" },
];

export default function AddParking() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "19.0760",
    longitude: "72.8777",
    total_slots: "25",
    pricing_type: "HOURLY", // "HOURLY" | "DAILY_PASS" | "BOTH"
    hourly_rate: "50",
    daily_rate: "10",
    allow_multi_entry: true,
    last_exit_time: "11:00 PM",
    has_ev: true,
    has_cctv: true,
    has_security_guard: true,
    has_covered_roof: true,
    is_24_7: true,
    has_valet: false,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File is too large. Max 10MB.", "error");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Projected earnings calculation
  const projectedRevenue = useMemo(() => {
    const slots = parseInt(formData.total_slots, 10) || 0;
    const isDaily = formData.pricing_type === "DAILY_PASS";
    const dailyPrice = isDaily
      ? parseFloat(formData.daily_rate) || 10
      : (parseFloat(formData.hourly_rate) || 0) * 8;
    const dailyEst = Math.round(slots * dailyPrice * 0.75); // 75% occupancy
    const monthlyEst = dailyEst * 30;
    return { dailyEst, monthlyEst };
  }, [formData.total_slots, formData.hourly_rate, formData.daily_rate, formData.pricing_type]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        return showToast("Please enter the facility name.", "error");
      }
      if (!formData.address.trim()) {
        return showToast("Please enter the street address.", "error");
      }
    }
    if (currentStep === 2) {
      if (!formData.total_slots || parseInt(formData.total_slots, 10) < 1) {
        return showToast("Please specify at least 1 parking slot.", "error");
      }
    }
    setCurrentStep((prev) => Math.min(3, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      return showToast("Please complete facility name and address.", "error");
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("address", formData.address.trim());
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);
      submitData.append("total_slots", formData.total_slots);
      submitData.append("pricing_type", formData.pricing_type);
      submitData.append("hourly_rate", formData.hourly_rate || "0");
      submitData.append("daily_rate", formData.daily_rate || "10");
      submitData.append("allow_multi_entry", formData.allow_multi_entry);
      submitData.append("last_exit_time", formData.last_exit_time || "11:00 PM");
      submitData.append("has_ev", formData.has_ev);
      submitData.append("has_cctv", formData.has_cctv);
      submitData.append("has_security_guard", formData.has_security_guard);
      submitData.append("has_covered_roof", formData.has_covered_roof);
      submitData.append("is_24_7", formData.is_24_7);
      submitData.append("has_valet", formData.has_valet);
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      await API.post("/parking/create", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Facility registered successfully! Ready for bookings.", "success");
      setTimeout(() => navigate("/owner"), 800);
    } catch (error) {
      console.error("Add parking error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to register parking facility.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col font-sans selection:bg-[#0a0a0a] selection:text-white">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-all shadow-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <span className="text-xs text-[#737373] font-semibold">
            Step {currentStep} of 3
          </span>
        </div>

        {/* STEPPER PROGRESS BAR */}
        <div className="bg-white rounded-3xl border border-[#e0e0e0] p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isDone) setCurrentStep(step.id);
                  }}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl transition-all ${
                    isActive
                      ? "bg-[#0a0a0a] text-white shadow-sm"
                      : isDone
                      ? "bg-[#f0fdf4] text-[#05944f] cursor-pointer hover:bg-[#dcfce7]"
                      : "bg-[#f7f7f7] text-[#737373]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isActive
                        ? "bg-white text-[#0a0a0a]"
                        : isDone
                        ? "bg-[#05944f] text-white"
                        : "bg-[#e0e0e0] text-[#737373]"
                    }`}
                  >
                    {isDone ? <FiCheck className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{step.title}</p>
                    <p className={`text-[10px] truncate mt-0.5 ${isActive ? "text-[#a0a0a0]" : "text-[#737373]"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN FORM CONTENT CARD */}
        <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* ========================================================================= */}
          {/* STEP 1: IDENTITY & EXACT LOCATION PIN                                     */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0f4ff] border border-[#bfdbfe] text-[#276ef1] text-[11px] font-bold">
                  <FiMapPin className="w-3 h-3" /> Step 1: Location & Coordinates
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a]">
                  Facility Identity & Entrance Pin
                </h2>
                <p className="text-xs sm:text-sm text-[#737373]">
                  Provide your facility name, street address, and pin the exact entrance for driver navigation.
                </p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Grand Hub Parking"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pe-input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Street Address & Landmark *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Plot 42, Sector 18, Near Gate 2 Metro Station"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pe-input text-sm resize-none"
                  />
                </div>
              </div>

              {/* Location Picker Map */}
              <div className="space-y-3 pt-4 border-t border-[#f0f0f0]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Pin Exact Entrance on Map
                  </label>
                  {/* City presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-[#737373] font-medium">Presets:</span>
                    {CITY_PRESETS.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            latitude: city.lat,
                            longitude: city.lng,
                          }));
                          showToast(`Location set to ${city.name}`, "success");
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#f0f0f0] text-[#545454] hover:bg-[#0a0a0a] hover:text-white transition-all"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>

                <LocationPickerMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(lat, lng) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                    }));
                  }}
                />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0]">
                    <span className="text-[#737373] block text-[10px] uppercase font-bold">Latitude</span>
                    <span className="font-mono font-bold text-[#0a0a0a]">{formData.latitude}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0]">
                    <span className="text-[#737373] block text-[10px] uppercase font-bold">Longitude</span>
                    <span className="font-mono font-bold text-[#0a0a0a]">{formData.longitude}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Button */}
              <div className="pt-6 border-t border-[#f0f0f0] flex justify-end">
                <Button size="md" iconRight={FiArrowRight} onClick={handleNextStep}>
                  Next: Capacity & Rates
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CAPACITY, PRICING & AMENITIES                                     */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0fdf4] border border-[#86efac] text-[#05944f] text-[11px] font-bold">
                  <FiDollarSign className="w-3 h-3" /> Step 2: Pricing & Rules
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a]">
                  Pricing Model, Day Pass & Gate Curfew
                </h2>
                <p className="text-xs sm:text-sm text-[#737373]">
                  Choose between hourly billing, flat daily passes with unlimited entry & exit, or both.
                </p>
              </div>

              {/* Pricing Type Selector */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Select Pricing Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "HOURLY",
                      title: "⏱️ Hourly Billing",
                      desc: "Pay per hour (e.g. ₹50/hr)",
                    },
                    {
                      id: "DAILY_PASS",
                      title: "🎟️ Flat Day Pass (e.g. ₹10/day)",
                      desc: "Unlimited entry & exit all day",
                    },
                    {
                      id: "BOTH",
                      title: "⚡ Both Options",
                      desc: "Driver chooses hourly or day pass",
                    },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setFormData({ ...formData, pricing_type: mode.id })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                        formData.pricing_type === mode.id
                          ? "bg-[#0a0a0a] text-white border-[#0a0a0a] shadow-xs"
                          : "bg-white text-[#0a0a0a] border-[#e0e0e0] hover:border-[#a0a0a0]"
                      }`}
                    >
                      <p className="text-xs font-black">{mode.title}</p>
                      <p className={`text-[11px] mt-1 ${formData.pricing_type === mode.id ? "text-[#a0a0a0]" : "text-[#737373]"}`}>
                        {mode.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rates and Capacity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Total Slots */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Total Slot Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formData.total_slots}
                    onChange={(e) => setFormData({ ...formData, total_slots: e.target.value })}
                    className="pe-input text-sm font-bold"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {["10", "25", "50", "100", "200"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, total_slots: s })}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          formData.total_slots === s
                            ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                            : "bg-[#f7f7f7] text-[#545454] border-[#e0e0e0] hover:border-[#a0a0a0]"
                        }`}
                      >
                        {s} Spots
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hourly Rate (if HOURLY or BOTH) */}
                {(formData.pricing_type === "HOURLY" || formData.pricing_type === "BOTH") && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                      Hourly Rate (₹ / hr) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2000"
                      step="5"
                      required
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="pe-input text-sm font-bold"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {[
                        { label: "Free (0)", val: "0" },
                        { label: "₹30/hr", val: "30" },
                        { label: "₹50/hr", val: "50" },
                        { label: "₹100/hr", val: "100" },
                      ].map((r) => (
                        <button
                          key={r.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, hourly_rate: r.val })}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            formData.hourly_rate === r.val
                              ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                              : "bg-[#f7f7f7] text-[#545454] border-[#e0e0e0] hover:border-[#a0a0a0]"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Pass Rate (if DAILY_PASS or BOTH) */}
                {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#05944f] uppercase tracking-wide">
                      Flat Day Pass Rate (₹ / whole day) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      step="1"
                      required
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      className="pe-input text-sm font-bold border-[#86efac] focus:border-[#05944f]"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {[
                        { label: "₹10/day", val: "10" },
                        { label: "₹20/day", val: "20" },
                        { label: "₹50/day", val: "50" },
                        { label: "₹100/day", val: "100" },
                      ].map((r) => (
                        <button
                          key={r.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, daily_rate: r.val })}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            formData.daily_rate === r.val
                              ? "bg-[#05944f] text-white border-[#05944f]"
                              : "bg-[#f0fdf4] text-[#05944f] border-[#86efac] hover:bg-[#dcfce7]"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Entry & Curfew Rule Settings (when Day Pass enabled) */}
              {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                <div className="p-5 rounded-3xl bg-[#f0fdf4] border border-[#86efac] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-[#05944f] uppercase tracking-wider">
                        Unlimited Multi-Entry & Gate Curfew Rule
                      </h4>
                      <p className="text-xs text-[#545454] mt-0.5">
                        Allow vehicles to enter and exit multiple times during the day until the last exit timing.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Multi-Entry Toggle */}
                    <div
                      onClick={() => setFormData({ ...formData, allow_multi_entry: !formData.allow_multi_entry })}
                      className="p-3.5 rounded-2xl bg-white border border-[#86efac] flex items-center justify-between cursor-pointer shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#0a0a0a]">Unlimited In / Out Entry</p>
                        <p className="text-[10px] text-[#737373]">QR code stays valid after exit</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          formData.allow_multi_entry ? "bg-[#05944f] text-white" : "bg-[#f0f0f0] text-[#737373]"
                        }`}
                      >
                        {formData.allow_multi_entry ? <FiCheck className="w-3.5 h-3.5" /> : "✕"}
                      </div>
                    </div>

                    {/* Last Exit Time */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#0a0a0a]">
                        Last Exit Timing (Curfew Rule)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({ ...formData, last_exit_time: t })}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                              formData.last_exit_time === t
                                ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                                : "bg-white text-[#545454] border-[#e0e0e0] hover:border-[#a0a0a0]"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Revenue Estimate Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0] font-semibold">
                    <FiTrendingUp className="w-3.5 h-3.5 text-[#05944f]" />
                    Estimated Monthly Potential
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    ₹{projectedRevenue.monthlyEst.toLocaleString("en-IN")}
                    <span className="text-xs text-[#a0a0a0] font-normal ml-1.5">/ month</span>
                  </p>
                </div>
                <div className="text-right text-[11px] text-[#a0a0a0] hidden sm:block">
                  <p>Based on {formData.total_slots} spots</p>
                  <p>
                    {formData.pricing_type === "DAILY_PASS"
                      ? `@ ₹${formData.daily_rate}/day pass`
                      : `@ ₹${formData.hourly_rate}/hr`}{" "}
                    (75% occupancy)
                  </p>
                </div>
              </div>

              {/* Amenities Selector */}
              <div className="space-y-3 pt-4 border-t border-[#f0f0f0]">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Verified Facility Amenities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: "has_cctv", label: "24/7 CCTV", desc: "HD camera monitoring", icon: FiVideo },
                    { key: "has_security_guard", label: "Security Guard", desc: "Gate guard stationed", icon: FiShield },
                    { key: "has_ev", label: "EV Fast Chargers", desc: "Charging ports available", icon: FiZap },
                    { key: "has_covered_roof", label: "Covered Roof", desc: "Indoor / weather protected", icon: FiLayers },
                    { key: "is_24_7", label: "24/7 Open", desc: "Round-the-clock entry", icon: FiClock },
                    { key: "has_valet", label: "Valet Staff", desc: "Assisted car parking", icon: FiKey },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = formData[item.key];

                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                          active
                            ? "bg-[#0a0a0a] border-[#0a0a0a] text-white shadow-xs"
                            : "bg-white border-[#e0e0e0] hover:border-[#a0a0a0] text-[#0a0a0a]"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            active ? "bg-white/20 text-white" : "bg-[#f0f0f0] text-[#0a0a0a]"
                          }`}
                        >
                          {active ? <FiCheck className="w-3.5 h-3.5 text-[#05944f]" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{item.label}</p>
                          <p className={`text-[10px] mt-0.5 ${active ? "text-[#a0a0a0]" : "text-[#737373]"}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-[#f0f0f0] flex items-center justify-between">
                <Button variant="outline" size="md" onClick={handlePrevStep}>
                  Back
                </Button>
                <Button size="md" iconRight={FiArrowRight} onClick={handleNextStep}>
                  Next: Photo & Preview
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PHOTO UPLOAD & LIVE DRIVER LISTING PREVIEW                       */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fdf2f8] border border-[#fbcfe8] text-[#db2777] text-[11px] font-bold">
                  <FiEye className="w-3 h-3" /> Step 3: Photo & Driver Preview
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a]">
                  Entrance Photo & Listing Preview
                </h2>
                <p className="text-xs sm:text-sm text-[#737373]">
                  Review how drivers will see your facility and multi-entry pass rules in the ParkEase app.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Photo Upload Zone */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Entrance / Deck Photo
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px] ${
                      imagePreview
                        ? "border-[#0a0a0a] bg-white"
                        : "border-[#d0d0d0] hover:border-[#0a0a0a] bg-[#f7f7f7]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-3 w-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-44 rounded-2xl object-cover shadow-sm"
                        />
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="text-xs text-[#276ef1] font-bold hover:underline"
                          >
                            Change Photo
                          </button>
                          <span className="text-[#e0e0e0]">·</span>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-xs text-[#e11900] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#e0e0e0] flex items-center justify-center mx-auto shadow-sm">
                          <FiCamera className="w-6 h-6 text-[#0a0a0a]" />
                        </div>
                        <p className="text-xs font-bold text-[#0a0a0a]">
                          Click to upload parking photo
                        </p>
                        <p className="text-[11px] text-[#737373]">
                          High-res photo increases driver bookings by 40%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* LIVE DRIVER CARD PREVIEW */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    <FiEye className="w-3.5 h-3.5 text-[#05944f]" />
                    Live Driver Card Preview
                  </div>

                  <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="relative h-40 bg-[#0a0a0a]">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                          <FiCamera className="w-8 h-8 mb-1" />
                          <span className="text-xs font-semibold">Photo will appear here</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <Badge variant="success" size="sm" dot>
                          Instant Booking
                        </Badge>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-black/75 text-white backdrop-blur-md border border-white/20">
                          {formData.pricing_type === "DAILY_PASS"
                            ? `₹${formData.daily_rate}/day`
                            : formData.pricing_type === "BOTH"
                            ? `₹${formData.hourly_rate}/hr · ₹${formData.daily_rate}/day`
                            : formData.hourly_rate === "0"
                            ? "FREE"
                            : `₹${formData.hourly_rate}/hr`}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-[#0a0a0a] text-sm truncate">
                        {formData.name || "My Parking Facility"}
                      </h4>
                      <p className="text-xs text-[#737373] flex items-center gap-1 truncate">
                        <FiMapPin className="w-3 h-3 shrink-0" />
                        {formData.address || "Street Address Location"}
                      </p>

                      {/* Multi-entry pass tag */}
                      {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                        <div className="p-2.5 rounded-xl bg-[#f0fdf4] border border-[#86efac] text-[11px] font-bold text-[#05944f] flex items-center justify-between">
                          <span>🎟️ Unlimited In/Out Day Pass (₹{formData.daily_rate})</span>
                          <span>Curfew: {formData.last_exit_time}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0] text-xs font-semibold">
                        <span className="text-[#05944f]">⚡ {formData.total_slots} Slots Available</span>
                        <span className="text-[#737373]">{formData.has_ev ? "EV Charging" : "Standard"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation & Submit Buttons */}
              <div className="pt-6 border-t border-[#f0f0f0] flex items-center justify-between">
                <Button variant="outline" size="md" onClick={handlePrevStep}>
                  Back
                </Button>
                <Button
                  size="lg"
                  loading={loading}
                  icon={FiCheckCircle}
                  onClick={handleSubmit}
                >
                  Publish Parking Facility
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}