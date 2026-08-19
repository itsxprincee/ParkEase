import React, { useEffect, useState } from "react";
import API from "../../api/axios";

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [vehicleType, setVehicleType] = useState("car");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/vehicles/my");
      setVehicles(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Unable to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const resetForm = () => {
    setVehicleType("car");
    setVehicleName("");
    setVehicleNumber("");
    setEditingVehicle(null);
    setShowForm(false);
    setError("");
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleType("car");
    setVehicleName("");
    setVehicleNumber("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleType(vehicle.vehicle_type?.toLowerCase() === "bike" ? "bike" : "car");
    setVehicleName(vehicle.vehicle_name || "");
    setVehicleNumber(vehicle.vehicle_number || "");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name = vehicleName.trim();
    const number = vehicleNumber.trim().toUpperCase();

    if (!name) {
      setError("Please enter a vehicle name.");
      return;
    }

    if (!number) {
      setError("Please enter the vehicle number.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vehicle_type: vehicleType === "bike" ? "Bike" : "Car",
        vehicle_name: name,
        vehicle_number: number,
      };

      if (editingVehicle) {
        await API.put(`/vehicles/${editingVehicle.id}`, payload);
        setSuccess("Vehicle updated successfully.");
      } else {
        await API.post("/vehicles/add", payload);
        setSuccess("Vehicle added successfully.");
      }

      setShowForm(false);
      setEditingVehicle(null);
      setVehicleType("car");
      setVehicleName("");
      setVehicleNumber("");

      await fetchVehicles();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Unable to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(`/vehicles/${vehicleId}`);
      setSuccess("Vehicle deleted successfully.");
      await fetchVehicles();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Unable to delete vehicle.");
    }
  };

  const getVehicleIcon = (type) => {
    if (String(type).toLowerCase() === "bike") {
      return "🏍️";
    }
    return "🚗";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">
            Loading your vehicles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                My Vehicles
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Save and manage your vehicles for faster parking reservations.
              </p>
            </div>

            {!showForm && (
              <button
                onClick={handleAddVehicle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm"
              >
                + Add Vehicle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* MESSAGES */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your vehicle registration details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* VEHICLE TYPE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Vehicle Type
                </label>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    type="button"
                    onClick={() => setVehicleType("car")}
                    className={`p-4 rounded-xl border-2 transition text-center ${
                      vehicleType === "car"
                        ? "border-blue-600 bg-blue-50/60"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-3xl mb-1">🚗</div>
                    <div className="font-bold text-slate-900 text-xs">Car (4-Wheeler)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType("bike")}
                    className={`p-4 rounded-xl border-2 transition text-center ${
                      vehicleType === "bike"
                        ? "border-blue-600 bg-blue-50/60"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-3xl mb-1">🏍️</div>
                    <div className="font-bold text-slate-900 text-xs">Bike (2-Wheeler)</div>
                  </button>
                </div>
              </div>

              {/* VEHICLE NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vehicle Nickname / Model *
                </label>

                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder={vehicleType === "car" ? "e.g. My Honda City" : "e.g. My Activa 6G"}
                  maxLength={100}
                  className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* VEHICLE NUMBER */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  License Registration Number *
                </label>

                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MH01AB1234"
                  maxLength={30}
                  className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 uppercase font-mono outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* BUTTONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-sm"
                >
                  {saving ? "Saving..." : editingVehicle ? "Update Vehicle" : "Save Vehicle"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VEHICLES LIST */}
        {!showForm && vehicles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">🚗</div>
            <h2 className="text-xl font-extrabold text-slate-900">
              No vehicles registered yet
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
              Add your car or motorcycle once to auto-fill license details during booking.
            </p>
            <button
              onClick={handleAddVehicle}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm"
            >
              + Register Your First Vehicle
            </button>
          </div>
        ) : (
          !showForm && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-slate-900">
                  Saved Fleet ({vehicles.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                          {getVehicleIcon(vehicle.vehicle_type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            {vehicle.vehicle_name}
                          </h3>
                          <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            {vehicle.vehicle_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                        Registration Plate
                      </p>
                      <p className="font-mono font-bold text-slate-800 text-sm tracking-wide">
                        {vehicle.vehicle_number}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="flex-1 border border-red-200 hover:bg-red-50 text-red-600 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

      </main>
    </div>
  );
}