import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import API from "../api/axios";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
localStorage.setItem(
  "user",
  JSON.stringify(response.data.user)
);

toast.success("Login Successful");

setTimeout(() => {
  if (response.data.user.role === "owner") {
    navigate("/owner");
  } else {
    navigate("/");
  }
}, 1000);

    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center p-5">
      <Toaster position="top-right" />

      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-700">
          ParkEase
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-6">
          Smart Parking Management
        </p>

        <div className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={login}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Login;