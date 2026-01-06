import axios from "axios";

// *FOR PRODUCTION*
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "/api"

// *FOR DEVELOPMENT*
const api = axios.create({
    baseURL: BASE_URL,
});

export default api;