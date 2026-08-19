import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiArrowRight,
  FiLogOut,
  FiUser,
  FiNavigation,
  FiMap,
  FiCheckCircle,
  FiChevronRight,
  FiMenu,
  FiX,
  FiTruck,
} from "react-icons/fi";
import API from "../../api/axios";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error(e);
        }
      }

      const [parkingResponse, bookingResponse] = await Promise.allSettled([
        API.get("/parking/approved"),
        API.get("/booking/my-bookings"),
      ]);

      if (parkingResponse.status === "fulfilled") {
        const data = parkingResponse.value.data;
        if (Array.isArray(data)) {
          setParkingLocations(data);
        } else if (Array.isArray(data?.locations)) {
          setParkingLocations(data.locations);
        } else if (Array.isArray(data?.parking_locations)) {
          setParkingLocations(data.parking_locations);
        }
      }

      if (bookingResponse.status === "fulfilled") {
        const data = bookingResponse.value.data;
        if (Array.isArray(data)) {
          setBookings(data);
        } else if (Array.isArray(data?.bookings)) {
          setBookings(data.bookings);
        }
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getUserName = () => {
    if (!user) return "Customer";
    return user.name || user.full_name || user.username || user.email?.split("@")[0] || "Customer";
  };

  const filteredParking = parkingLocations.filter((parking) => {
    const searchText = search.toLowerCase();
    return (
      parking.name?.toLowerCase().includes(searchText) ||
      parking.location?.toLowerCase().includes(searchText) ||
      parking.address?.toLowerCase().includes(searchText)
    );
  });

  const activeBookings = bookings.filter((booking) => {
    const status = booking.status?.toLowerCase();
    return (
      status === "active" ||
      status === "booked" ||
      status === "confirmed" ||
      status === "upcoming"
    );
  });

  const completedBookings = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "completed"
  );

  const upcomingBooking = activeBookings[0];

  const getAvailableSlots = (parking) => {
    if (parking.available_slots !== undefined) return parking.available_slots;
    if (parking.available !== undefined) return parking.available;
    if (parking.total_slots !== undefined) return parking.total_slots;
    return "--";
  };

  const getTotalSlots = (parking) => {
    return parking.total_slots || parking.totalSlots || parking.slots || "--";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-500 selection:text-white pb-16 font-sans">
      
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-18 sm:h-20 flex items-center justify-between gap-4">
            
            {/* BRAND */}
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/customer/dashboard")}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20">
                <FiMapPin />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                  Park<span className="text-blue-600">Ease</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">Smart Parking System</span>
              </div>
            </div>

            {/* NAV LINKS */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                onClick={() => navigate("/customer/dashboard")}
              >
                Dashboard
              </button>
              <button
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                onClick={() => navigate("/customer/my-bookings")}
              >
                My Bookings
              </button>
              <button
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
                onClick={() => navigate("/customer/my-vehicles")}
              >
                <FiTruck className="w-3.5 h-3.5" />
                My Vehicles
              </button>
            </nav>

            {/* PROFILE & LOGOUT */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition text-xs font-medium"
                onClick={() => navigate("/profile")}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {getUserName().charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-bold text-slate-900 leading-tight">{getUserName()}</span>
                  <span className="text-[10px] text-slate-500">Customer</span>
                </div>
              </button>

              <button
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition"
                onClick={handleLogout}
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* HERO BANNER (Clean Light Style) */}
        <section className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-1">
              Welcome back 👋
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find & Reserve Your <span className="text-blue-600">Parking Spot</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
              Discover verified parking facilities, book slots in advance, and check in smoothly with instant digital passes.
            </p>
          </div>

          <button
            onClick={() => {
              document.getElementById("parking-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition shrink-0"
          >
            <FiMapPin />
            <span>Find Parking</span>
            <FiArrowRight />
          </button>
        </section>

        {/* SEARCH BAR */}
        <section className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <FiSearch className="text-blue-600 w-5 h-5 shrink-0" />
            <input
              type="text"
              placeholder="Search parking facilities by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <FiX />
              </button>
            )}
          </div>
        </section>

        {/* STATS GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/customer/my-bookings")}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3">
              <FiCalendar />
            </div>
            <span className="text-xs text-slate-500 font-medium block">Total Bookings</span>
            <strong className="text-2xl font-extrabold text-slate-900 mt-1 block">{bookings.length}</strong>
          </div>

          <div
            onClick={() => navigate("/customer/my-bookings")}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-3">
              <FiCheckCircle />
            </div>
            <span className="text-xs text-slate-500 font-medium block">Active Passes</span>
            <strong className="text-2xl font-extrabold text-emerald-600 mt-1 block">{activeBookings.length}</strong>
          </div>

          <div
            onClick={() => navigate("/customer/my-bookings")}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg mb-3">
              <FiClock />
            </div>
            <span className="text-xs text-slate-500 font-medium block">Completed</span>
            <strong className="text-2xl font-extrabold text-indigo-600 mt-1 block">{completedBookings.length}</strong>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg mb-3">
              <FiMapPin />
            </div>
            <span className="text-xs text-slate-500 font-medium block">Available Locations</span>
            <strong className="text-2xl font-extrabold text-slate-900 mt-1 block">{parkingLocations.length}</strong>
          </div>
        </section>

        {/* ACTIVE UPCOMING PASS BANNER */}
        {upcomingBooking && (
          <section className="rounded-3xl bg-blue-50/70 border border-blue-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20 shrink-0">
                <FiMapPin />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  Upcoming Active Pass
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {upcomingBooking.parking_name || upcomingBooking.location_name || `Parking #${upcomingBooking.parking_id}`}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {upcomingBooking.date || upcomingBooking.booking_date || "Today"} • {upcomingBooking.time || upcomingBooking.start_time || "Scheduled"}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/customer/qr?booking=${upcomingBooking.id}`, { state: { booking: upcomingBooking } })}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <span>View QR Pass</span>
              <FiChevronRight />
            </button>
          </section>
        )}

        {/* PARKING LISTING */}
        <section id="parking-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Available Parking Spaces</h2>
              <p className="text-xs text-slate-500">Select a location to check live slot availability and reserve</p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 mx-auto rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading verified parking locations...</p>
            </div>
          ) : filteredParking.length === 0 ? (
            <div className="py-16 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
              <FiMap className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No parking locations found</h3>
              <p className="text-xs text-slate-500 mt-1">Try another search keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParking.map((parking, index) => (
                <div
                  key={parking.id || index}
                  onClick={() => navigate(`/customer/parking/${parking.id || parking.location_id}/book`, { state: { parking } })}
                  className="rounded-3xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xl p-6 flex flex-col justify-between transition duration-200 group cursor-pointer shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                        <FiMapPin />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {getAvailableSlots(parking)} Slots Free
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {parking.name || "Parking Location"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {parking.address || "Location available"}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Capacity</span>
                      <span className="text-sm font-bold text-slate-800">{getTotalSlots(parking)} Total Slots</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customer/parking/${parking.id || parking.location_id}/book`, { state: { parking } });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-blue-500/20"
                    >
                      <span>Book</span>
                      <FiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} ParkEase Smart Parking Management.</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>System Operational</span>
        </div>
      </footer>

    </div>
  );
}