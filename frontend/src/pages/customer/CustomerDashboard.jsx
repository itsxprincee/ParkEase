import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiArrowRight,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiShield,
  FiNavigation,
  FiFilter,
  FiX,
  FiTrendingUp,
  FiLayers,
  FiSliders,
  FiCompass,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { Card, StatCard } from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";
import ParkingMapView from "../../components/ParkingMapView";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // ALL, NEARBY, FREE, EV, SECURITY, CCTV, COVERED
  const [viewMode, setViewMode] = useState("GRID"); // "GRID" | "MAP"
  const [loading, setLoading] = useState(true);

  // GPS & Google Maps State
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

  // Distance calculator using Haversine formula in KM
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((Number(lat1) * Math.PI) / 180) *
        Math.cos((Number(lat2) * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  };

  const getNumericDistance = (parking) => {
    if (!userCoords || !parking.latitude || !parking.longitude) return 999999;
    const R = 6371;
    const dLat = ((Number(parking.latitude) - Number(userCoords.lat)) * Math.PI) / 180;
    const dLon = ((Number(parking.longitude) - Number(userCoords.lng)) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((Number(userCoords.lat) * Math.PI) / 180) *
        Math.cos((Number(parking.latitude) * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Find Nearest via Browser GPS
  const handleLocateNearest = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        setSelectedFilter("NEARBY");
        setIsLocating(false);
        showToast("📍 Live GPS detected! Nearest parking sorted to the top.", "success");
      },
      (err) => {
        setIsLocating(false);
        // Fallback default city coords for demo
        setUserCoords({ lat: 19.076, lng: 72.8777 });
        setSelectedFilter("NEARBY");
        showToast("📍 Using City Center GPS location to sort nearest parking.", "success");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error(e);
        }
      }

      const [parkingRes, bookingRes, vehicleRes] = await Promise.allSettled([
        API.get("/parking/approved"),
        API.get("/booking/my-bookings"),
        API.get("/vehicles/my"),
      ]);

      if (parkingRes.status === "fulfilled") {
        const data = parkingRes.value.data;
        if (Array.isArray(data)) {
          setParkingLocations(data);
        } else if (Array.isArray(data?.locations)) {
          setParkingLocations(data.locations);
        } else if (Array.isArray(data?.parking_locations)) {
          setParkingLocations(data.parking_locations);
        }
      }

      if (bookingRes.status === "fulfilled") {
        const data = bookingRes.value.data;
        if (Array.isArray(data)) {
          setBookings(data);
        } else if (Array.isArray(data?.bookings)) {
          setBookings(data.bookings);
        }
      }

      if (vehicleRes.status === "fulfilled") {
        const data = vehicleRes.value.data;
        if (Array.isArray(data)) {
          setVehicles(data);
        }
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => {
    if (!user) return "Driver";
    return (
      user.name ||
      user.full_name ||
      user.username ||
      user.email?.split("@")[0] ||
      "Driver"
    );
  };

  // Active bookings
  const activeBookings = bookings.filter((b) => {
    const s = b.status?.toLowerCase();
    return (
      s === "active" ||
      s === "booked" ||
      s === "confirmed" ||
      s === "upcoming"
    );
  });

  const latestActiveBooking = activeBookings[0];

  // Filtering & Sorting
  const filteredParking = parkingLocations
    .filter((parking) => {
      const query = search.toLowerCase();
      const matchesQuery =
        parking.name?.toLowerCase().includes(query) ||
        parking.location?.toLowerCase().includes(query) ||
        parking.address?.toLowerCase().includes(query);

      if (!matchesQuery) return false;

      if (selectedFilter === "EV") {
        return (
          parking.has_ev ||
          parking.ev_charging ||
          parking.name?.toLowerCase().includes("ev")
        );
      }
      if (selectedFilter === "FREE") {
        return (parking.hourly_rate ?? -1) === 0;
      }
      if (selectedFilter === "SECURITY") {
        return parking.has_security_guard;
      }
      if (selectedFilter === "CCTV") {
        return parking.has_cctv;
      }
      if (selectedFilter === "COVERED") {
        return parking.has_covered_roof;
      }
      return true;
    })
    .sort((a, b) => {
      if (selectedFilter === "NEARBY" && userCoords) {
        return getNumericDistance(a) - getNumericDistance(b);
      }
      return 0;
    });

  const getAvailableSlots = (parking) => {
    if (parking.available_slots !== undefined) return parking.available_slots;
    if (parking.available !== undefined) return parking.available;
    if (parking.total_slots !== undefined) return parking.total_slots;
    return 12;
  };

  const getTotalSlots = (parking) => {
    return parking.total_slots || parking.totalSlots || parking.slots || 20;
  };

  const getOccupancyRate = (parking) => {
    const total = Number(getTotalSlots(parking)) || 1;
    const avail = Number(getAvailableSlots(parking)) || 0;
    const occupied = Math.max(0, total - avail);
    return Math.min(100, Math.round((occupied / total) * 100));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-xs sm:text-sm font-semibold ${
              toast.type === "error"
                ? "bg-rose-50/95 text-rose-800 border-rose-200"
                : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* GOOGLE MAPS PREVIEW MODAL */}
      {mapModalParking && (
        <Modal
          isOpen={Boolean(mapModalParking)}
          onClose={() => setMapModalParking(null)}
          title={`Google Maps &bull; ${mapModalParking.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?q=${mapModalParking.latitude || 19.0760},${mapModalParking.longitude || 72.8777}&hl=en&z=15&output=embed`}
                className="w-full h-full"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{mapModalParking.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{mapModalParking.address || mapModalParking.location || "City Location"}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1 font-mono">
                  <span>GPS: {mapModalParking.latitude || "19.0760"}, {mapModalParking.longitude || "72.8777"}</span>
                  {userCoords && (
                    <span className="text-indigo-600 font-bold">
                      &bull; {calculateDistance(userCoords.lat, userCoords.lng, mapModalParking.latitude, mapModalParking.longitude)} from you
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  icon={FiNavigation}
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${mapModalParking.latitude || 19.0760},${mapModalParking.longitude || 72.8777}`,
                      "_blank"
                    )
                  }
                >
                  Open in Google Maps
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* COMPACT TOP HEADER & VIEW SWITCHER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find & Reserve Parking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verified locations with real-time slot availability and digital QR gate passes.
            </p>
          </div>

          {/* VIEW SWITCHER & ACTIVE PASS */}
          <div className="flex items-center gap-3">
            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "GRID"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiLayers className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("MAP")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "MAP"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiMapPin className="w-3.5 h-3.5" />
                <span>Live Map</span>
              </button>
            </div>

            {latestActiveBooking ? (
              <button
                onClick={() =>
                  navigate(`/customer/qr?booking=${latestActiveBooking.id}`, {
                    state: { booking: latestActiveBooking },
                  })
                }
                className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 transition text-left shadow-xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <FiCheckCircle />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-emerald-900">
                      Active Pass &bull; Slot {latestActiveBooking.slot_number || "A1"}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium group-hover:underline">
                    Tap to open Digital QR Pass &rarr;
                  </span>
                </div>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
                  {parkingLocations.length} Facilities Live
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS BAR WITH GOOGLE MAPS GPS */}
        <div className="apple-spotlight rounded-3xl p-3.5 sm:p-4 space-y-3.5">
          {/* SEARCH INPUT & GPS BUTTON */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                <FiSearch className="text-indigo-600 w-4 h-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search parking by name, landmark, area, or address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* MY CURRENT LOCATION BUTTON */}
            <Button
              variant={userCoords ? "primary" : "outline"}
              size="md"
              icon={FiCompass}
              loading={isLocating}
              onClick={handleLocateNearest}
              className="whitespace-nowrap shrink-0"
            >
              {isLocating
                ? "Locating You..."
                : userCoords
                ? "🎯 My Location (Active)"
                : "🎯 Use My Current Location"}
            </Button>
          </div>

          {/* ACTIVE GPS LOCATION STATUS BANNER */}
          {userCoords && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span className="font-bold text-indigo-900">
                  📍 Using Your Current GPS Position:
                </span>
                <span className="font-mono text-indigo-700 font-semibold">
                  {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                </span>
                <span className="hidden sm:inline text-indigo-600 font-medium">
                  &bull; Closest parking lots sorted first
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserCoords(null);
                  setSelectedFilter("ALL");
                  showToast("GPS location reset.", "success");
                }}
                className="text-indigo-700 hover:text-indigo-900 font-bold hover:underline"
              >
                Reset Location
              </button>
            </div>
          )}

          {/* FILTER PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: "ALL", label: "All Facilities" },
              { id: "NEARBY", label: "🎯 Nearest to Me" },
              { id: "FREE", label: "🆓 Free Parking" },
              { id: "EV", label: "⚡ EV Charging" },
              { id: "SECURITY", label: "🛡️ Security Guard" },
              { id: "CCTV", label: "📹 24/7 CCTV" },
              { id: "COVERED", label: "🏢 Covered" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "NEARBY" && !userCoords) {
                    handleLocateNearest();
                  } else {
                    setSelectedFilter(tab.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* INTERACTIVE MAP VIEW MODE */}
        {viewMode === "MAP" && (
          <section className="animate-in fade-in zoom-in-95 duration-200">
            <ParkingMapView
              parkingLocations={filteredParking}
              userCoords={userCoords}
              onLocateUser={handleLocateNearest}
              isLocating={isLocating}
              onBookParking={(p) =>
                navigate(`/customer/parking/${p.id}/book`, { state: { parking: p } })
              }
              onViewDetails={(p) => navigate(`/customer/parking/${p.id}`)}
            />
          </section>
        )}

        {/* FACILITIES GRID VIEW MODE */}
        {viewMode === "GRID" && (
        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredParking.length === 0 ? (
            <EmptyState
              icon={FiMapPin}
              title="No parking locations found"
              description="Try adjusting your search query or clear filters to view available locations."
              actionLabel="Clear Search"
              onAction={() => {
                setSearch("");
                setSelectedFilter("ALL");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParking.map((parking, index) => {
                const totalSlots = getTotalSlots(parking);
                const availableSlots = getAvailableSlots(parking);
                const occupancyRate = getOccupancyRate(parking);
                const isAlmostFull = occupancyRate > 80;
                const distanceStr = userCoords
                  ? calculateDistance(
                      userCoords.lat,
                      userCoords.lng,
                      parking.latitude,
                      parking.longitude
                    )
                  : null;

                return (
                  <div
                    key={parking.id}
                    className="apple-card overflow-hidden flex flex-col justify-between group"
                  >
                    {/* CARD HEADER / COVER */}
                    <div className="relative h-48 bg-slate-900 overflow-hidden">
                      {parking.image_url || parking.image ? (
                        <img
                          src={parking.image_url || parking.image}
                          alt={parking.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-4 text-center">
                          <FiMapPin className="w-8 h-8 text-indigo-400 mb-1" />
                          <span className="text-xs font-bold text-slate-300">
                            Verified Smart Facility
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <Badge
                            variant={isAlmostFull ? "warning" : "available"}
                            size="sm"
                            dot
                          >
                            {availableSlots} Spots
                          </Badge>
                          {distanceStr && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-xs">
                              📍 {distanceStr}
                            </span>
                          )}
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black border backdrop-blur-md pointer-events-auto shadow-sm ${
                          (parking.hourly_rate ?? -1) === 0
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-slate-900/85 text-white border-white/20"
                        }`}>
                          {(parking.hourly_rate ?? -1) === 0 ? "FREE" : `₹${parking.hourly_rate ?? 50}/hr`}
                        </span>
                      </div>
                    </div>

                    {/* CARD CONTENT */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {parking.name || "ParkEase Central"}
                        </h3>

                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1 line-clamp-2">
                          <FiMapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>
                            {parking.address ||
                              parking.location ||
                              "Central Business District"}
                          </span>
                        </p>

                        {/* AMENITY & SECURITY TAGS */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          {parking.has_cctv && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                              📹 CCTV
                            </span>
                          )}
                          {parking.has_security_guard && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                              🛡️ Guard
                            </span>
                          )}
                          {parking.has_ev && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                              ⚡ EV Ready
                            </span>
                          )}
                          {parking.has_covered_roof && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                              🏢 Covered
                            </span>
                          )}
                          {parking.is_24_7 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                              ⏰ 24/7
                            </span>
                          )}
                          {parking.has_valet && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                              🔑 Valet
                            </span>
                          )}
                        </div>

                        {/* OCCUPANCY PROGRESS */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>Occupancy</span>
                            <span className="font-extrabold text-slate-800">{occupancyRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isAlmostFull ? "bg-amber-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>{availableSlots} spots free</span>
                            <span>{totalSlots} total capacity</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD ACTION BUTTONS */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMapModalParking(parking)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-bold border border-slate-200 transition"
                          >
                            <FiMapPin className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Preview Map</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${parking.latitude || 19.0760},${parking.longitude || 72.8777}`,
                                "_blank"
                              )
                            }
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 text-xs font-bold border border-slate-200 transition"
                          >
                            <FiNavigation className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Directions</span>
                          </button>
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          iconRight={FiArrowRight}
                          onClick={() =>
                            navigate(`/customer/parking/${parking.id}/book`, {
                              state: { parking },
                            })
                          }
                        >
                          Book Slot Now &rarr;
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  );
}