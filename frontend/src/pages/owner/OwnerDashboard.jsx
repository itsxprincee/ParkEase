import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { toast, Toaster } from "react-hot-toast";

import {
  FaParking,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaSignOutAlt,
  FaTrash,
  FaMapMarkerAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaSyncAlt,
  FaSearch,
  FaEdit,
  FaEye,
  FaFilter,
  FaUserCircle,
  FaChevronDown,
  FaTimes,
  FaBars,
  FaBell,
} from "react-icons/fa";

function OwnerDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // PARKING STATE
  // ==========================================

  const [parking, setParking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ==========================================
  // OWNER STATE
  // ==========================================

  const [owner, setOwner] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // ==========================================
  // NOTIFICATION STATE
  // ==========================================

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "success",
      title: "Welcome to ParkEase",
      message:
        "Your owner dashboard is ready.",
      time: "Just now",
      read: false,
    },
  ]);

  // ==========================================
  // CONFIRMATION MODAL
  // ==========================================

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    id: null,
  });

  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // LOAD OWNER DATA
  // ==========================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      try {
        setOwner(JSON.parse(storedUser));
      } catch (error) {
        console.error(
          "Unable to load user data:",
          error
        );
      }
    }
  }, []);

  // ==========================================
  // LOAD OWNER PARKING
  // ==========================================

  const loadParking = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        "/parking/owner/my-parking"
      );

      setParking(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load parking:",
        error
      );

      if (error?.response?.status === 401) {
        toast.error(
          "Your session has expired. Please login again."
        );
        return;
      }

      toast.error(
        error?.response?.data?.detail ||
          "Unable to load parking locations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadParking();

    const interval = setInterval(() => {
      loadParking(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // OWNER INFORMATION
  // ==========================================

  const getOwnerName = () => {
    if (!owner) return "Owner";

    return (
      owner.name ||
      owner.full_name ||
      owner.username ||
      owner.email?.split("@")[0] ||
      "Owner"
    );
  };

  const getOwnerEmail = () => {
    return owner?.email || "ParkEase Owner";
  };

  const getOwnerInitial = () => {
    return getOwnerName()
      .charAt(0)
      .toUpperCase();
  };

  // ==========================================
  // NOTIFICATION HELPERS
  // ==========================================

  const unreadNotifications =
    notifications.filter(
      (item) => !item.read
    ).length;

  const addNotification = (
    type,
    title,
    message
  ) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      time: "Just now",
      read: false,
    };

    setNotifications((previous) => [
      newNotification,
      ...previous,
    ]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  const markNotificationRead = (id) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item
      )
    );
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    await loadParking(true);

    toast.success(
      "Dashboard refreshed successfully."
    );
  };

  // ==========================================
  // CONFIRMATION MODAL
  // ==========================================

  const openConfirmModal = (
    type,
    id = null
  ) => {
    setConfirmModal({
      open: true,
      type,
      id,
    });
  };

  const closeConfirmModal = () => {
    if (deleting) return;

    setConfirmModal({
      open: false,
      type: null,
      id: null,
    });
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    setProfileOpen(false);
    setMobileMenu(false);

    openConfirmModal("logout");
  };

  // ==========================================
  // DELETE PARKING
  // ==========================================

  const deleteParking = (id) => {
    openConfirmModal("delete", id);
  };

  // ==========================================
  // CONFIRM ACTION
  // ==========================================

  const confirmAction = async () => {
    // ========================================
    // LOGOUT
    // ========================================

    if (confirmModal.type === "logout") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.success(
        "Logged out successfully."
      );

      setConfirmModal({
        open: false,
        type: null,
        id: null,
      });

      navigate("/login", {
        replace: true,
      });

      return;
    }

    // ========================================
    // DELETE PARKING
    // ========================================

    if (confirmModal.type === "delete") {
      const id = confirmModal.id;

      try {
        setDeleting(true);

        await axios.delete(
          `/parking/owner/${id}`
        );

        setParking((previous) =>
          previous.filter(
            (item) => item.id !== id
          )
        );

        toast.success(
          "Parking location deleted successfully."
        );

        addNotification(
          "success",
          "Parking deleted",
          "The parking location was successfully removed."
        );

        setConfirmModal({
          open: false,
          type: null,
          id: null,
        });
      } catch (error) {
        console.error(
          "Delete parking error:",
          error
        );

        toast.error(
          error?.response?.data?.detail ||
            "Unable to delete parking location."
        );
      } finally {
        setDeleting(false);
      }
    }
  };

  // ==========================================
  // STATUS CONFIGURATION
  // ==========================================

  const getStatusConfig = (status) => {
    if (status === "APPROVED") {
      return {
        badge:
          "bg-green-100 text-green-700 border-green-200",
        icon: <FaCheckCircle />,
        title: "Approved",
      };
    }

    if (status === "REJECTED") {
      return {
        badge:
          "bg-red-100 text-red-700 border-red-200",
        icon: <FaExclamationTriangle />,
        title: "Rejected",
      };
    }

    return {
      badge:
        "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <FaClock />,
      title: "Pending",
    };
  };

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const totalLocations = parking.length;

  const totalSlots = parking.reduce(
    (total, item) =>
      total +
      Number(item.total_slots || 0),
    0
  );

  const approvedParking = parking.filter(
    (item) =>
      item.verification_status ===
      "APPROVED"
  ).length;

  const pendingParking = parking.filter(
    (item) =>
      item.verification_status ===
      "PENDING"
  ).length;

  const rejectedParking = parking.filter(
    (item) =>
      item.verification_status ===
      "REJECTED"
  ).length;

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredParking = parking.filter(
    (item) => {
      const name = (
        item.name || ""
      ).toLowerCase();

      const address = (
        item.address || ""
      ).toLowerCase();

      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(search) ||
        address.includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.verification_status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  // ==========================================
  // VIEW PARKING
  // ==========================================

  const viewParking = (id) => {
    navigate(
      `/customer/parking/${id}`
    );
  };

  // ==========================================
  // EDIT PARKING
  // ==========================================

  const editParking = (id) => {
    navigate(
      `/owner/edit-parking/${id}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ========================================
          TOAST NOTIFICATIONS
      ======================================== */}

      <Toaster
        position="top-right"
        reverseOrder={false}
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

      {/* ========================================
          CONFIRMATION MODAL
      ======================================== */}

      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeConfirmModal}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

            {/* HEADER */}

            <div className="p-6">

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    confirmModal.type ===
                    "delete"
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {confirmModal.type ===
                  "delete" ? (
                    <FaTrash />
                  ) : (
                    <FaSignOutAlt />
                  )}
                </div>

                <div className="flex-1">

                  <h3 className="text-xl font-bold text-slate-900">

                    {confirmModal.type ===
                    "delete"
                      ? "Delete Parking Location?"
                      : "Logout from ParkEase?"}

                  </h3>

                  <p className="text-sm text-slate-500 mt-2 leading-6">

                    {confirmModal.type ===
                    "delete"
                      ? "This action will permanently remove this parking location. This cannot be undone."
                      : "Are you sure you want to logout from your ParkEase owner account?"}

                  </p>

                </div>

                <button
                  onClick={
                    closeConfirmModal
                  }
                  disabled={deleting}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50"
                >
                  <FaTimes />
                </button>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">

              <button
                onClick={
                  closeConfirmModal
                }
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmAction}
                disabled={deleting}
                className={`px-5 py-2.5 rounded-xl text-white font-semibold transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                  confirmModal.type ===
                  "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-800 hover:bg-slate-900"
                }`}
              >

                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                    Deleting...
                  </>
                ) : confirmModal.type ===
                  "delete" ? (
                  <>
                    <FaTrash />
                    Delete
                  </>
                ) : (
                  <>
                    <FaSignOutAlt />
                    Logout
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between gap-4">

            {/* LOGO */}

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() =>
                navigate("/owner")
              }
            >

              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-md shadow-blue-200">

                <FaParking />

              </div>

              <div>

                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  ParkEase
                </h1>

                <p className="text-xs sm:text-sm text-slate-500">
                  Owner Management Portal
                </p>

              </div>

            </div>

            {/* DESKTOP ACTIONS */}

            <div className="hidden md:flex items-center gap-3">

              {/* REFRESH */}

              <button
                onClick={
                  handleRefresh
                }
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
              >

                <FaSyncAlt
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="font-medium">
                  Refresh
                </span>

              </button>

              {/* ADD PARKING */}

              <button
                onClick={() =>
                  navigate(
                    "/owner/add-parking"
                  )
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all"
              >

                <FaPlus />

                Add Parking

              </button>

              {/* NOTIFICATIONS */}

              <div className="relative">

                <button
                  onClick={() =>
                    setNotificationOpen(
                      !notificationOpen
                    )
                  }
                  className="relative w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
                >

                  <FaBell />

                  {unreadNotifications >
                    0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadNotifications >
                      9
                        ? "9+"
                        : unreadNotifications}
                    </span>
                  )}

                </button>

                {notificationOpen && (

                  <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">

                    {/* NOTIFICATION HEADER */}

                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          Notifications
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">

                          {unreadNotifications} unread

                        </p>

                      </div>

                      {notifications.length >
                        0 && (
                        <button
                          onClick={
                            markAllNotificationsRead
                          }
                          className="text-xs text-blue-600 font-medium hover:text-blue-700"
                        >
                          Mark all read
                        </button>
                      )}

                    </div>

                    {/* NOTIFICATION LIST */}

                    <div className="max-h-96 overflow-y-auto">

                      {notifications.length ===
                      0 ? (

                        <div className="p-8 text-center">

                          <FaBell className="mx-auto text-2xl text-slate-300" />

                          <p className="font-medium text-slate-700 mt-3">
                            No notifications
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            You're all caught up.
                          </p>

                        </div>

                      ) : (

                        notifications.map(
                          (notification) => (

                            <div
                              key={
                                notification.id
                              }
                              onClick={() =>
                                markNotificationRead(
                                  notification.id
                                )
                              }
                              className={`px-5 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition ${
                                !notification.read
                                  ? "bg-blue-50/40"
                                  : ""
                              }`}
                            >

                              <div className="flex gap-3">

                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    notification.type ===
                                    "success"
                                      ? "bg-green-100 text-green-600"
                                      : notification.type ===
                                        "warning"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : "bg-blue-100 text-blue-600"
                                  }`}
                                >

                                  {notification.type ===
                                  "success"
                                    ? "✓"
                                    : notification.type ===
                                      "warning"
                                    ? "!"
                                    : "i"}

                                </div>

                                <div className="min-w-0">

                                  <div className="flex items-center gap-2">

                                    <p className="text-sm font-semibold text-slate-800">
                                      {
                                        notification.title
                                      }
                                    </p>

                                    {!notification.read && (
                                      <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                                    )}

                                  </div>

                                  <p className="text-xs text-slate-500 mt-1">
                                    {
                                      notification.message
                                    }
                                  </p>

                                  <p className="text-[11px] text-slate-400 mt-2">
                                    {
                                      notification.time
                                    }
                                  </p>

                                </div>

                              </div>

                            </div>

                          )
                        )

                      )}

                    </div>

                  </div>

                )}

              </div>

              {/* PROFILE */}

              <div className="relative">

                <button
                  onClick={() =>
                    setProfileOpen(
                      !profileOpen
                    )
                  }
                  className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                >

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">

                    {getOwnerInitial()}

                  </div>

                  <div className="hidden lg:block text-left">

                    <p className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                      {getOwnerName()}
                    </p>

                    <p className="text-xs text-slate-500">
                      Parking Owner
                    </p>

                  </div>

                  <FaChevronDown
                    className={`text-slate-400 text-xs transition-transform ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />

                </button>

                {/* PROFILE DROPDOWN */}

                {profileOpen && (

                  <div className="absolute right-0 top-full mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">

                    <div className="p-5 border-b border-slate-100">

                      <div className="flex items-center gap-3">

                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">

                          {getOwnerInitial()}

                        </div>

                        <div className="min-w-0">

                          <p className="font-bold text-slate-900 truncate">
                            {getOwnerName()}
                          </p>

                          <p className="text-sm text-slate-500 truncate">
                            {getOwnerEmail()}
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="p-2">

                      <button
                        onClick={() => {
                          setProfileOpen(
                            false
                          );
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left"
                      >

                        <FaUserCircle />

                        My Profile

                      </button>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition text-left"
                      >

                        <FaSignOutAlt />

                        Logout

                      </button>

                    </div>

                  </div>

                )}

              </div>

            </div>

            {/* MOBILE MENU BUTTON */}

            <button
              onClick={() =>
                setMobileMenu(
                  !mobileMenu
                )
              }
              className="md:hidden w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600"
            >

              {mobileMenu ? (
                <FaTimes />
              ) : (
                <FaBars />
              )}

            </button>

          </div>

        </div>

        {/* ========================================
            MOBILE MENU
        ======================================== */}

        {mobileMenu && (

          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4">

            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">

              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">

                {getOwnerInitial()}

              </div>

              <div>

                <p className="font-semibold text-slate-900">
                  {getOwnerName()}
                </p>

                <p className="text-sm text-slate-500">
                  {getOwnerEmail()}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                onClick={() => {
                  handleRefresh();
                  setMobileMenu(
                    false
                  );
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600"
              >

                <FaSyncAlt
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh

              </button>

              <button
                onClick={() => {
                  navigate(
                    "/owner/add-parking"
                  );
                  setMobileMenu(
                    false
                  );
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium"
              >

                <FaPlus />

                Add Parking

              </button>

            </div>

            <button
              onClick={() => {
                setMobileMenu(
                  false
                );
                setNotificationOpen(
                  !notificationOpen
                );
              }}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600"
            >

              <FaBell />

              Notifications

              {unreadNotifications >
                0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadNotifications}
                </span>
              )}

            </button>

            <button
              onClick={logout}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600"
            >

              <FaSignOutAlt />

              Logout

            </button>

          </div>

        )}

      </header>

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* PAGE INTRO */}

        <section className="mb-8">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-2">

                <FaChartLine />

                PARKING OVERVIEW

              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">

                Welcome back,{" "}

                <span className="text-blue-600">
                  {getOwnerName()}.
                </span>

              </h2>

              <p className="text-slate-500 mt-3 max-w-2xl">

                Monitor your parking locations,
                verification status and parking
                capacity from one place.

              </p>

            </div>

            <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 shadow-sm">

              {refreshing
                ? "Updating dashboard..."
                : `${totalLocations} parking location${
                    totalLocations !==
                    1
                      ? "s"
                      : ""
                  } found`}

            </div>

          </div>

        </section>

        {/* ========================================
            STATISTICS
        ======================================== */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* LOCATIONS */}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Parking Locations
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                  {totalLocations}
                </h3>

                <p className="text-xs text-slate-400 mt-2">
                  Total locations
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">

                <FaParking />

              </div>

            </div>

          </div>

          {/* TOTAL SLOTS */}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Slots
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                  {totalSlots}
                </h3>

                <p className="text-xs text-slate-400 mt-2">
                  Parking capacity
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">

                <FaCar />

              </div>

            </div>

          </div>

          {/* APPROVED */}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Approved
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                  {approvedParking}
                </h3>

                <p className="text-xs text-green-600 mt-2">
                  Live for customers
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">

                <FaCheckCircle />

              </div>

            </div>

          </div>

          {/* PENDING */}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Pending
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                  {pendingParking}
                </h3>

                <p className="text-xs text-yellow-600 mt-2">
                  Awaiting review
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-xl">

                <FaClock />

              </div>

            </div>

          </div>

        </section>

        {/* ========================================
            SEARCH + FILTER
        ======================================== */}

        {parking.length > 0 && (

          <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

              {/* SEARCH */}

              <div className="relative w-full lg:max-w-md">

                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search parking by name or address..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />

              </div>

              {/* FILTER */}

              <div className="flex flex-wrap items-center gap-2">

                <div className="flex items-center gap-2 text-slate-500 mr-2">

                  <FaFilter />

                  <span className="text-sm font-medium">
                    Filter:
                  </span>

                </div>

                {[
                  "ALL",
                  "APPROVED",
                  "PENDING",
                  "REJECTED",
                ].map((status) => (

                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter ===
                      status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >

                    {status.charAt(
                      0
                    ) +
                      status
                        .slice(1)
                        .toLowerCase()}

                  </button>

                ))}

              </div>

            </div>

          </section>

        )}

        {/* ========================================
            PARKING SECTION HEADER
        ======================================== */}

        <section className="flex items-center justify-between mb-6">

          <div>

            <h3 className="text-2xl font-bold text-slate-900">
              My Parking Locations
            </h3>

            <p className="text-sm text-slate-500 mt-1">

              Showing{" "}
              {filteredParking.length}{" "}
              of {totalLocations}{" "}
              locations

            </p>

          </div>

          <button
            onClick={() =>
              navigate(
                "/owner/add-parking"
              )
            }
            className="hidden sm:flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
          >

            <FaPlus />

            Add New

          </button>

        </section>

        {/* ========================================
            LOADING
        ======================================== */}

        {loading ? (

          <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">

            <div className="w-10 h-10 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

            <p className="text-slate-500 mt-4">
              Loading your parking locations...
            </p>

          </div>

        ) : parking.length === 0 ? (

          /* ======================================
             EMPTY STATE
          ====================================== */

          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center shadow-sm">

            <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">

              <FaParking />

            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-6">
              No parking locations yet
            </h3>

            <p className="text-slate-500 mt-3 max-w-md mx-auto">

              Start growing your parking
              business by adding your first
              parking location.

            </p>

            <button
              onClick={() =>
                navigate(
                  "/owner/add-parking"
                )
              }
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
            >

              <FaPlus />

              Add Your First Parking

            </button>

          </div>

        ) : filteredParking.length ===
          0 ? (

          /* ======================================
             NO SEARCH RESULTS
          ====================================== */

          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl">

              <FaSearch />

            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-5">
              No parking found
            </h3>

            <p className="text-slate-500 mt-2">
              Try changing your search or
              filter.
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

          /* ======================================
             PARKING CARDS
          ====================================== */

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {filteredParking.map(
              (item) => {

                const status =
                  getStatusConfig(
                    item.verification_status
                  );

                return (

                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
                  >

                    {/* CARD HEADER */}

                    <div className="p-6 border-b border-slate-100">

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-4">

                          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">

                            <FaParking />

                          </div>

                          <div>

                            <h3 className="text-xl font-bold text-slate-900">

                              {item.name}

                            </h3>

                            <div className="flex items-start gap-2 text-sm text-slate-500 mt-2">

                              <FaMapMarkerAlt className="mt-1 shrink-0" />

                              <span>

                                {item.address ||
                                  "Address not available"}

                              </span>

                            </div>

                          </div>

                        </div>

                        <span
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.badge}`}
                        >

                          {status.icon}

                          {status.title}

                        </span>

                      </div>

                    </div>

                    {/* CARD BODY */}

                    <div className="p-6">

                      {/* BASIC INFORMATION */}

                      <div className="grid grid-cols-3 gap-3">

                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

                          <p className="text-xs text-slate-500">
                            Total Slots
                          </p>

                          <p className="text-xl font-bold text-slate-900 mt-1">

                            {item.total_slots ||
                              0}

                          </p>

                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

                          <p className="text-xs text-slate-500">
                            Latitude
                          </p>

                          <p className="text-sm font-bold text-slate-900 mt-2 truncate">

                            {item.latitude ||
                              "-"}

                          </p>

                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

                          <p className="text-xs text-slate-500">
                            Longitude
                          </p>

                          <p className="text-sm font-bold text-slate-900 mt-2 truncate">

                            {item.longitude ||
                              "-"}

                          </p>

                        </div>

                      </div>

                      {/* REJECTED */}

                      {item.verification_status ===
                        "REJECTED" && (

                        <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl">

                          <div className="flex gap-3">

                            <FaExclamationTriangle className="text-red-600 mt-1 shrink-0" />

                            <div>

                              <p className="font-semibold text-red-700">
                                Verification Rejected
                              </p>

                              <p className="text-sm text-red-600 mt-1">

                                {item.rejection_reason ||
                                  "No rejection reason was provided."}

                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* PENDING */}

                      {item.verification_status ===
                        "PENDING" && (

                        <div className="mt-5 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">

                          <div className="flex gap-3">

                            <FaClock className="text-yellow-600 mt-1 shrink-0" />

                            <div>

                              <p className="font-semibold text-yellow-700">
                                Verification Pending
                              </p>

                              <p className="text-sm text-yellow-700 mt-1">

                                Your parking location is
                                currently under review by
                                ParkEase.

                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* APPROVED */}

                      {item.verification_status ===
                        "APPROVED" && (

                        <div className="mt-5 p-4 bg-green-50 border border-green-100 rounded-xl">

                          <div className="flex gap-3">

                            <FaCheckCircle className="text-green-600 mt-1 shrink-0" />

                            <div>

                              <p className="font-semibold text-green-700">
                                Parking Approved
                              </p>

                              <p className="text-sm text-green-700 mt-1">

                                Your parking is live and
                                available for customers to
                                discover and book.

                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">

                        <span className="text-xs text-slate-400">

                          Parking ID: #
                          {item.id}

                        </span>

                        <div className="flex flex-wrap gap-2">

                          {/* VIEW */}

                          <button
                            onClick={() =>
                              viewParking(
                                item.id
                              )
                            }
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm font-medium"
                          >

                            <FaEye />

                            View

                          </button>

                          {/* EDIT */}

                          <button
                            onClick={() =>
                              editParking(
                                item.id
                              )
                            }
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition text-sm font-medium"
                          >

                            <FaEdit />

                            Edit

                          </button>

                          {/* DELETE */}

                          <button
                            onClick={() =>
                              deleteParking(
                                item.id
                              )
                            }
                            disabled={deleting}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >

                            <FaTrash />

                            Delete

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </main>

    </div>
  );
}

export default OwnerDashboard;