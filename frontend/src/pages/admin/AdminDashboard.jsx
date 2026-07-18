import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Shield, Users, Clock, CheckCircle, XCircle, 
  LogOut, Eye, RefreshCw, Search,
  UserCheck, UserX, FileText, MapPin, Calendar,
  Loader2, X, FileQuestion, Trash2, Edit3, CreditCard,
  UserCog, AlertTriangle, ShieldCheck, ShieldOff
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/useAuth";
import api from "../../lib/axios";

const createEmptyBookingReport = (currentYear) => ({
  availableYears: [currentYear],
  summary: {
    totalBookings: 0,
    totalParticipants: 0,
    pendingBookings: 0,
    acceptedBookings: 0,
    awaitingPaymentBookings: 0,
    scheduledBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    rejectedBookings: 0,
    cancelledBookings: 0,
    paidBookings: 0,
    totalPaidAmount: 0,
  },
  reports: [],
});

const REPORT_MONTH_OPTIONS = [
  { value: "all", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const formatGuideAddress = (guideAddress) => {
  if (!guideAddress?.regionName) {
    return 'Not provided';
  }

  return [
    guideAddress.streetAddress,
    guideAddress.barangayName,
    guideAddress.cityMunicipalityName,
    guideAddress.provinceName,
    guideAddress.regionName,
  ]
    .filter(Boolean)
    .join(', ');
};

const getLivenessStatusLabel = (status) => {
  if (status === 'verified') return 'Verified';
  if (status === 'rejected') return 'Rejected';
  if (status === 'pending') return 'Pending Review';
  return 'Not Submitted';
};

const AdminDashboard = () => {
  const currentYear = new Date().getFullYear();
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
  const [allGuides, setAllGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [documentRequestReason, setDocumentRequestReason] = useState("");
  // User Management State
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [mainTab, setMainTab] = useState("guides");
  const [editedUserData, setEditedUserData] = useState({}); // "guides" or "users"
  const [reportLoading, setReportLoading] = useState(true);
  const [reportFilters, setReportFilters] = useState({ month: "all", year: String(currentYear) });
  const [bookingReport, setBookingReport] = useState(() => createEmptyBookingReport(currentYear));
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBookingReport();
  }, [reportFilters.month, reportFilters.year]);

  const fetchData = async () => {
    setLoading(true);
    setUsersLoading(true);
    
    // Fetch guides data and users data in parallel but update state as each completes
    const guidesPromise = Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/pending-guides"),
      api.get("/admin/guides"),
      api.get("/admin/active-guides"),
      api.get("/bookings/stats").catch(() => ({ data: {} })),
    ]).then(([statsRes, , allRes, , bookingStatsRes]) => {
      setStats(statsRes.data);
      setAllGuides(allRes.data);
      setBookingStats(bookingStatsRes.data);
      setLoading(false);
    }).catch((error) => {
      toast.error("Failed to fetch guides data");
      console.error(error);
      setLoading(false);
    });

    const usersPromise = api.get("/admin/users")
      .then((usersRes) => {
        setAllUsers(usersRes.data);
        setUsersLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setAllUsers([]);
        setUsersLoading(false);
      });

    await Promise.all([guidesPromise, usersPromise]);
  };

  const fetchBookingReport = async (filters = reportFilters) => {
    setReportLoading(true);
    try {
      const params = {};

      if (filters.month !== "all") {
        params.month = filters.month;
      }

      if (filters.year && filters.year !== "all") {
        params.year = filters.year;
      }

      const reportRes = await api.get("/admin/booking-reports", { params });
      setBookingReport({
        availableYears: reportRes.data.availableYears?.length
          ? reportRes.data.availableYears
          : [currentYear],
        summary: {
          ...createEmptyBookingReport(currentYear).summary,
          ...(reportRes.data.summary || {}),
        },
        reports: reportRes.data.reports || [],
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch booking reports");
      setBookingReport(createEmptyBookingReport(currentYear));
    } finally {
      setReportLoading(false);
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

  // User Management Handlers
  const handleUpdateUser = async (userId, updates) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/user/${userId}`, updates);
      // Optimistic update - update local state immediately
      setAllUsers(prevUsers => 
        prevUsers.map(u => u._id === userId ? { ...u, ...updates } : u)
      );
      toast.success("User updated successfully!");
      setShowUserModal(false);
      setSelectedUser(null);
      setEditedUserData({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/user/${userId}`);
      // Optimistic update - remove user from local state immediately
      setAllUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
      toast.success("User permanently deleted");
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const openUserModal = (userItem) => {
    setSelectedUser(userItem);
    setEditedUserData({
      role: userItem.role
    });
    setShowUserModal(true);
  };

  const openDeleteModal = (userItem) => {
    setUserToDelete(userItem);
    setShowDeleteModal(true);
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

  // Filter users for user management
  const filteredUsers = allUsers.filter((u) =>
    u.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const reportSummary = bookingReport.summary || createEmptyBookingReport(currentYear).summary;
  const reportYears = bookingReport.availableYears?.length
    ? bookingReport.availableYears
    : [currentYear];

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

  const getRoleBadge = (role) => {
    switch (role) {
      case "tourist":
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-full">Tourist</span>;
      case "guide":
        return <span className="px-2.5 py-1 text-xs font-medium bg-sage-100 text-sage-700 border border-sage-200 rounded-full">Guide</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 rounded-full">{role}</span>;
    }
  };

  const getBookingStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 text-xs font-medium bg-sand-100 text-sand-700 border border-sand-200 rounded-full">Pending</span>;
      case "awaiting_payment":
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Awaiting Payment</span>;
      case "scheduled":
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">Scheduled</span>;
      case "active":
        return <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">Active</span>;
      case "completed":
        return <span className="px-2.5 py-1 text-xs font-medium bg-sage-100 text-sage-700 border border-sage-200 rounded-full">Completed</span>;
      case "rejected":
        return <span className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full">Rejected</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 rounded-full">{status}</span>;
    }
  };

  const formatReportDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatReportTime = (timeSlot) => {
    if (timeSlot === "AM") return "Morning";
    if (timeSlot === "PM") return "Afternoon";
    return timeSlot || "—";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
        {/* Main Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMainTab("guides")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mainTab === "guides"
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Guide Management
          </button>
          <button
            onClick={() => setMainTab("reports")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mainTab === "reports"
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Reports
          </button>
          <button
            onClick={() => setMainTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mainTab === "users"
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <UserCog className="w-4 h-4" />
            User Management ({allUsers.length})
          </button>
        </div>

        {mainTab === "guides" && (
        <>
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
        </>
        )}

        {mainTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-800">Booking Reports</h2>
                <p className="text-stone-500 text-sm">View who joined, assigned guides, destinations, schedules, and payments.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={reportFilters.month}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, month: e.target.value }))}
                  className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                >
                  {REPORT_MONTH_OPTIONS.map((monthOption) => (
                    <option key={monthOption.value} value={monthOption.value}>
                      {monthOption.label}
                    </option>
                  ))}
                </select>
                <select
                  value={reportFilters.year}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, year: e.target.value }))}
                  className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                >
                  {reportYears.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchBookingReport()}
                  disabled={reportLoading}
                  className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${reportLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-stone-600" />
              </div>
              <p className="text-3xl font-semibold text-stone-800">{reportSummary.totalBookings}</p>
              <p className="text-stone-500 text-sm mt-1">Total Bookings</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-sage-600" />
              </div>
              <p className="text-3xl font-semibold text-stone-800">{reportSummary.totalParticipants}</p>
              <p className="text-stone-500 text-sm mt-1">Participants</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-sage-600" />
              </div>
              <p className="text-3xl font-semibold text-stone-800">{reportSummary.completedBookings}</p>
              <p className="text-stone-500 text-sm mt-1">Completed Tours</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-semibold text-stone-800">{formatCurrency(reportSummary.totalPaidAmount)}</p>
              <p className="text-stone-500 text-sm mt-1">Paid Revenue</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-semibold text-stone-800">{reportSummary.pendingBookings}</p>
              <p className="text-stone-500 text-xs mt-1">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-semibold text-stone-800">{reportSummary.awaitingPaymentBookings}</p>
              <p className="text-stone-500 text-xs mt-1">Awaiting Payment</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-semibold text-stone-800">{reportSummary.scheduledBookings}</p>
              <p className="text-stone-500 text-xs mt-1">Scheduled</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-semibold text-stone-800">{reportSummary.activeBookings}</p>
              <p className="text-stone-500 text-xs mt-1">Active</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-semibold text-stone-800">{reportSummary.rejectedBookings}</p>
              <p className="text-stone-500 text-xs mt-1">Rejected</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-semibold text-stone-800">{reportSummary.paidBookings}</p>
              <p className="text-stone-500 text-xs mt-1">Paid Bookings</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200">
              <h3 className="text-lg font-semibold text-stone-800">Detailed Booking Report</h3>
              <p className="text-stone-500 text-sm mt-1">Filtered by tour date using the selected month and year.</p>
            </div>

            {reportLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 text-stone-400 animate-spin mx-auto mb-2" />
                <p className="text-stone-500 text-sm">Loading reports...</p>
              </div>
            ) : bookingReport.reports.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No bookings found for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Tourist</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Guide</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Where</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">When</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Joined</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookingReport.reports.map((report) => (
                      <tr key={report._id} className="hover:bg-stone-50 transition-colors align-top">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-stone-800">{report.tourist?.fullName || "Unknown Tourist"}</p>
                            <p className="text-stone-500 text-sm">{report.tourist?.email || "—"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-stone-800">{report.guide?.fullName || "Unassigned"}</p>
                            <p className="text-stone-500 text-sm">{report.guide?.email || "—"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="max-w-xs">
                            <p className="font-medium text-stone-800">{report.title}</p>
                            <p className="text-stone-500 text-sm mt-1">{report.routeSummary}</p>
                            <p className="text-stone-400 text-xs mt-1">Meeting point: {report.meetingPoint || "Not specified"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-stone-700">
                            <p className="font-medium">{formatReportDate(report.preferredDate)}</p>
                            <p className="text-stone-500 mt-1">{formatReportTime(report.timeSlot)}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-700 text-sm">{report.numberOfPeople}</td>
                        <td className="px-5 py-4">{getBookingStatusBadge(report.status)}</td>
                        <td className="px-5 py-4">
                          {report.payment ? (
                            <div>
                              <p className="font-medium text-stone-800">{formatCurrency(report.payment.amount)}</p>
                              <p className="text-stone-500 text-sm capitalize mt-1">{report.payment.status}</p>
                              <p className="text-stone-400 text-xs mt-1">Paid at: {formatReportDate(report.payment.paidAt)}</p>
                            </div>
                          ) : (
                            <span className="text-stone-400 text-sm">No payment yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {/* User Management Section */}
        {mainTab === "users" && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b border-stone-200 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">All Users</h2>
              <p className="text-stone-500 text-sm">Manage user roles</p>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Search users..."
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

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-stone-400 animate-spin mx-auto mb-2" />
                      <p className="text-stone-500 text-sm">Loading users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-500">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold">
                              {userItem.fullName?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">{userItem.fullName}</p>
                            <p className="text-stone-500 text-sm">{userItem.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{getRoleBadge(userItem.role)}</td>
                      <td className="px-5 py-4 text-stone-500 text-sm">
                        {new Date(userItem.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openUserModal(userItem)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(userItem)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
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
                    {new Date(selectedGuide.guideApplicationSubmittedAt || selectedGuide.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 sm:col-span-2">
                  <p className="text-stone-500 text-sm mb-1">Guide Address</p>
                  <p className="text-stone-800 font-medium">{formatGuideAddress(selectedGuide.guideAddress)}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-stone-500 text-sm mb-1">Liveness Review</p>
                  <p className="text-stone-800 font-medium">{getLivenessStatusLabel(selectedGuide.livenessCheckStatus)}</p>
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

              <div>
                <p className="text-stone-500 text-sm mb-3">Live Selfie Capture</p>
                <div className="bg-stone-50 rounded-xl p-4">
                  {selectedGuide.livenessSelfieUrl ? (
                    <img
                      src={selectedGuide.livenessSelfieUrl}
                      alt="Liveness capture"
                      className="w-full max-h-72 object-contain rounded-lg bg-white border border-stone-200"
                    />
                  ) : (
                    <p className="text-stone-500 text-sm">No liveness selfie submitted.</p>
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

      {/* User Edit Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="text-xl font-serif font-semibold text-stone-800">Edit User</h2>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-xl">
                    {selectedUser.fullName?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-800">{selectedUser.fullName}</h3>
                  <p className="text-stone-500">{selectedUser.email}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                {/* Role */}
                <div>
                  <label className="block text-stone-600 text-sm font-medium mb-2">Role</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditedUserData({ ...editedUserData, role: "tourist", guideStatus: null })}
                      disabled={actionLoading}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                        editedUserData.role === "tourist"
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Tourist
                    </button>
                    <button
                      onClick={() => setEditedUserData({ ...editedUserData, role: "guide", guideStatus: "approved" })}
                      disabled={actionLoading}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                        editedUserData.role === "guide"
                          ? "bg-sage-100 text-sage-700 border-2 border-sage-300"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Guide
                    </button>
                  </div>
                </div>

              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setEditedUserData({});
                  }}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateUser(selectedUser._id, editedUserData)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Delete User</h2>
              <p className="text-stone-500 mb-2">
                Are you sure you want to permanently delete this user?
              </p>
              <div className="bg-stone-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-stone-800">{userToDelete.fullName}</p>
                <p className="text-stone-500 text-sm">{userToDelete.email}</p>
              </div>
              <p className="text-red-600 text-sm mb-6">
                This action cannot be undone. All user data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(userToDelete._id)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
