import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiLayers,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiCompass,
  FiZap,
  FiShield,
  FiInfo,
  FiDollarSign,
  FiVideo,
  FiClock,
  FiKey,
  FiCheck,
  FiTrash2,
  FiTrendingUp,
  FiCamera,
  FiArrowRight,
  FiCrosshair,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

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

export default function AddParking() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "19.0760",
    longitude: "72.8777",
    total_slots: "25",
    hourly_rate: "50",
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
  const [isLocating, setIsLocating] = useState(false);
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocating(true);
    showToast("Requesting high-accuracy GPS coordinates...", "success");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
        showToast("GPS coordinates pinned successfully!", "success");
      },
      (err) => {
        setIsLocating(false);
        console.error("GPS error:", err);
        showToast("Unable to fetch GPS. You can type coordinates manually.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Projected earnings calculation
  const projectedRevenue = useMemo(() => {
    const slots = parseInt(formData.total_slots, 10) || 0;
    const rate = parseFloat(formData.hourly_rate) || 0;
    const dailyEst = Math.round(slots * rate * 8 * 0.75); // 8 hours at 75% occupancy
    const monthlyEst = dailyEst * 30;
    return { dailyEst, monthlyEst };
  }, [formData.total_slots, formData.hourly_rate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      return showToast("Please fill in the facility name and street address.", "error");
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("address", formData.address.trim());
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);
      submitData.append("total_slots", formData.total_slots);
      submitData.append("hourly_rate", formData.hourly_rate || "0");
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

      showToast("Facility registered! Submitted for approval.", "success");
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
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top bar navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Hub
          </button>
        </div>

        {/* Main form container */}
        <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#f0f0f0] bg-gradient-to-r from-white via-white to-[#f7f7f7]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0a0a0a] text-white text-[11px] font-bold mb-3">
                  <FiMapPin className="w-3 h-3 text-[#05944f]" />
                  Facility Onboarding
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">
                  List Your Parking Facility
                </h1>
                <p className="text-sm text-[#737373] mt-1 max-w-xl font-medium">
                  Connect your garage, lot, or private deck to thousands of drivers. Verified listings go live within 24 hours.
                </p>
              </div>

              {/* Revenue projection widget */}
              <div className="p-4 rounded-2xl bg-[#0a0a0a] text-white shrink-0 sm:w-64 border border-[#262626]">
                <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0] font-semibold">
                  <FiTrendingUp className="w-3.5 h-3.5 text-[#05944f]" />
                  Estimated Monthly Potential
                </div>
                <p className="text-2xl font-black text-white mt-1">
                  ₹{projectedRevenue.monthlyEst.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-[#737373] mt-0.5">
                  Based on {formData.total_slots} spots @ ₹{formData.hourly_rate || 0}/hr
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* 1. GENERAL INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#737373]">
                  1. Facility Identity & Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Facility Name *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#737373] pointer-events-none z-10">
                      <FiMapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metro Grand Tower Parking Deck"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pe-input pe-input-icon-left text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Full Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Plot 42, Sector 18, Cyber Hub, Near Gate No. 3 Metro Station"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pe-input text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. GEOGRAPHIC COORDINATES & PRESETS */}
            <div className="space-y-4 pt-6 border-t border-[#f0f0f0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#737373]">
                    2. Geographic Coordinates
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Ensures drivers can navigate straight to your entrance via turn-by-turn navigation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a] text-white text-xs font-bold hover:bg-[#262626] transition-colors shrink-0"
                >
                  <FiCrosshair className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                  <span>{isLocating ? "Detecting GPS..." : "Pin Current GPS"}</span>
                </button>
              </div>

              {/* City chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-[#737373]">Quick presets:</span>
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
                      showToast(`Coordinates set to ${city.name}`, "success");
                    }}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#f0f0f0] text-[#545454] hover:bg-[#e0e0e0] hover:text-[#0a0a0a] transition-colors"
                  >
                    {city.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Latitude
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="pe-input text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Longitude
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="pe-input text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. CAPACITY & PRICING */}
            <div className="space-y-4 pt-6 border-t border-[#f0f0f0]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#737373]">
                  3. Capacity & Pricing Model
                </h3>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hourly_rate: "0" })}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    formData.hourly_rate === "0"
                      ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                      : "bg-[#f0f0f0] text-[#545454] border-transparent hover:border-[#a0a0a0]"
                  }`}
                >
                  Set as Free Parking
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Total Slot Capacity *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#737373] pointer-events-none z-10">
                      <FiLayers className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formData.total_slots}
                      onChange={(e) => setFormData({ ...formData, total_slots: e.target.value })}
                      className="pe-input pe-input-icon-left text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-[#737373]">Auto-generates parking slot IDs (e.g. A1, A2, A3...)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Hourly Rate (₹ / hr) *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#737373] pointer-events-none z-10">
                      <FiDollarSign className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="2000"
                      step="5"
                      required
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="pe-input pe-input-icon-left text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-[#737373]">Set 0 for free community or customer parking</p>
                </div>
              </div>
            </div>

            {/* 4. SECURITY & AMENITIES */}
            <div className="space-y-4 pt-6 border-t border-[#f0f0f0]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#737373]">
                  4. Security & Facility Amenities
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Enable all verified equipment and services provided at your location.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: "has_cctv",
                    label: "24/7 CCTV Cameras",
                    desc: "Continuous HD surveillance",
                    icon: FiVideo,
                  },
                  {
                    key: "has_security_guard",
                    label: "On-site Security Guard",
                    desc: "Personnel stationed at entrance",
                    icon: FiShield,
                  },
                  {
                    key: "has_ev",
                    label: "EV Fast Chargers",
                    desc: "Electric vehicle charging ports",
                    icon: FiZap,
                  },
                  {
                    key: "has_covered_roof",
                    label: "Covered / Indoor Parking",
                    desc: "Weather & sun protection",
                    icon: FiLayers,
                  },
                  {
                    key: "is_24_7",
                    label: "24/7 Open Access",
                    desc: "Round-the-clock entry & exit",
                    icon: FiClock,
                  },
                  {
                    key: "has_valet",
                    label: "Valet Assistance",
                    desc: "Staff parking & retrieval",
                    icon: FiKey,
                  },
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
                          ? "bg-[#0a0a0a] border-[#0a0a0a] text-white shadow-sm"
                          : "bg-white border-[#e0e0e0] hover:border-[#a0a0a0] text-[#0a0a0a]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? "bg-white/15 text-white" : "bg-[#f0f0f0] text-[#0a0a0a]"
                        }`}
                      >
                        {active ? <FiCheck className="w-4 h-4 text-[#05944f]" /> : <Icon className="w-4 h-4" />}
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

            {/* 5. FACILITY PHOTO */}
            <div className="space-y-3 pt-6 border-t border-[#f0f0f0]">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#737373]">
                5. Facility Entrance Photo
              </h3>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
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
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-56 rounded-xl mx-auto object-cover shadow-sm"
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
                        <FiTrash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#e0e0e0] flex items-center justify-center mx-auto shadow-sm">
                      <FiCamera className="w-6 h-6 text-[#0a0a0a]" />
                    </div>
                    <p className="text-xs font-bold text-[#0a0a0a]">
                      Upload high-res photo of your entrance or parking deck
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-6 border-t border-[#f0f0f0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/owner")}
                className="px-5 py-3 rounded-xl bg-white border border-[#e0e0e0] text-[#0a0a0a] text-xs font-bold hover:border-[#0a0a0a] transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                size="lg"
                loading={loading}
                iconRight={FiArrowRight}
              >
                Register & Publish Facility
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}