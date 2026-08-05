import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ParkingDetails from "./pages/ParkingDetails";
import MyBookings from "./pages/MyBookings";
import QRCode from "./pages/QRCode";
import OwnerDashboard from "./pages/OwnerDashboard";
import AddParking from "./pages/AddParking";

function App() {

  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parking/:id"
          element={
            <ProtectedRoute>
              <ParkingDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <QRCode />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute ownerOnly={true}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-parking"
          element={
            <ProtectedRoute ownerOnly={true}>
              <AddParking />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;