import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { toast } from "react-hot-toast";

function AddParking() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    total_slots: "",
  });

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      );

      e.target.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "Image size must be less than 5 MB"
      );

      e.target.value = "";

      return;
    }

    // Remove previous preview URL
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // SUBMIT PARKING
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!formData.name.trim()) {
      toast.error("Parking name is required");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Parking address is required");
      return;
    }

    if (
      formData.latitude === "" ||
      formData.longitude === ""
    ) {
      toast.error(
        "Please enter latitude and longitude"
      );

      return;
    }

    if (
      Number.isNaN(
        Number(formData.latitude)
      ) ||
      Number.isNaN(
        Number(formData.longitude)
      )
    ) {
      toast.error(
        "Latitude and longitude must be valid numbers"
      );

      return;
    }

    if (
      !formData.total_slots ||
      Number(formData.total_slots) <= 0
    ) {
      toast.error(
        "Enter a valid number of parking slots"
      );

      return;
    }

    if (!Number.isInteger(Number(formData.total_slots))) {
      toast.error(
        "Total parking slots must be a whole number"
      );

      return;
    }

    if (!image) {
      toast.error(
        "Please upload a parking image"
      );

      return;
    }

    try {
      setLoading(true);

      // -------------------------------------------------
      // CREATE FORMDATA
      // -------------------------------------------------

      const data = new FormData();

      data.append(
        "name",
        formData.name.trim()
      );

      data.append(
        "address",
        formData.address.trim()
      );

      data.append(
        "latitude",
        String(
          Number(formData.latitude)
        )
      );

      data.append(
        "longitude",
        String(
          Number(formData.longitude)
        )
      );

      data.append(
        "total_slots",
        String(
          Number(formData.total_slots)
        )
      );

      data.append(
        "image",
        image
      );

      // -------------------------------------------------
      // DEBUG
      // -------------------------------------------------

      console.log(
        "Submitting parking data:"
      );

      for (const [key, value] of data.entries()) {
        console.log(
          key,
          value
        );
      }

      // -------------------------------------------------
      // API REQUEST
      //
      // IMPORTANT:
      // Do NOT manually set Content-Type here.
      // The browser automatically adds the multipart
      // boundary required by FastAPI.
      // -------------------------------------------------

      const response = await axios.post(
        "/parking/create",
        data
      );

      console.log(
        "Parking created successfully:",
        response.data
      );

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      toast.success(
        response.data?.message ||
          "Parking submitted successfully for verification"
      );

      // Reset form

      setFormData({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        total_slots: "",
      });

      setImage(null);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Redirect to owner dashboard

      setTimeout(() => {
        navigate("/owner");
      }, 1200);

    } catch (error) {
      console.error(
        "Add parking error:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      // -------------------------------------------------
      // FASTAPI VALIDATION ERROR
      // -------------------------------------------------

      if (error.response?.status === 422) {
        const details =
          error.response?.data?.detail;

        console.log(
          "FastAPI validation errors:",
          details
        );

        if (Array.isArray(details)) {
          const errorMessages =
            details
              .map((item) => {
                const field =
                  item.loc?.[
                    item.loc.length - 1
                  ];

                return field
                  ? `${field}: ${item.msg}`
                  : item.msg;
              })
              .join(", ");

          toast.error(
            errorMessages ||
              "Invalid form data"
          );
        } else {
          toast.error(
            "Invalid parking data. Please check all fields."
          );
        }

        return;
      }

      // -------------------------------------------------
      // OTHER ERRORS
      // -------------------------------------------------

      const message =
        error.response?.data?.detail ||
        error.message ||
        "Failed to submit parking";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="max-w-4xl mx-auto">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-6">

          <button
            type="button"
            onClick={() => navigate("/owner")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Add Parking
          </h1>

          <p className="text-gray-500 mt-2">
            Submit your parking location for
            ParkEase verification.
          </p>

        </div>

        {/* ==========================================
            FORM CARD
        ========================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ======================================
                PARKING NAME
            ====================================== */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Parking Name

              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: ParkEase Bangalore Center"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

            </div>

            {/* ======================================
                ADDRESS
            ====================================== */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Complete Parking Address

              </label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="4"
                placeholder="Enter complete parking address"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none resize-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

            </div>

            {/* ======================================
                LOCATION COORDINATES
            ====================================== */}

            <div>

              <div className="flex items-center justify-between mb-2">

                <label className="block text-sm font-semibold text-gray-700">

                  Parking Location

                </label>

                <span className="text-xs text-gray-400">
                  Latitude & Longitude
                </span>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* LATITUDE */}

                <div>

                  <label className="block text-sm text-gray-600 mb-2">

                    Latitude

                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="13.1132"
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />

                </div>

                {/* LONGITUDE */}

                <div>

                  <label className="block text-sm text-gray-600 mb-2">

                    Longitude

                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="77.5304"
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />

                </div>

              </div>

            </div>

            {/* ======================================
                TOTAL SLOTS
            ====================================== */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Total Parking Slots

              </label>

              <input
                type="number"
                min="1"
                step="1"
                name="total_slots"
                value={formData.total_slots}
                onChange={handleChange}
                placeholder="Example: 20"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              <p className="text-xs text-gray-400 mt-2">
                Enter the total number of vehicles your
                parking location can accommodate.
              </p>

            </div>

            {/* ======================================
                PARKING IMAGE
            ====================================== */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Parking Location Image

              </label>

              <p className="text-sm text-gray-500 mb-3">

                Upload a clear image of the parking area.
                This image can be used during verification.

              </p>

              {!preview ? (

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

              ) : (

                <div className="border border-gray-200 rounded-xl p-4">

                  <img
                    src={preview}
                    alt="Parking preview"
                    className="w-full max-h-80 object-cover rounded-xl border border-gray-200"
                  />

                  <div className="flex items-center justify-between gap-3 mt-4">

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-gray-700 truncate">

                        {image?.name}

                      </p>

                      <p className="text-xs text-gray-400 mt-1">

                        {image
                          ? `${(
                              image.size /
                              1024 /
                              1024
                            ).toFixed(2)} MB`
                          : ""}

                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Remove
                    </button>

                  </div>

                </div>

              )}

              <p className="text-xs text-gray-400 mt-3">

                Supported formats: JPG, JPEG, PNG, WEBP.
                Maximum size: 5 MB.

              </p>

            </div>

            {/* ======================================
                VERIFICATION NOTICE
            ====================================== */}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

              <h3 className="font-semibold text-blue-800">

                ParkEase Verification

              </h3>

              <p className="text-sm text-blue-700 mt-2 leading-6">

                After submission, your parking location will
                have a Pending status until a ParkEase
                administrator reviews and verifies the
                information.

              </p>

            </div>

            {/* ======================================
                ACTION BUTTONS
            ====================================== */}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">

              <button
                type="button"
                onClick={() => navigate("/owner")}
                disabled={loading}
                className="sm:w-1/3 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-semibold py-3.5 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="sm:w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-3"
              >

                {loading && (

                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                )}

                {loading
                  ? "Submitting Parking..."
                  : "Submit Parking for Verification"}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default AddParking;