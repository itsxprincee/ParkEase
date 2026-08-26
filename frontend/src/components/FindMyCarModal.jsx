import React, { useState, useEffect, useRef } from "react";
import {
  FiMapPin,
  FiCompass,
  FiVolume2,
  FiZap,
  FiCheck,
  FiExternalLink,
  FiNavigation,
  FiEdit3,
  FiInfo,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import Modal from "./Modal";
import Button from "./Button";

/* ─── Web Audio API Car Horn Synthesizer ────────────────────────────────── */
function playCarHornSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "triangle";

    // Dual-tone European/Indian automotive horn (420Hz & 490Hz)
    osc1.frequency.setValueAtTime(420, ctx.currentTime);
    osc2.frequency.setValueAtTime(490, ctx.currentTime);

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

    // Second short beep
    setTimeout(() => {
      try {
        const ctx2 = new AudioContext();
        const o1 = ctx2.createOscillator();
        const o2 = ctx2.createOscillator();
        const g = ctx2.createGain();
        o1.type = "sawtooth";
        o2.type = "triangle";
        o1.frequency.setValueAtTime(420, ctx2.currentTime);
        o2.frequency.setValueAtTime(490, ctx2.currentTime);
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

  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(`parkease_car_note_${booking.id}`) || "Near Pillar B-04, 2nd row from Lift 3";
    } catch {
      return "Near Pillar B-04, 2nd row from Lift 3";
    }
  });

  const [editingNote, setEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(notes);
  const [isHornActive, setIsHornActive] = useState(false);
  const [isHazardActive, setIsHazardActive] = useState(false);
  const [distance, setDistance] = useState(38); // Simulated distance in meters

  const saveNote = () => {
    setNotes(tempNote);
    try {
      localStorage.setItem(`parkease_car_note_${booking.id}`, tempNote);
    } catch (_) {}
    setEditingNote(false);
  };

  const triggerHorn = () => {
    setIsHornActive(true);
    playCarHornSound();
    setTimeout(() => setIsHornActive(false), 800);
  };

  const triggerHazard = () => {
    setIsHazardActive(true);
    setTimeout(() => setIsHazardActive(false), 3000);
  };

  // Google maps walking link
  const openExternalMaps = () => {
    const lat = booking.latitude || "19.0760";
    const lng = booking.longitude || "72.8777";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📍 Find My Parked Car" maxWidth="max-w-lg">
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
                  <FiCompass className="w-7 h-7 text-emerald-400 animate-spin-slow" />
                  <span className="text-[10px] font-black text-emerald-400 mt-1">RADAR</span>
                </div>
              </div>
            </div>

            {/* Distance & Bay Coordinates */}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE WALKING NAVIGATOR</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {distance}m <span className="text-sm font-normal text-zinc-400">away</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Approx. <strong className="text-white">1 min walk</strong> to your vehicle
                </p>
              </div>

              {/* Bay Tag */}
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
                <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-black font-mono border border-white/15">
                  Level 2 • Bay {booking.slot_number || "A-1"}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-black font-mono border border-emerald-500/30">
                  {booking.vehicle_number || "MH-01"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Walking Directions Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
              <FiNavigation className="w-3.5 h-3.5 text-emerald-500" />
              Walking Steps to Bay
            </span>
            <span className="text-[11px] text-zinc-400 font-bold">Indoor Deck Path</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <p className="text-zinc-700 dark:text-zinc-300">
                Enter via <strong>Gate 2 Pedestrian Lobby</strong> and take Lift to <strong>Level 2</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <p className="text-zinc-700 dark:text-zinc-300">
                Walk straight 20m along <strong>Zone B corridor</strong> towards Pillar B-04.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <p className="text-zinc-900 dark:text-white font-bold">
                Your vehicle is safely parked in <strong>Bay {booking.slot_number || "A-1"}</strong> on your left.
              </p>
            </div>
          </div>
        </div>

        {/* Driver Landmark Memory Note */}
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
                placeholder="e.g. Near Pillar B-04, next to stairs"
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
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-black shadow-xs cursor-pointer"
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

        {/* Remote Car Locator: Sound Horn & Flash Hazards Simulator */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Spot Locator Triggers
          </label>
          <div className="grid grid-cols-2 gap-3">
            
            {/* Beep Horn Button */}
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
              <span>{isHornActive ? "Beeping Horn 🔊..." : "Beep Car Horn"}</span>
            </button>

            {/* Flash Hazard Lights Button */}
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
              <span>{isHazardActive ? "Flashing Hazards 🚨..." : "Flash Hazards"}</span>
            </button>
          </div>
        </div>

        {/* External GPS Navigation Link & Close */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={openExternalMaps}
            className="px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiExternalLink className="w-4 h-4" />
            <span>Google Maps</span>
          </button>
          <Button variant="primary" onClick={onClose}>
            Back to Passes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
