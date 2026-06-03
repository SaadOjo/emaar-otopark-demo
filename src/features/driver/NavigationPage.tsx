import { LocateFixed, Navigation, ParkingCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

type LaneStage = {
  type: 'lane'
  floor: string
  block: string
  routeSpots: readonly string[]
  oppositeSpots: readonly string[]
}

type TransitionStage = {
  type: 'transition'
  floor: string
  block: string
  marker: string
  headline: string
  subline: string
}

type RouteStage = LaneStage | TransitionStage

type RouteDefinition = {
  name: string
  distance: string
  eta: string
  access: string
  targetFloor: string
  targetBlock: string
  targetSpot: string
  stages: readonly RouteStage[]
}

const routeMap = {
  starbucks: {
    name: 'Starbucks',
    distance: '120 m',
    eta: '2 dk',
    access: 'Güney AVM koridoru',
    targetFloor: 'Kat -2',
    targetBlock: 'Blok A',
    targetSpot: 'A11',
    stages: [
      {
        type: 'lane',
        floor: 'Kat -1',
        block: 'Blok A',
        routeSpots: ['A04', 'A05', 'A08'],
        oppositeSpots: ['A12', 'A13', 'A14', 'A15', 'A16'],
      },
      {
        type: 'transition',
        floor: 'Kat -1',
        block: 'Rampa',
        marker: 'Rampa',
        headline: 'Kat -2 rampasına gir',
        subline: 'Düz devam et ve aşağı in',
      },
      {
        type: 'lane',
        floor: 'Kat -2',
        block: 'Blok A',
        routeSpots: ['A01', 'A04', 'A08', 'A11'],
        oppositeSpots: ['A12', 'A13', 'A14', 'A15', 'A16'],
      },
    ],
  },
  adidas: {
    name: 'Adidas',
    distance: '260 m',
    eta: '4 dk',
    access: 'Kuzey asansör lobisi',
    targetFloor: 'Kat -1',
    targetBlock: 'Blok B',
    targetSpot: 'B10',
    stages: [
      {
        type: 'lane',
        floor: 'Kat 00',
        block: 'Blok B',
        routeSpots: ['B03', 'B05', 'B07'],
        oppositeSpots: ['B11', 'B12', 'B13', 'B14', 'B15'],
      },
      {
        type: 'transition',
        floor: 'Kat 00',
        block: 'Rampa',
        marker: 'Rampa',
        headline: 'Kat -1 rampasına gir',
        subline: 'Şerit sonunda aşağı yönü takip et',
      },
      {
        type: 'lane',
        floor: 'Kat -1',
        block: 'Blok B',
        routeSpots: ['B02', 'B04', 'B07', 'B10'],
        oppositeSpots: ['B11', 'B12', 'B13', 'B14', 'B15'],
      },
    ],
  },
  atasun: {
    name: 'Atasun Optik',
    distance: '180 m',
    eta: '3 dk',
    access: 'Zemin kat ana lobi',
    targetFloor: 'Kat 00',
    targetBlock: 'Blok A',
    targetSpot: 'A11',
    stages: [
      {
        type: 'lane',
        floor: 'Kat 00',
        block: 'Blok A',
        routeSpots: ['A05', 'A06', 'A08', 'A11'],
        oppositeSpots: ['A12', 'A13', 'A14', 'A15', 'A16'],
      },
    ],
  },
} as const satisfies Record<string, RouteDefinition>

type RouteKey = keyof typeof routeMap

type LaneFrame = {
  type: 'lane'
  floor: string
  block: string
  currentMarker: string
  nextMarker: string
  routeSpots: string[]
  oppositeSpots: string[]
  currentIndex: number
}

type TransitionFrame = {
  type: 'transition'
  floor: string
  block: string
  currentMarker: string
  nextMarker: string
  headline: string
  subline: string
}

type RouteFrame = LaneFrame | TransitionFrame

export function NavigationPage() {
  const [searchParams] = useSearchParams()
  const destinationId = (searchParams.get('destination') as RouteKey | null) ?? 'starbucks'
  const routeKey: RouteKey = routeMap[destinationId] ? destinationId : 'starbucks'
  const destination = useMemo(() => routeMap[routeKey], [routeKey])
  const [cameraPulse, setCameraPulse] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const frames = useMemo(() => buildRouteFrames(destination), [destination])
  const frame = frames[Math.min(currentStep, frames.length - 1)]
  const progressRatio = frames.length > 1 ? currentStep / (frames.length - 1) : 1
  const routeSide = destination.targetBlock.endsWith('A') ? 'left' : 'right'
  const oppositeSide = routeSide === 'left' ? 'right' : 'left'
  const firstTransition = destination.stages.find((stage) => stage.type === 'transition')

  useEffect(() => {
    setCurrentStep(0)
    const interval = window.setInterval(() => {
      setCurrentStep((step) => (step >= frames.length - 1 ? step : step + 1))
    }, 1800)

    return () => window.clearInterval(interval)
  }, [frames])

  function handleRecenter() {
    setCurrentStep(0)
    setCameraPulse(true)
    window.setTimeout(() => setCameraPulse(false), 700)
  }

  return (
    <main className="driver-navigation-page driver-navigation-page--camera">
      <div className="navigation-map-shell">
        <div className="navigation-map navigation-map--camera">
          <div className="maps-toolbar-actions maps-toolbar-actions--floating">
            <button aria-label="Rotayı yeniden ortala" onClick={handleRecenter}>
              <LocateFixed size={18} />
            </button>
          </div>

          <section className={`driver-camera-stage glass-panel ${cameraPulse ? 'driver-camera-stage--pulse' : ''}`}>
            <header className="driver-camera-head">
              <span><ParkingCircle size={15} /> Kamera konumu algıladı</span>
              <strong>{frame.currentMarker} · {frame.block} · {frame.floor}</strong>
            </header>

            {firstTransition && (
              <div className="driver-route-notice">
                <span>Rampa bilgisi</span>
                <strong>{firstTransition.headline} · {firstTransition.subline}</strong>
              </div>
            )}

            <div className="driver-camera-view">
              <div className="camera-lane">
                <div className="camera-lane-edge camera-lane-edge--left" aria-hidden="true" />
                <div className="camera-lane-edge camera-lane-edge--right" aria-hidden="true" />
                <div className="camera-lane-centerline" />
                <div className="camera-progress-line" style={{ height: `${18 + progressRatio * 56}%` }} />
                <div className="camera-progress-car" style={{ bottom: `${12 + progressRatio * 14}%` }} />

                {frame.type === 'lane' ? (
                  <>
                    <div className={`camera-marker-rail camera-marker-rail--${routeSide}`}>
                      {frame.routeSpots.map((spot, index) => {
                        const relativeIndex = index - frame.currentIndex
                        const isVisible = relativeIndex >= 0 && relativeIndex <= 2
                        const top = 78 - relativeIndex * 16
                        const scale = Math.max(0.58, 1 - relativeIndex * 0.12)

                        return (
                          <div
                            className={`camera-perspective-marker ${spot === frame.currentMarker ? 'camera-perspective-marker--current' : ''} ${spot === destination.targetSpot ? 'camera-perspective-marker--target' : ''} ${index < frame.currentIndex ? 'camera-perspective-marker--passed' : ''}`}
                            key={spot}
                            style={{
                              top: `${top}%`,
                              opacity: isVisible ? 1 : 0,
                              transform: `translateY(-50%) scale(${scale})`,
                            }}
                          >
                            {spot}
                          </div>
                        )
                      })}
                    </div>

                    <div className={`camera-marker-rail camera-marker-rail--${oppositeSide} camera-marker-rail--opposite`}>
                      {frame.oppositeSpots.map((spot, index) => {
                        const relativeIndex = index - frame.currentIndex
                        const isVisible = relativeIndex >= 0 && relativeIndex <= 2
                        const top = 78 - relativeIndex * 16
                        const scale = Math.max(0.58, 1 - relativeIndex * 0.12)

                        return (
                          <div
                            className="camera-perspective-marker camera-perspective-marker--opposite"
                            key={spot}
                            style={{
                              top: `${top}%`,
                              opacity: isVisible ? 0.82 : 0,
                              transform: `translateY(-50%) scale(${scale})`,
                            }}
                          >
                            {spot}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="camera-floor-transition">
                    <span>{frame.currentMarker}</span>
                    <strong>{frame.headline}</strong>
                    <p>{frame.subline}</p>
                  </div>
                )}

                <div className="camera-guidance camera-guidance--corner">
                  <strong>{frame.type === 'transition' ? frame.headline : frame.currentMarker === destination.targetSpot ? `${destination.targetSpot} noktasına park et` : `Sıradaki görünen nokta: ${frame.nextMarker}`}</strong>
                  <p>{frame.type === 'transition' ? frame.subline : <><strong>{destination.targetSpot}</strong> noktasına kadar düz devam et.</>}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="driver-route-hud">Konum: {frame.currentMarker} • Hedef: {destination.targetSpot} • {destination.distance}</div>

          <aside className="route-panel route-panel--camera glass-panel">
            <small>Canlı Park Rotası</small>
            <h1>{destination.name}</h1>
            <p><Navigation size={16} /> {destination.distance}</p>
            <p>Tahmini varış: {destination.eta}</p>
            <p>{frame.floor}, {frame.block}</p>
            {firstTransition && <p className="route-panel-note">Rota içinde rampa geçişi var · Alt kata inilecek</p>}
            <strong>Hedef park noktası: {destination.targetSpot}</strong>
            <strong className="route-panel-current">Mevcut nokta: {frame.currentMarker}</strong>
            <em>En uygun AVM girişi: {destination.access}</em>
            <Link to="/driver/welcome">Rotayı Kapat</Link>
          </aside>
        </div>
      </div>
    </main>
  )
}

function buildRouteFrames(route: RouteDefinition): RouteFrame[] {
  const frames: RouteFrame[] = []

  route.stages.forEach((stage, stageIndex) => {
    if (stage.type === 'lane') {
      stage.routeSpots.forEach((spot, index) => {
        frames.push({
          type: 'lane',
          floor: stage.floor,
          block: stage.block,
          currentMarker: spot,
          nextMarker: getNextMarker(route.stages, stageIndex, index),
          routeSpots: [...stage.routeSpots],
          oppositeSpots: [...stage.oppositeSpots],
          currentIndex: index,
        })
      })
      return
    }

    frames.push({
      type: 'transition',
      floor: stage.floor,
      block: stage.block,
      currentMarker: stage.marker,
      nextMarker: getFollowingStageMarker(route.stages, stageIndex),
      headline: stage.headline,
      subline: stage.subline,
    })
  })

  return frames
}

function getNextMarker(stages: readonly RouteStage[], stageIndex: number, index: number) {
  const stage = stages[stageIndex]
  if (stage.type !== 'lane') return getFollowingStageMarker(stages, stageIndex)
  if (index < stage.routeSpots.length - 1) return stage.routeSpots[index + 1]
  return getFollowingStageMarker(stages, stageIndex)
}

function getFollowingStageMarker(stages: readonly RouteStage[], stageIndex: number) {
  for (let index = stageIndex + 1; index < stages.length; index += 1) {
    const stage = stages[index]
    if (stage.type === 'transition') return stage.marker
    if (stage.type === 'lane') return stage.routeSpots[0]
  }

  const currentStage = stages[stageIndex]
  if (currentStage.type === 'transition') return currentStage.marker
  return currentStage.routeSpots[currentStage.routeSpots.length - 1]
}
