import { RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, ParkingBlock } from '../../domain/types'

export function SignageOverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [floors, setFloors] = useState<Floor[]>([])
  const [blocks, setBlocks] = useState<ParkingBlock[]>([])
  const [signage, setSignage] = useState<DigitalSignage[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    otoparkRepository.listFloors().then(setFloors)
    otoparkRepository.listBlocks().then(setBlocks)
    otoparkRepository.listSignage().then(setSignage)
  }, [])

  const floorFilter = searchParams.get('floorId')
  const blockFilter = searchParams.get('blockId')
  const visibleBlocks = floorFilter ? blocks.filter((block) => block.floorId === floorFilter) : []

  const signageByFloor = useMemo(() => {
    return floors
      .filter((floor) => !floorFilter || floor.id === floorFilter)
      .map((floor) => ({
        floor,
        items: signage.filter((item) => item.floorId === floor.id && (!blockFilter || item.blockId === blockFilter)),
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
                nextParams.delete('blockId')
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
                  nextParams.set('blockId', nextBlockId)
                } else {
                  nextParams.delete('blockId')
                }
                setSearchParams(nextParams)
              }}
              aria-label="Filter by block"
              disabled={!floorFilter || visibleBlocks.length === 0}
            >
              <option value="">All Blocks</option>
              {visibleBlocks.map((block) => <option key={`${block.floorId}-${block.id}`} value={block.id}>{block.name}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="overview-content">
        {signageByFloor.map(({ floor, items }) => (
          <section className="signage-floor-section" key={floor.id}>
            <h2>{floor.shortLabel}</h2>
            <div className="signage-card-grid">
              {items.map((item) => (
                <Link
                  className={`signage-card ${item.status === 'offline' ? 'signage-card--offline' : ''}`}
                  key={item.id}
                  to={`/signage/${item.id}`}
                  state={{ returnTo: `/signage${searchParams.toString() ? `?${searchParams.toString()}` : ''}` }}
                >
                  <div className="signage-preview">
                    <p>{item.contentTitle}</p>
                  </div>
                  <div className="signage-card-body">
                    <div className="signage-card-head">
                      <div>
                        <h3>{item.id}</h3>
                        <p>{floor.shortLabel} · {formatBlockLabel(item.blockId)} · {item.location}</p>
                      </div>
                      <span className={`device-status device-status--${item.status}`}><i />{item.status}</span>
                    </div>
                    <footer>
                      <span>{item.status === 'offline' ? `Last Seen: ${formatSyncTime(item.lastSync)}` : `Updated: ${formatSyncTime(item.lastSync)}`}</span>
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

