import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiShield,
  FiZap,
  FiTruck,
  FiCheckCircle,
  FiStar,
  FiMessageSquare,
  FiNavigation,
  FiShare2,
  FiDollarSign,
  FiPhone,
  FiLayers,
  FiArrowRight,
} from "react-icons/fi";
import API from "../../api/axios";
import SaaSNavbar from "../../components/SaaSNavbar";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Card } from "../../components/Card";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeleton";

export default function ParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [parking, setParking] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState("ENTRANCE"); // "ENTRANCE" | "INSIDE"

  // Review submission
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadParking = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/parking/${id}`);
      setParking(response.data);

      try {
        const revRes = await API.get(`/parking/${id}/reviews`);
        setReviews(Array.isArray(revRes.data) ? revRes.data : []);
      } catch (e) {
        // reviews optional
      }
    } catch (error) {
      console.error("Failed to load facility:", error);
      showToast("Unable to load facility details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParking();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast("Please write a comment for your review.", "error");
      return;
    }

    try {
      setSubmittingReview(true);
      await API.post(`/parking/${id}/reviews`, { rating, comment });
      showToast("Thank you! Review submitted successfully.", "success");
      setShowReviewModal(false);
      setComment("");
      setRating(5);
      loadParking();
    } catch (error) {
      console.error("Review submission error:", error);
      showToast(
        error?.response?.data?.detail || "Failed to submit review.",
        "error"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const amenities = [
    { icon: FiShield, title: "24/7 Security & CCTV", desc: "Monitored premises" },
    { icon: FiZap, title: "EV Rapid Charging", desc: "Fast charge stations" },
    { icon: FiClock, title: "Open 24 Hours", desc: "Instant gate access" },
    { icon: FiTruck, title: "Valet & Multi-Size Spots", desc: "Car, SUV & Bike" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0f] flex flex-col font-sans transition-colors relative selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold ${
              toast.type === "error"
                ? "bg-white/95 dark:bg-zinc-900/95 text-red-600 border-red-200 dark:border-red-900/50"
                : "bg-white/95 dark:bg-zinc-900/95 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* BACK NAV */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-white hover:border-zinc-400 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Parking Search</span>
          </button>

          <Badge variant="success" size="sm" dot>
            Verified Location
          </Badge>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !parking ? (
          <EmptyState
            icon={FiMapPin}
            title="Parking location not found"
            description="This parking location could not be loaded."
            actionLabel="Return to Search"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLS: OVERVIEW, AMENITIES, REVIEWS */}
            <div className="lg:col-span-2 space-y-6">
              {/* HERO CARD */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                {/* DUAL PHOTO GALLERY: ENTRANCE & INSIDE */}
                <div className="relative h-64 sm:h-80 bg-zinc-950 overflow-hidden group">
                  {(() => {
                    const entranceImg = parking.image_url || parking.image;
                    const insideImg = parking.inside_image_url || parking.inside_image;
                    const activeSrc = activePhoto === "INSIDE" ? (insideImg || entranceImg) : (entranceImg || insideImg);

                    if (activeSrc) {
                      return (
                        <img
                          src={activeSrc}
                          alt={`${parking.name} - ${activePhoto === "INSIDE" ? "Inside View" : "Entrance View"}`}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                      );
                    }
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-gradient-to-tr from-zinc-950 to-zinc-900 p-6 text-center">
                        <FiMapPin className="w-12 h-12 text-emerald-500 mb-2" />
                        <span className="text-sm font-black text-zinc-300">
                          ParkEase Verified Location
                        </span>
                      </div>
                    );
                  })()}

                  {/* Top Status & Verification Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Badge variant="success" size="md">
                      Open 24/7
                    </Badge>
                    <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                      {activePhoto === "INSIDE" ? "🏢 Inside View" : "🚪 Entrance Gate"}
                    </span>
                  </div>

                  {/* Top Right Photo Switcher Pills */}
                  {(parking.image || parking.image_url || parking.inside_image || parking.inside_image_url) && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl">
                      <button
                        type="button"
                        onClick={() => setActivePhoto("ENTRANCE")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activePhoto === "ENTRANCE"
                            ? "bg-emerald-500 text-black shadow-md font-black"
                            : "text-zinc-300 hover:text-white"
                        }`}
                      >
                        <span>🚪 Entrance</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhoto("INSIDE")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activePhoto === "INSIDE"
                            ? "bg-cyan-500 text-black shadow-md font-black"
                            : "text-zinc-300 hover:text-white"
                        }`}
                      >
                        <span>🏢 Inside</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Subtitle Pill on Image */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-zinc-200 text-xs font-medium border border-white/10">
                      {activePhoto === "INSIDE"
                        ? "🅿️ Inside parking bays & layout — Navigate to your spot"
                        : "📍 Street & gate entrance — Spot your parking from the road"}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {parking.name || "Parking Location"}
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
                        <FiMapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {parking.address || parking.location || "City Location"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
                        <FiStar className="text-amber-500 fill-amber-500" />
                        <span>4.9 (120+ Reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    Fast barrier gate entry, automated QR scanning, clean covered spots, and 24/7 security guard. Book in advance to guarantee your parking spot with zero waiting.
                  </p>
                </div>
              </div>

              {/* AMENITIES */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
                <h3 className="text-base font-black text-zinc-900 dark:text-white">
                  Amenities & Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {amenities.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REVIEWS SECTION */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white">
                      Customer Reviews
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Verified feedback from drivers who parked here.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={FiMessageSquare}
                    onClick={() => setShowReviewModal(true)}
                  >
                    Write Review
                  </Button>
                </div>

                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                      Be the first driver to leave a review after parking here!
                    </div>
                  ) : (
                    reviews.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            {rev.user_name || "Verified Driver"}
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                            <FiStar className="fill-amber-500" />
                            <span>{rev.rating || 5}.0</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BOOKING CARD & RATE */}
            <div className="space-y-6">
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] sticky top-24 space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Starting Price
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{parking.hourly_rate || 40}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      / hour
                    </span>
                  </div>
                </div>

                <div className="space-y-3 py-3 border-y border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span>Total Spots</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {parking.total_slots || 20} Spots
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>EV Fast Charging</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Method</span>
                    <span className="font-bold text-zinc-900 dark:text-white">Digital QR Pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Policy</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Free Cancellation</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconRight={FiArrowRight}
                  onClick={() =>
                    navigate(`/customer/parking/${parking.id}/book`, {
                      state: { parking },
                    })
                  }
                >
                  Book Spot Now
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 text-center">
                  <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Guaranteed parking spot with instant QR pass.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REVIEW MODAL */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Leave a Review"
        subtitle={`Share your experience at ${parking?.name || "this location"}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2.5 rounded-2xl border text-lg transition cursor-pointer ${
                    rating >= star
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-500"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Your Review
            </label>
            <textarea
              required
              rows={3}
              placeholder="How was the spot availability, safety, and check-in experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="pe-input text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={submittingReview}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}