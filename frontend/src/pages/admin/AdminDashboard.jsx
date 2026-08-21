import React, { useEffect, useState } from "react";
import {
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiMapPin,
  FiUser,
  FiSearch,
  FiEye,
  FiAlertCircle,
  FiX,
  FiLayers,
  FiCheck,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card, StatCard } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function AdminDashboard() {
  const [parkingList, setParkingList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, rejected, all
  const [search, setSearch] = useState("");

  const [inspectModal, setInspectModal] = useState({ open: false, item: null });
  const [rejectModal, setRejectModal] = useState({ open: false, item: null, reason: "" });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [parkingRes, statsRes] = await Promise.allSettled([
        API.get("/admin/parking"),
        API.get("/admin/verification-stats"),
      ]);

      if (parkingRes.status === "fulfilled") {
        setParkingList(parkingRes.value.data || []);
      }

      if (statsRes.status === "fulfilled") {
        setStats(
          statsRes.value.data || {
            total: 12,
            pending: 3,
            approved: 9,
            rejected: 0,
          }
        );
      }
    } catch (error) {
      console.error("Admin data load error:", error);
      showToast("Unable to load admin verification data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await API.put(`/admin/parking/${id}/approve`);
      showToast("Parking facility verified and published live!", "success");
      setInspectModal({ open: false, item: null });
      loadData(true);
    } catch (error) {
      console.error("Approve error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to approve facility.",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.item) return;
    try {
      setActionLoading(rejectModal.item.id);
      await API.put(`/admin/parking/${rejectModal.item.id}/reject`, {
        reason: rejectModal.reason || "Documents incomplete.",
      });
      showToast("Facility marked as rejected.", "success");
      setRejectModal({ open: false, item: null, reason: "" });
      setInspectModal({ open: false, item: null });
      loadData(true);
    } catch (error) {
      console.error("Reject error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to reject facility.",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filteredList = parkingList.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.owner_name?.toLowerCase().includes(q) ||
      item.owner_email?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const status = (item.verification_status || item.status || "pending").toLowerCase();
    if (activeTab === "pending") return status === "pending";
    if (activeTab === "approved") return status === "approved";
    if (activeTab === "rejected") return status === "rejected";

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
        {/* COMMAND HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm">
                Super Admin
              </Badge>
              <span className="text-xs text-slate-400 font-medium">Compliance & Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Facility Verification Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review owner submissions, inspect facility details, and grant live booking permissions.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={FiRefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Sync Verification Queue
          </Button>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Pending Reviews"
            value={stats.pending || parkingList.length}
            subtitle="Requires immediate review"
            icon={FiClock}
            iconColor="text-amber-600 bg-amber-50 border-amber-100"
          />
          <StatCard
            title="Approved Facilities"
            value={stats.approved || 18}
            subtitle="Live across platform"
            icon={FiCheckCircle}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
          />
          <StatCard
            title="Rejected Submissions"
            value={stats.rejected || 0}
            subtitle="Denied compliance"
            icon={FiXCircle}
            iconColor="text-rose-600 bg-rose-50 border-rose-100"
          />
          <StatCard
            title="Total Applications"
            value={stats.total || 18}
            subtitle="All recorded facilities"
            icon={FiShield}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
          />
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
              {[
                { id: "pending", label: "Pending Verification" },
                { id: "approved", label: "Approved" },
                { id: "all", label: "All Submissions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus-within:border-indigo-500 transition">
                <FiSearch className="text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search submission or owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TABLE / CARD GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredList.length === 0 ? (
            <EmptyState
              icon={FiShield}
              title="Verification queue is clear"
              description="No pending parking facility approvals in this section."
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0 border border-indigo-100">
                        <FiLayers />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              (item.verification_status || "").toUpperCase() === "APPROVED"
                                ? "success"
                                : (item.verification_status || "").toUpperCase() === "REJECTED"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                            dot
                          >
                            {(item.verification_status || "PENDING").toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-slate-400">
                            App #{item.id}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <FiMapPin className="text-indigo-600 w-3.5 h-3.5" />
                          <span>{item.address || item.location || "City Hub"}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <FiUser className="w-3 h-3" />
                          <span>
                            Owner: {item.owner_name || item.owner_email || "Partner"} &bull; Capacity: {item.total_slots || 20} slots
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      <Button
                        variant="outline"
                        size="md"
                        icon={FiEye}
                        onClick={() => setInspectModal({ open: true, item })}
                      >
                        Inspect Details
                      </Button>
                      {(item.verification_status || "").toUpperCase() !== "REJECTED" && (
                        <Button
                          variant="danger"
                          size="md"
                          onClick={() =>
                            setRejectModal({ open: true, item, reason: "" })
                          }
                        >
                          Reject
                        </Button>
                      )}
                      {(item.verification_status || "").toUpperCase() !== "APPROVED" && (
                        <Button
                          variant="success"
                          size="md"
                          icon={FiCheck}
                          loading={actionLoading === item.id}
                          onClick={() => handleApprove(item.id)}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* INSPECT MODAL */}
      <Modal
        isOpen={inspectModal.open}
        onClose={() => setInspectModal({ open: false, item: null })}
        title="Facility Inspection Sheet"
        maxWidth="max-w-xl"
      >
        {inspectModal.item && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Name</span>
                <span className="font-bold text-slate-900">{inspectModal.item.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Address</span>
                <span className="font-bold text-slate-900">{inspectModal.item.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Slot Capacity</span>
                <span className="font-bold text-slate-900">{inspectModal.item.total_slots || 20} Spots</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GPS Coordinates</span>
                <span className="font-mono font-bold text-slate-900">
                  {inspectModal.item.latitude}, {inspectModal.item.longitude}
                </span>
              </div>
            </div>

            {inspectModal.item.image_url && (
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Uploaded Facility Photo
                </span>
                <img
                  src={inspectModal.item.image_url}
                  alt="Facility"
                  className="w-full h-44 rounded-2xl object-cover border border-slate-200"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setRejectModal({ open: true, item: inspectModal.item, reason: "" });
                }}
              >
                Reject Submission
              </Button>
              <Button
                variant="success"
                size="md"
                icon={FiCheck}
                loading={actionLoading === inspectModal.item.id}
                onClick={() => handleApprove(inspectModal.item.id)}
              >
                Approve & Publish Live
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REJECT REASON MODAL */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, item: null, reason: "" })}
        title="Reject Facility Application"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please provide a feedback reason for the facility owner.
          </p>

          <textarea
            rows={3}
            placeholder="e.g. Unclear entrance photos, inaccurate GPS coordinates, or incomplete documentation."
            value={rejectModal.reason}
            onChange={(e) =>
              setRejectModal({ ...rejectModal, reason: e.target.value })
            }
            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setRejectModal({ open: false, item: null, reason: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={actionLoading === rejectModal.item?.id}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}