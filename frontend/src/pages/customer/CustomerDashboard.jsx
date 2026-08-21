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
import { Card, StatCard } from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // ALL, EV, NEARBY, HIGH_RATED
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

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

  // Filtering
  const filteredParking = parkingLocations.filter((parking) => {
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
      return parking.hourly_rate === 0;
    }
    return true;
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HERO SECTION */}
        <section className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                <FiZap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Smart Instant Reservation Available</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Welcome back, <span className="text-indigo-400">{getUserName()}</span> 👋
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Explore real-time slot availability, reserve in seconds, and scan your digital QR pass for seamless hands-free entry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="white"
                size="lg"
                icon={FiSearch}
                onClick={() => {
                  document.getElementById("facilities-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Browse Lots
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10"
                icon={FiCalendar}
                onClick={() => navigate("/customer/my-bookings")}
              >
                My Passes
              </Button>
            </div>
          </div>
        </section>

        {/* ACTIVE PASS BANNER IF USER HAS ACTIVE BOOKING */}
        {latestActiveBooking && (
          <section className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-300/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20 shrink-0">
                <FiCheckCircle />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm" dot>
                    Active Parking Pass
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    Booking #{latestActiveBooking.id}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  {latestActiveBooking.parking_name || "Reserved Facility"}
                </h4>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <FiClock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Slot {latestActiveBooking.slot_number || "A-1"} &bull; Valid today
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="success"
                size="md"
                className="w-full sm:w-auto"
                onClick={() =>
                  navigate(`/customer/qr?booking=${latestActiveBooking.id}`, {
                    state: { booking: latestActiveBooking },
                  })
                }
              >
                View Digital QR Pass
              </Button>
            </div>
          </section>
        )}

        {/* METRICS / STATS GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Active Passes"
            value={activeBookings.length}
            subtitle="Ready to scan"
            icon={FiCalendar}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
            onClick={() => navigate("/customer/my-bookings")}
          />
          <StatCard
            title="Registered Vehicles"
            value={vehicles.length || 1}
            subtitle="In your garage"
            icon={FiTruck}
            iconColor="text-blue-600 bg-blue-50 border-blue-100"
            onClick={() => navigate("/customer/my-vehicles")}
          />
          <StatCard
            title="Available Lots"
            value={parkingLocations.length}
            subtitle="Verified facilities"
            icon={FiMapPin}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
          />
          <StatCard
            title="Platform Status"
            value="100%"
            subtitle="Live synchronized"
            icon={FiShield}
            iconColor="text-purple-600 bg-purple-50 border-purple-100"
          />
        </section>

        {/* SEARCH & FILTERS */}
        <section
          id="facilities-grid"
          className="space-y-4 pt-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Verified Parking Facilities
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time capacity, instant rates, and guaranteed slot booking.
              </p>
            </div>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Facilities" },
                { id: "EV", label: "⚡ EV Charging" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFilter === tab.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
              <FiSearch className="text-indigo-600 w-5 h-5 shrink-0" />
              <input
                type="text"
                placeholder="Search by facility name, landmark, area, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FACILITIES GRID */}
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
              {filteredParking.map((parking) => {
                const totalSlots = getTotalSlots(parking);
                const availableSlots = getAvailableSlots(parking);
                const occupancyRate = getOccupancyRate(parking);
                const isAlmostFull = occupancyRate > 80;

                return (
                  <Card
                    key={parking.id}
                    hover
                    className="flex flex-col justify-between overflow-hidden group"
                    padding="p-0"
                  >
                    {/* CARD HEADER / COVER */}
                    <div className="relative h-44 bg-gradient-to-tr from-slate-800 to-indigo-950 overflow-hidden">
                      {parking.image_url || parking.image ? (
                        <img
                          src={parking.image_url || parking.image}
                          alt={parking.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/60 p-4 text-center">
                          <FiMapPin className="w-8 h-8 text-indigo-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-300">
                            Verified Smart Lot
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <Badge
                          variant={isAlmostFull ? "warning" : "available"}
                          size="sm"
                          dot
                        >
                          {availableSlots} Spots Available
                        </Badge>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border backdrop-blur-md ${
                          (parking.hourly_rate ?? -1) === 0
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-black/60 text-white border-white/20"
                        }`}>
                          {(parking.hourly_rate ?? -1) === 0 ? "🆓 FREE" : `₹${parking.hourly_rate ?? 50}/hr`}
                        </span>
                      </div>
                    </div>

                    {/* CARD CONTENT */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {parking.name || "ParkEase Central"}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1 line-clamp-2">
                          <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {parking.address ||
                              parking.location ||
                              "Central Business District"}
                          </span>
                        </p>

                        {/* OCCUPANCY PROGRESS */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span>Live Occupancy</span>
                            <span className="font-bold">{occupancyRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isAlmostFull ? "bg-amber-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{availableSlots} spots free</span>
                            <span>{totalSlots} total capacity</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD ACTION BUTTONS */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/customer/parking/${parking.id}`)
                          }
                        >
                          Facility Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          iconRight={FiArrowRight}
                          onClick={() =>
                            navigate(`/customer/parking/${parking.id}/book`, {
                              state: { parking },
                            })
                          }
                        >
                          Book Slot
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}