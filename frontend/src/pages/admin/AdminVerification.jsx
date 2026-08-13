import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";

function AdminVerification() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // LOAD ADMIN DATA
  // =========================================================

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      const [pendingResponse, historyResponse, statsResponse] =
        await Promise.all([
          axios.get("/admin/parking/pending"),
          axios.get("/admin/parking/history"),
          axios.get("/admin/verification-stats"),
        ]);

      setPending(
        Array.isArray(pendingResponse.data)
          ? pendingResponse.data
          : []
      );

      setHistory(
        Array.isArray(historyResponse.data)
          ? historyResponse.data
          : []
      );

      setStats({
        total: statsResponse.data?.total ?? 0,
        pending: statsResponse.data?.pending ?? 0,
        approved: statsResponse.data?.approved ?? 0,
        rejected: statsResponse.data?.rejected ?? 0,
      });
    } catch (error) {
      console.error("Admin data error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // APPROVE
  // =========================================================

  const approve = async (id) => {
    try {
      setLoading(true);

      await axios.put(`/admin/parking/${id}/approve`);

      setSelected(null);

      await loadData();

      alert("Parking approved successfully.");
    } catch (error) {
      console.error("Approval error:", error);

      alert(
        error?.response?.data?.detail ||
          "Approval failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REJECT
  // =========================================================

  const reject = async () => {
    if (!selected) return;

    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setLoading(true);

      await axios.put(
        `/admin/parking/${selected.id}/reject`,
        {
          reason: reason.trim(),
        }
      );

      setSelected(null);
      setReason("");

      await loadData();

      alert("Parking rejected successfully.");
    } catch (error) {
      console.error("Rejection error:", error);

      alert(
        error?.response?.data?.detail ||
          "Rejection failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // =========================================================
  // CURRENT DATA
  // =========================================================

  const currentData = useMemo(() => {
    let result = [];

    if (tab === "pending") {
      result = pending;
    } else if (tab === "approved") {
      result = history.filter(
        (item) =>
          item.verification_status === "APPROVED"
      );
    } else if (tab === "rejected") {
      result = history.filter(
        (item) =>
          item.verification_status === "REJECTED"
      );
    } else {
      result = history;
    }

    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return result;
    }

    return result.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const address = String(
        item.address || ""
      ).toLowerCase();

      const ownerName = String(
        item.owner_name || ""
      ).toLowerCase();

      const ownerEmail = String(
        item.owner_email || ""
      ).toLowerCase();

      const id = String(item.id || "").toLowerCase();

      return (
        name.includes(searchText) ||
        address.includes(searchText) ||
        ownerName.includes(searchText) ||
        ownerEmail.includes(searchText) ||
        id.includes(searchText)
      );
    });
  }, [tab, pending, history, search]);

  // =========================================================
  // MAP
  // =========================================================

  const openMap = (item) => {
    if (
      item.latitude === undefined ||
      item.longitude === undefined
    ) {
      alert("Location coordinates are not available.");
      return;
    }

    const url = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;

    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

          <div className="flex items-center justify-between gap-4">

            {/* LOGO */}

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                P
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  ParkEase
                </h1>

                <p className="text-xs text-slate-500">
                  Admin Panel
                </p>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex items-center gap-2">

              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                <span
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                >
                  ↻
                </span>

                <span className="hidden sm:inline">
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </span>
              </button>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium hover:bg-red-100 transition"
              >
                <span>↪</span>
                <span>Logout</span>
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* PAGE TITLE */}

        <div className="mb-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

            <div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Administration
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Verification Center
              </h2>

              <p className="text-slate-500 mt-2">
                Review and manage parking submissions
              </p>

            </div>

            <div className="text-sm text-slate-500">
              {stats.pending > 0 ? (
                <span className="text-amber-600 font-semibold">
                  {stats.pending} parking submission
                  {stats.pending !== 1 ? "s" : ""} waiting
                </span>
              ) : (
                <span className="text-green-600 font-semibold">
                  All submissions reviewed
                </span>
              )}
            </div>

          </div>

        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <StatCard
            title="Total"
            value={stats.total}
            icon="◉"
            description="All submissions"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon="◷"
            description="Need review"
            highlight
          />

          <StatCard
            title="Approved"
            value={stats.approved}
            icon="✓"
            description="Verified parking"
          />

          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon="×"
            description="Rejected submissions"
          />

        </div>

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">

          <div className="flex flex-col md:flex-row gap-3">

            <div className="relative flex-1">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search parking, owner, email or ID..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />

            </div>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}

          </div>

        </div>

        {/* =====================================================
            TABS
        ===================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl p-2 mb-6 shadow-sm">

          <div className="flex gap-1 overflow-x-auto">

            <TabButton
              active={tab === "pending"}
              onClick={() => setTab("pending")}
              label="Pending"
              count={stats.pending}
              color="yellow"
            />

            <TabButton
              active={tab === "approved"}
              onClick={() => setTab("approved")}
              label="Approved"
              count={stats.approved}
              color="green"
            />

            <TabButton
              active={tab === "rejected"}
              onClick={() => setTab("rejected")}
              label="Rejected"
              count={stats.rejected}
              color="red"
            />

            <TabButton
              active={tab === "history"}
              onClick={() => setTab("history")}
              label="History"
              count={history.length}
              color="blue"
            />

          </div>

        </div>

        {/* =====================================================
            RESULTS HEADER
        ===================================================== */}

        <div className="flex items-center justify-between mb-4">

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {tab === "pending"
                ? "Pending Submissions"
                : tab === "approved"
                ? "Approved Parking"
                : tab === "rejected"
                ? "Rejected Parking"
                : "Verification History"}
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              {currentData.length} record
              {currentData.length !== 1 ? "s" : ""}
              {search ? " found" : ""}
            </p>
          </div>

        </div>

        {/* =====================================================
            PARKING LIST
        ===================================================== */}

        <div className="space-y-4">

          {currentData.length === 0 ? (

            <EmptyState
              tab={tab}
              search={search}
            />

          ) : (

            currentData.map((item) => (

              <ParkingCard
                key={item.id}
                item={item}
                loading={loading}
                onApprove={approve}
                onReject={() => {
                  setSelected(item);
                  setReason("");
                }}
                onDetails={() => {
                  setSelected(item);
                  setReason("");
                }}
                onMap={() => openMap(item)}
              />

            ))

          )}

        </div>

      </main>

      {/* =====================================================
          DETAILS / REJECTION MODAL
      ===================================================== */}

      {selected && (
        <DetailsModal
          item={selected}
          reason={reason}
          setReason={setReason}
          loading={loading}
          onClose={() => {
            setSelected(null);
            setReason("");
          }}
          onApprove={approve}
          onReject={reject}
          onMap={() => openMap(selected)}
        />
      )}

    </div>
  );
}

// =============================================================
// STAT CARD
// =============================================================

function StatCard({
  title,
  value,
  icon,
  description,
  highlight = false,
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm ${
        highlight
          ? "border-amber-200 ring-1 ring-amber-100"
          : "border-slate-200"
      }`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-1">
            {value}
          </p>

        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
            highlight
              ? "bg-amber-50 text-amber-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {icon}
        </div>

      </div>

      <p className="text-xs text-slate-400 mt-3">
        {description}
      </p>

    </div>
  );
}

// =============================================================
// TAB BUTTON
// =============================================================

function TabButton({
  active,
  onClick,
  label,
  count,
  color,
}) {
  const activeClasses = {
    yellow: "bg-amber-500 text-white",
    green: "bg-green-600 text-white",
    red: "bg-red-600 text-white",
    blue: "bg-blue-600 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
        active
          ? activeClasses[color]
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}

      <span
        className={`min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-xs ${
          active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// =============================================================
// PARKING CARD
// =============================================================

function ParkingCard({
  item,
  loading,
  onApprove,
  onReject,
  onDetails,
  onMap,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">

      <div className="p-5 sm:p-6">

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">

          {/* LEFT */}

          <div className="flex-1 min-w-0">

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

              <div className="min-w-0">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    P
                  </div>

                  <div className="min-w-0">

                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {item.name || "Unnamed Parking"}
                    </h3>

                    <p className="text-sm text-slate-500 mt-0.5">
                      Parking ID: #{item.id}
                    </p>

                  </div>

                </div>

                <p className="text-sm text-slate-500 mt-4">
                  📍 {item.address || "Address unavailable"}
                </p>

              </div>

              <Status
                status={
                  item.verification_status
                }
              />

            </div>

            {/* INFO */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">

              <Info
                label="Owner"
                value={
                  item.owner_name || "N/A"
                }
              />

              <Info
                label="Email"
                value={
                  item.owner_email || "N/A"
                }
              />

              <Info
                label="Total Slots"
                value={
                  item.total_slots ?? "N/A"
                }
              />

              <Info
                label="Location"
                value={
                  item.latitude !== undefined &&
                  item.longitude !== undefined
                    ? "GPS Available"
                    : "Unavailable"
                }
              />

            </div>

            {/* REJECTION */}

            {item.rejection_reason && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">

                <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                  Rejection Reason
                </p>

                <p className="text-sm text-red-700 mt-1">
                  {item.rejection_reason}
                </p>

              </div>
            )}

          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap lg:flex-col gap-2 lg:w-40">

            <button
              onClick={onDetails}
              className="flex-1 lg:w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              View Details
            </button>

            <button
              onClick={onMap}
              className="flex-1 lg:w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition"
            >
              View Map
            </button>

            {item.verification_status === "PENDING" && (
              <>
                <button
                  onClick={() => onApprove(item.id)}
                  disabled={loading}
                  className="flex-1 lg:w-full px-4 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  onClick={onReject}
                  disabled={loading}
                  className="flex-1 lg:w-full px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

// =============================================================
// DETAILS MODAL
// =============================================================

function DetailsModal({
  item,
  reason,
  setReason,
  loading,
  onClose,
  onApprove,
  onReject,
  onMap,
}) {
  const isPending =
    item.verification_status === "PENDING";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">

        {/* MODAL HEADER */}

        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between z-10">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Parking Submission
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {item.name || "Parking Details"}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xl"
          >
            ×
          </button>

        </div>

        {/* MODAL BODY */}

        <div className="p-6 space-y-6">

          {/* STATUS */}

          <div className="flex items-center justify-between">

            <span className="text-sm font-medium text-slate-500">
              Verification Status
            </span>

            <Status
              status={
                item.verification_status
              }
            />

          </div>

          {/* BASIC DETAILS */}

          <section>

            <SectionTitle title="Parking Information" />

            <div className="grid sm:grid-cols-2 gap-3">

              <Info
                label="Parking Name"
                value={item.name}
              />

              <Info
                label="Parking ID"
                value={item.id}
              />

              <Info
                label="Address"
                value={item.address}
              />

              <Info
                label="Total Slots"
                value={item.total_slots}
              />

            </div>

          </section>

          {/* OWNER */}

          <section>

            <SectionTitle title="Owner Information" />

            <div className="grid sm:grid-cols-2 gap-3">

              <Info
                label="Owner Name"
                value={
                  item.owner_name || "N/A"
                }
              />

              <Info
                label="Owner Email"
                value={
                  item.owner_email || "N/A"
                }
              />

            </div>

          </section>

          {/* LOCATION */}

          <section>

            <SectionTitle title="Location Information" />

            <div className="grid sm:grid-cols-2 gap-3">

              <Info
                label="Latitude"
                value={
                  item.latitude ?? "N/A"
                }
              />

              <Info
                label="Longitude"
                value={
                  item.longitude ?? "N/A"
                }
              />

            </div>

            <button
              onClick={onMap}
              className="mt-3 w-full py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
            >
              📍 Open Location in Google Maps
            </button>

          </section>

          {/* REJECTION REASON */}

          {item.rejection_reason && (
            <section>

              <SectionTitle title="Rejection Information" />

              <div className="p-4 rounded-xl bg-red-50 border border-red-100">

                <p className="text-sm text-red-700">
                  {item.rejection_reason}
                </p>

              </div>

            </section>
          )}

          {/* REJECTION INPUT */}

          {isPending && (
            <section>

              <SectionTitle title="Reject Parking" />

              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                rows={4}
                placeholder="Enter the reason if you want to reject this parking..."
                className="w-full border border-slate-200 rounded-xl p-4 outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />

            </section>
          )}

        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">

          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
          >
            Close
          </button>

          {isPending && (
            <>
              <button
                onClick={onReject}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : "Reject Parking"}
              </button>

              <button
                onClick={() => onApprove(item.id)}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : "Approve Parking"}
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

// =============================================================
// SECTION TITLE
// =============================================================

function SectionTitle({ title }) {
  return (
    <h3 className="text-sm font-bold text-slate-900 mb-3">
      {title}
    </h3>
  );
}

// =============================================================
// INFO
// =============================================================

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">

      <p className="text-xs text-slate-400 font-medium">
        {label}
      </p>

      <p className="text-sm font-semibold text-slate-800 mt-1 break-words">
        {value ?? "N/A"}
      </p>

    </div>
  );
}

// =============================================================
// STATUS
// =============================================================

function Status({ status }) {
  const classes = {
    PENDING:
      "bg-amber-50 text-amber-700 border-amber-200",

    APPROVED:
      "bg-green-50 text-green-700 border-green-200",

    REJECTED:
      "bg-red-50 text-red-700 border-red-200",
  };

  const icons = {
    PENDING: "◷",
    APPROVED: "✓",
    REJECTED: "×",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
        classes[status] ||
        "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      <span>
        {icons[status] || "•"}
      </span>

      {status || "UNKNOWN"}
    </span>
  );
}

// =============================================================
// EMPTY STATE
// =============================================================

function EmptyState({ tab, search }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">

      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-2xl text-slate-400">
        {search ? "⌕" : "✓"}
      </div>

      <h3 className="text-lg font-bold text-slate-800 mt-5">
        {search
          ? "No matching records"
          : tab === "pending"
          ? "No pending submissions"
          : "No records found"}
      </h3>

      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        {search
          ? "Try searching with a different parking name, owner name, email or parking ID."
          : tab === "pending"
          ? "There are currently no parking locations waiting for verification."
          : "There are no parking records available in this section."}
      </p>

    </div>
  );
}

export default AdminVerification;