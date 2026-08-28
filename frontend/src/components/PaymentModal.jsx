import React, { useState } from "react";
import {
  FiShield,
  FiCheckCircle,
  FiCreditCard,
  FiZap,
  FiSmartphone,
  FiLock,
  FiX,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";

const UPI_APPS = [
  { id: "gpay", name: "Google Pay", icon: "🟢", desc: "Instant UPI intent" },
  { id: "phonepe", name: "PhonePe", icon: "🟣", desc: "UPI / AutoPay" },
  { id: "paytm", name: "Paytm UPI", icon: "🔵", desc: "Wallet & UPI" },
  { id: "bhim", name: "BHIM UPI", icon: "🟠", desc: "Govt UPI switch" },
];

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  bookingDetails,
  onPaymentSuccess,
}) {
  const [method, setMethod] = useState("UPI"); // 'UPI' | 'CARD' | 'WALLET'
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [cardData, setCardData] = useState({ number: "", exp: "", cvv: "", name: "" });
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState("SELECT"); // 'SELECT' | 'PROCESSING' | 'SUCCESS'

  if (!isOpen) return null;

  const handlePay = () => {
    setStep("PROCESSING");
    setProcessing(true);

    setTimeout(() => {
      setStep("SUCCESS");
      setProcessing(false);
      setTimeout(() => {
        onPaymentSuccess({
          payment_id: `pay_${Math.random().toString(36).substring(2, 12)}`,
          method,
          amount,
          timestamp: new Date().toISOString(),
        });
      }, 1200);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-950 via-[#0d0f14] to-black text-white p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FiShield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">ParkEase SafePay</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/30">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Verified Mobility Payment Gateway</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={processing}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Bar */}
        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Amount Due</p>
            <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">₹{amount}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
              {bookingDetails?.parking_name || "Parking Spot"}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
              Spot {bookingDetails?.slot_number || "A-01"}
            </p>
          </div>
        </div>

        {/* Content Body */}
        {step === "PROCESSING" ? (
          <div className="p-8 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-14 h-14 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-black text-zinc-900 dark:text-white">Connecting to Bank...</h4>
              <p className="text-xs text-zinc-400 mt-1">Authorizing ₹{amount} with zero fee guarantee</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <FiLock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Do not close or reload this window</span>
            </div>
          </div>
        ) : step === "SUCCESS" ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center mx-auto text-3xl animate-spring-in">
              ✓
            </div>
            <div>
              <h4 className="text-lg font-black text-zinc-900 dark:text-white">Payment Verified!</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Booking confirmed. Generating your digital gate boarding pass...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4 flex-1">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">
              {[
                { id: "UPI", label: "⚡ UPI Apps" },
                { id: "CARD", label: "💳 Card" },
                { id: "WALLET", label: "📱 FastWallet" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMethod(t.id)}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    method === t.id
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-black"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* UPI Option */}
            {method === "UPI" && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Choose UPI App:</p>
                <div className="grid grid-cols-2 gap-2">
                  {UPI_APPS.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                        selectedUpiApp === app.id
                          ? "border-emerald-500 bg-emerald-500/10 text-zinc-900 dark:text-white font-bold"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                      }`}
                    >
                      <span className="text-xl">{app.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-none">{app.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{app.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Or Enter Any UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="pe-input text-xs w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* CARD Option */}
            {method === "CARD" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4532 •••• •••• 8891"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="pe-input text-xs font-mono w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      maxLength={5}
                      value={cardData.exp}
                      onChange={(e) => setCardData({ ...cardData, exp: e.target.value })}
                      className="pe-input text-xs font-mono w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="pe-input text-xs font-mono w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WALLET Option */}
            {method === "WALLET" && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-center">
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  ⚡ ParkEase 1-Tap FastWallet
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Wallet Balance: <span className="font-bold text-zinc-900 dark:text-white font-mono">₹500.00</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Zero OTP checkout for lightning-fast barrier entry clearance.
                </p>
              </div>
            )}

            {/* Pay Action Button */}
            <button
              onClick={handlePay}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <FiZap className="w-4 h-4" />
              <span>Authorize & Pay ₹{amount}</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
