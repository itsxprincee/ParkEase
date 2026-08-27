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
        API.get(`/parking/owner/${id}`),
        API.get(`/parking/owner/${id}/slots`),
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
      await API.post(`/parking/owner/${id}/slots`, singleSlotForm);
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
          API.post(`/parking/owner/${id}/slots`, {
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
      const rawStatus = (editModal.slot.status || "AVAILABLE").toUpperCase();
      await API.put(`/parking/owner/${id}/slots/${editModal.slot.id}`, {
        slot_number: editModal.slot.slot_number.trim(),
        status: rawStatus,
        is_ev: Boolean(editModal.slot.is_ev),
        vehicle_type: editModal.slot.vehicle_type || "Car",
      });
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
      await API.delete(`/parking/owner/${id}/slots/${deleteModal.slot.id}`);
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
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />

      {/* TOAST ALERT */}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* TOP BAR */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={FiRefreshCw}
              loading={refreshing}
              onClick={() => loadData(true)}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FiLayers}
              onClick={() => setBulkModalOpen(true)}
            >
              Add Multiple Spots
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FiPlus}
              onClick={() => setAddModalOpen(true)}
            >
              Add Single Spot
            </Button>
          </div>
        </div>

        {/* PARKING TITLE & STATS */}
        <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20">
              <span>PARKING SPOTS & CAPACITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mt-1">
              {parking?.name || "Parking Spots Grid"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              {parking?.address || "Manage real-time parking spot statuses and EV charging."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block">Available</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{availableCount}</span>
            </div>
            <div className="text-center px-4 py-2.5 bg-rose-500/10 dark:bg-rose-950/40 rounded-2xl border border-rose-500/20">
              <span className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 block">Occupied</span>
              <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{occupiedCount}</span>
            </div>
            <div className="text-center px-4 py-2.5 bg-amber-500/10 dark:bg-amber-950/40 rounded-2xl border border-amber-500/20">
              <span className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 block">⚡ EV Ports</span>
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{evCount}</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-zinc-200/60 dark:bg-zinc-800/60 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto border border-zinc-200 dark:border-zinc-700">
            {[
              { id: "ALL", label: `All (${slots.length})` },
              { id: "AVAILABLE", label: "Available" },
              { id: "OCCUPIED", label: "Occupied" },
              { id: "MAINTENANCE", label: "Under Repair" },
              { id: "EV", label: "⚡ EV Spots" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-400 pointer-events-none z-10">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search spot (e.g. A-1)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-input pl-10 text-xs bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl w-full"
            />
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
            title="No spots configured"
            description="Create spots or use the batch generator to create parking spaces."
            actionLabel="+ Add Multiple Spots"
            onAction={() => setBulkModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredSlots.map((slot) => {
              const status = (slot.status || "available").toLowerCase();
              const isOccupied = status === "occupied";
              const isMaintenance = status === "maintenance";

              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-3xl border backdrop-blur-xl flex flex-col justify-between space-y-3 relative transition-all shadow-xs ${
                    isOccupied
                      ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20"
                      : isMaintenance
                      ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20"
                      : "border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-base font-black text-zinc-900 dark:text-white font-mono tracking-tight">
                      {slot.slot_number}
                    </span>

                    {slot.is_ev && (
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                        ⚡ EV
                      </span>
                    )}
                  </div>

                  <Badge
                    variant={
                      isOccupied
                        ? "danger"
                        : isMaintenance
                        ? "warning"
                        : "success"
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

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <button
                      onClick={() => setEditModal({ open: true, slot })}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FiEdit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, slot })}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* SINGLE SLOT MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Single Parking Spot"
      >
        <form onSubmit={handleAddSingleSlot} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Spot Number *
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
              className="pe-input text-sm font-bold font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Initial Status
            </label>
            <select
              value={singleSlotForm.status}
              onChange={(e) =>
                setSingleSlotForm({ ...singleSlotForm, status: e.target.value })
              }
              className="pe-input text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Repair</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
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
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="is_ev"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Has EV Fast Charging Port (⚡)
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
              Save Spot
            </Button>
          </div>
        </form>
      </Modal>

      {/* BULK GENERATE MODAL */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Add Multiple Spots"
        subtitle="Quickly generate a series of numbered parking spots."
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Floor / Section Letter
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A, B, P1, P2"
                value={bulkForm.prefix}
                onChange={(e) =>
                  setBulkForm({
                    ...bulkForm,
                    prefix: e.target.value.toUpperCase(),
                  })
                }
                className="pe-input text-xs font-bold font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Number of Spots
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
                className="pe-input text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="bulk_ev"
              checked={bulkForm.is_ev}
              onChange={(e) =>
                setBulkForm({ ...bulkForm, is_ev: e.target.checked })
              }
              className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="bulk_ev"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Mark all spots as EV Ready (⚡)
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
              Generate Spots
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, slot: null })}
        title={`Edit Spot ${editModal.slot?.slot_number || ""}`}
      >
        {editModal.slot && (
          <form onSubmit={handleEditSlot} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Spot Status
              </label>
              <select
                value={(editModal.slot.status || "available").toLowerCase()}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    slot: { ...editModal.slot, status: e.target.value },
                  })
                }
                className="pe-input text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full"
              >
                <option value="available">Available (Free)</option>
                <option value="occupied">Occupied (Parked)</option>
                <option value="maintenance">Under Repair</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
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
                className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="edit_ev"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                EV Fast Charging Port (⚡)
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
        title="Delete Spot"
        maxWidth="max-w-md"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <FiTrash2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">
              Delete Spot {deleteModal.slot?.slot_number}?
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
              This parking spot will be removed from your parking lot.
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