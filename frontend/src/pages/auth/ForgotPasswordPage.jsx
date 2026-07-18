import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Mail, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/useAuth";

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [mockOtp, setMockOtp] = useState(null);
    const { forgotPassword, verifyOtp, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);
        try {
            const res = await forgotPassword(email);
            if (res.mockOtp) {
                setMockOtp(res.mockOtp);
            }
            toast.success("OTP sent to your email");
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp) {
            toast.error("Please enter the OTP");
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(email, otp);
            toast.success("OTP verified");
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) {
            toast.error("Please enter your email first");
            setStep(1);
            return;
        }

        setLoading(true);
        try {
            const res = await forgotPassword(email);
            setMockOtp(res.mockOtp || null);
            setOtp("");
            toast.success("A new OTP was sent to your email");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            toast.success("Password reset successfully!");
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-stone-100">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <MapPin className="w-12 h-12 text-amber-700 mx-auto mb-2" />
                    <h1 className="text-2xl font-serif font-bold text-stone-800">Lakbay Intramuros</h1>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 p-8">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-700'}`}>
                            1
                        </div>
                        <div className={`w-12 h-1 ${step >= 2 ? 'bg-amber-700' : 'bg-amber-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-700'}`}>
                            2
                        </div>
                        <div className={`w-12 h-1 ${step >= 3 ? 'bg-amber-700' : 'bg-amber-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-700'}`}>
                            3
                        </div>
                    </div>

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-serif font-bold text-stone-800">Forgot Password?</h2>
                                <p className="text-stone-600 mt-2">Enter your email to receive a verification code</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-200 disabled:opacity-50"
                                >
                                    {loading ? <span className="loading loading-spinner loading-sm"></span> : "Send OTP"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-serif font-bold text-stone-800">Verify OTP</h2>
                                <p className="text-stone-600 mt-2">Enter the 6-digit code sent to your email</p>
                                {mockOtp && (
                                    <div className="mt-3 p-3 bg-amber-100 rounded-lg border border-amber-300">
                                        <p className="text-sm text-amber-800">
                                            <strong>Development Mode:</strong> Your OTP is <span className="font-mono font-bold">{mockOtp}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Verification Code
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                            className="w-full pl-11 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400 text-center tracking-widest font-mono text-lg"
                                            placeholder="000000"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-200 disabled:opacity-50"
                                >
                                    {loading ? <span className="loading loading-spinner loading-sm"></span> : "Verify OTP"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    className="w-full py-2 text-amber-700 hover:text-amber-800 font-medium"
                                >
                                    Resend OTP
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <>
                            <div className="text-center mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                <h2 className="text-xl font-serif font-bold text-stone-800">Create New Password</h2>
                                <p className="text-stone-600 mt-2">Enter your new password below</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400"
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-200 disabled:opacity-50"
                                >
                                    {loading ? <span className="loading loading-spinner loading-sm"></span> : "Reset Password"}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
