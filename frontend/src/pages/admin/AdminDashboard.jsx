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
  FiRadio,
  FiZap,
  FiDollarSign,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import { useLanguage } from "../../context/LanguageContext";

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

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) {
      setDisplay(0);
      return;
    }
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, 400 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
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
      if (statsRes.status === "fulfilled")
        setStats(statsRes.value.data || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (_) {
      showToast("Unable to load verification queue.", "error");
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
        reason: rejectModal.reason || "Documentation or address verification incomplete.",
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
    { key: "has_cctv", label: "📹 CCTV" },
    { key: "has_security_guard", label: "🛡️ Security" },
    { key: "has_ev", label: "⚡ EV Charging" },
    { key: "has_covered_roof", label: "🏢 Covered" },
    { key: "is_24_7", label: "⏰ 24/7" },
    { key: "has_valet", label: "🔑 Valet" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Obsidian Command Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#0d0d12] to-black border border-zinc-800/90 shadow-[0_16px_50px_rgba(0,0,0,0.35)] text-white p-6 sm:p-8">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>SUPER ADMIN VERIFICATION TERMINAL</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Facility Compliance & Approvals
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Review owner parking listings, inspect slot integrity, and authorize live booking status.
              </p>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.15] text-white text-xs font-bold transition-all active:scale-95 shadow-md self-start sm:self-auto cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
              <span>Sync Applications</span>
            </button>
          </div>
        </div>

        {/* STATS TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: "pending",
              label: "Pending Review",
              value: stats.pending,
              border: "border-t-amber-500",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              icon: FiClock,
            },
            {
              id: "approved",
              label: "Approved & Live",
              value: stats.approved,
              border: "border-t-emerald-500",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              icon: FiCheckCircle,
            },
            {
              id: "rejected",
              label: "Rejected Compliance",
              value: stats.rejected,
              border: "border-t-red-500",
              color: "text-red-500",
              bg: "bg-red-500/10",
              icon: FiXCircle,
            },
            {
              id: "all",
              label: "Total Registered",
              value: stats.total,
              border: "border-t-indigo-500",
              color: "text-indigo-500",
              bg: "bg-indigo-500/10",
              icon: FiShield,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className={`p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 ${card.border} border-t-[3px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-xl`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase text-zinc-400">
                    {card.label}
                  </span>
                  <div className={`w-8 h-8 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
                  <AnimatedNumber value={card.value} />
                </div>
              </div>
            );
          })}
        </div>

        {/* TABS + SEARCH */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-3 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl overflow-x-auto">
            {[
              { id: "pending", label: "⏳ Pending Verification" },
              { id: "approved", label: "✅ Approved Live" },
              { id: "rejected", label: "❌ Rejected" },
              { id: "all", label: "📁 All Listings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-black"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, owner, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-input pe-input-icon-left text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs"
            />
          </div>
        </div>

        {/* APPLICATIONS LIST */}
        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon={FiShield}
            title="Verification queue is all clear"
            description="No applications currently match this filter."
          />
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => {
              const statusRaw = (item.verification_status || item.status || "pending").toUpperCase();
              const badgeVariant =
                statusRaw === "APPROVED" ? "success" : statusRaw === "REJECTED" ? "danger" : "warning";

              return (
                <div
                  key={item.id}
                  className="p-5 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-xs text-xl">
                      🅿️
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={badgeVariant} size="sm" dot>
                          {statusRaw}
                        </Badge>
                        <span className="text-[11px] font-black text-zinc-400 font-mono">
                          App #{item.id}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-zinc-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <FiMapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span>{item.address || item.location || "City Location"}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        Owner: {item.owner_name || item.owner_email || "Partner"} • {item.total_slots || 12} Total Bays • ₹{item.hourly_rate ?? 50}/hr
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                    <button
                      onClick={() => setInspectModal({ open: true, item })}
                      className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>Inspect Details</span>
                    </button>

                    {statusRaw !== "REJECTED" && (
                      <button
                        onClick={() => setRejectModal({ open: true, item, reason: "" })}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    )}

                    {statusRaw !== "APPROVED" && (
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleApprove(item.id)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <FiCheck className="w-4 h-4 stroke-[3]" />
                        <span>{actionLoading === item.id ? "Approving..." : "Approve & Publish"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── INSPECT FACILITY MODAL ─── */}
      {inspectModal.open && inspectModal.item && (
        <Modal
          isOpen={inspectModal.open}
          onClose={() => setInspectModal({ open: false, item: null })}
          title={`Inspect "${inspectModal.item.name}"`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 p-2">
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                <p className="font-bold text-zinc-400 uppercase text-[10px]">Location & Address</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {inspectModal.item.address}
                </p>
                <p className="text-zinc-400 text-[11px] font-mono">
                  Coordinates: {inspectModal.item.latitude || "19.07"}, {inspectModal.item.longitude || "72.87"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold">Total Bays</p>
                  <p className="text-base font-black text-zinc-900 dark:text-white font-mono">
                    {inspectModal.item.total_slots} Slots
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold">Hourly Rate</p>
                  <p className="text-base font-black text-zinc-900 dark:text-white font-mono">
                    ₹{inspectModal.item.hourly_rate}/hr
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                <p className="text-zinc-400 text-[10px] uppercase font-bold">Verified Amenities</p>
                <div className="flex gap-2 flex-wrap">
                  {AMENITY_TAGS.map((tag) => (
                    <span
                      key={tag.key}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        inspectModal.item[tag.key]
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 line-through opacity-50"
                      }`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="danger"
                onClick={() => {
                  const it = inspectModal.item;
                  setInspectModal({ open: false, item: null });
                  setRejectModal({ open: true, item: it, reason: "" });
                }}
              >
                Reject Listing
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApprove(inspectModal.item.id)}
              >
                Approve & Publish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── REJECT REASON MODAL ─── */}
      {rejectModal.open && rejectModal.item && (
        <Modal
          isOpen={rejectModal.open}
          onClose={() => setRejectModal({ open: false, item: null, reason: "" })}
          title="Reject Facility Listing"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                Reject "{rejectModal.item.name}"?
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                State the compliance reason for the facility owner.
              </p>
            </div>

            <textarea
              rows={3}
              placeholder="e.g. Inaccurate location coordinates or missing address documents..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="pe-input text-xs w-full"
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setRejectModal({ open: false, item: null, reason: "" })}
              >
                Cancel
              </Button>
              <Button variant="danger" loading={Boolean(actionLoading)} onClick={handleReject}>
                Confirm Reject
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
