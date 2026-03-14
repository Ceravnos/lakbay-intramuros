export function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric", 
        year: "numeric",
    });
}

export const POST_AUTH_ITINERARY_HANDOFF_STORAGE_KEY = "lakbay_post_auth_itinerary_handoff";

export function buildPostAuthRedirectState(sessionItinerary) {
    return Array.isArray(sessionItinerary) && sessionItinerary.length > 0
        ? {
            postAuthPath: "/itinerary",
            postAuthState: { sessionItinerary },
        }
        : undefined;
}

export function clearPostAuthItineraryHandoff() {
    if (typeof window === "undefined") return;

    window.sessionStorage.removeItem(POST_AUTH_ITINERARY_HANDOFF_STORAGE_KEY);
}

export function persistPostAuthItineraryHandoff(sessionItinerary) {
    if (typeof window === "undefined") return null;

    if (!Array.isArray(sessionItinerary) || sessionItinerary.length === 0) {
        clearPostAuthItineraryHandoff();
        return null;
    }

    const handoff = {
        path: "/itinerary",
        sessionItinerary,
    };

    window.sessionStorage.setItem(
        POST_AUTH_ITINERARY_HANDOFF_STORAGE_KEY,
        JSON.stringify(handoff)
    );

    return handoff;
}

export function readPostAuthItineraryHandoff() {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.sessionStorage.getItem(POST_AUTH_ITINERARY_HANDOFF_STORAGE_KEY);

        if (!raw) return null;

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed?.sessionItinerary) || parsed.sessionItinerary.length === 0) {
            return null;
        }

        return {
            path: parsed.path || "/itinerary",
            sessionItinerary: parsed.sessionItinerary,
        };
    } catch {
        return null;
    }
}

export function getPostAuthRedirect(sessionState) {
    const stateSessionItinerary = Array.isArray(sessionState?.postAuthState?.sessionItinerary)
        ? sessionState.postAuthState.sessionItinerary
        : null;
    const storedHandoff = readPostAuthItineraryHandoff();
    const sessionItinerary = stateSessionItinerary?.length
        ? stateSessionItinerary
        : storedHandoff?.sessionItinerary?.length
            ? storedHandoff.sessionItinerary
            : null;

    return {
        path: sessionState?.postAuthPath || storedHandoff?.path || null,
        state: sessionItinerary ? { sessionItinerary } : undefined,
    };
}

export function getTransferredSessionItinerary(sessionState) {
    if (Array.isArray(sessionState?.sessionItinerary) && sessionState.sessionItinerary.length > 0) {
        return sessionState.sessionItinerary;
    }

    return readPostAuthItineraryHandoff()?.sessionItinerary || null;
}