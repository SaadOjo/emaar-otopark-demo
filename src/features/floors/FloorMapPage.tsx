import { Monitor, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, FloorId, ParkingBlock } from '../../domain/types'

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
  const capacity = useMemo(() => {
    const total = blocks.reduce((sum, block) => sum + block.capacity, 0)
    const occupied = blocks.reduce((sum, block) => sum + block.occupied, 0)
    return {
      total,
      occupied,
      free: Math.max(total - occupied, 0),
      rate: total ? Math.round((occupied / total) * 100) : 0,
    }
  }, [blocks])

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <section className="floor-page page-with-footer">
      <header className="floor-topbar">
        <div className="select-wrap">
          <select value={selectedFloorId} onChange={(event) => navigate(`/floors/${event.target.value}`)} aria-label="Select floor">
            {floors.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>

        <div className="legend glass-panel compact">
          <span><i className="legend-dot legend-dot--available" /> Available</span>
          <span><i className="legend-dot legend-dot--full" /> Full</span>
          <span><Monitor size={14} /> Signage</span>
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
                  onClick={() => navigate(`/floors/${block.floorId}/blocks/${block.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/floors/${block.floorId}/blocks/${block.id}`)
                  }}
                >
                  <rect className={`parking-block-svg parking-block-svg--${block.status}`} height={block.height} rx="4" width={block.width} x={block.x} y={block.y} />
                  <text
                    className={`floor-block-label ${block.status === 'available' ? 'floor-block-label--bright' : ''}`}
                    textAnchor="middle"
                    x={centerX}
                    y={centerY}
                    transform={block.rotateLabel ? `rotate(90 ${centerX} ${centerY})` : undefined}
                  >
                    {block.label}
                  </text>
                  <foreignObject className="block-tooltip" height="44" width="190" x={Math.max(block.x - 20, 60)} y={block.y < 300 ? block.y - 52 : block.y + block.height + 10}>
                    <div className="svg-tooltip glass-panel">
                      {block.name}: {block.occupied}/{block.capacity} {block.status === 'full' ? 'Full' : block.status === 'busy' ? 'Busy' : 'Occupied'}
                    </div>
                  </foreignObject>
                </g>
              )
            })}

            <g>
              {signage.map((item) => (
                <g
                  className="signage-marker-svg"
                  key={item.id}
                  onClick={() => navigate(`/floors/${item.floorId}/blocks/${item.blockId ?? 'block-a'}/signage/${item.id}`)}
                >
                  <rect
                    height={item.orientation === 'horizontal' ? 12 : 32}
                    rx="2"
                    width={item.orientation === 'horizontal' ? 32 : 12}
                    x={item.x ?? 0}
                    y={item.y ?? 0}
                  />
                  <text x={(item.x ?? 0) + (item.orientation === 'horizontal' ? 16 : 6)} y={(item.y ?? 0) + (item.orientation === 'horizontal' ? 10 : 20)} textAnchor="middle">▣</text>
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
        <div className="status-group stat-pair"><span>Free Slots</span><strong>{capacity.free || floor ? capacity.free : 142}</strong></div>
        <div className="divider" />
        <div className="status-group stat-pair"><span>Active Signs</span><strong>{signage.filter((item) => item.status === 'online').length.toString().padStart(2, '0')}</strong></div>
        <button className="refresh-button" onClick={handleRefresh}>
          <RefreshCcw className={refreshing ? 'spin' : ''} size={18} />
          Live Refresh
        </button>
      </footer>
    </section>
  )
}

function isFloorId(value: string | undefined): value is FloorId {
  return floorIds.includes(value as FloorId)
}
