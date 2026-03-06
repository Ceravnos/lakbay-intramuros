import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, MapPin, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import KenBurnsBackground from "../../components/KenBurnsBackground";

//backgrounds
const backgrounds = [
  "/assets/login/login-bg-1.jpg",
  "/assets/login/login-bg-2.jpg",
  "/assets/login/login-bg-3.jpg",
];

const SignupPage = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { register } = useAuth();
    const navigate = useNavigate();

    // Email validation regex
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Validate all form fields
    const validateForm = () => {
        const newErrors = {};
        const { fullName, phoneNumber, email, password, confirmPassword } = formData;

        // Full Name validation
        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        // Phone Number validation
        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        } else if (!/^[0-9]+$/.test(phoneNumber)) {
            newErrors.phoneNumber = "Phone number must contain only numbers";
        } else if (phoneNumber.length !== 11) {
            newErrors.phoneNumber = "Phone number must be 11 digits";
        }

        // Email validation
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!isValidEmail(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        // Confirm Password validation
        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change and clear specific error
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }

        // Special case: clear confirmPassword error if passwords now match
        if (name === "password" && formData.confirmPassword && value === formData.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
        if (name === "confirmPassword" && formData.password && value === formData.password) {
            setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const { fullName, phoneNumber, email, password } = formData;

        setLoading(true);
        try {
            await register(email, password, fullName, phoneNumber);
            toast.success("Account created successfully!");
            // Redirect to tourist dashboard after signup
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900 relative overflow-hidden">
                <KenBurnsBackground images={backgrounds} />

                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23d4a574%22 fill-opacity=%220.08%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
                    <MapPin className="w-20 h-20 text-amber-400 mb-6" />
                    <h1 className="text-4xl font-serif font-bold text-amber-100 mb-4">
                        Lakbay Intramuros
                    </h1>
                    <p className="text-amber-200/80 text-lg max-w-md leading-relaxed">
                        Begin your adventure through the historic walled city. 
                        Create an account to save your favorite spots and plan your journey.
                    </p>
                    <div className="mt-12 flex items-center gap-2 text-amber-300/60">
                        <div className="w-16 h-px bg-amber-300/40"></div>
                        <span className="text-sm font-medium tracking-wider">EST. 1571</span>
                        <div className="w-16 h-px bg-amber-300/40"></div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-amber-50 to-stone-100">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <MapPin className="w-12 h-12 text-amber-700 mx-auto mb-2" />
                        <h1 className="text-2xl font-serif font-bold text-stone-800">Lakbay Intramuros</h1>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 p-6 sm:p-8">
                        {/* Back to Home Link */}
                        <Link 
                            to="/" 
                            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif font-bold text-stone-800">Create Account</h2>
                            <p className="text-stone-600 mt-2">Join us and start exploring</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.fullName ? 'text-red-400' : 'text-stone-400'}`} />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3 bg-amber-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${
                                            errors.fullName 
                                                ? 'border-red-300 focus:ring-red-500' 
                                                : 'border-amber-200 focus:ring-amber-500'
                                        }`}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                {errors.fullName && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.phoneNumber ? 'text-red-400' : 'text-stone-400'}`} />
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        maxLength={11}
                                        className={`w-full pl-11 pr-4 py-3 bg-amber-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${
                                            errors.phoneNumber 
                                                ? 'border-red-300 focus:ring-red-500' 
                                                : 'border-amber-200 focus:ring-amber-500'
                                        }`}
                                        placeholder="09XXXXXXXXX"
                                    />
                                </div>
                                {errors.phoneNumber && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                        {errors.phoneNumber}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-400' : 'text-stone-400'}`} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3 bg-amber-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${
                                            errors.email 
                                                ? 'border-red-300 focus:ring-red-500' 
                                                : 'border-amber-200 focus:ring-amber-500'
                                        }`}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-stone-400'}`} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-12 py-3 bg-amber-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${
                                            errors.password 
                                                ? 'border-red-300 focus:ring-red-500' 
                                                : 'border-amber-200 focus:ring-amber-500'
                                        }`}
                                        placeholder="Create a password (min 6 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.confirmPassword ? 'text-red-400' : 'text-stone-400'}`} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-12 py-3 bg-amber-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${
                                            errors.confirmPassword 
                                                ? 'border-red-300 focus:ring-red-500' 
                                                : 'border-amber-200 focus:ring-amber-500'
                                        }`}
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-stone-600">
                                Already have an account?{" "}
                                <Link to="/login" className="text-amber-700 hover:text-amber-800 font-semibold">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
