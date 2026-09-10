import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiLayers,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiCompass,
  FiSave,
  FiInfo,
  FiDollarSign,
  FiVideo,
  FiShield,
  FiClock,
  FiKey,
  FiCheck,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import LocationPickerMap from "../../components/LocationPickerMap";

export default function EditParking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    total_slots: "",
    supported_vehicles: "BOTH", // "CAR" | "BIKE" | "BOTH"
    pricing_type: "HOURLY",
    hourly_rate: "50",
    daily_rate: "10",
    allow_multi_entry: true,
    last_exit_time: "11:00 PM",
    has_cctv: true,
    has_security_guard: true,
    has_covered_roof: false,
    is_24_7: true,
  });

  const entranceInputRef = useRef(null);
  const insideInputRef = useRef(null);

  const [entranceFile, setEntranceFile] = useState(null);
  const [entrancePreview, setEntrancePreview] = useState("");
  const [insideFile, setInsideFile] = useState(null);
  const [insidePreview, setInsidePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/parking/${id}`);
      const data = res.data;
      if (data) {
        setFormData({
          name: data.name || "",
          address: data.address || data.location || "",
          latitude: data.latitude || "19.0760",
          longitude: data.longitude || "72.8777",
          total_slots: String(data.total_slots || 20),
          supported_vehicles: data.supported_vehicles || "BOTH",
          pricing_type: data.pricing_type || "HOURLY",
          hourly_rate: String(data.hourly_rate ?? 50),
          daily_rate: String(data.daily_rate ?? 10),
          allow_multi_entry: data.allow_multi_entry !== false,
          last_exit_time: data.last_exit_time || "11:00 PM",
          has_cctv: Boolean(data.has_cctv),
          has_security_guard: Boolean(data.has_security_guard),
          has_covered_roof: Boolean(data.has_covered_roof),
          is_24_7: Boolean(data.is_24_7),
        });
        if (data.image_url || data.image) {
          setEntrancePreview(data.image_url || data.image);
        }
        if (data.inside_image_url || data.inside_image) {
          setInsidePreview(data.inside_image_url || data.inside_image);
        }
      }
    } catch (e) {
      console.error("Load parking error:", e);
      showToast("Unable to load facility details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    showToast("Detecting current coordinates...", "success");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        showToast("GPS coordinates detected!", "success");
      },
      (err) => {
        console.error("GPS error:", err);
        showToast("Unable to retrieve location from device.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entranceFile && !entrancePreview) {
      return showToast("Parking Entrance Photo is compulsory.", "error");
    }
    if (!insideFile && !insidePreview) {
      return showToast("Parking Inside Photo is compulsory.", "error");
    }

    try {
      setSaving(true);
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("address", formData.address);
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

      await API.put(`/parking/${id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Facility updated with Entrance & Inside photos!", "success");
      setTimeout(() => navigate("/owner"), 800);
    } catch (error) {
      console.error("Update parking error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to update facility.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#050608] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Ambient glowing background orbs */}
      <div className="pe-glow-orb top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15" />
      <div className="pe-glow-orb top-96 right-10 w-[400px] h-[400px] bg-emerald-400/5 dark:bg-emerald-400/10" />

      <SaaSNavbar />

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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-16 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 text-xs font-bold text-zinc-900 dark:text-white transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Editing Facility #{id}</span>
          </div>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Title Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <span>Edit Parking Facility</span>
                <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Live Lot
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Update name, GPS gate location, rates, bay capacity, and visual security photos.
              </p>
            </div>

            {/* Step 1. Location Details & Map */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Location Details & Pin</h2>
                  <p className="text-xs text-zinc-400 font-medium">Name, street address, and exact entrance GPS coordinates</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Parking Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City Mall Parking Hub"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. 123 Main St, Near Gateway, Mumbai"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all font-medium"
                  />
                </div>

                {/* Map Picker with Auto Sync */}
                <LocationPickerMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(lat, lng) =>
                    setFormData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                    }))
                  }
                  onAddressSelect={(addr) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: addr,
                    }))
                  }
                />
              </div>
            </div>

            {/* Step 2. Spots & Pricing */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Spots & Pricing Model</h2>
                  <p className="text-xs text-zinc-400 font-medium">Capacity and driver payment tiers</p>
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
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          formData.total_slots === num
                            ? "bg-black text-emerald-400 border-emerald-500/50 shadow-sm"
                            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                        }`}
                      >
                        {num} spots
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Mode Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Pricing Structure
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "HOURLY", title: "⏱️ Hourly Only", desc: "Pay strictly per hour parked" },
                    { id: "DAILY_PASS", title: "🎟️ Flat Day Pass", desc: "Single flat rate per whole day" },
                    { id: "BOTH", title: "⚡ Both Options", desc: "Driver chooses hourly or day pass" },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setFormData({ ...formData, pricing_type: mode.id })}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.pricing_type === mode.id
                          ? "bg-black text-white border-emerald-500 shadow-sm scale-[1.01]"
                          : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                      }`}
                    >
                      <p className="text-xs font-black text-emerald-400">{mode.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{mode.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {(formData.pricing_type === "HOURLY" || formData.pricing_type === "BOTH") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Hourly Rate (₹ / Hour)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          max="2000"
                          step="5"
                          required
                          value={formData.hourly_rate}
                          onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                          className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  )}

                  {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                        Flat Day Pass Rate (₹ / Full Day)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-500 text-sm">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="5000"
                          step="1"
                          required
                          value={formData.daily_rate}
                          onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                          className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          Day Pass Re-Entry & Closing Time
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Drivers can enter and leave multiple times using their QR pass.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, allow_multi_entry: !formData.allow_multi_entry })}
                        className="p-3.5 rounded-2xl bg-black border border-emerald-500/30 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">Unlimited In & Out</p>
                          <p className="text-[10px] text-zinc-400">QR pass remains active</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs ${
                            formData.allow_multi_entry ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {formData.allow_multi_entry ? <FiCheck className="w-3.5 h-3.5 stroke-[3]" /> : "✕"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-900 dark:text-white block">
                          Gate Closing Time
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {["10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({ ...formData, last_exit_time: t })}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                formData.last_exit_time === t
                                  ? "bg-emerald-500 text-black border-emerald-400 font-black"
                                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
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
              </div>
            </div>

            {/* Step 3. Supported Vehicle Types */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Supported Vehicle Types</h2>
                  <p className="text-xs text-zinc-400 font-medium">Select which vehicle types are accommodated</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        ? "bg-black text-white border-emerald-500 shadow-md font-bold scale-[1.01]"
                        : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                    }`}
                  >
                    <p className="text-xs font-black text-emerald-400">{v.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4. Amenities & Safety Features */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                  4
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Amenities & Security</h2>
                  <p className="text-xs text-zinc-400 font-medium">Highlight driver security trust badges</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { key: "has_cctv", icon: FiVideo, title: "24/7 CCTV", desc: "Surveillance monitoring" },
                  { key: "has_security_guard", icon: FiShield, title: "Guard on Duty", desc: "Security on-site" },
                  { key: "has_covered_roof", icon: FiLayers, title: "Covered Roof", desc: "Rain & sun protection" },
                  { key: "is_24_7", icon: FiClock, title: "24/7 Access", desc: "Open round-the-clock" },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = Boolean(formData[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => setFormData((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        active
                          ? "bg-black text-white border-emerald-500 shadow-md scale-[1.01]"
                          : "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-zinc-800 text-zinc-400"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${active ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>
                          {active ? "✓ Added" : "+ Add"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white">{item.title}</h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 5. Facility Gate & Interior Photos */}
            <div className="p-6 rounded-3xl bg-white dark:bg-black border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                  5
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-950 dark:text-white">Facility Gate & Interior Photos</h2>
                  <p className="text-xs text-zinc-400 font-medium">Both entrance and indoor parking photos are required for driver trust</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Entrance Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>🚪 Entrance Gate Photo</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Compulsory
                      </span>
                    </span>
                    <span className="text-[10px] text-zinc-400">Street / Gate View</span>
                  </div>

                  <div
                    onClick={() => entranceInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-zinc-50 dark:bg-zinc-950/60 min-h-[160px] flex items-center justify-center"
                  >
                    <input
                      ref={entranceInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (entrancePreview && entrancePreview.startsWith("blob:")) {
                          URL.revokeObjectURL(entrancePreview);
                        }
                        setEntranceFile(file);
                        setEntrancePreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                    />

                    {entrancePreview ? (
                      <div className="space-y-1.5 w-full">
                        <img
                          src={entrancePreview}
                          alt="Entrance Preview"
                          className="h-36 w-full rounded-xl object-cover border border-emerald-500/40"
                        />
                        <p className="text-[11px] text-emerald-400 font-bold">
                          Click to replace entrance photo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <FiUploadCloud className="w-7 h-7 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          Upload Entrance Photo
                        </p>
                        <p className="text-[10px] text-zinc-500">Tap to browse</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Inside Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>🏢 Parking Inside / Bays Photo</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Compulsory
                      </span>
                    </span>
                    <span className="text-[10px] text-zinc-400">Indoor Bays Layout</span>
                  </div>

                  <div
                    onClick={() => insideInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-zinc-50 dark:bg-zinc-950/60 min-h-[160px] flex items-center justify-center"
                  >
                    <input
                      ref={insideInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (insidePreview && insidePreview.startsWith("blob:")) {
                          URL.revokeObjectURL(insidePreview);
                        }
                        setInsideFile(file);
                        setInsidePreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                    />

                    {insidePreview ? (
                      <div className="space-y-1.5 w-full">
                        <img
                          src={insidePreview}
                          alt="Inside Preview"
                          className="h-36 w-full rounded-xl object-cover border border-emerald-500/40"
                        />
                        <p className="text-[11px] text-emerald-400 font-bold">
                          Click to replace inside photo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <FiLayers className="w-7 h-7 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          Upload Inside Photo
                        </p>
                        <p className="text-[10px] text-zinc-500">Tap to browse</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/owner")}
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black text-sm shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Facility Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}