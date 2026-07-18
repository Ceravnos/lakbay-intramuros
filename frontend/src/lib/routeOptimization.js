const toCoordinate = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getDistanceMeters = (from, to) => {
    const fromLat = toCoordinate(from?.lat);
    const fromLng = toCoordinate(from?.lng);
    const toLat = toCoordinate(to?.lat);
    const toLng = toCoordinate(to?.lng);

    if ([fromLat, fromLng, toLat, toLng].some((coordinate) => coordinate === null)) {
        return Number.POSITIVE_INFINITY;
    }

    const earthRadiusMeters = 6371000;
    const latitudeDelta = toRadians(toLat - fromLat);
    const longitudeDelta = toRadians(toLng - fromLng);
    const haversineValue = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusMeters * (2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue)));
};

const normalizeLocations = (locations = []) =>
    locations
        .map((location, index) => ({
            ...location,
            order: typeof location.order === "number" ? location.order : index,
        }))
        .sort((leftLocation, rightLocation) => leftLocation.order - rightLocation.order);

const getLocationIdentity = (location, index) =>
    location?.placeId
    || location?._id?.toString?.()
    || `${location?.name || "location"}-${index}`;

export const optimizeLocationsNearestNeighbor = (locations = [], options = {}) => {
    const { preserveFirstStop = true } = options;
    const normalizedLocations = normalizeLocations(locations);

    if (normalizedLocations.length <= 2) {
        return normalizedLocations.map((location, index) => ({
            ...location,
            order: index,
        }));
    }

    const remainingLocations = [...normalizedLocations];
    const optimizedLocations = [];

    if (preserveFirstStop && remainingLocations.length > 0) {
        optimizedLocations.push(remainingLocations.shift());
    }

    if (!optimizedLocations.length && remainingLocations.length > 0) {
        optimizedLocations.push(remainingLocations.shift());
    }

    while (remainingLocations.length > 0) {
        const currentLocation = optimizedLocations[optimizedLocations.length - 1];
        let nearestLocationIndex = 0;
        let nearestDistance = getDistanceMeters(currentLocation, remainingLocations[0]);

        for (let index = 1; index < remainingLocations.length; index += 1) {
            const candidateDistance = getDistanceMeters(currentLocation, remainingLocations[index]);
            if (candidateDistance < nearestDistance) {
                nearestDistance = candidateDistance;
                nearestLocationIndex = index;
            }
        }

        optimizedLocations.push(remainingLocations.splice(nearestLocationIndex, 1)[0]);
    }

    return optimizedLocations.map((location, index) => ({
        ...location,
        order: index,
    }));
};

export const routesMatchByOrder = (leftLocations = [], rightLocations = []) => {
    if (leftLocations.length !== rightLocations.length) {
        return false;
    }

    return leftLocations.every((leftLocation, index) => (
        getLocationIdentity(leftLocation, index) === getLocationIdentity(rightLocations[index], index)
    ));
};
