import { ChevronRight, Edit3, Expand, RefreshCcw, Wifi } from 'lucide-react'
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
  const [brightness, setBrightness] = useState(85)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    otoparkRepository.getSignage(signageId).then((item) => {
      setSignage(item)
      if (!item) return
      setBrightness(item.brightness)
      otoparkRepository.getFloor(item.floorId).then(setFloor)
      if (item.blockId) otoparkRepository.getBlock(item.floorId, item.blockId).then(setBlock)
    })
  }, [signageId])

  if (!signage) return <EmptyState title="Digital signage not found" />

  const inSignageTab = pathname.startsWith('/signage')

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

          <section className="glass-panel control-card panel-control-card">
            <h3>Panel Controls</h3>
            <button className="change-content"><Edit3 size={18} /> Change Content Manually</button>
            <div className="brightness-control">
              <div><strong>Panel Brightness</strong><span>{brightness}%</span></div>
              <input min="0" max="100" type="range" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} />
              <footer><span>Auto (Eco)</span><span>Peak (1200 nits)</span></footer>
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
