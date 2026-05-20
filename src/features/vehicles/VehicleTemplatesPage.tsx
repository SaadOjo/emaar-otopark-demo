import { BadgeCheck, ChevronRight, Coffee, Megaphone, MoreVertical, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { otoparkRepository } from '../../data/repository'
import type { Floor, MessageTemplate, ParkingBlock, Vehicle } from '../../domain/types'

export function VehicleTemplatesPage() {
  const { vehicleId = '' } = useParams()
  const [vehicle, setVehicle] = useState<Vehicle>()
  const [floor, setFloor] = useState<Floor>()
  const [block, setBlock] = useState<ParkingBlock>()
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('welcome')

  useEffect(() => {
    otoparkRepository.getVehicle(vehicleId).then((item) => {
      setVehicle(item)
      if (!item) return
      otoparkRepository.getFloor(item.floorId).then(setFloor)
      otoparkRepository.getBlock(item.floorId, item.blockId).then(setBlock)
      otoparkRepository.listMessageTemplates(item.id).then(setTemplates)
    })
  }, [vehicleId])

  if (!vehicle) return <EmptyState title="Vehicle not found" />

  return (
    <section className="vehicle-page">
      <main className="vehicle-content">
        <nav className="breadcrumbs">
          <Link to={`/floors/${vehicle.floorId}`}>Floor Maps</Link>
          <ChevronRight size={14} />
          <Link to={`/floors/${vehicle.floorId}`}>{floor?.label ?? vehicle.floorId}</Link>
          <ChevronRight size={14} />
          <Link to={`/floors/${vehicle.floorId}/blocks/${vehicle.blockId}`}>{block?.name ?? vehicle.blockId}</Link>
          <ChevronRight size={14} />
          <span>Vehicle Details ({vehicle.spotId})</span>
        </nav>

        <section className="vehicle-header-card glass-panel">
          <div className="vehicle-title-group">
            <div className="vehicle-thumb" />
            <div>
              <h1>{vehicle.brand} {vehicle.model}</h1>
              <p>{vehicle.plate} · {vehicle.locationLabel}</p>
            </div>
          </div>
          <div className="member-block">
            <div>
              <small>{vehicle.tier}</small>
              <strong>{vehicle.owner}</strong>
            </div>
            <button><MoreVertical size={20} /></button>
          </div>
        </section>

        <section className="message-section">
          <div className="message-section-head">
            <h2>Message Template Selector</h2>
            <span>{templates.filter((item) => item.sentAt).length} Sent Templates</span>
          </div>

          <div className="template-grid">
            {templates.map((template) => (
              <button
                className={`template-card glass-panel ${selectedTemplateId === template.id ? 'template-card--selected' : ''}`}
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <div className="template-card-body">
                  <header>
                    <span>{template.type}</span>
                    {getTemplateIcon(template.icon)}
                  </header>
                  <h3>{template.title}</h3>
                  <p>“{template.body}”</p>
                </div>
                <footer>
                  <span>{template.trigger}</span>
                  {template.sentAt && <strong><BadgeCheck size={14} /> Sent at {template.sentAt}</strong>}
                </footer>
              </button>
            ))}
          </div>
        </section>

        <footer className="vehicle-footer">
          <div><small>Current Location</small><strong>{vehicle.locationLabel}</strong></div>
          <span><i /> Live Signal Active</span>
        </footer>
      </main>
    </section>
  )
}

function getTemplateIcon(icon: MessageTemplate['icon']) {
  if (icon === 'campaign') return <Megaphone size={22} />
  if (icon === 'loyalty') return <Coffee size={22} />
  return <Sparkles size={22} />
}
