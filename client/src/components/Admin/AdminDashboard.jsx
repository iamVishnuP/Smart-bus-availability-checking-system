import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBuses, addBus, updateBus, deleteBus } from '../../services/api';
import Navbar from '../Navbar/Navbar';
import './AdminDashboard.css';

const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur',
    'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad',
    'Kannur', 'Kasaragod'
];

// Time Helper Functions

// Time Helper Functions
const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;

    // Return unpadded hour to allow natural typing (e.g. typing "1", then "2" -> "12")
    return {
        hour: String(hour),
        minute: m,
        period
    };
};

const to24Hour = (hour, minute, period) => {
    let h = parseInt(hour, 10);
    if (isNaN(h)) h = 12;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minute}`;
};

const TimePicker = ({ label, value, onChange, name, required }) => {
    const time = parseTime(value);

    const handleChange = (field, val) => {
        let newValue = val;

        // Validation logic
        if (field === 'hour') {
            if (val.length > 2) return;
            // Allow empty string for backspace
            if (val !== '' && !/^\d+$/.test(val)) return;
            if (parseInt(val) > 12) newValue = val.slice(0, 1);
        }

        if (field === 'minute') {
            if (val.length > 2) return;
            if (val !== '' && !/^\d+$/.test(val)) return;
            // Allow up to 59
            if (parseInt(val) > 59) return;
        }

        const newTime = { ...time, [field]: newValue };

        // Construct 24h string only if we have valid-ish numbers to avoid NaN
        const h = newTime.hour || '12';
        const m = newTime.minute || '00';
        const timeStr = to24Hour(h, m, newTime.period);

        onChange({ target: { name, value: timeStr } });
    };

    const handleBlur = (field) => {
        let val = time[field];
        if (!val) {
            val = field === 'hour' ? '12' : '00';
        }

        // Only pad on blur (leaving the field)
        if (val.length === 1) val = '0' + val;
        if (field === 'hour' && (parseInt(val) === 0 || val === '00')) val = '12';

        // We need to trigger a change to ensure the padded value is saved
        handleChange(field, val);
    };

    return (
        <div className="form-group">
            <label>{label} {required && '*'}</label>
            <div className="time-picker-container">
                <input
                    type="text"
                    className="time-input"
                    value={time.hour}
                    onChange={(e) => handleChange('hour', e.target.value)}
                    onBlur={() => handleBlur('hour')}
                    placeholder="HH"
                />
                <span className="time-colon">:</span>
                <input
                    type="text"
                    className="time-input"
                    value={time.minute}
                    onChange={(e) => handleChange('minute', e.target.value)}
                    onBlur={() => handleBlur('minute')}
                    placeholder="MM"
                />
                <select
                    className="period-select"
                    value={time.period}
                    onChange={(e) => handleChange('period', e.target.value)}
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
};

// New Single Text Input Component
const formatTo12Hour = (timeStr) => {
    if (!timeStr) return { time: '', period: 'AM' };
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;

    return {
        time: `${String(hour).padStart(2, '0')}:${m}`,
        period
    };
};

const formatTo24Hour = (timeStr, period) => {
    if (!timeStr.includes(':')) return '';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);

    if (isNaN(hour)) return '';

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${m}`;
};

const SingleTimeInput = ({ label, value, onChange, name, required }) => {
    const [localState, setLocalState] = useState(formatTo12Hour(value));

    useEffect(() => {
        setLocalState(formatTo12Hour(value));
    }, [value]);

    const handleTimeChange = (e) => {
        setLocalState({ ...localState, time: e.target.value });
    };

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        const newTime24 = formatTo24Hour(localState.time, newPeriod);
        setLocalState({ ...localState, period: newPeriod });
        if (newTime24) {
            onChange({ target: { name, value: newTime24 } });
        }
    };

    const handleBlur = () => {
        let val = localState.time;
        // Simple auto-formatting
        if (val.length === 3 && !val.includes(':')) val = val.slice(0, 1) + ':' + val.slice(1);
        if (val.length === 4 && !val.includes(':')) val = val.slice(0, 2) + ':' + val.slice(2);

        if (val.includes(':')) {
            const [h, m] = val.split(':');
            let hour = parseInt(h, 10);
            let minute = parseInt(m, 10);

            if (isNaN(hour)) hour = 12;
            if (isNaN(minute)) minute = 0;

            if (hour > 12) hour = 12;
            if (hour < 1) hour = 1;
            if (minute > 59) minute = 59;

            val = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

            const newTime24 = formatTo24Hour(val, localState.period);
            onChange({ target: { name, value: newTime24 } });
        }
    };

    return (
        <div className="form-group">
            <label>{label} {required && '*'}</label>
            <div className="single-time-container">
                <input
                    type="text"
                    className="time-text-input"
                    value={localState.time}
                    onChange={handleTimeChange}
                    onBlur={handleBlur}
                    placeholder="12:00"
                    maxLength="5"
                />
                <select
                    className="period-select"
                    value={localState.period}
                    onChange={handlePeriodChange}
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [buses, setBuses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [formData, setFormData] = useState({
        state: 'Kerala',
        district: '',
        busName: '',
        source: '',
        destination: '',
        sourceTime: '',
        destinationTime: '',
        price: '',
        stops: [],
        busType: 'Normal'
    });
    const [stopInput, setStopInput] = useState({ name: '', time: '', ticketPrice: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchBuses();
    }, []);

    const fetchBuses = async () => {
        try {
            const response = await getAllBuses();
            setBuses(response.data);
        } catch (error) {
            console.error('Error fetching buses:', error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleStopChange = (e) => {
        setStopInput({
            ...stopInput,
            [e.target.name]: e.target.value
        });
    };

    const addStop = () => {
        if (stopInput.name && stopInput.time && stopInput.ticketPrice) {
            setFormData({
                ...formData,
                stops: [...formData.stops, { ...stopInput }]
            });
            setStopInput({ name: '', time: '', ticketPrice: '' });
        }
    };

    const removeStop = (index) => {
        setFormData({
            ...formData,
            stops: formData.stops.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBus) {
                await updateBus(editingBus._id, formData);
            } else {
                await addBus(formData);
            }
            fetchBuses();
            resetForm();
        } catch (error) {
            console.error('Error saving bus:', error);
            alert(error.response?.data?.message || 'Error saving bus');
        }
    };

    const handleEdit = (bus) => {
        setEditingBus(bus);
        setFormData({
            state: bus.state,
            district: bus.district,
            busName: bus.busName,
            source: bus.source,
            destination: bus.destination,
            sourceTime: bus.sourceTime,
            destinationTime: bus.destinationTime,
            price: bus.price || '',
            stops: bus.stops || [],
            busType: bus.busType
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this bus?')) {
            try {
                await deleteBus(id);
                fetchBuses();
            } catch (error) {
                console.error('Error deleting bus:', error);
                alert('Error deleting bus');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            state: 'Kerala',
            district: '',
            busName: '',
            source: '',
            destination: '',
            sourceTime: '',
            destinationTime: '',
            price: '',
            stops: [],
            busType: 'Normal'
        });
        setEditingBus(null);
        setShowForm(false);
    };



    return (
        <div className="admin-dashboard">
            <Navbar username={localStorage.getItem('username')} isAdmin={true} />

            {/* Floating Action Button */}
            <button
                className="fab-add-bus"
                onClick={() => { setShowForm(true); setEditingBus(null); }}
                title="Add New Bus"
            >
                + Add Bus
            </button>

            {showForm && (
                <div className="bus-form-container">
                    <h2>{editingBus ? 'Edit Bus' : 'Add New Bus'}</h2>
                    <form onSubmit={handleSubmit} className="bus-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>District *</label>
                                <select name="district" value={formData.district} onChange={handleChange} required>
                                    <option value="">Select District</option>
                                    {KERALA_DISTRICTS.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Bus Name *</label>
                                <input
                                    type="text"
                                    name="busName"
                                    value={formData.busName}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Fast Passenger"
                                />
                            </div>

                            <div className="form-group">
                                <label>Bus Type *</label>
                                <select name="busType" value={formData.busType} onChange={handleChange} required>
                                    <option value="Normal">Normal</option>
                                    <option value="Limited Stop">Limited Stop</option>
                                    <option value="KSRTC">KSRTC</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Source *</label>
                                <input
                                    type="text"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    required
                                    placeholder="Start Location"
                                />
                            </div>

                            <SingleTimeInput
                                label="Source Time"
                                name="sourceTime"
                                value={formData.sourceTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Destination *</label>
                                <input
                                    type="text"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    required
                                    placeholder="End Location"
                                />
                            </div>

                            <SingleTimeInput
                                label="Destination Time"
                                name="destinationTime"
                                value={formData.destinationTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Total Ticket Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    placeholder="Full journey fare"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="stops-section">
                            <h3>Intermediate Stops</h3>
                            <div className="add-stop-form">
                                <input
                                    type="text"
                                    name="name"
                                    value={stopInput.name}
                                    onChange={handleStopChange}
                                    placeholder="Stop Name"
                                />
                                <div className="stop-time-input">
                                    <SingleTimeInput
                                        label="Time"
                                        name="time"
                                        value={stopInput.time}
                                        onChange={handleStopChange}
                                    />
                                </div>
                                <input
                                    type="number"
                                    name="ticketPrice"
                                    value={stopInput.ticketPrice}
                                    onChange={handleStopChange}
                                    placeholder="Price from Source (₹)"
                                    min="0"
                                />
                                <button type="button" onClick={addStop} className="add-stop-btn">
                                    Add Stop
                                </button>
                            </div>

                            <div className="stops-list">
                                {formData.stops.map((stop, index) => (
                                    <div key={index} className="stop-item">
                                        <span>{stop.name}</span>
                                        <span>{stop.time}</span>
                                        <span>₹{stop.ticketPrice}</span>
                                        <button type="button" onClick={() => removeStop(index)} className="remove-stop-btn">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={resetForm} className="cancel-btn">
                                Cancel
                            </button>
                            <button type="submit" className="submit-btn">
                                {editingBus ? 'Update Bus' : 'Save Bus'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="buses-list">
                <h2>All Buses ({buses.length})</h2>
                {buses.length === 0 ? (
                    <p className="no-buses">No buses added yet. Click "Add Bus" to get started.</p>
                ) : (
                    <div className="buses-grid">
                        {buses.map(bus => (
                            <div key={bus._id} className="bus-card">
                                <div className="bus-header">
                                    <h3>{bus.busName}</h3>
                                    <span className={`bus-type ${bus.busType.toLowerCase().replace(' ', '-')}`}>
                                        {bus.busType}
                                    </span>
                                </div>
                                <div className="bus-details">
                                    <p><strong>District:</strong> {bus.district}</p>
                                    <p><strong>Route:</strong> {bus.source} → {bus.destination}</p>
                                    <p><strong>Time:</strong> {bus.sourceTime} - {bus.destinationTime}</p>
                                    <p><strong>Stops:</strong> {bus.stops.length}</p>
                                    <p className="admin-live-stop">
                                        <strong>Live Passed Stop:</strong>{' '}
                                        {bus.liveTracking && bus.liveTracking.currentStop ? (
                                            <span style={{ color: '#10b981', fontWeight: '800' }}>
                                                🟢 Passed {bus.liveTracking.currentStop}{' '}
                                                {bus.liveTracking.lastUpdated && (
                                                    <em style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                                                        (at {new Date(bus.liveTracking.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })})
                                                    </em>
                                                )}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#64748b' }}>Not reported</span>
                                        )}
                                    </p>
                                </div>
                                <div className="bus-actions">
                                    <button onClick={() => handleEdit(bus)} className="edit-btn">
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => handleDelete(bus._id)} className="delete-btn">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    );
};

export default AdminDashboard;
