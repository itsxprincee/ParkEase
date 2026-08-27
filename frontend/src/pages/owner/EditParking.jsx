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
    pricing_type: "HOURLY",
    hourly_rate: "50",
    daily_rate: "10",
    allow_multi_entry: true,
    last_exit_time: "11:00 PM",
    has_ev: false,
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
          pricing_type: data.pricing_type || "HOURLY",
          hourly_rate: String(data.hourly_rate ?? 50),
          daily_rate: String(data.daily_rate ?? 10),
          allow_multi_entry: data.allow_multi_entry !== false,
          last_exit_time: data.last_exit_time || "11:00 PM",
          has_ev: Boolean(data.has_ev),
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
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : (
          <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                Edit Parking Location
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                Update name, address, pricing, spots, and photos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Parking Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pe-input text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="pe-input text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full resize-none"
                  />
                </div>
              </div>

              {/* CAPACITY & COORDINATES */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Spots & Map Location
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Click anywhere on the map or drag the pin to set your parking location.
                  </p>
                </div>

                {/* Interactive Map */}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Total Spots
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formData.total_slots}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_slots: e.target.value,
                        })
                      }
                      className="pe-input text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Latitude
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      className="pe-input text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Longitude
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      className="pe-input text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                    />
                  </div>
                </div>
              </div>

              {/* PRICING MODEL & DAILY PASS */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Pricing & Rates
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Select hourly rates, flat daily passes, or both.
                  </p>
                </div>

                {/* Model Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "HOURLY", title: "⏱️ Hourly Only", desc: "Pay per hour" },
                    { id: "DAILY_PASS", title: "🎟️ Flat Day Pass", desc: "One price for full day" },
                    { id: "BOTH", title: "⚡ Both Options", desc: "Driver chooses pass" },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setFormData({ ...formData, pricing_type: mode.id })}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.pricing_type === mode.id
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs font-bold"
                          : "bg-white dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <p className="text-xs font-black">{mode.title}</p>
                      <p className={`text-[10px] mt-0.5 ${formData.pricing_type === mode.id ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
                        {mode.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hourly_rate: e.target.value,
                            })
                          }
                          className="pe-input pl-8 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
                        />
                      </div>
                    </div>
                  )}

                  {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Flat Day Pass Rate (₹ / Whole Day)
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              daily_rate: e.target.value,
                            })
                          }
                          className="pe-input pl-8 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {(formData.pricing_type === "DAILY_PASS" || formData.pricing_type === "BOTH") && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
                    <div>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        Day Pass & Closing Time
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Drivers can exit and re-enter multiple times before closing.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() =>
                          setFormData({
                            ...formData,
                            allow_multi_entry: !formData.allow_multi_entry,
                          })
                        }
                        className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-emerald-500/30 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">Unlimited In & Out</p>
                          <p className="text-[10px] text-zinc-400">QR pass remains active</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs ${
                            formData.allow_multi_entry ? "bg-emerald-500 text-black" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                          }`}
                        >
                          {formData.allow_multi_entry ? <FiCheck className="w-3.5 h-3.5 stroke-[3]" /> : "✕"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-900 dark:text-white block">
                          Closing Time
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {["10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({ ...formData, last_exit_time: t })}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                                formData.last_exit_time === t
                                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs"
                                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
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

              {/* AMENITIES */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Amenities & Features
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: "has_ev", label: "⚡ EV Charging", desc: "Fast EV ports" },
                    { key: "has_cctv", label: "📹 24/7 CCTV", desc: "Camera monitored" },
                    { key: "has_security_guard", label: "🛡️ Security Guard", desc: "Guard on duty" },
                    { key: "has_covered_roof", label: "🏢 Covered Roof", desc: "Indoor covered" },
                    { key: "is_24_7", label: "⏰ 24/7 Open", desc: "All hours access" },
                  ].map((amenity) => (
                    <div
                      key={amenity.key}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          [amenity.key]: !formData[amenity.key],
                        })
                      }
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        formData[amenity.key]
                          ? "bg-emerald-500/10 border-emerald-500 shadow-xs"
                          : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-white block">
                          {amenity.label}
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">
                          {amenity.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1. PARKING ENTRANCE PHOTO (COMPULSORY) */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>🚪 Parking Entrance Photo</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Compulsory *
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Front gate / road entrance view</p>
                </div>

                <div
                  onClick={() => entranceInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/40"
                >
                  <input
                    ref={entranceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setEntranceFile(file);
                      setEntrancePreview(URL.createObjectURL(file));
                    }}
                    className="hidden"
                  />

                  {entrancePreview ? (
                    <div className="space-y-2">
                      <img
                        src={entrancePreview}
                        alt="Entrance Preview"
                        className="max-h-40 rounded-2xl mx-auto object-cover shadow-sm border border-emerald-500/40"
                      />
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        Click to change entrance photo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiUploadCloud className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-black text-zinc-900 dark:text-white">
                        Upload Parking Entrance Gate Photo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. PARKING INSIDE PHOTO (COMPULSORY) */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>🏢 Parking Inside / Bay Photo</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      Compulsory *
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Indoor bays, markings, and floor layout</p>
                </div>

                <div
                  onClick={() => insideInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-cyan-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/40"
                >
                  <input
                    ref={insideInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setInsideFile(file);
                      setInsidePreview(URL.createObjectURL(file));
                    }}
                    className="hidden"
                  />

                  {insidePreview ? (
                    <div className="space-y-2">
                      <img
                        src={insidePreview}
                        alt="Inside Preview"
                        className="max-h-40 rounded-2xl mx-auto object-cover shadow-sm border border-cyan-500/40"
                      />
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                        Click to change inside photo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiLayers className="w-8 h-8 text-cyan-500 mx-auto" />
                      <p className="text-xs font-black text-zinc-900 dark:text-white">
                        Upload Parking Inside / Bay Layout Photo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/owner")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}