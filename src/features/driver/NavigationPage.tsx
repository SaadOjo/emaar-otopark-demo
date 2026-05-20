import { LocateFixed, Navigation } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const routeMap = {
  starbucks: { name: 'Starbucks', floor: 'Kat -2', block: 'Blok A', spot: 'Nokta 11', distance: '120 m', eta: '2 dk' },
  adidas: { name: 'Adidas', floor: 'Kat 1', block: 'Blok A', spot: 'Nokta 10', distance: '260 m', eta: '4 dk' },
  atasun: { name: 'Atasun Optik', floor: 'Kat 0', block: 'Blok A', spot: 'Nokta 11', distance: '180 m', eta: '3 dk' },
} as const

const routeSceneMap = {
  starbucks: {
    points: [[0, 18], [0, 2], [0, -16], [4.2, -16], [9.4, -24], [11.6, -40]] as const,
    signPosition: [14.8, 3.1, -44] as const,
    signRotation: -Math.PI / 5,
    glowPosition: [11.6, 0.14, -40] as const,
  },
  adidas: {
    points: [[0, 18], [0, 2], [0, -14], [-4.2, -14], [-9.4, -24], [-11.8, -42]] as const,
    signPosition: [-14.8, 3.1, -46] as const,
    signRotation: Math.PI / 5,
    glowPosition: [-11.8, 0.14, -42] as const,
  },
  atasun: {
    points: [[0, 18], [0, 8], [0, -2], [4.2, -2], [9.4, -8], [11.8, -20]] as const,
    signPosition: [14.8, 3.1, -24] as const,
    signRotation: -Math.PI / 5,
    glowPosition: [11.8, 0.14, -20] as const,
  },
} as const

const modelCatalog = {
  ferrari: { url: '/models/ferrari.glb', length: 5.8, baseRotation: Math.PI, label: 'Ferrari' },
  toycar: { url: '/models/ToyCar.glb', length: 5.9, baseRotation: 0, label: 'ToyCar' },
  milktruck: { url: '/models/CesiumMilkTruck.glb', length: 6.4, baseRotation: Math.PI, label: 'MilkTruck' },
} as const

const parkedCarSlots = [
  { model: 'ferrari', x: -14.4, z: 14, rotation: Math.PI / 2.45 },
  { model: 'toycar', x: -14.4, z: 0, rotation: Math.PI / 2.45 },
  { model: 'milktruck', x: -14.4, z: -18, rotation: Math.PI / 2.45 },
  { model: 'ferrari', x: -14.4, z: -38, rotation: Math.PI / 2.45 },
  { model: 'toycar', x: 14.4, z: 10, rotation: -Math.PI / 2.45 },
  { model: 'milktruck', x: 14.4, z: -10, rotation: -Math.PI / 2.45 },
  { model: 'ferrari', x: 14.4, z: -30, rotation: -Math.PI / 2.45 },
  { model: 'toycar', x: 14.4, z: -52, rotation: -Math.PI / 2.45 },
  { model: 'milktruck', x: 14.4, z: -82, rotation: -Math.PI / 2.45 },
] as const

type RouteKey = keyof typeof routeMap
type RouteDestination = (typeof routeMap)[RouteKey]
type ModelKey = keyof typeof modelCatalog

export function NavigationPage() {
  const [searchParams] = useSearchParams()
  const destinationId = (searchParams.get('destination') as RouteKey | null) ?? 'starbucks'
  const routeKey: RouteKey = routeMap[destinationId] ? destinationId : 'starbucks'
  const destination = useMemo(() => routeMap[routeKey], [routeKey])
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const resetRouteRef = useRef<() => void>(() => {})

  useEffect(() => {
    const host = canvasHostRef.current
    if (!host) return

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.replaceChildren(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1b1f24')
    scene.fog = new THREE.Fog('#1b1f24', 24, 132)

    const camera = new THREE.PerspectiveCamera(74, 1, 0.1, 240)
    scene.add(camera)

    const ambientLight = new THREE.HemisphereLight('#e7f0ff', '#171a1e', 2.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight('#fff1c4', 1.8)
    keyLight.position.set(10, 12, 8)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    scene.add(keyLight)

    const coolLight = new THREE.PointLight('#7db7ff', 24, 64, 2)
    coolLight.position.set(0, 3.4, -52)
    scene.add(coolLight)

    ;[
      [-14.4, 3.2, 8],
      [-14.4, 3.2, -24],
      [14.4, 3.2, 2],
      [14.4, 3.2, -40],
    ].forEach(([x, y, z]) => {
      const bayLight = new THREE.PointLight('#ffe5a6', 10, 28, 2)
      bayLight.position.set(x, y, z)
      scene.add(bayLight)
    })

    const materials = {
      asphalt: new THREE.MeshStandardMaterial({ color: '#2c3136', roughness: 0.96, metalness: 0.04 }),
      lane: new THREE.MeshStandardMaterial({ color: '#40464d', roughness: 0.93, metalness: 0.05 }),
      concrete: new THREE.MeshStandardMaterial({ color: '#8e949b', roughness: 0.9, metalness: 0.04 }),
      wall: new THREE.MeshStandardMaterial({ color: '#181b1f', roughness: 1 }),
      line: new THREE.MeshStandardMaterial({ color: '#f5c451', emissive: '#916913', emissiveIntensity: 0.32 }),
      route: new THREE.MeshStandardMaterial({ color: '#4da3ff', emissive: '#4da3ff', emissiveIntensity: 1.2 }),
      routeGlow: new THREE.MeshStandardMaterial({ color: '#4da3ff', transparent: true, opacity: 0.18, emissive: '#4da3ff', emissiveIntensity: 0.8 }),
      hood: new THREE.MeshStandardMaterial({ color: '#2b3137', metalness: 0.35, roughness: 0.4 }),
      dash: new THREE.MeshStandardMaterial({ color: '#0f1113', metalness: 0.08, roughness: 0.88 }),
    }

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 160), materials.asphalt)
    floor.rotation.x = -Math.PI / 2
    floor.position.z = -34
    floor.receiveShadow = true
    scene.add(floor)

    const centralLane = new THREE.Mesh(new THREE.PlaneGeometry(12, 160), materials.lane)
    centralLane.rotation.x = -Math.PI / 2
    centralLane.position.set(0, 0.01, -34)
    centralLane.receiveShadow = true
    scene.add(centralLane)

    const leftBay = new THREE.Mesh(new THREE.PlaneGeometry(12, 160), materials.asphalt)
    leftBay.rotation.x = -Math.PI / 2
    leftBay.position.set(-15, 0.02, -34)
    leftBay.receiveShadow = true
    scene.add(leftBay)

    const rightBay = new THREE.Mesh(new THREE.PlaneGeometry(12, 160), materials.asphalt)
    rightBay.rotation.x = -Math.PI / 2
    rightBay.position.set(15, 0.02, -34)
    rightBay.receiveShadow = true
    scene.add(rightBay)

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 160),
      new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: 0.96, side: THREE.DoubleSide }),
    )
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.set(0, 4.85, -34)
    scene.add(ceiling)

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 6, 1), materials.wall)
    backWall.position.set(0, 2.5, -114)
    scene.add(backWall)

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 160), materials.wall)
    leftWall.position.set(-22, 2.5, -34)
    scene.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 160), materials.wall)
    rightWall.position.set(22, 2.5, -34)
    scene.add(rightWall)

    for (let z = 10; z >= -108; z -= 14) {
      const leftColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.88, 4, 18), materials.concrete)
      leftColumn.position.set(-9.5, 2, z)
      leftColumn.castShadow = true
      leftColumn.receiveShadow = true
      scene.add(leftColumn)

      const rightColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.88, 4, 18), materials.concrete)
      rightColumn.position.set(9.5, 2, z)
      rightColumn.castShadow = true
      rightColumn.receiveShadow = true
      scene.add(rightColumn)

      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 0.14, 1.8),
        new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: '#ffe39f', emissiveIntensity: 1.15 }),
      )
      lightPanel.position.set(0, 4.55, z)
      scene.add(lightPanel)
    }

    const parkingLineGeometry = new THREE.BoxGeometry(0.18, 0.03, 4.8)
    for (let z = 12; z >= -104; z -= 12) {
      for (const [x, angle] of [[-14.2, Math.PI / 5], [14.2, -Math.PI / 5]] as const) {
        const line = new THREE.Mesh(parkingLineGeometry, materials.line)
        line.position.set(x, 0.04, z)
        line.rotation.y = angle
        scene.add(line)
      }
    }

    const routeScene = routeSceneMap[routeKey]
    const routeCurve = new THREE.CatmullRomCurve3(routeScene.points.map(([x, z]) => new THREE.Vector3(x, 0.06, z)))

    const routeGlow = new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 150, 0.62, 16, false), materials.routeGlow)
    scene.add(routeGlow)

    const routeTube = new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 150, 0.18, 16, false), materials.route)
    routeTube.castShadow = true
    scene.add(routeTube)

    const arrowGeometry = createArrowGeometry()
    const arrows = Array.from({ length: 7 }, (_, index) => {
      const arrow = new THREE.Mesh(
        arrowGeometry,
        new THREE.MeshBasicMaterial({ color: '#d8ecff', transparent: true, opacity: 0.95, side: THREE.DoubleSide }),
      )
      arrow.position.y = 0.08
      scene.add(arrow)
      arrow.userData.offset = 0.08 + index * 0.1
      return arrow
    })

    const destinationTexture = createDestinationTexture(destination)
    const destinationSign = new THREE.Mesh(
      new THREE.PlaneGeometry(7.4, 3.7),
      new THREE.MeshBasicMaterial({ map: destinationTexture, transparent: true }),
    )
    destinationSign.position.set(routeScene.signPosition[0], routeScene.signPosition[1], routeScene.signPosition[2])
    destinationSign.rotation.y = routeScene.signRotation
    scene.add(destinationSign)

    const destinationPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 12), materials.concrete)
    destinationPole.position.set(15.2, 1.35, -78)
    scene.add(destinationPole)

    const destinationGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.2, 24),
      new THREE.MeshBasicMaterial({ color: '#ea4335', transparent: true, opacity: 0.5 }),
    )
    destinationGlow.position.set(routeScene.glowPosition[0], routeScene.glowPosition[1], routeScene.glowPosition[2])
    scene.add(destinationGlow)

    const destinationLight = new THREE.PointLight('#4da3ff', 22, 34, 2)
    destinationLight.position.set(routeScene.signPosition[0], 3.1, routeScene.signPosition[2] + 2)
    scene.add(destinationLight)

    const hood = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 20), materials.hood)
    hood.scale.set(2.05, 0.14, 1.2)
    hood.position.set(0, -2.35, -5.2)
    hood.rotation.x = -0.08
    camera.add(hood)

    const dashboard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 1.1), materials.dash)
    dashboard.position.set(0, -1.95, -3.6)
    camera.add(dashboard)

    let disposed = false
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/gltf/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    loadParkingModels(loader, scene)

    let startTime = performance.now()
    resetRouteRef.current = () => {
      startTime = performance.now()
    }

    const resize = () => {
      const width = host.clientWidth || 1
      const height = host.clientHeight || 1
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)

    const duration = 16000
    let animationFrame = 0

    const renderFrame = (now: number) => {
      const progress = ((now - startTime) % duration) / duration
      const lookAhead = Math.min(progress + 0.03, 0.995)
      const position = routeCurve.getPointAt(progress)
      const target = routeCurve.getPointAt(lookAhead)
      const bob = Math.sin(now * 0.004) * 0.016

      camera.position.set(position.x, 1.48 + bob, position.z)
      camera.lookAt(target.x, 1.35 + bob * 0.45, target.z)
      hood.position.y = -2.35 + bob * 0.12

      arrows.forEach((arrow) => {
        const offset = arrow.userData.offset as number
        const arrowProgress = (progress + offset) % 1
        const arrowPoint = routeCurve.getPointAt(arrowProgress)
        const tangent = routeCurve.getTangentAt(arrowProgress)
        const lead = (arrowProgress - progress + 1) % 1

        arrow.position.set(arrowPoint.x, 0.08, arrowPoint.z)
        arrow.rotation.set(-Math.PI / 2, Math.atan2(tangent.x, tangent.z), 0)
        arrow.scale.setScalar(0.85 + (1 - lead) * 0.5)
        ;(arrow.material as THREE.MeshBasicMaterial).opacity = 0.14 + (1 - lead) * 0.82
      })

      destinationGlow.material.opacity = 0.34 + (Math.sin(now * 0.006) + 1) * 0.12
      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    animationFrame = window.requestAnimationFrame(renderFrame)

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      destinationTexture.dispose()
      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((material: THREE.Material) => material.dispose())
          else object.material.dispose()
        }
      })
      dracoLoader.dispose()
      renderer.dispose()
      host.replaceChildren()
    }

    async function loadParkingModels(modelLoader: GLTFLoader, currentScene: THREE.Scene) {
      const loadedEntries = await Promise.allSettled(
        (Object.keys(modelCatalog) as ModelKey[]).map(async (key) => {
          const spec = modelCatalog[key]
          const gltf = await modelLoader.loadAsync(spec.url)
          return [key, normalizeVehicleModel(gltf.scene, spec.length, spec.baseRotation)] as const
        }),
      )

      if (disposed) return

      const loadedModels = Object.fromEntries(
        loadedEntries
          .filter((entry): entry is PromiseFulfilledResult<readonly [ModelKey, THREE.Group]> => entry.status === 'fulfilled')
          .map((entry) => entry.value),
      ) as Partial<Record<ModelKey, THREE.Group>>

      parkedCarSlots.forEach((slot, index) => {
        const vehicle = loadedModels[slot.model]?.clone(true) ?? createFallbackCar(index)
        placeVehicleInSlot(vehicle, slot.x, slot.z, slot.rotation)
        currentScene.add(vehicle)
      })
    }
  }, [destination, routeKey])

  return (
    <main className="driver-navigation-page driver-navigation-page--maps">
      <div className="navigation-map-shell">
        <div className="navigation-map navigation-map--maps">
          <div className="maps-toolbar-actions maps-toolbar-actions--floating">
            <button aria-label="Re-center route" onClick={() => resetRouteRef.current()}>
              <LocateFixed size={18} />
            </button>
          </div>

          <div className="driver-three-canvas" ref={canvasHostRef} />
          <div className="driver-windshield-overlay" aria-hidden="true">
            <i className="windshield-pillar windshield-pillar--left" />
            <i className="windshield-pillar windshield-pillar--right" />
            <i className="windshield-top-glare" />
          </div>
          <div className="driver-route-hud">{destination.name} • {destination.spot} • {destination.distance}</div>

          <aside className="route-panel route-panel--maps glass-panel">
            <small>Canlı Yol Tarifi</small>
            <h1>{destination.name}</h1>
            <p>{destination.distance}</p>
            <p>Varış: {destination.eta}</p>
            <p>{destination.floor}, {destination.block}</p>
            <strong>{destination.spot}</strong>
            <Link to="/driver/welcome">Rotayı Kapat</Link>
          </aside>

          <div className="map-legend map-legend--maps glass-panel">
            <span><Navigation size={16} /> Canlı</span>
            <i />
            <span>3D View</span>
          </div>
        </div>
      </div>
    </main>
  )
}

function normalizeVehicleModel(scene: THREE.Group, targetLength: number, baseRotation: number) {
  const wrapper = new THREE.Group()
  const model = scene.clone(true)
  model.rotation.y = baseRotation
  wrapper.add(model)

  const initialBox = new THREE.Box3().setFromObject(wrapper)
  const initialSize = new THREE.Vector3()
  initialBox.getSize(initialSize)
  const scale = targetLength / Math.max(initialSize.x, initialSize.z, 0.001)
  wrapper.scale.setScalar(scale)

  const finalBox = new THREE.Box3().setFromObject(wrapper)
  const center = new THREE.Vector3()
  finalBox.getCenter(center)
  model.position.x -= center.x / scale
  model.position.z -= center.z / scale
  model.position.y -= finalBox.min.y / scale

  wrapper.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return wrapper
}

function placeVehicleInSlot(vehicle: THREE.Group, x: number, z: number, rotation: number) {
  vehicle.position.set(x, 0, z)
  vehicle.rotation.y = rotation
  const bounds = new THREE.Box3().setFromObject(vehicle)
  vehicle.position.y -= bounds.min.y - 0.01
}

function createFallbackCar(index: number) {
  const palette = ['#a8b0ba', '#cd4d43', '#3f7cc9', '#b28c39', '#2f9988', '#8859b7']
  const group = new THREE.Group()
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: palette[index % palette.length], roughness: 0.45, metalness: 0.28 })
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#9db3c8', transparent: true, opacity: 0.6, roughness: 0.18, metalness: 0.18 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 4.6), bodyMaterial)
  body.position.y = 0.42
  body.castShadow = true
  body.receiveShadow = true

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.1), glassMaterial)
  cabin.position.set(0, 0.95, -0.1)
  cabin.castShadow = true

  group.add(body, cabin)
  return group
}

function createArrowGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 1.15)
  shape.lineTo(0.72, 0.2)
  shape.lineTo(0.26, 0.2)
  shape.lineTo(0.26, -1.05)
  shape.lineTo(-0.26, -1.05)
  shape.lineTo(-0.26, 0.2)
  shape.lineTo(-0.72, 0.2)
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

function createDestinationTexture(destination: RouteDestination) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  context.fillStyle = '#101317'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#4da3ff'
  context.lineWidth = 14
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36)

  context.fillStyle = '#95a0ad'
  context.font = '700 42px Inter, sans-serif'
  context.textAlign = 'center'
  context.fillText('HEDEF', canvas.width / 2, 120)

  context.fillStyle = '#ffffff'
  context.font = '700 96px Inter, sans-serif'
  context.fillText(destination.name, canvas.width / 2, 260)

  context.fillStyle = '#f5c451'
  context.font = '700 48px Inter, sans-serif'
  context.fillText(destination.spot, canvas.width / 2, 350)

  context.fillStyle = '#d9e9ff'
  context.font = '700 40px Inter, sans-serif'
  context.fillText(`İleri devam et • ${destination.distance}`, canvas.width / 2, 430)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
