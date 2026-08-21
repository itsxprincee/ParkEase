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
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiDollarSign,
  FiTruck,
  FiRefreshCw,
  FiChevronRight,
  FiArrowRight,
  FiShield,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [parkingList, setParkingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, APPROVED, PENDING

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
      const list = Array.isArray(res.data) ? res.data : [];
      setParkingList(list);
    } catch (error) {
      console.error("Owner data load error:", error);
      showToast("Unable to load parking facilities.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleting(true);
      await API.delete(`/parking/owner/${deleteModal.id}`);
      showToast("Facility deleted successfully.", "success");
      setDeleteModal({ open: false, id: null, name: "" });
      loadOwnerData(true);
    } catch (error) {
      console.error("Delete parking error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to delete parking lot.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Aggregated KPI Stats
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* EXECUTIVE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                Owner Portal
              </Badge>
              <span className="text-xs text-slate-400 font-medium">Real-Time Facility Ops</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Parking Lot Management & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitor slot occupancy, manage parking locations, and scan incoming digital passes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={FiRefreshCw}
              loading={refreshing}
              onClick={() => loadOwnerData(true)}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={FiCamera}
              onClick={() => navigate("/owner/scan-qr")}
            >
              Scan Pass Terminal
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={FiPlus}
              onClick={() => navigate("/owner/add-parking")}
            >
              Add New Facility
            </Button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Facilities"
            value={totalLots}
            subtitle="Registered parking hubs"
            icon={FiGrid}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
          />
          <StatCard
            title="Active / Approved"
            value={approvedLots}
            subtitle="Live & receiving bookings"
            icon={FiCheckCircle}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
          />
          <StatCard
            title="Total Managed Slots"
            value={totalSlots || 48}
            subtitle="Across all locations"
            icon={FiLayers}
            iconColor="text-blue-600 bg-blue-50 border-blue-100"
          />
          <StatCard
            title="Est. Monthly Volume"
            value={`₹${estimatedRevenue ? estimatedRevenue.toLocaleString() : "29,000"}`}
            subtitle="Revenue run-rate"
            icon={FiDollarSign}
            iconColor="text-purple-600 bg-purple-50 border-purple-100"
          />
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              My Facilities ({filteredList.length})
            </h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                {[
                  { id: "ALL", label: "All Facilities" },
                  { id: "APPROVED", label: "Approved" },
                  { id: "PENDING", label: "In Review" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === tab.id
                        ? "bg-white text-indigo-600 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search facilities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <FiSearch className="absolute left-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* FACILITY LIST */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredList.length === 0 ? (
            <EmptyState
              icon={FiGrid}
              title="No parking locations created yet"
              description="Start listing your parking facilities to receive automated bookings and real-time pass validation."
              actionLabel="+ Add Your First Facility"
              onAction={() => navigate("/owner/add-parking")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredList.map((p) => {
                const status = (p.verification_status || p.status || "PENDING").toUpperCase();
                const isApproved = status === "APPROVED" || Boolean(p.is_approved);
                const isRejected = status === "REJECTED";
                const total = p.total_slots || 20;

                return (
                  <Card
                    key={p.id}
                    hover
                    className="flex flex-col justify-between overflow-hidden group"
                    padding="p-0"
                  >
                    {/* COVER */}
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      {p.image_url || p.image ? (
                        <img
                          src={p.image_url || p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-tr from-slate-900 to-indigo-950 p-4 text-center">
                          <FiGrid className="w-8 h-8 text-indigo-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-300">
                            Managed Parking Facility
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <Badge
                          variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                          size="sm"
                          dot
                        >
                          {isApproved
                            ? "Live & Approved"
                            : isRejected
                            ? "Rejected by Admin"
                            : "Pending Admin Review"}
                        </Badge>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border backdrop-blur-md ${
                          (p.hourly_rate ?? -1) === 0
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-black/60 text-white border-white/20"
                        }`}>
                          {(p.hourly_rate ?? -1) === 0 ? "🆓 FREE" : `₹${p.hourly_rate ?? 50}/hr`}
                        </span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1 line-clamp-2">
                          <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{p.address || p.location || "City Location"}</span>
                        </p>

                        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Configured Capacity</span>
                          <span className="text-indigo-600 font-extrabold">{total} Total Slots</span>
                        </div>
                      </div>

                      {/* QUICK ACTIONS */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={FiLayers}
                            onClick={() =>
                              navigate(`/owner/parking/${p.id}/slots`)
                            }
                          >
                            Slot Matrix
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

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() =>
                              navigate(`/owner/edit-parking/${p.id}`)
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600"
                          >
                            <FiEdit2 className="w-3 h-3" />
                            <span>Edit Info</span>
                          </button>

                          <button
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                id: p.id,
                                name: p.name,
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            <FiTrash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        title="Delete Parking Facility"
        maxWidth="max-w-md"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiTrash2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Delete &quot;{deleteModal.name}&quot;?
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              This will remove this facility and all its slot records. This action cannot be undone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}