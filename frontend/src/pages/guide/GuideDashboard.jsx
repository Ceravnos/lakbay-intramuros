import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
    Compass, Clock, CheckCircle, Calendar, Users, MapPin,
    LogOut, RefreshCw, User, Phone, Mail, ChevronRight,
    History, ClipboardList, Loader2, Map, AlertCircle,
    XCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";
import { socket } from '../../lib/socket'

const GuideDashboard = () => {
    const { user, logout, toggleGuideMode, toggleActivityStatus, refreshUser } = useAuth();

    const [activeTab, setActiveTab] = useState("pending");
    const [pendingBookings, setPendingBookings] = useState([]);
    const [acceptedBookings, setAcceptedBookings] = useState([]);
    const [completedBookings, setCompletedBookings] = useState([]);
    const [rejectedBookings, setRejectedBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [error, setError] = useState(null);
    const [switchingMode, setSwitchingMode] = useState(false);

    const navigate = useNavigate();

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const [pendingRes, acceptedRes, historyRes, rejectedRes] = await Promise.all([
                api.get("/bookings/pending"),
                api.get("/bookings/my-accepted"),
                api.get("/bookings/history"),
                api.get("/bookings/my-rejected"),
            ]);
            setPendingBookings(pendingRes.data);
            setAcceptedBookings(acceptedRes.data);
            setCompletedBookings(historyRes.data.completedBookings || []);
            setRejectedBookings(rejectedRes.data);
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || "Failed to fetch bookings";
            setError(errorMessage);
            
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

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (!user || user.role !== "guide") return;

        const handleNewBooking = (data) => {
            toast.success(data.message); // or toast(...)
            fetchBookings(); // 🔄 refresh dashboard
        };

        socket.on("booking:requested", handleNewBooking);

        return () => {
            socket.off("booking:requested", handleNewBooking);
        };
    }, [user, fetchBookings]);


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

    const handleToggleActivityStatus = async () => {
        setStatusLoading(true);
        try {
            await toggleActivityStatus();
            toast.success(
                user.activityStatus === "active" ? "You are now inactive" : "You are now active"
            );
            await refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to toggle activity status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleAccept = async (bookingId) => {
        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/accept`);
            toast.success("Booking accepted!");
            fetchBookings();
            await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept booking");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookingId) => {
        const confirmed = window.confirm(
            "Are you sure you want to reject this booking? This action cannot be undone."
        );

        if (!confirmed) return;

        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/reject`);
            toast.success("Booking rejected!");
            fetchBookings();
            await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject booking");
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
            await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete booking");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
    try {
        if (user?.role === "guide") {
            await api.put("/auth/toggle-activity-status", {
                forceInactive: true
            });
        }
        } catch (err) {
            console.error(err);
        } finally {
            logout();
            navigate("/login");
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    };

    const stats = {
        pending: pendingBookings.length,
        active: acceptedBookings.length,
        completed: completedBookings.length,
        rejected: rejectedBookings.length,
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

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            {/* Activity Status Indicator */}
                            <button
                                onClick={() => {
                                    if (user?.activityStatus === "working") {
                                        toast.error("Please finish your current tour first.");
                                        return;
                                    }
                                    handleToggleActivityStatus();
                                }}
                                disabled={statusLoading}
                                className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-50"
                            >
                                {statusLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-stone-500" />
                                ) : (
                                    <span className={`w-3 h-3 rounded-full ${
                                        user?.activityStatus === 'active' 
                                            ? 'bg-green-500' 
                                            : user?.activityStatus === 'working' 
                                                ? 'bg-orange-500 animate-pulse' 
                                                : 'bg-red-500'
                                    }`} />
                                )}
                                <span className={`text-sm font-medium capitalize ${
                                    user?.activityStatus === 'active' 
                                        ? 'text-green-700' 
                                        : user?.activityStatus === 'working' 
                                            ? 'text-orange-700' 
                                            : 'text-red-700'
                                }`}>
                                    {user?.activityStatus || 'inactive'}
                                </span>
                            </button>
                            
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                    <div className="bg-white rounded-xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Rejected</p>
                                <p className="text-3xl font-semibold text-stone-700 mt-1">{stats.rejected}</p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-stone-500" />
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
                                        {user?.activityStatus === "inactive" ? (
                                            <div className="text-center py-12">
                                                <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                <p className="text-stone-600 font-medium">
                                                    Your activity status is set to inactive
                                                </p>
                                                <p className="text-stone-400 text-sm mt-1">
                                                    Change it to active to be able to get bookings.
                                                </p>
                                            </div>
                                        ) : pendingBookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                <p className="text-stone-500">No pending requests</p>
                                                <p className="text-stone-400 text-sm mt-1">
                                                    New booking requests will appear here
                                                </p>
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
                                                                    <Phone className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.touristId?.phoneNumber}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-stone-400" />
                                                                    <span>{formatDate(booking.tripDetails?.preferredDate)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-stone-400" />
                                                                    <span>{formatTime(booking.tripDetails?.preferredDate)}</span>
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
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => handleAccept(booking._id)}
                                                                disabled={actionLoading === booking._id || user?.activityStatus !== "active"}
                                                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 w-full"
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

                                                            <button
                                                                onClick={() => handleReject(booking._id)}
                                                                disabled={actionLoading === booking._id}
                                                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 w-full"
                                                            >
                                                                {actionLoading === booking._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="w-4 h-4" />
                                                                        Reject
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
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
                                                                    <Phone className="w-4 h-4 text-stone-400" />
                                                                    <span>{booking.touristId?.phoneNumber}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-stone-400" />
                                                                    <span>{formatDate(booking.tripDetails?.preferredDate)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-stone-400" />
                                                                    <span>{formatTime(booking.tripDetails?.preferredDate)}</span>
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
                                        {completedBookings.length === 0 && rejectedBookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                <p className="text-stone-500">No completed or rejected tours yet</p>
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
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Time</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Group Size</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Status</th>
                                                            <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Completed at</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {[
                                                            ...completedBookings.map(b => ({ ...b, displayStatus: "completed" })),
                                                            ...rejectedBookings.map(b => ({ ...b, displayStatus: "rejected" }))
                                                        ]
                                                        .sort((a, b) => new Date(b.completedAt || b.rejectedAt) - new Date(a.completedAt || a.rejectedAt))
                                                        .map((booking) => (
                                                            <tr key={booking._id} className="border-b border-stone-100 hover:bg-stone-50">
                                                                <td className="py-3 px-4">
                                                                    <span className="font-medium text-stone-800">{booking.tripDetails?.title}</span>
                                                                </td>
                                                                <td className="py-3 px-4 text-stone-600">{booking.touristId?.fullName}</td>
                                                                <td className="py-3 px-4 text-stone-600">{formatDate(booking.tripDetails?.preferredDate)}</td>
                                                                <td className="py-3 px-4 text-stone-600">{formatTime(booking.tripDetails?.preferredDate)}</td>
                                                                <td className="py-3 px-4 text-stone-600">{booking.tripDetails?.numberOfPeople}</td>
                                                                <td className={`py-3 px-4 text-sm ${
                                                                    booking.displayStatus === "completed" ? "text-stone-500" : "text-red-600"
                                                                }`}>
                                                                    {booking.displayStatus === "completed" ? "Completed" : "Rejected"}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-stone-500">
                                                                    {booking.displayStatus === "completed" ? formatDate(booking.completedAt) + ", " + formatTime(booking.completedAt) : ""}
                                                                </td>
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
