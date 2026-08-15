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

  // =====================================================
  // IMAGE STATE
  // =====================================================

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState("");

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] = useState(false);


  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };


  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {

    const file =
      e.target.files?.[0];


    if (!file) {
      return;
    }


    // ---------------------------------------------------
    // ALLOWED IMAGE TYPES
    // ---------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

      toast.error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      );


      e.target.value = "";

      return;
    }


    // ---------------------------------------------------
    // IMAGE SIZE
    // ---------------------------------------------------

    if (file.size > 5 * 1024 * 1024) {

      toast.error(
        "Image size must be less than 5 MB"
      );


      e.target.value = "";

      return;
    }


    // ---------------------------------------------------
    // SAVE IMAGE
    // ---------------------------------------------------

    setImage(file);


    // ---------------------------------------------------
    // PREVIEW
    // ---------------------------------------------------

    const imageUrl =
      URL.createObjectURL(file);


    setPreview(imageUrl);

  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    // ===================================================
    // VALIDATION
    // ===================================================

    if (!formData.name.trim()) {

      toast.error(
        "Parking name is required"
      );

      return;
    }


    if (!formData.address.trim()) {

      toast.error(
        "Parking address is required"
      );

      return;
    }


    if (
      !formData.latitude ||
      !formData.longitude
    ) {

      toast.error(
        "Please enter the parking location"
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


    if (!image) {

      toast.error(
        "Please upload a parking image"
      );

      return;
    }


    // ===================================================
    // SUBMIT TO BACKEND
    // ===================================================

    try {

      setLoading(true);


      // -------------------------------------------------
      // CREATE MULTIPART FORM DATA
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
        formData.latitude
      );


      data.append(
        "longitude",
        formData.longitude
      );


      data.append(
        "total_slots",
        formData.total_slots
      );


      data.append(
        "image",
        image
      );


      console.log(
        "Submitting parking..."
      );


      // -------------------------------------------------
      // IMPORTANT
      // DO NOT SET CONTENT-TYPE MANUALLY
      // AXIOS WILL SET multipart/form-data + BOUNDARY
      // -------------------------------------------------

      const response = await axios.post(
        "/parking/create",
        data
      );


      console.log(
        "Parking submission response:",
        response.data
      );


      // =================================================
      // SUCCESS
      // =================================================

      toast.success(
        response.data?.message ||
        "Parking submitted successfully for verification"
      );


      // -------------------------------------------------
      // RESET FORM
      // -------------------------------------------------

      setFormData({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        total_slots: ""
      });


      setImage(null);

      setPreview("");


      if (fileInputRef.current) {

        fileInputRef.current.value = "";

      }


      // -------------------------------------------------
      // GO TO OWNER DASHBOARD
      // -------------------------------------------------

      setTimeout(() => {

        navigate("/owner");

      }, 1000);


    } catch (error) {

      console.error(
        "========================================"
      );

      console.error(
        "ADD PARKING ERROR"
      );

      console.error(
        "========================================"
      );

      console.error(
        "Status:",
        error?.response?.status
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      console.error(
        "Message:",
        error?.message
      );


      // =================================================
      // ERROR MESSAGE
      // =================================================

      let message =
        "Failed to submit parking";


      if (
        error?.response?.data?.detail
      ) {

        if (
          Array.isArray(
            error.response.data.detail
          )
        ) {

          message =
            error.response.data.detail
              .map(
                (item) =>
                  item.msg ||
                  "Invalid input"
              )
              .join(", ");

        } else {

          message =
            error.response.data.detail;

        }

      }


      toast.error(message);

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-2xl shadow-sm border p-8">


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-gray-900">

              Add Parking

            </h1>


            <p className="text-gray-500 mt-2">

              Submit your parking location for ParkEase
              verification.

            </p>

          </div>


          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >


            {/* =================================================
                PARKING NAME
            ================================================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Parking Name

              </label>


              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ParkEase Bangalore Center"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />

            </div>


            {/* =================================================
                ADDRESS
            ================================================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Address

              </label>


              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Enter complete parking address"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />

            </div>


            {/* =================================================
                LATITUDE / LONGITUDE
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


              {/* LATITUDE */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">

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
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

              </div>


              {/* LONGITUDE */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">

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
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

              </div>

            </div>


            {/* =================================================
                TOTAL SLOTS
            ================================================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Total Parking Slots

              </label>


              <input
                type="number"
                min="1"
                name="total_slots"
                value={formData.total_slots}
                onChange={handleChange}
                placeholder="20"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />

            </div>


            {/* =================================================
                PARKING IMAGE
            ================================================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">

                Parking Location Image

              </label>


              <p className="text-sm text-gray-500 mb-3">

                Upload a clear photo of the parking area.
                Admin will review this image during verification.

              </p>


              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white disabled:bg-gray-100"
              />


              {/* IMAGE PREVIEW */}

              {preview && (

                <div className="mt-5">

                  <p className="text-sm font-semibold text-gray-700 mb-2">

                    Image Preview

                  </p>


                  <img
                    src={preview}
                    alt="Parking preview"
                    className="w-full max-h-80 object-cover rounded-xl border"
                  />

                </div>

              )}

            </div>


            {/* =================================================
                VERIFICATION NOTICE
            ================================================= */}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

              <p className="font-semibold text-blue-800">

                ParkEase Verification

              </p>


              <p className="text-sm text-blue-700 mt-1">

                After submission, your parking will remain
                pending until a ParkEase administrator verifies
                the location and uploaded image.

              </p>

            </div>


            {/* =================================================
                SUBMIT BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition"
            >

              {loading ? (

                <div className="flex items-center justify-center gap-2">

                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                  Submitting...

                </div>

              ) : (

                "Submit Parking for Verification"

              )}

            </button>


          </form>

        </div>

      </div>

    </div>

  );

}

export default AddParking;