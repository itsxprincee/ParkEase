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
  FiPlus,
  FiInfo,
  FiX,
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
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
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

const CITY_PRESETS = [
  { name: "Mumbai", lat: "19.0760", lng: "72.8777" },
  { name: "Delhi", lat: "28.6139", lng: "77.2090" },
  { name: "Bengaluru", lat: "12.9716", lng: "77.5946" },
  { name: "Hyderabad", lat: "17.3850", lng: "78.4867" },
  { name: "Pune", lat: "18.5204", lng: "73.8567" },
];

export default function AddParking() {
  const navigate = useNavigate();
  const entranceInputRef = useRef(null);
  const insideInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "19.0760",
    longitude: "72.8777",
    total_slots: "20",
    supported_vehicles: "BOTH", // "CAR" | "BIKE" | "BOTH"
    pricing_type: "HOURLY", // "HOURLY" | "DAILY_PASS" | "BOTH"
    hourly_rate: "40",
    daily_rate: "10",
    allow_multi_entry: true,
    last_exit_time: "11:00 PM",
    has_cctv: true,
    has_security_guard: true,
    has_covered_roof: true,
    is_24_7: true,
  });

  const [entranceFile, setEntranceFile] = useState(null);
  const [entrancePreview, setEntrancePreview] = useState("");
  const [insideFile, setInsideFile] = useState(null);
  const [insidePreview, setInsidePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEntranceSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Entrance photo is too large. Maximum size is 10MB.", "error");
      return;
    }
    if (entrancePreview && entrancePreview.startsWith("blob:")) {
      URL.revokeObjectURL(entrancePreview);
    }
    setEntranceFile(file);
    setEntrancePreview(URL.createObjectURL(file));
  };

  const handleRemoveEntrance = (e) => {
    e.stopPropagation();
    if (entrancePreview && entrancePreview.startsWith("blob:")) {
      URL.revokeObjectURL(entrancePreview);
    }
    setEntranceFile(null);
    setEntrancePreview("");
    if (entranceInputRef.current) entranceInputRef.current.value = "";
  };

  const handleInsideSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Inside photo is too large. Maximum size is 10MB.", "error");
      return;
    }
    if (insidePreview && insidePreview.startsWith("blob:")) {
      URL.revokeObjectURL(insidePreview);
    }
    setInsideFile(file);
    setInsidePreview(URL.createObjectURL(file));
  };

  const handleRemoveInside = (e) => {
    e.stopPropagation();
    if (insidePreview && insidePreview.startsWith("blob:")) {
      URL.revokeObjectURL(insidePreview);
    }
    setInsideFile(null);
    setInsidePreview("");
    if (insideInputRef.current) insideInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return showToast("Please enter a name for your parking facility.", "error");
    }
    if (!formData.address.trim()) {
      return showToast("Please enter the street address.", "error");
    }
    if (!formData.total_slots || parseInt(formData.total_slots, 10) < 1) {
      return showToast("Please enter at least 1 parking slot.", "error");
    }
    if (!entranceFile && !entrancePreview) {
      return showToast("Parking Entrance Photo is compulsory! Upload a photo of your front gate.", "error");
    }
    if (!insideFile && !insidePreview) {
      return showToast("Parking Inside Photo is compulsory! Upload a photo of the interior parking area.", "error");
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("address", formData.address.trim());
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);
      submitData.append("total_slots", formData.total_slots);
      submitData.append("supported_vehicles", formData.supported_vehicles || "BOTH");
      submitData.append("pricing_type", formData.pricing_type);
      submitData.append("hourly_rate", formData.hourly_rate || "0");
      submitData.append("daily_rate", formData.daily_rate || "10");
      submitData.append("allow_multi_entry", formData.allow_multi_entry);
      submitData.append("last_exit_time", formData.last_exit_time || "11:00 PM");
      submitData.append("has_cctv", formData.has_cctv);
      submitData.append("has_security_guard", formData.has_security_guard);
      submitData.append("has_covered_roof", formData.has_covered_roof);
      submitData.append("is_24_7", formData.is_24_7);
      
      if (entranceFile) {
        submitData.append("image", entranceFile);
        submitData.append("entrance_image", entranceFile);
      }
      if (insideFile) {
        submitData.append("inside_image", insideFile);
        submitData.append("interior_image", insideFile);
      }

      await API.post("/parking/create", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Facility listed successfully with Entrance & Inside photos!", "success");
      setTimeout(() => navigate("/owner"), 800);
    } catch (error) {
      console.error("Add parking error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to add parking facility.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#050608] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-black dark:selection:bg-emerald-400 dark:selection:text-black overflow-x-hidden">
      {/* Ambient Emerald Glow Header in Dark Mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_80%_40%_at_50%_-20%,rgba(16,185,129,0.18),transparent)] pointer-events-none -z-0" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10 pb-mobile-dock md:pb-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white hover:border-emerald-500/50 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4 text-emerald-500" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
            <FiZap className="w-3.5 h-3.5 text-emerald-500" /> <span>Both Photos Mandatory</span>
          </div>
        </div>

        {/* UBER HOST ONBOARDING COMMAND BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-black text-zinc-950 dark:text-white shadow-xl dark:shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-7 sm:p-8 border border-zinc-200/90 dark:border-emerald-500/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 opacity-90" />
          <div className="max-w-2xl space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-wide border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FACILITY REGISTRATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">Host Your Parking Facility</h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              List your parking spots with entrance & inside photos so drivers can locate and park effortlessly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-6">
            
            {/* 1. Location Details */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">1</div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Location Details</h2>
                  <p className="text-xs text-zinc-400 font-medium">Name and street address</p>
                </div>
              </div>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Parking Name *</label>
                  <input type="text" required placeholder="e.g. City Mall Parking" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Address *</label>
                  <textarea required rows={2} placeholder="e.g. 123 Main St, Mumbai" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                </div>
                <LocationPickerMap latitude={formData.latitude} longitude={formData.longitude} onLocationChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
              </div>
            </div>

            {/* 2. Spots & Pricing Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">2</div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Spots & Pricing</h2>
                  <p className="text-xs text-zinc-400 font-medium">Number of parking spots and hourly/daily rates</p>
                </div>
              </div>

              {/* Spots Count */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Total Spots *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formData.total_slots}
                    onChange={(e) => setFormData({ ...formData, total_slots: e.target.value })}
                    className="text-base font-black w-32 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-center focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["10", "20", "50", "100", "250"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, total_slots: num })}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                          formData.total_slots === num
                            ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 dark:border-emerald-500/40 shadow-xs font-black"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {num} spots
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Supported Vehicle Types (Car / Bike / Both) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Allowed Vehicle Types *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "BOTH", title: "🚗 + 🛵 Both Cars & Bikes", desc: "Open to all drivers & riders" },
                    { id: "CAR", title: "🚗 Cars Only", desc: "For Sedans, SUVs & Hatchbacks" },
                    { id: "BIKE", title: "🛵 Bikes / Scooters Only", desc: "Two-wheeler bays only" },
                  ].map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setFormData({ ...formData, supported_vehicles: v.id })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        (formData.supported_vehicles || "BOTH") === v.id
                          ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 border-black dark:border-emerald-500/50 shadow-md font-bold scale-[1.01]"
                          : "bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40"
                      }`}
                    >
                      <p className="text-xs font-black">{v.title}</p>
                      <p className={`text-[10px] mt-0.5 ${(formData.supported_vehicles || "BOTH") === v.id ? "text-zinc-300 dark:text-emerald-400/80" : "text-zinc-400"}`}>
                        {v.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  How do you want to charge?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "HOURLY", title: "⏱️ Hourly Only", desc: "Drivers pay by the hour" },
                    { id: "DAILY_PASS", title: "🎟️ Flat Day Pass", desc: "One flat fee for the full day" },
                    { id: "BOTH", title: "⚡ Hourly + Day Pass", desc: "Drivers pick their preference" },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setFormData({ ...formData, pricing_type: p.id })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.pricing_type === p.id
                          ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 border-black dark:border-emerald-500/50 shadow-md font-bold"
                          : "bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40"
                      }`}
                    >
                      <p className="text-xs font-black">{p.title}</p>
                      <p className={`text-[10px] mt-0.5 ${formData.pricing_type === p.id ? "text-zinc-300 dark:text-emerald-400/80" : "text-zinc-400"}`}>
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {(formData.pricing_type === "HOURLY" || formData.pricing_type === "BOTH") && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Hourly Rate (₹ / hour)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                        className="pl-8 pr-4 py-3 rounded-2xl text-sm font-black bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white w-full focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      {[
                        { label: "Free (₹0)", val: "0" },
                        { label: "₹30", val: "30" },
                        { label: "₹50", val: "50" },
                        { label: "₹80", val: "80" },
                      ].map((r) => (
                        <button
                          key={r.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, hourly_rate: r.val })}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                      Daily Pass Rate (₹ / whole day)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-500 text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={formData.daily_rate}
                        onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                        className="pl-8 pr-4 py-3 rounded-2xl text-sm font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 w-full focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      {["10", "20", "50", "100"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, daily_rate: r })}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                        >
                          ₹{r}/day
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Amenities & Features (Uber Level) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-xs">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-950 dark:text-white tracking-tight">
                      Amenities & Safety Features
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium">
                      Select all safety, power, and shelter features available for drivers
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-zinc-400 hidden sm:inline">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: "has_cctv",
                    icon: FiVideo,
                    title: "24/7 CCTV Surveillance",
                    desc: "Live cameras & security monitoring",
                  },
                  {
                    key: "has_security_guard",
                    icon: FiShield,
                    title: "Security Guard on Duty",
                    desc: "Stationed security personnel",
                  },
                  {
                    key: "has_covered_roof",
                    icon: FiLayers,
                    title: "Covered / Indoor Roof",
                    desc: "Protected from heat, rain & dust",
                  },
                  {
                    key: "is_24_7",
                    icon: FiClock,
                    title: "24/7 Unrestricted Access",
                    desc: "Open round-the-clock all days",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = Boolean(formData[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className={`group p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                        active
                          ? "bg-black text-white dark:bg-zinc-900 dark:text-emerald-400 border-black dark:border-emerald-500/50 shadow-md scale-[1.01]"
                          : "bg-zinc-50/70 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            active
                              ? "bg-zinc-800 text-emerald-400 dark:bg-black dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all ${
                            active
                              ? "bg-emerald-500 text-black shadow-xs"
                              : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700"
                          }`}
                        >
                          {active ? "✓ Added" : "+ Add"}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h3
                          className={`text-xs font-black tracking-tight ${
                            active ? "text-white dark:text-emerald-300" : "text-zinc-900 dark:text-white"
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p
                          className={`text-[11px] leading-snug font-medium ${
                            active ? "text-zinc-300 dark:text-zinc-400" : "text-zinc-400"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. PARKING ENTRANCE PHOTO (COMPULSORY) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                    4
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-950 dark:text-white flex items-center gap-2">
                      <span>Parking Entrance Photo</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Compulsory *
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium">Front gate / road entrance view to help drivers spot your parking from the street</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => entranceInputRef.current?.click()}
                className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  entrancePreview
                    ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 bg-zinc-50/50 dark:bg-zinc-950"
                }`}
              >
                <input
                  ref={entranceInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEntranceSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {entrancePreview ? (
                    <img
                      src={entrancePreview}
                      alt="Entrance Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <FiCamera className="w-7 h-7" />
                    </div>
                  )}
                  <div className="text-left space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                      {entranceFile ? entranceFile.name : "Click or drag to upload Entrance Gate Photo"}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Clear daytime or lit view of the main gate / barrier
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {entrancePreview ? (
                    <button
                      type="button"
                      onClick={handleRemoveEntrance}
                      className="text-xs text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      Browse Gate Photo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 5. PARKING INSIDE PHOTO (COMPULSORY) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                    5
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-950 dark:text-white flex items-center gap-2">
                      <span>Parking Inside / Bay Photo</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Compulsory *
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium">Interior parking lanes, marked bays, or floor layout so customers know where to park</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => insideInputRef.current?.click()}
                className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  insidePreview
                    ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 bg-zinc-50/50 dark:bg-zinc-950"
                }`}
              >
                <input
                  ref={insideInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInsideSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {insidePreview ? (
                    <img
                      src={insidePreview}
                      alt="Inside Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <FiLayers className="w-7 h-7" />
                    </div>
                  )}
                  <div className="text-left space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                      {insideFile ? insideFile.name : "Click or drag to upload Inside Parking Photo"}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Indoor bays, floor markings, or covered roof layout
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {insidePreview ? (
                    <button
                      type="button"
                      onClick={handleRemoveInside}
                      className="text-xs text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      Browse Inside Photo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON (ELECTRIC GREEN CTA) */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-base font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5 stroke-[3]" />
                <span>{loading ? "Registering Facility..." : "Publish & Start Earning"}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
