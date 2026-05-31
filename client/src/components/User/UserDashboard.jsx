import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchBuses, reportBusStatus, updateLiveLocation } from '../../services/api';
import Navbar from '../Navbar/Navbar';
import ChatBot, { BusCard } from '../ChatBot/ChatBot';
import BusAnimation from './BusAnimation';
import { isFuzzyMatch } from '../../utils/fuzzyMatch';
import './UserDashboard.css';

const UserDashboard = () => {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedBus, setSelectedBus] = useState(null);
    const [searchMode, setSearchMode] = useState('chat'); // 'chat' or 'conventional'

    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    const handleSwapLocations = () => {
        const temp = source;
        setSource(destination);
        setDestination(temp);
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSearched(true);
        setSelectedBus(null);

        try {
            const response = await searchBuses(source, destination);
            setBuses(response.data);
        } catch (error) {
            console.error('Error searching buses:', error);
            alert('Error searching buses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchTriggered = async (src, dest, botBuses = null) => {
        setLoading(true);
        setSearched(true);
        setSource(src);
        setDestination(dest);
        setSelectedBus(null);

        try {
            let results = [];
            if (botBuses && botBuses.length > 0) {
                results = botBuses;
            } else {
                const response = await searchBuses(src, dest);
                results = response.data;
            }
            setBuses(results);
        } catch (error) {
            console.error('Error searching buses:', error);
            if (botBuses) {
                setBuses(botBuses);
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateFare = (bus, from, to) => {
        const norm = (str) => str ? str.trim().toLowerCase() : '';
        const getPriceForLocation = (location) => {
            const locNorm = norm(location);
            if (locNorm === norm(bus.source)) return 0;
            if (locNorm === norm(bus.destination)) return parseInt(bus.price || 0, 10);

            const stop = bus.stops.find(s => norm(s.name) === locNorm);
            return stop ? parseInt(stop.ticketPrice || 0, 10) : 0;
        };

        const fromPrice = getPriceForLocation(from);
        const toPrice = getPriceForLocation(to);
        const price = Math.abs(toPrice - fromPrice);
        return isNaN(price) ? 0 : price;
    };

    const getArrivalTimeAtStop = (bus, stopName) => {
        const norm = (str) => str ? str.trim().toLowerCase() : '';
        const nameNorm = norm(stopName);
        if (nameNorm === norm(bus.source)) return bus.sourceTime;
        if (nameNorm === norm(bus.destination)) return bus.destinationTime;
        const stop = bus.stops.find(s => norm(s.name) === nameNorm);
        return stop ? stop.time : '';
    };

    const checkIfBusPassed = (bus, sourceLocation) => {
        const norm = (str) => str ? str.trim().toLowerCase() : '';
        const userSource = norm(sourceLocation);

        let sourceTimeStr = '';
        if (userSource === norm(bus.source)) {
            sourceTimeStr = bus.sourceTime;
        } else {
            const stop = bus.stops.find(s => norm(s.name) === userSource);
            if (stop) sourceTimeStr = stop.time;
        }

        if (!sourceTimeStr) return false;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [h, m] = sourceTimeStr.split(':').map(Number);
        const busMinutes = h * 60 + m;

        return currentMinutes > busMinutes;
    };

    const getNextAvailableBus = (currentBus) => {
        const norm = (str) => str ? str.trim().toLowerCase() : '';

        const upcomingBuses = buses.filter(b =>
            b._id !== currentBus._id &&
            norm(b.source) === norm(currentBus.source) &&
            norm(b.destination) === norm(currentBus.destination) &&
            !checkIfBusPassed(b, source)
        );

        if (upcomingBuses.length === 0) return null;

        upcomingBuses.sort((a, b) => {
            const getSourceTime = (busObj) => {
                if (norm(source) === norm(busObj.source)) {
                    const [h, m] = busObj.sourceTime.split(':').map(Number);
                    return h * 60 + m;
                }
                const s = busObj.stops.find(st => norm(st.name) === norm(source));
                if (s) {
                    const [h, m] = s.time.split(':').map(Number);
                    return h * 60 + m;
                }
                return 9999;
            };
            return getSourceTime(a) - getSourceTime(b);
        });

        return upcomingBuses[0];
    };

    const handleReportStatus = async (busId, status) => {
        try {
            await reportBusStatus(busId, status);
            alert(`Status "${status}" successfully reported!`);
            const response = await searchBuses(source, destination);
            setBuses(response.data);
            const updated = response.data.find(b => b._id === busId);
            if (updated) setSelectedBus(updated);
        } catch (error) {
            console.error('Error reporting status:', error);
            alert('Failed to report status. Please try again.');
        }
    };

    const handleReportLocation = async (bus, currentStop) => {
        try {
            const routeStops = [
                bus.source,
                ...bus.stops.map(s => s.name),
                bus.destination
            ];
            const idx = routeStops.findIndex(s => isFuzzyMatch(s, currentStop));
            const nextStop = (idx !== -1 && idx < routeStops.length - 1) ? routeStops[idx + 1] : null;

            await updateLiveLocation(bus._id, {
                currentStop,
                nextStop
            });
            alert(`Passed stop "${currentStop}" reported successfully!`);
            const response = await searchBuses(source, destination);
            setBuses(response.data);
            const updated = response.data.find(b => b._id === bus._id);
            if (updated) setSelectedBus(updated);
        } catch (error) {
            console.error('Failed to report stop:', error);
            alert('Failed to report stop. Please try again.');
        }
    };

    return (
        <div className="user-dashboard">
            {/* Custom Dynamic Animated Moving Bus Highway Backdrop */}
            <BusAnimation />

            <Navbar username={username} isAdmin={localStorage.getItem('role') === 'admin'} />

            <div className="dashboard-content-area">
                {/* Search Mode Toggle switch */}
                <div className="search-mode-toggle-container">
                    <div className="toggle-switch-bezel">
                        <button
                            className={`toggle-switch-btn ${searchMode === 'chat' ? 'active' : ''}`}
                            onClick={() => {
                                setSearchMode('chat');
                                setSearched(false);
                                setBuses([]);
                                setSelectedBus(null);
                            }}
                        >
                            🤖 AI Smart Travel
                        </button>
                        <button
                            className={`toggle-switch-btn ${searchMode === 'conventional' ? 'active' : ''}`}
                            onClick={() => {
                                setSearchMode('conventional');
                                setSearched(false);
                                setBuses([]);
                                setSelectedBus(null);
                            }}
                        >
                            🔍 Conventional Finder
                        </button>
                    </div>
                </div>

                <div className={`dashboard-main-container ${searched ? 'split-layout results-active' : 'centered-layout'}`}>
                    {searchMode === 'chat' ? (
                        /* Left Column: Chatbot inline assistant */
                        <div className="chatbot-section">
                            <div className="chatbot-panel-header" style={{ marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>🤖 AI Smart Travel Assistant</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>
                                    Type your query like <em>"buses from Thrissur to Thriprayar"</em>.
                                </p>
                            </div>
                            <ChatBot isInline={true} onSearchTriggered={handleSearchTriggered} />
                        </div>
                    ) : (
                        /* Left Column: Conventional form search */
                        <div className="conventional-search-section">
                            <div className="search-container">
                                <h2>Find Your Bus</h2>
                                <form onSubmit={handleSearch} className="search-form">
                                    <div className="search-inputs">
                                        <div className="input-group">
                                            <label>📍 From (Source)</label>
                                            <input
                                                type="text"
                                                value={source}
                                                onChange={(e) => setSource(e.target.value)}
                                                placeholder="Enter source stop"
                                                required
                                            />
                                        </div>

                                        <button type="button" className="swap-btn" onClick={handleSwapLocations} style={{
                                            fontSize: '1.5rem',
                                            background: 'var(--border-color)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifycontent: 'center',
                                            alignSelf: 'end',
                                            marginBottom: '8px',
                                            color: 'var(--primary-color)'
                                        }}>
                                            ⇄
                                        </button>

                                        <div className="input-group">
                                            <label>🎯 To (Destination)</label>
                                            <input
                                                type="text"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                                placeholder="Enter destination stop"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="search-btn" disabled={loading}>
                                        {loading ? 'Searching...' : '🔍 Search Buses'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Results Panel: Side-by-side or stacked on small screens */}
                    {searched && (
                        <div className="results-section">
                            <div className="results-header" style={{ marginBottom: '25px' }}>
                                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                                    {buses.length > 0
                                        ? `🚍 Found ${buses.length} Route Result${buses.length > 1 ? 's' : ''}`
                                        : '😔 No buses found'
                                    }
                                </h2>
                                {source && destination && (
                                    <p className="route-sub" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {source} → {destination}
                                    </p>
                                )}
                            </div>

                            {loading ? (
                                <div className="loading-spinner" style={{ textAlign: 'center', padding: '30px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    Searching database...
                                </div>
                            ) : buses.length > 0 ? (
                                <div className="conventional-results-grid">
                                    {buses.map((bus, idx) => (
                                        <BusCard key={idx} bus={{
                                            ...bus,
                                            departureTime: bus.departureTime || bus.sourceTime,
                                            arrivalTime: bus.arrivalTime || bus.destinationTime,
                                            totalPrice: bus.totalPrice !== undefined ? bus.totalPrice : calculateFare(bus, source, destination),
                                            allStopsDetails: bus.allStopsDetails || [
                                                { name: bus.source, time: bus.sourceTime },
                                                ...bus.stops.map(s => ({ name: s.name, time: s.time })),
                                                { name: bus.destination, time: bus.destinationTime }
                                            ],
                                            updatedLocation: bus.updatedLocation || (bus.currentLocation?.location ? `${bus.currentLocation.location}` : 'Updated location not available')
                                        }} />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results">
                                    <p>😔 No buses available for this route</p>
                                    <p className="suggestion">Try searching for a different route or check back later</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};

export default UserDashboard;
