import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiTruck,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiPrinter,
  FiX,
  FiArrowRight,
  FiRefreshCw,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
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

const STATUS_VARIANT = {
  ACTIVE: "success", BOOKED: "success",
  UPCOMING: "info", CONFIRMED: "info",
  COMPLETED: "default", CANCELLED: "danger",
};

const STATUS_BG = {
  ACTIVE: "bg-[#f0fdf4] border-[#86efac]",
  BOOKED: "bg-[#f0fdf4] border-[#86efac]",
  UPCOMING: "bg-[#eff6ff] border-[#93c5fd]",
  CONFIRMED: "bg-[#eff6ff] border-[#93c5fd]",
  COMPLETED: "bg-[#f0f0f0] border-[#e0e0e0]",
  CANCELLED: "bg-[#fef2f2] border-[#fca5a5]",
};

export default function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [invoiceModalBooking, setInvoiceModalBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await API.get("/booking/my-bookings");
      const list = Array.isArray(response.data) ? response.data : response.data?.bookings || [];
      setBookings(list);
    } catch (_) {
      showToast("Unable to load bookings.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      await API.post(`/booking/cancel/${cancelModalBooking.id}`);
      showToast("Booking cancelled successfully.", "success");
      setCancelModalBooking(null);
      loadBookings(true);
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to cancel.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.parking_name?.toLowerCase().includes(q) ||
        item.slot_number?.toLowerCase().includes(q) ||
        String(item.id).includes(q) ||
        item.vehicle_number?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const status = item.status?.toUpperCase() || "ACTIVE";
      if (statusFilter === "ACTIVE") return status === "ACTIVE" || status === "BOOKED";
      if (statusFilter === "UPCOMING") return status === "UPCOMING" || status === "CONFIRMED";
      if (statusFilter === "COMPLETED") return status === "COMPLETED";
      if (statusFilter === "CANCELLED") return status === "CANCELLED";
      return true;
    });
  }, [bookings, search, statusFilter]);

  const tabs = [
    { id: "ALL", label: "All" },
    { id: "ACTIVE", label: "Active" },
    { id: "UPCOMING", label: "Upcoming" },
    { id: "COMPLETED", label: "Completed" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              My Passes & Bookings
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Active gate passes and parking history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={FiRefreshCw}
              loading={refreshing}
              onClick={() => loadBookings(true)}
            >
              Refresh
            </Button>
            <Button
              icon={FiMapPin}
              onClick={() => navigate("/customer/dashboard")}
            >
              Find Parking
            </Button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-1 bg-[#e8e8e8] p-1 rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === tab.id ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#737373] hover:text-[#0a0a0a]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64 flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#737373] pointer-events-none z-10">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search passes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-input pe-input-icon-left text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a] z-10">
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* BOOKINGS LIST */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton /><CardSkeleton />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No passes found"
            description="You don't have any bookings matching this filter."
            actionLabel="Find Parking"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((b) => {
              const status = b.status?.toUpperCase() || "ACTIVE";
              const isActive = status === "ACTIVE" || status === "BOOKED";
              const bgClass = STATUS_BG[status] || STATUS_BG.COMPLETED;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#a0a0a0] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col"
                >
                  {/* Status strip */}
                  <div className={`px-5 py-2.5 border-b rounded-t-2xl flex items-center justify-between ${bgClass}`}>
                    <Badge variant={STATUS_VARIANT[status] || "default"} dot>
                      {status}
                    </Badge>
                    <span className="text-[11px] font-bold text-[#a0a0a0]">Pass #{b.id}</span>
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#0a0a0a] line-clamp-1">
                          {b.parking_name || "ParkEase Facility"}
                        </h3>
                        <p className="text-xs text-[#737373] flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3 h-3 shrink-0" />
                          {b.parking_address || "City Center Zone"}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#f0f0f0] text-xs font-black text-[#0a0a0a] shrink-0">
                        Slot {b.slot_number || "A-1"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#f7f7f7] border border-[#f0f0f0]">
                      <div>
                        <p className="text-[10px] text-[#a0a0a0] font-semibold uppercase mb-0.5">Date</p>
                        <p className="text-xs font-bold text-[#0a0a0a]">{b.booking_date || "Today"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#a0a0a0] font-semibold uppercase mb-0.5">
                          {b.pass_type === "DAILY_PASS" ? "Curfew" : "Time"}
                        </p>
                        <p className="text-xs font-bold text-[#0a0a0a]">
                          {b.pass_type === "DAILY_PASS" ? `Before ${b.last_exit_rule || "11:00 PM"}` : `${b.start_time || "10:00"} – ${b.end_time || "12:00"}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#a0a0a0] font-semibold uppercase mb-0.5">Vehicle</p>
                        <p className="text-xs font-bold text-[#0a0a0a] truncate">{b.vehicle_number || "–"}</p>
                      </div>
                    </div>

                    {/* Daily pass badge */}
                    {b.pass_type === "DAILY_PASS" && (
                      <div className="p-2.5 rounded-xl bg-[#f0fdf4] border border-[#86efac] text-[11px] font-bold text-[#05944f] flex items-center justify-between">
                        <span>🎟️ Unlimited Day Pass {b.entry_count > 0 ? `· Entry #${b.entry_count}` : ""}</span>
                        <span>{b.is_inside ? "🟢 Inside Deck" : "⚪ Out (Pass Active)"}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f0f0f0]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setInvoiceModalBooking(b)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f0f0f0] hover:bg-[#e0e0e0] text-xs font-semibold text-[#0a0a0a] transition-colors"
                        >
                          <FiPrinter className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                        {isActive && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-[#e11900] hover:bg-[#fef2f2] transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/customer/qr?booking=${b.id}`, { state: { booking: b } })}
                        className="px-4 py-2 rounded-lg bg-[#0a0a0a] hover:bg-[#242424] text-white text-xs font-bold transition-colors"
                      >
                        {isActive ? "QR Pass →" : "View Pass"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* RECEIPT MODAL */}
      <Modal isOpen={!!invoiceModalBooking} onClose={() => setInvoiceModalBooking(null)} title="Parking Receipt" maxWidth="max-w-md">
        {invoiceModalBooking && (
          <div className="space-y-5" id="printable-receipt">
            <div className="flex items-start justify-between pb-4 border-b border-[#f0f0f0]">
              <div>
                <p className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wide">Invoice</p>
                <p className="font-bold text-[#0a0a0a] mt-0.5">INV-PK-{invoiceModalBooking.id}</p>
              </div>
              <Badge variant="success" dot>Verified</Badge>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: "Facility", value: invoiceModalBooking.parking_name || "ParkEase Hub" },
                { label: "Date", value: invoiceModalBooking.booking_date || "–" },
                { label: "Time Window", value: `${invoiceModalBooking.start_time || "10:00"} – ${invoiceModalBooking.end_time || "12:00"}` },
                { label: "Slot", value: invoiceModalBooking.slot_number || "A-1" },
                { label: "Vehicle", value: invoiceModalBooking.vehicle_number || "–" },
                { label: "Duration", value: `${invoiceModalBooking.duration_hours || 2} hrs` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[#737373]">{label}</span>
                  <span className="font-semibold text-[#0a0a0a]">{value}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-[#f0f0f0] flex justify-between font-bold">
                <span className="text-[#0a0a0a]">Total Paid</span>
                <span className="text-[#05944f]">₹{invoiceModalBooking.total_amount || 105}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => setInvoiceModalBooking(null)}>Close</Button>
              <Button variant="primary" fullWidth icon={FiPrinter} onClick={() => window.print()}>Print</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL MODAL */}
      <Modal isOpen={!!cancelModalBooking} onClose={() => setCancelModalBooking(null)} title="Cancel Booking" maxWidth="max-w-sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto">
            <FiAlertCircle className="w-7 h-7 text-[#e11900]" />
          </div>
          <div>
            <p className="font-bold text-[#0a0a0a]">Cancel Pass #{cancelModalBooking?.id}?</p>
            <p className="text-sm text-[#737373] mt-1">
              Your spot at <strong>{cancelModalBooking?.parking_name}</strong> will be released.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="outline" onClick={() => setCancelModalBooking(null)}>Keep Pass</Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancelBooking}>Confirm Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}