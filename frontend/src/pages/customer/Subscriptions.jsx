import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiZap,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiTruck,
  FiShield,
  FiArrowRight,
  FiRefreshCw,
  FiAward,
  FiDownload,
  FiStar,
  FiX,
  FiPauseCircle,
  FiPlayCircle,
  FiCompass,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

/* ─── Toast Notification ─────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-2xl text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-4 h-4" />
          </div>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

const COMMUTER_PLANS = [
  {
    id: "OFFICE_PRO",
    title: "Office Commuter Pass",
    badge: "Most Popular for Tech Parks",
    icon: "🏢",
    price: 1499,
    originalPrice: 2250,
    savePercent: "35% OFF",
    hours: "Mon – Fri • 8:00 AM – 8:30 PM",
    features: [
      "Guaranteed Dedicated Reserved Bay",
      "Unlimited Daily In & Out Gate Passes",
      "Priority Barrier Access (Zero Waiting)",
      "Automated Monthly GST Tax Invoices",
    ],
    accentColor: "from-blue-600 to-indigo-600",
  },
  {
    id: "MASTER_24_7",
    title: "24/7 Unlimited Master Pass",
    badge: "All-Access VIP Pass",
    icon: "⚡",
    price: 2499,
    originalPrice: 3800,
    savePercent: "40% OFF",
    hours: "24/7 • 30 Days Round-the-Clock",
    features: [
      "24/7 Round-the-Clock Unrestricted Access",
      "Priority EV Fast Charger Bay Allocation",
      "Dedicated Reserved Prime Bay with Plate Tag",
      "Complimentary 1x Monthly Car Foam Wash",
    ],
    accentColor: "from-emerald-500 to-teal-500",
    popular: true,
  },
  {
    id: "NIGHT_RESIDENT",
    title: "Night Resident Pass",
    badge: "Safe Overnight Parking",
    icon: "🌙",
    price: 999,
    originalPrice: 1500,
    savePercent: "33% OFF",
    hours: "All 7 Days • 6:00 PM – 9:00 AM",
    features: [
      "Overnight Safe CCTV-Protected Spot",
      "Guaranteed Safe Covered Deck Slot",
      "Night Security Guard Stationed",
      "Instant Gate Exit before 9:00 AM",
    ],
    accentColor: "from-purple-600 to-pink-600",
  },
];

export default function Subscriptions() {
  const navigate = useNavigate();

  const [parkingLocations, setParkingLocations] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Active user subscriptions stored in local state & storage
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem("parkease_user_subscriptions");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: "SUB-84920",
        planId: "MASTER_24_7",
        planTitle: "24/7 Unlimited Master Pass",
        facilityName: "Metro Central Tech Park Hub",
        facilityAddress: "Plot 42, Sector 18, Cyber City",
        slotNumber: "A-04 (Reserved)",
        vehicleNumber: "MH-01-AB-1234",
        vehicleType: "4-Wheeler (Sedan)",
        price: 2499,
        startDate: "2026-08-20",
        endDate: "2026-09-19",
        daysRemaining: 24,
        status: "ACTIVE", // 'ACTIVE' | 'PAUSED' | 'EXPIRED'
        autoRenew: true,
      },
    ];
  });

  const [subscribeModal, setSubscribeModal] = useState({
    open: false,
    plan: null,
    vehicleNumber: "",
    slotNumber: "A-04",
    autoRenew: true,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [parkRes, vehRes] = await Promise.allSettled([
        API.get("/parking/approved"),
        API.get("/vehicle/my-vehicles"),
      ]);

      if (parkRes.status === "fulfilled") {
        const list = Array.isArray(parkRes.value.data)
          ? parkRes.value.data
          : parkRes.value.data?.parking_locations || [];
        setParkingLocations(list);
        if (list.length > 0 && !selectedFacilityId) {
          setSelectedFacilityId(String(list[0].id));
        }
      }

      if (vehRes.status === "fulfilled") {
        const vList = Array.isArray(vehRes.value.data)
          ? vehRes.value.data
          : vehRes.value.data?.vehicles || [];
        setVehicles(vList);
        if (vList.length > 0) {
          setSubscribeModal((prev) => ({
            ...prev,
            vehicleNumber: vList[0].vehicle_number || "MH-01-AB-1234",
          }));
        }
      }
    } catch (_) {
      showToast("Unable to load subscription facilities.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedFacility = useMemo(() => {
    return (
      parkingLocations.find((p) => String(p.id) === String(selectedFacilityId)) ||
      parkingLocations[0] || { name: "City Hub Parking", address: "Central City Zone" }
    );
  }, [parkingLocations, selectedFacilityId]);

  /* Open Checkout Modal for a Plan */
  const handleOpenSubscribe = (plan) => {
    setSubscribeModal({
      open: true,
      plan,
      vehicleNumber: vehicles[0]?.vehicle_number || "MH-01-AB-1234",
      slotNumber: "A-04",
      autoRenew: true,
    });
  };

  /* Confirm & Activate Season Pass */
  const handleConfirmSubscription = () => {
    const plan = subscribeModal.plan;
    if (!plan) return;

    const newSub = {
      id: `SUB-${Math.floor(10000 + Math.random() * 90000)}`,
      planId: plan.id,
      planTitle: plan.title,
      facilityName: selectedFacility.name || "ParkEase Hub",
      facilityAddress: selectedFacility.address || "City Location",
      slotNumber: `${subscribeModal.slotNumber} (Reserved)`,
      vehicleNumber: subscribeModal.vehicleNumber.trim().toUpperCase(),
      vehicleType: "4-Wheeler",
      price: plan.price,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysRemaining: 30,
      status: "ACTIVE",
      autoRenew: subscribeModal.autoRenew,
    };

    const updated = [newSub, ...subscriptions];
    setSubscriptions(updated);
    try {
      localStorage.setItem("parkease_user_subscriptions", JSON.stringify(updated));
    } catch (_) {}

    setSubscribeModal({ open: false, plan: null, vehicleNumber: "", slotNumber: "A-04", autoRenew: true });
    showToast(`🎉 Congratulations! ${plan.title} activated successfully.`, "success");
  };

  /* Pause / Resume Subscription */
  const togglePauseSubscription = (subId) => {
    const updated = subscriptions.map((s) => {
      if (s.id === subId) {
        const nextStatus = s.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        showToast(
          nextStatus === "PAUSED"
            ? "Pass paused. Your remaining days are frozen!"
            : "Pass resumed and live for gate entry!",
          "success"
        );
        return { ...s, status: nextStatus };
      }
      return s;
    });
    setSubscriptions(updated);
    try {
      localStorage.setItem("parkease_user_subscriptions", JSON.stringify(updated));
    } catch (_) {}
  };

  /* Download GST Invoice */
  const handleDownloadInvoice = (sub) => {
    const invoiceText = `
========================================
PARKEASE DIGITAL COMMUTER TAX INVOICE
========================================
Invoice No: INV-${sub.id}
Date: ${sub.startDate}
Status: PAID (Digital Wallet / UPI)

Customer: Verified Commuter Passholder
Vehicle: ${sub.vehicleNumber}
Facility: ${sub.facilityName}
Assigned Slot: ${sub.slotNumber}

Plan: ${sub.planTitle}
Validity: ${sub.startDate} to ${sub.endDate} (30 Days)

Amount: ₹${sub.price}.00
GST (18% Included): ₹${Math.round(sub.price * 0.18)}.00
Total Paid: ₹${sub.price}.00

Thank you for choosing ParkEase Smart Mobility!
========================================`;
    const element = document.createElement("a");
    const file = new Blob([invoiceText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `ParkEase_Tax_Invoice_${sub.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast("Tax invoice downloaded!", "success");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO VIBRANT GRADIENT BANNER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-9 shadow-2xl border border-emerald-400/30">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                <span>MONTHLY PARKING PASSES</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Monthly Parking Passes
              </h1>
              <p className="text-xs sm:text-sm text-emerald-50 font-medium leading-relaxed">
                Save up to 40% with guaranteed reserved spots, unlimited daily entries, and fast gate access.
              </p>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="px-3.5 py-1 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20">
                  🛡️ Guaranteed Reserved Spot
                </span>
                <span className="px-3.5 py-1 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20">
                  ⚡ Fast Entry & Exit
                </span>
                <span className="px-3.5 py-1 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20">
                  ⏸️ Pause Pass Anytime
                </span>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="shrink-0 p-5 rounded-3xl bg-white/15 border border-white/25 shadow-xl backdrop-blur-xl space-y-2 text-center sm:text-left min-w-[200px] text-white">
              <span className="text-[11px] text-emerald-100 font-black uppercase tracking-wider block">
                Active Passes
              </span>
              <div className="text-3xl font-black text-white font-mono">
                {subscriptions.filter((s) => s.status === "ACTIVE").length} <span className="text-xs text-emerald-200 font-normal">Active</span>
              </div>
              <p className="text-[11px] text-emerald-100">Guaranteed 30-day access</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. ACTIVE SEASON PASS VIP PASS CARDS
        ══════════════════════════════════════════════════════════════════ */}
        {subscriptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <FiAward className="w-5 h-5 text-emerald-500" />
                <span>My Active Passholder Memberships</span>
              </h2>
              <span className="text-xs font-bold text-zinc-400">
                {subscriptions.length} Subscriptions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {subscriptions.map((sub) => {
                const isPaused = sub.status === "PAUSED";
                const progressPct = Math.round((sub.daysRemaining / 30) * 100);

                return (
                  <div
                    key={sub.id}
                    className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 border border-emerald-400/40 text-white shadow-2xl p-6 space-y-5"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

                    {/* Pass Header */}
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black tracking-wide border border-white/30 mb-1.5">
                          <FiStar className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>VIP PASS • #{sub.id}</span>
                        </div>
                        <h3 className="text-lg font-black text-white">{sub.planTitle}</h3>
                        <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                          <span className="truncate">{sub.facilityName}</span>
                        </p>
                      </div>

                      <Badge variant={isPaused ? "warning" : "success"} dot size="sm">
                        {isPaused ? "Paused" : "Live Pass"}
                      </Badge>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-xs relative z-10">
                      <div>
                        <span className="text-[10px] text-emerald-100 font-bold uppercase block">Dedicated Bay</span>
                        <span className="font-mono font-black text-white">{sub.slotNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-100 font-bold uppercase block">Vehicle</span>
                        <span className="font-mono font-black text-white truncate block">{sub.vehicleNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-100 font-bold uppercase block">Valid Till</span>
                        <span className="font-mono font-bold text-white">{sub.endDate}</span>
                      </div>
                    </div>

                    {/* Countdown Progress */}
                    <div className="space-y-1.5 relative z-10">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-100">Validity Remaining</span>
                        <span className="text-white font-mono font-black">
                          {sub.daysRemaining} of 30 Days ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-white/15 relative z-10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePauseSubscription(sub.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all cursor-pointer border border-white/20"
                        >
                          {isPaused ? <FiPlayCircle className="w-3.5 h-3.5 text-emerald-300" /> : <FiPauseCircle className="w-3.5 h-3.5" />}
                          <span>{isPaused ? "Resume Pass" : "Freeze Pass"}</span>
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(sub)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all cursor-pointer border border-white/20"
                          title="Download Tax Invoice"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </div>

                      <button
                        onClick={() => navigate("/customer/my-bookings")}
                        className="px-4 py-2.5 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Gate Pass</span>
                        <FiArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. EXPLORE COMMUTER SEASON PASS PLANS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                Choose a Monthly Season Pass Plan
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Select your preferred facility and get recurring discounted rates for 30 days.
              </p>
            </div>

            {/* Facility Picker */}
            {parkingLocations.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400">Hub:</span>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="pe-input text-xs font-bold py-2 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs cursor-pointer"
                >
                  {parkingLocations.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3 Tier Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {COMMUTER_PLANS.map((plan) => {
              return (
                <div
                  key={plan.id}
                  className={`group relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    plan.popular
                      ? "bg-gradient-to-br from-zinc-950 via-[#0d0d14] to-black border-2 border-emerald-500 text-white shadow-xl scale-[1.02]"
                      : "bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-zinc-900 dark:text-white shadow-md"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-[10px] font-black uppercase tracking-wider shadow-lg">
                      ⚡ MOST POPULAR PASS
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{plan.icon}</span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {plan.savePercent}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black">{plan.title}</h3>
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">{plan.badge}</p>
                    </div>

                    {/* Price Tag */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono">₹{plan.price}</span>
                        <span className="text-xs text-zinc-400">/ 30 days</span>
                        <span className="text-xs text-zinc-400 line-through font-mono">₹{plan.originalPrice}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                        ⏰ {plan.hours}
                      </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <FiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                          <span className="text-zinc-600 dark:text-zinc-300 font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subscribe Action */}
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => handleOpenSubscribe(plan)}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-lg shadow-emerald-500/25"
                          : "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-sm"
                      }`}
                    >
                      <span>Subscribe to {plan.title.split(" ")[0]} Pass</span>
                      <FiArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          4. INSTANT SUBSCRIBE & DEDICATED BAY CHECKOUT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {subscribeModal.open && subscribeModal.plan && (
        <Modal
          isOpen={subscribeModal.open}
          onClose={() => setSubscribeModal({ open: false, plan: null, vehicleNumber: "", slotNumber: "A-04", autoRenew: true })}
          title={`Activate ${subscribeModal.plan.title}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-5 p-2">
            {/* Plan Header Strip */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                  30-Day Monthly Membership
                </span>
                <p className="text-sm font-black">{subscribeModal.plan.title}</p>
                <p className="text-xs text-zinc-400 truncate">{selectedFacility.name}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white font-mono">₹{subscribeModal.plan.price}</span>
                <span className="text-[10px] text-zinc-400 block">30 days all-inclusive</span>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Vehicle Number Plate *
              </label>
              <input
                type="text"
                required
                value={subscribeModal.vehicleNumber}
                onChange={(e) =>
                  setSubscribeModal((prev) => ({ ...prev, vehicleNumber: e.target.value }))
                }
                placeholder="e.g. MH-01-AB-1234"
                className="pe-input text-sm font-mono font-black uppercase bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full"
              />
            </div>

            {/* Dedicated Bay Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Dedicated Reserved Slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["A-01", "A-04", "B-02", "C-08"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() =>
                      setSubscribeModal((prev) => ({ ...prev, slotNumber: slot }))
                    }
                    className={`py-2 px-1 text-xs font-black font-mono rounded-xl border transition-all cursor-pointer ${
                      subscribeModal.slotNumber === slot
                        ? "bg-emerald-500 text-black border-emerald-500 shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    Bay {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-renew Toggle */}
            <div
              onClick={() =>
                setSubscribeModal((prev) => ({ ...prev, autoRenew: !prev.autoRenew }))
              }
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="text-xs font-black text-zinc-900 dark:text-white">Auto-Renew Subscription</p>
                <p className="text-[10px] text-zinc-400">Automatically renews after 30 days. Cancel anytime.</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  subscribeModal.autoRenew ? "bg-emerald-500 text-black" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                }`}
              >
                {subscribeModal.autoRenew ? "✓" : "✕"}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() =>
                  setSubscribeModal({ open: false, plan: null, vehicleNumber: "", slotNumber: "A-04", autoRenew: true })
                }
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmSubscription}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiZap className="w-4 h-4 stroke-[3]" />
                <span>Pay & Activate (₹{subscribeModal.plan.price})</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
