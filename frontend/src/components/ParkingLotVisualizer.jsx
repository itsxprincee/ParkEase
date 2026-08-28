import React, { useState, useMemo } from "react";
import {
  FiCheckCircle,
  FiZap,
  FiCheck,
  FiTruck,
  FiLayers,
  FiShield,
} from "react-icons/fi";

export default function ParkingLotVisualizer({
  slots = [],
  selectedSlot = null,
  onSelectSlot = () => {},
  readOnly = false,
  parkingName = "Parking Hub",
}) {
  const [activeFilter, setActiveFilter] = useState("ALL"); // "ALL" | "CAR" | "BIKE" | "EV"

  // Filter slots by category
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (activeFilter === "CAR") {
        return (slot.vehicle_type?.toUpperCase() === "CAR" || !slot.vehicle_type) && !slot.is_ev;
      }
      if (activeFilter === "BIKE") {
        return slot.vehicle_type?.toUpperCase() === "BIKE";
      }
      if (activeFilter === "EV") {
        return slot.is_ev || slot.slot_number?.toUpperCase().includes("EV");
      }
      return true;
    });
  }, [slots, activeFilter]);

  // Real-time counts
  const availableCount = slots.filter(
    (s) =>
      !s.is_occupied &&
      (s.status || "available").toLowerCase() !== "occupied" &&
      (s.status || "available").toLowerCase() !== "maintenance"
  ).length;
  const occupiedCount = slots.length - availableCount;
  const evSlotsCount = slots.filter(
    (s) => s.is_ev || slotHasEv(s)
  ).length;

  function slotHasEv(s) {
    return s.is_ev || String(s.slot_number || "").toUpperCase().includes("EV");
  }

  const handleSlotClick = (slot) => {
    if (readOnly) return;
    const isOccupied =
      slot.is_occupied ||
      (slot.status || "available").toLowerCase() === "occupied" ||
      (slot.status || "available").toLowerCase() === "maintenance";
    if (isOccupied) return;

    onSelectSlot(slot);
  };

  return (
    <div className="space-y-4">
      {/* ── Top-Tier Filter & Real-Time Availability Bar ── */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-xs backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `🌟 All Bays (${slots.length})` },
            { id: "CAR", label: "🚗 Cars" },
            { id: "BIKE", label: "🛵 Bikes" },
            { id: "EV", label: "⚡ EV Superchargers" },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs border ${
                activeFilter === filter.id
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md font-black"
                  : "bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border-zinc-200/80 dark:border-zinc-700/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Real-Time Live Status Counters */}
        <div className="flex items-center gap-2.5 text-xs font-bold shrink-0 self-end sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{availableCount} Available</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>{occupiedCount} Occupied</span>
          </div>

          {evSlotsCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400">
              <FiZap className="w-3.5 h-3.5" />
              <span>{evSlotsCount} EV Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* ── High-Contrast Interactive Parking Bay Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredSlots.map((slot) => {
          const isOccupied =
            slot.is_occupied ||
            (slot.status || "available").toLowerCase() === "occupied" ||
            (slot.status || "available").toLowerCase() === "maintenance";
          const isSelected = selectedSlot?.id === slot.id;
          const isEv = slot.is_ev || slotHasEv(slot);
          const isBike = slot.vehicle_type?.toUpperCase() === "BIKE";

          return (
            <button
              key={slot.id}
              type="button"
              disabled={isOccupied || readOnly}
              onClick={() => handleSlotClick(slot)}
              className={`group relative p-4 rounded-3xl flex flex-col justify-between gap-3 transition-all duration-200 border-2 cursor-pointer active:scale-95 min-h-[120px] text-left shadow-xs ${
                isSelected
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-emerald-500 shadow-xl scale-[1.03] ring-2 ring-emerald-500/50 z-10"
                  : isOccupied
                  ? "bg-zinc-100/80 dark:bg-zinc-850/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed opacity-60"
                  : isEv
                  ? "bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500/30 text-zinc-900 dark:text-white hover:border-cyan-500 hover:shadow-lg hover:bg-cyan-500/10"
                  : "bg-white dark:bg-zinc-900 border-zinc-200/90 dark:border-zinc-800 hover:border-emerald-500 text-zinc-900 dark:text-white hover:shadow-lg"
              }`}
            >
              {/* Header: Monospace Bay Tag & Vehicle Badge */}
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-sm font-black tracking-tight">
                  Bay {slot.slot_number}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-emerald-500 text-black font-black"
                      : isEv
                      ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                      : isBike
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {isEv ? "⚡ EV" : isBike ? "🛵 BIKE" : "🚗 CAR"}
                </span>
              </div>

              {/* Center Status Visual */}
              <div className="flex items-center justify-center my-auto py-1">
                {isSelected ? (
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-md animate-bounce">
                    <FiCheck className="w-5 h-5 stroke-[3]" />
                  </div>
                ) : isOccupied ? (
                  <div className="text-center space-y-0.5">
                    <span className="text-xl leading-none opacity-60 block">🚗</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Parked
                    </span>
                  </div>
                ) : isEv ? (
                  <div className="w-8 h-8 rounded-2xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiZap className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black tracking-wider">FREE</span>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="w-full pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    isSelected
                      ? "text-emerald-400 dark:text-emerald-600"
                      : isOccupied
                      ? "text-zinc-400 dark:text-zinc-500"
                      : isEv
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isSelected
                    ? "Locked In ✓"
                    : isOccupied
                    ? "Occupied"
                    : isEv
                    ? "⚡ EV Charge"
                    : "Available"}
                </span>

                {!isOccupied && !isSelected && (
                  <span className="text-[10px] text-zinc-400 group-hover:text-emerald-500 font-bold transition-colors">
                    Select →
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Selection Confirmation Banner ── */}
      {selectedSlot && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-black animate-slide-up shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-md">
              <FiCheck className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 dark:text-white">
                Bay #{selectedSlot.slot_number} Selected
              </p>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Ready for instant reservation & gate QR pass generation.
              </p>
            </div>
          </div>

          <span className="px-4 py-2 rounded-2xl bg-emerald-500 text-black text-xs font-black uppercase tracking-wide shrink-0 shadow-md">
            Selected Spot ✓
          </span>
        </div>
      )}
    </div>
  );
}
