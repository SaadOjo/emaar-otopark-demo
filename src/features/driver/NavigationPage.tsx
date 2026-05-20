import { Compass, Clock3, Map, Navigation, Route, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NavigationPage() {
  return (
    <main className="driver-navigation-page">
      <div className="navigation-map-shell">
        <div className="navigation-map">
          <div className="dot-grid" />
          <svg className="route-svg" viewBox="0 0 1000 600" aria-label="Route to Starbucks parking spot 11">
            <g className="parking-row-lines">
              <rect height="400" rx="4" width="150" x="100" y="100" />
              <rect height="400" rx="4" width="150" x="300" y="100" />
              <rect height="400" rx="4" width="150" x="550" y="100" />
              <rect height="400" rx="4" width="150" x="750" y="100" />
            </g>
            <g className="pillars">
              <circle cx="275" cy="150" r="8" />
              <circle cx="275" cy="300" r="8" />
              <circle cx="275" cy="450" r="8" />
              <circle cx="525" cy="150" r="8" />
              <circle cx="525" cy="300" r="8" />
              <circle cx="525" cy="450" r="8" />
            </g>
            <path className="route-line" d="M 50 500 L 275 500 L 275 250 L 525 250 L 525 150 L 550 150" />
            <circle className="start-marker" cx="50" cy="500" r="6" />
            <text className="route-text" x="50" y="530">ENTRANCE</text>
            <g className="destination-marker" transform="translate(560, 140)">
              <circle cx="0" cy="0" r="10" />
              <text x="15" y="5">SPOT 11</text>
              <path d="M -5 -2 L 0 3 L 5 -2" />
            </g>
          </svg>

          <aside className="route-panel glass-panel">
            <small>Active Route</small>
            <h1>Starbucks - Nokta 11</h1>
            <p><Route size={18} /> Mesafe: 120m</p>
            <p><Clock3 size={18} /> Arrival: 2 min</p>
            <Link to="/driver/welcome"><X size={16} /> Cancel Route</Link>
          </aside>

          <div className="map-legend glass-panel">
            <span><Compass size={16} /> N</span>
            <i />
            <span><Map size={16} /> 2D View</span>
          </div>

          <div className="route-now-pill"><Navigation size={16} /> Live Route Active</div>
        </div>
      </div>
    </main>
  )
}
