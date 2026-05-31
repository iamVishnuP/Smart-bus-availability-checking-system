import express from 'express';
import Bus from '../models/Bus.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { calculateBusLocation, calculateTravelTime } from '../utils/busLocation.js';
import { isFuzzyMatch } from '../utils/fuzzyMatch.js';
import { getBusesBetweenStops } from '../utils/busSearch.js';

const router = express.Router();

// Get all buses (public)
router.get('/', async (req, res) => {
    try {
        const buses = await Bus.find().sort({ createdAt: -1 });
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Search buses by source and destination
router.get('/search', async (req, res) => {
    try {
        const { source, destination, time } = req.query;

        if (!source || !destination) {
            return res.status(400).json({ message: 'Source and destination are required' });
        }

        const matchingBuses = await getBusesBetweenStops(source, destination, time || null);
        res.json(matchingBuses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single bus by ID
router.get('/:id', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        const location = calculateBusLocation(bus);

        res.json({
            ...bus.toObject(),
            currentLocation: location
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new bus (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
    try {
        const busData = req.body;

        const bus = new Bus(busData);
        await bus.save();

        res.status(201).json({
            message: 'Bus added successfully',
            bus
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update bus (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json({
            message: 'Bus updated successfully',
            bus
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete bus (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findByIdAndDelete(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json({ message: 'Bus deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Report bus status (community crowdsourcing - public)
router.post('/:id/report-status', async (req, res) => {
    try {
        const { status } = req.body;
        const bus = await Bus.findById(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Clean reports older than 2 hours to keep it current
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        bus.statusReports = bus.statusReports.filter(r => new Date(r.reportedAt) > twoHoursAgo);

        // Add new report
        bus.statusReports.push({
            status,
            reportedAt: new Date(),
            reportedBy: req.user?.username || 'Passenger'
        });

        await bus.save();

        res.json({ message: 'Status reported successfully', statusReports: bus.statusReports });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update live location ("I'm On This Bus" passed stop updates - public)
router.post('/:id/live-location', async (req, res) => {
    try {
        const { currentStop } = req.body;
        const bus = await Bus.findById(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Determine nextStop in the route
        const routeStops = [
            bus.source,
            ...bus.stops.map(s => s.name),
            bus.destination
        ];
        const idx = routeStops.findIndex(s => s.trim().toLowerCase() === currentStop?.trim().toLowerCase());
        const nextStop = (idx !== -1 && idx < routeStops.length - 1) ? routeStops[idx + 1] : null;

        bus.liveTracking = {
            latitude: null,
            longitude: null,
            currentStop,
            nextStop,
            activeShareCount: 0,
            lastUpdated: new Date()
        };

        await bus.save();

        res.json({ message: 'Location updated successfully', liveTracking: bus.liveTracking });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
