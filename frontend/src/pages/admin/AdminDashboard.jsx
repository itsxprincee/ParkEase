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

export default function AdminDashboard() {
  const [parkingList, setParkingList] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
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
      if (parkingRes.status === "fulfilled") setParkingList(parkingRes.value.data || []);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (_) {
      showToast("Unable to load verification data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await API.put(`/admin/parking/${id}/approve`);
      showToast("Facility approved and published live!", "success");
      setInspectModal({ open: false, item: null });
      loadData(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to approve.", "error");
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
      showToast("Facility rejected.", "success");
      setRejectModal({ open: false, item: null, reason: "" });
      setInspectModal({ open: false, item: null });
      loadData(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to reject.", "error");
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

  const AMENITY_TAGS = [
    { key: "has_cctv", label: "📹 CCTV", bg: "bg-[#eff6ff] text-[#1e40af] border-[#93c5fd]" },
    { key: "has_security_guard", label: "🛡️ Security", bg: "bg-[#f0fdf4] text-[#166534] border-[#86efac]" },
    { key: "has_ev", label: "⚡ EV Charging", bg: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]" },
    { key: "has_covered_roof", label: "🏢 Covered", bg: "bg-[#faf5ff] text-[#6b21a8] border-[#d8b4fe]" },
    { key: "is_24_7", label: "⏰ 24/7", bg: "bg-[#f0f4ff] text-[#276ef1] border-[#93c5fd]" },
    { key: "has_valet", label: "🔑 Valet", bg: "bg-[#fef2f2] text-[#991b1b] border-[#fca5a5]" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple" dot>Super Admin</Badge>
              <span className="text-xs text-[#a0a0a0] font-medium">Facility Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">
              Verification Command Center
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Review owner submissions and grant live booking permissions.
            </p>
          </div>
          <Button
            variant="outline"
            icon={FiRefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Sync Queue
          </Button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            value={stats.pending ?? parkingList.filter((i) => (i.verification_status || "PENDING").toUpperCase() === "PENDING").length}
            subtitle="Needs review"
            icon={FiClock}
            iconBg="bg-[#fffbeb]"
            iconColor="text-[#f5a623]"
          />
          <StatCard
            title="Approved"
            value={stats.approved ?? parkingList.filter((i) => (i.verification_status || "").toUpperCase() === "APPROVED").length}
            subtitle="Live on platform"
            icon={FiCheckCircle}
            iconBg="bg-[#f0fdf4]"
            iconColor="text-[#05944f]"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected ?? parkingList.filter((i) => (i.verification_status || "").toUpperCase() === "REJECTED").length}
            subtitle="Denied compliance"
            icon={FiXCircle}
            iconBg="bg-[#fef2f2]"
            iconColor="text-[#e11900]"
          />
          <StatCard
            title="Total"
            value={stats.total ?? parkingList.length}
            subtitle="All applications"
            icon={FiShield}
            iconBg="bg-[#f0f4ff]"
            iconColor="text-[#276ef1]"
          />
        </div>

        {/* SEARCH & TABS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#e8e8e8] p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
            {[
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
              { id: "all", label: "All" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#737373] hover:text-[#0a0a0a]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0] pointer-events-none" />
            <input
              type="text"
              placeholder="Search facility or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-input pl-9 text-sm"
            />
          </div>
        </div>

        {/* FACILITY LIST */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton /><CardSkeleton />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState icon={FiShield} title="Verification queue is clear" description="No facilities in this category." />
        ) : (
          <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[#f0f0f0]">
            {filteredList.map((item) => {
              const statusRaw = (item.verification_status || item.status || "pending").toUpperCase();
              const badgeVariant = statusRaw === "APPROVED" ? "success" : statusRaw === "REJECTED" ? "danger" : "warning";

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center shrink-0">
                      <FiLayers className="w-5 h-5 text-[#276ef1]" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={badgeVariant} size="sm" dot>
                          {statusRaw}
                        </Badge>
                        <span className="text-[11px] font-bold text-[#a0a0a0]">App #{item.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#0a0a0a]">{item.name}</h3>
                      <p className="text-xs text-[#737373] flex items-center gap-1">
                        <FiMapPin className="w-3 h-3 shrink-0 text-[#276ef1]" />
                        {item.address || item.location || "City Hub"}
                      </p>
                      <p className="text-[11px] text-[#a0a0a0] flex items-center gap-1">
                        <FiUser className="w-3 h-3 shrink-0" />
                        {item.owner_name || item.owner_email || "Partner"} · {item.total_slots || 20} slots
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button variant="outline" size="md" icon={FiEye} onClick={() => setInspectModal({ open: true, item })}>
                      Inspect
                    </Button>
                    {statusRaw !== "REJECTED" && (
                      <Button variant="danger" size="md" onClick={() => setRejectModal({ open: true, item, reason: "" })}>
                        Reject
                      </Button>
                    )}
                    {statusRaw !== "APPROVED" && (
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
              );
            })}
          </div>
        )}
      </main>

      {/* INSPECT MODAL */}
      <Modal
        isOpen={inspectModal.open}
        onClose={() => setInspectModal({ open: false, item: null })}
        title="Facility Inspection"
        maxWidth="max-w-xl"
      >
        {inspectModal.item && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0] space-y-3">
              {[
                { label: "Name", value: inspectModal.item.name },
                { label: "Address", value: inspectModal.item.address },
                { label: "Total Slots", value: `${inspectModal.item.total_slots || 20} spots` },
                { label: "Hourly Rate", value: (inspectModal.item.hourly_rate ?? 0) === 0 ? "FREE" : `₹${inspectModal.item.hourly_rate}/hr` },
                { label: "GPS", value: `${inspectModal.item.latitude}, ${inspectModal.item.longitude}`, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-[#737373]">{label}</span>
                  <span className={`font-semibold text-[#0a0a0a] ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-[#e0e0e0]">
                <p className="text-xs font-semibold text-[#737373] mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_TAGS.filter((t) => inspectModal.item[t.key]).map((t) => (
                    <span key={t.key} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${t.bg}`}>
                      {t.label}
                    </span>
                  ))}
                  {!AMENITY_TAGS.some((t) => inspectModal.item[t.key]) && (
                    <span className="text-xs text-[#a0a0a0] italic">No amenities listed</span>
                  )}
                </div>
              </div>
            </div>

            {inspectModal.item.image_url && (
              <div>
                <p className="text-xs font-semibold text-[#737373] mb-2">Facility Photo</p>
                <img
                  src={inspectModal.item.image_url}
                  alt="Facility"
                  className="w-full h-44 rounded-xl object-cover border border-[#e0e0e0]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f0f0]">
              <Button variant="outline" onClick={() => setInspectModal({ open: false, item: null })}>Close</Button>
              {(inspectModal.item.verification_status || "").toUpperCase() !== "REJECTED" && (
                <Button variant="danger" onClick={() => setRejectModal({ open: true, item: inspectModal.item, reason: "" })}>
                  Reject
                </Button>
              )}
              {(inspectModal.item.verification_status || "").toUpperCase() !== "APPROVED" && (
                <Button
                  variant="success"
                  icon={FiCheck}
                  loading={actionLoading === inspectModal.item.id}
                  onClick={() => handleApprove(inspectModal.item.id)}
                >
                  Approve & Publish
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, item: null, reason: "" })}
        title="Reject Application"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#737373]">
            Provide a reason so the owner can address the issue and resubmit.
          </p>
          <textarea
            rows={4}
            placeholder="e.g. Unclear facility photos, inaccurate GPS coordinates, or incomplete documentation."
            value={rejectModal.reason}
            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            className="pe-input resize-none text-sm"
          />

          {/* Quick reject reasons */}
          <div className="flex flex-wrap gap-2">
            {["Unclear photos", "Wrong GPS location", "Incomplete docs", "Fake facility"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRejectModal({ ...rejectModal, reason: r })}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#f0f0f0] text-[#545454] hover:bg-[#e0e0e0] transition-colors"
              >
                {r}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => setRejectModal({ open: false, item: null, reason: "" })}>
              Cancel
            </Button>
            <Button
              variant="danger"
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