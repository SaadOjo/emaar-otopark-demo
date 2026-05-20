import { CarFront, ChevronRight, Monitor, Plus, RefreshCcw, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, FloorId, ParkingBlock, ParkingSpot, Vehicle } from '../../domain/types'

const floorIds: FloorId[] = ['floor-0', 'floor-b1', 'floor-b2']

export function BlockMapPage() {
  const { floorId: floorIdParam, blockId = '' } = useParams()
  const floorId = isFloorId(floorIdParam) ? floorIdParam : undefined
  const navigate = useNavigate()
  const [floor, setFloor] = useState<Floor>()
  const [block, setBlock] = useState<ParkingBlock>()
  const [blocks, setBlocks] = useState<ParkingBlock[]>([])
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [signage, setSignage] = useState<DigitalSignage[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!floorId) return
    otoparkRepository.getFloor(floorId).then(setFloor)
    otoparkRepository.listBlocks(floorId).then(setBlocks)
    otoparkRepository.getBlock(floorId, blockId).then(setBlock)
    otoparkRepository.listSpots(floorId, blockId).then(setSpots)
    otoparkRepository.listVehicles(floorId, blockId).then(setVehicles)
    otoparkRepository.listSignage(floorId, blockId).then(setSignage)
  }, [blockId, floorId])

  const visibleSpots = useMemo(() => {
    if (spots.length > 0 || !floorId || !block) return spots
    return buildFallbackSpots(floorId, block.id)
  }, [block, floorId, spots])

  const occupied = spots.filter((spot) => spot.status === 'occupied').length
  const capacity = useMemo(() => {
    const total = block?.capacity ?? visibleSpots.length
    const used = block?.occupied ?? occupied
    return {
      total,
      free: Math.max(total - used, 0),
      rate: total ? Math.round((used / total) * 100) : 0,
    }
  }, [block, occupied, visibleSpots.length])

  if (!floorId) return <EmptyState title="Floor not found" />
  if (!block) return <EmptyState title="Block not found" detail="Open a block from the floor map." />

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <section className="block-page page-with-footer">
      <div className="block-content">
        <nav className="breadcrumbs">
          <Link to={`/floors/${floorId}`}>Floor Maps</Link>
          <ChevronRight size={14} />
          <Link to={`/floors/${floorId}`}>{floor?.label ?? floorId}</Link>
          <ChevronRight size={14} />
          <div className="select-wrap breadcrumb-select-wrap">
            <select value={block.id} onChange={(event) => navigate(`/floors/${floorId}/blocks/${event.target.value}`)} aria-label="Select block">
              {blocks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </nav>

        <div className="block-canvas">
          <div className="dot-grid" />
          <section className="roadway">
            <div className="lane-lines" aria-hidden="true"><i /><i /><i /><i /></div>
            {signage.slice(0, 2).map((item, index) => (
              <button
                className={`road-sign road-sign--${index === 0 ? 'top' : 'bottom'}`}
                key={item.id}
                onClick={() => navigate(`/floors/${item.floorId}/blocks/${item.blockId ?? blockId}/signage/${item.id}`)}
              >
                <i className="road-sign-pole" />
                <span className="road-sign-screen">
                  <Monitor size={16} />
                  <strong>{item.id}</strong>
                </span>
              </button>
            ))}
          </section>

          <div className="spot-grid">
            {visibleSpots.map((spot, index) => {
              const vehicle = vehicles.find((item) => item.id === spot.vehicleId)
              const className = `spot-card ${spot.status === 'occupied' ? 'spot-card--occupied' : 'spot-card--empty'} ${index > 5 ? 'spot-card--lower' : ''}`
              if (vehicle) {
                return (
                  <Link className={className} key={spot.id} to={`/floors/${floorId}/blocks/${blockId}/vehicles/${vehicle.id}/templates`}>
                    <span className="spot-id">{spot.id}</span>
                    {vehicle.isElectric ? <Zap className="car-icon" size={44} /> : <CarFront className="car-icon" size={48} />}
                    <VehicleTooltip vehicle={vehicle} />
                  </Link>
                )
              }

              return (
                <div className={className} key={spot.id}>
                  <span className="spot-id">{spot.id}</span>
                  {index < 6 && <Plus className="empty-icon" size={24} />}
                </div>
              )
            })}
          </div>

          <div className="structural-arc" />
          <div className="corner-frame" />
        </div>
      </div>

      <footer className="status-bar status-bar--static">
        <div className="status-group capacity-group">
          <span>Capacity</span>
          <div className="meter"><i style={{ width: `${capacity.rate}%` }} /></div>
          <strong>{capacity.rate}%</strong>
        </div>
        <div className="divider" />
        <div className="status-group stat-pair"><span>Free Slots</span><strong>{capacity.free}</strong></div>
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

function VehicleTooltip({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className="vehicle-tooltip">
      <small>Vehicle Details</small>
      <strong>Brand: {vehicle.brand}</strong>
      <strong>Model: {vehicle.model}</strong>
      <em>User: {vehicle.owner}</em>
      <span>
        {vehicle.isElectric ? `Charging: ${vehicle.batteryLevel ?? 0}%` : `ID: ${vehicle.plate}`}
        <i />
      </span>
    </span>
  )
}

function buildFallbackSpots(floorId: FloorId, blockId: string): ParkingSpot[] {
  const prefix = blockId.replace('block-', '').slice(0, 1).toUpperCase() || 'P'
  return Array.from({ length: 12 }, (_, index) => ({
    id: `${prefix}${String(index + 1).padStart(2, '0')}`,
    floorId,
    blockId,
    status: 'available',
  }))
}

function isFloorId(value: string | undefined): value is FloorId {
  return floorIds.includes(value as FloorId)
}
