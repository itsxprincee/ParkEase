import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";

function ParkingDetails() {
  const { id } = useParams();

  const [parking, setParking] = useState(null);

  const [reviews, setReviews] = useState([]);

  const [average, setAverage] = useState(0);

  const [totalReviews, setTotalReviews] = useState(0);

  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  useEffect(() => {
    loadParking();
    loadReviews();
  }, [id]);

  const loadParking = async () => {
    const res = await API.get("/parking");

    const place = res.data.find(
      (p) => p.id === Number(id)
    );

    setParking(place);
  };

  const loadReviews = async () => {
    try {
      const res = await API.get(`/review/${id}`);

      setReviews(res.data.reviews);
      setAverage(res.data.average_rating);
      setTotalReviews(res.data.total_reviews);
    } catch (err) {
      console.log(err);
    }
  };

  const submitReview = async () => {
    try {
      const res = await API.post("/review/add", {
        parking_id: Number(id),
        rating,
        comment,
      });

      alert(res.data.message);

      setComment("");
      setRating(5);

      loadReviews();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Review failed"
      );
    }
  };

  if (!parking) {
    return <h2 className="text-center mt-10">Loading...</h2>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-4xl font-bold">
        {parking.name}
      </h1>

      <p className="mt-3">
        📍 {parking.address}
      </p>

      <p className="mt-2">
        🚗 Total Slots: {parking.total_slots}
      </p>

      <p className="text-green-600 font-bold">
        Available: {parking.available_slots}
      </p>

      <div className="bg-white shadow rounded-xl p-6 mt-10">

        <h2 className="text-2xl font-bold">
          ⭐ Reviews
        </h2>

        <p className="mt-2">
          Average Rating: <strong>{average}</strong>/5
        </p>

        <p>
          Total Reviews: {totalReviews}
        </p>

        <div className="mt-6">

          <select
            value={rating}
            onChange={(e) =>
              setRating(Number(e.target.value))
            }
            className="border p-2 rounded w-full"
          >
            <option value={5}>⭐⭐⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐</option>
            <option value={3}>⭐⭐⭐</option>
            <option value={2}>⭐⭐</option>
            <option value={1}>⭐</option>
          </select>

          <textarea
            className="border rounded w-full mt-4 p-3"
            rows={4}
            placeholder="Write your review..."
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
          />

          <button
            onClick={submitReview}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Submit Review
          </button>

        </div>

        <div className="mt-10 space-y-4">

          {reviews.map((review) => (

            <div
              key={review.id}
              className="border rounded-lg p-4"
            >

              <p className="font-bold">
                ⭐ {review.rating}/5
              </p>

              <p className="mt-2">
                {review.comment}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default ParkingDetails;