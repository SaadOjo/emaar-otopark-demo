import { Coffee, Eye, Layers, Navigation, ParkingCircle, Shirt, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { StoreRecommendation } from '../../domain/types'

export function WelcomePage() {
  const [recommendations, setRecommendations] = useState<StoreRecommendation[]>([])

  useEffect(() => {
    otoparkRepository.listRecommendations().then(setRecommendations)
  }, [])

  return (
    <main className="driver-welcome-page">
      <div className="driver-map-bg" />
      <section className="welcome-modal glass-panel">
        <header>
          <h1>Hoş geldin!</h1>
          <p>Her zamanki mağazalarına ulaşmak için en yakın park noktasına gitmek ister misin?</p>
        </header>

        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article className="recommendation-card" key={item.id}>
              <div className="recommendation-card-head">
                <span className="store-icon">{getRecommendationIcon(item.icon)}</span>
                {item.closest && <strong>En Yakın</strong>}
              </div>
              <h2>{item.storeName}</h2>
              <p><Layers size={15} /> {item.floorLabel}, {item.blockLabel}</p>
              <p><ParkingCircle size={15} /> {item.spotLabel}</p>
              <Link className={item.closest ? 'route-primary' : 'route-secondary'} to={`/driver/navigation?destination=${item.id}`}>
                Yol Tarifi Al
                <Navigation size={16} />
              </Link>
            </article>
          ))}
        </div>

        <footer>
          <Link to="/floors/floor-b2"><X size={18} /> Şimdi Değil</Link>
        </footer>
      </section>
    </main>
  )
}

function getRecommendationIcon(icon: StoreRecommendation['icon']) {
  if (icon === 'apparel') return <Shirt size={22} />
  if (icon === 'visibility') return <Eye size={22} />
  return <Coffee size={22} />
}
