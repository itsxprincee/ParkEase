import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiLayers,
  FiEdit2,
  FiGrid,
  FiCheckCircle,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { CardSkeleton } from "../../components/Skeleton";

export default function OwnerParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/parking/owner/${id}`);
        setParking(res.data);
      } catch (e) {
        console.error("Load owner parking details error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const status = (parking?.verification_status || parking?.status || "PENDING").toUpperCase();
  const isApproved = status === "APPROVED" || Boolean(parking?.is_approved);
  const isRejected = status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FiEdit2}
              onClick={() => navigate(`/owner/edit-parking/${id}`)}
            >
              Edit Location
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FiLayers}
              onClick={() => navigate(`/owner/parking/${id}/slots`)}
            >
              Manage Spots
            </Button>
          </div>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !parking ? (
          <div className="text-center py-16 bg-white/95 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 space-y-2 p-8 shadow-xl">
            <p className="text-sm font-black text-zinc-900 dark:text-white">Parking location not found</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">The requested parking location does not exist or has been removed.</p>
          </div>
        ) : (
          <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Top Image or Hero */}
            {parking.image_url || parking.image ? (
              <div className="relative h-64 bg-zinc-950 overflow-hidden">
                <img
                  src={parking.image_url || parking.image}
                  alt={parking.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge
                    variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                    size="sm"
                    dot
                  >
                    {isApproved
                      ? "Verified & Live"
                      : isRejected
                      ? "Rejected by Admin"
                      : "Pending Verification"}
                  </Badge>
                </div>
              </div>
            ) : null}

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  {!(parking.image_url || parking.image) && (
                    <Badge
                      variant={isApproved ? "success" : isRejected ? "danger" : "warning"}
                      size="sm"
                      dot
                    >
                      {isApproved
                        ? "Verified & Live"
                        : isRejected
                        ? "Rejected by Admin"
                        : "Pending Verification"}
                    </Badge>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {parking.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                    <FiMapPin className="text-emerald-500 w-4 h-4 shrink-0" />
                    <span>{parking.address || parking.location || "City Location"}</span>
                  </p>

                  {/* AMENITIES */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {parking.has_cctv && (
                      <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20">
                        📹 24/7 CCTV
                      </span>
                    )}
                    {parking.has_security_guard && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                        🛡️ Security Guard
                      </span>
                    )}
                    {parking.has_ev && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
                        ⚡ EV Charging
                      </span>
                    )}
                    {parking.has_covered_roof && (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold border border-purple-500/20">
                        🏢 Covered Roof
                      </span>
                    )}
                    {parking.is_24_7 && (
                      <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-bold border border-sky-500/20">
                        ⏰ 24/7 Open
                      </span>
                    )}
                    {parking.has_valet && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
                        🔑 Valet
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Price per Hour
                  </span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {(parking.hourly_rate ?? -1) === 0 ? "FREE" : `₹${parking.hourly_rate ?? 50}/hr`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <span className="text-zinc-500 dark:text-zinc-400 block font-bold">Total Spots</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block font-mono">
                    {parking.total_slots || 20} Spots
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <span className="text-zinc-500 dark:text-zinc-400 block font-bold">GPS Location</span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white mt-1 block">
                    {parking.latitude || "19.0760"}, {parking.longitude || "72.8777"}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <span className="text-zinc-500 dark:text-zinc-400 block font-bold">Gate Check-in</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <FiCheckCircle className="w-4 h-4 shrink-0" />
                    QR Scanner Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}