import { RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, ParkingBlock } from '../../domain/types'
import { getSignageBoardContent } from './signageBoardContent'

export function SignageOverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [floors, setFloors] = useState<Floor[]>([])
  const [blocks, setBlocks] = useState<ParkingBlock[]>([])
  const [signage, setSignage] = useState<DigitalSignage[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [hoveredSignageId, setHoveredSignageId] = useState<string>()

  useEffect(() => {
    otoparkRepository.listFloors().then(setFloors)
    otoparkRepository.listBlocks().then(setBlocks)
    otoparkRepository.listSignage().then(setSignage)
  }, [])

  const floorFilter = searchParams.get('floorId')
  const blockFilter = searchParams.get('blockKey')
  const visibleBlocks = floorFilter ? blocks.filter((block) => block.floorId === floorFilter) : blocks
  const floorLabels = new Map(floors.map((floor) => [floor.id, floor.shortLabel]))

  const signageByFloor = useMemo(() => {
    return floors
      .filter((floor) => !floorFilter || floor.id === floorFilter)
      .map((floor) => ({
        floor,
        items: signage.filter((item) => item.floorId === floor.id && (!blockFilter || `${item.floorId}:${item.blockId ?? 'common'}` === blockFilter)),
      }))
      .filter(({ items }) => items.length > 0)
  }, [blockFilter, floorFilter, floors, signage])

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <section className="signage-overview-page">
      <header className="overview-topbar">
        <nav className="breadcrumbs">
          <span>Digital Signage</span>
        </nav>

        <div className="topbar-actions">
          <div className="select-wrap">
            <select
              value={floorFilter ?? ''}
              onChange={(event) => {
                const nextFloorId = event.target.value
                const nextParams = new URLSearchParams(searchParams)
                if (nextFloorId) {
                  nextParams.set('floorId', nextFloorId)
                } else {
                  nextParams.delete('floorId')
                }
                setSearchParams(nextParams)
              }}
              aria-label="Filter by floor"
            >
              <option value="">All Floors</option>
              {floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.label}</option>)}
            </select>
          </div>

          <div className="select-wrap">
            <select
              value={blockFilter ?? ''}
              onChange={(event) => {
                const nextBlockId = event.target.value
                const nextParams = new URLSearchParams(searchParams)
                if (nextBlockId) {
                  nextParams.set('blockKey', nextBlockId)
                } else {
                  nextParams.delete('blockKey')
                }
                nextParams.delete('blockId')
                setSearchParams(nextParams)
              }}
              aria-label="Filter by block"
            >
              <option value="">All Blocks</option>
              {visibleBlocks.map((block) => <option key={`${block.floorId}-${block.id}`} value={`${block.floorId}:${block.id}`}>{block.name} · {floorLabels.get(block.floorId)}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="overview-content">
        {signageByFloor.map(({ floor, items }) => (
          <section className="signage-floor-section" key={floor.id}>
            <h2>{floor.shortLabel}</h2>
            <div className="signage-card-grid">
              {items.map((item) => {
                const boardContent = getSignageBoardContent(item)
                const showPreviewMedia = hoveredSignageId === item.id

                return (
                <Link
                  className={`signage-card ${item.status === 'offline' ? 'signage-card--offline' : ''}`}
                  key={item.id}
                  onBlur={() => setHoveredSignageId(undefined)}
                  onFocus={() => setHoveredSignageId(item.id)}
                  onMouseEnter={() => setHoveredSignageId(item.id)}
                  onMouseLeave={() => setHoveredSignageId(undefined)}
                  to={`/signage/${item.id}`}
                  state={{ returnTo: `/signage${searchParams.toString() ? `?${searchParams.toString()}` : ''}` }}
                >
                  <div className={`signage-preview signage-preview--interactive signage-preview--${boardContent.theme}`}>
                    {showPreviewMedia && boardContent.embedSrc ? (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="signage-preview-embed"
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={boardContent.embedSrc}
                        title={`${item.id} hover preview`}
                      />
                    ) : showPreviewMedia && boardContent.videoSrc ? (
                      <video autoPlay className="signage-preview-video" loop muted playsInline src={boardContent.videoSrc} />
                    ) : boardContent.previewImageSrc ? (
                      <img alt="" className="signage-preview-image" src={boardContent.previewImageSrc} />
                    ) : boardContent.imageSrc ? (
                      <img alt="" className="signage-preview-image" src={boardContent.imageSrc} />
                    ) : (
                      <div className="signage-preview-fallback" aria-hidden="true" />
                    )}
                    <div className="signage-preview-meta">
                      <strong>{item.contentTitle}</strong>
                    </div>
                  </div>
                  <div className="signage-card-body">
                    <div className="signage-card-head">
                      <div>
                        <h3>{item.id}</h3>
                        <p>{formatBlockLabel(item.blockId)} · {item.location}</p>
                      </div>
                      <span className={`device-status device-status--${item.status}`}><i />{item.status}</span>
                    </div>
                    <footer>
                      <span>{item.status === 'offline' ? `Last Seen: ${formatSyncTime(item.lastSync)}` : `Updated: ${formatSyncTime(item.lastSync)}`}</span>
                    </footer>
                  </div>
                </Link>
              )})}
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

function formatBlockLabel(blockId?: string) {
  if (!blockId) return 'Common Area'
  return blockId.replace('block-', 'Block ').toUpperCase()
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

