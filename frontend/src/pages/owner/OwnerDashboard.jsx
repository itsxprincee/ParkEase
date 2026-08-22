import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiPlus,
  FiCamera,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiLayers,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { StatCard } from "../../components/Card";
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

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadOwnerData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await API.get("/parking/owner/my-parking");
      setParkingList(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      showToast("Unable to load parking facilities.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOwnerData(); }, []);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleting(true);
      await API.delete(`/parking/owner/${deleteModal.id}`);
      showToast("Facility deleted.", "success");
      setDeleteModal({ open: false, id: null, name: "" });
      loadOwnerData(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalLots = parkingList.length;
  const approvedLots = parkingList.filter(
    (p) => (p.verification_status || p.status || "").toUpperCase() === "APPROVED" || Boolean(p.is_approved)
  ).length;
  const totalSlots = parkingList.reduce((acc, curr) => acc + (Number(curr.total_slots) || 0), 0);
  const estimatedRevenue = approvedLots * 14500;

  const filteredList = parkingList.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    const status = (item.verification_status || item.status || "PENDING").toUpperCase();
    if (statusFilter === "APPROVED") return status === "APPROVED" || Boolean(item.is_approved);
    if (statusFilter === "PENDING") return status === "PENDING" && !item.is_approved;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">Facility Hub</h1>
            <p className="text-sm text-[#737373] mt-1">
              Monitor occupancy, manage facilities, and validate digital passes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadOwnerData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-[#e0e0e0] bg-white hover:border-[#0a0a0a] transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 text-[#545454] ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Button variant="outline" icon={FiCamera} onClick={() => navigate("/owner/scan-qr")}>
              Scan Pass
            </Button>
            <Button icon={FiPlus} onClick={() => navigate("/owner/add-parking")}>
              Add Facility
            </Button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Facilities" value={totalLots} subtitle="Registered" icon={FiGrid} iconBg="bg-[#f0f4ff]" iconColor="text-[#276ef1]" />
          <StatCard title="Approved" value={approvedLots} subtitle="Live & active" icon={FiCheckCircle} iconBg="bg-[#f0fdf4]" iconColor="text-[#05944f]" />
          <StatCard title="Total Slots" value={totalSlots} subtitle="Across all locations" icon={FiLayers} iconBg="bg-[#f0f0f0]" iconColor="text-[#545454]" />
          <StatCard title="Est. Revenue" value={`₹${estimatedRevenue.toLocaleString()}`} subtitle="Monthly run-rate" icon={FiDollarSign} iconBg="bg-[#faf5ff]" iconColor="text-[#7c3aed]" />
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0a0a0a]">
              My Facilities <span className="text-[#a0a0a0] font-normal text-sm">({filteredList.length})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-[#e8e8e8] p-1 rounded-xl">
              {[
                { id: "ALL", label: "All" },
                { id: "APPROVED", label: "Approved" },
                { id: "PENDING", label: "In Review" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === tab.id ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#737373] hover:text-[#0a0a0a]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:w-56">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a0a0a0] pointer-events-none" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-input pl-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* FACILITY GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon={FiGrid}
            title="No facilities yet"
            description="Start listing your parking facilities to receive automated bookings and digital pass validation."
            actionLabel="Add Your First Facility"
            onAction={() => navigate("/owner/add-parking")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((p) => {
              const status = (p.verification_status || p.status || "PENDING").toUpperCase();
              const isApproved = status === "APPROVED" || Boolean(p.is_approved);
              const isRejected = status === "REJECTED";
              const total = p.total_slots || 20;
              const isFree = (p.hourly_rate ?? -1) === 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#a0a0a0] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden flex flex-col group"
                >
                  {/* Cover Image */}
                  <div className="relative h-44 bg-[#0a0a0a] overflow-hidden">
                    {p.image_url || p.image ? (
                      <img
                        src={p.image_url || p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
                        <FiGrid className="w-8 h-8 text-[#3a3a3a] mb-2" />
                        <span className="text-xs font-semibold text-[#3a3a3a]">Parking Facility</span>
                      </div>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <Badge
                        variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                        dot
                        size="sm"
                      >
                        {isApproved ? "Live" : isRejected ? "Rejected" : "In Review"}
                      </Badge>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                          isFree
                            ? "bg-[#05944f] text-white"
                            : "bg-black/60 text-white border border-white/20"
                        }`}
                      >
                        {isFree ? "FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-[#0a0a0a] line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-[#737373] flex items-start gap-1 mt-1 line-clamp-1">
                        <FiMapPin className="w-3 h-3 shrink-0 mt-0.5" />
                        {p.address || p.location || "City Location"}
                      </p>
                      <div className="mt-3 p-2.5 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0] flex items-center justify-between">
                        <span className="text-xs text-[#737373]">Capacity</span>
                        <span className="text-xs font-bold text-[#0a0a0a]">{total} slots</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t border-[#f0f0f0] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FiLayers}
                          onClick={() => navigate(`/owner/parking/${p.id}/slots`)}
                        >
                          Manage Slots
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={FiCamera}
                          onClick={() => navigate("/owner/scan-qr")}
                        >
                          Scan Entry
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigate(`/owner/edit-parking/${p.id}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#545454] hover:text-[#0a0a0a] transition-colors"
                        >
                          <FiEdit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, id: p.id, name: p.name })}
                          className="flex items-center gap-1 text-xs font-semibold text-[#e11900] hover:text-[#c51500] transition-colors"
                        >
                          <FiTrash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Facility"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto">
            <FiTrash2 className="w-6 h-6 text-[#e11900]" />
          </div>
          <div>
            <p className="font-bold text-[#0a0a0a]">Delete "{deleteModal.name}"?</p>
            <p className="text-sm text-[#737373] mt-1">
              This will remove the facility and all its slot records. Cannot be undone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, id: null, name: "" })}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}