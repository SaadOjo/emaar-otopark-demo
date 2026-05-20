import { LocateFixed, Navigation } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const routeMap = {
  starbucks: { name: 'Starbucks', floor: 'Kat -2', block: 'Blok A', spot: 'Nokta 11', distance: '120 m', eta: '2 dk' },
  adidas: { name: 'Adidas', floor: 'Kat 1', block: 'Blok A', spot: 'Nokta 10', distance: '260 m', eta: '4 dk' },
  atasun: { name: 'Atasun Optik', floor: 'Kat 0', block: 'Blok A', spot: 'Nokta 11', distance: '180 m', eta: '3 dk' },
} as const

export function NavigationPage() {
  const [searchParams] = useSearchParams()
  const destinationId = (searchParams.get('destination') as keyof typeof routeMap | null) ?? 'starbucks'
  const destination = routeMap[destinationId] ?? routeMap.starbucks

  return (
    <main className="driver-navigation-page driver-navigation-page--maps">
      <div className="navigation-map-shell">
        <div className="navigation-map navigation-map--maps">
          <div className="maps-toolbar-actions maps-toolbar-actions--floating"><button aria-label="Re-center map"><LocateFixed size={18} /></button></div>

          <svg className="route-svg" viewBox="0 0 1000 600" aria-label={`Route to ${destination.name} ${destination.spot}`}>
            <g className="maps-parking-blocks">
              <rect height="164" rx="18" width="190" x="110" y="92" />
              <rect height="164" rx="18" width="190" x="352" y="92" />
              <rect height="208" rx="18" width="190" x="604" y="92" />
              <rect height="164" rx="18" width="190" x="110" y="346" />
              <rect height="164" rx="18" width="190" x="352" y="346" />
            </g>
            <g className="maps-road-grid">
              <path d="M 40 300 L 960 300" />
              <path d="M 326 60 L 326 540" />
              <path d="M 578 60 L 578 540" />
            </g>
            <path className="route-line route-line--maps-shadow" d="M 82 480 L 326 480 L 326 300 L 578 300 L 578 174 L 706 174" />
            <path className="route-line route-line--maps" d="M 82 480 L 326 480 L 326 300 L 578 300 L 578 174 L 706 174" />
            <circle className="start-marker start-marker--maps" cx="82" cy="480" r="10" />
            <text className="route-text route-text--maps" x="48" y="516">Giriş</text>
            <g className="destination-pin" transform="translate(706, 174)">
              <path d="M 0 -26 C 13 -26 24 -16 24 -3 C 24 14 8 25 0 38 C -8 25 -24 14 -24 -3 C -24 -16 -13 -26 0 -26 Z" />
              <circle cx="0" cy="-3" r="9" />
            </g>
          </svg>

          <aside className="route-panel route-panel--maps glass-panel">
            <small>Canlı Yol Tarifi</small>
            <h1>{destination.name}</h1>
            <p>{destination.distance}</p>
            <p>Varış: {destination.eta}</p>
            <p>{destination.floor}, {destination.block}</p>
            <strong>{destination.spot}</strong>
            <Link to="/driver/welcome">Rotayı Kapat</Link>
          </aside>

          <div className="map-legend map-legend--maps glass-panel">
            <span><Navigation size={16} /> Canlı</span>
            <i />
            <span>2D</span>
          </div>

        </div>
      </div>
    </main>
  )
}
