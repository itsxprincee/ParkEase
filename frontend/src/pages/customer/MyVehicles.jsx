import React, { useEffect, useState } from "react";
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
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

const VEHICLE_TYPES = [
  { value: "Car", label: "🚗 Car", desc: "Sedan, SUV, Hatchback" },
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
    if (type === "bike") return "🛵";
    return "🚗";
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Ambient glowing background orbs */}
      <div className="pe-glow-orb top-20 left-10 w-[450px] h-[450px] bg-emerald-500/10 dark:bg-emerald-500/15" />
      <div className="pe-glow-orb bottom-20 right-10 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/15" />

      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-mobile-dock md:pb-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 mb-1">
              <span>SAVED VEHICLES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">My Vehicles</h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} saved for fast pass generation
            </p>
          </div>
          <Button icon={FiPlus} variant="primary" onClick={handleOpenAdd}>Add Vehicle</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={FiTruck}
            title="No vehicles saved"
            description="Add your car or bike for instant spot reservation without typing your license plate each time."
            actionLabel="Add Your Vehicle"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => {
              const isBike = v.vehicle_type?.toLowerCase() === "bike";

              return (
                <div
                  key={v.id}
                  className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:border-emerald-500/50 hover:shadow-xl transition-all duration-200 p-5 flex flex-col justify-between gap-4"
                >
                  {/* Top */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isBike ? "bg-amber-500/15 border border-amber-500/30" : "bg-blue-500/15 border border-blue-500/30"}`}>
                      {getVehicleIcon(v)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={isBike ? "warning" : "info"} size="sm">
                          {v.vehicle_type || "Car"}
                        </Badge>
                      </div>
                      <p className="text-sm font-black text-zinc-900 dark:text-white mt-1 truncate">
                        {v.vehicle_name || "My Vehicle"}
                      </p>
                    </div>
                  </div>

                  {/* License Plate */}
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                    <div className="license-plate text-xs shrink-0 shadow-xs inline-flex">
                      <span className="license-plate-ind">IND</span>
                      <span className="font-mono font-black tracking-wider">
                        {v.vehicle_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Ready</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteModalVehicle(v)}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
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
        title={editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              License Plate Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH-01-AB-1234"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
              className="pe-input font-mono tracking-widest text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Vehicle Nickname / Model
            </label>
            <input
              type="text"
              placeholder="e.g. White Creta, Red Pulsar, Nexon EV"
              value={formData.vehicle_name}
              onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
              className="pe-input text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Vehicle Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, vehicle_type: t.value })}
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    formData.vehicle_type === t.value
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xl leading-none">{t.label.split(" ")[0]}</p>
                  <p className="text-xs font-black mt-1">{t.label.split(" ")[1]}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingVehicle ? "Save Changes" : "Save Vehicle"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={!!deleteModalVehicle} onClose={() => setDeleteModalVehicle(null)} title="Remove Vehicle" maxWidth="max-w-sm">
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto text-2xl">
            {deleteModalVehicle ? getVehicleIcon(deleteModalVehicle) : "🚗"}
          </div>
          <div>
            <p className="font-black text-zinc-900 dark:text-white">Remove {deleteModalVehicle?.vehicle_number}?</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">This vehicle will be removed from your saved list.</p>
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