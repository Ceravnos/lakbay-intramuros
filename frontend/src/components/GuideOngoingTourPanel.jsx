import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Clock, Loader2, MapPin, Route, User, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { calculateTotalTime } from "../data/locations";
import IntramurosMap from "./Map/IntramurosMap";

const formatDate = (date) => {
    if (!date) return "No date set";

    return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatTimeSlot = (timeSlot) => {
    if (timeSlot === "AM") return "Morning";
    if (timeSlot === "PM") return "Afternoon";
    return "Time not set";
};

const GuideOngoingTourPanel = ({
    booking,
    onBookingUpdate,
    onOpenCompleteModal,
    completeLoading = false,
}) => {
    const [directionsResult, setDirectionsResult] = useState(null);
    const [calculatingRoute, setCalculatingRoute] = useState(false);
    const [updatingProgress, setUpdatingProgress] = useState(false);

    const sortedLocations = useMemo(() => {
        return [...(booking?.itineraryId?.locations || [])].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
    }, [booking?.itineraryId?.locations]);

    const totalStops = sortedLocations.length;
    const completedStopCount = Math.min(booking?.progress?.completedStopCount || 0, totalStops);
    const allStopsCompleted = totalStops > 0 && completedStopCount >= totalStops;
    const progressPercentage = totalStops > 0
        ? Math.round((completedStopCount / totalStops) * 100)
        : 0;
    const currentRouteStart = completedStopCount > 0 && completedStopCount < totalStops
        ? sortedLocations[completedStopCount - 1]
        : null;
    const currentRouteEnd = completedStopCount > 0 && completedStopCount < totalStops
        ? sortedLocations[completedStopCount]
        : null;
    const totalTime = useMemo(() => calculateTotalTime(sortedLocations), [sortedLocations]);

    const calculateSegmentRoute = useCallback(async (originLocation, destinationLocation, options = {}) => {
        const { showErrorToast = false } = options;

        if (!originLocation || !destinationLocation) {
            setDirectionsResult(null);
            return;
        }

        if (!window.google?.maps) {
            setDirectionsResult(null);
            return;
        }

        setCalculatingRoute(true);

        try {
            const directionsService = new window.google.maps.DirectionsService();
            const result = await new Promise((resolve, reject) => {
                directionsService.route(
                    {
                        origin: { lat: originLocation.lat, lng: originLocation.lng },
                        destination: { lat: destinationLocation.lat, lng: destinationLocation.lng },
                        travelMode: window.google.maps.TravelMode.WALKING,
                        optimizeWaypoints: false,
                    },
                    (routeResult, status) => {
                        if (status === "OK" && routeResult) {
                            resolve(routeResult);
                            return;
                        }

                        reject(new Error(status));
                    }
                );
            });

            setDirectionsResult(result);
        } catch {
            setDirectionsResult(null);
            if (showErrorToast) {
                toast.error("Could not calculate route");
            }
        } finally {
            setCalculatingRoute(false);
        }
    }, []);

    useEffect(() => {
        if (completedStopCount > 0 && completedStopCount < totalStops) {
            calculateSegmentRoute(
                sortedLocations[completedStopCount - 1],
                sortedLocations[completedStopCount],
                { showErrorToast: false }
            );
            return;
        }

        setDirectionsResult(null);
    }, [booking?._id, calculateSegmentRoute, completedStopCount, sortedLocations, totalStops]);

    const handleCompleteStop = async (stopIndex) => {
        if (
            updatingProgress ||
            calculatingRoute ||
            stopIndex !== completedStopCount ||
            allStopsCompleted ||
            !booking?._id
        ) {
            return;
        }

        const nextCompletedStopCount = completedStopCount + 1;

        setUpdatingProgress(true);
        try {
            const res = await api.put(`/bookings/${booking._id}/progress`, {
                completedStopCount: nextCompletedStopCount,
            });

            onBookingUpdate?.(res.data.booking);

            if (nextCompletedStopCount >= totalStops) {
                setDirectionsResult(null);
                toast.success("All itinerary stops are complete. You can now mark this tour as complete.");
            } else {
                toast.success(`Stop ${nextCompletedStopCount} completed`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update trip progress");
        } finally {
            setUpdatingProgress(false);
        }
    };

    if (!booking) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-sage-200 bg-sage-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-sage-700">Ongoing Tour</p>
                            <h3 className="mt-1 font-serif text-2xl font-semibold text-stone-800">
                                {booking.tripDetails?.title || booking.itineraryId?.name}
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600">
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-stone-400" />
                                {booking.touristId?.fullName}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-stone-400" />
                                {formatDate(booking.tripDetails?.preferredDate)}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-stone-400" />
                                {formatTimeSlot(booking.timeSlot)}
                            </span>
                            <span className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-stone-400" />
                                {booking.tripDetails?.numberOfPeople || booking.itineraryId?.numberOfPeople || 1} people
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenCompleteModal?.(booking._id)}
                        disabled={!allStopsCompleted || completeLoading || updatingProgress || totalStops === 0}
                        className="flex items-center justify-center gap-2 rounded-xl bg-stone-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {completeLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        Mark as Complete
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="flex min-h-[720px] flex-col xl:flex-row">
                    <div className="relative min-h-[360px] flex-1 bg-stone-100 xl:min-h-[720px]">
                        <IntramurosMap
                            markers={sortedLocations.map((location) => ({
                                id: location.placeId,
                                placeId: location.placeId,
                                name: location.name,
                                lat: location.lat,
                                lng: location.lng,
                                address: location.address,
                            }))}
                            showNumberedPins={totalStops > 0}
                            directionsResult={directionsResult}
                            tripStarted
                            className="absolute inset-0"
                        />

                        {totalStops > 0 && (
                            <div className="absolute left-4 top-4 z-10 rounded-lg border border-stone-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                    <Route className="h-4 w-4 text-sage-600" />
                                    <span>{totalStops} stops</span>
                                    <span className="text-stone-400">•</span>
                                    <Clock className="h-4 w-4 text-stone-400" />
                                    <span>~{Math.round((totalTime / 60) * 10) / 10}h</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex w-full flex-col border-t border-stone-200 bg-white xl:w-96 xl:border-l xl:border-t-0">
                        <div className="border-b border-stone-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-stone-800">Tour Progress</p>
                                    <p className="text-xs text-stone-500">Track each itinerary stop before completing the tour.</p>
                                </div>
                                <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
                                    Active
                                </span>
                            </div>

                            <div className="mt-4 rounded-xl border border-sage-200 bg-sage-50 p-3">
                                <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                                    <span>{completedStopCount} of {totalStops} stops completed</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                                    <div
                                        className="h-full bg-sage-600 transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-sage-700">
                                    {allStopsCompleted
                                        ? "Every itinerary stop has been fulfilled. You can now mark the tour as complete."
                                        : completedStopCount === 0
                                            ? totalStops > 1
                                                ? "Complete Stop 1 to show the route to Stop 2."
                                                : "Complete Stop 1 to finish this tour."
                                            : currentRouteStart && currentRouteEnd
                                                ? `Current route: ${currentRouteStart.name} to ${currentRouteEnd.name}.`
                                                : "Continue checking the next stop to keep tracking progress."}
                                </p>
                            </div>

                            <div className="mt-3 flex items-center gap-3 text-xs text-stone-500">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {totalStops} stops
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    ~{Math.round((totalTime / 60) * 10) / 10}h
                                </span>
                                <span className="flex items-center gap-1 text-sage-600">
                                    <Route className="h-3.5 w-3.5" />
                                    {allStopsCompleted ? "Ready to complete" : `${completedStopCount}/${totalStops} complete`}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="mb-3 font-medium text-stone-800">Stops ({totalStops})</h3>

                            {totalStops === 0 ? (
                                <div className="py-12 text-center">
                                    <MapPin className="mx-auto mb-3 h-12 w-12 text-stone-300" />
                                    <p className="text-sm text-stone-500">This itinerary has no stops to track.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sortedLocations.map((location, index) => {
                                        const isCompleted = index < completedStopCount;
                                        const isCurrent = index === completedStopCount && !allStopsCompleted;
                                        const isLocked = index > completedStopCount || allStopsCompleted;

                                        return (
                                            <div
                                                key={location.placeId}
                                                className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
                                            >
                                                <div className="flex items-start gap-3 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleCompleteStop(index)}
                                                            disabled={
                                                                updatingProgress ||
                                                                calculatingRoute ||
                                                                index !== completedStopCount ||
                                                                allStopsCompleted
                                                            }
                                                            className={`flex h-5 w-5 items-center justify-center rounded border text-xs font-semibold transition-colors ${
                                                                isCompleted
                                                                    ? "border-sage-600 bg-sage-600 text-white"
                                                                    : isCurrent
                                                                        ? "border-sage-500 text-sage-600 hover:bg-sage-100"
                                                                        : "cursor-not-allowed border-stone-300 text-stone-300"
                                                            } disabled:hover:bg-transparent`}
                                                        >
                                                            {isCompleted ? "✓" : updatingProgress && isCurrent ? <Loader2 className="h-3 w-3 animate-spin" /> : ""}
                                                        </button>
                                                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                                                            isCompleted
                                                                ? "bg-sage-100 text-sage-700"
                                                                : "bg-terracotta-100 text-terracotta-600"
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-stone-800">{location.name}</p>
                                                        <p className="truncate text-xs text-stone-500">{location.address}</p>
                                                        <p className="mt-1 text-[11px] font-medium text-sage-700">
                                                            {isCompleted
                                                                ? "Completed"
                                                                : isCurrent
                                                                    ? "Current stop"
                                                                    : isLocked
                                                                        ? "Upcoming"
                                                                        : "Queued"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {location.notes ? (
                                                    <div className="px-3 pb-3">
                                                        <div className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-500">
                                                            {location.notes}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideOngoingTourPanel;
