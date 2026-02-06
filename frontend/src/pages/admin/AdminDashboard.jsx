import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
    Shield, Users, Clock, CheckCircle, XCircle, 
    LogOut, Eye, RefreshCw, Search,
    UserCheck, UserX, FileText, MapPin, Calendar,
    Loader2, X, FileQuestion
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalGuides: 0,
        activeGuides: 0,
        pendingGuides: 0,
        approvedGuides: 0,
        rejectedGuides: 0,
    });
    const [bookingStats, setBookingStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
    });
    const [pendingGuides, setPendingGuides] = useState([]);
    const [allGuides, setAllGuides] = useState([]);
    const [activeGuides, setActiveGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [documentRequestReason, setDocumentRequestReason] = useState("");
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, pendingRes, allRes, activeRes, bookingStatsRes] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/pending-guides"),
                api.get("/admin/guides"),
                api.get("/admin/active-guides"),
                api.get("/bookings/stats").catch(() => ({ data: {} })),
            ]);
            setStats(statsRes.data);
            setPendingGuides(pendingRes.data);
            setAllGuides(allRes.data);
            setActiveGuides(activeRes.data);
            setBookingStats(bookingStatsRes.data);
        } catch (error) {
            toast.error("Failed to fetch data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (guideId) => {
        setActionLoading(true);
        try {
            await api.put(`/admin/approve-guide/${guideId}`);
            toast.success("Tour guide approved successfully!");
            fetchData();
            setShowModal(false);
            setSelectedGuide(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve guide");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (guideId) => {
        setActionLoading(true);
        try {
            await api.put(`/admin/reject-guide/${guideId}`, { reason: rejectionReason });
            toast.success("Tour guide rejected");
            fetchData();
            setShowModal(false);
            setSelectedGuide(null);
            setRejectionReason("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject guide");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestDocuments = async (guideId) => {
        setActionLoading(true);
        try {
            await api.put(`/admin/request-documents/${guideId}`, { reason: documentRequestReason });
            toast.success("Document request sent to guide");
            fetchData();
            setShowModal(false);
            setSelectedGuide(null);
            setDocumentRequestReason("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to request documents");
        } finally {
            setActionLoading(false);
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


    const openGuideModal = (guide) => {
        setSelectedGuide(guide);
        setShowModal(true);
    };

    const filteredGuides = allGuides
    .filter((guide) => {
        if (activeTab === "pending") {
            return guide.status === "pending";
        }

        if (activeTab === "active") {
            return guide.activityStatus === "active";
        }

        return true; // "all"
    })
    .filter((guide) =>
        guide.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.email.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return <span className="px-2.5 py-1 text-xs font-medium bg-sand-100 text-sand-700 border border-sand-200 rounded-full">Pending</span>;
            case "approved":
                return <span className="px-2.5 py-1 text-xs font-medium bg-sage-100 text-sage-700 border border-sage-200 rounded-full">Approved</span>;
            case "rejected":
                return <span className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full">Rejected</span>;
            case "documents_requested":
                return <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Documents Requested</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <header className="bg-white border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-serif font-semibold text-stone-800">Admin Dashboard</h1>
                                <p className="text-stone-500 text-sm">Lakbay Intramuros</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-stone-800">{user?.fullName || "Admin"}</p>
                                <p className="text-xs text-stone-500">Administrator</p>
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

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Bento Grid Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Guides - Large */}
                    <div className="col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Total Tour Guides</p>
                                <p className="text-5xl font-semibold text-stone-800 mt-2">{stats.totalGuides}</p>
                                <p className="text-stone-400 text-sm mt-2">Registered in the system</p>
                            </div>
                            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center">
                                <Users className="w-7 h-7 text-stone-600" />
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white rounded-2xl border border-sand-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-sand-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-sand-600" />
                            </div>
                            {stats.pendingGuides > 0 && (
                                <span className="px-2 py-0.5 bg-sand-100 text-sand-700 text-xs font-medium rounded-full">
                                    Action needed
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-semibold text-sand-700">{stats.pendingGuides}</p>
                        <p className="text-stone-500 text-sm mt-1">Pending Approval</p>
                    </div>

                    {/* Approved */}
                    <div className="bg-white rounded-2xl border border-sage-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-sage-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold text-sage-700">{stats.approvedGuides}</p>
                        <p className="text-stone-500 text-sm mt-1">Approved Guides</p>
                    </div>

                    {/* Bookings Stats */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-terracotta-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold text-stone-800">{bookingStats.totalBookings || 0}</p>
                        <p className="text-stone-500 text-sm mt-1">Total Bookings</p>
                    </div>

                    {/* Completed Tours */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-stone-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold text-stone-800">{bookingStats.completedBookings || 0}</p>
                        <p className="text-stone-500 text-sm mt-1">Completed Tours</p>
                    </div>

                    {/* Rejected */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold text-stone-700">{stats.rejectedGuides}</p>
                        <p className="text-stone-500 text-sm mt-1">Rejected</p>
                    </div>
                </div>

                {/* Guide Management */}
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b border-stone-200 gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab("pending")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === "pending"
                                        ? "bg-stone-800 text-white"
                                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                }`}
                            >
                                Pending ({stats.pendingGuides})
                            </button>
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === "all"
                                        ? "bg-stone-800 text-white"
                                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                }`}
                            >
                                All Guides ({stats.totalGuides})
                            </button>
                            <button
                                onClick={() => setActiveTab("active")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === "active"
                                        ? "bg-stone-800 text-white"
                                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                }`}
                            >
                                Active Guides ({stats.activeGuides})
                            </button>

                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search guides..."
                                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Guides List */}
                    <div className="divide-y divide-stone-100">
                        {loading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-6 h-6 text-stone-400 animate-spin mx-auto" />
                            </div>
                        ) : filteredGuides.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                <p className="text-stone-500">No guides found</p>
                            </div>
                        ) : (
                            filteredGuides.map((guide) => (
                                <div
                                    key={guide._id}
                                    className="p-5 hover:bg-stone-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-sage-100 rounded-full flex items-center justify-center">
                                                <span className="text-sage-700 font-semibold">
                                                    {guide.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-stone-800">
                                                        {guide.fullName}
                                                    </h3>
                                                    {guide.activityStatus === "active" && (
                                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-stone-500 text-sm">{guide.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(guide.status)}
                                            <button
                                                onClick={() => openGuideModal(guide)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="hidden sm:inline">View</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Guide Detail Modal */}
            {showModal && selectedGuide && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-stone-200">
                            <h2 className="text-xl font-serif font-semibold text-stone-800">Guide Application</h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedGuide(null);
                                    setRejectionReason("");
                                }}
                                className="text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Guide Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
                                    <span className="text-sage-700 font-bold text-2xl">
                                        {selectedGuide.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-stone-800">{selectedGuide.fullName}</h3>
                                    <p className="text-stone-500">{selectedGuide.email}</p>
                                    <div className="mt-1">{getStatusBadge(selectedGuide.status)}</div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-stone-50 rounded-xl p-4">
                                    <p className="text-stone-500 text-sm mb-1">Contact Number</p>
                                    <p className="text-stone-800 font-medium">{selectedGuide.contactNumber}</p>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-4">
                                    <p className="text-stone-500 text-sm mb-1">Application Date</p>
                                    <p className="text-stone-800 font-medium">
                                        {new Date(selectedGuide.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Accreditation Document */}
                            <div>
                                <p className="text-stone-500 text-sm mb-3">Accreditation / ID Document</p>
                                <div className="bg-stone-50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FileText className="w-5 h-5 text-terracotta-500" />
                                        <span className="text-stone-800">{selectedGuide.accreditationFileName}</span>
                                    </div>
                                    {selectedGuide.accreditationFile && (
                                        selectedGuide.accreditationFile.startsWith('data:image') ? (
                                            <img
                                                src={selectedGuide.accreditationFile}
                                                alt="Accreditation"
                                                className="w-full max-h-64 object-contain rounded-lg bg-white border border-stone-200"
                                            />
                                        ) : (
                                            <a
                                                href={selectedGuide.accreditationFile}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Document
                                            </a>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Rejection Reason (if rejected) */}
                            {selectedGuide.status === "rejected" && selectedGuide.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-sm font-medium mb-1">Rejection Reason</p>
                                    <p className="text-stone-700">{selectedGuide.rejectionReason}</p>
                                </div>
                            )}

                            {/* Action Buttons (only for pending) */}
                            {selectedGuide.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t border-stone-200">
                                    <div>
                                        <label className="block text-stone-600 text-sm mb-2">
                                            Rejection Reason (optional)
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter reason for rejection..."
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-stone-600 text-sm mb-2">
                                            Document Request Reason (optional)
                                        </label>
                                        <textarea
                                            value={documentRequestReason}
                                            onChange={(e) => setDocumentRequestReason(e.target.value)}
                                            placeholder="Enter reason for requesting updated documents..."
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(selectedGuide._id)}
                                            disabled={actionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserCheck className="w-5 h-5" />
                                                    Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleRequestDocuments(selectedGuide._id)}
                                            disabled={actionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <FileQuestion className="w-5 h-5" />
                                                    Request Docs
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedGuide._id)}
                                            disabled={actionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserX className="w-5 h-5" />
                                                    Reject
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Document Request Status */}
                            {selectedGuide.status === "documents_requested" && selectedGuide.documentRequestReason && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <p className="text-amber-700 text-sm font-medium mb-1">Documents Requested</p>
                                    <p className="text-stone-700">{selectedGuide.documentRequestReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
