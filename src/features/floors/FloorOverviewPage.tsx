import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, ParkingBlock } from '../../domain/types'
import { getFloorVisualMetrics } from './visualMetrics'

export function FloorOverviewPage() {
  const [floors, setFloors] = useState<Floor[]>([])
  const [blocks, setBlocks] = useState<ParkingBlock[]>([])
  const [signage, setSignage] = useState<DigitalSignage[]>([])

  useEffect(() => {
    otoparkRepository.listFloors().then(setFloors)
    otoparkRepository.listBlocks().then(setBlocks)
    otoparkRepository.listSignage().then(setSignage)
  }, [])

  const totals = useMemo(() => {
    const summary = getFloorVisualMetrics(blocks)
    const signages = signage.length

    return {
      capacity: summary.total,
      occupied: summary.occupied,
      free: summary.free,
      signages,
    }
  }, [blocks, signage])

  const summaries = useMemo(() => {
    return floors.map((floor) => {
      const floorBlocks = blocks.filter((block) => block.floorId === floor.id)
      const floorSignage = signage.filter((item) => item.floorId === floor.id)
      const availableBlocks = floorBlocks.filter((block) => block.status === 'available').length
      const busyBlocks = floorBlocks.filter((block) => block.status === 'busy').length
      const fullBlocks = floorBlocks.filter((block) => block.status === 'full').length
      const metrics = getFloorVisualMetrics(floorBlocks)
      const signages = floorSignage.length
      const occupancyRate = metrics.total ? Math.round((metrics.occupied / metrics.total) * 100) : 0

      return {
        floor,
        availableBlocks,
        busyBlocks,
        fullBlocks,
        signages,
        occupancyRate,
        parkedCars: metrics.occupied,
        freeSpots: metrics.free,
        floorStatus: getFloorStatus(occupancyRate),
      }
    })
  }, [blocks, floors, signage])

  return (
    <section className="floor-overview-page">
      <header className="floor-overview-topbar">
        <nav className="breadcrumbs">
          <span>Floor Maps</span>
        </nav>
      </header>

      <div className="floor-overview-content">
        <section className="floor-overview-intro">
          <div>
            <h1>Select a Floor</h1>
          </div>

          <div className="floor-overview-summary glass-panel">
            <div>
              <small>Total Capacity</small>
              <strong>{totals.capacity}</strong>
            </div>
            <div>
              <small>Free Spots</small>
              <strong>{totals.free}</strong>
            </div>
            <div>
              <small>Signages</small>
              <strong>{totals.signages}</strong>
            </div>
          </div>
        </section>

        <div className="floor-overview-grid">
          {summaries.map(({ floor, availableBlocks, busyBlocks, fullBlocks, signages, occupancyRate, parkedCars, freeSpots, floorStatus }) => (
            <Link className="floor-overview-card glass-panel" key={floor.id} to={`/floors/${floor.id}`}>
              <div className="floor-overview-card-head">
                <div>
                  <small>{floor.label}</small>
                  <h2>{floor.shortLabel}</h2>
                </div>
                <span className={`status-badge status-badge--${floorStatus}`}>{getFloorStatusLabel(floorStatus)}</span>
              </div>

              <div className="floor-overview-metrics">
                <div>
                  <small>Occupancy</small>
                  <strong>{occupancyRate}%</strong>
                </div>
                <div>
                  <small>Parked Cars</small>
                  <strong>{parkedCars}</strong>
                </div>
                <div>
                  <small>Free Spots</small>
                  <strong>{freeSpots}</strong>
                </div>
              </div>

              <div className="floor-overview-breakdown">
                <span>Available blocks: <strong>{availableBlocks}</strong></span>
                <span>Busy blocks: <strong>{busyBlocks}</strong></span>
                <span>Full blocks: <strong>{fullBlocks}</strong></span>
                <span>Signages: <strong>{signages}</strong></span>
              </div>

              <footer>
                <ArrowRight size={16} />
              </footer>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function getFloorStatus(occupancyRate: number): 'available' | 'busy' | 'full' {
  if (occupancyRate >= 90) return 'full'
  if (occupancyRate >= 45) return 'busy'
  return 'available'
}

function getFloorStatusLabel(status: 'available' | 'busy' | 'full') {
  if (status === 'full') return 'High Occupancy'
  if (status === 'busy') return 'Moderate Occupancy'
  return 'Available'
}
