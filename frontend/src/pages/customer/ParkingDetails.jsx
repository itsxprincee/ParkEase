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
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <SaaSNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-semibold ${toast.type === "error" ? "bg-white text-[#e11900] border-[#fca5a5]" : "bg-white text-[#05944f] border-[#86efac]"}`}>
            {toast.type === "error" ? <FiAlertCircle className="w-4 h-4 shrink-0" /> : <FiCheckCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* BACK NAV */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e0e0e0] text-xs font-semibold text-[#0a0a0a] hover:border-[#0a0a0a] transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <Badge variant="success" size="sm" dot>
            Verified Facility
          </Badge>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : !parking ? (
          <EmptyState
            icon={FiMapPin}
            title="Facility not found"
            description="This parking location could not be loaded."
            actionLabel="Return to Dashboard"
            onAction={() => navigate("/customer/dashboard")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLS: OVERVIEW, AMENITIES, REVIEWS */}
            <div className="lg:col-span-2 space-y-6">
              {/* HERO CARD */}
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-card">
                <div className="relative h-64 sm:h-80 bg-slate-900 overflow-hidden">
                  {parking.image_url || parking.image ? (
                    <img
                      src={parking.image_url || parking.image}
                      alt={parking.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-tr from-slate-900 to-indigo-950 p-6 text-center">
                      <FiMapPin className="w-12 h-12 text-indigo-400 mb-2" />
                      <span className="text-sm font-semibold text-slate-300">
                        ParkEase Smart Verified Facility
                      </span>
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <Badge variant="primary" size="md">
                      Open 24/7
                    </Badge>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {parking.name || "ParkEase Smart Facility"}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                        <FiMapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          {parking.address || parking.location || "City Center, Prime Hub"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                        <FiStar className="text-amber-500 fill-amber-500" />
                        <span>4.9 (120+ Reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    Equipped with automated license plate recognition (ALPR), high-speed barrier arms, smart LED slot guidance, and 24/7 on-site physical security guards. Reserve in advance to ensure guaranteed slot availability without waiting in queue.
                  </p>
                </div>
              </div>

              {/* AMENITIES */}
              <Card className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Facility Amenities & Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {amenities.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* REVIEWS SECTION */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Driver Reviews & Ratings
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verified customer feedback for this location.
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
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      Be the first driver to leave a review after parking here!
                    </div>
                  ) : (
                    reviews.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {rev.user_name || "Verified Driver"}
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            <FiStar className="fill-amber-500" />
                            <span>{rev.rating || 5}.0</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: BOOKING CARD & RATE */}
            <div className="space-y-6">
              <Card className="sticky top-24 space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Starting Standard Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-indigo-600">
                      ₹50
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      / hour
                    </span>
                  </div>
                </div>

                <div className="space-y-3 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Slot Capacity</span>
                    <span className="font-bold text-slate-800">
                      {parking.total_slots || 20} Spots
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>EV Fast Charging</span>
                    <span className="font-bold text-emerald-600">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Method</span>
                    <span className="font-bold text-slate-800">Digital QR Pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Policy</span>
                    <span className="font-bold text-slate-800">Free Cancellation</span>
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
                  Reserve Spot Now
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                  <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Guaranteed slot reservation with instant entry QR.</span>
                </div>
              </Card>
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
            <label className="text-xs font-semibold text-slate-700">
              Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-xl border text-base transition ${
                    rating >= star
                      ? "bg-amber-50 border-amber-300 text-amber-500"
                      : "bg-slate-50 border-slate-200 text-slate-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Comment
            </label>
            <textarea
              required
              rows={3}
              placeholder="How was the slot availability, lighting, and entry experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
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