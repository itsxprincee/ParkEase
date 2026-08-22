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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold ${
              toast.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle className="w-5 h-5" /> : <FiCheckCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* GOOGLE MAPS PREVIEW MODAL */}
      {mapModalParking && (
        <Modal
          isOpen={Boolean(mapModalParking)}
          onClose={() => setMapModalParking(null)}
          title={`Map Location &bull; ${mapModalParking.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
              <iframe
                title="Map Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${mapModalParking.latitude || 19.0760},${mapModalParking.longitude || 72.8777}&hl=en&z=15&output=embed`}
                className="w-full h-full"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{mapModalParking.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{mapModalParking.address || mapModalParking.location}</p>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={FiNavigation}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${mapModalParking.latitude || 19.0760},${mapModalParking.longitude || 72.8777}`,
                    "_blank"
                  )
                }
              >
                Open Google Maps Navigation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* UBER HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              Where are you parking?
            </h1>
            <p className="text-sm text-neutral-500 mt-1 font-medium">
              Find verified spots, view real-time availability, and reserve instantly.
            </p>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "GRID"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <FiLayers className="w-4 h-4" />
                <span>List</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("MAP")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "MAP"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <FiMapPin className="w-4 h-4" />
                <span>Map</span>
              </button>
            </div>

            {latestActiveBooking && (
              <button
                onClick={() =>
                  navigate(`/customer/qr?booking=${latestActiveBooking.id}`, {
                    state: { booking: latestActiveBooking },
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-black shadow-md hover:bg-neutral-800 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Active Pass (Slot {latestActiveBooking.slot_number}) &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* UBER SEARCH BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white transition">
                <FiSearch className="text-black w-5 h-5 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter location, landmark, or parking facility..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-black placeholder-neutral-400 font-bold focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-neutral-400 hover:text-black"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* UBER GPS LOCATOR */}
            <button
              type="button"
              onClick={handleLocateNearest}
              className={`px-5 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition ${
                userCoords
                  ? "bg-black text-white shadow-md"
                  : "bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200"
              }`}
            >
              <FiCompass className="w-4 h-4" />
              <span>{isLocating ? "Locating..." : userCoords ? "📍 Nearest (Active)" : "📍 Find Nearest"}</span>
            </button>
          </div>

          {/* FILTER PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {[
              { id: "ALL", label: "All Spots" },
              { id: "NEARBY", label: "📍 Nearest" },
              { id: "FREE", label: "🆓 Free" },
              { id: "EV", label: "⚡ EV Ready" },
              { id: "SECURITY", label: "🛡️ Guarded" },
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
                className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                  selectedFilter === tab.id
                    ? "bg-black text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAP VIEW */}
        {viewMode === "MAP" && (
          <section className="animate-in fade-in duration-200">
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

        {/* UBER RIDE-STYLE PARKING CARDS */}
        {viewMode === "GRID" && (
          <section>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredParking.length === 0 ? (
              <EmptyState
                icon={FiMapPin}
                title="No parking spots found"
                description="Try clearing your search query to see all available locations."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearch("");
                  setSelectedFilter("ALL");
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParking.map((parking) => {
                  const availableSlots = getAvailableSlots(parking);
                  const isFree = (parking.hourly_rate ?? -1) === 0;
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
                      className="bg-white rounded-2xl border border-neutral-200 p-5 hover:border-black transition-all shadow-sm flex flex-col justify-between group"
                    >
                      {/* CARD TOP INFO */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                              {parking.has_ev ? "⚡" : "🚗"}
                            </div>
                            <div>
                              <h3 className="text-base font-black text-black line-clamp-1">
                                {parking.name || "ParkEase Facility"}
                              </h3>
                              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                                <FiMapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span>{parking.address || parking.location || "City Zone"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {isFree ? (
                              <span className="text-lg font-black text-emerald-600">FREE</span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-black text-black">
                                  ₹{parking.hourly_rate ?? 50}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">per hr</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* STATUS & DISTANCE */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-200">
                            🟢 {availableSlots} Spots Available
                          </span>

                          {distanceStr && (
                            <span className="text-neutral-500 font-bold">
                              📍 {distanceStr} away
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="pt-4 mt-4 border-t border-neutral-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setMapModalParking(parking)}
                          className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold transition"
                        >
                          Map
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/customer/parking/${parking.id}/book`, {
                              state: { parking },
                            })
                          }
                          className="flex-1 py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-black text-center shadow-md transition active:scale-95"
                        >
                          Reserve Spot &rarr;
                        </button>
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