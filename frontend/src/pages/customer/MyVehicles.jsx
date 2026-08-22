import React, { useEffect, useState } from "react";
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${toast.type === "error" ? "bg-white text-[#e11900] border-[#fca5a5]" : "bg-white text-[#05944f] border-[#86efac]"}`}>
        {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
        {toast.message}
      </div>
    </div>
  );
}

const VEHICLE_TYPES = [
  { value: "Car", label: "🚗 Car", desc: "Sedan, SUV, Hatchback" },
  { value: "EV", label: "⚡ EV", desc: "Electric Vehicle" },
  { value: "Bike", label: "🛵 Bike", desc: "Motorcycle / Scooter" },
];

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ vehicle_number: "", vehicle_type: "Car", vehicle_name: "" });
  const [deleteModalVehicle, setDeleteModalVehicle] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await API.get("/vehicles/my");
      setVehicles(Array.isArray(response.data) ? response.data : []);
    } catch (_) {
      showToast("Unable to load vehicles.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({ vehicle_number: "", vehicle_type: "Car", vehicle_name: "" });
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({ vehicle_number: v.vehicle_number || "", vehicle_type: v.vehicle_type || "Car", vehicle_name: v.vehicle_name || "" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) return showToast("Enter a valid license plate number.", "error");
    try {
      setSaving(true);
      if (editingVehicle) {
        await API.put(`/vehicles/${editingVehicle.id}`, formData);
        showToast("Vehicle updated!", "success");
      } else {
        await API.post("/vehicles/", formData);
        showToast("Vehicle registered!", "success");
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to save vehicle.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalVehicle) return;
    try {
      setDeleting(true);
      await API.delete(`/vehicles/${deleteModalVehicle.id}`);
      showToast("Vehicle removed.", "success");
      setDeleteModalVehicle(null);
      fetchVehicles();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to remove vehicle.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getVehicleIcon = (v) => {
    const type = v.vehicle_type?.toLowerCase();
    if (type === "ev" || v.vehicle_name?.toLowerCase().includes("ev") || v.vehicle_name?.toLowerCase().includes("tesla")) return "⚡";
    if (type === "bike") return "🛵";
    return "🚗";
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">My Vehicles</h1>
            <p className="text-sm text-[#737373] mt-1">
              {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <Button icon={FiPlus} onClick={handleOpenAdd}>Add Vehicle</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={FiTruck}
            title="No vehicles registered"
            description="Add your cars, bikes, and EVs for instant one-tap parking reservations."
            actionLabel="Add Your Vehicle"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => {
              const isEV = v.vehicle_type?.toLowerCase() === "ev" || v.vehicle_name?.toLowerCase().includes("ev");
              const isBike = v.vehicle_type?.toLowerCase() === "bike";

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#a0a0a0] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 p-5 flex flex-col gap-4"
                >
                  {/* Top */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${isEV ? "bg-[#fffbeb]" : isBike ? "bg-[#f5f3ff]" : "bg-[#f0f0f0]"}`}>
                      {getVehicleIcon(v)}
                    </div>
                    <div>
                      <Badge variant={isEV ? "warning" : isBike ? "purple" : "default"} size="sm">
                        {v.vehicle_type || "Car"}
                      </Badge>
                      <p className="text-sm font-bold text-[#0a0a0a] mt-1 truncate">
                        {v.vehicle_name || "My Vehicle"}
                      </p>
                    </div>
                  </div>

                  {/* License Plate */}
                  <div className="p-3 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0] flex items-center justify-between">
                    <div className="license-plate">
                      <div className="license-plate-ind">
                        <span>🇮🇳</span>
                        <span>IND</span>
                      </div>
                      <span>{v.vehicle_number}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#05944f]" />
                      <span className="text-[11px] font-semibold text-[#05944f]">Active</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 border-t border-[#f0f0f0] flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#545454] hover:text-[#0a0a0a] transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModalVehicle(v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#e11900] hover:text-[#c51500] transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ADD/EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
              License Plate *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH-01-AB-1234"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
              className="pe-input font-mono tracking-widest text-sm font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
              Nickname / Model
            </label>
            <input
              type="text"
              placeholder="e.g. Honda City, Nexon EV"
              value={formData.vehicle_name}
              onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
              className="pe-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, vehicle_type: t.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${formData.vehicle_type === t.value ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[#e0e0e0] bg-white text-[#0a0a0a] hover:border-[#a0a0a0]"}`}
                >
                  <p className="text-lg leading-none">{t.label.split(" ")[0]}</p>
                  <p className="text-[10px] font-bold mt-1">{t.label.split(" ")[1]}</p>
                  <p className={`text-[9px] mt-0.5 ${formData.vehicle_type === t.value ? "text-[#a0a0a0]" : "text-[#737373]"}`}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingVehicle ? "Save Changes" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={!!deleteModalVehicle} onClose={() => setDeleteModalVehicle(null)} title="Remove Vehicle" maxWidth="max-w-sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto text-2xl">
            {deleteModalVehicle ? getVehicleIcon(deleteModalVehicle) : "🚗"}
          </div>
          <div>
            <p className="font-bold text-[#0a0a0a]">Remove {deleteModalVehicle?.vehicle_number}?</p>
            <p className="text-sm text-[#737373] mt-1">This vehicle won't appear in your booking list anymore.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="outline" onClick={() => setDeleteModalVehicle(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Remove</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}