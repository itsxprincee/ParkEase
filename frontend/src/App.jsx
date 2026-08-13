import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// =====================================================
// CUSTOMER PAGES
// =====================================================

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MyBookings from "./pages/customer/MyBookings";
import MyVehicles from "./pages/customer/MyVehicles";
import ParkingDetails from "./pages/customer/ParkingDetails";
import QRCode from "./pages/customer/QRCode";

// =====================================================
// OWNER PAGES
// =====================================================

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AddParking from "./pages/owner/AddParking";
import EditParking from "./pages/owner/EditParking";

// =====================================================
// ADMIN PAGES
// =====================================================

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerification from "./pages/admin/AdminVerification";

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            DEFAULT ROUTE
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/customer/dashboard"
              replace
            />
          }
        />

        {/* =================================================
            CUSTOMER ROUTES
        ================================================= */}

        <Route
          path="/customer/dashboard"
          element={<CustomerDashboard />}
        />

        <Route
          path="/customer/my-vehicles"
          element={<MyVehicles />}
        />

        <Route
          path="/customer/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/customer/parking/:id"
          element={<ParkingDetails />}
        />

        <Route
          path="/customer/qr/:bookingId"
          element={<QRCode />}
        />

        {/* =================================================
            CUSTOMER COMPATIBILITY ROUTES
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/customer/dashboard"
              replace
            />
          }
        />

        <Route
          path="/my-vehicles"
          element={
            <Navigate
              to="/customer/my-vehicles"
              replace
            />
          }
        />

        <Route
          path="/my-bookings"
          element={
            <Navigate
              to="/customer/my-bookings"
              replace
            />
          }
        />

        <Route
          path="/parking/:id"
          element={<ParkingDetails />}
        />

        <Route
          path="/qr/:bookingId"
          element={<QRCode />}
        />

        {/* =================================================
            OWNER ROUTES
        ================================================= */}

        <Route
          path="/owner/dashboard"
          element={<OwnerDashboard />}
        />

        <Route
          path="/owner/add-parking"
          element={<AddParking />}
        />

        <Route
          path="/owner/edit-parking/:id"
          element={<EditParking />}
        />

        {/* =================================================
            OWNER COMPATIBILITY ROUTES
        ================================================= */}

        <Route
          path="/owner"
          element={
            <Navigate
              to="/owner/dashboard"
              replace
            />
          }
        />

        <Route
          path="/add-parking"
          element={
            <Navigate
              to="/owner/add-parking"
              replace
            />
          }
        />

        <Route
          path="/edit-parking/:id"
          element={<EditParking />}
        />

        {/* =================================================
            ADMIN ROUTES
        ================================================= */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/verification"
          element={<AdminVerification />}
        />

        {/* =================================================
            404 / UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/customer/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;