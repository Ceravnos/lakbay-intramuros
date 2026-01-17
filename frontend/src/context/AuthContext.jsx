import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/axios";

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                const res = await api.get("/auth/me");
                setUser(res.data);
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem("token");
                delete api.defaults.headers.common["Authorization"];
            }
        }
        setLoading(false);
    };

    // Unified login
    const login = async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        const { token, ...userData } = res.data;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    // Unified register
    const register = async (email, password, fullName) => {
        const res = await api.post("/auth/register", { email, password, fullName });
        const { token, ...userData } = res.data;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    // Admin login
    const loginAdmin = async (email, password) => {
        const res = await api.post("/auth/admin-login", { email, password });
        const { token, ...userData } = res.data;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    // Apply to become a guide
    const applyForGuide = async (contactNumber, accreditationFile, accreditationFileName) => {
        const res = await api.post("/auth/apply-guide", { 
            contactNumber, 
            accreditationFile, 
            accreditationFileName 
        });
        // Update local user state with new guideStatus
        setUser(prev => ({ ...prev, guideStatus: "pending" }));
        return res.data;
    };

    // Toggle guide mode
    const toggleGuideMode = async () => {
        const res = await api.put("/auth/toggle-guide-mode");
        setUser(prev => ({ ...prev, isGuideMode: res.data.isGuideMode }));
        return res.data;
    };

    // Silent refresh user data from server (useful after admin approval)
    const refreshUser = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data);
            return res.data;
        } catch (error) {
            console.error("Failed to refresh user data:", error);
            throw error;
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
    };

    // Forgot password
    const forgotPassword = async (email) => {
        const res = await api.post("/auth/forgot-password", { email });
        return res.data;
    };

    // Verify OTP
    const verifyOtp = async (email, otp) => {
        const res = await api.post("/auth/verify-otp", { email, otp });
        return res.data;
    };

    // Reset password
    const resetPassword = async (email, otp, newPassword) => {
        const res = await api.post("/auth/reset-password", { email, otp, newPassword });
        return res.data;
    };

    const value = {
        user,
        loading,
        login,
        register,
        loginAdmin,
        applyForGuide,
        toggleGuideMode,
        refreshUser,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        isAuthenticated: !!user,
        isTourist: user?.role === "tourist",
        isGuide: user?.role === "guide",
        isAdmin: user?.role === "admin",
        isApprovedGuide: user?.role === "guide" && user?.guideStatus === "approved",
        isGuideMode: user?.isGuideMode === true,
        hasPendingGuideApplication: user?.guideStatus === "pending",
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
