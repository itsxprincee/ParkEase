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
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-black hover:border-black transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </button>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                Edit Facility Details
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
                Update information, slot limits, and photos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Street Address *
                  </label>
                  <textarea
                    required
                    rows={2}
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
                    Capacity & Coordinates
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
                        setFormData({
                          ...formData,
                          total_slots: e.target.value,
                        })
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
                    Pricing
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, hourly_rate: "0" })
                    }
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
                        setFormData({
                          ...formData,
                          hourly_rate: e.target.value,
                        })
                      }
                      className="w-full bg-transparent text-xs font-bold text-black focus:outline-none"
                    />
                    <span className="text-xs text-neutral-400 font-medium shrink-0">
                      /hour
                    </span>
                  </div>
                </div>
              </div>

              {/* AMENITIES */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  Amenities & Badges
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: "has_ev", label: "⚡ EV Charging", desc: "Fast EV stations" },
                    { key: "has_cctv", label: "📹 24/7 CCTV", desc: "High-res monitoring" },
                    { key: "has_security_guard", label: "🛡️ Security Guard", desc: "On-site personnel" },
                    { key: "has_covered_roof", label: "🏢 Covered Roof", desc: "Indoor parking" },
                    { key: "is_24_7", label: "⏰ 24/7 Access", desc: "Open all hours" },
                    { key: "has_valet", label: "🔑 Valet Service", desc: "Attendant assistance" },
                  ].map((amenity) => (
                    <div
                      key={amenity.key}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          [amenity.key]: !formData[amenity.key],
                        })
                      }
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        formData[amenity.key]
                          ? "bg-neutral-50 border-black shadow-sm"
                          : "bg-white border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black text-black block">
                          {amenity.label}
                        </span>
                        <span className="text-[10px] text-neutral-500 mt-0.5 block">
                          {amenity.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  Facility Photo
                </h3>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-6 text-center cursor-pointer transition-colors bg-neutral-50"
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
                        className="max-h-48 rounded-xl mx-auto object-cover shadow-sm"
                      />
                      <p className="text-xs text-black font-black">
                        Click to upload new photo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiUploadCloud className="w-10 h-10 text-neutral-400 mx-auto" />
                      <p className="text-xs font-black text-black">
                        Upload facility photo
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-black shadow-sm transition"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}