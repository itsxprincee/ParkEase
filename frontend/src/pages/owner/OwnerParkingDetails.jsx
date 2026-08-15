import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";
import { toast, Toaster } from "react-hot-toast";

import {
  FaArrowLeft,
  FaParking,
  FaMapMarkerAlt,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEdit,
  FaSyncAlt,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaLayerGroup,
  FaInfoCircle,
  FaCircle,
} from "react-icons/fa";

function OwnerParkingDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // LOAD PARKING DETAILS
  // =====================================================

  const loadParkingDetails = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `/parking/owner/${id}`
      );

      setParking(response.data);

    } catch (error) {
      console.error(
        "Unable to load parking details:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
        "Unable to load parking details."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadParkingDetails();
  }, [id]);

  // =====================================================
  // STATUS CONFIG
  // =====================================================

  const getStatusConfig = (status) => {
    if (status === "APPROVED") {
      return {
        label: "Approved",
        icon: <FaCheckCircle />,
        badge:
          "bg-green-100 text-green-700 border-green-200",
        bg: "bg-green-50",
        text: "text-green-700",
      };
    }

    if (status === "REJECTED") {
      return {
        label: "Rejected",
        icon: <FaExclamationTriangle />,
        badge:
          "bg-red-100 text-red-700 border-red-200",
        bg: "bg-red-50",
        text: "text-red-700",
      };
    }

    return {
      label: "Pending Verification",
      icon: <FaClock />,
      badge:
        "bg-yellow-100 text-yellow-700 border-yellow-200",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
    };
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "Not available";

    try {
      return new Date(date).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return date;
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

          <p className="mt-4 text-slate-500">
            Loading parking details...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR / NOT FOUND
  // =====================================================

  if (!parking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

        <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 p-8 text-center shadow-sm">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl">

            <FaExclamationTriangle />

          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Parking Not Found
          </h2>

          <p className="text-slate-500 mt-2">
            The parking location could not be loaded.
          </p>

          <button
            onClick={() => navigate("/owner")}
            className="mt-6 px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  const status = getStatusConfig(
    parking.verification_status
  );

  const slots = parking.slots || {};

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            padding: "14px 16px",
          },
        }}
      />

      {/* ===============================================
          HEADER
      =============================================== */}

      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              <button
                onClick={() => navigate("/owner")}
                className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
              >
                <FaArrowLeft />
              </button>

              <div>

                <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">
                  Owner Management
                </p>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  Parking Details
                </h1>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  loadParkingDetails(true)
                }
                disabled={refreshing}
                className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
              >
                <FaSyncAlt
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/owner/edit-parking/${parking.id}`
                  )
                }
                className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >

                <FaEdit />

                Edit Parking

              </button>

            </div>

          </div>

        </div>

      </header>

      {/* ===============================================
          MAIN CONTENT
      =============================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =============================================
            TITLE
        ============================================= */}

        <section className="mb-8">

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            <div className="flex items-start gap-4">

              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-blue-200 shrink-0">

                <FaParking />

              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-3xl font-bold text-slate-900">

                    {parking.name}

                  </h2>

                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${status.badge}`}
                  >

                    {status.icon}

                    {status.label}

                  </span>

                </div>

                <div className="flex items-start gap-2 mt-3 text-slate-500">

                  <FaMapMarkerAlt className="mt-1 text-blue-500 shrink-0" />

                  <p>
                    {parking.address}
                  </p>

                </div>

                <p className="text-sm text-slate-400 mt-3">

                  Parking ID #{parking.id}

                </p>

              </div>

            </div>

            <button
              onClick={() =>
                navigate(
                  `/owner/edit-parking/${parking.id}`
                )
              }
              className="sm:hidden flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >

              <FaEdit />

              Edit Parking

            </button>

          </div>

        </section>

        {/* =============================================
            VERIFICATION ALERT
        ============================================= */}

        {parking.verification_status ===
          "PENDING" && (

          <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

            <div className="flex gap-4">

              <div className="w-11 h-11 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">

                <FaClock />

              </div>

              <div>

                <h3 className="font-bold text-yellow-800">

                  Verification Pending

                </h3>

                <p className="text-sm text-yellow-700 mt-1">

                  Your parking location is currently under review by ParkEase.
                  Customers will be able to discover it after approval.

                </p>

              </div>

            </div>

          </div>

        )}

        {parking.verification_status ===
          "REJECTED" && (

          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="flex gap-4">

              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">

                <FaExclamationTriangle />

              </div>

              <div>

                <h3 className="font-bold text-red-800">

                  Verification Rejected

                </h3>

                <p className="text-sm text-red-700 mt-1">

                  {parking.rejection_reason ||
                    "No rejection reason was provided."}

                </p>

              </div>

            </div>

          </div>

        )}

        {parking.verification_status ===
          "APPROVED" && (

          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5">

            <div className="flex gap-4">

              <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">

                <FaCheckCircle />

              </div>

              <div>

                <h3 className="font-bold text-green-800">

                  Parking is Live

                </h3>

                <p className="text-sm text-green-700 mt-1">

                  Your parking location has been approved and is available for customers.

                </p>

              </div>

            </div>

          </div>

        )}

        {/* =============================================
            SLOT STATISTICS
        ============================================= */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Capacity
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-2">

                  {slots.total || 0}

                </h3>

              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">

                <FaCar />

              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Available
                </p>

                <h3 className="text-3xl font-bold text-green-600 mt-2">

                  {slots.available || 0}

                </h3>

              </div>

              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">

                <FaCheckCircle />

              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Occupied
                </p>

                <h3 className="text-3xl font-bold text-red-600 mt-2">

                  {slots.occupied || 0}

                </h3>

              </div>

              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">

                <FaCircle />

              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Booked
                </p>

                <h3 className="text-3xl font-bold text-indigo-600 mt-2">

                  {slots.booked || 0}

                </h3>

              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

                <FaLayerGroup />

              </div>

            </div>

          </div>

        </section>

        {/* =============================================
            DETAILS GRID
        ============================================= */}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LOCATION INFORMATION */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                <FaMapMarkedAlt />

              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Location Information
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Parking location coordinates
                </p>

              </div>

            </div>

            <div className="p-6 space-y-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Address
                </p>

                <p className="text-slate-800 mt-2">
                  {parking.address}
                </p>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

                  <p className="text-xs font-semibold text-slate-400">
                    Latitude
                  </p>

                  <p className="font-bold text-slate-800 mt-2">

                    {parking.latitude}

                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

                  <p className="text-xs font-semibold text-slate-400">
                    Longitude
                  </p>

                  <p className="font-bold text-slate-800 mt-2">

                    {parking.longitude}

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* VERIFICATION INFORMATION */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

                <FaInfoCircle />

              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Verification Information
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  ParkEase verification details
                </p>

              </div>

            </div>

            <div className="p-6 space-y-5">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Current Status
                  </p>

                  <div
                    className={`mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${status.badge}`}
                  >

                    {status.icon}

                    {status.label}

                  </div>

                </div>

              </div>

              <div className="border-t border-slate-100 pt-5">

                <div className="flex items-start gap-3">

                  <FaCalendarAlt className="text-slate-400 mt-1" />

                  <div>

                    <p className="text-xs font-semibold text-slate-400">
                      Submitted
                    </p>

                    <p className="text-sm font-medium text-slate-700 mt-1">

                      {formatDate(
                        parking.verification_submitted_at
                      )}

                    </p>

                  </div>

                </div>

              </div>

              {parking.verified_at && (

                <div>

                  <div className="flex items-start gap-3">

                    <FaCheckCircle className="text-green-500 mt-1" />

                    <div>

                      <p className="text-xs font-semibold text-slate-400">
                        Verified
                      </p>

                      <p className="text-sm font-medium text-slate-700 mt-1">

                        {formatDate(
                          parking.verified_at
                        )}

                      </p>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default OwnerParkingDetails;