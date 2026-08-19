import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiTruck,
  FiGrid,
  FiLogOut,
  FiChevronRight,
  FiHome,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiKey,
} from "react-icons/fi";
import API from "../../api/axios";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = (text, type = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      let currentUser = storedUser ? JSON.parse(storedUser) : null;

      if (currentUser?.role === "owner") {
        navigate("/owner/profile", { replace: true });
        return;
      }

      try {
        const res = await API.get("/auth/me");
        if (res.data) {
          currentUser = res.data;
          localStorage.setItem("user", JSON.stringify(res.data));
          if (currentUser.role === "owner") {
            navigate("/owner/profile", { replace: true });
            return;
          }
        }
      } catch {
        // Fallback to local storage
      }

      setUser(currentUser);
      if (currentUser) {
        setName(currentUser.name || "");
        setEmail(currentUser.email || "");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const getUserName = () => {
    if (!user) return "Customer";
    return (
      user.name ||
      user.full_name ||
      user.username ||
      user.email?.split("@")[0] ||
      "Customer"
    );
  };

  const getInitial = () => {
    return getUserName().charAt(0).toUpperCase();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification("Please enter your name.", "error");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await API.put("/auth/profile", {
        name: name.trim(),
        email: email.trim(),
      });

      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      showNotification(
        err?.response?.data?.detail || "Failed to update profile.",
        "error"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showNotification("Please enter your current password.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showNotification("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("New passwords do not match.", "error");
      return;
    }

    try {
      setSavingPassword(true);
      await API.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      showNotification("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showNotification(
        err?.response?.data?.detail || "Failed to change password.",
        "error"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const actions = [
    {
      title: "Find Parking",
      description: "Explore available parking spaces",
      icon: <FiMapPin />,
      action: () => navigate("/customer/dashboard"),
    },
    {
      title: "My Bookings",
      description: "View and manage your reservations",
      icon: <FiCalendar />,
      action: () => navigate("/customer/my-bookings"),
    },
    {
      title: "My Vehicles",
      description: "Add and manage your fleet",
      icon: <FiTruck />,
      action: () => navigate("/customer/my-vehicles"),
    },
    {
      title: "Parking QR",
      description: "Access your active digital pass",
      icon: <FiGrid />,
      action: () => navigate("/customer/qr"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FiMapPin size={20} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                ParkEase
              </h1>
              <p className="text-xs text-slate-500">Smart Customer Portal</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/customer/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <FiHome /> Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* NOTIFICATION */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 shadow-sm ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <FiCheckCircle className="text-emerald-600 text-lg shrink-0" />
            ) : (
              <FiAlertCircle className="text-red-600 text-lg shrink-0" />
            )}
            <p className="text-xs font-semibold">{notification.text}</p>
          </div>
        )}

        {/* PROFILE BANNER */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-blue-500/20">
              {getInitial()}
            </div>

            <div className="flex-1">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Customer Account
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {getUserName()}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <FiMail className="text-blue-600" />
                <span>{user?.email || "Email not available"}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-extrabold">
              Active Member
            </div>
          </div>
        </section>

        {/* EDIT DETAILS & SECURITY */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PROFILE EDIT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
                <FiUser />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Personal Information</h3>
                <p className="text-[11px] text-slate-500">Update your account identity</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiSave /> {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </form>
          </div>

          {/* CHANGE PASSWORD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base">
                <FiLock />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Change Password</h3>
                <p className="text-[11px] text-slate-500">Manage account security</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiKey /> {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

        </section>

        {/* QUICK ACCESS */}
        <section className="mt-10">
          <h2 className="text-base font-extrabold text-slate-900 mb-4">
            Quick Customer Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 text-left hover:border-blue-400 hover:shadow-md transition group shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <FiChevronRight className="text-slate-400 group-hover:text-blue-600 transition" />
              </button>
            ))}
          </div>
        </section>

        {/* LOGOUT */}
        <section className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <FiLogOut /> Sign Out from Account
          </button>
        </section>

      </main>
    </div>
  );
};

export default Profile;