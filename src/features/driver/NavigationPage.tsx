import { LocateFixed, Navigation } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const routeMap = {
  starbucks: { name: 'Starbucks', floor: 'Kat -2', block: 'Blok A', spot: 'Nokta 11', accessPoint: 'Asansör A11', accessHint: 'Starbucks yönü', distance: '120 m', eta: '2 dk' },
  adidas: { name: 'Adidas', floor: 'Kat 1', block: 'Blok A', spot: 'Nokta 10', accessPoint: 'Asansör B10', accessHint: 'Adidas yönü', distance: '260 m', eta: '4 dk' },
  atasun: { name: 'Atasun Optik', floor: 'Kat 0', block: 'Blok A', spot: 'Nokta 11', accessPoint: 'Asansör A07', accessHint: 'Atasun Optik yönü', distance: '180 m', eta: '3 dk' },
} as const

const routeSceneMap = {
  starbucks: {
    forwardPoints: [[0, 18], [0, 2], [0, -16], [0, -32], [0, -50]] as const,
    reversePoints: [[0, -50], [0, -46.6], [3.6, -43.4], [9.2, -42], [14.8, -42]] as const,
    glowPosition: [14.8, 0.14, -42] as const,
    elevatorPosition: [21.25, 0, -42] as const,
    elevatorRotation: -Math.PI / 2,
  },
  adidas: {
    forwardPoints: [[0, 18], [0, 2], [0, -14], [0, -32], [0, -50]] as const,
    reversePoints: [[0, -50], [0, -46.6], [-3.6, -43.4], [-9.2, -42], [-14.8, -42]] as const,
    glowPosition: [-14.8, 0.14, -42] as const,
    elevatorPosition: [-21.25, 0, -42] as const,
    elevatorRotation: Math.PI / 2,
  },
  atasun: {
    forwardPoints: [[0, 18], [0, 8], [0, -2], [0, -10], [0, -26]] as const,
    reversePoints: [[0, -26], [0, -22.8], [3.6, -19.4], [9.2, -18], [14.8, -18]] as const,
    glowPosition: [14.8, 0.14, -18] as const,
    elevatorPosition: [21.25, 0, -18] as const,
    elevatorRotation: -Math.PI / 2,
  },
} as const

const modelCatalog = {
  focus: { url: '/models/babylon-car.glb', length: 4.55, baseRotation: 0, tintable: true, label: 'Focus-style hatchback' },
  classic: { url: '/models/ToyCar.glb', length: 4.65, baseRotation: 0, tintable: true, label: 'Classic sedan' },
  ferrari: { url: '/models/ferrari.glb', length: 4.85, baseRotation: Math.PI, tintable: false, label: 'Ferrari' },
} as const

const parkingSlotCenters = [14, 6, -2, -10, -18, -26, -34, -42, -50, -58, -66, -74, -82, -90, -98] as const
const carPaintPalette = ['#d7dde4', '#8f9aa5', '#20262d', '#2e5f89', '#7a2430', '#274d3b', '#caa24a', '#5f6670'] as const
const parkingTiming = { forwardEnd: 0.62, pauseEnd: 0.74, reverseEnd: 0.98 } as const

type RouteKey = keyof typeof routeMap
type RouteDestination = (typeof routeMap)[RouteKey]
type ModelKey = keyof typeof modelCatalog
type RoutePoint = readonly [number, number]
type ParkingSide = -1 | 1
type GuideChevron = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>

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
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(pixelRatio)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    host.replaceChildren(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1b1f24')
    scene.fog = new THREE.Fog('#1b1f24', 24, 132)

    const camera = new THREE.PerspectiveCamera(74, 1, 0.1, 240)
    scene.add(camera)

    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(pixelRatio)
    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.52, 0.36, 1)
    const outputPass = new OutputPass()
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    composer.addPass(outputPass)

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
      route: new THREE.MeshStandardMaterial({ color: '#4da3ff', transparent: true, opacity: 0.85, emissive: '#4da3ff', emissiveIntensity: 0.55 }),
      routeGlow: new THREE.MeshStandardMaterial({ color: '#4da3ff', transparent: true, opacity: 0.12, emissive: '#4da3ff', emissiveIntensity: 0.25 }),
      reverseRoute: new THREE.MeshStandardMaterial({ color: '#ffbd4a', transparent: true, opacity: 0, emissive: '#ff9f1c', emissiveIntensity: 0.8 }),
      reverseGlow: new THREE.MeshStandardMaterial({ color: '#ffbd4a', transparent: true, opacity: 0, emissive: '#ff9f1c', emissiveIntensity: 0.32 }),
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

    const stallBoundaryGeometry = new THREE.BoxGeometry(11.6, 0.03, 0.12)
    for (let z = 18; z >= -106; z -= 8) {
      for (const x of [-14.8, 14.8] as const) {
        const line = new THREE.Mesh(stallBoundaryGeometry, materials.line)
        line.position.set(x, 0.04, z)
        scene.add(line)
      }
    }

    const aisleEdgeGeometry = new THREE.BoxGeometry(0.14, 0.035, 128)
    for (const x of [-8.7, 8.7] as const) {
      const edgeLine = new THREE.Mesh(aisleEdgeGeometry, materials.line)
      edgeLine.position.set(x, 0.045, -44)
      scene.add(edgeLine)
    }

    const routeScene = routeSceneMap[routeKey]
    const targetSlot = getTargetSlot(routeScene.reversePoints)
    const forwardCurve = createRouteCurve(routeScene.forwardPoints)
    const reverseCurve = createRouteCurve(routeScene.reversePoints)

    const routeGlow = new THREE.Mesh(new THREE.TubeGeometry(forwardCurve, 110, 0.62, 16, false), materials.routeGlow)
    scene.add(routeGlow)

    const routeTube = new THREE.Mesh(new THREE.TubeGeometry(forwardCurve, 110, 0.18, 16, false), materials.route)
    routeTube.castShadow = true
    scene.add(routeTube)

    const reverseGlow = new THREE.Mesh(new THREE.TubeGeometry(reverseCurve, 90, 0.78, 16, false), materials.reverseGlow)
    scene.add(reverseGlow)

    const reverseTube = new THREE.Mesh(new THREE.TubeGeometry(reverseCurve, 90, 0.2, 16, false), materials.reverseRoute)
    reverseTube.castShadow = true
    scene.add(reverseTube)

    const reverseStartMarker = createReverseStartMarker()
    reverseStartMarker.position.set(routeScene.reversePoints[0][0], 0.12, routeScene.reversePoints[0][1])
    scene.add(reverseStartMarker)

    const guideArrowGeometry = createGuideArrowGeometry()
    const forwardChevrons = createGuideChevrons(scene, guideArrowGeometry, '#8ddcff', 4)
    const reverseChevrons = createGuideChevrons(scene, guideArrowGeometry, '#ffbd4a', 4)

    const parkedMotion = getParkingMotion(1, forwardCurve, reverseCurve)
    const parkedHeading = parkedMotion.target.clone().sub(parkedMotion.position).setY(0).normalize()
    const signPosition = parkedMotion.position.clone().add(parkedHeading.clone().multiplyScalar(8.6))
    signPosition.y = 3.05
    const signRotationY = Math.atan2(-parkedHeading.x, -parkedHeading.z)

    const destinationTexture = createDestinationTexture(destination)
    const destinationSign = new THREE.Mesh(
      new THREE.PlaneGeometry(7.4, 3.7),
      new THREE.MeshBasicMaterial({ map: destinationTexture, transparent: true, side: THREE.DoubleSide, toneMapped: false }),
    )
    destinationSign.position.copy(signPosition)
    destinationSign.rotation.y = signRotationY
    scene.add(destinationSign)

    const elevatorBay = createElevatorBay(destination)
    elevatorBay.position.set(routeScene.elevatorPosition[0], routeScene.elevatorPosition[1], routeScene.elevatorPosition[2])
    elevatorBay.rotation.y = routeScene.elevatorRotation
    scene.add(elevatorBay)

    const highlightColor = new THREE.Color('#56d8ff')
    const destinationGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 7.2),
      new THREE.MeshBasicMaterial({ color: highlightColor.clone().multiplyScalar(2.2), transparent: true, opacity: 0.34, side: THREE.DoubleSide, toneMapped: false }),
    )
    destinationGlow.rotation.x = -Math.PI / 2
    destinationGlow.position.set(routeScene.glowPosition[0], routeScene.glowPosition[1], routeScene.glowPosition[2])
    scene.add(destinationGlow)

    const highlightRing = createTargetBayOutline(highlightColor)
    highlightRing.position.set(routeScene.glowPosition[0], 0.23, routeScene.glowPosition[2])
    scene.add(highlightRing)

    const highlightBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.7, 3.4, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: highlightColor.clone().multiplyScalar(1.8), transparent: true, opacity: 0.16, side: THREE.DoubleSide, toneMapped: false }),
    )
    highlightBeam.position.set(routeScene.glowPosition[0], 1.75, routeScene.glowPosition[2])
    scene.add(highlightBeam)

    const destinationLight = new THREE.PointLight('#56d8ff', 28, 38, 2)
    destinationLight.position.set(routeScene.glowPosition[0], 2.8, routeScene.glowPosition[2])
    scene.add(destinationLight)

    const hood = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 20), materials.hood)
    hood.scale.set(2.2, 0.1, 1.1)
    hood.position.set(0, -2.28, -5.15)
    hood.rotation.x = -0.08
    camera.add(hood)

    let disposed = false
    const modelTemplates: THREE.Group[] = []
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/gltf/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    loadParkingModels(loader, scene, targetSlot)

    let startTime = performance.now()
    resetRouteRef.current = () => {
      startTime = performance.now()
    }

    const resize = () => {
      const width = host.clientWidth || 1
      const height = host.clientHeight || 1
      renderer.setSize(width, height)
      composer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)

    const duration = 26000
    let animationFrame = 0

    const renderFrame = (now: number) => {
      const elapsed = now - startTime
      const progress = (((elapsed % duration) + duration) % duration) / duration
      const motion = getParkingMotion(progress, forwardCurve, reverseCurve)
      const bob = Math.sin(now * 0.004) * 0.016

      camera.position.set(motion.position.x, 1.48 + bob, motion.position.z)
      camera.lookAt(motion.target.x, 1.35 + bob * 0.45, motion.target.z)
      hood.position.y = -2.28 + bob * 0.1

      updateRouteVisibility(progress, routeTube, routeGlow, reverseTube, reverseGlow)
      updateParkingGuides(progress, motion.position, motion.target, forwardChevrons, reverseChevrons)
      updateReverseStartMarker(reverseStartMarker, progress, now)

      destinationGlow.material.opacity = 0.12 + (Math.sin(now * 0.006) + 1) * 0.08
      const bayPulse = 1 + (Math.sin(now * 0.003) + 1) * 0.015
      highlightRing.scale.set(bayPulse, 1, bayPulse)
      highlightBeam.material.opacity = 0.055 + (Math.sin(now * 0.004) + 1) * 0.035
      composer.render()
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    animationFrame = window.requestAnimationFrame(renderFrame)

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      destinationTexture.dispose()
      modelTemplates.forEach(disposeObject3D)
      scene.traverse((object: THREE.Object3D) => {
        if (object.userData.texture instanceof THREE.Texture) object.userData.texture.dispose()
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
          objectMaterials.forEach((material: THREE.Material) => {
            if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
            material.dispose()
          })
        }
      })
      dracoLoader.dispose()
      bloomPass.dispose()
      outputPass.dispose()
      composer.dispose()
      renderer.dispose()
      host.replaceChildren()
    }

    async function loadParkingModels(modelLoader: GLTFLoader, currentScene: THREE.Scene, emptySlot: { side: ParkingSide; z: number }) {
      const loadedEntries = await Promise.allSettled(
        (Object.keys(modelCatalog) as ModelKey[]).map(async (key) => {
          const spec = modelCatalog[key]
          const gltf = await modelLoader.loadAsync(spec.url)
          return [key, normalizeVehicleModel(gltf.scene, spec.length, spec.baseRotation)] as const
        }),
      )

      const loadedModels = Object.fromEntries(
        loadedEntries
          .filter((entry): entry is PromiseFulfilledResult<readonly [ModelKey, THREE.Group]> => entry.status === 'fulfilled')
          .map((entry) => entry.value),
      ) as Partial<Record<ModelKey, THREE.Group>>

      if (disposed) {
        Object.values(loadedModels).forEach(disposeObject3D)
        return
      }

      modelTemplates.push(...Object.values(loadedModels))
      let slotIndex = 0
      parkingSlotCenters.forEach((z) => {
        ;([-1, 1] as const).forEach((side) => {
          if (side === emptySlot.side && Math.abs(z - emptySlot.z) < 0.1) return

          const modelKey = chooseParkingModel(slotIndex)
          const template = loadedModels[modelKey] ?? loadedModels.focus ?? loadedModels.classic ?? loadedModels.ferrari
          if (!template) return

          const spec = modelCatalog[modelKey]
          const vehicle = cloneVehicleModel(template, spec.tintable ? carPaintPalette[slotIndex % carPaintPalette.length] : undefined)
          const facesAisle = (slotIndex + (side === 1 ? 0 : 1)) % 4 !== 0
          vehicle.position.set(side * 14.8, 0, z)
          vehicle.rotation.y = getParkedVehicleRotation(side, facesAisle)
          currentScene.add(vehicle)
          slotIndex += 1
        })
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
          <div className="driver-route-hud">{destination.accessPoint} • {destination.accessHint} • {destination.distance}</div>

          <aside className="route-panel route-panel--maps glass-panel">
            <small>{destination.name} için canlı yol tarifi</small>
            <h1>{destination.accessPoint}</h1>
            <p>{destination.distance}</p>
            <p>Varış: {destination.eta}</p>
            <p>{destination.floor}, {destination.block}</p>
            <strong>{destination.accessHint}</strong>
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

function createRouteCurve(points: readonly RoutePoint[]) {
  return new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.06, z)), false, 'catmullrom', 0.45)
}

function getParkingMotion(progress: number, forwardCurve: THREE.CatmullRomCurve3, reverseCurve: THREE.CatmullRomCurve3) {
  const { forwardEnd, pauseEnd, reverseEnd } = parkingTiming
  let position: THREE.Vector3
  let heading: THREE.Vector3

  if (progress < forwardEnd) {
    const forwardProgress = easeInOut(progress / forwardEnd)
    position = forwardCurve.getPointAt(forwardProgress)
    heading = forwardCurve.getTangentAt(Math.min(forwardProgress + 0.002, 1))
  } else if (progress < pauseEnd) {
    const pauseProgress = easeInOut((progress - forwardEnd) / (pauseEnd - forwardEnd))
    position = forwardCurve.getPointAt(1)
    heading = forwardCurve.getTangentAt(1).lerp(reverseCurve.getTangentAt(0).multiplyScalar(-1), pauseProgress)
  } else {
    const reverseProgress = progress < reverseEnd ? easeInOut((progress - pauseEnd) / (reverseEnd - pauseEnd)) : 1
    position = reverseCurve.getPointAt(reverseProgress)
    heading = reverseCurve.getTangentAt(reverseProgress).multiplyScalar(-1)
  }

  heading.y = 0
  if (heading.lengthSq() < 0.0001) heading.set(0, 0, -1)
  heading.normalize()

  return {
    position,
    target: position.clone().add(heading.multiplyScalar(8)),
  }
}

function easeInOut(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function createElevatorBay(destination: RouteDestination) {
  const group = new THREE.Group()
  const accent = new THREE.Color('#56d8ff')
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#14191e', roughness: 0.88, metalness: 0.08 })
  const doorMaterial = new THREE.MeshStandardMaterial({ color: '#313941', roughness: 0.36, metalness: 0.62 })
  const darkGlassMaterial = new THREE.MeshStandardMaterial({ color: '#0e171e', roughness: 0.28, metalness: 0.45 })
  const glowMaterial = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(3.2), toneMapped: false })
  const labelMaterial = new THREE.MeshBasicMaterial({ color: '#f7fbff', toneMapped: false })

  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.4, 0.22), wallMaterial)
  backPanel.position.set(0, 2.2, 0)
  backPanel.receiveShadow = true

  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.05, 0.08), doorMaterial)
  leftDoor.position.set(-0.66, 1.55, 0.16)
  const rightDoor = leftDoor.clone()
  rightDoor.position.x = 0.66

  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.045, 3.1, 0.1), glowMaterial)
  seam.position.set(0, 1.55, 0.24)

  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.13), glowMaterial)
  topFrame.position.set(0, 3.16, 0.25)
  const bottomFrame = topFrame.clone()
  bottomFrame.position.y = 0.02
  const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.25, 0.13), glowMaterial)
  leftFrame.position.set(-1.64, 1.58, 0.25)
  const rightFrame = leftFrame.clone()
  rightFrame.position.x = 1.64

  const callPanel = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.2, 0.1), darkGlassMaterial)
  callPanel.position.set(2.05, 1.75, 0.26)
  const callButton = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.035, 24), glowMaterial)
  callButton.rotation.x = Math.PI / 2
  callButton.position.set(2.05, 1.93, 0.35)

  const headerTexture = createElevatorHeaderTexture(destination)
  const header = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.92),
    new THREE.MeshBasicMaterial({ map: headerTexture, transparent: true, toneMapped: false }),
  )
  header.position.set(0, 3.83, 0.33)
  header.userData.texture = headerTexture

  const icon = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.08), labelMaterial)
  icon.position.set(-2.05, 3.84, 0.34)

  group.add(backPanel, leftDoor, rightDoor, seam, topFrame, bottomFrame, leftFrame, rightFrame, callPanel, callButton, header, icon)
  return group
}

function getTargetSlot(reversePoints: readonly RoutePoint[]) {
  const [x, z] = reversePoints[reversePoints.length - 1]
  return { side: (x > 0 ? 1 : -1) as ParkingSide, z }
}

function chooseParkingModel(index: number): ModelKey {
  if (index % 13 === 4 || index % 17 === 9) return 'ferrari'
  if (index % 3 === 1) return 'classic'
  return 'focus'
}

function normalizeVehicleModel(scene: THREE.Group, targetLength: number, baseRotation: number) {
  const wrapper = new THREE.Group()
  const model = scene.clone(true)
  removeDisplayStand(model)
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

function removeDisplayStand(model: THREE.Object3D) {
  const objectsToRemove: THREE.Object3D[] = []
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const materialNames = (Array.isArray(child.material) ? child.material : [child.material]).map((material) => material.name.toLowerCase())
    if (child.name.toLowerCase().includes('fabric') || materialNames.some((name) => name.includes('fabric'))) {
      objectsToRemove.push(child)
    }
  })

  objectsToRemove.forEach((object) => object.parent?.remove(object))
}

function cloneVehicleModel(template: THREE.Group, paintColor?: string) {
  const clone = template.clone(true)
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material]
    const clonedMaterials = sourceMaterials.map((material) => {
      const clonedMaterial = material.clone()
      if (paintColor && isPaintMaterial(clonedMaterial)) clonedMaterial.color.set(paintColor)
      return clonedMaterial
    })

    child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0]
    child.castShadow = true
    child.receiveShadow = true
  })

  return clone
}

function isPaintMaterial(material: THREE.Material): material is THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  const name = material.name.toLowerCase()
  return 'color' in material && !/glass|window|wheel|tire|tyre|rim|chrome|light|fabric|interior|plastic/.test(name)
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => material.dispose())
    }
  })
}

function getParkedVehicleRotation(side: ParkingSide, facesAisle: boolean) {
  if (side === 1) return facesAisle ? -Math.PI / 2 : Math.PI / 2
  return facesAisle ? Math.PI / 2 : -Math.PI / 2
}

function createTargetBayOutline(color: THREE.Color) {
  const group = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(3), transparent: true, opacity: 0.9, toneMapped: false })
  const longLineGeometry = new THREE.BoxGeometry(8.2, 0.08, 0.1)
  const sideLineGeometry = new THREE.BoxGeometry(0.12, 0.08, 7.2)

  const front = new THREE.Mesh(longLineGeometry, material)
  front.position.z = 3.6
  const rear = front.clone()
  rear.position.z = -3.6
  const left = new THREE.Mesh(sideLineGeometry, material)
  left.position.x = -4.1
  const right = left.clone()
  right.position.x = 4.1

  group.add(front, rear, left, right)
  return group
}

function createGuideArrowGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -1.28)
  shape.lineTo(0.78, -0.18)
  shape.lineTo(0.34, -0.18)
  shape.lineTo(0.34, 1.05)
  shape.lineTo(-0.34, 1.05)
  shape.lineTo(-0.34, -0.18)
  shape.lineTo(-0.78, -0.18)
  shape.closePath()

  const geometry = new THREE.ShapeGeometry(shape)
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

function createGuideChevrons(scene: THREE.Scene, geometry: THREE.BufferGeometry, color: string, count: number) {
  return Array.from({ length: count }, () => {
    const chevron = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
    ) as GuideChevron
    chevron.position.y = 0.34
    chevron.scale.setScalar(0.82)
    scene.add(chevron)
    return chevron
  })
}

function updateRouteVisibility(
  progress: number,
  routeTube: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>,
  routeGlow: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>,
  reverseTube: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>,
  reverseGlow: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>,
) {
  const { forwardEnd, pauseEnd, reverseEnd } = parkingTiming
  const forwardOpacity = progress < forwardEnd
    ? 1
    : progress < pauseEnd
      ? 1 - THREE.MathUtils.smoothstep(progress, forwardEnd, pauseEnd)
      : 0
  const reverseOpacity = progress < forwardEnd - 0.1
    ? 0
    : progress < forwardEnd
      ? THREE.MathUtils.smoothstep(progress, forwardEnd - 0.1, forwardEnd) * 0.35
      : progress < reverseEnd
        ? 1
        : 1 - THREE.MathUtils.smoothstep(progress, reverseEnd, 1)

  routeTube.material.opacity = 0.85 * forwardOpacity
  routeGlow.material.opacity = 0.12 * forwardOpacity
  reverseTube.material.opacity = 0.85 * reverseOpacity
  reverseGlow.material.opacity = 0.16 * reverseOpacity
}

function updateParkingGuides(
  progress: number,
  carPosition: THREE.Vector3,
  carTarget: THREE.Vector3,
  forwardChevrons: GuideChevron[],
  reverseChevrons: GuideChevron[],
) {
  const { forwardEnd, pauseEnd, reverseEnd } = parkingTiming

  if (progress < forwardEnd) {
    const heading = carTarget.clone().sub(carPosition).setY(0)
    if (heading.lengthSq() > 0.0001) heading.normalize()
    else heading.set(0, 0, -1)
    const phaseFade = 1 - THREE.MathUtils.smoothstep(progress, forwardEnd - 0.06, forwardEnd)
    updateForwardGuideChevrons(forwardChevrons, carPosition, heading, 0.86 * phaseFade)
    hideGuideChevrons(reverseChevrons)
    return
  }

  if (progress < pauseEnd) {
    hideGuideChevrons(forwardChevrons)
    hideGuideChevrons(reverseChevrons)
    return
  }

  if (progress < reverseEnd) {
    const heading = carTarget.clone().sub(carPosition).setY(0)
    if (heading.lengthSq() > 0.0001) heading.normalize()
    else heading.set(0, 0, -1)
    hideGuideChevrons(forwardChevrons)
    updateForwardGuideChevrons(reverseChevrons, carPosition, heading, 0.82)
    return
  }

  hideGuideChevrons(forwardChevrons)
  hideGuideChevrons(reverseChevrons)
}

function updateForwardGuideChevrons(chevrons: GuideChevron[], carPosition: THREE.Vector3, heading: THREE.Vector3, baseOpacity: number) {
  const distances = [8, 13, 18, 23]
  const yaw = Math.atan2(heading.x, heading.z)

  chevrons.forEach((chevron, index) => {
    const distance = distances[index] ?? distances[distances.length - 1]
    const point = carPosition.clone().add(heading.clone().multiplyScalar(distance))
    const sequenceFade = 1 - index * 0.13

    chevron.position.set(point.x, 0.34, point.z)
    chevron.rotation.set(0, yaw, 0)
    chevron.scale.setScalar(0.82 + index * 0.04)
    chevron.material.opacity = baseOpacity * sequenceFade
  })
}

function hideGuideChevrons(chevrons: GuideChevron[]) {
  chevrons.forEach((chevron) => {
    chevron.material.opacity = 0
  })
}

function createReverseStartMarker() {
  const group = new THREE.Group()
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#ffbd4a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  const labelTexture = createReverseMarkerTexture()
  const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.92, 40), ringMaterial)
  ring.rotation.x = -Math.PI / 2

  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.68), labelMaterial)
  label.rotation.x = -Math.PI / 2
  label.position.set(0, 0.01, 1.35)

  group.add(ring, label)
  return group
}

function updateReverseStartMarker(marker: THREE.Group, progress: number, now: number) {
  const { forwardEnd, pauseEnd } = parkingTiming
  let opacity = 0

  if (progress < forwardEnd) {
    opacity = THREE.MathUtils.smoothstep(progress, forwardEnd - 0.06, forwardEnd) * 0.75
  } else if (progress < pauseEnd) {
    opacity = 0.72 + (Math.sin(now * 0.008) + 1) * 0.1
  } else if (progress < pauseEnd + 0.06) {
    opacity = (1 - THREE.MathUtils.smoothstep(progress, pauseEnd, pauseEnd + 0.06)) * 0.72
  }

  marker.scale.setScalar(1 + (Math.sin(now * 0.006) + 1) * 0.035)
  setObjectOpacity(marker, opacity)
}

function setObjectOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      material.transparent = true
      material.opacity = opacity
    })
  })
}

function createReverseMarkerTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(12, 15, 18, 0.72)'
  context.roundRect(18, 18, canvas.width - 36, canvas.height - 36, 18)
  context.fill()
  context.strokeStyle = '#ffbd4a'
  context.lineWidth = 8
  context.stroke()
  context.fillStyle = '#ffefc6'
  context.textAlign = 'center'
  context.font = '800 46px Inter, sans-serif'
  context.fillText('R', canvas.width / 2, 66)
  context.font = '800 18px Inter, sans-serif'
  context.fillText('GERİ', canvas.width / 2, 96)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createDestinationTexture(destination: RouteDestination) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  context.fillStyle = '#101317'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#56d8ff'
  context.lineWidth = 14
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36)

  context.fillStyle = '#95a0ad'
  context.font = '700 40px Inter, sans-serif'
  context.textAlign = 'center'
  context.fillText('HEDEF ASANSÖR', canvas.width / 2, 104)

  context.fillStyle = '#ffffff'
  context.font = '800 90px Inter, sans-serif'
  context.fillText(destination.accessPoint, canvas.width / 2, 240)

  context.fillStyle = '#f5c451'
  context.font = '700 48px Inter, sans-serif'
  context.fillText(destination.accessHint, canvas.width / 2, 334)

  context.fillStyle = '#d9e9ff'
  context.font = '700 36px Inter, sans-serif'
  context.fillText(`${destination.name} için • ${destination.distance}`, canvas.width / 2, 424)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createElevatorHeaderTexture(destination: RouteDestination) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 160
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  context.fillStyle = '#0d1115'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#56d8ff'
  context.lineWidth = 8
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)
  context.textAlign = 'center'
  context.fillStyle = '#9feeff'
  context.font = '800 30px Inter, sans-serif'
  context.fillText('ASANSÖR', canvas.width / 2, 58)
  context.fillStyle = '#ffffff'
  context.font = '800 44px Inter, sans-serif'
  context.fillText(destination.accessPoint, canvas.width / 2, 116)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
