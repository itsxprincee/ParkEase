import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiArrowLeft,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function MyVehicles() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    vehicle_name: "",
  });

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
    } catch (err) {
      console.error("Fetch vehicles error:", err);
      showToast("Unable to load vehicles.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_number: "",
      vehicle_type: "Car",
      vehicle_name: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({
      vehicle_number: v.vehicle_number || "",
      vehicle_type: v.vehicle_type || "Car",
      vehicle_name: v.vehicle_name || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) {
      showToast("Please enter a valid license plate number.", "error");
      return;
    }

    try {
      setSaving(true);
      if (editingVehicle) {
        // update
        await API.put(`/vehicles/${editingVehicle.id}`, formData);
        showToast("Vehicle updated successfully!", "success");
      } else {
        // create
        await API.post("/vehicles/", formData);
        showToast("Vehicle registered successfully!", "success");
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error("Save vehicle error:", err);
      showToast(
        err?.response?.data?.detail || "Failed to save vehicle details.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalVehicle) return;
    try {
      setDeleting(true);
      await API.delete(`/vehicles/${deleteModalVehicle.id}`);
      showToast("Vehicle removed from your garage.", "success");
      setDeleteModalVehicle(null);
      fetchVehicles();
    } catch (err) {
      console.error("Delete vehicle error:", err);
      showToast(
        err?.response?.data?.detail || "Failed to remove vehicle.",
        "error"
      );
    } finally {
      setDeleting(false);
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Vehicle Garage
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add your cars, motorcycles, and EVs for fast one-tap slot bookings.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={FiPlus}
            onClick={handleOpenAdd}
          >
            Add New Vehicle
          </Button>
        </div>

        {/* VEHICLE CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={FiTruck}
            title="No vehicles in your garage"
            description="Register your first vehicle to enable instant 1-click reservations at any ParkEase facility."
            actionLabel="+ Add Your Vehicle"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => {
              const isEV =
                v.vehicle_type?.toLowerCase() === "ev" ||
                v.vehicle_name?.toLowerCase().includes("ev") ||
                v.vehicle_name?.toLowerCase().includes("tesla");

              return (
                <Card
                  key={v.id}
                  hover
                  className="flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                          isEV
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        }`}
                      >
                        {isEV ? <FiZap /> : <FiTruck />}
                      </div>
                      <div>
                        <Badge
                          variant={isEV ? "warning" : "primary"}
                          size="sm"
                        >
                          {v.vehicle_type || (isEV ? "EV" : "Standard")}
                        </Badge>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          {v.vehicle_name || "Vehicle"}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* LICENSE PLATE CHIP */}
                  <div className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="license-plate">
                      <span className="license-plate-ind">IND</span>
                      <span>{v.vehicle_number}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Verified
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteModalVehicle(v)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? "Edit Vehicle" : "Add Vehicle to Garage"}
        subtitle="Manage plate numbers and vehicle categories."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              License Plate Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DL-01-AB-1234"
              value={formData.vehicle_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vehicle_number: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Vehicle Nickname / Model
            </label>
            <input
              type="text"
              placeholder="e.g. Honda City / Nexon EV / Activa"
              value={formData.vehicle_name}
              onChange={(e) =>
                setFormData({ ...formData, vehicle_name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Vehicle Category
            </label>
            <select
              value={formData.vehicle_type}
              onChange={(e) =>
                setFormData({ ...formData, vehicle_type: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="Car">Car (Sedan, SUV, Hatchback)</option>
              <option value="EV">Electric Vehicle (EV)</option>
              <option value="Bike">Motorcycle / Scooter</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={saving}
            >
              {editingVehicle ? "Save Changes" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!deleteModalVehicle}
        onClose={() => setDeleteModalVehicle(null)}
        title="Remove Vehicle"
        maxWidth="max-w-md"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiTrash2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Remove {deleteModalVehicle?.vehicle_number}?
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              This vehicle will no longer appear in your quick-booking list.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalVehicle(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleting}
              onClick={handleDelete}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}