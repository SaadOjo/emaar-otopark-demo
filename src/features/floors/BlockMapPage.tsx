import { CarFront, ChevronRight, RefreshCcw, Zap } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, FloorId, ParkingBlock, ParkingSpot, Vehicle } from '../../domain/types'
import { getBlockVisualMetrics, syncSpotsWithBlock as buildVisibleSpots } from './visualMetrics'

const floorIds: FloorId[] = ['floor-0', 'floor-b1', 'floor-b2']

export function BlockMapPage() {
  const { floorId: floorIdParam, blockId = '' } = useParams()
  const floorId = isFloorId(floorIdParam) ? floorIdParam : undefined
  const navigate = useNavigate()
  const location = useLocation()
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
    return buildVisibleSpots(floorId, block, spots)
  }, [block, floorId, spots])

  const blockLayout = useMemo(() => getBlockLayout(block, visibleSpots.length), [block, visibleSpots.length])
  const roadSigns = useMemo(
    () => signage.map((item) => ({ item, placement: getDetailRoadSignPlacement(item, block, blockLayout) })),
    [block, blockLayout, signage],
  )
  const gridColumns = blockLayout.columns
  const spotRows = useMemo(() => chunkSpots(visibleSpots, gridColumns), [gridColumns, visibleSpots])

  const occupied = visibleSpots.filter((spot) => spot.status === 'occupied').length
  const capacity = useMemo(() => {
    if (!block) {
      return {
        total: visibleSpots.length,
        free: Math.max(visibleSpots.length - occupied, 0),
        rate: visibleSpots.length ? Math.round((occupied / visibleSpots.length) * 100) : 0,
      }
    }

    return getBlockVisualMetrics(block)
  }, [block, occupied, visibleSpots.length])

  if (!floorId) return <EmptyState title="Floor not found" />
  if (!block) return <EmptyState title="Block not found" detail="Open a block from the floor map." />

  const zoomState = (location.state as { zoomFromFloorMap?: { originX?: string; originY?: string; startScale?: number } | boolean } | null)?.zoomFromFloorMap
  const zoomStyle = typeof zoomState === 'object' && zoomState
    ? ({
        '--zoom-origin-x': zoomState.originX ?? '50%',
        '--zoom-origin-y': zoomState.originY ?? '50%',
        '--zoom-start-scale': String(zoomState.startScale ?? 0.22),
      } as CSSProperties)
    : undefined
  const zoomFromFloorMap = Boolean(zoomState)

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

        <div className={`block-canvas block-canvas--${blockLayout.orientation} ${zoomFromFloorMap ? 'block-canvas--zoom-enter' : ''}`} style={zoomStyle}>
          <div className="dot-grid" />
          <div className={`block-body block-body--${blockLayout.orientation} block-body--road-${blockLayout.roadEdge}`}>
            <section className={`roadway roadway--${blockLayout.orientation}`}>
              <div className={`lane-lines lane-lines--${blockLayout.orientation}`} aria-hidden="true"><i /><i /><i /><i /></div>
              {roadSigns.map(({ item, placement }) => (
                <button
                  className={`road-sign road-sign--edge-${placement.edge} road-sign--${placement.edge === 'left' || placement.edge === 'right' ? 'side' : 'top-bottom'}`}
                  key={item.id}
                  onClick={() => navigate(`/floors/${item.floorId}/blocks/${item.blockId ?? blockId}/signage/${item.id}`)}
                  style={{ '--road-sign-offset': `${placement.offset}%` } as CSSProperties}
                >
                  <i className="road-sign-pole" />
                  <span className={`road-sign-line road-sign-line--${item.orientation === 'horizontal' ? 'long' : 'short'} road-sign-line--${item.status}`} />
                  <strong className="road-sign-label">{item.id}</strong>
                </button>
              ))}
            </section>

            <div className={`spot-grid spot-grid--${blockLayout.orientation} ${visibleSpots.length > 24 ? 'spot-grid--dense' : visibleSpots.length > 16 ? 'spot-grid--compact' : ''} ${block.status === 'full' ? 'spot-grid--full' : ''}`} style={blockLayout.scale !== 1 ? { transform: `scale(${blockLayout.scale})` } : undefined}>
              {spotRows.map((row, rowIndex) => (
                <div className="spot-row-wrap" key={`row-${rowIndex}`}>
                  <div className={`spot-row ${rowIndex % 2 === 1 && block.status !== 'full' && blockLayout.orientation !== 'vertical' ? 'spot-row--offset' : ''}`} style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
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
                        </div>
                      )
                    })}
                  </div>
                  {rowIndex < spotRows.length - 1 && (
                    <div className={`spot-hallway spot-hallway--${blockLayout.orientation}`} aria-hidden="true">
                      <i /><i /><i />
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        <div className="status-group stat-pair"><span>Signages</span><strong>{signage.length.toString().padStart(2, '0')}</strong></div>
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

function getBlockLayout(block: ParkingBlock | undefined, spotCount: number) {
  if (!block) {
    return { orientation: 'square' as const, columns: spotCount > 24 ? 10 : spotCount > 16 ? 8 : 6, scale: 1, roadEdge: 'top' as const }
  }

  const ratio = block.width / Math.max(block.height, 1)

  if (ratio >= 1.45) {
    return {
      orientation: 'horizontal' as const,
      columns: spotCount > 26 ? 10 : spotCount > 18 ? 8 : 6,
      scale: 1,
      roadEdge: getBlockRoadEdge(block, 'horizontal'),
    }
  }

  if (ratio <= 0.8) {
    return {
      orientation: 'vertical' as const,
      columns: Math.min(5, Math.max(4, Math.ceil(spotCount / 5))),
      scale: spotCount > 24 ? 0.92 : spotCount > 18 ? 0.96 : 1,
      roadEdge: getBlockRoadEdge(block, 'vertical'),
    }
  }

  return {
    orientation: 'square' as const,
    columns: spotCount > 24 ? 8 : spotCount > 16 ? 6 : 5,
    scale: spotCount > 24 ? 0.96 : 1,
    roadEdge: getBlockRoadEdge(block, 'square'),
  }
}

function getDetailRoadSignPlacement(
  signage: DigitalSignage,
  block: ParkingBlock | undefined,
  layout: ReturnType<typeof getBlockLayout>,
) {
  if (!block) {
    return { edge: layout.roadEdge, offset: 50 }
  }

  if (signage.detailEdge && signage.detailOffset) {
    return { edge: signage.detailEdge, offset: signage.detailOffset }
  }

  const x = signage.x ?? block.x + block.width / 2
  const y = signage.y ?? block.y + block.height / 2
  const nearestRoad = getNearestRoad(x, y)

  if (layout.orientation === 'vertical') {
    return {
      edge: nearestRoad.axis === 'vertical' ? (x <= nearestRoad.line ? 'left' : 'right') : layout.roadEdge,
      offset: clamp(getRelativePercent(y, block.y, block.height), 14, 86),
    }
  }

  return {
    edge: nearestRoad.axis === 'horizontal' ? (y <= nearestRoad.line ? 'top' : 'bottom') : layout.roadEdge,
    offset: clamp(getRelativePercent(x, block.x, block.width), 14, 86),
  }
}

function getBlockRoadEdge(block: ParkingBlock, orientation: 'horizontal' | 'vertical' | 'square') {
  if (orientation === 'vertical') {
    const centerX = block.x + block.width / 2
    const nearestVerticalRoad = Math.abs(centerX - 250) < Math.abs(centerX - 750) ? 250 : 750
    return nearestVerticalRoad < centerX ? 'left' as const : 'right' as const
  }

  return block.y + block.height / 2 < 300 ? 'bottom' as const : 'top' as const
}

function getNearestRoad(x: number, y: number) {
  const candidates = [
    { axis: 'vertical' as const, line: 250, distance: Math.abs(x - 250) },
    { axis: 'vertical' as const, line: 750, distance: Math.abs(x - 750) },
    { axis: 'horizontal' as const, line: 300, distance: Math.abs(y - 300) },
  ]

  return candidates.sort((a, b) => a.distance - b.distance)[0]
}

function getRelativePercent(value: number, start: number, length: number) {
  return ((value - start) / Math.max(length, 1)) * 100
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isFloorId(value: string | undefined): value is FloorId {
  return floorIds.includes(value as FloorId)
}
