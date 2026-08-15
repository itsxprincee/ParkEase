import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";
import { toast, Toaster } from "react-hot-toast";

import {
  FaArrowLeft,
  FaEdit,
  FaMapMarkerAlt,
  FaParking,
  FaSave,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

function EditParking() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    total_slots: "",
  });

  // ==========================================
  // PARKING STATE
  // ==========================================

  const [parking, setParking] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // ==========================================
  // LOAD PARKING DETAILS
  // ==========================================

  useEffect(() => {
    const loadParking = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `/parking/owner/${id}`
        );

        const data = response.data;

        setParking(data);

        setFormData({
          name: data.name || "",
          address: data.address || "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
          total_slots: data.total_slots ?? "",
        });
      } catch (error) {
        console.error(
          "Failed to load parking:",
          error
        );

        const message =
          error?.response?.data?.detail ||
          "Unable to load parking details.";

        toast.error(message);

        if (error?.response?.status === 404) {
          setTimeout(() => {
            navigate("/owner");
          }, 1500);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadParking();
    }
  }, [id, navigate]);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Parking name is required.");
      return false;
    }

    if (!formData.address.trim()) {
      toast.error("Parking address is required.");
      return false;
    }

    if (
      formData.latitude === "" ||
      formData.latitude === null
    ) {
      toast.error("Latitude is required.");
      return false;
    }

    if (
      formData.longitude === "" ||
      formData.longitude === null
    ) {
      toast.error("Longitude is required.");
      return false;
    }

    if (
      !formData.total_slots ||
      Number(formData.total_slots) <= 0
    ) {
      toast.error(
        "Total parking slots must be greater than 0."
      );
      return false;
    }

    return true;
  };

  // ==========================================
  // SAVE CHANGES
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      data.append(
        "name",
        formData.name.trim()
      );

      data.append(
        "address",
        formData.address.trim()
      );

      data.append(
        "latitude",
        formData.latitude
      );

      data.append(
        "longitude",
        formData.longitude
      );

      data.append(
        "total_slots",
        formData.total_slots
      );

      const response = await axios.put(
        `/parking/owner/${id}`,
        data
      );

      toast.success(
        response.data?.message ||
          "Parking updated successfully."
      );

      setTimeout(() => {
        navigate("/owner");
      }, 1200);
    } catch (error) {
      console.error(
        "Update parking error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Unable to update parking.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // STATUS CONFIGURATION
  // ==========================================

  const getStatusConfig = (status) => {
    if (status === "APPROVED") {
      return {
        label: "Approved",
        icon: <FaCheckCircle />,
        className:
          "bg-green-50 text-green-700 border-green-200",
      };
    }

    if (status === "REJECTED") {
      return {
        label: "Rejected",
        icon: <FaExclamationTriangle />,
        className:
          "bg-red-50 text-red-700 border-red-200",
      };
    }

    return {
      label: "Pending Verification",
      icon: <FaClock />,
      className:
        "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">

          <div className="w-12 h-12 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

          <h2 className="text-lg font-semibold text-slate-800 mt-5">
            Loading parking details...
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Please wait while we load your information.
          </p>

        </div>
      </div>
    );
  }

  const status = getStatusConfig(
    parking?.verification_status
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ======================================
          TOASTER
      ====================================== */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "14px",
            fontWeight: "500",
          },
        }}
      />

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => navigate("/owner")}
              disabled={saving}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium disabled:opacity-50"
            >

              <FaArrowLeft />

              Back to Dashboard

            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">

              <FaParking className="text-blue-600" />

              ParkEase Owner Portal

            </div>

          </div>

        </div>

      </header>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* PAGE HEADING */}

        <div className="mb-8">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">

                <FaEdit />

                EDIT PARKING LOCATION

              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">

                Update Parking Details

              </h1>

              <p className="text-slate-500 mt-3 max-w-2xl">

                Update your parking information.
                After saving, your parking location
                will be submitted for verification again.

              </p>

            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${status.className}`}
            >

              {status.icon}

              {status.label}

            </span>

          </div>

        </div>

        {/* ======================================
            REJECTED NOTICE
        ====================================== */}

        {parking?.verification_status ===
          "REJECTED" && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5">

            <div className="flex gap-3">

              <FaExclamationTriangle className="text-red-600 text-xl mt-0.5 shrink-0" />

              <div>

                <h3 className="font-bold text-red-800">

                  Previous Verification Was Rejected

                </h3>

                <p className="text-sm text-red-700 mt-2 leading-6">

                  {parking?.rejection_reason ||
                    "No rejection reason was provided."}

                </p>

                <p className="text-sm text-red-600 mt-3">

                  Update the required information and
                  save your changes to submit this parking
                  for verification again.

                </p>

              </div>

            </div>

          </div>
        )}

        {/* ======================================
            EDIT FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >

          {/* FORM HEADER */}

          <div className="p-6 sm:p-8 border-b border-slate-100">

            <h2 className="text-xl font-bold text-slate-900">

              Parking Information

            </h2>

            <p className="text-sm text-slate-500 mt-2">

              Make sure all details are accurate before
              submitting the changes.

            </p>

          </div>

          {/* FORM BODY */}

          <div className="p-6 sm:p-8 space-y-6">

            {/* PARKING NAME */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">

                Parking Name

              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
                placeholder="Enter parking name"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />

            </div>

            {/* ADDRESS */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">

                Parking Address

              </label>

              <div className="relative">

                <FaMapMarkerAlt className="absolute left-4 top-4 text-slate-400" />

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={saving}
                  rows="4"
                  placeholder="Enter complete parking address"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 outline-none transition resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

              </div>

            </div>

            {/* LOCATION */}

            <div>

              <div className="flex items-center gap-2 mb-4">

                <FaMapMarkerAlt className="text-blue-600" />

                <h3 className="font-semibold text-slate-800">

                  Location Coordinates

                </h3>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* LATITUDE */}

                <div>

                  <label className="block text-sm font-medium text-slate-600 mb-2">

                    Latitude

                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="13.1132"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />

                </div>

                {/* LONGITUDE */}

                <div>

                  <label className="block text-sm font-medium text-slate-600 mb-2">

                    Longitude

                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="77.5304"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />

                </div>

              </div>

            </div>

            {/* TOTAL SLOTS */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">

                Total Parking Slots

              </label>

              <div className="relative">

                <FaParking className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="number"
                  min="1"
                  name="total_slots"
                  value={formData.total_slots}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Enter total parking slots"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 outline-none transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

              </div>

            </div>

            {/* VERIFICATION NOTICE */}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">

              <div className="flex gap-3">

                <FaClock className="text-blue-600 text-lg mt-0.5 shrink-0" />

                <div>

                  <h3 className="font-semibold text-blue-800">

                    Verification Required After Update

                  </h3>

                  <p className="text-sm text-blue-700 mt-1 leading-6">

                    Saving changes will update your parking
                    information and submit the location for
                    ParkEase verification again.

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ======================================
              FORM ACTIONS
          ====================================== */}

          <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">

            <p className="text-xs text-slate-400">

              Parking ID: #{id}

            </p>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={() => navigate("/owner")}
                disabled={saving}
                className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-600 font-medium hover:bg-slate-100 transition disabled:opacity-50"
              >

                Cancel

              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >

                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />

                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FaSave />

                    Save & Submit for Verification
                  </>
                )}

              </button>

            </div>

          </div>

        </form>

      </main>

    </div>
  );
}

export default EditParking;