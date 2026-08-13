import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";

function EditParking() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    total_slots: "",
    latitude: "",
    longitude: "",
  });

  // ==========================================
  // LOAD PARKING DETAILS
  // ==========================================

  useEffect(() => {
    const loadParkingDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `/parking/owner/${id}`
        );

        const data = response.data;

        setFormData({
          name: data.name || "",
          address: data.address || "",
          total_slots: data.total_slots || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
        });
      } catch (error) {
        console.error(
          "Failed to load parking details:",
          error
        );

        setError(
          error?.response?.data?.detail ||
            "Unable to load parking details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadParkingDetails();
  }, [id]);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // SAVE PARKING
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter the parking name.");
      return;
    }

    if (!formData.address.trim()) {
      alert("Please enter the parking address.");
      return;
    }

    if (
      !formData.total_slots ||
      Number(formData.total_slots) <= 0
    ) {
      alert("Total slots must be greater than 0.");
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `/parking/owner/${id}`,
        {
          name: formData.name,
          address: formData.address,
          total_slots: Number(
            formData.total_slots
          ),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        }
      );

      alert(
        "Parking updated successfully."
      );

      navigate(
        "/owner/dashboard"
      );
    } catch (error) {
      console.error(
        "Failed to update parking:",
        error
      );

      alert(
        error?.response?.data?.detail ||
          "Unable to update parking."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-gray-600">
            Loading parking details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600">
            Unable to Load Parking
          </h2>

          <p className="text-gray-500 mt-3">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/owner/dashboard")
            }
            className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ParkEase
            </h1>

            <p className="text-sm text-gray-500">
              Edit Parking Location
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/owner/dashboard")
            }
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </button>

        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Edit Parking
          </h2>

          <p className="text-gray-500 mt-2">
            Update your parking location details and capacity.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-2xl shadow-sm overflow-hidden"
        >

          {/* BASIC INFORMATION */}

          <div className="p-6 border-b">

            <h3 className="text-lg font-bold text-gray-900">
              Basic Information
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Update the main details of your parking location.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

              {/* PARKING NAME */}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter parking name"
                  className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ADDRESS */}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter complete parking address"
                  className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* TOTAL SLOTS */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Parking Slots
                </label>

                <input
                  type="number"
                  name="total_slots"
                  value={formData.total_slots}
                  onChange={handleChange}
                  min="1"
                  placeholder="Example: 50"
                  className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

          </div>

          {/* LOCATION */}

          <div className="p-6 border-b">

            <h3 className="text-lg font-bold text-gray-900">
              Location Coordinates
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              These coordinates help customers find your parking location.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

              {/* LATITUDE */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>

                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Example: 12.9716"
                  className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* LONGITUDE */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>

                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Example: 77.5946"
                  className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

          </div>

          {/* ACTION BUTTONS */}

          <div className="p-6 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">

            <button
              type="button"
              onClick={() =>
                navigate("/owner/dashboard")
              }
              disabled={saving}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default EditParking;