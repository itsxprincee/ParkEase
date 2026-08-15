import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =====================================================
// AUTH PAGES
// =====================================================

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

// =====================================================
// COMPONENTS
// =====================================================

import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// CUSTOMER PAGES
// =====================================================

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MyBookings from "./pages/customer/MyBookings";
import MyVehicles from "./pages/customer/MyVehicles";
import ParkingDetails from "./pages/customer/ParkingDetails";
import QRCode from "./pages/customer/QRCode";
import Profile from "./pages/customer/Profile";

// =====================================================
// OWNER PAGES
// =====================================================

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AddParking from "./pages/owner/AddParking";
import EditParking from "./pages/owner/EditParking";
import OwnerParkingDetails from "./pages/owner/OwnerParkingDetails";
import ScanQR from "./pages/owner/ScanQR";

// =====================================================
// ADMIN PAGE
// =====================================================

import AdminDashboard from "./pages/admin/AdminDashboard";

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            DEFAULT ROUTE
        ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =====================================================
            AUTH ROUTES
        ===================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* =====================================================
            CUSTOMER ROUTES
        ===================================================== */}

        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/my-vehicles"
          element={
            <ProtectedRoute>
              <MyVehicles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/parking/:id"
          element={
            <ProtectedRoute>
              <ParkingDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/qr"
          element={
            <ProtectedRoute>
              <QRCode />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            CUSTOMER PROFILE
        ===================================================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            OWNER ROUTES
        ===================================================== */}

        <Route
          path="/owner"
          element={
            <ProtectedRoute ownerOnly>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/add-parking"
          element={
            <ProtectedRoute ownerOnly>
              <AddParking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/parking/:id"
          element={
            <ProtectedRoute ownerOnly>
              <OwnerParkingDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/edit-parking/:id"
          element={
            <ProtectedRoute ownerOnly>
              <EditParking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/scan-qr"
          element={
            <ProtectedRoute ownerOnly>
              <ScanQR />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            ADMIN ROUTE
        ===================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            OLD CUSTOMER ROUTES
        ===================================================== */}

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
          path="/my-bookings"
          element={
            <Navigate
              to="/customer/my-bookings"
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
          path="/parking/:id"
          element={
            <Navigate
              to="/customer/dashboard"
              replace
            />
          }
        />

        <Route
          path="/qr"
          element={
            <Navigate
              to="/customer/qr"
              replace
            />
          }
        />

        {/* =====================================================
            PAGE NOT FOUND
        ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;