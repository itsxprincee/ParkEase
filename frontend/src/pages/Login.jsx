import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const navigate = useNavigate();

  // =========================================================
  // MODE
  // =========================================================

  const [mode, setMode] = useState("signin");

  const isSignUp = mode === "signup";

  // =========================================================
  // SIGNUP STEP
  // =========================================================

  const [signupStep, setSignupStep] = useState(1);

  // 1 = Name
  // 2 = Role
  // 3 = Email
  // 4 = OTP
  // 5 = Password

  // =========================================================
  // SIGNUP DATA
  // =========================================================

  const [name, setName] = useState("");
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [showSigninPassword, setShowSigninPassword] =
    useState(false);

  // =========================================================
  // SIGN IN
  // =========================================================

  const [signinEmail, setSigninEmail] =
    useState("");

  const [signinPassword, setSigninPassword] =
    useState("");

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(false);

  const [otpLoading, setOtpLoading] =
    useState(false);

  const [verifyLoading, setVerifyLoading] =
    useState(false);

  const [resendLoading, setResendLoading] =
    useState(false);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] =
    useState("");

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [forgotEmail, setForgotEmail] =
    useState("");

  const [forgotLoading, setForgotLoading] =
    useState(false);

  const [forgotError, setForgotError] =
    useState("");

  const [forgotSuccess, setForgotSuccess] =
    useState("");

  // =========================================================
  // OTP TIMER
  // =========================================================

  const [resendTimer, setResendTimer] =
    useState(0);

  // =========================================================
  // ERROR HANDLER
  // =========================================================

  const getErrorMessage = (err, fallback) => {
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      fallback;

    if (Array.isArray(message)) {
      return message
        .map((item) => item?.msg || "Invalid request")
        .join(", ");
    }

    return message;
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await API.post(
        "/auth/login",
        {
          email: signinEmail.trim(),
          password: signinPassword,
        }
      );

      const data = response.data;

      const token =
        data.access_token ||
        data.token;

      if (!token) {
        throw new Error(
          "Login token was not returned by server."
        );
      }

      localStorage.setItem(
        "token",
        token
      );

      let user = data.user;

      if (!user) {
        user = {
          id: data.user_id,
          name: data.name,
          email:
            data.email ||
            signinEmail,
          role:
            data.role ||
            "customer",
        };
      }

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      if (user.role === "admin") {
        navigate(
          "/admin/verification",
          {
            replace: true,
          }
        );
      } else if (
        user.role === "owner"
      ) {
        navigate(
          "/owner/dashboard",
          {
            replace: true,
          }
        );
      } else {
        navigate(
          "/customer/dashboard",
          {
            replace: true,
          }
        );
      }

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Invalid email or password."
        )
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEND SIGNUP OTP
  // =========================================================

  const sendSignupOTP = async () => {
    setOtpError("");
    setOtpSuccess("");
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Please enter your full name."
      );
      setSignupStep(1);
      return;
    }

    if (!role) {
      setError(
        "Please select how you want to use ParkEase."
      );
      setSignupStep(2);
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      setSignupStep(3);
      return;
    }

    setOtpLoading(true);

    try {
      const response =
        await API.post(
          "/auth/send-signup-otp",
          {
            name: name.trim(),
            email: email.trim(),
            role,
          }
        );

      setSignupStep(4);

      setOtp("");

      setOtpSuccess(
        response.data?.message ||
          "Verification code sent to your email."
      );

      startResendTimer();

    } catch (err) {
      console.error(
        "Send OTP error:",
        err
      );

      setOtpError(
        getErrorMessage(
          err,
          "Unable to send verification code."
        )
      );

    } finally {
      setOtpLoading(false);
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const verifySignupOTP = async () => {
    setOtpError("");
    setOtpSuccess("");

    if (otp.length !== 6) {
      setOtpError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    setVerifyLoading(true);

    try {
      const response =
        await API.post(
          "/auth/verify-signup-otp",
          {
            email: email.trim(),
            otp: otp.trim(),
          }
        );

      setEmailVerified(true);

      setOtpSuccess(
        response.data?.message ||
          "Email verified successfully."
      );

      setTimeout(() => {
        setSignupStep(5);
        setOtpSuccess("");
      }, 700);

    } catch (err) {
      console.error(
        "OTP verification error:",
        err
      );

      setOtpError(
        getErrorMessage(
          err,
          "Invalid or expired verification code."
        )
      );

    } finally {
      setVerifyLoading(false);
    }
  };

  // =========================================================
  // RESEND OTP
  // =========================================================

  const resendSignupOTP = async () => {
    if (resendTimer > 0) {
      return;
    }

    setOtpError("");
    setOtpSuccess("");
    setResendLoading(true);

    try {
      const response =
        await API.post(
          "/auth/send-signup-otp",
          {
            name: name.trim(),
            email: email.trim(),
            role,
          }
        );

      setOtp("");

      setOtpSuccess(
        response.data?.message ||
          "A new verification code has been sent."
      );

      startResendTimer();

    } catch (err) {
      console.error(
        "Resend OTP error:",
        err
      );

      setOtpError(
        getErrorMessage(
          err,
          "Unable to resend verification code."
        )
      );

    } finally {
      setResendLoading(false);
    }
  };

  // =========================================================
  // OTP TIMER
  // =========================================================

  const startResendTimer = () => {
    setResendTimer(30);

    let remaining = 30;

    const interval =
      setInterval(() => {
        remaining -= 1;

        setResendTimer(
          remaining
        );

        if (remaining <= 0) {
          clearInterval(
            interval
          );
        }
      }, 1000);
  };

  // =========================================================
  // CREATE ACCOUNT
  // =========================================================

  const createAccount = async () => {
    setError("");
    setSuccess("");

    if (!emailVerified) {
      setError(
        "Please verify your email before creating your account."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await API.post(
          "/auth/register",
          {
            name: name.trim(),
            email: email.trim(),
            password,
            role,
          }
        );

      console.log(
        "Registration response:",
        response.data
      );

      setSuccess(
        "Account created successfully! You can now sign in."
      );

      setTimeout(() => {
        resetSignup();

        setMode(
          "signin"
        );

        setSigninEmail(
          email.trim()
        );

        setSuccess(
          "Account created successfully. Please sign in."
        );
      }, 1200);

    } catch (err) {
      console.error(
        "Create account error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to create your account."
        )
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SIGNUP NEXT
  // =========================================================

  const handleSignupNext = () => {
    setError("");
    setSuccess("");

    if (
      signupStep === 1
    ) {
      if (!name.trim()) {
        setError(
          "Please enter your full name."
        );
        return;
      }

      setSignupStep(2);
      return;
    }

    if (
      signupStep === 2
    ) {
      if (!role) {
        setError(
          "Please select a role."
        );
        return;
      }

      setSignupStep(3);
      return;
    }

    if (
      signupStep === 3
    ) {
      sendSignupOTP();
      return;
    }

    if (
      signupStep === 4
    ) {
      verifySignupOTP();
      return;
    }

    if (
      signupStep === 5
    ) {
      createAccount();
    }
  };

  // =========================================================
  // SIGNUP BACK
  // =========================================================

  const handleSignupBack = () => {
    setError("");
    setSuccess("");
    setOtpError("");
    setOtpSuccess("");

    if (
      signupStep > 1 &&
      signupStep <= 3
    ) {
      setSignupStep(
        signupStep - 1
      );
      return;
    }

    if (
      signupStep === 4
    ) {
      setSignupStep(3);
      setOtp("");
      return;
    }

    if (
      signupStep === 5
    ) {
      setSignupStep(4);
      return;
    }
  };

  // =========================================================
  // RESET SIGNUP
  // =========================================================

  const resetSignup = () => {
    setSignupStep(1);

    setName("");
    setRole("customer");
    setEmail("");

    setOtp("");
    setEmailVerified(false);

    setPassword("");
    setConfirmPassword("");

    setOtpError("");
    setOtpSuccess("");
  };

  // =========================================================
  // SWITCH MODE
  // =========================================================

  const switchMode = (
    newMode
  ) => {
    setMode(newMode);

    setError("");
    setSuccess("");

    if (
      newMode === "signin"
    ) {
      resetSignup();
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const handleForgotPassword =
    async (e) => {
      e.preventDefault();

      setForgotError("");
      setForgotSuccess("");

      if (
        !forgotEmail.trim()
      ) {
        setForgotError(
          "Please enter your email address."
        );
        return;
      }

      setForgotLoading(true);

      try {
        const response =
          await API.post(
            "/auth/forgot-password",
            {
              email:
                forgotEmail.trim(),
            }
          );

        setForgotSuccess(
          response.data?.message ||
            "If an account exists with this email, a password reset link has been sent."
        );

      } catch (err) {
        console.error(
          "Forgot password error:",
          err
        );

        setForgotError(
          getErrorMessage(
            err,
            "Unable to send password reset email. Please try again."
          )
        );

      } finally {
        setForgotLoading(false);
      }
    };

  // =========================================================
  // CLOSE FORGOT PASSWORD
  // =========================================================

  const closeForgotPassword =
    () => {
      setShowForgotPassword(
        false
      );

      setForgotEmail("");

      setForgotError("");

      setForgotSuccess("");
    };

  // =========================================================
  // STEP TITLE
  // =========================================================

  const getStepTitle = () => {
    if (signupStep === 1)
      return "What's your name?";

    if (signupStep === 2)
      return "Choose your account type";

    if (signupStep === 3)
      return "What's your email?";

    if (signupStep === 4)
      return "Verify your email";

    return "Create your password";
  };

  // =========================================================
  // STEP DESCRIPTION
  // =========================================================

  const getStepDescription =
    () => {
      if (signupStep === 1)
        return "Let's start by getting to know you.";

      if (signupStep === 2)
        return "Choose how you want to use ParkEase.";

      if (signupStep === 3)
        return "We'll send a verification code to this email.";

      if (signupStep === 4)
        return `Enter the 6-digit code sent to ${email}.`;

      return "Create a secure password for your ParkEase account.";
    };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-8">

      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      </div>

      {/* MAIN CARD */}

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">

        <div className="grid md:grid-cols-2">

          {/* =================================================
              LEFT BRAND
          ================================================= */}

          <div className="hidden md:flex relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 text-white flex-col justify-between">

            <div>

              <div className="flex items-center gap-3 mb-12">

                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">

                  <span className="text-2xl font-black">
                    P
                  </span>

                </div>

                <div>

                  <h1 className="text-2xl font-bold">
                    ParkEase
                  </h1>

                  <p className="text-blue-200 text-xs">
                    Smart Parking Management
                  </p>

                </div>

              </div>

              <h2 className="text-4xl font-bold leading-tight">

                Parking made
                <br />

                <span className="text-blue-200">
                  simple.
                </span>

              </h2>

              <p className="mt-6 text-blue-100 leading-relaxed max-w-md">

                Find parking, reserve your slot,
                manage your parking location and
                enjoy a smarter parking experience.

              </p>

              <div className="mt-10 space-y-5">

                <Feature
                  icon="✓"
                  title="Easy parking discovery"
                  text="Find available parking locations quickly."
                />

                <Feature
                  icon="✓"
                  title="Simple booking"
                  text="Reserve your parking slot in advance."
                />

                <Feature
                  icon="✓"
                  title="QR based access"
                  text="Use your booking QR code for easy entry."
                />

              </div>

            </div>

            <p className="text-blue-200 text-sm">
              © 2026 ParkEase. Smart parking for everyone.
            </p>

          </div>

          {/* =================================================
              RIGHT SECTION
          ================================================= */}

          <div className="p-7 sm:p-10 md:p-12">

            {/* MOBILE LOGO */}

            <div className="md:hidden flex items-center gap-3 mb-8">

              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                P
              </div>

              <div>

                <h1 className="text-xl font-bold text-gray-900">
                  ParkEase
                </h1>

                <p className="text-xs text-gray-500">
                  Smart Parking
                </p>

              </div>

            </div>

            {/* HEADING */}

            <div className="mb-7">

              <h2 className="text-3xl font-bold text-gray-900">

                {isSignUp
                  ? getStepTitle()
                  : "Welcome back"}

              </h2>

              <p className="text-gray-500 mt-2 leading-relaxed">

                {isSignUp
                  ? getStepDescription()
                  : "Sign in to continue to your ParkEase account."}

              </p>

            </div>

            {/* =================================================
                MODE SWITCH
            ================================================= */}

            <div className="flex bg-gray-100 rounded-xl p-1 mb-7">

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    "signin"
                  )
                }
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isSignUp
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    "signup"
                  )
                }
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isSignUp
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign Up
              </button>

            </div>

            {/* =================================================
                SIGNUP PROGRESS
            ================================================= */}

            {isSignUp && (

              <div className="mb-8">

                <div className="flex items-center">

                  {[1, 2, 3, 4, 5].map(
                    (step, index) => {

                      const completed =
                        signupStep >
                        step;

                      const active =
                        signupStep ===
                        step;

                      return (
                        <div
                          key={step}
                          className="flex items-center flex-1 last:flex-none"
                        >

                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                              completed
                                ? "bg-blue-600 text-white"
                                : active
                                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >

                            {completed
                              ? "✓"
                              : step}

                          </div>

                          {index <
                            4 && (

                            <div
                              className={`h-1 flex-1 mx-1 rounded-full transition-all ${
                                signupStep >
                                step
                                  ? "bg-blue-600"
                                  : "bg-gray-100"
                              }`}
                            />

                          )}

                        </div>
                      );
                    }
                  )}

                </div>

                <div className="flex justify-between mt-2">

                  <span className="text-[10px] text-gray-400">
                    Details
                  </span>

                  <span className="text-[10px] text-gray-400">
                    Role
                  </span>

                  <span className="text-[10px] text-gray-400">
                    Email
                  </span>

                  <span className="text-[10px] text-gray-400">
                    Verify
                  </span>

                  <span className="text-[10px] text-gray-400">
                    Password
                  </span>

                </div>

              </div>

            )}

            {/* =================================================
                SIGN IN FORM
            ================================================= */}

            {!isSignUp && (

              <form
                onSubmit={
                  handleLogin
                }
                className="space-y-5"
              >

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={
                      signinEmail
                    }
                    onChange={(e) =>
                      setSigninEmail(
                        e.target.value
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />

                </div>

                <div>

                  <div className="flex justify-between items-center mb-2">

                    <label className="text-sm font-semibold text-gray-700">
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      onClick={() => {

                        setForgotEmail(
                          signinEmail
                        );

                        setForgotError(
                          ""
                        );

                        setForgotSuccess(
                          ""
                        );

                        setShowForgotPassword(
                          true
                        );

                      }}
                    >
                      Forgot password?
                    </button>

                  </div>

                  <div className="relative">

                    <input
                      type={
                        showSigninPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        signinPassword
                      }
                      onChange={(e) =>
                        setSigninPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full px-4 py-3.5 pr-20 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowSigninPassword(
                          !showSigninPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 hover:text-blue-600"
                    >
                      {showSigninPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

                {error && (
                  <Message
                    type="error"
                    text={error}
                  />
                )}

                {success && (
                  <Message
                    type="success"
                    text={success}
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  {loading ? (
                    <LoadingText text="Signing in..." />
                  ) : (
                    "Sign In"
                  )}

                </button>

              </form>
            )}

            {/* =================================================
                SIGNUP FORM
            ================================================= */}

            {isSignUp && (

              <div className="space-y-5">

                {/* STEP 1 */}

                {signupStep === 1 && (

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      autoFocus
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>

                )}

                {/* STEP 2 */}

                {signupStep === 2 && (

                  <div className="space-y-3">

                    <RoleCard
                      selected={
                        role ===
                        "customer"
                      }
                      icon="🚗"
                      title="Customer"
                      description="Find and book parking spaces"
                      onClick={() =>
                        setRole(
                          "customer"
                        )
                      }
                    />

                    <RoleCard
                      selected={
                        role ===
                        "owner"
                      }
                      icon="🅿️"
                      title="Parking Owner"
                      description="List and manage your parking"
                      onClick={() =>
                        setRole(
                          "owner"
                        )
                      }
                    />

                  </div>

                )}

                {/* STEP 3 */}

                {signupStep === 3 && (

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">

                      <span className="text-blue-600">
                        🔒
                      </span>

                      <span>
                        We'll use this email to verify your account.
                      </span>

                    </div>

                  </div>

                )}

                {/* STEP 4 */}

                {signupStep === 4 && (

                  <div className="space-y-5">

                    <div className="text-center">

                      <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl mb-4">
                        ✉️
                      </div>

                      <p className="text-sm text-gray-500">
                        Verification code sent to
                      </p>

                      <p className="font-semibold text-gray-900 mt-1 break-all">
                        {email}
                      </p>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                        Enter 6-digit code
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        placeholder="000000"
                        autoFocus
                        className="w-full px-4 py-4 border border-gray-200 rounded-xl outline-none text-center text-2xl font-bold tracking-[0.5em] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                    </div>

                    {otpError && (
                      <Message
                        type="error"
                        text={otpError}
                      />
                    )}

                    {otpSuccess && (
                      <Message
                        type="success"
                        text={otpSuccess}
                      />
                    )}

                    <div className="text-center">

                      <p className="text-sm text-gray-500">

                        Didn't receive the code?

                      </p>

                      <button
                        type="button"
                        disabled={
                          resendTimer >
                            0 ||
                          resendLoading
                        }
                        onClick={
                          resendSignupOTP
                        }
                        className={`mt-1 text-sm font-semibold ${
                          resendTimer >
                            0 ||
                          resendLoading
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >

                        {resendLoading
                          ? "Sending..."
                          : resendTimer >
                            0
                          ? `Resend OTP in ${resendTimer}s`
                          : "Resend OTP"}

                      </button>

                    </div>

                  </div>

                )}

                {/* STEP 5 */}

                {signupStep === 5 && (

                  <div className="space-y-5">

                    {emailVerified && (

                      <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">

                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                          ✓
                        </div>

                        <div>

                          <p className="text-sm font-semibold text-green-700">
                            Email verified
                          </p>

                          <p className="text-xs text-green-600">
                            {email}
                          </p>

                        </div>

                      </div>

                    )}

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Create Password
                      </label>

                      <div className="relative">

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            password
                          }
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          placeholder="Create a password"
                          autoComplete="new-password"
                          autoFocus
                          className="w-full px-4 py-3.5 pr-20 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 hover:text-blue-600"
                        >
                          {showPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Password must contain at least 6 characters.
                      </p>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>

                      <div className="relative">

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            confirmPassword
                          }
                          onChange={(e) =>
                            setConfirmPassword(
                              e.target.value
                            )
                          }
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          className="w-full px-4 py-3.5 pr-20 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 hover:text-blue-600"
                        >
                          {showConfirmPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                    </div>

                  </div>

                )}

                {/* GENERAL ERROR */}

                {error && (
                  <Message
                    type="error"
                    text={error}
                  />
                )}

                {success && (
                  <Message
                    type="success"
                    text={success}
                  />
                )}

                {/* BUTTONS */}

                <div className="flex gap-3 pt-2">

                  {signupStep > 1 && (

                    <button
                      type="button"
                      onClick={
                        handleSignupBack
                      }
                      disabled={
                        loading ||
                        otpLoading ||
                        verifyLoading
                      }
                      className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Back
                    </button>

                  )}

                  <button
                    type="button"
                    onClick={
                      handleSignupNext
                    }
                    disabled={
                      loading ||
                      otpLoading ||
                      verifyLoading
                    }
                    className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >

                    {signupStep === 3 &&
                    otpLoading ? (
                      <LoadingText text="Sending OTP..." />
                    ) : signupStep ===
                        4 &&
                      verifyLoading ? (
                      <LoadingText text="Verifying..." />
                    ) : loading ? (
                      <LoadingText text="Creating account..." />
                    ) : signupStep ===
                      3 ? (
                      "Send Verification Code"
                    ) : signupStep ===
                      4 ? (
                      "Verify Email"
                    ) : signupStep ===
                      5 ? (
                      "Create Account"
                    ) : (
                      "Continue"
                    )}

                  </button>

                </div>

              </div>

            )}

            {/* =================================================
                BOTTOM
            ================================================= */}

            <p className="text-center text-sm text-gray-500 mt-7">

              {isSignUp
                ? "Already have an account?"
                : "Don't have an account?"}

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    isSignUp
                      ? "signin"
                      : "signup"
                  )
                }
                className="ml-1 font-semibold text-blue-600 hover:text-blue-700"
              >
                {isSignUp
                  ? "Sign In"
                  : "Create one"}
              </button>

            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          FORGOT PASSWORD MODAL
      ===================================================== */}

      {showForgotPassword && (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">

          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-8">

            <div className="flex items-start justify-between mb-6">

              <div>

                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl mb-4">
                  🔐
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  Forgot password?
                </h2>

                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Enter your email address and we'll
                  send you a secure password reset link.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeForgotPassword
                }
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleForgotPassword
              }
              className="space-y-5"
            >

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  value={
                    forgotEmail
                  }
                  onChange={(e) =>
                    setForgotEmail(
                      e.target.value
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  required
                />

              </div>

              {forgotError && (

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {forgotError}
                </div>

              )}

              {forgotSuccess && (

                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">

                  <p className="text-sm font-semibold text-green-700">
                    Email sent
                  </p>

                  <p className="text-sm text-green-600 mt-1">
                    {forgotSuccess}
                  </p>

                  <p className="text-xs text-green-600 mt-3">
                    Please check your inbox and spam folder.
                  </p>

                </div>

              )}

              {!forgotSuccess && (

                <button
                  type="submit"
                  disabled={
                    forgotLoading
                  }
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  {forgotLoading ? (
                    <LoadingText text="Sending reset link..." />
                  ) : (
                    "Send Reset Link"
                  )}

                </button>

              )}

              <button
                type="button"
                onClick={
                  closeForgotPassword
                }
                className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Back to Sign In
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


// =========================================================
// FEATURE
// =========================================================

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-start gap-4">

      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-blue-200 font-bold shrink-0">
        {icon}
      </div>

      <div>

        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-sm text-blue-200 mt-1">
          {text}
        </p>

      </div>

    </div>
  );
}


// =========================================================
// ROLE CARD
// =========================================================

function RoleCard({
  selected,
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
        selected
          ? "border-blue-600 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >

      <div className="flex items-center gap-4">

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-gray-100"
          }`}
        >
          {icon}
        </div>

        <div className="flex-1">

          <p className="font-semibold text-gray-900">
            {title}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>

        </div>

        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selected
              ? "border-blue-600"
              : "border-gray-300"
          }`}
        >

          {selected && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          )}

        </div>

      </div>

    </button>
  );
}


// =========================================================
// MESSAGE
// =========================================================

function Message({
  type,
  text,
}) {
  const isError =
    type === "error";

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border ${
        isError
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
      }`}
    >

      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isError
            ? "bg-red-100 text-red-600"
            : "bg-green-100 text-green-600"
        }`}
      >
        {isError ? "!" : "✓"}
      </div>

      <p
        className={`text-sm ${
          isError
            ? "text-red-600"
            : "text-green-600"
        }`}
      >
        {text}
      </p>

    </div>
  );
}


// =========================================================
// LOADING TEXT
// =========================================================

function LoadingText({
  text,
}) {
  return (
    <span className="flex items-center justify-center gap-2">

      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />

      {text}

    </span>
  );
}


export default Login;
