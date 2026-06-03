import { CarFront, ChevronRight, Plus, RefreshCcw, Zap } from 'lucide-react'
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
    if (!floorId || !block) return spots
    return syncSpotsWithBlock(floorId, block, spots)
  }, [block, floorId, spots])

  const gridColumns = visibleSpots.length > 24 ? 10 : visibleSpots.length > 16 ? 8 : 6
  const spotRows = useMemo(() => chunkSpots(visibleSpots, gridColumns), [gridColumns, visibleSpots])

  const occupied = visibleSpots.filter((spot) => spot.status === 'occupied').length
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
        <div className="page-toolbar">
          <nav className="breadcrumbs">
            <Link to="/floors">Floor Maps</Link>
            <ChevronRight size={14} />
            <Link to={`/floors/${floorId}`}>{floor?.shortLabel ?? floorId}</Link>
            <ChevronRight size={14} />
            <span>{block.name}</span>
          </nav>

          <div className="select-wrap block-toolbar-select">
            <select value={block.id} onChange={(event) => navigate(`/floors/${floorId}/blocks/${event.target.value}`)} aria-label="Select block">
              {blocks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>

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
                <span className={`road-sign-line road-sign-line--${item.orientation === 'horizontal' ? 'long' : 'short'} road-sign-line--${item.status}`} />
                <strong className="road-sign-label">{item.id}</strong>
              </button>
            ))}
          </section>

          <div className={`spot-grid ${visibleSpots.length > 24 ? 'spot-grid--dense' : visibleSpots.length > 16 ? 'spot-grid--compact' : ''} ${block.status === 'full' ? 'spot-grid--full' : ''}`}>
            {spotRows.map((row, rowIndex) => (
              <div className="spot-row-wrap" key={`row-${rowIndex}`}>
                <div className={`spot-row ${rowIndex % 2 === 1 && block.status !== 'full' ? 'spot-row--offset' : ''}`} style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
                  {row.map((spot, columnIndex) => {
                    const vehicle = vehicles.find((item) => item.id === spot.vehicleId)
                    const absoluteIndex = rowIndex * gridColumns + columnIndex
                    const displayVehicle = vehicle ?? (spot.status === 'occupied' ? createSyntheticVehicle(floorId, blockId, spot.id, absoluteIndex) : undefined)
                    const className = `spot-card ${spot.status === 'occupied' ? 'spot-card--occupied' : 'spot-card--empty'}`
                    const canOpenDetails = Boolean(vehicle?.owner)
                    if (vehicle && canOpenDetails) {
                      return (
                        <Link className={className} key={spot.id} to={`/floors/${floorId}/blocks/${blockId}/vehicles/${vehicle.id}/templates`}>
                          <span className="spot-id">{spot.id}</span>
                          {vehicle.isElectric ? <Zap className="car-icon" size={44} /> : <CarFront className="car-icon" size={48} />}
                          <VehicleTooltip vehicle={vehicle} />
                        </Link>
                      )
                    }

                    if (displayVehicle) {
                      return (
                        <div className={className} key={spot.id}>
                          <span className="spot-id">{spot.id}</span>
                          {displayVehicle.isElectric ? <Zap className="car-icon" size={44} /> : <CarFront className="car-icon" size={48} />}
                          <VehicleTooltip vehicle={displayVehicle} />
                        </div>
                      )
                    }

                    return (
                      <div className={className} key={spot.id}>
                        <span className="spot-id">{spot.id}</span>
                        {absoluteIndex < 6 && <Plus className="empty-icon" size={24} />}
                      </div>
                    )
                  })}
                </div>
                {rowIndex < spotRows.length - 1 && (
                  <div className="spot-hallway" aria-hidden="true">
                    <i /><i /><i />
                  </div>
                )}
              </div>
            ))}
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
      <strong>{vehicle.brand} {vehicle.model}</strong>
      <em>User: {vehicle.owner ?? '—'}</em>
      <span>
        {vehicle.isElectric ? `Charging: ${vehicle.batteryLevel ?? 0}%` : `ID: ${vehicle.plate}`}
      </span>
    </span>
  )
}

function createSyntheticVehicle(floorId: FloorId, blockId: string, spotId: string, index: number): Vehicle {
  const presets = [
    { brand: 'BMW', model: '320i', plate: '34 BMV 320' },
    { brand: 'Mercedes', model: 'C 200', plate: '34 MRC 200' },
    { brand: 'Audi', model: 'A4', plate: '34 AUD 404' },
    { brand: 'Volkswagen', model: 'Passat', plate: '34 VW 606' },
    { brand: 'Peugeot', model: '3008', plate: '34 PGT 308' },
    { brand: 'Tesla', model: 'Model Y', plate: '34 EV 111' },
  ]
  const preset = presets[index % presets.length]
  const isElectric = preset.brand === 'Tesla'

  return {
    id: `synthetic-${blockId}-${spotId}`,
    plate: `${preset.plate.slice(0, 7)}${String(index % 10)}`,
    brand: preset.brand,
    model: preset.model,
    owner: undefined,
    tier: 'Guest Vehicle',
    floorId,
    blockId,
    spotId,
    locationLabel: `${spotId}, ${blockId.toUpperCase()}`,
    isElectric,
    batteryLevel: isElectric ? 76 : undefined,
  }
}

function chunkSpots(spots: ParkingSpot[], columns: number) {
  return Array.from({ length: Math.ceil(spots.length / columns) }, (_, index) => spots.slice(index * columns, index * columns + columns))
}

function syncSpotsWithBlock(floorId: FloorId, block: ParkingBlock, sourceSpots: ParkingSpot[]): ParkingSpot[] {
  const prefix = block.id.replace('block-', '').slice(0, 1).toUpperCase() || 'P'
  const spotCount = getSpotCount(block)
  const targetOccupied = getTargetOccupiedCount(block, spotCount)
  const seededSpots: ParkingSpot[] = sourceSpots.length > 0
    ? [...sourceSpots].sort((a, b) => a.id.localeCompare(b.id))
    : Array.from({ length: spotCount }, (_, index) => ({
        id: `${prefix}${String(index + 1).padStart(2, '0')}`,
        floorId,
        blockId: block.id,
        status: 'available',
      }))

  return Array.from({ length: spotCount }, (_, index) => {
    const existing = seededSpots[index]
    const id = existing?.id ?? `${prefix}${String(index + 1).padStart(2, '0')}`
    const occupied = index < targetOccupied
    return {
      id,
      floorId,
      blockId: block.id,
      status: occupied ? 'occupied' : 'available',
      vehicleId: occupied ? existing?.vehicleId : undefined,
    }
  })
}

function getSpotCount(block: ParkingBlock) {
  const scaled = Math.round((block.capacity / 120) * 30)
  return Math.max(12, Math.min(30, scaled))
}

function getTargetOccupiedCount(block: ParkingBlock, spotCount: number) {
  const ratioCount = Math.round((block.occupied / Math.max(block.capacity, 1)) * spotCount)

  if (block.status === 'full') return spotCount
  if (block.status === 'busy') return Math.min(spotCount - 2, Math.max(ratioCount, 7))
  return Math.max(block.occupied > 0 ? 1 : 0, Math.min(ratioCount, 3))
}

function isFloorId(value: string | undefined): value is FloorId {
  return floorIds.includes(value as FloorId)
}
