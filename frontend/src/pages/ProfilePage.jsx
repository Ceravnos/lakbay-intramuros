import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
    User, Mail, Phone, FileText, Upload, CheckCircle, 
    Clock, XCircle, Loader2, Shield, Compass, ToggleLeft, ToggleRight, MapPin, Star, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

const ProfilePage = () => {
    const { user, applyForGuide, hasPendingGuideApplication, isApprovedGuide, isGuideMode, toggleGuideMode, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [togglingMode, setTogglingMode] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    
    const [showGuideForm, setShowGuideForm] = useState(false);
    const [guideFormData, setGuideFormData] = useState({
        contactNumber: user?.phoneNumber || '',
        accreditationFile: null,
        accreditationFileName: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Handle profile picture upload
    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Profile picture must be less than 2MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        setUploadingPicture(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    await api.put('/users/profile-picture', {
                        profilePicture: reader.result
                    });
                    toast.success('Profile picture updated!');
                    if (refreshUser) {
                        await refreshUser();
                    }
                } catch (error) {
                    toast.error('Failed to update profile picture');
                } finally {
                    setUploadingPicture(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error('Failed to process image');
            setUploadingPicture(false);
        }
    };

    const averageRating =
    user?.totalRatings > 0
        ? (user.totalStars / user.totalRatings).toFixed(1)
        : null;


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setGuideFormData(prev => ({
                    ...prev,
                    accreditationFile: reader.result,
                    accreditationFileName: file.name,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGuideApplication = async (e) => {
        e.preventDefault();
        
        if (!guideFormData.contactNumber) {
            toast.error('Please enter your contact number');
            return;
        }
        
        if (!guideFormData.accreditationFile) {
            toast.error('Please upload your accreditation document');
            return;
        }

        setSubmitting(true);
        try {
            await applyForGuide(
                guideFormData.accreditationFile,
                guideFormData.accreditationFileName
            );
            toast.success('Application submitted successfully!');
            setShowGuideForm(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    const getGuideStatusBadge = () => {
        if (isApprovedGuide) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage-100 text-sage-700 text-sm font-medium rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    Approved Guide
                </span>
            );
        }
        if (hasPendingGuideApplication) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 text-sand-700 text-sm font-medium rounded-full">
                    <Clock className="w-4 h-4" />
                    Application Pending
                </span>
            );
        }
        if (user?.guideStatus === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                    <XCircle className="w-4 h-4" />
                    Application Rejected
                </span>
            );
        }
        if (user?.guideStatus === 'documents_requested') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                    <FileText className="w-4 h-4" />
                    Documents Requested
                </span>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-stone-50">
            <Navbar />
            
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
                    <div className="flex items-start gap-4">
                        {/* Profile Picture with Upload */}
                        <div className="relative group">
                            <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center overflow-hidden">
                                {user?.profilePicture ? (
                                    <img 
                                        src={user.profilePicture} 
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sage-700 font-bold text-3xl">
                                        {user?.fullName?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            {/* Upload overlay */}
                            <label 
                                htmlFor="profile-picture-input"
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                            >
                                {uploadingPicture ? (
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                            </label>
                            <input
                                type="file"
                                id="profile-picture-input"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                                disabled={uploadingPicture}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-serif font-semibold text-stone-800">
                                    {user?.fullName}
                                </h1>
                                {isApprovedGuide && (
                                    <div className="flex items-center gap-1 text-sm text-stone-600">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">
                                            {averageRating ?? "New"}
                                        </span>
                                        {user?.totalRatings > 0 && (
                                            <span className="text-stone-400">
                                                ({user.totalRatings})
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-stone-500 flex items-center gap-2 mt-1">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </p>
                            {user?.phoneNumber && (
                                <p className="text-stone-500 flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4" />
                                    {user.phoneNumber}
                                </p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-600 text-sm font-medium rounded-full capitalize">
                                    {user?.role === 'guide' ? (
                                        <Compass className="w-4 h-4" />
                                    ) : user?.role === 'admin' ? (
                                        <Shield className="w-4 h-4" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                    {user?.role}
                                </span>
                                {getGuideStatusBadge()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guide Application Section */}
                {user?.role === 'tourist' && !hasPendingGuideApplication && user?.guideStatus !== 'documents_requested' && (
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-serif font-semibold text-stone-800 mb-1">
                                    Become a Tour Guide
                                </h2>
                                <p className="text-stone-500 text-sm">
                                    Share your knowledge of Intramuros and earn by guiding tourists.
                                </p>
                            </div>
                            {!showGuideForm && (
                                <button
                                    onClick={() => setShowGuideForm(true)}
                                    className="px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Apply Now
                                </button>
                            )}
                        </div>

                        {showGuideForm && (
                            <form onSubmit={handleGuideApplication} className="mt-6 space-y-4">
                                {/* Profile Picture Required Notice */}
                                {!user?.profilePicture && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                        <p className="text-amber-800 text-sm">
                                            <strong>Note:</strong> A profile picture is required before applying as a tour guide. 
                                            Please upload one by clicking on your profile picture above.
                                        </p>
                                    </div>
                                )}

                                {/* Contact number is pre-filled from signup - show as read-only */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Contact Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="tel"
                                            value={user?.phoneNumber || ''}
                                            readOnly
                                            className="w-full pl-11 pr-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">Phone number from your account</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Accreditation / ID Document
                                    </label>
                                    <p className="text-xs text-stone-500 mb-2">
                                        Upload your DOT accreditation card, government ID, or relevant certification.
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="accreditation-file"
                                        />
                                        <label
                                            htmlFor="accreditation-file"
                                            className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-terracotta-400 hover:bg-terracotta-50/50 transition-colors"
                                        >
                                            {guideFormData.accreditationFileName ? (
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-8 h-8 text-terracotta-500" />
                                                    <div className="text-left">
                                                        <p className="font-medium text-stone-800">
                                                            {guideFormData.accreditationFileName}
                                                        </p>
                                                        <p className="text-xs text-stone-500">
                                                            Click to change file
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                                                    <p className="text-stone-600 font-medium">
                                                        Click to upload
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        PNG, JPG, or PDF (max 5MB)
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowGuideForm(false)}
                                        className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !user?.profilePicture}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Submit Application'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Pending Application Notice */}
                {hasPendingGuideApplication && (
                    <div className="bg-sand-50 border border-sand-200 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-sand-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Clock className="w-6 h-6 text-sand-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-800 mb-1">
                                    Application Under Review
                                </h3>
                                <p className="text-stone-600 text-sm">
                                    Your guide application is being reviewed by our admin team. 
                                    You'll be notified once a decision has been made. This usually takes 1-3 business days.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejected Application Notice */}
                {user?.guideStatus === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-800 mb-1">
                                    Application Rejected
                                </h3>
                                <p className="text-stone-600 text-sm mb-2">
                                    Unfortunately, your guide application was not approved.
                                </p>
                                {user?.rejectionReason && (
                                    <p className="text-red-600 text-sm">
                                        Reason: {user.rejectionReason}
                                    </p>
                                )}
                                <button
                                    onClick={() => setShowGuideForm(true)}
                                    className="mt-3 text-terracotta-600 hover:text-terracotta-700 text-sm font-medium"
                                >
                                    Apply Again →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Requested Notice */}
                {user?.guideStatus === 'documents_requested' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-stone-800 mb-1">
                                    Updated Documents Required
                                </h3>
                                <p className="text-stone-600 text-sm mb-2">
                                    The admin has requested updated documents for your guide application.
                                </p>
                                {user?.documentRequestReason && (
                                    <p className="text-amber-700 text-sm mb-3">
                                        Reason: {user.documentRequestReason}
                                    </p>
                                )}
                                {!showGuideForm && (
                                    <button
                                        onClick={() => setShowGuideForm(true)}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm"
                                    >
                                        Upload New Documents
                                    </button>
                                )}
                            </div>
                        </div>

                        {showGuideForm && (
                            <form onSubmit={handleGuideApplication} className="mt-6 space-y-4 border-t border-amber-200 pt-6">
                                {/* Profile Picture Required Notice */}
                                {!user?.profilePicture && (
                                    <div className="bg-sand-50 border border-sand-200 rounded-xl p-4">
                                        <p className="text-sand-700 text-sm">
                                            <strong>Note:</strong> A profile picture is required for guide applications. Please upload one above before submitting.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-stone-600 text-sm mb-2">
                                        Contact Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={guideFormData.contactNumber}
                                        onChange={(e) => setGuideFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="Enter contact number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-stone-600 text-sm mb-2">
                                        DOT Accreditation Document
                                    </label>
                                    <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-amber-400 transition-colors">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setGuideFormData(prev => ({
                                                            ...prev,
                                                            accreditationFile: reader.result,
                                                            accreditationFileName: file.name,
                                                        }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="hidden"
                                            id="accreditation-reupload"
                                            required
                                        />
                                        <label htmlFor="accreditation-reupload" className="cursor-pointer">
                                            <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                                            <p className="text-stone-600 text-sm">
                                                {guideFormData.accreditationFileName || 'Click to upload your DOT accreditation'}
                                            </p>
                                            <p className="text-stone-400 text-xs mt-1">PDF, JPG, or PNG (max 5MB)</p>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowGuideForm(false)}
                                        className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !user?.profilePicture}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Resubmit Application'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Approved Guide - Mode Switch Card */}
                {isApprovedGuide && (
                    <div className={`rounded-2xl p-6 mb-6 border-2 transition-colors ${
                        isGuideMode 
                            ? 'bg-sage-50 border-sage-300' 
                            : 'bg-white border-stone-200'
                    }`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isGuideMode ? 'bg-sage-200' : 'bg-stone-100'
                                }`}>
                                    {isGuideMode ? (
                                        <Compass className="w-6 h-6 text-sage-700" />
                                    ) : (
                                        <MapPin className="w-6 h-6 text-stone-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-800 mb-1">
                                        {isGuideMode ? 'Guide Mode Active' : 'Tourist Mode Active'}
                                    </h3>
                                    <p className="text-stone-600 text-sm">
                                        {isGuideMode 
                                            ? 'You can view and accept tour requests from tourists.'
                                            : 'Switch to Guide Mode to manage your tour bookings.'
                                        }
                                    </p>
                                    {user?.contactNumber && (
                                        <p className="text-stone-500 text-sm flex items-center gap-2 mt-2">
                                            <Phone className="w-4 h-4" />
                                            {user.contactNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    setTogglingMode(true);
                                    try {
                                        await toggleGuideMode();
                                        if (!isGuideMode) {
                                            navigate('/guide/dashboard');
                                        }
                                    } catch (error) {
                                        toast.error('Failed to switch mode');
                                    } finally {
                                        setTogglingMode(false);
                                    }
                                }}
                                disabled={togglingMode}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                                    isGuideMode
                                        ? 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                                        : 'bg-sage-600 text-white hover:bg-sage-700'
                                }`}
                            >
                                {togglingMode ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isGuideMode ? (
                                    <>
                                        <ToggleRight className="w-5 h-5" />
                                        Switch to Tourist
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="w-5 h-5" />
                                        Switch to Guide
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Account Info */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                    <h2 className="text-lg font-serif font-semibold text-stone-800 mb-4">
                        Account Information
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-stone-100">
                            <span className="text-stone-500">Full Name</span>
                            <span className="text-stone-800 font-medium">{user?.fullName}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-stone-100">
                            <span className="text-stone-500">Email</span>
                            <span className="text-stone-800 font-medium">{user?.email}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-stone-100">
                            <span className="text-stone-500">Phone</span>
                            <span className="text-stone-800 font-medium">{user?.phoneNumber}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-stone-100">
                            <span className="text-stone-500">Account Type</span>
                            <span className="text-stone-800 font-medium capitalize">{user?.role}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-stone-100">
                            <span className="text-stone-500">Member Since</span>
                            <span className="text-stone-800 font-medium">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                            </span>
                        </div>
                        {isApprovedGuide && (
                            <>
                                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                    <span className="text-stone-500">Total Stars</span>
                                    <span className="flex items-center gap-1 text-stone-800 font-medium">
                                        {user?.totalStars}
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                    <span className="text-stone-500">Total Ratings</span>
                                    <span className="flex items-center gap-1 text-stone-800 font-medium">
                                        {user?.totalRatings}
                                        <User className="w-4 h-4 fill-stone-500 text-stone-500" />
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <span className="text-stone-500">Current Rating</span>
                                    <span className="text-stone-800 font-medium">
                                        {user?.totalRatings > 0
                                            ? (user.totalStars / user.totalRatings).toFixed(1)
                                            : "—"}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
