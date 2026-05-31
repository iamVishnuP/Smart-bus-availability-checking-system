import './BusAnimation.css';

const BusAnimation = () => {
    return (
        <div className="bus-scene-container">
            {/* Scenic Background elements */}
            <div className="scenic-background">
                <div className="city-silhouette"></div>
                <div className="distant-mountains"></div>
            </div>

            {/* The Road and Transit Track */}
            <div className="road-surface">
                {/* Scrolling white lane lines */}
                <div className="road-lane-lines"></div>
            </div>

            {/* Vector Bus Structure - Moved outside road-surface to prevent clipping */}
            <div className="bus-wrapper">
                <div className="bus-chassis">
                    {/* Windows & Passengers */}
                    <div className="bus-cabin">
                        <div className="bus-window-frame">
                            <span className="passenger-silhouette">👤</span>
                        </div>
                        <div className="bus-window-frame">
                            <span className="passenger-silhouette">👤</span>
                        </div>
                        <div className="bus-window-frame">
                            <span className="passenger-silhouette">👤</span>
                        </div>
                        <div className="bus-window-frame driver-window">
                            <span className="driver-silhouette">👮</span>
                        </div>
                    </div>

                    {/* Front bumper and grill details */}
                    <div className="bus-grill"></div>

                    {/* Headlight casting yellow beam */}
                    <div className="bus-headlight">
                        <div className="light-beam"></div>
                    </div>

                    {/* Red taillight */}
                    <div className="bus-taillight"></div>

                    {/* Wheel arches */}
                    <div className="wheel-arch arch-front"></div>
                    <div className="wheel-arch arch-back"></div>
                </div>

                {/* Rotating Wheels */}
                <div className="bus-wheel wheel-front">
                    <div className="wheel-tire">
                        <div className="wheel-spoke"></div>
                        <div className="wheel-spoke"></div>
                        <div className="wheel-spoke"></div>
                        <div className="wheel-spoke"></div>
                    </div>
                </div>
                <div className="bus-wheel wheel-back">
                    <div className="wheel-tire">
                        <div className="wheel-spoke"></div>
                        <div className="wheel-spoke"></div>
                        <div className="wheel-spoke"></div>
                        <div className="wheel-spoke"></div>
                    </div>
                </div>

                {/* Engine Exhaust Smoke puffs */}
                <div className="exhaust-pipe">
                    <div className="smoke-puff puff-1"></div>
                    <div className="smoke-puff puff-2"></div>
                    <div className="smoke-puff puff-3"></div>
                </div>
            </div>
        </div>
    );
};

export default BusAnimation;




