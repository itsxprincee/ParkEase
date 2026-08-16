import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";
import { toast, Toaster } from "react-hot-toast";

import {
  FaArrowLeft,
  FaParking,
  FaPlus,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaTools,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaEllipsisV,
  FaTimes,
  FaLayerGroup,
  FaExclamationTriangle,
} from "react-icons/fa";

function ManageSlots() {
  const navigate = useNavigate();
  const { id } = useParams();

  // =====================================================
  // DATA
  // =====================================================

  const [parking, setParking] = useState(null);
  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // =====================================================
  // MODALS
  // =====================================================

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [editModal, setEditModal] = useState({
    open: false,
    slot: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    slot: null,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    slot: null,
  });

  // =====================================================
  // FORM STATES
  // =====================================================

  const [slotNumber, setSlotNumber] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState("AVAILABLE");

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // LOAD PARKING + SLOTS
  // =====================================================

  const loadSlots = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `/parking/owner/${id}/slots`
      );

      setParking({
        id: response.data.parking_id,
        name: response.data.parking_name,
        total_slots: response.data.configured_capacity,
        created_slots: response.data.created_slots,
        available_slots: response.data.available_slots,
        occupied_slots: response.data.occupied_slots,
        maintenance_slots:
          response.data.maintenance_slots,
      });

      setSlots(response.data.slots || []);
    } catch (error) {
      console.error("Unable to load parking slots:", error);

      if (error?.response?.status === 401) {
        toast.error(
          "Your session has expired. Please login again."
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (error?.response?.status === 404) {
        toast.error(
          "Parking location not found."
        );

        navigate("/owner", {
          replace: true,
        });

        return;
      }

      toast.error(
        error?.response?.data?.detail ||
          "Unable to load parking slots."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadSlots();
  }, [id]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const total = parking?.total_slots || 0;

    const created = slots.length;

    const available = slots.filter(
      (slot) =>
        slot.status === "AVAILABLE"
    ).length;

    const occupied = slots.filter(
      (slot) =>
        slot.status === "OCCUPIED"
    ).length;

    const maintenance = slots.filter(
      (slot) =>
        slot.status === "MAINTENANCE"
    ).length;

    const remaining = Math.max(
      total - created,
      0
    );

    return {
      total,
      created,
      available,
      occupied,
      maintenance,
      remaining,
    };
  }, [parking, slots]);

  // =====================================================
  // FILTER SLOTS
  // =====================================================

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchesSearch =
        slot.slot_number
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      const matchesStatus =
        statusFilter === "ALL" ||
        slot.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    slots,
    searchTerm,
    statusFilter,
  ]);

  // =====================================================
  // STATUS CONFIGURATION
  // =====================================================

  const getStatusConfig = (status) => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: "Available",
          icon: <FaCheckCircle />,
          badge:
            "bg-green-50 text-green-700 border-green-200",
          card:
            "border-green-200 hover:border-green-300",
          iconBox:
            "bg-green-100 text-green-600",
        };

      case "OCCUPIED":
        return {
          label: "Occupied",
          icon: <FaCar />,
          badge:
            "bg-red-50 text-red-700 border-red-200",
          card:
            "border-red-200 hover:border-red-300",
          iconBox:
            "bg-red-100 text-red-600",
        };

      case "MAINTENANCE":
        return {
          label: "Maintenance",
          icon: <FaTools />,
          badge:
            "bg-orange-50 text-orange-700 border-orange-200",
          card:
            "border-orange-200 hover:border-orange-300",
          iconBox:
            "bg-orange-100 text-orange-600",
        };

      default:
        return {
          label: "Unknown",
          icon: <FaExclamationTriangle />,
          badge:
            "bg-slate-50 text-slate-600 border-slate-200",
          card:
            "border-slate-200",
          iconBox:
            "bg-slate-100 text-slate-500",
        };
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    await loadSlots(true);

    toast.success(
      "Slot information refreshed."
    );
  };

  // =====================================================
  // ADD SLOT
  // =====================================================

  const openAddModal = () => {
    if (
      statistics.created >=
      statistics.total
    ) {
      toast.error(
        `Maximum capacity of ${statistics.total} slots has been reached.`
      );

      return;
    }

    setSlotNumber("");
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    if (submitting) return;

    setAddModalOpen(false);
    setSlotNumber("");
  };

  const handleAddSlot = async (event) => {
    event.preventDefault();

    const trimmedSlotNumber =
      slotNumber.trim();

    if (!trimmedSlotNumber) {
      toast.error(
        "Please enter a slot number."
      );

      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        `/parking/owner/${id}/slots`,
        {
          slot_number: trimmedSlotNumber,
        }
      );

      toast.success(
        `Slot ${trimmedSlotNumber} added successfully.`
      );

      closeAddModal();

      await loadSlots(true);
    } catch (error) {
      console.error(
        "Unable to create slot:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Unable to create parking slot."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // EDIT SLOT
  // =====================================================

  const openEditModal = (slot) => {
    setSlotNumber(
      slot.slot_number || ""
    );

    setEditModal({
      open: true,
      slot,
    });
  };

  const closeEditModal = () => {
    if (submitting) return;

    setEditModal({
      open: false,
      slot: null,
    });

    setSlotNumber("");
  };

  const handleEditSlot = async (event) => {
    event.preventDefault();

    if (!editModal.slot) return;

    const trimmedSlotNumber =
      slotNumber.trim();

    if (!trimmedSlotNumber) {
      toast.error(
        "Slot number cannot be empty."
      );

      return;
    }

    try {
      setSubmitting(true);

      await axios.put(
        `/parking/owner/${id}/slots/${editModal.slot.id}`,
        {
          slot_number: trimmedSlotNumber,
        }
      );

      toast.success(
        "Slot number updated successfully."
      );

      closeEditModal();

      await loadSlots(true);
    } catch (error) {
      console.error(
        "Unable to update slot:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Unable to update parking slot."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // CHANGE STATUS
  // =====================================================

  const openStatusModal = (slot) => {
    setSelectedStatus(
      slot.status || "AVAILABLE"
    );

    setStatusModal({
      open: true,
      slot,
    });
  };

  const closeStatusModal = () => {
    if (submitting) return;

    setStatusModal({
      open: false,
      slot: null,
    });

    setSelectedStatus("AVAILABLE");
  };

  const handleStatusUpdate = async (
    event
  ) => {
    event.preventDefault();

    if (!statusModal.slot) return;

    try {
      setSubmitting(true);

      await axios.patch(
        `/parking/owner/${id}/slots/${statusModal.slot.id}/status`,
        {
          status: selectedStatus,
        }
      );

      toast.success(
        `Slot status changed to ${selectedStatus.toLowerCase()}.`
      );

      closeStatusModal();

      await loadSlots(true);
    } catch (error) {
      console.error(
        "Unable to update slot status:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Unable to update slot status."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE SLOT
  // =====================================================

  const openDeleteModal = (slot) => {
    setDeleteModal({
      open: true,
      slot,
    });
  };

  const closeDeleteModal = () => {
    if (submitting) return;

    setDeleteModal({
      open: false,
      slot: null,
    });
  };

  const handleDeleteSlot = async () => {
    if (!deleteModal.slot) return;

    try {
      setSubmitting(true);

      await axios.delete(
        `/parking/owner/${id}/slots/${deleteModal.slot.id}`
      );

      toast.success(
        `Slot ${deleteModal.slot.slot_number} deleted successfully.`
      );

      closeDeleteModal();

      await loadSlots(true);
    } catch (error) {
      console.error(
        "Unable to delete slot:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Unable to delete parking slot."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ================================================
          TOASTER
      ================================================= */}

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

      {/* ================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  navigate(
                    `/owner/parking/${id}`
                  )
                }
                className="w-11 h-11 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition"
                title="Back to parking details"
              >
                <FaArrowLeft />
              </button>

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md">

                  <FaParking />

                </div>

                <div className="min-w-0">

                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">

                    {parking?.name ||
                      "Manage Parking Slots"}

                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500">

                    Slot Management

                  </p>

                </div>

              </div>

            </div>

            <div className="flex items-center gap-2 sm:gap-3">

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-11 h-11 sm:w-auto sm:px-4 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition disabled:opacity-60"
              >

                <FaSyncAlt
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline font-medium">
                  Refresh
                </span>

              </button>

              <button
                onClick={openAddModal}
                disabled={
                  loading ||
                  statistics.created >=
                    statistics.total
                }
                className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >

                <FaPlus />

                <span className="hidden sm:inline">
                  Add Slot
                </span>

                <span className="sm:hidden">
                  Add
                </span>

              </button>

            </div>

          </div>

        </div>

      </header>

      {/* ================================================
          MAIN
      ================================================= */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ================================================
            PAGE INTRO
        ================================================= */}

        <section className="mb-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">

                <FaLayerGroup />

                SLOT MANAGEMENT

              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">

                Manage your parking slots

              </h2>

              <p className="text-slate-500 mt-3 max-w-2xl">

                Add, update, monitor and manage
                the availability of every parking
                slot from one professional dashboard.

              </p>

            </div>

            {parking && (

              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">

                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">

                  Parking Capacity

                </p>

                <div className="flex items-end gap-2 mt-1">

                  <span className="text-2xl font-bold text-slate-900">

                    {statistics.created}

                  </span>

                  <span className="text-slate-400 pb-1">

                    / {statistics.total} slots

                  </span>

                </div>

              </div>

            )}

          </div>

        </section>

        {/* ================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="bg-white rounded-2xl border border-slate-200 py-24 text-center">

            <div className="w-11 h-11 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

            <p className="text-slate-500 mt-5">

              Loading parking slots...

            </p>

          </div>

        ) : (

          <>

            {/* ================================================
                STATISTICS
            ================================================= */}

            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-slate-500">

                      Capacity

                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-2">

                      {statistics.total}

                    </h3>

                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                    <FaParking />

                  </div>

                </div>

              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-slate-500">

                      Created

                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-2">

                      {statistics.created}

                    </h3>

                  </div>

                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

                    <FaLayerGroup />

                  </div>

                </div>

              </div>

              <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-slate-500">

                      Available

                    </p>

                    <h3 className="text-2xl font-bold text-green-600 mt-2">

                      {statistics.available}

                    </h3>

                  </div>

                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">

                    <FaCheckCircle />

                  </div>

                </div>

              </div>

              <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-slate-500">

                      Occupied

                    </p>

                    <h3 className="text-2xl font-bold text-red-600 mt-2">

                      {statistics.occupied}

                    </h3>

                  </div>

                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">

                    <FaCar />

                  </div>

                </div>

              </div>

              <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-slate-500">

                      Maintenance

                    </p>

                    <h3 className="text-2xl font-bold text-orange-600 mt-2">

                      {statistics.maintenance}

                    </h3>

                  </div>

                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">

                    <FaTools />

                  </div>

                </div>

              </div>

            </section>

            {/* ================================================
                SEARCH + FILTER
            ================================================= */}

            <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div className="relative w-full lg:max-w-md">

                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    placeholder="Search slot number..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />

                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <div className="flex items-center gap-2 text-slate-500 mr-1">

                    <FaFilter />

                    <span className="text-sm font-medium">

                      Filter:

                    </span>

                  </div>

                  {[
                    "ALL",
                    "AVAILABLE",
                    "OCCUPIED",
                    "MAINTENANCE",
                  ].map((status) => (

                    <button
                      key={status}
                      onClick={() =>
                        setStatusFilter(status)
                      }
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                        statusFilter === status
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >

                      {status === "ALL"
                        ? `All (${statistics.created})`
                        : status === "AVAILABLE"
                        ? `Available (${statistics.available})`
                        : status === "OCCUPIED"
                        ? `Occupied (${statistics.occupied})`
                        : `Maintenance (${statistics.maintenance})`}

                    </button>

                  ))}

                </div>

              </div>

            </section>

            {/* ================================================
                SLOT HEADER
            ================================================= */}

            <section className="flex items-center justify-between mb-5">

              <div>

                <h3 className="text-2xl font-bold text-slate-900">

                  Parking Slots

                </h3>

                <p className="text-sm text-slate-500 mt-1">

                  Showing {filteredSlots.length} of{" "}
                  {statistics.created} slots

                </p>

              </div>

              <div className="text-sm text-slate-500">

                {statistics.remaining > 0
                  ? `${statistics.remaining} slot${
                      statistics.remaining !== 1
                        ? "s"
                        : ""
                    } remaining`
                  : "Maximum capacity reached"}

              </div>

            </section>

            {/* ================================================
                EMPTY STATE
            ================================================= */}

            {slots.length === 0 ? (

              <div className="bg-white border border-slate-200 rounded-2xl py-20 px-6 text-center shadow-sm">

                <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">

                  <FaParking />

                </div>

                <h3 className="text-2xl font-bold text-slate-900 mt-6">

                  No parking slots created

                </h3>

                <p className="text-slate-500 mt-3 max-w-md mx-auto">

                  Start by adding parking slots for
                  this location. You can then manage
                  their availability and status.

                </p>

                <button
                  onClick={openAddModal}
                  className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >

                  <FaPlus />

                  Add First Slot

                </button>

              </div>

            ) : filteredSlots.length === 0 ? (

              <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl">

                  <FaSearch />

                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-5">

                  No slots found

                </h3>

                <p className="text-slate-500 mt-2">

                  Try changing your search or filter.

                </p>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >

                  Clear Filters

                </button>

              </div>

            ) : (

              /* ================================================
                  SLOT GRID
              ================================================= */

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

                {filteredSlots.map((slot) => {

                  const config =
                    getStatusConfig(slot.status);

                  return (

                    <div
                      key={slot.id}
                      className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all ${config.card}`}
                    >

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-center gap-3">

                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${config.iconBox}`}>

                              <FaParking />

                            </div>

                            <div>

                              <p className="text-xs text-slate-400 font-medium">

                                SLOT

                              </p>

                              <h3 className="text-2xl font-bold text-slate-900 mt-1">

                                {slot.slot_number}

                              </h3>

                            </div>

                          </div>

                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${config.badge}`}>

                            {config.icon}

                            {config.label}

                          </span>

                        </div>

                        <div className="mt-5 pt-5 border-t border-slate-100">

                          <div className="grid grid-cols-3 gap-2">

                            <button
                              onClick={() =>
                                openStatusModal(slot)
                              }
                              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
                            >

                              <FaEllipsisV />

                              <span className="text-[11px] font-medium">

                                Status

                              </span>

                            </button>

                            <button
                              onClick={() =>
                                openEditModal(slot)
                              }
                              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                            >

                              <FaEdit />

                              <span className="text-[11px] font-medium">

                                Edit

                              </span>

                            </button>

                            <button
                              onClick={() =>
                                openDeleteModal(slot)
                              }
                              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                            >

                              <FaTrash />

                              <span className="text-[11px] font-medium">

                                Delete

                              </span>

                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  );
                })}

              </div>

            )}

          </>

        )}

      </main>

      {/* ================================================
          ADD SLOT MODAL
      ================================================= */}

      {addModalOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">

          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeAddModal}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            <form
              onSubmit={handleAddSlot}
            >

              <div className="p-6">

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">

                      <FaPlus />

                    </div>

                    <div>

                      <h3 className="text-xl font-bold text-slate-900">

                        Add Parking Slot

                      </h3>

                      <p className="text-sm text-slate-500 mt-1">

                        {statistics.remaining} slot
                        {statistics.remaining !== 1
                          ? "s"
                          : ""} remaining

                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={closeAddModal}
                    disabled={submitting}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >

                    <FaTimes />

                  </button>

                </div>

                <div className="mt-6">

                  <label className="block text-sm font-semibold text-slate-700 mb-2">

                    Slot Number

                  </label>

                  <input
                    autoFocus
                    type="text"
                    placeholder="Example: A-01"
                    value={slotNumber}
                    onChange={(event) =>
                      setSlotNumber(
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-slate-50"
                  />

                </div>

              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-50"
                >

                  Cancel

                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                >

                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Add Slot
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================================================
          EDIT SLOT MODAL
      ================================================= */}

      {editModal.open && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">

          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeEditModal}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            <form
              onSubmit={handleEditSlot}
            >

              <div className="p-6">

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">

                      <FaEdit />

                    </div>

                    <div>

                      <h3 className="text-xl font-bold text-slate-900">

                        Edit Parking Slot

                      </h3>

                      <p className="text-sm text-slate-500 mt-1">

                        Update the slot number.

                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={submitting}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >

                    <FaTimes />

                  </button>

                </div>

                <div className="mt-6">

                  <label className="block text-sm font-semibold text-slate-700 mb-2">

                    Slot Number

                  </label>

                  <input
                    autoFocus
                    type="text"
                    value={slotNumber}
                    onChange={(event) =>
                      setSlotNumber(
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />

                </div>

              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-100"
                >

                  Cancel

                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                >

                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaEdit />
                      Save Changes
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================================================
          STATUS MODAL
      ================================================= */}

      {statusModal.open && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">

          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeStatusModal}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

            <form
              onSubmit={handleStatusUpdate}
            >

              <div className="p-6">

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                      <FaParking />

                    </div>

                    <div>

                      <h3 className="text-xl font-bold text-slate-900">

                        Update Slot Status

                      </h3>

                      <p className="text-sm text-slate-500 mt-1">

                        Slot{" "}
                        <span className="font-semibold text-slate-700">

                          {statusModal.slot?.slot_number}

                        </span>

                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={closeStatusModal}
                    disabled={submitting}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >

                    <FaTimes />

                  </button>

                </div>

                <div className="mt-7 space-y-3">

                  {[
                    {
                      value: "AVAILABLE",
                      label: "Available",
                      description:
                        "Customers can use this parking slot.",
                      icon: <FaCheckCircle />,
                      style:
                        "border-green-200 bg-green-50 text-green-700",
                    },
                    {
                      value: "OCCUPIED",
                      label: "Occupied",
                      description:
                        "This parking slot is currently occupied.",
                      icon: <FaCar />,
                      style:
                        "border-red-200 bg-red-50 text-red-700",
                    },
                    {
                      value: "MAINTENANCE",
                      label: "Maintenance",
                      description:
                        "This slot is temporarily unavailable.",
                      icon: <FaTools />,
                      style:
                        "border-orange-200 bg-orange-50 text-orange-700",
                    },
                  ].map((status) => (

                    <label
                      key={status.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                        selectedStatus ===
                        status.value
                          ? status.style
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >

                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={
                          selectedStatus ===
                          status.value
                        }
                        onChange={(event) =>
                          setSelectedStatus(
                            event.target.value
                          )
                        }
                        className="w-4 h-4"
                      />

                      <div className="text-lg">

                        {status.icon}

                      </div>

                      <div>

                        <p className="font-semibold">

                          {status.label}

                        </p>

                        <p className="text-xs opacity-80 mt-1">

                          {status.description}

                        </p>

                      </div>

                    </label>

                  ))}

                </div>

              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeStatusModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium"
                >

                  Cancel

                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >

                  {submitting
                    ? "Updating..."
                    : "Update Status"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================================================
          DELETE MODAL
      ================================================= */}

      {deleteModal.open && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">

          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            <div className="p-6">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl shrink-0">

                  <FaTrash />

                </div>

                <div className="flex-1">

                  <h3 className="text-xl font-bold text-slate-900">

                    Delete Parking Slot?

                  </h3>

                  <p className="text-sm text-slate-500 mt-2 leading-6">

                    Are you sure you want to delete
                    slot{" "}

                    <span className="font-semibold text-slate-700">

                      {deleteModal.slot?.slot_number}

                    </span>

                    ? This action cannot be undone.

                  </p>

                </div>

                <button
                  onClick={closeDeleteModal}
                  disabled={submitting}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
                >

                  <FaTimes />

                </button>

              </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">

              <button
                onClick={closeDeleteModal}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium"
              >

                Cancel

              </button>

              <button
                onClick={handleDeleteSlot}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
              >

                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Delete Slot
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManageSlots;