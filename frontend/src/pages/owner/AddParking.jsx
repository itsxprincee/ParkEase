import React, { useState, useRef } from "react";
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
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";

export default function AddParking() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "19.0760",
    longitude: "72.8777",
    total_slots: "20",
    hourly_rate: "50",
    has_ev: false,
    has_cctv: true,
    has_security_guard: true,
    has_covered_roof: false,
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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
          showToast("Live GPS coordinates pinned!", "success");
        },
        () => {
          showToast("Unable to fetch GPS. Using default coordinates.", "error");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      showToast("Please fill in the facility name and address.", "error");
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("address", formData.address);
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

      showToast("Parking facility submitted for verification!", "success");
      setTimeout(() => navigate("/owner"), 1000);
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${toast.type === "error" ? "bg-white text-[#e11900] border-[#fca5a5]" : "bg-white text-[#05944f] border-[#86efac]"}`}>
            {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-black hover:border-black transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0e0e0] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
          <div className="border-b border-[#f0f0f0] pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">
              Register New Facility
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Provide location coordinates, slot capacity, and an image to publish your facility on ParkEase.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BASIC INFO */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                1. General Information
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Grand Parking Deck"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Full Street Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Plot 42, Sector 18, Cyber City, Near Metro Station"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs text-black font-semibold focus:outline-none transition"
                />
              </div>
            </div>

            {/* CAPACITY & COORDINATES */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  2. Capacity & Coordinates
                </h3>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-black hover:underline"
                >
                  <FiCompass className="w-3.5 h-3.5" />
                  <span>Use Device GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Total Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formData.total_slots}
                    onChange={(e) =>
                      setFormData({ ...formData, total_slots: e.target.value })
                    }
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Latitude
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Longitude
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* HOURLY RATE */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  3. Pricing
                </h3>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hourly_rate: "0" })}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                    formData.hourly_rate === "0"
                      ? "bg-black text-white border-black"
                      : "bg-neutral-100 text-black border-neutral-200"
                  }`}
                >
                  🆓 Set as Free
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Hourly Rate (₹ / Hour)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                  <span className="font-bold text-black">₹</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="5"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourly_rate: e.target.value })
                    }
                    className="w-full bg-transparent text-xs font-bold text-black focus:outline-none"
                    placeholder="e.g. 50"
                  />
                  <span className="text-xs text-neutral-400 font-medium shrink-0">/hour</span>
                </div>
              </div>
            </div>

            {/* SECURITY & AMENITIES */}
            <div className="space-y-4 pt-4 border-t border-[#f0f0f0]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">
                  4. Security & Facility Amenities
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Select all safety measures and conveniences available at your parking location.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: "has_cctv",
                    label: "24/7 CCTV Camera",
                    desc: "Continuous video surveillance recording",
                    icon: FiVideo,
                    color: "text-blue-600 bg-blue-50 border-blue-200",
                  },
                  {
                    key: "has_security_guard",
                    label: "On-site Security Guard",
                    desc: "Physical security personnel on duty",
                    icon: FiShield,
                    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
                  },
                  {
                    key: "has_ev",
                    label: "EV Charging Stations",
                    desc: "Electric vehicle charging ports available",
                    icon: FiZap,
                    color: "text-amber-600 bg-amber-50 border-amber-200",
                  },
                  {
                    key: "has_covered_roof",
                    label: "Covered / Indoor Parking",
                    desc: "Protection from sun and weather",
                    icon: FiLayers,
                    color: "text-purple-600 bg-purple-50 border-purple-200",
                  },
                  {
                    key: "is_24_7",
                    label: "24/7 Open Access",
                    desc: "Round-the-clock entry and exit",
                    icon: FiClock,
                    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
                  },
                  {
                    key: "has_valet",
                    label: "Valet Assistance",
                    desc: "Staff assisted parking service",
                    icon: FiKey,
                    color: "text-rose-600 bg-rose-50 border-rose-200",
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
                          ? "bg-[#f0f4ff] border-[#276ef1]"
                          : "bg-white border-[#e0e0e0] hover:border-[#a0a0a0]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          active
                            ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                            : item.color
                        }`}
                      >
                        {active ? <FiCheck className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-bold ${active ? "text-[#0a0a0a]" : "text-[#0a0a0a]"}`}>
                          {item.label}
                        </span>
                        <p className="text-[11px] text-[#737373] line-clamp-1 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="space-y-3 pt-4 border-t border-[#f0f0f0]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">
                5. Facility Photo
              </h3>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#d0d0d0] hover:border-[#0a0a0a] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#f7f7f7]"
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
                      className="max-h-48 rounded-xl mx-auto object-cover shadow-xs"
                    />
                    <p className="text-xs text-indigo-600 font-semibold">
                      Click to choose a different photo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FiUploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      Upload high-res photo of your entrance or parking deck
                    </p>
                    <p className="text-[11px] text-slate-400">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/owner")}
                className="px-5 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-black shadow-sm transition"
              >
                {loading ? "Registering..." : "Submit Facility &rarr;"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}