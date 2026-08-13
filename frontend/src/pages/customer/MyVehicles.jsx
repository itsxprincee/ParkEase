import React, { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

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

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token")
    );
  };

  // =====================================================
  // FETCH MY VEHICLES
  // =====================================================

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login to view your vehicles.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/vehicles/my`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load vehicles."
        );
      }

      setVehicles(data);
    } catch (err) {
      setError(err.message || "Unable to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD VEHICLES
  // =====================================================

  useEffect(() => {
    fetchVehicles();
  }, []);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setVehicleType("car");
    setVehicleName("");
    setVehicleNumber("");
    setEditingVehicle(null);
    setShowForm(false);
    setError("");
  };

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleType("car");
    setVehicleName("");
    setVehicleNumber("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);

    setVehicleType(vehicle.vehicle_type);
    setVehicleName(vehicle.vehicle_name);
    setVehicleNumber(vehicle.vehicle_number);

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =====================================================
  // SAVE VEHICLE
  // =====================================================

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

    const token = getToken();

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vehicle_type: vehicleType,
        vehicle_name: name,
        vehicle_number: number,
      };

      let url = `${API_URL}/vehicles/add`;
      let method = "POST";

      if (editingVehicle) {
        url = `${API_URL}/vehicles/${editingVehicle.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to save vehicle."
        );
      }

      if (editingVehicle) {
        setSuccess("Vehicle updated successfully.");
      } else {
        setSuccess("Vehicle added successfully.");
      }

      // Stay on My Vehicles
      setShowForm(false);
      setEditingVehicle(null);

      setVehicleType("car");
      setVehicleName("");
      setVehicleNumber("");

      await fetchVehicles();
    } catch (err) {
      setError(err.message || "Unable to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE VEHICLE
  // =====================================================

  const handleDelete = async (vehicleId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/vehicles/${vehicleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to delete vehicle."
        );
      }

      setSuccess("Vehicle deleted successfully.");

      await fetchVehicles();
    } catch (err) {
      setError(err.message || "Unable to delete vehicle.");
    }
  };

  // =====================================================
  // VEHICLE ICON
  // =====================================================

  const getVehicleIcon = (type) => {
    if (type === "bike") {
      return "🏍️";
    }

    return "🚗";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-gray-600">
            Loading your vehicles...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                My Vehicles
              </h1>

              <p className="text-gray-500 mt-1">
                Save your vehicles for faster parking bookings.
              </p>
            </div>

            {!showForm && (
              <button
                onClick={handleAddVehicle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition shadow-sm"
              >
                + Add Vehicle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* =================================================
            MESSAGES
        ================================================= */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* =================================================
            ADD / EDIT FORM
        ================================================= */}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingVehicle
                    ? "Edit Vehicle"
                    : "Add New Vehicle"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enter your vehicle details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* VEHICLE TYPE */}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Vehicle Type
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setVehicleType("car")}
                    className={`p-4 rounded-xl border-2 transition ${
                      vehicleType === "car"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      🚗
                    </div>

                    <div className="font-semibold text-gray-900">
                      Car
                    </div>

                    {vehicleType === "car" && (
                      <div className="text-xs text-blue-600 mt-1">
                        Selected
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType("bike")}
                    className={`p-4 rounded-xl border-2 transition ${
                      vehicleType === "bike"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      🏍️
                    </div>

                    <div className="font-semibold text-gray-900">
                      Bike
                    </div>

                    {vehicleType === "bike" && (
                      <div className="text-xs text-blue-600 mt-1">
                        Selected
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* VEHICLE NAME */}

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Name
                </label>

                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) =>
                    setVehicleName(e.target.value)
                  }
                  placeholder={
                    vehicleType === "car"
                      ? "e.g. My Hyundai i20"
                      : "e.g. My Honda Activa"
                  }
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* VEHICLE NUMBER */}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Number
                </label>

                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) =>
                    setVehicleNumber(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="e.g. KA01AB1234"
                  maxLength={30}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl uppercase outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <p className="text-xs text-gray-500 mt-2">
                  Enter your vehicle registration number.
                </p>
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition"
                >
                  {saving
                    ? "Saving..."
                    : editingVehicle
                    ? "Update Vehicle"
                    : "Save Vehicle"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="sm:w-32 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================
            VEHICLE LIST
        ================================================= */}

        {!showForm && vehicles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="text-6xl mb-5">
              🚗
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              No vehicles added yet
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Add your car or bike once and use it for
              your future ParkEase bookings.
            </p>

            <button
              onClick={handleAddVehicle}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              + Add Your First Vehicle
            </button>
          </div>
        ) : (
          !showForm && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Saved Vehicles
                  </h2>

                  <p className="text-sm text-gray-500">
                    {vehicles.length}{" "}
                    {vehicles.length === 1
                      ? "vehicle"
                      : "vehicles"}{" "}
                    saved
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">
                          {getVehicleIcon(
                            vehicle.vehicle_type
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {vehicle.vehicle_name}
                          </h3>

                          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold capitalize">
                            {vehicle.vehicle_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">
                        Registration Number
                      </p>

                      <p className="font-bold text-gray-900 tracking-wide">
                        {vehicle.vehicle_number}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() =>
                          handleEdit(vehicle)
                        }
                        className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-semibold transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(vehicle.id)
                        }
                        className="flex-1 border border-red-200 hover:bg-red-50 text-red-600 py-2.5 rounded-xl font-semibold transition"
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