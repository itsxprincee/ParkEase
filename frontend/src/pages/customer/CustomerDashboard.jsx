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
  FiGrid,
  FiMap,
  FiActivity,
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
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${toast.type === "error"
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

// ── Top-Tier Parking Hub Card ────────────────────────────────────────────────
function ParkingListCard({ parking, userCoords, onClick }) {
  const { t } = useLanguage();
  const total = parking.total_slots || 20;
  const available = parking.available_slots ?? parking.available ?? total;
  const isFree = (parking.hourly_rate ?? -1) === 0;
  const hasDaily = parking.pricing_type === "DAILY_PASS" || parking.pricing_type === "BOTH" || (parking.daily_rate && parking.daily_rate > 0);
  const distance = userCoords
    ? calcDistance(userCoords.lat, userCoords.lng, parking.latitude, parking.longitude)
    : null;
  const isLow = available <= 3 && available > 0;
  const isFull = available === 0;
  const occupancyPct = Math.min(Math.round(((total - available) / total) * 100), 100);

  return (
    <div
      onClick={onClick}
      className="group relative p-4.5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-950 dark:hover:border-white bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all duration-200 shadow-xs hover:shadow-xl cursor-pointer flex flex-col gap-3.5 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3.5">
        {/* Left Icon & Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            🅿️
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight truncate">
                {parking.name || "ParkEase Hub"}
              </h3>
              {hasDaily && (
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ₹{parking.daily_rate}/day pass
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate font-medium">
              <FiMapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>{parking.address || parking.location || "City Center Location"}</span>
            </p>
          </div>
        </div>

        {/* Right Pricing */}
        <div className="shrink-0 text-right">
          {isFree ? (
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">FREE</span>
          ) : (
            <div>
              <span className="text-lg font-black text-zinc-900 dark:text-white font-mono tracking-tight">
                ₹{parking.hourly_rate ?? 40}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold block leading-none">/hour</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Occupancy Bar */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span
            className={`inline-flex items-center gap-1.5 ${isFull
                ? "text-rose-600 dark:text-rose-400"
                : isLow
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${isFull ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {isFull ? "Lot Completely Full" : isLow ? `Only ${available} spots remaining!` : `${available} spots available`}
          </span>

          {distance && (
            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
              📍 {distance} away
            </span>
          )}
        </div>

        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${occupancyPct > 85 ? "bg-rose-500" : occupancyPct > 60 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>

      {/* Footer Features & 1-Tap Reserve */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {parking.has_cctv && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              📹 CCTV
            </span>
          )}
          {parking.is_covered && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              ☂️ Covered
            </span>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-950 dark:text-white group-hover:text-emerald-500 transition-colors">
          <span>Select Bay</span>
          <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
  const [viewLayout, setViewLayout] = useState("SPLIT"); // "SPLIT" | "GRID" | "MAP_ONLY"
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
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
        } catch (_) { }
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
      if (selectedFilter === "CAR") {
        const sup = (p.supported_vehicles || "BOTH").toUpperCase();
        matchFilter = sup === "CAR" || sup === "BOTH";
      }
      if (selectedFilter === "BIKE") {
        const sup = (p.supported_vehicles || "BOTH").toUpperCase();
        matchFilter = sup === "BIKE" || sup === "BOTH";
      }
      if (selectedFilter === "FREE") matchFilter = (p.hourly_rate ?? 0) === 0;
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

  const allFilters = [
    { id: "ALL", label: "🌟 All Hubs" },
    { id: "CAR", label: "🚗 Cars" },
    { id: "BIKE", label: "🛵 Bikes" },
    { id: "EV", label: "⚡ EV Charging", query: "EV" },
    { id: "AIRPORT", label: "✈️ Airports", query: "Airport" },
    { id: "MALL", label: "🛍️ Malls", query: "Mall" },
    { id: "TECH", label: "🏢 Tech Parks", query: "Tech" },
    { id: "DAILY_PASS", label: "🎟️ Daily Pass" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#08080c] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* ══════════════════════════════════════════════════════════════════
            PREMIUM UBER-GRADE "FIND PARKING" COMMAND HUB
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-6 sm:p-8 shadow-2xl border border-zinc-800 space-y-5">
          {/* Subtle Ambient Emerald Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />

          {/* Header Bar */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black tracking-wide border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE PARKING NETWORK • 99.8% AVAILABILITY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Find & Reserve Parking
              </h1>
            </div>

            {/* Split / Grid View Toggle */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shrink-0 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setViewLayout("SPLIT")}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === "SPLIT"
                    ? "bg-white text-zinc-950 shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Split View (Map + List)"
              >
                <FiLayers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("GRID")}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === "GRID"
                    ? "bg-white text-zinc-950 shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Grid Cards Only"
              >
                <FiGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & GPS Action Capsule */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search destination, mall, airport, or tech park..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-750 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 1-Tap Near Me Button */}
            <button
              onClick={handleLocateNearest}
              disabled={isLocating}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg shrink-0 ${
                userCoords
                  ? "bg-emerald-500 text-black font-black shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-750"
              }`}
            >
              <FiCompass className={`w-4 h-4 ${userCoords ? "text-black" : "text-emerald-400"} ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Detecting GPS..." : userCoords ? "📍 Near Me (Active)" : "📍 Find Near Me"}</span>
            </button>
          </div>

          {/* Tactile Category Filter Chips */}
          <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 pt-1.5 border-t border-zinc-800/80">
            {allFilters.map((f) => {
              const isSelected =
                f.query
                  ? search.toLowerCase() === f.query.toLowerCase()
                  : selectedFilter === f.id && !search;

              return (
                <button
                  key={f.id}
                  onClick={() => {
                    if (f.query) {
                      setSearch(search.toLowerCase() === f.query.toLowerCase() ? "" : f.query);
                      setSelectedFilter("ALL");
                    } else {
                      setSearch("");
                      setSelectedFilter(f.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 shadow-xs border ${
                    isSelected
                      ? "bg-white text-zinc-950 font-black border-white shadow-md scale-105"
                      : "bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-750"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. MAIN CONTENT: SPLIT OR GRID
        ══════════════════════════════════════════════════════════════════ */}
        {viewLayout === "SPLIT" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT: PARKING DRAWER */}
            <div className="lg:col-span-5 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm overflow-hidden flex flex-col backdrop-blur-xl">
              <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  {filteredParking.length} Verified Facilities
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <FiShield className="w-3.5 h-3.5" />
                  <span>Instant Spot Lock</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[360px]">
                {loading ? (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                ) : filteredParking.length === 0 ? (
                  <div className="text-center py-12">
                    <FiMapPin className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
                    <p className="text-sm font-black text-zinc-900 dark:text-white">No parking facilities match criteria</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting your filters or destination keywords</p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setSelectedFilter("ALL");
                      }}
                      className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Clear search filters
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
            </div>

            {/* RIGHT: INTERACTIVE MAP VIEW */}
            <div className="lg:col-span-7 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm overflow-hidden min-h-[560px]">
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
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : filteredParking.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <FiMapPin className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
                <p className="text-base font-black text-zinc-900 dark:text-white">No parking facilities found</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try searching for a different landmark or neighborhood</p>
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
        )}
      </main>

      {/* ─── FIND MY CAR & RADAR BEACON MODAL ─── */}
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
