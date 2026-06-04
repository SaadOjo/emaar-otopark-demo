import type { FloorId, ParkingBlock, ParkingSpot } from '../../domain/types'

export function getBlockVisualMetrics(block: ParkingBlock) {
  const total = getSpotCount(block)
  const occupied = getTargetOccupiedCount(block, total)

  return {
    total,
    occupied,
    free: Math.max(total - occupied, 0),
    rate: total ? Math.round((occupied / total) * 100) : 0,
  }
}

export function getFloorVisualMetrics(blocks: ParkingBlock[]) {
  return blocks.reduce(
    (summary, block) => {
      const metrics = getBlockVisualMetrics(block)
      summary.total += metrics.total
      summary.occupied += metrics.occupied
      summary.free += metrics.free
      return summary
    },
    { total: 0, occupied: 0, free: 0 },
  )
}

export function syncSpotsWithBlock(floorId: FloorId, block: ParkingBlock, sourceSpots: ParkingSpot[]) {
  const prefix = block.id.replace('block-', '').slice(0, 1).toUpperCase() || 'P'
  const spotCount = getSpotCount(block)
  const targetOccupied = getTargetOccupiedCount(block, spotCount)
  const seededSpots: ParkingSpot[] = sourceSpots.length > 0
    ? [...sourceSpots].sort((a, b) => a.id.localeCompare(b.id))
    : Array.from({ length: spotCount }, (_, index) => ({
        id: `${prefix}${String(index + 1).padStart(2, '0')}`,
        floorId,
        blockId: block.id,
        status: 'available' as const,
      }))

  return Array.from({ length: spotCount }, (_, index) => {
    const existing = seededSpots[index]
    const id = existing?.id ?? `${prefix}${String(index + 1).padStart(2, '0')}`
    const occupied = index < targetOccupied
    return {
      id,
      floorId,
      blockId: block.id,
      status: occupied ? 'occupied' as const : 'available' as const,
      vehicleId: occupied ? existing?.vehicleId : undefined,
    }
  })
}

function getSpotCount(block: ParkingBlock) {
  const ratio = block.width / Math.max(block.height, 1)
  const shapeBonus = ratio >= 2 ? 4 : ratio >= 1.45 ? 2 : 0
  const scaled = Math.round((block.capacity / 120) * 30) + shapeBonus
  return Math.max(12, Math.min(30, scaled))
}

function getTargetOccupiedCount(block: ParkingBlock, spotCount: number) {
  const ratioCount = Math.round((block.occupied / Math.max(block.capacity, 1)) * spotCount)

  if (block.status === 'full') {
    const minFull = Math.max(spotCount - 2, Math.ceil(spotCount * 0.88))
    return clamp(ratioCount, minFull, spotCount)
  }

  if (block.status === 'busy') {
    const minBusy = Math.max(6, Math.ceil(spotCount * 0.38))
    const maxBusy = Math.max(minBusy, Math.floor(spotCount * 0.82))
    return clamp(ratioCount, minBusy, maxBusy)
  }

  const minAvailable = block.occupied > 0 ? 1 : 0
  const maxAvailable = Math.max(minAvailable, Math.ceil(spotCount * 0.38))
  return clamp(ratioCount, minAvailable, maxAvailable)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
