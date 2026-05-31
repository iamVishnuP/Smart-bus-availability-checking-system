import { useState, useEffect, useRef } from 'react';
import { chatWithBot, updateLiveLocation } from '../../services/api';
import './ChatBot.css';

// Premium 3D Glassmorphic Bus Card Component
const BusCard = ({ bus }) => {
    const [expanded, setExpanded] = useState(false);
    const [showStopReporter, setShowStopReporter] = useState(false);
    const [liveStop, setLiveStop] = useState(bus.updatedLocation);
    const [reporting, setReporting] = useState(false);

    const handleReportPassedStop = async (stopName) => {
        setReporting(true);
        try {
            await updateLiveLocation(bus._id, { currentStop: stopName });
            
            const now = new Date();
            const formattedTime = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            setLiveStop(`Passed ${stopName} (at ${formattedTime})`);
            setShowStopReporter(false);
            alert(`Passed stop "${stopName}" reported successfully!`);
        } catch (error) {
            console.error('Failed to report stop:', error);
            alert('Failed to report stop. Please try again.');
        } finally {
            setReporting(false);
        }
    };

    return (
        <div className="premium-3d-bus-card">
            {/* Header: Bus Name, Type Badge & Price */}
            <div className="card-top">
                <div className="bus-meta">
                    <span className="bus-emoji">🚌</span>
                    <div className="bus-title-group">
                        <span className="bus-name">{bus.busName}</span>
                        <span className={`bus-type-badge ${bus.busType.toLowerCase().replace(/\s+/g, '-')}`}>
                            {bus.busType}
                        </span>
                    </div>
                </div>
                <div className="bus-price-tag">
                    ₹ {bus.totalPrice}
                </div>
            </div>

            {/* Route Summary */}
            <div className="route-timing-summary">
                <div className="stop-point">
                    <span className="stop-dot source">🔵</span>
                    <span className="stop-name-text">{bus.source}</span>
                    <span className="stop-time-text">
                        {bus.departureTime.includes(':') 
                            ? new Date(`2000-01-01T${bus.departureTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                            : bus.departureTime
                        }
                    </span>
                </div>
                <div className="route-divider">
                    <div className="route-line"></div>
                </div>
                <div className="stop-point">
                    <span className="stop-dot destination">🔴</span>
                    <span className="stop-name-text">{bus.destination}</span>
                    <span className="stop-time-text">
                        {bus.arrivalTime.includes(':')
                            ? new Date(`2000-01-01T${bus.arrivalTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                            : bus.arrivalTime
                        }
                    </span>
                </div>
            </div>

            {/* Crowdsourced Passed Stop Location Display */}
            <div className={`live-update-bar ${liveStop.includes('not available') ? 'no-live' : 'has-live'}`}>
                <span className="live-indicator-dot"></span>
                <span className="live-text-content">
                    {liveStop}
                </span>
            </div>

            {/* Actions: Show Stops and Crowdsourcing Trigger */}
            <div className="card-actions-row">
                <button 
                    className="action-btn-outline toggle-stops-btn"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? '🔼 Hide Stops' : '🔽 Route Stops'}
                </button>

                <button 
                    className="action-btn-primary im-on-this-bus-btn"
                    onClick={() => setShowStopReporter(!showStopReporter)}
                >
                    🙋‍♂️ I'm On This Bus
                </button>
            </div>

            {/* Expanded Drawer: Route timeline */}
            {expanded && (
                <div className="stops-drawer animate-slide-down">
                    <div className="stops-drawer-timeline"></div>
                    {bus.allStopsDetails.map((stop, idx) => (
                        <div key={idx} className="timeline-stop-item">
                            <span className="timeline-dot">📍</span>
                            <span className="timeline-stop-name">{stop.name}</span>
                            <span className="timeline-stop-time">
                                {stop.time.includes(':')
                                    ? new Date(`2000-01-01T${stop.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                    : stop.time
                                }
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Crowdsource Stop Selector Dialog */}
            {showStopReporter && (
                <div className="stop-reporter-drawer animate-slide-down">
                    <h4>Which stop have you passed?</h4>
                    <div className="stop-buttons-grid">
                        {bus.allStopsDetails.map((stop, idx) => (
                            <button
                                key={idx}
                                className="passed-stop-report-btn"
                                onClick={() => handleReportPassedStop(stop.name)}
                                disabled={reporting}
                            >
                                {stop.name}
                            </button>
                        ))}
                    </div>
                    <button 
                        className="close-reporter-btn"
                        onClick={() => setShowStopReporter(false)}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

const ChatBot = ({ isInline = false, onSearchTriggered }) => {
    const [isOpen, setIsOpen] = useState(isInline || false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            text: "Hello! I'm your Smart Bus Travel Assistant. Where would you like to travel today? Just type something like: 'buses from Kochi to Alappuzha'",
            isBot: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length > 1) {
            scrollToBottom();
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMsg = {
            text: message,
            isBot: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setMessage('');
        setIsLoading(true);

        try {
            const { data } = await chatWithBot(message);
            let responseText = data.response;

            // Check for JSON block in response
            const jsonStartTag = "@@JSON-START@@";
            const jsonEndTag = "@@JSON-END@@";

            if (responseText.includes(jsonStartTag) && responseText.includes(jsonEndTag)) {
                const startIndex = responseText.indexOf(jsonStartTag);
                const endIndex = responseText.indexOf(jsonEndTag) + jsonEndTag.length;
                const jsonString = responseText.slice(startIndex + jsonStartTag.length, responseText.indexOf(jsonEndTag)).trim();

                try {
                    const parsedData = JSON.parse(jsonString);
                    if (parsedData.action === 'search' && parsedData.source && parsedData.destination) {
                        // Notify dashboard search
                        if (onSearchTriggered) {
                            onSearchTriggered(parsedData.source, parsedData.destination, parsedData.buses);
                        }

                        const botMsg = {
                            text: "Here is your response",
                            isBot: true,
                            buses: parsedData.buses || [],
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        setMessages(prev => [...prev, botMsg]);
                        return;
                    }
                } catch (err) {
                    console.error('Failed to parse search metadata from bot:', err);
                }
            }

            const botMsg = {
                text: responseText.trim(),
                isBot: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = {
                text: "Sorry, I'm having some trouble connecting. Please try again later.",
                isBot: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`chatbot-wrapper ${isOpen ? 'open' : ''} ${isInline ? 'inline-chatbot' : 'floating-chatbot'}`}>
            {!isInline && (
                <button
                    className="chatbot-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Chat"
                >
                    {isOpen ? '✕' : '💬'}
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-bubble ${msg.isBot ? 'bot' : 'user'} ${msg.buses && !isInline ? 'has-cards' : ''}`}>
                                <div className="message-content">
                                    <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                                    {msg.buses && msg.buses.length > 0 && !isInline && (
                                        <div className="bot-search-cards">
                                            {msg.buses.map((bus, bIdx) => (
                                                <BusCard key={bIdx} bus={bus} />
                                            ))}
                                        </div>
                                    )}
                                    <span className="message-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-bubble bot">
                                <div className="message-content typing">
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !message.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBot;
export { BusCard };
