import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { PlusIcon, LogOut, Compass, Shield, MapPin, ChevronDown, ToggleLeft, ToggleRight, Loader2, User } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

const Navbar = () => {
    const { user, isAuthenticated, logout, isApprovedGuide, isGuideMode, toggleGuideMode } = useAuth();
    const navigate = useNavigate();
    const [togglingMode, setTogglingMode] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleToggleGuideMode = async () => {
        setTogglingMode(true);
        try {
            const result = await toggleGuideMode();
            toast.success(result.message);
            if (result.isGuideMode) {
                navigate("/guide/dashboard");
            } else {
                navigate("/");
            }
        } catch (error) {
            toast.error("Failed to toggle mode");
        } finally {
            setTogglingMode(false);
        }
    };

    return (
        <header className="bg-white border-b border-stone-200">
            <div className="mx-auto max-w-6xl px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group"> 
                        <MapPin className="w-6 h-6 text-terracotta-600" />
                        <span className="text-2xl font-serif font-semibold text-stone-800 tracking-tight group-hover:text-terracotta-600 transition-colors">
                            Lakbay Intramuros
                        </span>
                    </Link>
                    <div className="flex gap-3 items-center">
                        {isAuthenticated ? (
                            <>
                                {/* Prominent Mode Toggle Button for Approved Guides */}
                                {isApprovedGuide && (
                                    <button
                                        onClick={handleToggleGuideMode}
                                        disabled={togglingMode}
                                        className={`hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                                            isGuideMode 
                                                ? "bg-sage-50 text-sage-700 border-sage-200 hover:bg-sage-100" 
                                                : "bg-terracotta-50 text-terracotta-700 border-terracotta-200 hover:bg-terracotta-100"
                                        }`}
                                    >
                                        {togglingMode ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isGuideMode ? (
                                            <MapPin className="w-4 h-4" />
                                        ) : (
                                            <Compass className="w-4 h-4" />
                                        )}
                                        {isGuideMode ? "Tourist Mode" : "Guide Mode"}
                                    </button>
                                )}

                                {/* User dropdown */}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-sage-100 border border-sage-300 flex items-center justify-center">
                                            <span className="text-sage-700 font-medium text-sm">
                                                {user?.fullName?.charAt(0).toUpperCase() || "U"}
                                            </span>
                                        </div>
                                        <span className="hidden sm:block text-sm font-medium text-stone-700">
                                            {user?.fullName?.split(' ')[0]}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-stone-400" />
                                    </button>
                                    
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        <div className="px-4 py-3 border-b border-stone-100">
                                            <p className="text-sm font-medium text-stone-800">{user?.fullName}</p>
                                            <p className="text-xs text-stone-500 capitalize">{user?.role}</p>
                                        </div>
                                        
                                        {user?.role === "admin" && (
                                            <Link 
                                                to="/admin/dashboard" 
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                <Shield className="w-4 h-4 text-stone-500" />
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        
                                        {isApprovedGuide && (
                                            <button 
                                                onClick={handleToggleGuideMode}
                                                disabled={togglingMode}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors w-full"
                                            >
                                                {togglingMode ? (
                                                    <Loader2 className="w-4 h-4 text-stone-500 animate-spin" />
                                                ) : isGuideMode ? (
                                                    <ToggleRight className="w-4 h-4 text-sage-600" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 text-stone-500" />
                                                )}
                                                {isGuideMode ? "Switch to Tourist Mode" : "Switch to Guide Mode"}
                                            </button>
                                        )}
                                        
                                        {isGuideMode && (
                                            <Link 
                                                to="/guide/dashboard" 
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                <Compass className="w-4 h-4 text-stone-500" />
                                                Guide Dashboard
                                            </Link>
                                        )}
                                        
                                        {!isGuideMode && (
                                            <Link 
                                                to="/itinerary" 
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors sm:hidden"
                                            >
                                                <PlusIcon className="w-4 h-4 text-stone-500" />
                                                New Itinerary
                                            </Link>
                                        )}
                                        
                                        <Link 
                                            to="/profile" 
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                        >
                                            <User className="w-4 h-4 text-stone-500" />
                                            Profile
                                        </Link>
                                        
                                        <div className="border-t border-stone-100 mt-1 pt-1">
                                            <button 
                                                onClick={handleLogout} 
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link 
                                    to="/signup" 
                                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar