import { ChevronRight, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, FloorId, ParkingBlock } from '../../domain/types'
import { getBlockVisualMetrics, getFloorVisualMetrics } from './visualMetrics'

const defaultFloorId: FloorId = 'floor-b2'
const floorIds: FloorId[] = ['floor-0', 'floor-b1', 'floor-b2']

export function FloorMapPage() {
  const { floorId: floorIdParam } = useParams()
  const navigate = useNavigate()
  const selectedFloorId = isFloorId(floorIdParam) ? floorIdParam : defaultFloorId
  const [floors, setFloors] = useState<Floor[]>([])
  const [blocks, setBlocks] = useState<ParkingBlock[]>([])
  const [signage, setSignage] = useState<DigitalSignage[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    otoparkRepository.listFloors().then(setFloors)
  }, [])

  useEffect(() => {
    otoparkRepository.listBlocks(selectedFloorId).then(setBlocks)
    otoparkRepository.listSignage(selectedFloorId).then(setSignage)
  }, [selectedFloorId])

  const floor = floors.find((item) => item.id === selectedFloorId)
  const visibleSignage = useMemo(
    () => signage.map((item) => ({ item, marker: getFloorSignageMarker(item) })),
    [signage],
  )
  const capacity = useMemo(() => {
    const summary = getFloorVisualMetrics(blocks)
    return {
      total: summary.total,
      occupied: summary.occupied,
      free: summary.free,
      rate: summary.total ? Math.round((summary.occupied / summary.total) * 100) : 0,
    }
  }, [blocks])

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <section className="floor-page page-with-footer">
      <header className="floor-topbar">
        <nav className="breadcrumbs">
          <Link to="/floors">Floor Maps</Link>
          <ChevronRight size={14} />
          <span>{floor?.shortLabel ?? selectedFloorId}</span>
        </nav>

        <div className="floor-topbar-actions">
          <div className="select-wrap">
            <select value={selectedFloorId} onChange={(event) => navigate(`/floors/${event.target.value}`)} aria-label="Select floor">
              {floors.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>

          <div className="legend glass-panel compact">
          <span><i className="legend-dot legend-dot--available" /> Available</span>
          <span><i className="legend-dot legend-dot--busy" /> Busy</span>
          <span><i className="legend-dot legend-dot--full" /> Full</span>
          <span><i className="legend-signage-icon" /> Signage</span>
          </div>
        </div>
      </header>

      <div className="map-context">
        <div className="floor-canvas">
          <svg className="floor-svg" viewBox="0 0 1000 600" role="img" aria-label={`${floor?.label ?? 'Floor'} block map`}>
            <rect className="floor-outline" height="500" rx="4" width="900" x="50" y="50" />
            <path className="floor-paths" d="M 250 50 L 250 550 M 750 50 L 750 550 M 50 300 L 950 300" />

            {blocks.map((block) => {
              const centerX = block.x + block.width / 2
              const centerY = block.y + block.height / 2
              return (
                <g
                  className="block-group"
                  key={`${block.floorId}-${block.id}`}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/floors/${block.floorId}/blocks/${block.id}`, { state: { zoomFromFloorMap: getBlockZoomState(block) } })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/floors/${block.floorId}/blocks/${block.id}`, { state: { zoomFromFloorMap: getBlockZoomState(block) } })
                  }}
                >
                  <rect className={`parking-block-svg parking-block-svg--${block.status}`} height={block.height} rx="4" width={block.width} x={block.x} y={block.y} />
                  <text
                    className={`floor-block-label floor-block-label--${block.status}`}
                    textAnchor="middle"
                    x={centerX}
                    y={centerY}
                    transform={block.rotateLabel ? `rotate(90 ${centerX} ${centerY})` : undefined}
                  >
                    {block.label}
                  </text>
                  <foreignObject className="block-tooltip" height="44" width="190" x={Math.max(block.x - 20, 60)} y={block.y < 300 ? block.y - 52 : block.y + block.height + 10}>
                    <div className="svg-tooltip glass-panel">
                      {(() => {
                        const metrics = getBlockVisualMetrics(block)
                        return `${block.name}: ${metrics.occupied}/${metrics.total} ${block.status === 'full' ? 'Full' : block.status === 'busy' ? 'Busy' : 'Occupied'}`
                      })()}
                    </div>
                  </foreignObject>
                </g>
              )
            })}

            <g>
              {visibleSignage.map(({ item, marker }) => (
                <g
                  className="signage-marker-svg"
                  key={item.id}
                  onClick={() => navigate(item.blockId ? `/floors/${item.floorId}/blocks/${item.blockId}/signage/${item.id}` : `/signage/${item.id}`)}
                >
                  <line
                    className={`signage-marker-line signage-marker-line--${item.status}`}
                    x1={marker.isHorizontal ? marker.x - 28 : marker.x}
                    x2={marker.isHorizontal ? marker.x + 28 : marker.x}
                    y1={marker.isHorizontal ? marker.y : marker.y - 28}
                    y2={marker.isHorizontal ? marker.y : marker.y + 28}
                  />
                  <foreignObject
                    className="signage-tooltip"
                    height="36"
                    width="96"
                    x={marker.x - 48}
                    y={marker.y - 52}
                  >
                    <div className="svg-tooltip glass-panel">{item.id}</div>
                  </foreignObject>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>

      <footer className="status-bar glass-panel">
        <div className="status-group capacity-group">
          <span>Capacity</span>
          <div className="meter"><i style={{ width: `${capacity.rate}%` }} /></div>
          <strong>{capacity.rate}%</strong>
        </div>
        <div className="divider" />
        <div className="status-group stat-pair"><span>Free Slots</span><strong>{capacity.free}</strong></div>
        <div className="divider" />
        <div className="status-group stat-pair"><span>Signages</span><strong>{visibleSignage.length.toString().padStart(2, '0')}</strong></div>
        <button className="refresh-button" onClick={handleRefresh}>
          <RefreshCcw className={refreshing ? 'spin' : ''} size={18} />
          Live Refresh
        </button>
      </footer>
    </section>
  )
}

function getFloorSignageMarker(signage: DigitalSignage) {
  return {
    x: signage.x ?? 0,
    y: signage.y ?? 0,
    isHorizontal: (signage.mapOrientation ?? signage.orientation) === 'horizontal',
  }
}

function getBlockZoomState(block: ParkingBlock) {
  return {
    originX: `${((block.x + block.width / 2) / 1000) * 100}%`,
    originY: `${((block.y + block.height / 2) / 600) * 100}%`,
    startScale: Math.max(0.16, Math.min(0.42, Math.max(block.width / 900, block.height / 500))),
  }
}

function isFloorId(value: string | undefined): value is FloorId {
  return floorIds.includes(value as FloorId)
}
