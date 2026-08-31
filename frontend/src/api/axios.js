import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // =====================================================
    // IMPORTANT FOR FORMDATA
    // =====================================================
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register") ||
        error.config?.url?.includes("/auth/send-otp");
      const hadToken = Boolean(localStorage.getItem("token"));
      if (!isAuthEndpoint && hadToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/reset-password"
        ) {
          window.location.href = "/login?session_expired=true";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;