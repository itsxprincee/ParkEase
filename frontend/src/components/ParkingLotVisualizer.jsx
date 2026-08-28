import React, { useState, useMemo } from "react";
import {
  FiTruck,
  FiCheckCircle,
  FiLayers,
  FiCompass,
  FiGrid,
  FiMap,
  FiCheck,
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiArrowRight,
  FiZap,
  FiStar,
  FiInfo,
  FiX,
} from "react-icons/fi";

export default function ParkingLotVisualizer({
  slots = [],
  selectedSlot = null,
  onSelectSlot = () => {},
  readOnly = false,
  parkingName = "Parking Deck",
}) {
  const [viewMode, setViewMode] = useState("2D_MAP"); // "2D_MAP" | "GRID"
  const [activeFilter, setActiveFilter] = useState("ALL"); // "ALL" | "CAR" | "BIKE" | "EV"
  const [inspectedSlot, setInspectedSlot] = useState(null);

  // Filter slots
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

  // Group slots into realistic driving sections
  const sections = useMemo(() => {
    const map = {};
    slots.forEach((slot, idx) => {
      const match = String(slot.slot_number || "").match(/^([A-Za-z]+|\d+)[-_]?/);
      let prefix = match ? match[1].toUpperCase() : "A";
      if (!isNaN(prefix)) {
        prefix = `Zone ${Math.floor(idx / 8) + 1}`;
      } else {
        prefix = `Deck ${prefix}`;
      }
      const sectionKey = prefix;
      if (!map[sectionKey]) {
        map[sectionKey] = [];
      }
      map[sectionKey].push(slot);
    });

    const sectionKeys = Object.keys(map);
    if (sectionKeys.length <= 1 && slots.length > 8) {
      const result = {};
      const chunkSize = Math.ceil(slots.length / 2);
      result["North Bay (Entry Lane)"] = slots.slice(0, chunkSize);
      result["South Bay (Exit Lane)"] = slots.slice(chunkSize);
      return result;
    }

    return map;
  }, [slots]);

  // Real-time counts
  const availableCount = slots.filter(
    (s) =>
      !s.is_occupied &&
      (s.status || "available").toLowerCase() !== "occupied" &&
      (s.status || "available").toLowerCase() !== "maintenance"
  ).length;
  const occupiedCount = slots.length - availableCount;
  const evSlotsCount = slots.filter(s => s.is_ev || s.slot_number?.toUpperCase().includes("EV")).length;

  const handleSlotClick = (slot) => {
    if (readOnly) return;
    const isOccupied =
      slot.is_occupied ||
      (slot.status || "available").toLowerCase() === "occupied" ||
      (slot.status || "available").toLowerCase() === "maintenance";
    if (isOccupied) return;

    onSelectSlot(slot);
    setInspectedSlot(slot);
  };

  return (
    <div className="space-y-4">
      {/* ── Visualizer Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700/90 shadow-xs">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `All Spots (${slots.length})` },
            { id: "CAR", label: "🚗 Cars" },
            { id: "BIKE", label: "🛵 Bikes" },
            { id: "EV", label: "⚡ EV Bays" },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                activeFilter === filter.id
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-black"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-900 p-1 rounded-full shrink-0 self-end sm:self-auto border border-zinc-300/50 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setViewMode("2D_MAP")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              viewMode === "2D_MAP"
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <FiMap className="w-3.5 h-3.5" />
            <span>2D Lot Floorplan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              viewMode === "GRID"
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <FiGrid className="w-3.5 h-3.5" />
            <span>Quick Grid</span>
          </button>
        </div>

        {/* Live IoT Gateway Status Indicator */}
        <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-black shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live IoT Deck Sync</span>
        </div>
      </div>

      {/* ── 2D PARKING LOT FLOORPLAN VIEW ── */}
      {viewMode === "2D_MAP" && (
        <div className="relative rounded-3xl bg-[#090b10] border border-zinc-800 p-4 sm:p-7 shadow-2xl overflow-hidden text-white space-y-6">
          {/* Subtle Grid Surface Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-35 pointer-events-none" />

          {/* Entrance Gate Header Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>ENTRY BARRIER 01</span>
              </span>
              <span className="text-xs text-zinc-400 font-bold hidden sm:inline">
                Tap an available green bay to assign your spot
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                {availableCount} Available
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                {occupiedCount} Occupied
              </span>
              {evSlotsCount > 0 && (
                <span className="flex items-center gap-1.5 text-cyan-400 hidden sm:flex">
                  <FiZap className="w-3.5 h-3.5" />
                  {evSlotsCount} EV Bays
                </span>
              )}
            </div>
          </div>

          {/* Interactive Sections & Driving Aisles */}
          <div className="relative z-10 space-y-8">
            {Object.entries(sections).map(([sectionName, sectionSlots]) => {
              const half = Math.ceil(sectionSlots.length / 2);
              const topRow = sectionSlots.slice(0, half);
              const bottomRow = sectionSlots.slice(half);

              return (
                <div
                  key={sectionName}
                  className="p-4 sm:p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/90 shadow-inner space-y-4 relative backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <FiLayers className="w-4 h-4" />
                      <span>{sectionName}</span>
                    </span>
                    <span className="text-xs font-mono text-zinc-400 font-bold">
                      {sectionSlots.length} Parking Bays
                    </span>
                  </div>

                  {/* TOP ROW PARKING STALLS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {topRow.map((slot) => (
                      <ParkingStall
                        key={slot.id}
                        slot={slot}
                        isSelected={selectedSlot?.id === slot.id}
                        onSelect={() => handleSlotClick(slot)}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>

                  {/* CENTRAL DRIVING AISLE / LANE */}
                  <div className="py-2.5 px-5 rounded-2xl bg-zinc-950 border border-dashed border-zinc-700/60 flex items-center justify-between my-2 text-zinc-500 text-[11px] font-mono select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-black">➔ ENTRY FLOW</span>
                      <span className="tracking-widest hidden md:inline">························································</span>
                    </div>
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
                      🛞 MAX SPEED 10 KM/H
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="tracking-widest hidden md:inline">························</span>
                      <span className="text-amber-400 font-black">EXIT FLOW ➔</span>
                    </div>
                  </div>

                  {/* BOTTOM ROW PARKING STALLS */}
                  {bottomRow.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {bottomRow.map((slot) => (
                        <ParkingStall
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlot?.id === slot.id}
                          onSelect={() => handleSlotClick(slot)}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Legend & Selected Spot HUD Footer */}
          <div className="relative z-10 pt-4 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-4 text-xs font-bold">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-2 text-white">
                <span className="w-3.5 h-3.5 rounded-lg bg-white border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                <span>Selected Spot</span>
              </span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-3.5 h-3.5 rounded-lg bg-emerald-500/20 border border-emerald-500/60" />
                <span>Available</span>
              </span>
              <span className="flex items-center gap-2 text-cyan-400">
                <span className="w-3.5 h-3.5 rounded-lg bg-cyan-500/20 border border-cyan-500/60" />
                <span>EV Supercharger</span>
              </span>
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-3.5 h-3.5 rounded-lg bg-zinc-900 border border-rose-900/60 flex items-center justify-center text-[9px]">
                  🚗
                </span>
                <span>Occupied</span>
              </span>
            </div>

            {selectedSlot && (
              <div className="px-4 py-2 rounded-2xl bg-white text-zinc-950 font-black text-xs animate-slide-up shadow-xl flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Spot #{selectedSlot.slot_number} Locked for Reservation</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUICK GRID VIEW ── */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredSlots.map((slot) => {
            const isOccupied =
              slot.is_occupied ||
              (slot.status || "available").toLowerCase() === "occupied" ||
              (slot.status || "available").toLowerCase() === "maintenance";
            const isSelected = selectedSlot?.id === slot.id;
            const isEv = slot.is_ev || slot.slot_number?.toUpperCase().includes("EV");

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isOccupied || readOnly}
                onClick={() => handleSlotClick(slot)}
                className={`relative p-4 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all border-2 cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xl scale-105 ring-2 ring-emerald-500 font-bold"
                    : isOccupied
                    ? "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed opacity-50"
                    : isEv
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-300 hover:border-cyan-500 hover:bg-cyan-500/20"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-900 dark:text-white"
                }`}
              >
                <span className="text-sm font-black font-mono">{slot.slot_number}</span>
                <span
                  className={`text-[10px] font-bold ${
                    isSelected
                      ? "text-emerald-400"
                      : isOccupied
                      ? "text-zinc-400"
                      : isEv
                      ? "text-cyan-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isSelected ? "Selected ✓" : isOccupied ? "Occupied" : isEv ? "⚡ EV Free" : "Available"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Individual 2D Parking Bay Component ──────────────────────────────────────
function ParkingStall({ slot, isSelected, onSelect, readOnly }) {
  const isOccupied =
    slot.is_occupied ||
    (slot.status || "available").toLowerCase() === "occupied";
  const isMaintenance = (slot.status || "available").toLowerCase() === "maintenance";
  const isBike = slot.vehicle_type?.toUpperCase() === "BIKE";
  const isEv = slot.is_ev || slot.slot_number?.toUpperCase().includes("EV");

  return (
    <button
      type="button"
      disabled={isOccupied || isMaintenance || readOnly}
      onClick={onSelect}
      className={`group relative h-28 sm:h-32 rounded-2xl flex flex-col justify-between p-3 transition-all duration-200 border-2 text-left cursor-pointer active:scale-95 ${
        isSelected
          ? "bg-white text-zinc-950 border-white shadow-[0_0_25px_rgba(255,255,255,0.7)] scale-105 z-20"
          : isOccupied
          ? "bg-zinc-950/90 border-zinc-800/80 text-zinc-500 cursor-not-allowed opacity-50"
          : isMaintenance
          ? "bg-amber-950/30 border-amber-800/60 text-amber-400 cursor-not-allowed"
          : isEv
          ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/40 hover:shadow-[0_0_16px_rgba(6,182,212,0.4)]"
          : "bg-zinc-900/90 border-zinc-700/80 hover:border-emerald-400 hover:bg-zinc-800 text-zinc-200 hover:shadow-lg"
      }`}
    >
      {/* Top Strip */}
      <div className="flex items-center justify-between w-full">
        <span className={`font-mono text-xs font-black tracking-tight ${isSelected ? "text-zinc-950" : "text-white"}`}>
          {slot.slot_number}
        </span>
        <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-zinc-700" : isEv ? "text-cyan-400" : "text-zinc-400"}`}>
          {isEv ? "⚡ EV" : isBike ? "🛵 BIKE" : "🚗 CAR"}
        </span>
      </div>

      {/* Visual Bay Center Graphics */}
      <div className="flex items-center justify-center my-auto">
        {isSelected ? (
          <div className="w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-lg animate-bounce">
            <FiCheck className="w-5 h-5 stroke-[3] text-emerald-400" />
          </div>
        ) : isOccupied ? (
          <div className="text-center space-y-0.5">
            <span className="text-2xl leading-none">🚗</span>
            <span className="text-[9px] text-rose-400 font-bold block uppercase tracking-wider">
              Parked
            </span>
          </div>
        ) : isMaintenance ? (
          <div className="text-center space-y-0.5">
            <FiAlertTriangle className="w-5 h-5 text-amber-400 mx-auto" />
            <span className="text-[9px] text-amber-400 font-bold block uppercase">
              Maintenance
            </span>
          </div>
        ) : isEv ? (
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FiZap className="w-4 h-4 text-cyan-400" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-dashed border-zinc-600 group-hover:border-emerald-400 group-hover:bg-emerald-400/10 flex items-center justify-center transition-colors">
            <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 font-bold">
              FREE
            </span>
          </div>
        )}
      </div>

      {/* Bottom Status / Selection Marker */}
      <div className={`flex items-center justify-between w-full pt-1 border-t text-[10px] font-bold ${
        isSelected ? "border-zinc-300 text-zinc-900" : "border-zinc-800/80"
      }`}>
        {isSelected ? (
          <span className="text-emerald-600 font-black">LOCKED IN</span>
        ) : isOccupied ? (
          <span className="text-zinc-600">IN USE</span>
        ) : isEv ? (
          <span className="text-cyan-400 group-hover:text-cyan-300 font-black">RAPID CHARGE</span>
        ) : (
          <span className="text-emerald-400 group-hover:text-emerald-300">
            TAP TO SELECT
          </span>
        )}
      </div>
    </button>
  );
}
