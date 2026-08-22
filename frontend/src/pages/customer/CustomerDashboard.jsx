import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Modal from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";
import ParkingMapView from "../../components/ParkingMapView";
import Button from "../../components/Button";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-white text-[#e11900] border-[#fca5a5]"
            : "bg-white text-[#05944f] border-[#86efac]"
        }`}
      >
        {toast.type === "error" ? (
          <FiAlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <FiCheckCircle className="w-4 h-4 shrink-0" />
        )}
        {toast.message}
      </div>
    </div>
  );
}

// ── Haversine helpers ─────────────────────────────────────────────────────────
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

// ── Parking List Card ─────────────────────────────────────────────────────────
function ParkingListCard({ parking, userCoords, onClick }) {
  const available = parking.available_slots ?? parking.available ?? parking.total_slots ?? 12;
  const isFree = (parking.hourly_rate ?? -1) === 0;
  const distance = userCoords
    ? calcDistance(userCoords.lat, userCoords.lng, parking.latitude, parking.longitude)
    : null;
  const isLow = available <= 3 && available >= 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border border-[#e0e0e0] hover:border-[#0a0a0a] bg-white hover:bg-[#f7f7f7] transition-all duration-150 flex items-center justify-between group active:scale-[0.99]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-[#f0f0f0] group-hover:bg-[#e8e8e8] flex items-center justify-center text-xl shrink-0 transition-colors">
          {parking.has_ev ? "⚡" : "🅿️"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0a0a0a] truncate">
            {parking.name || "ParkEase Facility"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[11px] font-semibold ${
                isLow ? "text-[#e11900]" : "text-[#737373]"
              }`}
            >
              {available} spots
            </span>
            {distance && (
              <>
                <span className="text-[#e0e0e0]">·</span>
                <span className="text-[11px] text-[#737373] font-medium">{distance}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right ml-2">
        {isFree ? (
          <span className="text-sm font-black text-[#05944f]">FREE</span>
        ) : (
          <div>
            <span className="text-base font-black text-[#0a0a0a]">
              ₹{parking.hourly_rate ?? 50}
            </span>
            <span className="text-[10px] text-[#a0a0a0] font-medium block">/hr</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapModalParking, setMapModalParking] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem("user");
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch (_) {}
      }

      const [parkingRes, bookingRes] = await Promise.allSettled([
        API.get("/parking/approved"),
        API.get("/booking/my-bookings"),
      ]);

      if (parkingRes.status === "fulfilled") {
        const d = parkingRes.value.data;
        setParkingLocations(
          Array.isArray(d) ? d : Array.isArray(d?.locations) ? d.locations : []
        );
      }
      if (bookingRes.status === "fulfilled") {
        const d = bookingRes.value.data;
        setBookings(Array.isArray(d) ? d : d?.bookings || []);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleLocateNearest = () => {
    if (!navigator.geolocation) {
      return showToast("Geolocation not supported.", "error");
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setSelectedFilter("NEARBY");
        setIsLocating(false);
        showToast("📍 GPS detected — nearest first!", "success");
      },
      () => {
        setUserCoords({ lat: 19.076, lng: 72.8777 });
        setSelectedFilter("NEARBY");
        setIsLocating(false);
        showToast("📍 Using city GPS for nearest sort.", "success");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const getUserName = () => {
    if (!user) return "Driver";
    return user.name || user.full_name || user.username || user.email?.split("@")[0] || "Driver";
  };

  const activeBookings = bookings.filter((b) => {
    const s = b.status?.toLowerCase();
    return s === "active" || s === "booked" || s === "confirmed" || s === "upcoming";
  });
  const latestActive = activeBookings[0];

  const filteredParking = parkingLocations
    .filter((p) => {
      const q = search.toLowerCase();
      const matches =
        p.name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q);
      if (!matches) return false;
      if (selectedFilter === "EV") return p.has_ev || p.ev_charging;
      if (selectedFilter === "FREE") return (p.hourly_rate ?? -1) === 0;
      if (selectedFilter === "SECURITY") return p.has_security_guard;
      if (selectedFilter === "CCTV") return p.has_cctv;
      return true;
    })
    .sort((a, b) => {
      if (selectedFilter === "NEARBY" && userCoords) {
        return numericDistance(userCoords, a) - numericDistance(userCoords, b);
      }
      return 0;
    });

  const filters = [
    { id: "ALL", label: "All" },
    { id: "NEARBY", label: "📍 Near Me" },
    { id: "FREE", label: "🆓 Free" },
    { id: "EV", label: "⚡ EV" },
    { id: "SECURITY", label: "🛡️ Guarded" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />
      <Toast toast={toast} />

      {/* MAP MODAL */}
      {mapModalParking && (
        <Modal
          isOpen={Boolean(mapModalParking)}
          onClose={() => setMapModalParking(null)}
          title={mapModalParking.name}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="h-72 w-full rounded-xl overflow-hidden border border-[#e0e0e0]">
              <iframe
                title="Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${mapModalParking.latitude || 19.076},${mapModalParking.longitude || 72.8777}&hl=en&z=15&output=embed`}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[#737373]">
                {mapModalParking.address || mapModalParking.location}
              </p>
              <Button
                icon={FiNavigation}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${mapModalParking.latitude},${mapModalParking.longitude}`,
                    "_blank"
                  )
                }
              >
                Navigate
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">
              Where to, {getUserName().split(" ")[0]}?
            </h1>
            <p className="text-sm text-[#737373] font-medium mt-0.5">
              {filteredParking.length} verified facilities near you
            </p>
          </div>

          {latestActive && (
            <button
              onClick={() =>
                navigate(`/customer/qr?booking=${latestActive.id}`, {
                  state: { booking: latestActive },
                })
              }
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a0a0a] text-white text-xs font-bold hover:bg-[#242424] transition-colors shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#05944f] animate-dot-ping shrink-0" />
              Active Pass → Slot {latestActive.slot_number}
            </button>
          )}
        </div>

        {/* SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* LEFT: BOOKING DRAWER */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">

            {/* Search + GPS inputs */}
            <div className="p-4 border-b border-[#f0f0f0] space-y-3">
              {/* GPS row */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0]">
                <div className="w-3 h-3 rounded-full bg-[#0a0a0a] shrink-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-xs font-semibold text-[#0a0a0a] flex-1">
                  {userCoords ? "📍 GPS Location Active" : "Current Location"}
                </span>
                <button
                  onClick={handleLocateNearest}
                  disabled={isLocating}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[#e0e0e0] text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
                >
                  {isLocating ? "Locating…" : userCoords ? "✓ Active" : "Detect GPS"}
                </button>
              </div>

              {/* Search */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#737373] pointer-events-none z-10">
                  <FiSearch className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search parking or area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-input pe-input-icon-left text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a] z-10"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter pills */}
            <div className="px-4 py-2.5 border-b border-[#f0f0f0] flex items-center gap-1.5 overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (f.id === "NEARBY" && !userCoords) handleLocateNearest();
                    else setSelectedFilter(f.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    selectedFilter === f.id
                      ? "bg-[#0a0a0a] text-white shadow-sm"
                      : "bg-[#f0f0f0] text-[#545454] hover:bg-[#e0e0e0]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Parking list */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px]">
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : filteredParking.length === 0 ? (
                <div className="text-center py-12">
                  <FiMapPin className="w-8 h-8 mx-auto text-[#d0d0d0] mb-3" />
                  <p className="text-sm font-semibold text-[#0a0a0a]">No parking found</p>
                  <p className="text-xs text-[#737373] mt-1">Try adjusting your filters or search</p>
                  <button
                    onClick={() => { setSearch(""); setSelectedFilter("ALL"); }}
                    className="mt-3 text-xs text-[#276ef1] font-semibold hover:underline"
                  >
                    Reset filters
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

            {/* Footer stat */}
            <div className="px-4 py-3 border-t border-[#f0f0f0] flex items-center justify-between">
              <span className="text-xs text-[#a0a0a0] font-medium">
                {filteredParking.length} facility{filteredParking.length !== 1 ? "ies" : ""} verified
              </span>
              <div className="flex items-center gap-1.5">
                <FiShield className="w-3.5 h-3.5 text-[#05944f]" />
                <span className="text-xs text-[#05944f] font-semibold">Instant QR Pass</span>
              </div>
            </div>
          </div>

          {/* RIGHT: MAP */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden min-h-[520px]">
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
    </div>
  );
}