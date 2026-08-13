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
  FiRefreshCw,
} from "react-icons/fi";

import API from "../../api/axios";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const [parkingResponse, bookingResponse] = await Promise.all([
        API.get("/parking/approved"),
        API.get("/booking/my-bookings"),
      ]);

      if (Array.isArray(parkingResponse.data)) {
        setParkingLocations(parkingResponse.data);
      } else {
        setParkingLocations([]);
      }

      if (Array.isArray(bookingResponse.data)) {
        setBookings(bookingResponse.data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =====================================================
  // USER NAME
  // =====================================================

  const getUserName = () => {
    if (!user) return "Customer";

    return (
      user.name ||
      user.full_name ||
      user.username ||
      user.email?.split("@")[0] ||
      "Customer"
    );
  };

  // =====================================================
  // SEARCH PARKING
  // =====================================================

  const filteredParking = parkingLocations.filter((parking) => {
    const searchText = search.toLowerCase();

    return (
      parking.name?.toLowerCase().includes(searchText) ||
      parking.address?.toLowerCase().includes(searchText)
    );
  });

  // =====================================================
  // BOOKING STATS
  // =====================================================

  const activeBookings = bookings.filter((booking) => {
    const status = booking.status?.toLowerCase();

    return (
      status === "booked" ||
      status === "active" ||
      status === "confirmed" ||
      status === "upcoming"
    );
  });

  const completedBookings = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "completed"
  );

  const upcomingBooking = activeBookings[0];

  // =====================================================
  // HELPERS
  // =====================================================

  const getAvailableSlots = (parking) => {
    if (parking.available_slots !== undefined) {
      return parking.available_slots;
    }

    if (parking.available !== undefined) {
      return parking.available;
    }

    return parking.total_slots || 0;
  };

  const getTotalSlots = (parking) => {
    return parking.total_slots || 0;
  };

  const getParkingName = (parking) => {
    return parking.name || "Parking Location";
  };

  const getParkingAddress = (parking) => {
    return parking.address || "Location available";
  };

  // =====================================================
  // FIND PARKING
  // =====================================================

  const handleFindParking = () => {
    navigate("/customer/parking");
  };

  // =====================================================
  // OPEN PARKING DETAILS
  // =====================================================

  const openParking = (parking) => {
    navigate(`/customer/parking/${parking.id}`);
  };

  // =====================================================
  // NEARBY PARKING
  // =====================================================

  const handleNearbyParking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      navigate("/customer/parking");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Current location:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        navigate("/customer/parking");
      },
      () => {
        alert("Unable to access your location.");
        navigate("/customer/parking");
      }
    );
  };

  return (
    <div className="customer-dashboard">

      {/* ================= NAVBAR ================= */}

      <header className="customer-navbar">

        <div
          className="brand"
          onClick={() => navigate("/customer/dashboard")}
        >
          <div className="brand-icon">
            <FiMapPin />
          </div>

          <div>
            <h2>ParkEase</h2>
            <span>Smart Parking</span>
          </div>
        </div>

        <nav
          className={`navbar-links ${
            mobileMenu ? "show" : ""
          }`}
        >

          <button
            className="nav-link active"
            onClick={() => {
              navigate("/customer/dashboard");
              setMobileMenu(false);
            }}
          >
            Dashboard
          </button>

          <button
            className="nav-link"
            onClick={() => {
              navigate("/customer/my-bookings");
              setMobileMenu(false);
            }}
          >
            My Bookings
          </button>

          <button
            className="nav-link"
            onClick={() => {
              handleFindParking();
              setMobileMenu(false);
            }}
          >
            Find Parking
          </button>

          <button
            className="nav-link"
            onClick={() => {
              navigate("/customer/my-vehicles");
              setMobileMenu(false);
            }}
          >
            <FiTruck />
            My Vehicles
          </button>

        </nav>

        <div className="navbar-right">

          <button
            className="profile-button"
            onClick={() => navigate("/customer/profile")}
          >
            <div className="profile-avatar">
              {getUserName().charAt(0).toUpperCase()}
            </div>

            <div className="profile-info">
              <strong>{getUserName()}</strong>
              <span>Customer</span>
            </div>
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut />
          </button>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <FiX /> : <FiMenu />}
          </button>

        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main className="dashboard-main">

        {/* ================= HERO ================= */}

        <section className="welcome-section">

          <div>

            <p className="welcome-label">
              Welcome back 👋
            </p>

            <h1>
              Find your perfect
              <span> parking spot.</span>
            </h1>

            <p className="welcome-description">
              Discover nearby parking spaces, book instantly,
              and park without the hassle.
            </p>

          </div>

          <button
            className="find-parking-button"
            onClick={handleFindParking}
          >
            <FiMapPin />
            Find Parking
            <FiArrowRight />
          </button>

        </section>

        {/* ================= SEARCH ================= */}

        <section className="search-section">

          <div className="search-box">

            <FiSearch className="search-icon" />

            <input
              type="text"
              placeholder="Search parking by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                <FiX />
              </button>
            )}

          </div>

          <button
            className="location-button"
            onClick={handleNearbyParking}
          >
            <FiNavigation />
            Nearby
          </button>

        </section>

        {/* ================= STATS ================= */}

        <section className="stats-grid">

          <div
            className="stat-card"
            onClick={() => navigate("/customer/my-bookings")}
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon blue">
              <FiCalendar />
            </div>

            <div>
              <span>Total Bookings</span>
              <strong>{bookings.length}</strong>
            </div>

          </div>

          <div
            className="stat-card"
            onClick={() => navigate("/customer/my-bookings")}
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon green">
              <FiCheckCircle />
            </div>

            <div>
              <span>Active Bookings</span>
              <strong>{activeBookings.length}</strong>
            </div>

          </div>

          <div
            className="stat-card"
            onClick={() => navigate("/customer/my-bookings")}
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon purple">
              <FiClock />
            </div>

            <div>
              <span>Completed</span>
              <strong>{completedBookings.length}</strong>
            </div>

          </div>

          <div
            className="stat-card"
            onClick={handleFindParking}
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon orange">
              <FiMapPin />
            </div>

            <div>
              <span>Parking Locations</span>
              <strong>{parkingLocations.length}</strong>
            </div>

          </div>

        </section>

        {/* ================= ACTIVE BOOKING ================= */}

        {upcomingBooking && (

          <section className="active-booking-section">

            <div className="section-heading">

              <div>

                <span className="section-label">
                  YOUR BOOKING
                </span>

                <h2>
                  Current Parking
                </h2>

              </div>

              <button
                onClick={() =>
                  navigate("/customer/my-bookings")
                }
              >
                View all
                <FiArrowRight />
              </button>

            </div>

            <div className="booking-card">

              <div className="booking-left">

                <div className="booking-location-icon">
                  <FiMapPin />
                </div>

                <div>

                  <h3>
                    {upcomingBooking.parking_name ||
                      `Parking #${upcomingBooking.parking_id}`}
                  </h3>

                  <p>
                    <FiMapPin />
                    Booking ID #{upcomingBooking.id}
                  </p>

                </div>

              </div>

              <div className="booking-details">

                <div>
                  <span>Date</span>

                  <strong>
                    {upcomingBooking.booking_date || "--"}
                  </strong>
                </div>

                <div>
                  <span>Time</span>

                  <strong>
                    {upcomingBooking.start_time || "--"}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <strong className="status-active">
                    {upcomingBooking.status || "Booked"}
                  </strong>
                </div>

              </div>

              <button
                className="booking-view-button"
                onClick={() =>
                  navigate("/customer/my-bookings")
                }
              >
                <FiChevronRight />
              </button>

            </div>

          </section>

        )}

        {/* ================= PARKING LOCATIONS ================= */}

        <section className="parking-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                PARKING SPACES
              </span>

              <h2>
                {search
                  ? "Search results"
                  : "Available near you"}
              </h2>

            </div>

            <button
              onClick={handleFindParking}
              className="view-all-button"
            >
              View all
              <FiArrowRight />
            </button>

          </div>

          {loading ? (

            <div className="loading-state">

              <div className="loading-spinner"></div>

              <p>
                Finding parking spaces...
              </p>

            </div>

          ) : filteredParking.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                <FiMap />
              </div>

              <h3>
                No parking locations found
              </h3>

              <p>
                Try another search or explore all
                available parking spaces.
              </p>

              <button
                onClick={handleFindParking}
              >
                Explore Parking
                <FiArrowRight />
              </button>

            </div>

          ) : (

            <div className="parking-grid">

              {filteredParking
                .slice(0, 6)
                .map((parking) => (

                  <div
                    className="parking-card"
                    key={parking.id}
                    onClick={() => openParking(parking)}
                  >

                    <div className="parking-card-top">

                      <div className="parking-image">
                        <FiMapPin />
                      </div>

                      <div className="availability-badge">
                        <span></span>
                        Available
                      </div>

                    </div>

                    <div className="parking-card-body">

                      <h3>
                        {getParkingName(parking)}
                      </h3>

                      <p className="parking-address">
                        <FiMapPin />
                        {getParkingAddress(parking)}
                      </p>

                      <div className="parking-card-footer">

                        <div className="slot-info">

                          <strong>
                            {getAvailableSlots(parking)}
                          </strong>

                          <span>
                            / {getTotalSlots(parking)} slots
                          </span>

                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openParking(parking);
                          }}
                        >
                          Book
                          <FiArrowRight />
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </section>

        {/* ================= QUICK ACTIONS ================= */}

        <section className="quick-actions-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                QUICK ACTIONS
              </span>

              <h2>
                What would you like to do?
              </h2>

            </div>

            <button
              onClick={loadDashboard}
              className="view-all-button"
              title="Refresh Dashboard"
            >
              <FiRefreshCw />
              Refresh
            </button>

          </div>

          <div className="quick-actions-grid">

            {/* FIND PARKING */}

            <button
              className="quick-action"
              onClick={handleFindParking}
            >

              <div className="quick-action-icon">
                <FiMapPin />
              </div>

              <div>
                <strong>
                  Find Parking
                </strong>

                <span>
                  Explore nearby parking
                </span>
              </div>

              <FiChevronRight />

            </button>

            {/* MY BOOKINGS */}

            <button
              className="quick-action"
              onClick={() =>
                navigate("/customer/my-bookings")
              }
            >

              <div className="quick-action-icon">
                <FiCalendar />
              </div>

              <div>
                <strong>
                  My Bookings
                </strong>

                <span>
                  Manage your reservations
                </span>
              </div>

              <FiChevronRight />

            </button>

            {/* MY VEHICLES */}

            <button
              className="quick-action"
              onClick={() =>
                navigate("/customer/my-vehicles")
              }
            >

              <div className="quick-action-icon">
                <FiTruck />
              </div>

              <div>
                <strong>
                  My Vehicles
                </strong>

                <span>
                  Add and manage your vehicles
                </span>
              </div>

              <FiChevronRight />

            </button>

            {/* PARKING QR */}

            <button
              className="quick-action"
              onClick={() =>
                navigate("/customer/qr")
              }
            >

              <div className="quick-action-icon">
                <FiCheckCircle />
              </div>

              <div>
                <strong>
                  Parking QR
                </strong>

                <span>
                  Access your booking QR
                </span>
              </div>

              <FiChevronRight />

            </button>

            {/* MY PROFILE */}

            <button
              className="quick-action"
              onClick={() =>
                navigate("/customer/profile")
              }
            >

              <div className="quick-action-icon">
                <FiUser />
              </div>

              <div>
                <strong>
                  My Profile
                </strong>

                <span>
                  Manage your account
                </span>
              </div>

              <FiChevronRight />

            </button>

          </div>

        </section>

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="customer-footer">

        <div className="footer-brand">

          <div className="brand-icon">
            <FiMapPin />
          </div>

          <div>

            <strong>
              ParkEase
            </strong>

            <span>
              Smart Parking Management
            </span>

          </div>

        </div>

        <p>
          © {new Date().getFullYear()} ParkEase.
          All rights reserved.
        </p>

        <button
          onClick={handleLogout}
          className="footer-logout"
        >
          <FiLogOut />
          Logout
        </button>

      </footer>

    </div>
  );
};

export default CustomerDashboard;