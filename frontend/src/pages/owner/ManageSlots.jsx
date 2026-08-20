import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiLayers,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiTruck,
  FiRefreshCw,
  FiSliders,
  FiTool,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function ManageSlots() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [parking, setParking] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, AVAILABLE, OCCUPIED, MAINTENANCE, EV

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, slot: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, slot: null });

  // Form states
  const [singleSlotForm, setSingleSlotForm] = useState({
    slot_number: "",
    is_ev: false,
    vehicle_type: "Car",
    status: "available",
  });

  const [bulkForm, setBulkForm] = useState({
    prefix: "A",
    count: 10,
    is_ev: false,
    vehicle_type: "Car",
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [pRes, sRes] = await Promise.allSettled([
        API.get(`/parking/${id}`),
        API.get(`/parking/${id}/slots`),
      ]);

      if (pRes.status === "fulfilled") {
        setParking(pRes.value.data);
      }

      if (sRes.status === "fulfilled") {
        let list = [];
        if (Array.isArray(sRes.value.data)) {
          list = sRes.value.data;
        } else if (Array.isArray(sRes.value.data?.slots)) {
          list = sRes.value.data.slots;
        }
        setSlots(list);
      }
    } catch (e) {
      console.error("Load slots error:", e);
      showToast("Unable to load slot details.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddSingleSlot = async (e) => {
    e.preventDefault();
    if (!singleSlotForm.slot_number.trim()) {
      showToast("Please enter a slot number.", "error");
      return;
    }

    try {
      setSaving(true);
      await API.post(`/parking/${id}/slots`, singleSlotForm);
      showToast("Slot added successfully!", "success");
      setAddModalOpen(false);
      setSingleSlotForm({
        slot_number: "",
        is_ev: false,
        vehicle_type: "Car",
        status: "available",
      });
      loadData(true);
    } catch (err) {
      console.error("Add slot error:", err);
      showToast(err?.response?.data?.detail || "Failed to add slot.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const count = Number(bulkForm.count) || 5;
      const promises = [];
      for (let i = 1; i <= count; i++) {
        promises.push(
          API.post(`/parking/${id}/slots`, {
            slot_number: `${bulkForm.prefix}-${i}`,
            is_ev: bulkForm.is_ev,
            vehicle_type: bulkForm.vehicle_type,
            status: "available",
          })
        );
      }
      await Promise.allSettled(promises);
      showToast(`Generated ${count} slots successfully!`, "success");
      setBulkModalOpen(false);
      loadData(true);
    } catch (err) {
      showToast("Error generating bulk slots.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSlot = async (e) => {
    e.preventDefault();
    if (!editModal.slot) return;
    try {
      setSaving(true);
      await API.put(`/parking/slots/${editModal.slot.id}`, editModal.slot);
      showToast("Slot updated successfully!", "success");
      setEditModal({ open: false, slot: null });
      loadData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to update slot.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteModal.slot) return;
    try {
      setSaving(true);
      await API.delete(`/parking/slots/${deleteModal.slot.id}`);
      showToast("Slot removed.", "success");
      setDeleteModal({ open: false, slot: null });
      loadData(true);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to delete slot.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const q = search.toLowerCase();
      const matchesSearch = slot.slot_number?.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const isEv = slot.is_ev;
      const status = (slot.status || "available").toLowerCase();

      if (statusFilter === "EV") return isEv;
      if (statusFilter === "AVAILABLE") return status === "available";
      if (statusFilter === "OCCUPIED") return status === "occupied";
      if (statusFilter === "MAINTENANCE") return status === "maintenance";

      return true;
    });
  }, [slots, search, statusFilter]);

  const availableCount = slots.filter(
    (s) => (s.status || "available").toLowerCase() === "available"
  ).length;
  const occupiedCount = slots.filter(
    (s) => (s.status || "").toLowerCase() === "occupied"
  ).length;
  const evCount = slots.filter((s) => s.is_ev).length;

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
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FiRefreshCw}
              loading={refreshing}
              onClick={() => loadData(true)}
            >
              Sync
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FiLayers}
              onClick={() => setBulkModalOpen(true)}
            >
              Batch Generate
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FiPlus}
              onClick={() => setAddModalOpen(true)}
            >
              Add Single Slot
            </Button>
          </div>
        </div>

        {/* FACILITY TITLE & STATS */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Badge variant="primary" size="sm">
              Slot Matrix & Capacity
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {parking?.name || "Facility Slot Grid"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {parking?.address || "Configure and manage real-time parking spot statuses."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Available</span>
              <span className="text-xl font-extrabold text-emerald-700">{availableCount}</span>
            </div>
            <div className="text-center px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Occupied</span>
              <span className="text-xl font-extrabold text-rose-700">{occupiedCount}</span>
            </div>
            <div className="text-center px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">⚡ EV Ready</span>
              <span className="text-xl font-extrabold text-amber-700">{evCount}</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: `All (${slots.length})` },
              { id: "AVAILABLE", label: "Available" },
              { id: "OCCUPIED", label: "Occupied" },
              { id: "MAINTENANCE", label: "Maintenance" },
              { id: "EV", label: "⚡ EV Slots" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-white text-indigo-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 focus-within:border-indigo-500 transition">
              <FiSearch className="text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search slot (e.g. A-1)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* VISUAL MATRIX */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredSlots.length === 0 ? (
          <EmptyState
            icon={FiLayers}
            title="No slots configured"
            description="Create slots or use the 1-click batch generator to create parking spaces."
            actionLabel="+ Batch Generate Slots"
            onAction={() => setBulkModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredSlots.map((slot) => {
              const status = (slot.status || "available").toLowerCase();
              const isOccupied = status === "occupied";
              const isMaintenance = status === "maintenance";

              return (
                <Card
                  key={slot.id}
                  padding="p-4"
                  className={`flex flex-col justify-between space-y-3 relative transition-all ${
                    isOccupied
                      ? "border-rose-200 bg-rose-50/40"
                      : isMaintenance
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-emerald-200 bg-emerald-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-base font-black text-slate-900 tracking-tight">
                      {slot.slot_number}
                    </span>

                    {slot.is_ev && (
                      <span className="text-xs font-bold text-amber-500 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                        ⚡ EV
                      </span>
                    )}
                  </div>

                  <Badge
                    variant={
                      isOccupied
                        ? "occupied"
                        : isMaintenance
                        ? "maintenance"
                        : "available"
                    }
                    size="sm"
                    dot
                  >
                    {isOccupied
                      ? "Occupied"
                      : isMaintenance
                      ? "Under Repair"
                      : "Available"}
                  </Badge>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <button
                      onClick={() => setEditModal({ open: true, slot })}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <FiEdit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, slot })}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* SINGLE SLOT MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Single Parking Slot"
      >
        <form onSubmit={handleAddSingleSlot} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Slot Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A-12 or B-04"
              value={singleSlotForm.slot_number}
              onChange={(e) =>
                setSingleSlotForm({
                  ...singleSlotForm,
                  slot_number: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Initial Status
            </label>
            <select
              value={singleSlotForm.status}
              onChange={(e) =>
                setSingleSlotForm({ ...singleSlotForm, status: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_ev"
              checked={singleSlotForm.is_ev}
              onChange={(e) =>
                setSingleSlotForm({
                  ...singleSlotForm,
                  is_ev: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="is_ev"
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Equipped with EV Fast Charging Station (⚡)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={saving}
            >
              Save Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* BULK GENERATE MODAL */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Batch Slot Generator"
        subtitle="Quickly generate a sequence of numbered slots."
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Zone / Floor Prefix
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A, B, B1, P2"
                value={bulkForm.prefix}
                onChange={(e) =>
                  setBulkForm({
                    ...bulkForm,
                    prefix: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Number of Slots
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={bulkForm.count}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, count: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="bulk_ev"
              checked={bulkForm.is_ev}
              onChange={(e) =>
                setBulkForm({ ...bulkForm, is_ev: e.target.checked })
              }
              className="w-4 h-4 rounded text-indigo-600"
            />
            <label
              htmlFor="bulk_ev"
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Mark all generated spots as EV Ready (⚡)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setBulkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={saving}
            >
              Generate Sequence
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, slot: null })}
        title={`Edit Slot ${editModal.slot?.slot_number || ""}`}
      >
        {editModal.slot && (
          <form onSubmit={handleEditSlot} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Slot Status
              </label>
              <select
                value={editModal.slot.status || "available"}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    slot: { ...editModal.slot, status: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="available">Available (Free)</option>
                <option value="occupied">Occupied (In-Use)</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit_ev"
                checked={editModal.slot.is_ev || false}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    slot: { ...editModal.slot, is_ev: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-indigo-600"
              />
              <label
                htmlFor="edit_ev"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                EV Fast Charging Support (⚡)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => setEditModal({ open: false, slot: null })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={saving}
              >
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, slot: null })}
        title="Delete Slot"
        maxWidth="max-w-md"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiTrash2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Delete Slot {deleteModal.slot?.slot_number}?
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              This parking spot will be removed from your facility matrix.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModal({ open: false, slot: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={saving}
              onClick={handleDeleteSlot}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}