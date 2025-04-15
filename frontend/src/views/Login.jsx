import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/gamma.png";
import "../styles/login.css";
import api from "../axiosConfig";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [hasValue, setHasValue] = useState({
    email: false,
    password: false,
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (token && user.position) {
      if (user.position === "Admin") {
        navigate("/super-admin-dashboard");
      } else if (user.position === "Accounting" || user.position === "Doctor Pathologist") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
      
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHasValue((prev) => ({ ...prev, [e.target.name]: e.target.value.length > 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous error and set loading state
    setError("");
    setLoading(true);
    
    try {
      // Make API call
      const response = await api.post("login", formData);
      
      // Process successful response
      const { token, authorisation, user } = response.data;
      const authToken = token || (authorisation && authorisation.token);
      
      if (!authToken) {
        throw new Error("No authentication token received");
      }
      
      // Store authentication data
      localStorage.setItem("auth_token", authToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isLoggedIn", "true");
      
      if (user.position === "Admin") {
        navigate("/super-admin-dashboard");
      } else if (user.position === "Accounting" || user.position === "Doctor Pathologist") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
      
      
    } catch (error) {
      // Stop loading state immediately when catching an error
      setLoading(false);
      
      console.error("Login error:", error);
      
      // Handle different error scenarios
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
        setTimeout(()=>{
          setError("")
        },1500)
      } else if (error.response && error.response.status === 401) {
        setError("Invalid email or password");
        setTimeout(()=>{
          setError("")
        },1500)
      } else if (error.response && error.response.status === 422) {
        setError("Validation failed. Please check your inputs.");
        setTimeout(()=>{
          setError("")
        },1500)
      } else {
        setError("Connection error. Please try again later.");
        setTimeout(()=>{
          setError("")
        },1500)
      }
      
      // Return early to prevent the automatic redirect
      return;
    }
    
    // Only set loading to false here if the try block completes successfully
    // This avoids the need for finally block which might interfere with the navigation
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} className="container flex flex-col md:flex-row">
      <div className="left-box flex justify-center text-center p-0 m-0">
        <div className="left w-screen">
          <div className="input-field xl:mt-9">
            <input
              type="email"
              name="email"
              className={`email ${hasValue.email ? "has-value" : ""}`}
              onChange={handleChange}
              required
            />
            <label className="labelline label-position sm:left-[95px] md:left-[79px] lg:left-[50px] xl:left-[160px]">
              Enter your email
            </label>
          </div>

          <div className="input-field">
            <input
              type="password"
              name="password"
              className={`password ${hasValue.password ? "has-value" : ""}`}
              onChange={handleChange}
              required
            />
            <label className="labelline label-password sm:left-[95px] md:left-[2px] lg:left-[50px] xl:left-[160px]">
              Enter your password
            </label>
          </div>

          {error && (
            <div className="error-message mt-2 p-2 bg-red-100 text-red-700 rounded">
                <p>{error}</p>
            </div>
        )}
          <div className="button-container">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="signupContainer">
              <p>Don't have an account? </p>
              <a href="http://192.168.254.192:5173/register">Register</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right section for logo and title */}
      <div className="right h-28 md:h-full lg:h-full xl:h-full order-first md:order-none">
      
      <img src={logo} alt="Finance Monitoring Logo" style={{pointerEvents: 'none'}} />
        <h1>Finance Monitoring</h1>
      </div>
    </form>
  );
}

export default Login;
