import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
    Compass, Clock, CheckCircle, Calendar, Users, MapPin,
    LogOut, RefreshCw, User, Phone, Mail, ChevronRight,
    History, ClipboardList, Loader2, Map, AlertCircle, BadgeCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";

const GuideDashboard = () => {
    const [activeTab, setActiveTab] = useState("pending");
    const [pendingBookings, setPendingBookings] = useState([]);
    const [acceptedBookings, setAcceptedBookings] = useState([]);
    const [completedBookings, setCompletedBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const { user, logout, toggleGuideMode, refreshUser } = useAuth();
    const [error, setError] = useState(null);
    const [switchingMode, setSwitchingMode] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const [pendingRes, acceptedRes, historyRes] = await Promise.all([
                api.get("/bookings/pending"),
                api.get("/bookings/my-accepted"),
                api.get("/bookings/history"),
            ]);
            setPendingBookings(pendingRes.data);
            setAcceptedBookings(acceptedRes.data);
            setCompletedBookings(historyRes.data);
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || "Failed to fetch bookings";
            setError(errorMessage);
            
            // If 403 error, try refreshing user data (in case status was updated)
            if (err.response?.status === 403) {
                try {
                    await refreshUser();
                    toast.info("Your account status has been updated. Please try again.");
                } catch (refreshErr) {
                    console.error("Failed to refresh user:", refreshErr);
                }
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchToTouristMode = async () => {
        setSwitchingMode(true);
        try {
            await toggleGuideMode();
            toast.success("Switched to Tourist Mode");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to switch mode");
        } finally {
            setSwitchingMode(false);
        }
    };

    const handleAccept = async (bookingId) => {
        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/accept`);
            toast.success("Booking accepted!");
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept booking");
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (bookingId) => {
        if (!window.confirm("Mark this tour as completed?")) return;
        
        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/complete`);
            toast.success("Tour marked as complete!");
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete booking");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const stats = {
        pending: pendingBookings.length,
        active: acceptedBookings.length,
        completed: completedBookings.length,
    };

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <header className="bg-white border-b border-stone-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
                                <Compass className="w-5 h-5 text-sage-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-serif font-semibold text-stone-800">Guide Dashboard</h1>
                                <p className="text-stone-500 text-sm">Lakbay Intramuros</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Status Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                                <BadgeCheck className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">Approved</span>
                            </div>
                            
                            {/* Switch to Tourist Mode Button */}
                            <button
                                onClick={handleSwitchToTouristMode}
                                disabled={switchingMode}
                                className="flex items-center gap-2 px-3 py-2 bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {switchingMode ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Map className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline text-sm font-medium">Tourist Mode</span>
                            </button>
                            
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-stone-800">{user?.fullName}</p>
                                <p className="text-xs text-stone-500">Tour Guide</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">Sign out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Pending Requests</p>
                                <p className="text-3xl font-semibold text-sand-600 mt-1">{stats.pending}</p>
                            </div>
                            <div className="w-12 h-12 bg-sand-50 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-sand-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Active Tours</p>
                                <p className="text-3xl font-semibold text-sage-600 mt-1">{stats.active}</p>
                            </div>
                            <div className="w-12 h-12 bg-sage-50 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-sage-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Completed</p>
                                <p className="text-3xl font-semibold text-stone-700 mt-1">{stats.completed}</p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-stone-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="flex border-b border-stone-200">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                                activeTab === "pending"
                                    ? "text-terracotta-600 border-b-2 border-terracotta-600 bg-terracotta-50/50"
                                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                        >
                            <ClipboardList className="w-4 h-4" />
                            Pending Requests
                            {stats.pending > 0 && (
                                <span className="px-2 py-0.5 bg-terracotta-100 text-terracotta-700 text-xs rounded-full">
                                    {stats.pending}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                                activeTab === "active"
                                    ? "text-sage-600 border-b-2 border-sage-600 bg-sage-50/50"
                                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            Active Tours
                            {stats.active > 0 && (
                                <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs rounded-full">
                                    {stats.active}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                                activeTab === "history"
                                    ? "text-stone-700 border-b-2 border-stone-700 bg-stone-50"
                                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                        >
                            <History className="w-4 h-4" />
                            History
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Refresh Button */}
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={fetchBookings}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 text-stone-500 hover:text-stone-700 text-sm transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {/* Error State with Retry */}
                        {error && !loading && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-red-800 font-medium">Failed to load bookings</p>
                                        <p className="text-red-600 text-sm mt-1">{error}</p>
                                    </div>
                                    <button
                                        onClick={fetchBookings}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Retry
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                            </div>
                        ) : !error && (
                            <>
                                {/* Pending Requests */}
                                {activeTab === "pending" && (
                                    <div className="space-y-4">
                                        {pendingBookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                <p className="text-stone-500">No pending requests</p>
                                                <p className="text-stone-400 text-sm mt-1">New booking requests will appear here</p>
                                            </div>
                                        ) : (
                                            pendingBookings.map((booking) => (
                                                <div key={booking._id} className="border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <MapPin className="w-4 h-4 text-terracotta-500" />
                                                                <h3 className="font-serif font-semibold text-stone-800">
                                                                    {booking.tripDetails?.title}
                                                                </h3>
                                                            </div>
                                                            <div className="space-y-2 text-sm text-stone-600">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.touristId?.fullName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.touristId?.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-stone-400" />
                                                                    <span>{formatDate(booking.tripDetails?.preferredDate)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}</span>
                                                                </div>
                                                                {booking.tripDetails?.notes && (
                                                                    <p className="text-stone-500 italic mt-2 pl-6">
                                                                        "{booking.tripDetails.notes}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAccept(booking._id)}
                                                            disabled={actionLoading === booking._id}
                                                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
                                                        >
                                                            {actionLoading === booking._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Accept
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Active Tours */}
                                {activeTab === "active" && (
                                    <div className="space-y-4">
                                        {acceptedBookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                <p className="text-stone-500">No active tours</p>
                                                <p className="text-stone-400 text-sm mt-1">Accept a booking to see it here</p>
                                            </div>
                                        ) : (
                                            acceptedBookings.map((booking) => (
                                                <div key={booking._id} className="border border-sage-200 bg-sage-50/30 rounded-xl p-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <MapPin className="w-4 h-4 text-sage-600" />
                                                                <h3 className="font-serif font-semibold text-stone-800">
                                                                    {booking.tripDetails?.title}
                                                                </h3>
                                                                <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs rounded-full">
                                                                    Active
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2 text-sm text-stone-600">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.touristId?.fullName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.touristId?.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-stone-400" />
                                                                    <span>{formatDate(booking.tripDetails?.preferredDate)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleComplete(booking._id)}
                                                            disabled={actionLoading === booking._id}
                                                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
                                                        >
                                                            {actionLoading === booking._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Mark Complete
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* History */}
                                {activeTab === "history" && (
                                    <div>
                                        {completedBookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                <p className="text-stone-500">No completed tours yet</p>
                                                <p className="text-stone-400 text-sm mt-1">Your tour history will appear here</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-stone-200">
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Destination</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Tourist</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Date</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Group Size</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Completed</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {completedBookings.map((booking) => (
                                                            <tr key={booking._id} className="border-b border-stone-100 hover:bg-stone-50">
                                                                <td className="py-3 px-4">
                                                                    <span className="font-medium text-stone-800">{booking.tripDetails?.title}</span>
                                                                </td>
                                                                <td className="py-3 px-4 text-stone-600">{booking.touristId?.fullName}</td>
                                                                <td className="py-3 px-4 text-stone-600">{formatDate(booking.tripDetails?.preferredDate)}</td>
                                                                <td className="py-3 px-4 text-stone-600">{booking.tripDetails?.numberOfPeople}</td>
                                                                <td className="py-3 px-4 text-stone-500 text-sm">{formatDate(booking.completedAt)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuideDashboard;
