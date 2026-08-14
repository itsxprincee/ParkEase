import { useEffect, useState } from "react";
import API from "../../api/axios";
import {
  LayoutDashboard,
  Clock3,
  CheckCircle2,
  XCircle,
  Car,
  MapPin,
  Mail,
  User,
  Layers3,
  RefreshCw,
  LogOut,
  ShieldCheck,
  X,
  AlertTriangle,
  History,
  FileCheck2,
  Search,
} from "lucide-react";

function AdminDashboard() {
  const [parking, setParking] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [lastUpdated, setLastUpdated] = useState("");

  // ================= ACTIVE TAB =================

  const [activeTab, setActiveTab] = useState("pending");

  // ================= SEARCH =================

  const [searchQuery, setSearchQuery] = useState("");

  // ================= LOAD DATA =================

  const loadData = async () => {
    try {
      setLoading(true);

      const [parkingResponse, statsResponse] = await Promise.all([
        API.get("/admin/parking/pending"),
        API.get("/admin/verification-stats"),
      ]);

      setParking(parkingResponse.data || []);

      setStats(
        statsResponse.data || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      );

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);

      alert(
        error?.response?.data?.detail ||
          "Failed to load admin dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= APPROVE =================

  const approveParking = async (id) => {
    try {
      setActionLoading(id);

      await API.put(`/admin/parking/${id}/approve`);

      await loadData();
    } catch (error) {
      console.error("Approve parking error:", error);

      alert(
        error?.response?.data?.detail ||
          "Failed to approve parking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= REJECT =================

  const rejectParking = async (id) => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setActionLoading(id);

      await API.put(`/admin/parking/${id}/reject`, {
        reason: rejectionReason.trim(),
      });

      setRejectingId(null);
      setRejectionReason("");

      await loadData();
    } catch (error) {
      console.error("Reject parking error:", error);

      alert(
        error?.response?.data?.detail ||
          "Failed to reject parking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= LOGOUT =================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // ================= SEARCH FILTER =================

  const filteredParking = parking.filter((item) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return true;

    const parkingName = String(
      item.name || ""
    ).toLowerCase();

    const parkingId = String(
      item.id || ""
    ).toLowerCase();

    return (
      parkingName.includes(query) ||
      parkingId.includes(query)
    );
  });

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />

          <p className="text-slate-600 font-medium">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ================= STAT CARDS =================

  const statCards = [
    {
      title: "Total Parking",
      value: stats.total,
      icon: Car,
      iconBg: "bg-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock3,
      iconBg: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      iconBg: "bg-emerald-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      iconBg: "bg-red-600",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  // ================= TAB CONFIG =================

  const tabs = [
    {
      id: "pending",
      label: "Pending",
      count: stats.pending || 0,
      icon: Clock3,
      activeClass:
        "bg-amber-500 text-white shadow-md shadow-amber-200",
      inactiveClass:
        "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100",
    },
    {
      id: "approved",
      label: "Approved",
      count: stats.approved || 0,
      icon: CheckCircle2,
      activeClass:
        "bg-emerald-600 text-white shadow-md shadow-emerald-200",
      inactiveClass:
        "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100",
    },
    {
      id: "rejected",
      label: "Rejected",
      count: stats.rejected || 0,
      icon: XCircle,
      activeClass:
        "bg-red-600 text-white shadow-md shadow-red-200",
      inactiveClass:
        "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100",
    },
    {
      id: "history",
      label: "History",
      count: stats.total || 0,
      icon: History,
      activeClass:
        "bg-violet-600 text-white shadow-md shadow-violet-200",
      inactiveClass:
        "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ParkEase Admin
              </h1>

              <p className="text-sm text-slate-500">
                Parking verification management
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <LogOut size={18} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ================= PAGE TITLE ================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <LayoutDashboard size={18} />

              <span className="font-semibold text-sm">
                ADMIN CONTROL CENTER
              </span>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Dashboard Overview
            </h2>

            <p className="text-slate-500 mt-2">
              Review and manage parking locations submitted by owners.
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-400">
                Last updated
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {lastUpdated || "Just now"}
              </p>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all shadow-sm"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>
        </div>

        {/* ================= STATISTICS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <h3 className="text-3xl font-bold text-slate-900 mt-2">
                      {card.value || 0}
                    </h3>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-xl ${card.iconBg} text-white flex items-center justify-center shadow-sm`}
                  >
                    <Icon size={22} />
                  </div>

                </div>

                <div
                  className={`mt-5 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${card.bg} ${card.text}`}
                >
                  Current status
                </div>

              </div>
            );
          })}

        </div>

        {/* ================= TABS ================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">

          <div className="flex flex-wrap gap-3">

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setRejectingId(null);
                    setRejectionReason("");
                    setSearchQuery("");
                  }}
                  className={`
                    flex items-center gap-2
                    px-5 py-3
                    rounded-xl
                    font-semibold
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    ${
                      isActive
                        ? tab.activeClass
                        : tab.inactiveClass
                    }
                  `}
                >
                  <Icon size={18} />

                  <span>{tab.label}</span>

                  <span
                    className={`
                      min-w-7 h-7 px-2
                      rounded-lg
                      flex items-center justify-center
                      text-xs font-bold
                      ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/70"
                      }
                    `}
                  >
                    {tab.count}
                  </span>

                </button>
              );
            })}

          </div>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* ================= PENDING ================= */}

          {activeTab === "pending" && (
            <>

              <div className="p-6 border-b border-slate-200">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div>
                    <div className="flex items-center gap-2">
                      <Clock3
                        className="text-amber-500"
                        size={22}
                      />

                      <h2 className="text-xl font-bold text-slate-900">
                        Pending Submissions
                      </h2>
                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      Parking locations waiting for admin verification.
                    </p>
                  </div>

                  <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-semibold text-sm">
                    {filteredParking.length} records
                  </div>

                </div>

                {/* ================= SEARCH BAR ================= */}

                <div className="mt-5 relative">

                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    placeholder="Search by Parking Name or Parking ID/Number..."
                    className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl outline-none text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />

                  {searchQuery && (
                    <button
                      onClick={() =>
                        setSearchQuery("")
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  )}

                </div>

              </div>

              {/* ================= NO PENDING ================= */}

              {parking.length === 0 ? (

                <div className="py-20 px-6 text-center">

                  <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-5">
                    <Clock3 size={38} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    No pending submissions
                  </h3>

                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    There are currently no parking locations waiting for verification.
                  </p>

                </div>

              ) : filteredParking.length === 0 ? (

                <div className="py-20 px-6 text-center">

                  <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                    <Search size={38} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    No parking found
                  </h3>

                  <p className="text-slate-500 mt-2">
                    No parking matches "{searchQuery}".
                  </p>

                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-5 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                  >
                    Clear Search
                  </button>

                </div>

              ) : (

                <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {filteredParking.map((item) => (

                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                    >

                      <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">

                        <div className="flex items-start gap-4">

                          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                            <Car size={23} />
                          </div>

                          <div>

                            <h3 className="font-bold text-lg text-slate-900">
                              {item.name || "Unnamed Parking"}
                            </h3>

                            <div className="flex items-center gap-2 mt-2">

                              <span className="w-2 h-2 rounded-full bg-amber-500" />

                              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                Pending Review
                              </span>

                            </div>

                          </div>

                        </div>

                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                          #{item.id}
                        </span>

                      </div>

                      <div className="p-5 space-y-4">

                        <div className="flex gap-3">

                          <User
                            size={18}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />

                          <div>

                            <p className="text-xs text-slate-400">
                              Parking Owner
                            </p>

                            <p className="font-semibold text-slate-800">
                              {item.owner_name || "Not available"}
                            </p>

                          </div>

                        </div>

                        <div className="flex gap-3">

                          <Mail
                            size={18}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />

                          <div className="min-w-0">

                            <p className="text-xs text-slate-400">
                              Email Address
                            </p>

                            <p className="font-medium text-slate-700 break-all">
                              {item.owner_email || "Not available"}
                            </p>

                          </div>

                        </div>

                        <div className="flex gap-3">

                          <MapPin
                            size={18}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />

                          <div>

                            <p className="text-xs text-slate-400">
                              Parking Address
                            </p>

                            <p className="font-medium text-slate-700">
                              {item.address || "Address not provided"}
                            </p>

                          </div>

                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">

                          <div className="bg-slate-50 rounded-xl p-4">

                            <p className="text-xs text-slate-400">
                              Total Slots
                            </p>

                            <div className="flex items-center gap-2 mt-2">

                              <Layers3
                                size={18}
                                className="text-blue-600"
                              />

                              <p className="text-xl font-bold text-slate-900">
                                {item.total_slots || 0}
                              </p>

                            </div>

                          </div>

                          <div className="bg-slate-50 rounded-xl p-4">

                            <p className="text-xs text-slate-400">
                              Coordinates
                            </p>

                            <p className="text-sm font-semibold text-slate-700 mt-2">

                              {item.latitude
                                ? Number(item.latitude).toFixed(3)
                                : "--"}

                              ,{" "}

                              {item.longitude
                                ? Number(item.longitude).toFixed(3)
                                : "--"}

                            </p>

                          </div>

                        </div>

                      </div>

                      <div className="p-5 border-t border-slate-200 flex flex-col sm:flex-row gap-3">

                        <button
                          onClick={() =>
                            approveParking(item.id)
                          }
                          disabled={actionLoading === item.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-all"
                        >
                          <CheckCircle2 size={19} />

                          {actionLoading === item.id
                            ? "Processing..."
                            : "Approve Parking"}

                        </button>

                        <button
                          onClick={() => {
                            setRejectingId(item.id);
                            setRejectionReason("");
                          }}
                          disabled={actionLoading === item.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 px-5 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-60 transition-all"
                        >
                          <XCircle size={19} />
                          Reject
                        </button>

                      </div>

                      {rejectingId === item.id && (

                        <div className="border-t border-red-100 bg-red-50 p-5">

                          <div className="flex items-center gap-2 mb-3 text-red-700">

                            <AlertTriangle size={18} />

                            <h4 className="font-bold">
                              Reject Parking Location
                            </h4>

                          </div>

                          <textarea
                            value={rejectionReason}
                            onChange={(e) =>
                              setRejectionReason(e.target.value)
                            }
                            placeholder="Explain why this parking location is being rejected..."
                            rows={4}
                            className="w-full resize-none rounded-xl border border-red-200 bg-white p-4 text-slate-700 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                          />

                          <div className="flex flex-col sm:flex-row gap-3 mt-4">

                            <button
                              onClick={() =>
                                rejectParking(item.id)
                              }
                              disabled={actionLoading === item.id}
                              className="flex-1 bg-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition-all"
                            >
                              {actionLoading === item.id
                                ? "Processing..."
                                : "Confirm Rejection"}
                            </button>

                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason("");
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                            >
                              <X size={18} />
                              Cancel
                            </button>

                          </div>

                        </div>

                      )}

                    </div>

                  ))}

                </div>

              )}

            </>
          )}

          {/* ================= APPROVED ================= */}

          {activeTab === "approved" && (
            <div className="py-20 px-6 text-center">

              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <CheckCircle2 size={38} />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Approved Parking
              </h3>

              <p className="text-slate-500 mt-2">
                {stats.approved || 0} parking location(s) have been approved.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">
                <FileCheck2 size={19} />
                Approved Records: {stats.approved || 0}
              </div>

            </div>
          )}

          {/* ================= REJECTED ================= */}

          {activeTab === "rejected" && (
            <div className="py-20 px-6 text-center">

              <div className="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-5">
                <XCircle size={38} />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Rejected Parking
              </h3>

              <p className="text-slate-500 mt-2">
                {stats.rejected || 0} parking location(s) have been rejected.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-700 font-semibold">
                <XCircle size={19} />
                Rejected Records: {stats.rejected || 0}
              </div>

            </div>
          )}

          {/* ================= HISTORY ================= */}

          {activeTab === "history" && (
            <div className="py-20 px-6 text-center">

              <div className="w-20 h-20 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-5">
                <History size={38} />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Verification History
              </h3>

              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                View the overall verification activity for parking submissions.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">

                <div className="bg-amber-50 rounded-2xl p-5">
                  <p className="text-sm text-amber-700">
                    Pending
                  </p>

                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    {stats.pending || 0}
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-5">
                  <p className="text-sm text-emerald-700">
                    Approved
                  </p>

                  <p className="text-2xl font-bold text-emerald-600 mt-2">
                    {stats.approved || 0}
                  </p>
                </div>

                <div className="bg-red-50 rounded-2xl p-5">
                  <p className="text-sm text-red-700">
                    Rejected
                  </p>

                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {stats.rejected || 0}
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;