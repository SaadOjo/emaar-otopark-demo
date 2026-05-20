import { Bell, Moon, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor } from '../../domain/types'

export function SignageOverviewPage() {
  const [floors, setFloors] = useState<Floor[]>([])
  const [signage, setSignage] = useState<DigitalSignage[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    otoparkRepository.listFloors().then(setFloors)
    otoparkRepository.listSignage().then(setSignage)
  }, [])

  const signageByFloor = useMemo(() => {
    return floors.map((floor) => ({
      floor,
      items: signage.filter((item) => item.floorId === floor.id),
    }))
  }, [floors, signage])

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <section className="signage-overview-page">
      <header className="overview-topbar">
        <div className="topbar-crumbs"><span>Infrastructure Monitor</span><i>/</i><strong>Digital Signage</strong><i>/</i><span>Overview</span></div>
        <div className="topbar-actions">
          <button><Bell size={19} /></button>
          <button><Moon size={19} /></button>
          <div className="admin-user"><span><strong>Admin User</strong><small>Operations Chief</small></span><i>AU</i></div>
        </div>
      </header>

      <div className="overview-content">
        {signageByFloor.map(({ floor, items }) => (
          <section className="signage-floor-section" key={floor.id}>
            <h2>{floor.shortLabel}</h2>
            <div className="signage-card-grid">
              {items.map((item) => (
                <Link className={`signage-card ${item.status === 'offline' ? 'signage-card--offline' : ''}`} key={item.id} to={`/floors/${item.floorId}/blocks/${item.blockId ?? 'block-a'}/signage/${item.id}`}>
                  <div className="signage-preview">
                    <p>{item.contentTitle}</p>
                  </div>
                  <div className="signage-card-body">
                    <div className="signage-card-head">
                      <div>
                        <h3>{item.id}</h3>
                        <p>{item.location}</p>
                      </div>
                      <span className={`device-status device-status--${item.status}`}><i />{item.status}</span>
                    </div>
                    <footer>
                      <span>{item.status === 'offline' ? `Last Seen: ${item.lastSync}` : `Updated: ${item.lastSync}`}</span>
                      <strong>{item.status === 'offline' ? 'Reconnect' : 'Configure'}</strong>
                    </footer>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button className="refresh-fab" onClick={handleRefresh}>
        <RefreshCcw className={refreshing ? 'spin' : ''} size={19} />
        Live Refresh
      </button>
    </section>
  )
}
