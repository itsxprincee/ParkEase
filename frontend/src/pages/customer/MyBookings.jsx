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
  FiEye,
  FiTrash2,
  FiNavigation,
  FiRefreshCw,
  FiX,
  FiCreditCard,
  FiShield,
  FiArrowRight,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, UPCOMING, COMPLETED, CANCELLED

  // Selected Booking for Invoice / Details
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
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.bookings || [];
      setBookings(list);
    } catch (error) {
      console.error("Failed to load bookings:", error);
      showToast("Unable to load bookings.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      await API.post(`/booking/cancel/${cancelModalBooking.id}`);
      showToast("Booking cancelled successfully.", "success");
      setCancelModalBooking(null);
      loadBookings(true);
    } catch (error) {
      console.error("Cancel failed:", error);
      showToast(
        error?.response?.data?.detail || "Failed to cancel reservation.",
        "error"
      );
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

  const getBadgeVariant = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "BOOKED":
        return "active";
      case "UPCOMING":
      case "CONFIRMED":
        return "primary";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
        return "cancelled";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-black flex flex-col font-sans">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold ${
              toast.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              My Parking Passes
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
              Manage your active digital gate tickets and past parking history.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadBookings(true)}
              className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 hover:border-black text-black text-xs font-bold transition"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate("/customer/dashboard")}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black transition flex items-center gap-2 shadow-sm"
            >
              <span>Book Spot</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SEARCH & STATUS TABS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* STATUS TABS */}
          <div className="flex items-center gap-1.5 bg-neutral-200 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: "ALL", label: "All Passes" },
              { id: "ACTIVE", label: "Active" },
              { id: "UPCOMING", label: "Upcoming" },
              { id: "COMPLETED", label: "Completed" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div className="w-full sm:w-72">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus-within:border-black transition">
              <FiSearch className="text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search passes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-black font-semibold placeholder-neutral-400 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-neutral-400 hover:text-black"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BOOKINGS LIST */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No parking passes found"
            description="You don't have any bookings matching this filter. Find verified parking spots nearby and book instantly."
            actionLabel="Find Parking Spots"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((b) => {
              const status = b.status?.toUpperCase() || "ACTIVE";
              const isActive = status === "ACTIVE" || status === "BOOKED";

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:border-black transition-all flex flex-col justify-between space-y-4"
                >
                  {/* TOP STRIP */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {status}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-400">
                          Pass #{b.id}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-black line-clamp-1">
                        {b.parking_name || "ParkEase Facility"}
                      </h3>
                      <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5 text-black shrink-0" />
                        <span>{b.parking_address || "City Center Zone"}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-black bg-neutral-100 px-2.5 py-1 rounded-xl border border-neutral-200">
                        Slot {b.slot_number || "A-1"}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-bold uppercase">
                        Date
                      </span>
                      <span className="font-bold text-black">
                        {b.booking_date || "Today"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-bold uppercase">
                        Window
                      </span>
                      <span className="font-bold text-black">
                        {b.start_time || "10:00"} - {b.end_time || "12:00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-bold uppercase">
                        Vehicle
                      </span>
                      <span className="font-bold text-black truncate block">
                        {b.vehicle_number || "MH-01-AB-1234"}
                      </span>
                    </div>
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInvoiceModalBooking(b)}
                        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <FiPrinter className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>

                      {isActive && (
                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/customer/qr?booking=${b.id}`, {
                          state: { booking: b },
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black shadow-sm transition"
                    >
                      {isActive ? "Show QR Pass &rarr;" : "View Pass"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PRINTABLE RECEIPT / INVOICE MODAL */}
      <Modal
        isOpen={!!invoiceModalBooking}
        onClose={() => setInvoiceModalBooking(null)}
        title="Official Parking Receipt"
        maxWidth="max-w-lg"
      >
        {invoiceModalBooking && (
          <div className="space-y-6 text-slate-800" id="printable-receipt">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  ParkEase Smart Systems
                </h4>
                <p className="text-xs text-slate-500">Tax Invoice & Digital Pass Receipt</p>
              </div>
              <Badge variant="success" size="sm">
                Paid Verified
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Receipt No</span>
                <span className="font-bold text-slate-900">INV-PK-{invoiceModalBooking.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Date & Time</span>
                <span className="font-bold text-slate-900">
                  {invoiceModalBooking.booking_date} | {invoiceModalBooking.start_time}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Facility</span>
                <span className="font-bold text-slate-900">
                  {invoiceModalBooking.parking_name || "ParkEase Hub"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Reserved Slot</span>
                <span className="font-bold text-indigo-600">
                  {invoiceModalBooking.slot_number || "A-1"}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Vehicle Registered</span>
                <span className="font-bold text-slate-900">
                  {invoiceModalBooking.vehicle_number || "MH-01-AB-1234"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Duration Scheduled</span>
                <span className="font-bold text-slate-900">
                  {invoiceModalBooking.duration_hours || 2} Hours
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Convenience Platform Fee</span>
                <span className="font-bold text-slate-900">₹5.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-emerald-600">
                  ₹{invoiceModalBooking.total_amount || 105}.00
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setInvoiceModalBooking(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={FiPrinter}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL BOOKING MODAL */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title="Cancel Parking Pass"
        maxWidth="max-w-md"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiAlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Cancel Pass #{cancelModalBooking?.id}?
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Your reserved spot at {cancelModalBooking?.parking_name} will be released for other drivers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCancelModalBooking(null)}
            >
              Keep Pass
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={cancelling}
              onClick={handleCancelBooking}
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}