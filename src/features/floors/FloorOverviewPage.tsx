import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { otoparkRepository } from '../../data/repository'
import type { DigitalSignage, Floor, ParkingBlock } from '../../domain/types'

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
    const capacity = floors.reduce((sum, floor) => sum + floor.capacity, 0)
    const occupied = floors.reduce((sum, floor) => sum + floor.occupied, 0)
    const activeSigns = signage.filter((item) => item.status === 'online').length

    return {
      capacity,
      occupied,
      free: Math.max(capacity - occupied, 0),
      activeSigns,
    }
  }, [floors, signage])

  const summaries = useMemo(() => {
    return floors.map((floor) => {
      const floorBlocks = blocks.filter((block) => block.floorId === floor.id)
      const floorSignage = signage.filter((item) => item.floorId === floor.id)
      const availableBlocks = floorBlocks.filter((block) => block.status === 'available').length
      const busyBlocks = floorBlocks.filter((block) => block.status === 'busy').length
      const fullBlocks = floorBlocks.filter((block) => block.status === 'full').length
      const activeSigns = floorSignage.filter((item) => item.status === 'online').length
      const occupancyRate = floor.capacity ? Math.round((floor.occupied / floor.capacity) * 100) : 0

      return {
        floor,
        availableBlocks,
        busyBlocks,
        fullBlocks,
        activeSigns,
        occupancyRate,
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
              <small>Active Digital Signages</small>
              <strong>{totals.activeSigns}</strong>
            </div>
          </div>
        </section>

        <div className="floor-overview-grid">
          {summaries.map(({ floor, availableBlocks, busyBlocks, fullBlocks, activeSigns, occupancyRate, floorStatus }) => (
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
                  <strong>{floor.occupied}</strong>
                </div>
                <div>
                  <small>Free Spots</small>
                  <strong>{Math.max(floor.capacity - floor.occupied, 0)}</strong>
                </div>
              </div>

              <div className="floor-overview-breakdown">
                <span>Available blocks: <strong>{availableBlocks}</strong></span>
                <span>Busy blocks: <strong>{busyBlocks}</strong></span>
                <span>Full blocks: <strong>{fullBlocks}</strong></span>
                <span>Active digital signages: <strong>{activeSigns}</strong></span>
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
