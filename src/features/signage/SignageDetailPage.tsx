import { ChevronRight, Expand, RefreshCcw, Users, Wifi } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, ParkingBlock } from '../../domain/types'

export function SignageDetailPage() {
  const { signageId = '' } = useParams()
  const location = useLocation()
  const { pathname } = location
  const [signage, setSignage] = useState<DigitalSignage>()
  const [floor, setFloor] = useState<Floor>()
  const [block, setBlock] = useState<ParkingBlock>()
  const [refreshing, setRefreshing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    otoparkRepository.getSignage(signageId).then((item) => {
      setSignage(item)
      if (!item) return
      otoparkRepository.getFloor(item.floorId).then(setFloor)
      if (item.blockId) otoparkRepository.getBlock(item.floorId, item.blockId).then(setBlock)
    })
  }, [signageId])

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === boardRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (!signage) return <EmptyState title="Digital signage not found" />

  const inSignageTab = pathname.startsWith('/signage')
  const returnTo = typeof location.state === 'object' && location.state && 'returnTo' in location.state && typeof location.state.returnTo === 'string'
    ? location.state.returnTo
    : '/signage'
  const audience = getAudienceStats(signage)
  const boardContent = getSignageBoardContent(signage)

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  async function handlePreviewFullscreen() {
    if (!boardRef.current) return

    if (document.fullscreenElement === boardRef.current) {
      await document.exitFullscreen()
      return
    }

    await boardRef.current.requestFullscreen()
  }

  return (
    <section className="signage-detail-page">
      <header className="detail-topbar">
        <nav className="breadcrumbs">
          {inSignageTab ? (
            <>
              <Link to={returnTo}>Digital Signage</Link>
              <ChevronRight size={14} />
              <span>{getSignageBreadcrumbLabel(signage, floor?.shortLabel, block?.name)}</span>
            </>
          ) : (
            <>
              <Link to="/floors">Floor Maps</Link>
              <ChevronRight size={14} />
              <Link to={`/floors/${signage.floorId}`}>{floor?.shortLabel ?? signage.floorId}</Link>
              <ChevronRight size={14} />
              {block && <><Link to={`/floors/${signage.floorId}/blocks/${block.id}`}>{block.name}</Link><ChevronRight size={14} /></>}
              <span>{signage.id}</span>
            </>
          )}
        </nav>
      </header>

      <main className="signage-detail-content">
        <section className="panel-preview-card glass-panel">
          <div className="section-title"><i className="pulse-dot" /> Live Panel View: {signage.id}</div>
          <div className={`digital-board digital-board--${boardContent.theme}`} ref={boardRef}>
            <div className="board-copy">
              <strong>{boardContent.headline}</strong>
              <small className="board-subline">{boardContent.subline}</small>
            </div>
          </div>
          <div className="preview-actions">
            <button className="primary-pill" onClick={handlePreviewFullscreen}><Expand size={18} /> {isFullscreen ? 'Exit Fullscreen' : 'Preview Fullscreen'}</button>
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
        <span><Wifi size={14} /> Last Sync: {formatSyncTime(signage.lastSync)}</span>
      </footer>
    </section>
  )
}

function getSignageBreadcrumbLabel(signage: DigitalSignage, floorLabel?: string, blockName?: string) {
  return `${signage.id}, ${floorLabel ?? signage.floorId}, ${blockName ?? 'Common Area'}`
}

function formatSyncTime(value: string) {
  const now = new Date()
  const exactTimeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

  if (exactTimeMatch) {
    const [, hours, minutes, seconds = '00'] = exactTimeMatch
    return `${hours.padStart(2, '0')}:${minutes}:${seconds}`
  }

  if (value === 'Just now') return toDotTime(now)

  const relativeMatch = value.match(/^(\d+)([smh]) ago$/)
  if (relativeMatch) {
    const [, amountText, unit] = relativeMatch
    const amount = Number(amountText)
    const date = new Date(now)

    if (unit === 's') date.setSeconds(date.getSeconds() - amount)
    if (unit === 'm') date.setMinutes(date.getMinutes() - amount)
    if (unit === 'h') date.setHours(date.getHours() - amount)

    return toDotTime(date)
  }

  return value
}

function toDotTime(date: Date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getSignageBoardContent(signage: DigitalSignage) {
  const content = `${signage.contentTitle} ${signage.template} ${signage.location}`.toUpperCase()

  if (content.includes('STARBUCKS')) {
    return {
      theme: 'campaign',
      headline: 'FREE TALL COFFEE',
      subline: 'STARBUCKS · SELECTED PARKING VISITORS · TODAY ONLY',
    }
  }

  if (content.includes('ADIDAS')) {
    return {
      theme: 'campaign',
      headline: 'ADIDAS MEMBER OFFER',
      subline: 'SELECTED PERFORMANCE ITEMS · LIMITED TIME',
    }
  }

  if (content.includes('ATASUN')) {
    return {
      theme: 'campaign',
      headline: 'ATASUN OPTIK',
      subline: 'SELECTED FRAMES & SUNGLASSES · IN-STORE ADVANTAGE',
    }
  }

  if (content.includes('VIP')) {
    return {
      theme: 'vip',
      headline: signage.contentTitle,
      subline: 'FOLLOW THE RESERVED VIP CORRIDOR',
    }
  }

  if (content.includes('VALET')) {
    return {
      theme: 'service',
      headline: signage.contentTitle,
      subline: 'CHECK-IN AND PICKUP LANE AHEAD',
    }
  }

  if (content.includes('PAYMENT')) {
    return {
      theme: 'service',
      headline: 'PAYMENT KIOSK',
      subline: 'CARD AND MOBILE PAYMENT AVAILABLE AHEAD',
    }
  }

  if (content.includes('FIND YOUR CAR')) {
    return {
      theme: 'guidance',
      headline: 'FIND YOUR CAR',
      subline: 'USE THE KIOSK OR APP FOR QUICK GUIDANCE',
    }
  }

  if (content.includes('GUIDE') || content.includes('EXIT') || content.includes('DIRECTION')) {
    return {
      theme: 'guidance',
      headline: signage.contentTitle,
      subline: signage.location.toUpperCase(),
    }
  }

  if (content.includes('OFFLINE') || content.includes('SERVICE CHECK') || content.includes('DIAGNOSTICS')) {
    return {
      theme: 'system',
      headline: 'SERVICE CHECK',
      subline: 'TEMPORARILY UNAVAILABLE',
    }
  }

  return {
    theme: 'welcome',
    headline: signage.contentTitle,
    subline: 'EMAAR SQUARE AVM · ENJOY YOUR VISIT',
  }
}

function getAudienceStats(signage: DigitalSignage) {
  const statsBySignageId: Record<string, {
    primarySegment: string
    segments: Array<{ label: string; count: number }>
  }> = {
    'DS-401': {
      primarySegment: 'arriving family shoppers',
      segments: [
        { label: 'Family', count: 5 },
        { label: 'Standard', count: 5 },
        { label: 'Premium', count: 3 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-405': {
      primarySegment: 'coffee-stop visitors near the kiosk zone',
      segments: [
        { label: 'Standard', count: 5 },
        { label: 'Family', count: 4 },
        { label: 'Premium', count: 3 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-410': {
      primarySegment: 'premium visitors using the elevator bank',
      segments: [
        { label: 'Premium', count: 3 },
        { label: 'VIP', count: 2 },
        { label: 'Valet', count: 2 },
        { label: 'Family', count: 1 },
        { label: 'Standard', count: 1 },
      ],
    },
    'DS-411': {
      primarySegment: 'mixed central-hall shoppers',
      segments: [
        { label: 'Standard', count: 6 },
        { label: 'Family', count: 5 },
        { label: 'Premium', count: 3 },
        { label: 'VIP', count: 2 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-412': {
      primarySegment: 'valet arrivals and VIP guests',
      segments: [
        { label: 'Valet', count: 4 },
        { label: 'VIP', count: 3 },
        { label: 'Premium', count: 3 },
        { label: 'Family', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-501': {
      primarySegment: 'standard and family drivers moving from the ramp',
      segments: [
        { label: 'Standard', count: 5 },
        { label: 'Family', count: 3 },
        { label: 'Premium', count: 3 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-502': {
      primarySegment: 'sportswear-oriented premium shoppers',
      segments: [
        { label: 'Premium', count: 4 },
        { label: 'Standard', count: 4 },
        { label: 'Family', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-503': {
      primarySegment: 'drivers preparing to pay before exit',
      segments: [
        { label: 'Standard', count: 4 },
        { label: 'Family', count: 3 },
        { label: 'Premium', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-504': {
      primarySegment: 'returning visitors searching for their cars',
      segments: [
        { label: 'Family', count: 4 },
        { label: 'Standard', count: 4 },
        { label: 'Premium', count: 3 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-505': {
      primarySegment: 'drivers moving toward the left-side exit route',
      segments: [
        { label: 'Standard', count: 5 },
        { label: 'Family', count: 3 },
        { label: 'Premium', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-402': {
      primarySegment: 'premium arrivals entering the busiest zone',
      segments: [
        { label: 'Premium', count: 5 },
        { label: 'VIP', count: 4 },
        { label: 'Family', count: 3 },
        { label: 'Standard', count: 3 },
        { label: 'EV Owner', count: 2 },
      ],
    },
    'DS-603': {
      primarySegment: 'drivers at the central wayfinding junction',
      segments: [
        { label: 'Standard', count: 4 },
        { label: 'Family', count: 4 },
        { label: 'Premium', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-604': {
      primarySegment: 'valet users moving toward the portal exit',
      segments: [
        { label: 'Valet', count: 4 },
        { label: 'Premium', count: 3 },
        { label: 'Family', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-605': {
      primarySegment: 'VIP and premium members in the reserved corridor',
      segments: [
        { label: 'VIP', count: 5 },
        { label: 'Premium', count: 4 },
        { label: 'Valet', count: 2 },
        { label: 'EV Owner', count: 1 },
        { label: 'Family', count: 1 },
      ],
    },
    'DS-606': {
      primarySegment: 'drivers approaching the north exit lane',
      segments: [
        { label: 'Standard', count: 2 },
        { label: 'Premium', count: 2 },
        { label: 'Family', count: 1 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-607': {
      primarySegment: 'general visitors circulating through block B',
      segments: [
        { label: 'Standard', count: 3 },
        { label: 'Family', count: 2 },
        { label: 'Premium', count: 2 },
        { label: 'VIP', count: 1 },
        { label: 'EV Owner', count: 1 },
      ],
    },
    'DS-608': {
      primarySegment: 'VIP departures and premium exit traffic',
      segments: [
        { label: 'VIP', count: 4 },
        { label: 'Premium', count: 3 },
        { label: 'Valet', count: 2 },
        { label: 'EV Owner', count: 1 },
        { label: 'Family', count: 1 },
      ],
    },
  }

  const stats = statsBySignageId[signage.id] ?? {
    primarySegment: 'mixed mall visitors',
    segments: [
      { label: 'Standard', count: 5 },
      { label: 'Family', count: 3 },
      { label: 'Premium', count: 3 },
      { label: 'VIP', count: 2 },
      { label: 'EV Owner', count: 1 },
    ],
  }

  return {
    estimatedViewers: stats.segments.reduce((sum, segment) => sum + segment.count, 0),
    primarySegment: stats.primarySegment,
    segments: stats.segments,
  }
}
