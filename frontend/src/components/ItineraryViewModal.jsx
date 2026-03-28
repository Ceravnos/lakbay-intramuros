import { 
    X, MapPin, Clock, Users, Calendar, Navigation, 
    MessageSquare, Send, Accessibility, Baby, Heart, AlertCircle
} from 'lucide-react';

const PRIORITY_LABELS = {
    pwd: { label: 'Person with Disability (PWD)', icon: Accessibility },
    pregnant: { label: 'Pregnant Woman', icon: Baby },
    senior: { label: 'Senior Citizen (60+)', icon: Heart },
    locomotive: { label: 'Locomotive Limitations', icon: AlertCircle },
};

const ItineraryViewModal = ({
    isOpen,
    onClose,
    booking,
    onEditItinerary,
}) => {
    if (!isOpen || !booking) return null;

    const itinerary = booking.itineraryId;
    const tripDetails = booking.tripDetails;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const hours = d.getHours();
        return hours < 12 ? 'Morning (8:00 AM - 12:00 PM)' : 'Afternoon (1:00 PM - 5:00 PM)';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-terracotta-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-stone-800">{tripDetails?.title || 'Itinerary'}</h3>
                            <p className="text-sm text-stone-500">Requested by {booking.touristId?.fullName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Trip Details Summary */}
                    <div className="bg-stone-50 rounded-xl p-4">
                        <h4 className="font-medium text-stone-800 mb-3">Trip Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-stone-600">
                                <Calendar className="w-4 h-4 text-stone-400" />
                                <span>{formatDate(tripDetails?.preferredDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-stone-600">
                                <Clock className="w-4 h-4 text-stone-400" />
                                <span>{formatTime(tripDetails?.preferredDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-stone-600">
                                <Users className="w-4 h-4 text-stone-400" />
                                <span>{tripDetails?.numberOfPeople} {tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}</span>
                            </div>
                            {tripDetails?.meetingPoint && (
                                <div className="flex items-center gap-2 text-stone-600 col-span-2">
                                    <MapPin className="w-4 h-4 text-stone-400" />
                                    <span>Meeting: {tripDetails.meetingPoint}</span>
                                </div>
                            )}
                        </div>

                        {/* Priority Assistance */}
                        {tripDetails?.priorityAssistance?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-stone-200">
                                <p className="text-sm font-medium text-stone-700 mb-2">Priority Assistance Needed:</p>
                                <div className="flex flex-wrap gap-2">
                                    {tripDetails.priorityAssistance.map(id => {
                                        const priority = PRIORITY_LABELS[id];
                                        if (!priority) return null;
                                        const Icon = priority.icon;
                                        return (
                                            <span 
                                                key={id}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                                            >
                                                <Icon className="w-3 h-3" />
                                                {priority.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {tripDetails?.notes && (
                            <div className="mt-4 pt-4 border-t border-stone-200">
                                <p className="text-sm font-medium text-stone-700 mb-1">Tourist Notes:</p>
                                <p className="text-sm text-stone-600 italic">"{tripDetails.notes}"</p>
                            </div>
                        )}
                    </div>

                    {/* Itinerary Locations */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4">
                        <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-terracotta-500" />
                            Itinerary Stops ({itinerary?.locations?.length || 0})
                        </h4>
                        <div className="space-y-3">
                            {itinerary?.locations?.map((loc, index) => (
                                <div key={loc.placeId || index} className="flex items-start gap-3">
                                    <div className="w-7 h-7 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-stone-800">{loc.name}</p>
                                        {loc.category && (
                                            <p className="text-xs text-stone-500 capitalize">{loc.category}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-4 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {itinerary?.locations?.length || 0} stops
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                ~{(itinerary?.locations?.length || 0) * 30} min estimated
                            </span>
                        </div>
                    </div>

                    {/* Revision Request Section */}
                    {onEditItinerary && booking.status === 'pending' && (
                        <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
                            <h4 className="font-medium text-stone-800 flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-sage-600" />
                                Suggest Changes
                            </h4>
                            <p className="text-sm text-stone-600 mb-3">
                                If you'd like to suggest changes to the itinerary before accepting, you can edit and propose a revised version.
                            </p>
                            <button
                                onClick={() => onEditItinerary(booking)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                <Send className="w-4 h-4" />
                                Edit & Send Revision
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-200 bg-stone-50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItineraryViewModal;
