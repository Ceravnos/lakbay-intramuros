import { useState } from 'react';
import { 
  X, MapPin, Clock, Users, Calendar, Navigation, 
  Check, XCircle, Loader2, ArrowRight, AlertCircle
} from 'lucide-react';

const RevisionReviewModal = ({
  isOpen,
  onClose,
  booking,
  onAccept,
  onCancel,
  acceptLoading = false,
  cancelLoading = false,
}) => {
  if (!isOpen || !booking) return null;

  const itinerary = booking.itineraryId;
  const tripDetails = booking.tripDetails;
  const proposed = booking.proposedItinerary;
  const guide = booking.guideId;

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check what changed
  const dateChanged = proposed?.preferredDate && 
    new Date(proposed.preferredDate).toDateString() !== new Date(itinerary?.preferredDate || tripDetails?.preferredDate).toDateString();
  
  const peopleChanged = proposed?.numberOfPeople && 
    proposed.numberOfPeople !== (itinerary?.numberOfPeople || tripDetails?.numberOfPeople);

  const locationsChanged = proposed?.locations?.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 flex-shrink-0 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Revision Requested</h3>
              <p className="text-sm text-stone-500">
                {guide?.fullName || 'Your guide'} suggested changes to your itinerary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Guide's Note */}
          {booking.revisionNote && (
            <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {guide?.profilePicture ? (
                    <img 
                      src={guide.profilePicture} 
                      alt={guide.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sage-700 font-medium text-sm">
                      {guide?.fullName?.charAt(0).toUpperCase() || 'G'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{guide?.fullName || 'Guide'}</p>
                  <p className="text-sm text-stone-600 mt-1">"{booking.revisionNote}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Changes Summary */}
          <div className="bg-stone-50 rounded-xl p-4">
            <h4 className="font-medium text-stone-800 mb-3">Proposed Changes</h4>
            
            {/* Date Change */}
            {dateChanged && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-white rounded-lg border border-stone-200">
                <Calendar className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-stone-500">Date</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400 line-through">
                      {formatDate(itinerary?.preferredDate || tripDetails?.preferredDate)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-800 font-medium">
                      {formatDate(proposed.preferredDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* People Change */}
            {peopleChanged && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-white rounded-lg border border-stone-200">
                <Users className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-stone-500">Group Size</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400 line-through">
                      {itinerary?.numberOfPeople || tripDetails?.numberOfPeople} people
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-800 font-medium">
                      {proposed.numberOfPeople} people
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Locations Change */}
            {locationsChanged && (
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-medium text-stone-800">
                    Updated Itinerary ({proposed.locations.length} stops)
                  </p>
                </div>
                
                {/* Side by side comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Original</p>
                    <div className="space-y-1">
                      {(itinerary?.locations || []).map((loc, idx) => (
                        <div key={loc.placeId || idx} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 bg-stone-200 text-stone-600 rounded-full flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="text-stone-500 truncate">{loc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Proposed */}
                  <div>
                    <p className="text-xs text-sage-600 mb-2">Proposed</p>
                    <div className="space-y-1">
                      {proposed.locations.map((loc, idx) => (
                        <div key={loc.placeId || idx} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 bg-sage-200 text-sage-700 rounded-full flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="text-stone-800 font-medium truncate">{loc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!dateChanged && !peopleChanged && !locationsChanged && (
              <p className="text-sm text-stone-500 text-center py-4">
                No specific changes proposed
              </p>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
              <br />
              • <strong>Accept:</strong> Your itinerary will be updated with the guide's suggestions, and the booking will remain pending for the guide to accept.
              <br />
              • <strong>Cancel Booking:</strong> The booking will be cancelled and you can create a new one if needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onCancel(booking._id)}
              disabled={cancelLoading || acceptLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Cancel Booking
            </button>
            <button
              onClick={() => onAccept(booking._id)}
              disabled={acceptLoading || cancelLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {acceptLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Accept Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionReviewModal;
