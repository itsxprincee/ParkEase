import React, { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// LAZY-LOADED PAGE MODULES
// =====================================================
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Customer Pages
const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
const MyBookings = lazy(() => import("./pages/customer/MyBookings"));
const MyVehicles = lazy(() => import("./pages/customer/MyVehicles"));
const Subscriptions = lazy(() => import("./pages/customer/Subscriptions"));
const ParkingDetails = lazy(() => import("./pages/customer/ParkingDetails"));
const BookParking = lazy(() => import("./pages/customer/BookParking"));
const QRCode = lazy(() => import("./pages/customer/QRCode"));
const Profile = lazy(() => import("./pages/customer/Profile"));

// Owner Pages
const OwnerDashboard = lazy(() => import("./pages/owner/OwnerDashboard"));
const AddParking = lazy(() => import("./pages/owner/AddParking"));
const EditParking = lazy(() => import("./pages/owner/EditParking"));
const OwnerParkingDetails = lazy(() => import("./pages/owner/OwnerParkingDetails"));
const ManageSlots = lazy(() => import("./pages/owner/ManageSlots"));
const ScanQR = lazy(() => import("./pages/owner/ScanQR"));
const OwnerProfile = lazy(() => import("./pages/owner/OwnerProfile"));

// Admin Page
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// =====================================================
// ULTRA-FAST BRAND SUSPENSE LOADER
// =====================================================
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex flex-col items-center justify-center p-6 transition-colors selection:bg-emerald-500 selection:text-white">
      <div className="relative flex flex-col items-center space-y-4">
        {/* Animated Brand Pulse */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping" />
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-xl shadow-2xl border border-zinc-800 dark:border-zinc-200">
            🅿️
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">
            ParkEase
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Loading mobility workspace...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// APP
// =====================================================
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* DEFAULT ROUTE */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* CUSTOMER ROUTES */}
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
            path="/customer/subscriptions"
            element={
              <ProtectedRoute>
                <Subscriptions />
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
            path="/customer/parking/:id/book"
            element={
              <ProtectedRoute>
                <BookParking />
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* OWNER ROUTES */}
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
            path="/owner/edit-parking/:id"
            element={
              <ProtectedRoute ownerOnly>
                <EditParking />
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
            path="/owner/parking/:id/slots"
            element={
              <ProtectedRoute ownerOnly>
                <ManageSlots />
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
          <Route
            path="/owner/profile"
            element={
              <ProtectedRoute ownerOnly>
                <OwnerProfile />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK REDIRECT */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}