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
          hourly_rate: String(data.hourly_rate ?? 0),
          has_ev: Boolean(data.has_ev),
          has_cctv: Boolean(data.has_cctv),
          has_security_guard: Boolean(data.has_security_guard),
          has_covered_roof: Boolean(data.has_covered_roof),
          is_24_7: Boolean(data.is_24_7),
          has_valet: Boolean(data.has_valet),
        });
        if (data.image_url || data.image) {
          setImagePreview(data.image_url || data.image);
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
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

      await API.put(`/parking/owner/${id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Facility updated successfully!", "success");
      setTimeout(() => navigate("/owner"), 1000);
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <Badge variant="primary" size="sm">
            Facility Editor
          </Badge>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : (
          <Card className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Edit Facility Details
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Update information, slot limits, and photos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Total Capacity (Slots)
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Latitude
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Longitude
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* PRICING */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pricing
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Hourly Rate (₹)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hourly_rate: "0" })}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                        formData.hourly_rate === "0"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                      }`}
                    >
                      🆓 Set as Free
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition">
                    <FiDollarSign className="text-slate-400 w-4 h-4 shrink-0" />
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
                      className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                      placeholder="e.g. 50"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">/hour</span>
                  </div>

                  {/* Platform Fee Callout */}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <FiInfo className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div className="text-[11px] text-indigo-700 leading-relaxed">
                      <p className="font-bold mb-0.5">Revenue Model</p>
                      <p>
                        You earn <strong>₹{formData.hourly_rate || 0}/hour</strong> × duration per booking.
                        ParkEase adds a flat <strong>₹5 Platform Fee</strong> per booking — this is how the platform earns.
                        {formData.hourly_rate === "0" && (
                          <span className="block mt-1 text-emerald-700 font-semibold">
                            ✅ Free parking — customers pay ₹5 platform fee only.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECURITY & AMENITIES */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Security & Facility Amenities
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update security features and services offered at this facility.
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
                            ? "bg-indigo-50/50 border-indigo-500 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            active
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : item.color
                          }`}
                        >
                          {active ? <FiCheck className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                active ? "text-indigo-950" : "text-slate-800"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Facility Photo
                </h3>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
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
                        Click to upload new photo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiUploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Upload facility photo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={() => navigate("/owner")}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  loading={saving}
                  icon={FiSave}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}