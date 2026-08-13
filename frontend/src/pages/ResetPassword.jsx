import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";

function ResetPassword() {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {

      setError(
        "This password reset link is invalid."
      );

      return;
    }

    if (password.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (password !== confirmPassword) {

      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {

      await API.post(
        "/auth/reset-password",
        {
          token,
          new_password: password
        }
      );

      setSuccess(
        "Password reset successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {

        navigate("/login", {
          replace: true
        });

      }, 1800);

    } catch (err) {

      console.error(
        "Reset password error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to reset password."
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="
      min-h-screen
      bg-gradient-to-br
      from-slate-950
      via-blue-950
      to-slate-900
      flex
      items-center
      justify-center
      px-4
    ">

      <div className="
        w-full
        max-w-md
        bg-white
        rounded-3xl
        shadow-2xl
        p-8
        sm:p-10
      ">

        {/* LOGO */}

        <div className="
          flex
          items-center
          gap-3
          mb-8
        ">

          <div className="
            w-12
            h-12
            rounded-2xl
            bg-blue-600
            text-white
            flex
            items-center
            justify-center
            text-2xl
            font-black
          ">
            P
          </div>

          <div>

            <h1 className="
              text-xl
              font-bold
              text-gray-900
            ">
              ParkEase
            </h1>

            <p className="
              text-xs
              text-gray-500
            ">
              Smart Parking Management
            </p>

          </div>

        </div>


        {/* HEADING */}

        <h2 className="
          text-3xl
          font-bold
          text-gray-900
        ">
          Create new password
        </h2>

        <p className="
          text-gray-500
          mt-2
          mb-8
        ">
          Choose a strong new password for your
          ParkEase account.
        </p>


        {/* INVALID TOKEN */}

        {!token && (

          <div className="
            p-4
            bg-red-50
            border
            border-red-200
            rounded-xl
            text-sm
            text-red-600
          ">
            This password reset link is invalid
            or incomplete.
          </div>

        )}


        {/* FORM */}

        {token && (

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* PASSWORD */}

            <div>

              <label className="
                block
                text-sm
                font-semibold
                text-gray-700
                mb-2
              ">
                New Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  className="
                    w-full
                    px-4
                    py-3.5
                    pr-20
                    border
                    border-gray-200
                    rounded-xl
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-sm
                    font-semibold
                    text-gray-500
                  "
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div>

              <label className="
                block
                text-sm
                font-semibold
                text-gray-700
                mb-2
              ">
                Confirm Password
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirm
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  className="
                    w-full
                    px-4
                    py-3.5
                    pr-20
                    border
                    border-gray-200
                    rounded-xl
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(
                      !showConfirm
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-sm
                    font-semibold
                    text-gray-500
                  "
                >
                  {showConfirm
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* ERROR */}

            {error && (

              <div className="
                p-4
                bg-red-50
                border
                border-red-200
                rounded-xl
                text-sm
                text-red-600
              ">
                {error}
              </div>

            )}


            {/* SUCCESS */}

            {success && (

              <div className="
                p-4
                bg-green-50
                border
                border-green-200
                rounded-xl
                text-sm
                text-green-600
              ">
                {success}
              </div>

            )}


            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                py-3.5
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-semibold
                shadow-lg
                shadow-blue-600/20
                transition
                disabled:opacity-60
              "
            >

              {loading
                ? "Resetting password..."
                : "Reset Password"}

            </button>

          </form>

        )}


        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate("/login")
          }
          className="
            w-full
            mt-6
            text-sm
            font-semibold
            text-blue-600
            hover:text-blue-700
          "
        >
          ← Back to Sign In
        </button>

      </div>

    </div>
  );
}

export default ResetPassword;