import axios from "axios";
import toast from "react-hot-toast";

// *FOR PRODUCTION*
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "/api";

// *FOR DEVELOPMENT*
const api = axios.create({
    baseURL: "http://localhost:4000/api",
});

/* 🔐 RESPONSE INTERCEPTOR */
api.interceptors.response.use(
    (response) => response,
    (err) => {
        if (err.response?.data?.code === "AUTO_LOGOUT") {
            toast.error("You were logged out due to inactivity");

            // Clear auth state
            localStorage.removeItem("token"); // or whatever you store your auth in

            // Hard redirect
            window.location.href = "/login";
        }

        return Promise.reject(err);
    }
);

export default api;
