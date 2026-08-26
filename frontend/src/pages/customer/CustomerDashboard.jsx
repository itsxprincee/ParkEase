import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiShield,
  FiNavigation,
  FiX,
  FiLayers,
  FiArrowRight,
  FiTrendingUp,
  FiSliders,
  FiCompass,
  FiCalendar,
  FiDollarSign,
  FiAward,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Modal from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";
import ParkingMapView from "../../components/ParkingMapView";
import Button from "../../components/Button";
import FindMyCarModal from "../../components/FindMyCarModal";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
          toast.type === "error"
            ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
            : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
        }`}
      >
        {toast.type === "error" ? (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-3.5 h-3.5" />
          </div>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

// ── Distance Calculation ──────────────────────────────────────────────────────
function calcDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

function numericDistance(userCoords, parking) {
  if (!userCoords || !parking.latitude || !parking.longitude) return 999999;
  const R = 6371;
  const dLat = ((Number(parking.latitude) - Number(userCoords.lat)) * Math.PI) / 180;
  const dLon = ((Number(parking.longitude) - Number(userCoords.lng)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((Number(userCoords.lat) * Math.PI) / 180) *
      Math.cos((Number(parking.latitude) * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Top-Notch Parking Card ───────────────────────────────────────────────────
function ParkingListCard({ parking, userCoords, onClick }) {
  const { t } = useLanguage();
  const available = parking.available_slots ?? parking.available ?? parking.total_slots ?? 12;
  const isFree = (parking.hourly_rate ?? -1) === 0;
  const hasDaily = parking.pricing_type === "DAILY_PASS" || parking.pricing_type === "BOTH" || (parking.daily_rate && parking.daily_rate > 0);
  const distance = userCoords
    ? calcDistance(userCoords.lat, userCoords.lng, parking.latitude, parking.longitude)
    : null;
  const isLow = available <= 3 && available > 0;
  const isFull = available === 0;

  return (
    <div
      onClick={onClick}
      className="group relative p-4.5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white/95 dark:bg-zinc-900/90 hover:bg-zinc-50/80 dark:hover:bg-zinc-850/80 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-0.5 cursor-pointer backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        
        {/* Left icon & details */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center text-xl shrink-0 transition-colors shadow-xs">
            {parking.has_ev ? "⚡" : "🅿️"}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate">
                {parking.name || "ParkEase Hub"}
              </h3>
              {hasDaily && (
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  🎟️ ₹{parking.daily_rate || 10}/day
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate font-medium">
              <FiMapPin className="w-3 h-3 shrink-0 text-zinc-400" />
              <span>{parking.address || parking.location || "City Location"}</span>
            </p>

            {/* Feature tags */}
            <div className="flex items-center gap-2.5 text-[11px] font-semibold flex-wrap pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  isFull
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    : isLow
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isFull ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                {isFull ? "Full" : `${available} bays left`}
              </span>

              {distance && (
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                  📍 {distance}
                </span>
              )}

              {parking.has_ev && (
                <span className="text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                  ⚡ Fast EV
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Pricing & Book Action */}
        <div className="shrink-0 text-right space-y-1">
          {isFree ? (
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">FREE</span>
          ) : (
            <div>
              <span className="text-base font-black text-zinc-900 dark:text-white font-mono">
                ₹{parking.hourly_rate ?? 50}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold block">/hour</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1 text-[11px] font-black text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors pt-1">
            <span>Book</span>
            <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Customer Dashboard Component ─────────────────────────────────────────
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [user, setUser] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapModalParking, setMapModalParking] = useState(null);
  const [findCarModalBooking, setFindCarModalBooking] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (_) {}
      }

      const [parkingRes, bookingRes] = await Promise.allSettled([
        API.get("/parking/approved"),
        API.get("/booking/my-bookings"),
      ]);

      if (parkingRes.status === "fulfilled") {
        const raw = parkingRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.parking_locations)
          ? raw.parking_locations
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        setParkingLocations(list);
      }

      if (bookingRes.status === "fulfilled") {
        const raw = bookingRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.bookings)
          ? raw.bookings
          : [];
        setBookings(list);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLocateNearest = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setSelectedFilter("NEARBY");
        setIsLocating(false);
        showToast("📍 Exact location detected! Sorted by nearest distance.", "success");
      },
      () => {
        setIsLocating(false);
        const fallbackLat = parkingLocations[0]?.latitude || 19.0864;
        const fallbackLng = parkingLocations[0]?.longitude || 72.8890;
        setUserCoords({ lat: fallbackLat, lng: fallbackLng });
        setSelectedFilter("NEARBY");
        showToast("📍 Centered on closest verified parking hub.", "info");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const getUserName = () => {
    if (!user) return "Driver";
    return user.name || user.full_name || user.username || "Driver";
  };

  const latestActive = bookings.find(
    (b) => b.status === "ACTIVE" || b.status === "CONFIRMED" || b.status === "BOOKED"
  );

  const filteredParking = parkingLocations
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q));

      let matchFilter = true;
      if (selectedFilter === "FREE") matchFilter = (p.hourly_rate ?? 0) === 0;
      if (selectedFilter === "EV") matchFilter = Boolean(p.has_ev);
      if (selectedFilter === "DAILY_PASS") {
        matchFilter = p.pricing_type === "DAILY_PASS" || p.pricing_type === "BOTH" || (p.daily_rate && p.daily_rate > 0);
      }
      if (selectedFilter === "SECURITY") matchFilter = Boolean(p.has_cctv || p.is_covered);

      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (selectedFilter === "NEARBY" && userCoords) {
        return numericDistance(userCoords, a) - numericDistance(userCoords, b);
      }
      return 0;
    });

  const filters = [
    { id: "ALL", label: "🌟 All Hubs" },
    { id: "NEARBY", label: "📍 Near Me" },
    { id: "FREE", label: "🆓 Free Parking" },
    { id: "EV", label: "⚡ EV Charging" },
    { id: "DAILY_PASS", label: "🎟️ Daily Pass" },
  ];

  const destinationShortcuts = [
    { label: "✈️ Airport", query: "Airport" },
    { label: "🛍️ Mall", query: "Mall" },
    { label: "🏢 Tech Park", query: "Tech" },
    { label: "🚆 Station", query: "Station" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO SEARCH BANNER — VIBRANT EMERALD-CYAN GRADIENT
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-9 shadow-2xl border border-emerald-400/30">
          {/* Subtle Grid Accent */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black tracking-wide backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                <span>INSTANT DIGITAL PASS GENERATION</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Where are you parking, {getUserName().split(" ")[0]}?
              </h1>
              <p className="text-emerald-50 text-xs sm:text-sm font-medium">
                Reserve verified parking bays with live QR entry passes and fast contactless gates.
              </p>

              {/* Quick Destination Shortcut Tags */}
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-xs text-emerald-100 font-bold">Quick Search:</span>
                {destinationShortcuts.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => setSearch(tag.query)}
                    className="px-3.5 py-1 rounded-full text-xs font-black bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Pass Banner (if user has an active booking) */}
            {latestActive && (
              <div className="shrink-0 p-5 rounded-3xl bg-white/15 border border-white/25 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4 max-w-md text-white">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>ACTIVE RESERVATION</span>
                  </div>
                  <p className="text-sm font-black text-white line-clamp-1">
                    {latestActive.parking_name || "ParkEase Facility"}
                  </p>
                  <p className="text-xs text-emerald-100 font-mono">Bay #{latestActive.slot_number}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setFindCarModalBooking(latestActive)}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-white/20"
                    title="Open Walking Compass & Radar"
                  >
                    <FiCompass className="w-4 h-4 animate-spin-slow" />
                    <span>Find Car</span>
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/customer/qr?booking=${latestActive.id}`, {
                        state: { booking: latestActive },
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Pass
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. SPLIT LAYOUT: SEARCH DRAWER + INTERACTIVE MAP
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT: PARKING DRAWER */}
          <div className="lg:col-span-5 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col backdrop-blur-xl">
            
            {/* Search + GPS Row */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
              {/* GPS row */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <div className="w-3 h-3 rounded-full bg-zinc-900 dark:bg-white shrink-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900" />
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white flex-1">
                  {userCoords ? "📍 Live GPS Enabled" : "Detect Closest Parking"}
                </span>
                <button
                  onClick={handleLocateNearest}
                  disabled={isLocating}
                  className="text-[11px] font-bold px-3 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:border-zinc-400 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  {isLocating ? "Locating…" : userCoords ? "✓ Active" : "Detect GPS"}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search parking hub or area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full shadow-xs focus:ring-2 focus:ring-emerald-500/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white z-10 p-0.5"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (f.id === "NEARBY" && !userCoords) handleLocateNearest();
                    else setSelectedFilter(f.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedFilter === f.id
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-black"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Parking List */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px]">
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : filteredParking.length === 0 ? (
                <div className="text-center py-12">
                  <FiMapPin className="w-8 h-8 mx-auto text-zinc-400 mb-3" />
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">No parking facilities found</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting your filters or destination search</p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedFilter("ALL");
                    }}
                    className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                filteredParking.map((p) => (
                  <ParkingListCard
                    key={p.id}
                    parking={p}
                    userCoords={userCoords}
                    onClick={() =>
                      navigate(`/customer/parking/${p.id}/book`, { state: { parking: p } })
                    }
                  />
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">
                {filteredParking.length} verified parking hubs available
              </span>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <FiShield className="w-3.5 h-3.5" />
                <span>Instant QR Pass</span>
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE MAP VIEW */}
          <div className="lg:col-span-7 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden min-h-[520px]">
            <ParkingMapView
              parkingLocations={filteredParking}
              userCoords={userCoords}
              onLocateUser={handleLocateNearest}
              isLocating={isLocating}
              onBookParking={(p) =>
                navigate(`/customer/parking/${p.id}/book`, { state: { parking: p } })
              }
              onViewDetails={(p) =>
                navigate(`/customer/parking/${p.id}/book`, { state: { parking: p } })
              }
            />
          </div>
        </div>
      </main>

      {/* ─── FIND MY CAR & WALKING RADAR MODAL ─── */}
      {findCarModalBooking && (
        <FindMyCarModal
          isOpen={Boolean(findCarModalBooking)}
          onClose={() => setFindCarModalBooking(null)}
          booking={findCarModalBooking}
        />
      )}
    </div>
  );
}
