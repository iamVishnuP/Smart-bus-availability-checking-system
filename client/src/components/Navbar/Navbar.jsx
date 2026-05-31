import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

const Navbar = ({ username, isAdmin }) => {
    const [showAbout, setShowAbout] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const localRole = localStorage.getItem('role');
    const isActuallyAdmin = isAdmin || localRole === 'admin';
    const isCurrentAdminPage = window.location.pathname === '/admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleAdminPortal = () => {
        navigate('/login');
    };

    const handleDashboardToggle = () => {
        if (isCurrentAdminPage) {
            navigate('/');
        } else {
            navigate('/admin');
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <span className="navbar-logo">🚎</span>
                    <span className="navbar-title">Smart Bus Availability Checking System</span>
                </div>

                <div className="navbar-menu">
                    <button className="navbar-link" onClick={() => setShowAbout(true)}>
                        About
                    </button>

                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title={`Switch to ${theme === 'blue' ? 'Red' : 'Light Blue'} theme`}
                    >
                        <div className={`toggle-slider-inline ${theme}`}>
                            <span className="toggle-icon-inline">
                                {theme === 'blue' ? '🌙' : '🔥'}
                            </span>
                        </div>
                    </button>

                    {isActuallyAdmin ? (
                        <>
                            <button className="navbar-link admin-toggle-btn" onClick={handleDashboardToggle} style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                {isCurrentAdminPage ? 'User View' : '⚙️ Admin Dashboard'}
                            </button>
                            <button className="navbar-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="navbar-link admin-portal-btn" onClick={handleAdminPortal} style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            Admin Portal
                        </button>
                    )}
                </div>
            </nav>

            {/* About Modal */}
            {showAbout && (
                <div className="modal-overlay" onClick={() => setShowAbout(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAbout(false)}>
                            ✕
                        </button>
                        <h2>About Kerala Bus Finder</h2>
                        <div className="modal-body">
                            <p>
                                Welcome to <strong>Kerala Bus Finder</strong>, your premier solution for navigating public transit routes and schedules across Kerala.
                            </p>
                            <p>
                                Our platform is designed to make daily commuting seamless and reliable by providing accurate information on bus availability, routes, and intermediate stops. By connecting commuters with up-to-date schedule details, we help reduce travel delays and make public transport hassle-free for everyone.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
