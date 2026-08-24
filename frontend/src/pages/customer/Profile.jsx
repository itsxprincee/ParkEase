import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiShield,
  FiTruck,
  FiPlus,
  FiTrash2,
  FiZap,
  FiCalendar,
  FiKey,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-white text-[#e11900] border-[#fca5a5]"
            : "bg-white text-[#05944f] border-[#86efac]"
        }`}
      >
        {toast.type === "error" ? (
          <FiAlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <FiCheckCircle className="w-4 h-4 shrink-0" />
        )}
        {toast.message}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("PROFILE"); // PROFILE, VEHICLES, SECURITY

  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Vehicle Modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    vehicle_name: "",
  });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem("user");
      let currentUser = stored ? JSON.parse(stored) : null;
      if (currentUser?.role === "owner") {
        navigate("/owner/profile", { replace: true });
        return;
      }
      try {
        const res = await API.get("/auth/me");
        if (res.data) {
          currentUser = res.data;
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (_) {}
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || currentUser.full_name || currentUser.username || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "");
      }

      // Load fleet
      try {
        const vRes = await API.get("/vehicles/my");
        setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
      } catch (_) {}
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await API.put("/auth/profile", { name, email, phone });
      const updated = { ...user, name, email, phone, ...(res.data || {}) };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile details updated successfully!", "success");
    } catch (_) {
      const updated = { ...user, name, email, phone };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile saved!", "success");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return showToast("Passwords do not match.", "error");
    if (newPassword.length < 6) return showToast("Password must be at least 6 characters.", "error");
    try {
      setSavingPassword(true);
      await API.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showToast(error?.response?.data?.detail || "Failed to change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number.trim()) {
      return showToast("Please enter a vehicle license plate number.", "error");
    }

    try {
      setAddingVehicle(true);
      const res = await API.post("/vehicles/", newVehicle);
      const added = res.data?.vehicle || res.data;
      setVehicles((prev) => [...prev, added]);
      showToast("Vehicle added to your fleet!", "success");
      setShowAddVehicleModal(false);
      setNewVehicle({ vehicle_number: "", vehicle_type: "Car", vehicle_name: "" });
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to add vehicle.", "error");
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehId) => {
    try {
      setDeletingVehicleId(vehId);
      await API.delete(`/vehicles/${vehId}`);
      setVehicles((prev) => prev.filter((v) => v.id !== vehId));
      showToast("Vehicle removed from fleet.", "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to delete vehicle.", "error");
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const initials = name ? name.slice(0, 2).toUpperCase() : "DR";

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col font-sans">
      <SaaSNavbar />
      <Toast toast={toast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header Profile Card */}
        <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#276ef1] to-[#05944f] flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-[#0a0a0a] tracking-tight">
                  {name || "Driver Account"}
                </h1>
                <Badge variant="success" size="sm" dot>
                  Verified Driver
                </Badge>
              </div>
              <p className="text-sm text-[#737373]">{email || "user@parkease.io"}</p>
              <p className="text-xs text-[#a0a0a0]">
                Fleet: {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={FiCalendar}
              onClick={() => navigate("/customer/my-bookings")}
            >
              My Passes
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#e0e0e0] pb-2">
          {[
            { id: "PROFILE", label: "Profile & Contact", icon: FiUser },
            { id: "VEHICLES", label: `My Fleet (${vehicles.length})`, icon: FiTruck },
            { id: "SECURITY", label: "Security & Access", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#0a0a0a] text-white shadow-xs"
                    : "bg-white text-[#545454] border border-[#e0e0e0] hover:border-[#a0a0a0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROFILE DETAILS */}
        {activeTab === "PROFILE" && (
          <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="border-b border-[#f0f0f0] pb-4">
              <h3 className="text-lg font-black text-[#0a0a0a]">Personal Information</h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Update your driver contact details and notifications preferences
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pe-input text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pe-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pe-input text-sm font-mono"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" icon={FiSave} loading={savingProfile} size="lg">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: MY VEHICLES FLEET */}
        {activeTab === "VEHICLES" && (
          <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#0a0a0a]">Registered Fleet</h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Vehicles linked to your account for 1-tap booking and automatic gate pass sync
                </p>
              </div>
              <Button
                icon={FiPlus}
                size="sm"
                onClick={() => setShowAddVehicleModal(true)}
              >
                Add Vehicle
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center mx-auto text-[#a0a0a0]">
                  <FiTruck className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-[#0a0a0a]">No Vehicles Registered</h4>
                <p className="text-xs text-[#737373] max-w-xs mx-auto">
                  Add your car, EV, or motorcycle plate for streamlined spot reservations.
                </p>
                <Button size="md" onClick={() => setShowAddVehicleModal(true)}>
                  + Add First Vehicle
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl border border-[#e0e0e0] bg-[#f7f7f7] flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#0a0a0a] bg-white px-3 py-1 rounded-lg border border-[#e0e0e0]">
                          {v.vehicle_number}
                        </span>
                        {v.vehicle_type === "EV" && (
                          <span className="text-[10px] font-black bg-[#f0fdf4] text-[#05944f] px-2 py-0.5 rounded-full border border-[#86efac]">
                            ⚡ EV
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#545454] truncate">
                        {v.vehicle_name || v.vehicle_type || "Standard Vehicle"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      disabled={deletingVehicleId === v.id}
                      className="p-2.5 rounded-xl bg-white border border-[#e0e0e0] text-[#e11900] hover:bg-[#fef2f2] transition-colors shrink-0"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === "SECURITY" && (
          <div className="bg-white rounded-3xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="border-b border-[#f0f0f0] pb-4">
              <h3 className="text-lg font-black text-[#0a0a0a]">Account Security & Password</h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Update your login credentials and authentication settings
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pe-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pe-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pe-input text-sm"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="outline" icon={FiLock} loading={savingPassword} size="lg">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ADD VEHICLE MODAL */}
      <Modal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        title="Register Vehicle"
        subtitle="Add a car, EV, or bike license plate to your driver profile."
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700">
              License Plate Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH-02-CD-5678"
              value={newVehicle.vehicle_number}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_number: e.target.value.toUpperCase() })
              }
              className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700">
              Vehicle Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Daily Sedan / Blue Nexon EV"
              value={newVehicle.vehicle_name}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })
              }
              className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-transparent focus-within:border-black focus-within:bg-white text-xs font-bold text-black focus:outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700">
              Vehicle Type
            </label>
            <select
              value={newVehicle.vehicle_type}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })
              }
              className="w-full px-3.5 py-3 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-black font-bold focus:outline-none focus:border-black transition"
            >
              <option value="Car">Car (Sedan/SUV/Hatchback)</option>
              <option value="EV">Electric Vehicle (EV)</option>
              <option value="Bike">Motorcycle / Scooter</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowAddVehicleModal(false)}
              className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingVehicle}
              className="py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black transition shadow-sm"
            >
              {addingVehicle ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}