import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaParking,
  FaStar,
  FaTimes,
} from "react-icons/fa";

import API from "../../api/axios";

function ParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [parking, setParking] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [toast, setToast] = useState(null);

  // =========================================================
  // TOAST
  // =========================================================

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // =========================================================
  // LOAD PARKING
  // =========================================================

  const loadParking = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/parking/${id}`);

      setParking(response.data);
    } catch (error) {
      console.error("Failed to load parking:", error);

      showToast(
        error?.response?.data?.detail ||
          "Unable to load parking details.",
        "error"
      );

      setParking(null);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD REVIEWS
  // =========================================================

  const loadReviews = async () => {
    try {
      setReviewLoading(true);

      const response = await API.get(`/review/${id}`);

      setReviews(response.data?.reviews || []);
      setAverage(response.data?.average_rating || 0);
      setTotalReviews(response.data?.total_reviews || 0);
    } catch (error) {
      console.error("Failed to load reviews:", error);

      setReviews([]);
      setAverage(0);
      setTotalReviews(0);
    } finally {
      setReviewLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadParking();

    setReviews([]);
    setAverage(0);
    setTotalReviews(0);

    setShowReviews(false);
    setShowReviewForm(false);
  }, [id]);

  // =========================================================
  // OPEN / CLOSE REVIEWS
  // =========================================================

  const handleToggleReviews = async () => {
    if (!showReviews) {
      await loadReviews();
    }

    setShowReviews((previous) => !previous);
  };

  // =========================================================
  // SUBMIT REVIEW
  // =========================================================

  const submitReview = async () => {
    if (!comment.trim()) {
      showToast(
        "Please write a review comment.",
        "error"
      );

      return;
    }

    try {
      setSubmittingReview(true);

      const response = await API.post(
        "/review/add",
        {
          parking_id: Number(id),
          rating,
          comment: comment.trim(),
        }
      );

      showToast(
        response.data?.message ||
          "Review submitted successfully."
      );

      setComment("");
      setRating(5);

      setShowReviewForm(false);

      await loadReviews();
    } catch (error) {
      console.error("Review failed:", error);

      showToast(
        error?.response?.data?.detail ||
          "Unable to submit your review.",
        "error"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // =========================================================
  // PARKING DETAILS
  // =========================================================

  const parkingName = useMemo(() => {
    return (
      parking?.name ||
      parking?.parking_name ||
      "Parking Location"
    );
  }, [parking]);

  const parkingAddress = useMemo(() => {
    return (
      parking?.address ||
      parking?.location ||
      "Address not available"
    );
  }, [parking]);

  const availableSlots = useMemo(() => {
    const value =
      parking?.available_slots ??
      parking?.availableSlots ??
      0;

    return Number(value);
  }, [parking]);

  const totalSlots = useMemo(() => {
    const value =
      parking?.total_slots ??
      parking?.totalSlots ??
      0;

    return Number(value);
  }, [parking]);

  // =========================================================
  // BOOK PARKING
  // =========================================================

  const handleBookParking = () => {
    if (availableSlots <= 0) {
      showToast(
        "Sorry, no parking slots are currently available.",
        "error"
      );

      return;
    }

    // This route must exist in App.jsx
    navigate(`/customer/parking/${id}/book`, {
      state: {
        parking,
        parkingId: Number(id),
      },
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />

          <p className="mt-4 text-slate-500">
            Loading parking details...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!parking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-2xl">
            <FaExclamationTriangle />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-5">
            Parking not found
          </h2>

          <p className="text-slate-500 mt-2">
            This parking location may no longer be available.
          </p>

          <button
            onClick={() =>
              navigate("/customer/dashboard")
            }
            className="mt-6 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* TOAST */}

      {toast && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px]">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-xl ${
              toast.type === "success"
                ? "bg-white border-green-200"
                : "bg-white border-red-200"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                toast.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {toast.type === "success" ? (
                <FaCheckCircle />
              ) : (
                <FaExclamationTriangle />
              )}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {toast.type === "success"
                  ? "Success"
                  : "Something went wrong"}
              </p>

              <p className="text-sm text-slate-500 mt-1">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center"
            >
              <FaArrowLeft />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-600 text-white items-center justify-center">
                <FaParking />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  ParkEase
                </p>

                <p className="font-bold text-slate-900">
                  Parking Details
                </p>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HERO */}

        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-10">

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

              <div className="flex gap-5">

                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-blue-200">
                  <FaParking />
                </div>

                <div>

                  <div className="flex flex-wrap items-center gap-3">

                    <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
                      {parkingName}
                    </h1>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        availableSlots > 0
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {availableSlots > 0
                        ? `${availableSlots} Slots Available`
                        : "Currently Full"}
                    </span>

                  </div>

                  <div className="flex items-start gap-2 mt-4 text-slate-500">

                    <FaMapMarkerAlt className="text-blue-600 mt-1 shrink-0" />

                    <p>
                      {parkingAddress}
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={handleBookParking}
                disabled={availableSlots <= 0}
                className={`w-full lg:w-auto px-7 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                  availableSlots > 0
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <FaCalendarAlt />

                {availableSlots > 0
                  ? "Book Parking"
                  : "No Slots Available"}

              </button>

            </div>

            {/* STATS */}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10">

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">

                <div className="flex items-center gap-3 text-slate-500">
                  <FaParking className="text-blue-600" />

                  <span className="text-sm">
                    Total Slots
                  </span>
                </div>

                <p className="text-3xl font-bold text-slate-900 mt-3">
                  {totalSlots}
                </p>

              </div>

              <div className="rounded-2xl bg-green-50 border border-green-100 p-5">

                <div className="flex items-center gap-3 text-green-600">
                  <FaCheckCircle />

                  <span className="text-sm">
                    Available Now
                  </span>
                </div>

                <p className="text-3xl font-bold text-green-700 mt-3">
                  {availableSlots}
                </p>

              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 col-span-2 sm:col-span-1">

                <div className="flex items-center gap-3 text-amber-600">
                  <FaStar />

                  <span className="text-sm">
                    Rating
                  </span>
                </div>

                <p className="text-3xl font-bold text-amber-700 mt-3">
                  {Number(average || 0).toFixed(1)}

                  <span className="text-base text-amber-500">
                    /5
                  </span>
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* BOOKING INFORMATION */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

          <div className="bg-white border border-slate-200 rounded-2xl p-6">

            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaCalendarAlt />
            </div>

            <h3 className="font-bold text-slate-900 mt-4">
              Reserve Your Slot
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Select your preferred parking time and vehicle.
            </p>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">

            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FaCar />
            </div>

            <h3 className="font-bold text-slate-900 mt-4">
              Secure Parking
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Your booking details are securely saved in ParkEase.
            </p>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">

            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FaClock />
            </div>

            <h3 className="font-bold text-slate-900 mt-4">
              Easy Check-in
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Access your booking and QR details from My Bookings.
            </p>

          </div>

        </section>

        {/* REVIEWS SECTION */}

        <section className="bg-white border border-slate-200 rounded-3xl mt-8 overflow-hidden shadow-sm">

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <FaStar />
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Customer Reviews
                  </h2>

                  <p className="text-sm text-slate-500">
                    View ratings and experiences from other users.
                  </p>

                </div>

              </div>

            </div>

            <button
              onClick={handleToggleReviews}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              {showReviews
                ? "Hide Reviews"
                : "View Reviews"}
            </button>

          </div>

          {showReviews && (

            <div className="border-t border-slate-100 p-6 sm:p-8">

              {/* REVIEW SUMMARY */}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">

                <div className="flex items-center gap-4">

                  <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-600 flex flex-col items-center justify-center">

                    <span className="text-2xl font-bold">
                      {Number(average || 0).toFixed(1)}
                    </span>

                    <span className="text-xs">
                      out of 5
                    </span>

                  </div>

                  <div>

                    <div className="flex text-amber-400 gap-1">

                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} />
                      ))}

                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      Based on {totalReviews} review
                      {totalReviews !== 1 ? "s" : ""}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setShowReviewForm((previous) => !previous)
                  }
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  {showReviewForm
                    ? "Cancel"
                    : "Write a Review"}
                </button>

              </div>

              {/* REVIEW FORM */}

              {showReviewForm && (

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8">

                  <h3 className="font-bold text-slate-900">
                    Share Your Experience
                  </h3>

                  <div className="mt-5">

                    <label className="text-sm font-medium text-slate-700">
                      Your Rating
                    </label>

                    <div className="flex gap-2 mt-3">

                      {[1, 2, 3, 4, 5].map((star) => (

                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl transition ${
                            star <= rating
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}
                        >
                          <FaStar />
                        </button>

                      ))}

                    </div>

                  </div>

                  <textarea
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value)
                    }
                    rows={5}
                    placeholder="Tell others about your parking experience..."
                    className="w-full mt-5 p-4 rounded-xl border border-slate-200 outline-none resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />

                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {submittingReview
                      ? "Submitting..."
                      : "Submit Review"}
                  </button>

                </div>

              )}

              {/* REVIEW LIST */}

              {reviewLoading ? (

                <div className="py-12 text-center">

                  <div className="w-10 h-10 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

                  <p className="text-sm text-slate-500 mt-4">
                    Loading reviews...
                  </p>

                </div>

              ) : reviews.length === 0 ? (

                <div className="border border-dashed border-slate-300 rounded-2xl py-12 text-center">

                  <FaStar className="text-3xl text-slate-300 mx-auto" />

                  <h3 className="font-bold text-slate-900 mt-4">
                    No reviews yet
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    No reviews have been submitted for this parking location.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {reviews.map((review) => (

                    <div
                      key={review.id}
                      className="border border-slate-200 rounded-2xl p-5"
                    >

                      <div className="flex items-center gap-1 text-amber-400">

                        {[1, 2, 3, 4, 5].map((star) => (

                          <FaStar
                            key={star}
                            className={
                              star <= Number(review.rating)
                                ? ""
                                : "text-slate-200"
                            }
                          />

                        ))}

                      </div>

                      <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                        {review.comment ||
                          "No comment provided."}
                      </p>

                    </div>

                  ))}

                </div>

              )}

            </div>

          )}

        </section>

      </main>
    </div>
  );
}

export default ParkingDetails;