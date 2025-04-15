import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "http://192.168.254.192:8000/api/",
  withCredentials: true, // Ensure cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Add timeout to prevent hanging requests
});

// Check if token exists in localStorage and set authorization header
const token = localStorage.getItem("auth_token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Token refresh handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Return successful responses directly
    return response;
  },
  async (error) => {
    // Capture the original request that failed
    const originalRequest = error.config;
    
    // Log error details for debugging
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: originalRequest?.url
    });

    // Only handle token refresh for 401 errors on non-login/register endpoints
    // and when the request hasn't already been retried
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      originalRequest.url !== "login" && 
      originalRequest.url !== "register"
    ) {
      // If already refreshing token, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await api.post("refresh", {}, { withCredentials: true });

        if (response.status === 200) {
          // Extract token from response
          const { token } = response.data.authorisation || response.data;

          // Update token in storage and headers
          localStorage.setItem("auth_token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          originalRequest.headers["Authorization"] = `Bearer ${token}`;

          // Process queued requests with new token
          processQueue(null, token);

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Handle failed refresh
        console.error("Token refresh failed:", refreshError);
        
        // Clear auth data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");

        // Reject all queued requests
        processQueue(refreshError, null);
        
        // Redirect to login page
        window.location.href = "/";
      } finally {
        // Reset refreshing state
        isRefreshing = false;
      }
    }

    // Pass through all other errors
    return Promise.reject(error);
  }
);

export default api;