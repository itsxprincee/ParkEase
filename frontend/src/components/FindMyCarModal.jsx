import React, { useState, useEffect } from "react";
import {
  FiMapPin,
  FiCompass,
  FiVolume2,
  FiZap,
  FiCheck,
  FiExternalLink,
  FiNavigation,
  FiEdit3,
  FiCrosshair,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import Modal from "./Modal";
import Button from "./Button";

/* ─── Web Audio API Vehicle Horn / Beep Synthesizer ──────────────────────── */
function playVehicleSound(isBike) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = isBike ? "sine" : "sawtooth";
    osc2.type = isBike ? "sine" : "triangle";

    const freq1 = isBike ? 520 : 420;
    const freq2 = isBike ? 680 : 490;

    osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
    osc2.frequency.setValueAtTime(freq2, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);

    setTimeout(() => {
      try {
        const ctx2 = new AudioContext();
        const o1 = ctx2.createOscillator();
        const o2 = ctx2.createOscillator();
        const g = ctx2.createGain();
        o1.type = isBike ? "sine" : "sawtooth";
        o2.type = isBike ? "sine" : "triangle";
        o1.frequency.setValueAtTime(freq1, ctx2.currentTime);
        o2.frequency.setValueAtTime(freq2, ctx2.currentTime);
        g.gain.setValueAtTime(0.001, ctx2.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, ctx2.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.3);
        o1.connect(g);
        o2.connect(g);
        g.connect(ctx2.destination);
        o1.start(ctx2.currentTime);
        o2.start(ctx2.currentTime);
        o1.stop(ctx2.currentTime + 0.3);
        o2.stop(ctx2.currentTime + 0.3);
      } catch (_) {}
    }, 250);
  } catch (_) {}
}

export default function FindMyCarModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const isBike =
    String(booking.vehicle_type || "").toLowerCase().includes("bike") ||
    String(booking.vehicle_name || "").toLowerCase().includes("bike") ||
    String(booking.vehicle_name || "").toLowerCase().includes("scooter");

  const vehicleNoun = isBike ? "Bike" : "Car";
  const vehicleEmoji = isBike ? "🛵" : "🚗";

  const [notes, setNotes] = useState(() => {
    try {
      return (
        localStorage.getItem(`parkease_car_note_${booking.id}`) ||
        `Parked at Bay ${booking.slot_number || "A-01"}, near Pillar B-04`
      );
    } catch {
      return `Parked at Bay ${booking.slot_number || "A-01"}, near Pillar B-04`;
    }
  });

  const [markedGps, setMarkedGps] = useState(() => {
    try {
      const saved = localStorage.getItem(`parkease_car_gps_${booking.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [markingGps, setMarkingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(notes);
  const [isHornActive, setIsHornActive] = useState(false);
  const [isHazardActive, setIsHazardActive] = useState(false);
  const [distance] = useState(38); // Estimated walking distance

  const handleMarkSpotGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setMarkingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMarkedGps(coords);
        try {
          localStorage.setItem(`parkease_car_gps_${booking.id}`, JSON.stringify(coords));
        } catch (_) {}
        setMarkingGps(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      () => {
        setMarkingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveNote = () => {
    setNotes(tempNote);
    try {
      localStorage.setItem(`parkease_car_note_${booking.id}`, tempNote);
    } catch (_) {}
    setEditingNote(false);
  };

  const triggerHorn = () => {
    setIsHornActive(true);
    playVehicleSound(isBike);
    setTimeout(() => setIsHornActive(false), 800);
  };

  const triggerHazard = () => {
    setIsHazardActive(true);
    setTimeout(() => setIsHazardActive(false), 3000);
  };

  const openExternalMaps = () => {
    const lat = markedGps?.lat || booking.parking_latitude || booking.latitude || "19.0760";
    const lng = markedGps?.lng || booking.parking_longitude || booking.longitude || "72.8777";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📍 Locate My ${vehicleNoun} (${vehicleEmoji} Spot ${booking.slot_number || "A-01"})`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 p-1">
        {/* Radar & Compass Walking HUD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#0d0d12] to-black border border-zinc-800 text-white p-6 shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Animated Radar Pulse Visualizer */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-50" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-2xl">{vehicleEmoji}</span>
                  <span className="text-[9px] font-black text-emerald-400 mt-0.5 tracking-wider">
                    SPOT LOCATOR
                  </span>
                </div>
              </div>
            </div>

            {/* Distance & Bay Details */}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>INDOOR SPOT LOCATOR</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {distance}m <span className="text-sm font-normal text-zinc-400">away</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Approx. <strong className="text-white">1 min walk</strong> to your parked {vehicleNoun.toLowerCase()}
                </p>
              </div>

              {/* Bay & Plate Tag */}
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
                <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-black font-mono border border-white/15">
                  Bay {booking.slot_number || "A-01"}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-black font-mono border border-emerald-500/30">
                  {booking.vehicle_number || "MH-01-AB-1234"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spot GPS Memory Pin Button */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                <FiMapPin className="w-4 h-4 text-emerald-500" />
                Marked Spot Location
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {markedGps
                  ? `GPS saved at ${markedGps.timestamp} (${markedGps.lat}, ${markedGps.lng})`
                  : `Mark your exact GPS pin after parking your ${vehicleNoun.toLowerCase()}`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkSpotGPS}
              disabled={markingGps}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
                gpsSuccess
                  ? "bg-emerald-500 text-black font-black"
                  : "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90"
              }`}
            >
              <FiCrosshair className={`w-3.5 h-3.5 ${markingGps ? "animate-spin" : ""}`} />
              <span>{markingGps ? "Marking GPS..." : gpsSuccess ? "✓ Spot Saved!" : "Mark My Spot"}</span>
            </button>
          </div>
        </div>

        {/* Turn-by-Turn Indoor Walking Steps */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
              <FiNavigation className="w-3.5 h-3.5 text-emerald-500" />
              Walking Steps to {vehicleNoun}
            </span>
            <span className="text-[11px] text-zinc-400 font-bold">Indoor Deck Path</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <p className="text-zinc-700 dark:text-zinc-300">
                Enter via <strong>Main Pedestrian Gate</strong> or Lift to parking level.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <p className="text-zinc-700 dark:text-zinc-300">
                Follow the <strong>Zone A/B aisle</strong> towards your marked pillar.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <p className="text-zinc-900 dark:text-white font-bold">
                Your {vehicleNoun.toLowerCase()} is parked in <strong>Bay {booking.slot_number || "A-01"}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Spot Landmark Memory Note */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
              <FiEdit3 className="w-3.5 h-3.5 text-emerald-500" />
              Landmark / Spot Memory Note
            </label>
            {!editingNote && (
              <button
                type="button"
                onClick={() => {
                  setTempNote(notes);
                  setEditingNote(true);
                }}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Edit Note
              </button>
            )}
          </div>

          {editingNote ? (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="e.g. Near Pillar B-04, next to Exit 2"
                className="pe-input text-xs w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(false)}
                  className="px-3 py-1 text-xs font-bold rounded-lg text-zinc-500 hover:bg-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNote}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-black shadow-xs cursor-pointer font-black"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium italic bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              "{notes}"
            </p>
          )}
        </div>

        {/* Remote Spot Locator: Sound Horn & Flash Hazards Simulator */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Remote Vehicle Triggers
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={triggerHorn}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer ${
                isHornActive
                  ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/30 scale-105"
                  : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 shadow-xs"
              }`}
            >
              <FiVolume2 className={`w-4 h-4 ${isHornActive ? "animate-bounce" : "text-amber-500"}`} />
              <span>{isHornActive ? "Beeping 🔊..." : isBike ? "Beep Scooter Horn" : "Beep Car Horn"}</span>
            </button>

            <button
              type="button"
              onClick={triggerHazard}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer ${
                isHazardActive
                  ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/30 animate-pulse"
                  : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 shadow-xs"
              }`}
            >
              <FiZap className={`w-4 h-4 ${isHazardActive ? "text-black" : "text-amber-500"}`} />
              <span>{isHazardActive ? "Flashing 🚨..." : isBike ? "Flash Beacon" : "Flash Hazards"}</span>
            </button>
          </div>
        </div>

        {/* Turn-by-Turn GPS Walking Directions Link & Close */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={openExternalMaps}
            className="px-4 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-black text-zinc-900 dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <FiExternalLink className="w-4 h-4" />
            <span>Walking Directions</span>
          </button>
          <Button variant="primary" onClick={onClose}>
            Back to Passes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
