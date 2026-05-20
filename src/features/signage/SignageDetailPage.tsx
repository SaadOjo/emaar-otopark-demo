import { ChevronRight, Expand, RefreshCcw, Users, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, ParkingBlock } from '../../domain/types'

export function SignageDetailPage() {
  const { signageId = '' } = useParams()
  const { pathname } = useLocation()
  const [signage, setSignage] = useState<DigitalSignage>()
  const [floor, setFloor] = useState<Floor>()
  const [block, setBlock] = useState<ParkingBlock>()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    otoparkRepository.getSignage(signageId).then((item) => {
      setSignage(item)
      if (!item) return
      otoparkRepository.getFloor(item.floorId).then(setFloor)
      if (item.blockId) otoparkRepository.getBlock(item.floorId, item.blockId).then(setBlock)
    })
  }, [signageId])

  if (!signage) return <EmptyState title="Digital signage not found" />

  const inSignageTab = pathname.startsWith('/signage')
  const audience = getAudienceStats(signage)

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <section className="signage-detail-page">
      <header className="detail-topbar">
        <nav className="breadcrumbs">
          {inSignageTab ? (
            <>
              <Link to="/signage">Digital Signage</Link>
              <ChevronRight size={14} />
              <Link to={`/floors/${signage.floorId}`}>{floor?.label ?? signage.floorId}</Link>
              {block && <><ChevronRight size={14} /><span>{block.name}</span></>}
              <ChevronRight size={14} />
              <span>{signage.id}</span>
            </>
          ) : (
            <>
              <Link to={`/floors/${signage.floorId}`}>Floor Maps</Link>
              <ChevronRight size={14} />
              <Link to={`/floors/${signage.floorId}`}>{floor?.label ?? signage.floorId}</Link>
              <ChevronRight size={14} />
              {block && <><Link to={`/floors/${signage.floorId}/blocks/${block.id}`}>{block.name}</Link><ChevronRight size={14} /></>}
              <span>Digital Signage ({signage.id})</span>
            </>
          )}
        </nav>
      </header>

      <main className="signage-detail-content">
        <section className="panel-preview-card glass-panel">
          <div className="section-title"><i className="pulse-dot" /> Live Panel View: {signage.id}</div>
          <div className="digital-board">
            <div className="board-copy">
              <span>WELCOME TO</span>
              <strong>EMAAR SQUARE AVM</strong>
            </div>
          </div>
          <div className="preview-actions">
            <button className="template-picker">
              <span><small>Current Template</small><strong>{signage.template}</strong></span>
              <ChevronRight size={18} />
            </button>
            <button className="primary-pill"><Expand size={18} /> Preview Fullscreen</button>
          </div>
        </section>

        <aside className="panel-controls">
          <section className="glass-panel control-card">
            <h3>Live Status</h3>
            <div className="status-metrics">
              <div>
                <small>Connectivity</small>
                <strong className="online-line"><i />{signage.status}</strong>
              </div>
              <div>
                <small>Panel Temp</small>
                <strong>{signage.temperatureC.toFixed(1)}°C</strong>
              </div>
            </div>
          </section>

          <section className="glass-panel control-card audience-card">
            <h3>User Stats</h3>
            <div className="audience-intro">
              <span className="audience-total"><Users size={18} /> Estimated live audience: {audience.estimatedViewers}</span>
              <p>This panel is currently prioritizing <strong>{audience.primarySegment}</strong> because that audience is dominant in this zone right now.</p>
            </div>
            <div className="audience-grid">
              {audience.segments.map((segment) => (
                <div key={segment.label}>
                  <small>{segment.label}</small>
                  <strong>{segment.count} users</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer className="detail-footer">
        <button onClick={handleRefresh}><RefreshCcw className={refreshing ? 'spin' : ''} size={15} /> Live Refresh</button>
        <i />
        <span><Wifi size={14} /> Last Sync: {signage.lastSync}</span>
      </footer>
    </section>
  )
}

function getAudienceStats(signage: DigitalSignage) {
  if (signage.id === 'DS-402') {
    return {
      estimatedViewers: 18,
      primarySegment: 'VIP and high-segment drivers',
      segments: [
        { label: 'High-Segment', count: 5 },
        { label: 'VIP', count: 5 },
        { label: 'Family', count: 4 },
        { label: 'Valet', count: 2 },
        { label: 'EV Owner', count: 2 },
      ],
    }
  }

  if (signage.id === 'DS-604') {
    return {
      estimatedViewers: 11,
      primarySegment: 'valet users',
      segments: [
        { label: 'Valet', count: 4 },
        { label: 'Premium', count: 3 },
        { label: 'Family', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    }
  }

  return {
    estimatedViewers: 14,
    primarySegment: 'mixed mall visitors',
    segments: [
      { label: 'Standard', count: 5 },
      { label: 'Family', count: 3 },
      { label: 'Premium', count: 3 },
      { label: 'VIP', count: 2 },
      { label: 'EV Owner', count: 1 },
    ],
  }
}
