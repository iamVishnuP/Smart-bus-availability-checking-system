// Calculate current bus location based on time or live tracking
export const calculateBusLocation = (bus) => {
    const now = new Date();

    // Check if there is active live tracking (updated in the last 5 minutes)
    if (bus.liveTracking && bus.liveTracking.lastUpdated && (now - new Date(bus.liveTracking.lastUpdated)) < 5 * 60 * 1000) {
        return {
            status: 'In Transit',
            location: bus.liveTracking.currentStop ? `Passed ${bus.liveTracking.currentStop}` : 'In Transit',
            nextStop: bus.liveTracking.nextStop || null,
            isLive: true,
            latitude: bus.liveTracking.latitude,
            longitude: bus.liveTracking.longitude,
            lastUpdated: bus.liveTracking.lastUpdated
        };
    }
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const currentMinutes = timeToMinutes(currentTime);
    const sourceMinutes = timeToMinutes(bus.sourceTime);
    const destinationMinutes = timeToMinutes(bus.destinationTime);

    // Bus hasn't started yet
    if (currentMinutes < sourceMinutes) {
        return {
            status: 'Not Started',
            location: `Will depart from ${bus.source}`,
            nextStop: bus.source,
            estimatedArrival: bus.sourceTime
        };
    }

    // Bus has completed the journey
    if (currentMinutes > destinationMinutes) {
        return {
            status: 'Completed',
            location: `Reached ${bus.destination}`,
            nextStop: null,
            estimatedArrival: null
        };
    }

    // Build complete route with times
    const route = [
        { name: bus.source, time: bus.sourceTime },
        ...bus.stops,
        { name: bus.destination, time: bus.destinationTime }
    ];

    // Find current position
    for (let i = 0; i < route.length - 1; i++) {
        const currentStopMinutes = timeToMinutes(route[i].time);
        const nextStopMinutes = timeToMinutes(route[i + 1].time);

        if (currentMinutes >= currentStopMinutes && currentMinutes < nextStopMinutes) {
            const totalSegmentTime = nextStopMinutes - currentStopMinutes;
            const elapsedTime = currentMinutes - currentStopMinutes;
            const progress = Math.round((elapsedTime / totalSegmentTime) * 100);

            return {
                status: 'In Transit',
                location: `Between ${route[i].name} and ${route[i + 1].name}`,
                progress: `${progress}%`,
                nextStop: route[i + 1].name,
                estimatedArrival: route[i + 1].time
            };
        }

        // At a stop
        if (currentMinutes === currentStopMinutes) {
            return {
                status: 'At Stop',
                location: `Currently at ${route[i].name}`,
                nextStop: route[i + 1]?.name || bus.destination,
                estimatedArrival: route[i + 1]?.time || bus.destinationTime
            };
        }
    }

    // Default fallback
    return {
        status: 'In Transit',
        location: 'Location updating...',
        nextStop: bus.destination,
        estimatedArrival: bus.destinationTime
    };
};

// Calculate travel time between two stops
export const calculateTravelTime = (bus, sourceStop, destinationStop) => {
    const route = [
        { name: bus.source, time: bus.sourceTime },
        ...bus.stops,
        { name: bus.destination, time: bus.destinationTime }
    ];

    const sourceIndex = route.findIndex(stop => stop.name.trim().toLowerCase() === sourceStop.trim().toLowerCase());
    const destIndex = route.findIndex(stop => stop.name.trim().toLowerCase() === destinationStop.trim().toLowerCase());

    if (sourceIndex === -1 || destIndex === -1 || sourceIndex >= destIndex) {
        return null;
    }

    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const sourceMinutes = timeToMinutes(route[sourceIndex].time);
    const destMinutes = timeToMinutes(route[destIndex].time);
    const totalMinutes = destMinutes - sourceMinutes;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
        totalMinutes,
        formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        arrivalTime: route[sourceIndex].time,
        reachTime: route[destIndex].time
    };
};
