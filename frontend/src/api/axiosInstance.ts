import axios from "axios";
import baseURL from "./base";

const axiosInstance = axios.create({
  baseURL,
});

// attach token automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// handle auth errors
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");

      const requestUrl = err.config?.url ?? "";
      const isLoginRequest =
        requestUrl === "/auth/login" || requestUrl.endsWith("/auth/login");

      if (!isLoginRequest) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
