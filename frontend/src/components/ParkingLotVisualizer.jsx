import React, { useState, useMemo } from "react";
import {
  FiZap,
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
} from "react-icons/fi";

export default function ParkingLotVisualizer({
  slots = [],
  selectedSlot = null,
  onSelectSlot = () => {},
  readOnly = false,
  parkingName = "Parking Deck",
}) {
  const [viewMode, setViewMode] = useState("2D_MAP"); // "2D_MAP" | "GRID"
  const [activeFilter, setActiveFilter] = useState("ALL"); // "ALL" | "EV" | "CAR" | "BIKE"

  // Filter slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (activeFilter === "EV") return slot.is_ev || slot.vehicle_type?.toUpperCase() === "EV";
      if (activeFilter === "CAR") return slot.vehicle_type?.toUpperCase() === "CAR" || !slot.vehicle_type;
      if (activeFilter === "BIKE") return slot.vehicle_type?.toUpperCase() === "BIKE";
      return true;
    });
  }, [slots, activeFilter]);

  // Group slots into rows / sections for realistic 2D lot layout
  const sections = useMemo(() => {
    // Group slots by prefix/letter if available, else group into rows of 6-8
    const map = {};
    slots.forEach((slot) => {
      const match = String(slot.slot_number || "").match(/^([A-Za-z]+|\d+)[-_]?/);
      const prefix = match ? match[1].toUpperCase() : "A";
      const sectionKey = `Section ${prefix}`;
      if (!map[sectionKey]) {
        map[sectionKey] = [];
      }
      map[sectionKey].push(slot);
    });

    // If only 1 section or no clear prefix, split by chunks of 8
    const sectionKeys = Object.keys(map);
    if (sectionKeys.length <= 1 && slots.length > 8) {
      const result = {};
      const chunkSize = Math.ceil(slots.length / 2);
      result["Section A (Front Rows)"] = slots.slice(0, chunkSize);
      result["Section B (Rear Rows)"] = slots.slice(chunkSize);
      return result;
    }

    return map;
  }, [slots]);

  // Counts
  const availableCount = slots.filter(
    (s) =>
      !s.is_occupied &&
      (s.status || "available").toLowerCase() !== "occupied" &&
      (s.status || "available").toLowerCase() !== "maintenance"
  ).length;
  const occupiedCount = slots.length - availableCount;
  const evCount = slots.filter((s) => s.is_ev).length;

  return (
    <div className="space-y-4">
      {/* Visualizer Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/90 dark:border-zinc-700/90">
        
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `All Spots (${slots.length})` },
            { id: "EV", label: `⚡ EV (${evCount})` },
            { id: "CAR", label: "🚗 Cars" },
            { id: "BIKE", label: "🏍️ Bikes" },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter.id
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs font-black"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-900 p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("2D_MAP")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "2D_MAP"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <FiMap className="w-3.5 h-3.5" />
            <span>2D Lot Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "GRID"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <FiGrid className="w-3.5 h-3.5" />
            <span>Quick Grid</span>
          </button>
        </div>
      </div>

      {/* ── 2D PARKING LOT FLOORPLAN VIEW ── */}
      {viewMode === "2D_MAP" && (
        <div className="relative rounded-3xl bg-zinc-950 border border-zinc-800 p-4 sm:p-6 shadow-2xl overflow-hidden text-white space-y-6">
          {/* Subtle Grid Surface Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Entrance Gate Header Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>IN & OUT GATE</span>
              </span>
              <span className="text-xs text-zinc-400 font-bold hidden sm:inline">
                Follow arrows to your assigned spot
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {availableCount} Available
              </span>
              <span className="flex items-center gap-1 text-zinc-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                {occupiedCount} Parked
              </span>
            </div>
          </div>

          {/* Interactive Sections & Driving Aisles */}
          <div className="relative z-10 space-y-8">
            {Object.entries(sections).map(([sectionName, sectionSlots], sectionIdx) => {
              // Split section slots into Upper Row and Lower Row flanking the driving aisle
              const half = Math.ceil(sectionSlots.length / 2);
              const topRow = sectionSlots.slice(0, half);
              const bottomRow = sectionSlots.slice(half);

              return (
                <div
                  key={sectionName}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-inner space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                      <FiLayers className="w-3.5 h-3.5" />
                      <span>{sectionName}</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {sectionSlots.length} Spots
                    </span>
                  </div>

                  {/* TOP ROW PARKING STALLS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {topRow.map((slot) => (
                      <ParkingStall
                        key={slot.id}
                        slot={slot}
                        isSelected={selectedSlot?.id === slot.id}
                        onSelect={() => !readOnly && onSelectSlot(slot)}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>

                  {/* CENTRAL DRIVING AISLE / LANE */}
                  <div className="py-2 px-4 rounded-xl bg-zinc-950/80 border border-dashed border-zinc-700/60 flex items-center justify-between my-2 text-zinc-500 text-[10px] font-mono select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">➔ DRIVE IN</span>
                      <span className="tracking-widest">················································································</span>
                    </div>
                    <span className="text-zinc-400 font-bold hidden sm:inline">5 KM/H SPEED LIMIT</span>
                    <div className="flex items-center gap-2">
                      <span className="tracking-widest">························</span>
                      <span className="text-amber-400 font-bold">EXIT ➔</span>
                    </div>
                  </div>

                  {/* BOTTOM ROW PARKING STALLS */}
                  {bottomRow.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                      {bottomRow.map((slot) => (
                        <ParkingStall
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlot?.id === slot.id}
                          onSelect={() => !readOnly && onSelectSlot(slot)}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Legend Footer */}
          <div className="relative z-10 pt-3 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-[11px] font-bold">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-3 h-3 rounded-md bg-emerald-500/20 border-2 border-emerald-400" />
                <span>Your Selected Spot</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-3 h-3 rounded-md bg-zinc-800 border border-zinc-700" />
                <span>Free & Available</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-3 h-3 rounded-md bg-zinc-900 border border-rose-900/60 flex items-center justify-center text-[8px]">
                  🚗
                </span>
                <span>Occupied</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span>⚡ EV Charger Ready</span>
              </span>
            </div>

            {selectedSlot && (
              <div className="px-3 py-1 rounded-xl bg-emerald-500 text-black font-black text-xs animate-fade-in shadow-md">
                Selected Spot: {selectedSlot.slot_number} ✓
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUICK GRID VIEW ── */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {filteredSlots.map((slot) => {
            const isOccupied =
              slot.is_occupied ||
              (slot.status || "available").toLowerCase() === "occupied" ||
              (slot.status || "available").toLowerCase() === "maintenance";
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isOccupied || readOnly}
                onClick={() => !readOnly && onSelectSlot(slot)}
                className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border-2 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg scale-105 ring-2 ring-emerald-500/40 font-bold"
                    : isOccupied
                    ? "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed opacity-50"
                    : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-zinc-900 dark:text-white"
                }`}
              >
                {slot.is_ev && (
                  <span className="absolute top-1.5 right-1.5 text-[10px]">⚡</span>
                )}
                <span className="text-sm font-black font-mono">{slot.slot_number}</span>
                <span
                  className={`text-[10px] font-bold ${
                    isSelected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isOccupied
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }`}
                >
                  {isSelected ? "Selected ✓" : isOccupied ? "Occupied" : "Free"}
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

  return (
    <button
      type="button"
      disabled={isOccupied || isMaintenance || readOnly}
      onClick={onSelect}
      className={`group relative h-24 sm:h-28 rounded-xl flex flex-col justify-between p-2.5 transition-all duration-200 border-2 text-left cursor-pointer ${
        isSelected
          ? "bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-105 ring-2 ring-emerald-400 z-20"
          : isOccupied
          ? "bg-zinc-950/90 border-zinc-800/80 text-zinc-500 cursor-not-allowed opacity-60"
          : isMaintenance
          ? "bg-amber-950/30 border-amber-800/60 text-amber-400 cursor-not-allowed"
          : "bg-zinc-900/90 border-zinc-700/80 hover:border-emerald-400 hover:bg-zinc-800 text-zinc-200 hover:shadow-lg"
      }`}
    >
      {/* Top Strip */}
      <div className="flex items-center justify-between w-full">
        <span className="font-mono text-xs font-black tracking-tight text-white">
          {slot.slot_number}
        </span>

        {slot.is_ev ? (
          <span className="text-[10px] text-amber-400 bg-amber-400/20 px-1 py-0.5 rounded font-black">
            ⚡ EV
          </span>
        ) : (
          <span className="text-[9px] text-zinc-500 font-mono">
            {slot.vehicle_type || "CAR"}
          </span>
        )}
      </div>

      {/* Visual Bay Center Graphics */}
      <div className="flex items-center justify-center my-auto">
        {isSelected ? (
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg animate-bounce">
            <FiCheck className="w-4 h-4 stroke-[3]" />
          </div>
        ) : isOccupied ? (
          <div className="text-center space-y-0.5">
            <span className="text-xl leading-none">🚗</span>
            <span className="text-[9px] text-rose-400 font-bold block uppercase tracking-wider">
              Parked
            </span>
          </div>
        ) : isMaintenance ? (
          <div className="text-center space-y-0.5">
            <FiAlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />
            <span className="text-[8px] text-amber-400 font-bold block uppercase">
              Repair
            </span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-zinc-600 group-hover:border-emerald-400 group-hover:bg-emerald-400/10 flex items-center justify-center transition-colors">
            <span className="text-[9px] text-zinc-500 group-hover:text-emerald-400 font-bold">
              FREE
            </span>
          </div>
        )}
      </div>

      {/* Bottom Status / Selection Marker */}
      <div className="flex items-center justify-between w-full pt-1 border-t border-zinc-800/80 text-[9px] font-bold">
        {isSelected ? (
          <span className="text-emerald-300 font-black">SELECTED</span>
        ) : isOccupied ? (
          <span className="text-zinc-500">IN USE</span>
        ) : (
          <span className="text-emerald-400/90 group-hover:text-emerald-300">
            TAP TO LOCK
          </span>
        )}
      </div>
    </button>
  );
}
