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
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-xs font-bold text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FiEdit2}
              onClick={() => navigate(`/owner/edit-parking/${id}`)}
            >
              Edit Facility
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FiLayers}
              onClick={() => navigate(`/owner/parking/${id}/slots`)}
            >
              Manage Slots
            </Button>
          </div>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !parking ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e0e0e0] space-y-2">
            <p className="text-sm font-bold text-[#0a0a0a]">Facility not found</p>
            <p className="text-xs text-[#737373]">The requested parking location does not exist or has been removed.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Top Image or Hero */}
            {parking.image_url || parking.image ? (
              <div className="relative h-64 bg-[#0a0a0a] overflow-hidden">
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
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-tight">
                    {parking.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#737373] flex items-center gap-1.5 font-medium">
                    <FiMapPin className="text-[#276ef1] w-4 h-4 shrink-0" />
                    <span>{parking.address || parking.location || "City Location"}</span>
                  </p>

                  {/* AMENITIES */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {parking.has_cctv && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#eff6ff] text-[#1e40af] text-[11px] font-semibold border border-[#bfdbfe]">
                        📹 24/7 CCTV
                      </span>
                    )}
                    {parking.has_security_guard && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#f0fdf4] text-[#166534] text-[11px] font-semibold border border-[#bbf7d0]">
                        🛡️ Security Guard
                      </span>
                    )}
                    {parking.has_ev && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#fffbeb] text-[#92400e] text-[11px] font-semibold border border-[#fde68a]">
                        ⚡ EV Ready
                      </span>
                    )}
                    {parking.has_covered_roof && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#faf5ff] text-[#6b21a8] text-[11px] font-semibold border border-[#e9d5ff]">
                        🏢 Covered
                      </span>
                    )}
                    {parking.is_24_7 && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#f0f4ff] text-[#1e3a8a] text-[11px] font-semibold border border-[#c7d2fe]">
                        ⏰ 24/7 Open
                      </span>
                    )}
                    {parking.has_valet && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#fef2f2] text-[#991b1b] text-[11px] font-semibold border border-[#fecaca]">
                        🔑 Valet
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right p-4 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0] shrink-0">
                  <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
                    Hourly Tariff
                  </span>
                  <p className="text-2xl font-black text-[#0a0a0a] mt-0.5">
                    {(parking.hourly_rate ?? -1) === 0 ? "FREE" : `₹${parking.hourly_rate ?? 50}/hr`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#f0f0f0] text-xs">
                <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0]">
                  <span className="text-[#737373] block font-semibold">Total Capacity</span>
                  <span className="text-lg font-black text-[#0a0a0a] mt-1 block">
                    {parking.total_slots || 20} Spots
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0]">
                  <span className="text-[#737373] block font-semibold">GPS Coordinates</span>
                  <span className="text-xs font-mono font-bold text-[#0a0a0a] mt-1 block">
                    {parking.latitude || "19.0760"}, {parking.longitude || "72.8777"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#e0e0e0]">
                  <span className="text-[#737373] block font-semibold">Gate Integration</span>
                  <span className="text-base font-black text-[#05944f] mt-1 flex items-center gap-1.5">
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