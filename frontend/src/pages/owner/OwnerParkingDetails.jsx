import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiLayers,
  FiEdit2,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiZap,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
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
        const res = await API.get(`/parking/${id}`);
        setParking(res.data);
      } catch (e) {
        console.error("Load owner parking details error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <SaaSNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
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
              Edit Details
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
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-400">Facility not found</p>
          </div>
        ) : (
          <Card className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant={parking.is_approved ? "success" : "warning"}
                  size="sm"
                  dot
                >
                  {parking.is_approved ? "Verified & Live" : "Pending Verification"}
                </Badge>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                  {parking.name}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <FiMapPin className="text-indigo-600 w-3.5 h-3.5" />
                  <span>{parking.address || parking.location || "City Location"}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400">Rate</span>
                <p className="text-2xl font-black text-indigo-600">₹50/hr</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">Total Capacity</span>
                <span className="text-base font-extrabold text-slate-900 mt-1 block">
                  {parking.total_slots || 20} Spots
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">GPS Coordinates</span>
                <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
                  {parking.latitude || "19.0760"}, {parking.longitude || "72.8777"}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">Gate Integration</span>
                <span className="text-base font-extrabold text-emerald-600 mt-1 block">
                  QR Scanner Enabled
                </span>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}