import Bus from '../models/Bus.js';
import { isFuzzyMatch } from './fuzzyMatch.js';

/**
 * Robust database-verified search engine that finds matching buses between two stops.
 * Enforces direction validation, local IST time comparisons, fare calculation, 
 * live tracking, and the 3-consecutive-buses rule strictly.
 */
export const getBusesBetweenStops = async (source, destination, requestedTime = null) => {
    const buses = await Bus.find().lean();
    const now = new Date();

    // Get current time in Indian Standard Time (IST)
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const currentISTTime = `${hour}:${minute}`;

    const timeToMinutes = (t) => {
        if (!t) return 9999;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const targetTime = requestedTime || currentISTTime;
    const targetMinutes = timeToMinutes(targetTime);

    const matched = [];

    for (const bus of buses) {
        // Construct ordered stop list
        const route = [
            bus.source,
            ...bus.stops.map(s => s.name),
            bus.destination
        ];

        const sourceIdx = route.findIndex(stop => isFuzzyMatch(stop, source));
        const destIdx = route.findIndex(stop => isFuzzyMatch(stop, destination));

        // Match ONLY buses where BOTH exist in the SAME route and destination is after source
        if (sourceIdx !== -1 && destIdx !== -1 && sourceIdx < destIdx) {
            // Find arrival/departure time at the user's matched source stop
            let depTime = bus.sourceTime;
            if (sourceIdx === route.length - 1) {
                depTime = bus.destinationTime;
            } else if (sourceIdx > 0) {
                depTime = bus.stops[sourceIdx - 1].time;
            }

            const depMinutes = timeToMinutes(depTime);

            // Filter out buses that have already departed relative to the target time
            if (depMinutes >= targetMinutes) {
                // Calculate correct price based on ticket prices
                const getPriceForIdx = (idx) => {
                    if (idx === 0) return 0;
                    if (idx === route.length - 1) return bus.price;
                    return bus.stops[idx - 1].ticketPrice ?? bus.stops[idx - 1].price ?? 0;
                };

                const sourcePrice = getPriceForIdx(sourceIdx);
                const destPrice = getPriceForIdx(destIdx);
                const totalPrice = Math.abs(destPrice - sourcePrice);

                // Find arrival time at the user's matched destination stop
                let arrTime = bus.destinationTime;
                if (destIdx === 0) {
                    arrTime = bus.sourceTime;
                } else if (destIdx < route.length - 1) {
                    arrTime = bus.stops[destIdx - 1].time;
                }

                // Fetch latest "I'm On This Bus" passed stop (expires after 12h)
                let updatedLocation = 'Updated location not available';
                if (bus.liveTracking && bus.liveTracking.currentStop && bus.liveTracking.lastUpdated) {
                    const elapsed = now - new Date(bus.liveTracking.lastUpdated);
                    if (elapsed < 12 * 60 * 60 * 1000) {
                        const dateObj = new Date(bus.liveTracking.lastUpdated);
                        const formattedTime = dateObj.toLocaleTimeString('en-US', {
                            timeZone: 'Asia/Kolkata',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                        updatedLocation = `Passed ${bus.liveTracking.currentStop} (at ${formattedTime})`;
                    }
                }

                matched.push({
                    _id: bus._id,
                    busName: bus.busName,
                    busType: bus.busType,
                    source: route[sourceIdx],
                    destination: route[destIdx],
                    departureTime: depTime,
                    arrivalTime: arrTime,
                    totalPrice: totalPrice,
                    stops: bus.stops.map(s => s.name),
                    allStopsDetails: [
                        { name: bus.source, time: bus.sourceTime },
                        ...bus.stops.map(s => ({ name: s.name, time: s.time })),
                        { name: bus.destination, time: bus.destinationTime }
                    ],
                    updatedLocation
                });
            }
        }
    }

    // Sort by departure time at the matched source stop (ascending)
    matched.sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime));

    // Limit to 3 upcoming buses strictly (3 Consecutive Buses Rule)
    return matched.slice(0, 3);
};
