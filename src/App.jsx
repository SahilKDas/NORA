import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bike, Building2,
  Check, CloudRain, Compass, Database, Eye, FileText, Flag, Footprints, HeartPulse,
  Leaf, Menu, MessageCircleMore, Moon, MousePointer2, Navigation, Play, Plus,
  Printer, Radio, RotateCcw, Route, Send, ShieldCheck, Sparkles, Sun,
  ThermometerSun, TrainFront, Trees, Users, Waves, X, Zap,
} from 'lucide-react'

const districts = {
  harbor: {
    id: 'harbor',
    name: 'Harbor Commons',
    code: 'HC-04',
    score: 82,
    color: '#235746',
    label: 'Thriving',
    population: 7420,
    equityPriority: 46,
    dataTrust: 88,
    metrics: {
      heat: '71°',
      mobility: '14 min',
      water: 'Low',
      safety: '91%',
      air: 'Good',
      belonging: '92%',
    },
    alerts: ['Ferry loop running 4 minutes ahead', 'Harbor shade canopy up 12% this month'],
    story: 'Tree cover and the new ferry loop are keeping Harbor Commons cool, social, and connected to jobs.',
    tags: ['cooling', 'mobility', 'waterfront'],
    modifiers: { health: 0, access: 1, climate: 1, safety: 0 },
  },
  market: {
    id: 'market',
    name: 'Market Quarter',
    code: 'MQ-07',
    score: 68,
    color: '#e26d3f',
    label: 'Needs attention',
    population: 9680,
    equityPriority: 78,
    dataTrust: 82,
    metrics: {
      heat: '79°',
      mobility: '22 min',
      water: 'Medium',
      safety: '72%',
      air: 'Fair',
      belonging: '74%',
    },
    alerts: ['Heat complaints doubled after 3 PM', 'East-west transit gap affects late-shift workers'],
    story: 'Market Quarter is lively but exposed: late-afternoon heat and missing transit links make daily trips harder than they should be.',
    tags: ['heat', 'access', 'night work'],
    modifiers: { health: 3, access: 2, climate: 2, safety: 2 },
  },
  north: {
    id: 'north',
    name: 'Northline',
    code: 'NL-02',
    score: 75,
    color: '#547b66',
    label: 'Steady',
    population: 8110,
    equityPriority: 62,
    dataTrust: 86,
    metrics: {
      heat: '74°',
      mobility: '18 min',
      water: 'Low',
      safety: '80%',
      air: 'Good',
      belonging: '83%',
    },
    alerts: ['School corridor has 3 unresolved crossing signals', 'Community gardens are over target'],
    story: 'Northline has strong social infrastructure. The next win is making the school corridor safer and calmer.',
    tags: ['safety', 'food', 'schools'],
    modifiers: { health: 1, access: 1, climate: 0, safety: 3 },
  },
  river: {
    id: 'river',
    name: 'River Ward',
    code: 'RW-11',
    score: 63,
    color: '#dda33e',
    label: 'Watch',
    population: 6890,
    equityPriority: 83,
    dataTrust: 79,
    metrics: {
      heat: '76°',
      mobility: '27 min',
      water: 'High',
      safety: '69%',
      air: 'Good',
      belonging: '69%',
    },
    alerts: ['Stormwater pressure elevated after rain', 'Two drain-clearing crews active'],
    story: 'River Ward is carrying the city’s water risk. Resident-led rain gardens could turn pressure points into public habitats.',
    tags: ['water', 'resilience', 'habitat'],
    modifiers: { health: 1, access: 0, climate: 4, safety: 1 },
  },
}

const interventions = [
  {
    id: 'shade',
    title: 'Shade the school loop',
    kicker: 'HEAT + SAFETY',
    cost: 180,
    icon: Trees,
    color: '#c9ee92',
    impacts: { health: 8, access: 2, climate: 11, safety: 7 },
    districtBoost: {
      market: { health: 4, access: 1, climate: 3, safety: 3 },
      north: { health: 2, access: 0, climate: 1, safety: 4 },
    },
    eligibleDistricts: ['market', 'north', 'harbor'],
    equityBoost: 9,
    confidence: 84,
    details: '42 native canopy trees, cool pavement, and shaded crossings around schools and bus stops.',
  },
  {
    id: 'night',
    title: 'Launch the Night Loop',
    kicker: 'ACCESS + CARE',
    cost: 260,
    icon: Moon,
    color: '#bed5ff',
    impacts: { health: 3, access: 14, climate: 4, safety: 5 },
    districtBoost: {
      market: { health: 1, access: 5, climate: 1, safety: 2 },
      harbor: { health: 0, access: 3, climate: 1, safety: 1 },
    },
    eligibleDistricts: ['market', 'harbor'],
    equityBoost: 13,
    confidence: 78,
    details: 'An on-demand electric shuttle connecting late-shift workers to light rail and childcare.',
  },
  {
    id: 'rain',
    title: 'Sponge the river edge',
    kicker: 'WATER + HABITAT',
    cost: 320,
    icon: CloudRain,
    color: '#a8ded6',
    impacts: { health: 5, access: 1, climate: 16, safety: 3 },
    districtBoost: {
      river: { health: 3, access: 0, climate: 8, safety: 2 },
      harbor: { health: 1, access: 0, climate: 4, safety: 1 },
    },
    eligibleDistricts: ['river', 'harbor'],
    equityBoost: 11,
    confidence: 81,
    details: 'Block-scale rain gardens that absorb runoff while making pocket habitats and cooler sidewalks.',
  },
  {
    id: 'crossing',
    title: 'Calm the school crossings',
    kicker: 'SAFETY + BELONGING',
    cost: 140,
    icon: Route,
    color: '#f5d58b',
    impacts: { health: 4, access: 5, climate: 1, safety: 13 },
    districtBoost: {
      north: { health: 1, access: 1, climate: 0, safety: 5 },
      market: { health: 1, access: 2, climate: 0, safety: 3 },
    },
    eligibleDistricts: ['north', 'market'],
    equityBoost: 7,
    confidence: 87,
    details: 'Raised crosswalks, longer walk phases, curb bulbs, and student-led street safety audits.',
  },
]

const signalTypes = {
  Mobility: { icon: Bike, color: '#dce9ff' },
  Climate: { icon: ThermometerSun, color: '#ffdec7' },
  Water: { icon: Waves, color: '#cfede7' },
  Care: { icon: HeartPulse, color: '#efdff5' },
  Safety: { icon: ShieldCheck, color: '#f4dfb2' },
}

const statusMeta = {
  new: { label: 'New', color: '#e7e8df', icon: Radio },
  triaged: { label: 'Triaged', color: '#dce9ff', icon: Eye },
  pilot: { label: 'Pilot open', color: '#dcf0c2', icon: Flag },
  resolved: { label: 'Resolved', color: '#cfede7', icon: Check },
}

const demoSignal = {
  id: 'demo-market-shade',
  type: 'Climate',
  title: 'Evening commuters need shade',
  place: 'Market Quarter · Cedar & 9th',
  votes: 51,
  status: 'triaged',
  linkedDistrictId: 'market',
}

const demoSteps = [
  {
    title: 'Spot the stress',
    body: 'Switch to the climate layer and focus the Market Quarter heat gap.',
    action: 'Show district risk',
  },
  {
    title: 'Add lived experience',
    body: 'Drop in a resident signal from evening commuters at Cedar & 9th.',
    action: 'Add demo signal',
  },
  {
    title: 'Turn signal into action',
    body: 'Promote the triaged signal into a public pilot with an owner and ETA.',
    action: 'Create civic pilot',
  },
  {
    title: 'Test a response',
    body: 'Bundle shade and night-loop transit inside the $600k public budget.',
    action: 'Build scenario',
  },
  {
    title: 'Share the future',
    body: 'Generate the transparent proposal people can read in under a minute.',
    action: 'Open proposal',
  },
]

const demoFlowLabels = ['Signal', 'Triage', 'Pilot', 'Forecast', 'Proposal']

const API_CLIENT_ID = 'demo-client'

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': API_CLIENT_ID,
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || `Request failed with ${response.status}`)
  }

  return response.json()
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function formatSignalAge(createdAt) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function getSignalType(type) {
  return signalTypes[type] ?? signalTypes.Care
}

function getStatus(status) {
  return statusMeta[status] ?? statusMeta.new
}

function calculateScenario(selectedIds, districtId) {
  const district = districts[districtId]
  const chosen = interventions.filter(item => selectedIds.includes(item.id))
  const totals = { health: 0, access: 0, climate: 0, safety: 0 }
  const spent = chosen.reduce((sum, item) => sum + item.cost, 0)

  chosen.forEach(item => {
    Object.keys(totals).forEach(key => {
      totals[key] += item.impacts[key] ?? 0
      totals[key] += item.districtBoost[districtId]?.[key] ?? 0
      totals[key] += district.modifiers[key] ?? 0
    })
  })

  const equityLift = Math.round(chosen.reduce((sum, item) => sum + item.equityBoost, 0) * (district.equityPriority / 100))
  const confidence = chosen.length
    ? Math.min(96, Math.round((chosen.reduce((sum, item) => sum + item.confidence, 0) / chosen.length + district.dataTrust) / 2))
    : 0
  const pulseGain = Math.round((totals.health + totals.access + totals.climate + totals.safety + equityLift) / 6)
  const projectedPulse = Math.min(99, district.score + pulseGain)
  const neighbors = chosen.length ? Math.round(district.population * (0.22 + selectedIds.length * 0.11)) : 0

  return { chosen, spent, totals, equityLift, confidence, pulseGain, projectedPulse, neighbors }
}

function numberFromMetric(value) {
  return Number(String(value).match(/\d+/)?.[0] ?? 0)
}

function getScenarioComparison(district, forecast) {
  const heat = numberFromMetric(district.metrics.heat)
  const mobility = numberFromMetric(district.metrics.mobility)
  const safety = numberFromMetric(district.metrics.safety)
  const heatAfter = Math.max(60, heat - Math.round((forecast.totals.climate + forecast.totals.health) / 6))
  const mobilityAfter = Math.max(6, mobility - Math.round(forecast.totals.access / 4))
  const safetyAfter = Math.min(99, safety + Math.round(forecast.totals.safety / 3))

  return [
    { label: 'Heat exposure', before: `${heat}°`, after: `${heatAfter}°`, delta: heatAfter < heat ? `${heat - heatAfter}° cooler` : 'baseline' },
    { label: 'Daily-needs access', before: `${mobility} min`, after: `${mobilityAfter} min`, delta: mobilityAfter < mobility ? `${mobility - mobilityAfter} min faster` : 'baseline' },
    { label: 'Street safety', before: `${safety}%`, after: `${safetyAfter}%`, delta: safetyAfter > safety ? `+${safetyAfter - safety}% safer` : 'baseline' },
    { label: 'Equity lift', before: '0', after: `+${forecast.equityLift}`, delta: 'priority weighted' },
    { label: 'People helped', before: '0', after: forecast.neighbors.toLocaleString(), delta: 'estimated reach' },
  ]
}

function Metric({ icon: Icon, value, label, delta, tone }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}><Icon size={17} /></span>
        <span className={`delta ${delta.startsWith('+') ? 'up' : ''}`}>{delta} <ArrowUpRight size={12} /></span>
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function FutureCityScene({ district, pulse, selected, onSelect }) {
  const hostRef = useRef(null)
  const activeInterventions = interventions.filter(item => selected.includes(item.id))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let disposed = false
    let cleanupScene = () => {}

    import('three').then(THREE => {
      if (disposed || !host.isConnected) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setClearColor(0xffffff, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.className = 'future-city-canvas'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(5.8, 4.8, 7.2)
    camera.lookAt(0, 0.45, 0)

    const root = new THREE.Group()
    scene.add(root)

    scene.add(new THREE.AmbientLight(0xf7f5ea, 2.1))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(4, 6, 4)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0xc9ef88, 20, 10)
    rimLight.position.set(-3.4, 2.8, 2.8)
    scene.add(rimLight)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 5.3),
      new THREE.MeshStandardMaterial({ color: 0xe7eadf, transparent: true, opacity: 0.82, roughness: 0.88 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.02
    root.add(floor)

    const grid = new THREE.GridHelper(7.4, 14, 0x9ab0a4, 0xd6ddd0)
    grid.material.transparent = true
    grid.material.opacity = 0.42
    grid.position.y = 0.01
    root.add(grid)

    const districtBlocks = [
      { id: 'north', x: -1.75, z: -1.15, width: 1.55, depth: 1.12 },
      { id: 'market', x: 0.25, z: -1.05, width: 1.7, depth: 1.28 },
      { id: 'harbor', x: -1.05, z: 1.02, width: 1.9, depth: 1.05 },
      { id: 'river', x: 1.55, z: 0.98, width: 1.45, depth: 1.42 },
    ]

    districtBlocks.forEach(block => {
      const item = districts[block.id]
      const isActive = district.id === block.id
      const height = 0.38 + item.score / 86 + (isActive ? 0.28 : 0)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(item.color),
        emissive: new THREE.Color(item.color),
        emissiveIntensity: isActive ? 0.12 : 0.025,
        metalness: 0.05,
        roughness: 0.58,
        transparent: true,
        opacity: isActive ? 0.94 : 0.48,
      })
      const geometry = new THREE.BoxGeometry(block.width, height, block.depth)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(block.x, height / 2, block.z)
      mesh.userData.baseY = mesh.position.y
      mesh.userData.active = isActive
      root.add(mesh)

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: isActive ? 0.5 : 0.24 })
      )
      mesh.add(edges)
    })

    const roadMaterial = new THREE.LineBasicMaterial({ color: 0xf9f8ef, transparent: true, opacity: 0.82 })
    const roadPaths = [
      [new THREE.Vector3(-3.25, 0.05, -0.15), new THREE.Vector3(3.15, 0.05, -0.15)],
      [new THREE.Vector3(-0.45, 0.06, -2.35), new THREE.Vector3(-0.45, 0.06, 2.25)],
      [new THREE.Vector3(-3.1, 0.07, 1.62), new THREE.Vector3(3.05, 0.07, -1.8)],
    ]
    roadPaths.forEach(points => {
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), roadMaterial.clone()))
    })

    const beaconGroup = new THREE.Group()
    const activeBlock = districtBlocks.find(block => block.id === district.id) ?? districtBlocks[1]
    const signalMaterial = new THREE.MeshStandardMaterial({ color: 0xde6a46, emissive: 0xde6a46, emissiveIntensity: 0.55, roughness: 0.35 })
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), signalMaterial)
    beacon.position.set(activeBlock.x + 0.48, 1.85, activeBlock.z - 0.32)
    beaconGroup.add(beacon)
    const beaconStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1.65, 10),
      new THREE.MeshBasicMaterial({ color: 0xde6a46, transparent: true, opacity: 0.45 })
    )
    beaconStem.position.set(beacon.position.x, 0.92, beacon.position.z)
    beaconGroup.add(beaconStem)
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.24, 48),
      new THREE.MeshBasicMaterial({ color: 0xde6a46, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    )
    beaconRing.rotation.x = -Math.PI / 2
    beaconRing.position.set(beacon.position.x, 0.08, beacon.position.z)
    beaconGroup.add(beaconRing)
    root.add(beaconGroup)

    const interventionGroup = new THREE.Group()
    if (selected.includes('shade')) {
      const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0xc9ef88, emissive: 0x6c9447, emissiveIntensity: 0.12, roughness: 0.72 })
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x79563b, roughness: 0.9 })
      Array.from({ length: 7 }).forEach((_, index) => {
        const x = -2.35 + index * 0.34
        const z = 0.18 + Math.sin(index) * 0.15
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.24, 8), trunkMaterial)
        trunk.position.set(x, 0.15, z)
        const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), canopyMaterial)
        canopy.position.set(x, 0.34, z)
        interventionGroup.add(trunk, canopy)
      })
    }

    if (selected.includes('night')) {
      const routeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.9, 0.16, -1.78),
        new THREE.Vector3(-1.4, 0.22, -0.92),
        new THREE.Vector3(0.65, 0.2, -1.38),
        new THREE.Vector3(2.55, 0.18, -0.48),
      ])
      const route = new THREE.Mesh(
        new THREE.TubeGeometry(routeCurve, 72, 0.035, 8, false),
        new THREE.MeshBasicMaterial({ color: 0xbed5ff, transparent: true, opacity: 0.78 })
      )
      route.userData.routeCurve = routeCurve
      interventionGroup.add(route)
      const shuttle = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.1, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbed5ff, emissiveIntensity: 0.35, roughness: 0.42 })
      )
      shuttle.userData.routeCurve = routeCurve
      interventionGroup.add(shuttle)
    }

    if (selected.includes('rain')) {
      const waterCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.25, 0.09, 1.95),
        new THREE.Vector3(-1.15, 0.1, 1.52),
        new THREE.Vector3(0.88, 0.1, 1.84),
        new THREE.Vector3(3.18, 0.1, 0.92),
      ])
      interventionGroup.add(new THREE.Mesh(
        new THREE.TubeGeometry(waterCurve, 72, 0.055, 10, false),
        new THREE.MeshBasicMaterial({ color: 0xa8ded6, transparent: true, opacity: 0.72 })
      ))
    }

    if (selected.includes('crossing')) {
      const crossingMaterial = new THREE.MeshBasicMaterial({ color: 0xf5d58b, transparent: true, opacity: 0.9 })
      Array.from({ length: 5 }).forEach((_, index) => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.48), crossingMaterial)
        stripe.position.set(0.86 + index * 0.13, 0.08, -0.18)
        stripe.rotation.y = 0.45
        interventionGroup.add(stripe)
      })
    }
    root.add(interventionGroup)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      const nextWidth = Math.max(280, Math.floor(width))
      const nextHeight = Math.max(320, Math.floor(height))
      renderer.setSize(nextWidth, nextHeight, false)
      camera.aspect = nextWidth / nextHeight
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let frameId = 0
    const clock = new THREE.Clock()
    const animate = () => {
      const time = clock.getElapsedTime()
      root.rotation.y = Math.sin(time * 0.28) * 0.12
      root.rotation.x = -0.08 + Math.sin(time * 0.2) * 0.025
      beacon.scale.setScalar(1 + Math.sin(time * 3.1) * 0.18)
      beaconRing.scale.setScalar(1.15 + Math.sin(time * 2.4) * 0.28)
      root.traverse(object => {
        if (object.userData.active) object.position.y = object.userData.baseY + Math.sin(time * 1.5) * 0.035
        if (object.userData.routeCurve && object.geometry?.type === 'BoxGeometry') {
          const point = object.userData.routeCurve.getPoint((time * 0.12) % 1)
          object.position.copy(point)
          object.position.y += 0.13
        }
      })
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    if (prefersReducedMotion) {
      renderer.render(scene, camera)
    } else {
      animate()
    }

    cleanupScene = () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
    }).catch(() => {})

    return () => {
      disposed = true
      cleanupScene()
    }
  }, [district.id, pulse, selected])

  return (
    <div className="future-city-scene" ref={hostRef} aria-label={`Animated 3D city model for ${district.name}, projected pulse ${pulse}`}>
      <div className="scene-caption">
        <span><MousePointer2 size={11} /> CLICK DISTRICTS</span>
        <strong>{district.name}</strong>
        <small>Projected pulse {pulse}</small>
      </div>
      <div className="scene-hotspots" aria-label="3D district selector">
        {Object.values(districts).map(item => (
          <button
            key={item.id}
            type="button"
            className={`scene-hotspot ${item.id} ${district.id === item.id ? 'active' : ''}`}
            aria-pressed={district.id === item.id}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      <div className="scene-intervention-labels" aria-label="Visible 3D interventions">
        {activeInterventions.length ? activeInterventions.map(item => (
          <span key={item.id} style={{ '--tag-color': item.color }}>{item.title}</span>
        )) : <span style={{ '--tag-color': '#e7ebdf' }}>Choose interventions in the sandbox</span>}
      </div>
    </div>
  )
}

function DistrictShape({ id, selected, onSelect, d }) {
  const isSelected = selected === id
  const select = () => onSelect(id)
  const keySelect = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select()
    }
  }

  return (
    <path
      className={isSelected ? 'selected' : ''}
      d={d}
      role="button"
      tabIndex="0"
      aria-pressed={isSelected}
      aria-label={`Select ${districts[id].name}`}
      onClick={select}
      onKeyDown={keySelect}
    />
  )
}

function CityMap({ selected, onSelect, layer }) {
  const active = districts[selected]
  return (
    <div className={`city-map layer-${layer}`}>
      <div className="map-grid" />
      <svg viewBox="0 0 760 470" role="img" aria-label="Interactive map of NORA city districts">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="9" stdDeviation="8" floodOpacity=".12" />
          </filter>
          <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#17352d" opacity=".14" />
          </pattern>
        </defs>
        <path className="river-flow" d="M-10 375 C90 319 171 358 257 315 C360 264 416 298 504 246 C599 190 659 209 771 132" />
        <g className="roads">
          <path d="M42 136 L708 136" /><path d="M102 58 L102 421" /><path d="M260 38 L260 415" /><path d="M448 51 L448 386" /><path d="M612 46 L612 334" />
          <path d="M55 255 L686 255" /><path d="M166 65 L684 362" /><path d="M31 333 L700 333" />
        </g>
        <g className="blocks">
          <DistrictShape id="north" selected={selected} onSelect={onSelect} d="M120 71 L243 71 L243 127 L120 127 Z M279 71 L430 71 L430 127 L279 127 Z M466 71 L593 71 L593 127 L466 127 Z" />
          <DistrictShape id="market" selected={selected} onSelect={onSelect} d="M120 154 L235 154 L235 240 L120 240 Z M276 161 L386 219 L356 240 L276 240 Z M473 154 L593 154 L593 222 L542 246 L473 246 Z" />
          <DistrictShape id="harbor" selected={selected} onSelect={onSelect} d="M123 272 L243 272 L243 317 L123 317 Z M280 272 L424 272 L379 318 L280 318 Z M471 272 L566 272 L490 317 L471 317 Z" />
          <DistrictShape id="river" selected={selected} onSelect={onSelect} d="M111 346 L231 346 L231 405 L111 405 Z M275 346 L349 346 L319 399 L275 399 Z M508 317 L597 271 L597 318 L548 346 L697 346 L697 410 L472 410 L472 359 Z" />
        </g>
        <g className="parks"><path d="M623 63 h73 v55 h-73z" /><path d="M377 351 h75 v58 h-107z" /><circle cx="414" cy="196" r="33" /></g>
        <g className="rail"><path d="M74 32 L74 438" /><circle cx="74" cy="110" r="6" /><circle cx="74" cy="243" r="6" /><circle cx="74" cy="370" r="6" /></g>
        <g className="mobility"><path d="M79 244 C176 212 250 216 338 248 C439 284 508 243 618 218" /></g>
        <g className="map-labels">
          <text x="302" y="103">NORTHLINE</text><text x="149" y="203">MARKET</text><text x="475" y="195">QUARTER</text>
          <text x="154" y="301">HARBOR COMMONS</text><text x="528" y="383">RIVER WARD</text>
        </g>
        <g className="activity-dots"><circle cx="179" cy="191" r="7" /><circle cx="510" cy="183" r="7" /><circle cx="198" cy="292" r="7" /><circle cx="561" cy="372" r="7" /></g>
        <g className="selected-marker" transform={selected === 'north' ? 'translate(354 97)' : selected === 'market' ? 'translate(507 191)' : selected === 'harbor' ? 'translate(226 291)' : 'translate(566 373)'}>
          <circle r="21" fill={active.color} /><circle r="6" fill="#fff" /><circle r="30" fill="none" stroke={active.color} opacity=".28" />
        </g>
      </svg>
      <div className="map-legend">
        <span><i className="good" /> Thriving</span>
        <span><i className="watch" /> Watch</span>
        <span><i className="attention" /> Attention</span>
      </div>
    </div>
  )
}

function DistrictPanel({ district }) {
  return (
    <aside className="district-panel">
      <div className="district-head">
        <div>
          <span className="eyebrow">{district.code} · LIVE</span>
          <h3>{district.name}</h3>
        </div>
        <div className="score-ring" style={{ '--score': `${district.score * 3.6}deg`, '--ring': district.color }}>
          <strong>{district.score}</strong>
          <span>pulse</span>
        </div>
      </div>
      <div className="district-state">
        <span style={{ background: district.color }} />
        <strong>{district.label}</strong>
        <span>Updated now</span>
      </div>
      <p>{district.story}</p>
      <div className="micro-grid rich">
        <div><ThermometerSun /><span>Surface</span><strong>{district.metrics.heat}</strong></div>
        <div><Footprints /><span>Daily needs</span><strong>{district.metrics.mobility}</strong></div>
        <div><Waves /><span>Water risk</span><strong>{district.metrics.water}</strong></div>
        <div><ShieldCheck /><span>Street safety</span><strong>{district.metrics.safety}</strong></div>
        <div><Leaf /><span>Air quality</span><strong>{district.metrics.air}</strong></div>
        <div><HeartPulse /><span>Belonging</span><strong>{district.metrics.belonging}</strong></div>
      </div>
      <div className="equity-meter">
        <div><span>Equity priority</span><strong>{district.equityPriority}/100</strong></div>
        <i><span style={{ width: `${district.equityPriority}%` }} /></i>
      </div>
      <div className="district-alerts">
        {district.alerts.map(alert => <p key={alert}><AlertTriangle size={13} /> {alert}</p>)}
      </div>
      <button className="text-button" onClick={() => scrollToSection('signals')}>See related signals <ArrowRight size={15} /></button>
    </aside>
  )
}

function Sparkline({ color = '#235746' }) {
  return (
    <svg className="sparkline" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 27 C12 25 14 13 28 17 S45 27 55 17 S70 6 79 13 S91 18 100 4" fill="none" stroke={color} strokeWidth="3" />
      <path d="M0 27 C12 25 14 13 28 17 S45 27 55 17 S70 6 79 13 S91 18 100 4 L100 34 L0 34 Z" fill={color} opacity=".08" />
    </svg>
  )
}

function CityOperationsSnapshot({ backendStatus, signals, pilots, activityEvents, onRestore }) {
  const activePilots = pilots.filter(pilot => pilot.status !== 'resolved').length
  const latestEvent = activityEvents[0]
  const statusLabel = backendStatus === 'ready' ? 'Online' : backendStatus === 'loading' ? 'Starting' : 'Offline'
  const statusDetail = backendStatus === 'ready' ? 'Express API + SQLite state' : backendStatus === 'loading' ? 'Connecting to local API' : 'Check backend process'
  const cards = [
    { icon: Database, label: 'API status', value: statusLabel, detail: statusDetail },
    { icon: Radio, label: 'Signals', value: signals.length, detail: 'stored in SQL' },
    { icon: Flag, label: 'Active pilots', value: activePilots, detail: `${pilots.length} total public responses` },
    { icon: FileText, label: 'Civic actions', value: activityEvents.length, detail: latestEvent ? latestEvent.title : 'waiting for activity' },
  ]

  return (
    <section className="ops-snapshot" id="operations">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">CITY OPERATIONS SNAPSHOT</span>
          <h2>Live civic state,<br /><em>backed by SQL.</em></h2>
        </div>
        <button className="ghost restore-button" onClick={onRestore}><RotateCcw /> Restore sample city</button>
      </div>
      <div className="ops-grid">
        {cards.map(item => {
          const Icon = item.icon
          return (
            <article className="ops-card" key={item.label}>
              <Icon />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          )
        })}
      </div>
      <div className="ops-events" aria-label="Recent civic actions">
        {activityEvents.slice(0, 4).map(event => (
          <span key={event.id}><i />{event.type}: {event.title}</span>
        ))}
        {!activityEvents.length && <span><i />No civic actions yet. Add a signal to start the trail.</span>}
      </div>
    </section>
  )
}

function Simulator({ selected, setSelected, districtId, onShare }) {
  const budget = 600
  const district = districts[districtId]
  const forecast = calculateScenario(selected, districtId)
  const comparison = getScenarioComparison(district, forecast)
  const toggle = id => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])

  return (
    <section className="simulator" id="simulator">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CITY SANDBOX · 2035</span>
          <h2>Try tomorrow<br /><em>before we build it.</em></h2>
        </div>
        <p>Bundle neighborhood ideas, see district-specific impact, and keep the public budget honest.</p>
      </div>
      <div className="sim-context">
        <span><Compass size={14} /> Planning for <strong>{district.name}</strong></span>
        <span><ShieldCheck size={14} /> Equity priority <strong>{district.equityPriority}/100</strong></span>
        <span><Eye size={14} /> Data confidence <strong>{district.dataTrust}%</strong></span>
      </div>
      <div className="before-after-panel" aria-label="Before and after impact estimates">
        {comparison.map(item => (
          <article key={item.label}>
            <span>{item.label}</span>
            <div><strong>{item.before}</strong><ArrowRight /><strong>{item.after}</strong></div>
            <small>{item.delta}</small>
          </article>
        ))}
      </div>
      <div className="sim-layout">
        <div className="interventions">
          {interventions.map((item, index) => {
            const Icon = item.icon
            const active = selected.includes(item.id)
            const blocked = !active && forecast.spent + item.cost > budget
            const overBy = forecast.spent + item.cost - budget
            const districtFit = item.eligibleDistricts.includes(districtId)
            return (
              <button
                key={item.id}
                disabled={blocked}
                aria-pressed={active}
                aria-describedby={blocked ? `${item.id}-reason` : undefined}
                onClick={() => toggle(item.id)}
                className={`intervention ${active ? 'chosen' : ''}`}
              >
                <span className="number">0{index + 1}</span>
                <span className="intervention-icon" style={{ background: item.color }}><Icon /></span>
                <span className="intervention-copy">
                  <small>{item.kicker}</small>
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                  <em className={districtFit ? 'fit-pill good-fit' : 'fit-pill'}>
                    {districtFit ? `High fit for ${district.name}` : `Lower fit for ${district.name}`}
                  </em>
                  {blocked && <em id={`${item.id}-reason`} className="blocked-reason">Over budget by ${overBy}k</em>}
                </span>
                <span className="cost">${item.cost}k</span>
                <span className="select-mark">{active ? <Check /> : <Plus />}</span>
              </button>
            )
          })}
        </div>
        <div className="impact-card">
          <div className="impact-head">
            <div><span className="eyebrow">YOUR SCENARIO</span><h3>Public value forecast</h3></div>
            <Sparkles />
          </div>
          <div className="budget-line"><span>Budget used</span><strong>${forecast.spent}k <small>/ ${budget}k</small></strong></div>
          <div className="budget-track"><span style={{ width: `${Math.min(100, forecast.spent / budget * 100)}%` }} /></div>
          <div className="impact-score">
            <div><span>Projected {district.name} pulse</span><strong>{forecast.projectedPulse}</strong><small>/ 100</small></div>
            <span className="forecast-badge"><ArrowUpRight /> +{forecast.pulseGain} pts</span>
          </div>
          <div className="impact-bars">
            {[
              ['Health', forecast.totals.health, '#d46643'],
              ['Access', forecast.totals.access, '#416a9c'],
              ['Climate', forecast.totals.climate, '#235746'],
              ['Safety', forecast.totals.safety, '#a46b22'],
            ].map(([label, value, color]) => (
              <div key={label}>
                <span>{label}</span>
                <div><i style={{ width: `${Math.min(100, 14 + value * 3)}%`, background: color }} /></div>
                <strong>+{value}</strong>
              </div>
            ))}
          </div>
          <div className="confidence-grid">
            <div><span>Equity lift</span><strong>+{forecast.equityLift}</strong></div>
            <div><span>Confidence</span><strong>{forecast.confidence || '-'}%</strong></div>
          </div>
          <div className="benefit">
            <Users />
            <div><strong>{forecast.neighbors.toLocaleString()} neighbors</strong><span>gain a healthier daily route</span></div>
          </div>
          <button className="primary wide" disabled={!selected.length} onClick={() => onShare(forecast)}>
            Generate proposal summary <FileText />
          </button>
          <p className="model-note"><ShieldCheck /> Demo forecast uses transparent estimates, equity weighting, and confidence ranges.</p>
        </div>
      </div>
    </section>
  )
}

function StatusPill({ status }) {
  const meta = getStatus(status)
  const Icon = meta.icon
  return <span className="status-pill" style={{ background: meta.color }}><Icon size={12} /> {meta.label}</span>
}

function SignalCard({ signal, voted, onVote, onTriage, onPromote }) {
  const meta = getSignalType(signal.type)
  const Icon = meta.icon
  const district = districts[signal.linkedDistrictId]
  const canPilot = signal.status === 'triaged' || signal.votes >= 40
  const isClosed = signal.status === 'pilot' || signal.status === 'resolved'

  return (
    <article className="signal-card">
      <div className="signal-top">
        <span className="signal-icon" style={{ background: meta.color }}><Icon /></span>
        <StatusPill status={signal.status} />
      </div>
      <span className="eyebrow">{signal.type} · {formatSignalAge(signal.createdAt)}</span>
      <h3>{signal.title}</h3>
      <p><Navigation /> {signal.place}</p>
      <p><Building2 /> {district?.name ?? 'Citywide'}</p>
      <div className="signal-bottom">
        <div className="mini-faces"><i /><i /><i /></div>
        <button className={voted ? 'voted' : ''} aria-pressed={voted} onClick={() => onVote(signal.id)}>
          <ArrowUpRight /> {signal.votes}
        </button>
      </div>
      <div className="signal-actions">
        {!isClosed && (
          <button className="mini-action" onClick={() => canPilot ? onPromote(signal.id) : onTriage(signal.id)}>
            {canPilot ? 'Create pilot' : 'Send to triage'}
          </button>
        )}
        {signal.status === 'pilot' && <span className="mini-note">Public pilot is active</span>}
        {signal.status === 'resolved' && <span className="mini-note">Closed loop complete</span>}
      </div>
    </article>
  )
}

function PilotBoard({ pilots, signals }) {
  const enriched = pilots.map(pilot => ({
    ...pilot,
    signal: signals.find(signal => signal.id === pilot.signalId),
  }))

  return (
    <section className="pilot-board" id="pilots">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">PUBLIC PILOTS</span>
          <h2>From signal<br /><em>to street experiment.</em></h2>
        </div>
        <p>Each pilot keeps a resident signal connected to an owner, an ETA, and a visible response.</p>
      </div>
      <div className="pilot-grid">
        {enriched.length ? enriched.map(pilot => {
          const signal = pilot.signal
          const district = signal ? districts[signal.linkedDistrictId] : null
          return (
            <article className="pilot-card" key={pilot.id}>
              <div className="pilot-status"><Flag size={15} /> {pilot.status === 'resolved' ? 'Resolved pilot' : 'Active pilot'}</div>
              <h3>{signal?.title ?? 'Neighborhood pilot'}</h3>
              <p>{signal?.place ?? 'Citywide'} {district ? `· ${district.name}` : ''}</p>
              <div className="pilot-meta">
                <span><Users /> {pilot.owner}</span>
                <span><Zap /> ETA: {pilot.eta}</span>
              </div>
              <div className="pilot-stack">
                {pilot.selectedInterventions.map(id => {
                  const intervention = interventions.find(item => item.id === id)
                  return intervention ? <span key={id}>{intervention.title}</span> : null
                })}
              </div>
            </article>
          )
        }) : (
          <article className="pilot-card empty">
            <Radio />
            <h3>No pilots yet</h3>
            <p>Promote a triaged signal and NORA will create the first public experiment.</p>
          </article>
        )}
      </div>
    </section>
  )
}

function ActivityTrail({ events }) {
  return (
    <section className="audit-trail" id="audit">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">SQL CIVIC AUDIT TRAIL</span>
          <h2>Every click becomes<br /><em>public evidence.</em></h2>
        </div>
        <p>Follow the backend as it records signals, votes, pilots, and proposal generation as a transparent civic ledger.</p>
      </div>
      <div className="audit-list">
        {events.length ? events.slice(0, 8).map(event => (
          <article className="audit-event" key={event.id}>
            <span>{event.type}</span>
            <strong>{event.title}</strong>
            <small>{formatSignalAge(event.createdAt)} · {event.entityId || 'system'}</small>
          </article>
        )) : (
          <article className="audit-event empty">
            <span>waiting</span>
            <strong>No audit events yet</strong>
            <small>Create a signal or run the guided demo.</small>
          </article>
        )}
      </div>
    </section>
  )
}

function DemoGuide({ active, step, onStart, onRun, onExit }) {
  if (!active) {
    return null
  }

  const current = demoSteps[step]
  const progress = ((step + 1) / demoSteps.length) * 100
  return (
    <aside className="demo-guide" aria-live="polite">
      <div className="demo-progress"><span style={{ width: `${progress}%` }} /></div>
      <div>
        <span className="eyebrow">GUIDED DEMO · STEP {step + 1}/{demoSteps.length}</span>
        <h3>{current.title}</h3>
        <p>{current.body}</p>
      </div>
      <ol className="demo-flow" aria-label="Guided demo flow">
        {demoFlowLabels.map((label, index) => (
          <li className={index < step ? 'done' : index === step ? 'active' : ''} key={label}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div className="demo-actions">
        <button className="primary" onClick={onRun}>{current.action} <ArrowRight /></button>
        <button className="ghost" onClick={onExit}>Exit</button>
      </div>
    </aside>
  )
}

function SignalModal({ onClose, onSubmit, defaultDistrict }) {
  const [type, setType] = useState('Mobility')
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [linkedDistrictId, setLinkedDistrictId] = useState(defaultDistrict)

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = event => {
    event.preventDefault()
    if (title.trim() && place.trim()) {
      onSubmit({ type, title: title.trim(), place: place.trim(), linkedDistrictId })
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="signal-modal-title" onSubmit={submit}>
        <div className="modal-head">
          <div><span className="eyebrow">NEIGHBOR SIGNAL</span><h3 id="signal-modal-title">What are you noticing?</h3></div>
          <button type="button" onClick={onClose} aria-label="Close signal form"><X /></button>
        </div>
        <p>Your signal is public, location-aware, and visible to the neighborhood response team.</p>
        <label id="signal-type-label">Signal type</label>
        <div className="type-row" role="group" aria-labelledby="signal-type-label">
          {Object.keys(signalTypes).map(item => (
            <button type="button" aria-pressed={type === item} className={type === item ? 'active' : ''} onClick={() => setType(item)} key={item}>{item}</button>
          ))}
        </div>
        <label htmlFor="signal-title">What is happening?</label>
        <input id="signal-title" autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Crossing signal is too short" />
        <label htmlFor="signal-place">Where?</label>
        <div className="input-icon"><Navigation /><input id="signal-place" value={place} onChange={event => setPlace(event.target.value)} placeholder="Street, landmark, or district" /></div>
        <label htmlFor="signal-district">Linked district</label>
        <select id="signal-district" value={linkedDistrictId} onChange={event => setLinkedDistrictId(event.target.value)}>
          {Object.values(districts).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button className="primary wide" type="submit">Send neighborhood signal <Send /></button>
      </form>
    </div>
  )
}

function ProposalModal({ forecast, districtId, selected, onClose, pilots }) {
  const district = districts[districtId]
  const chosen = interventions.filter(item => selected.includes(item.id))
  const activePilots = pilots.filter(pilot => pilot.status !== 'resolved').length
  const printProposal = () => window.print()

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop proposal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal proposal-modal" role="dialog" aria-modal="true" aria-labelledby="proposal-title">
        <div className="modal-head">
          <div><span className="eyebrow">PROPOSAL SUMMARY</span><h3 id="proposal-title">{district.name} Cooling + Access Sprint</h3></div>
          <button type="button" onClick={onClose} aria-label="Close proposal summary"><X /></button>
        </div>
        <p className="proposal-lede">A presentation-ready pitch card generated from live signals, SQL-backed civic actions, and the selected funding scenario.</p>
        <div className="proposal-grid">
          <div><span>Budget</span><strong>${forecast.spent}k / $600k</strong></div>
          <div><span>Pulse change</span><strong>+{forecast.pulseGain} pts</strong></div>
          <div><span>Neighbors reached</span><strong>{forecast.neighbors.toLocaleString()}</strong></div>
          <div><span>Confidence</span><strong>{forecast.confidence}%</strong></div>
        </div>
        <div className="proposal-callout">
          <Sparkles />
          <div>
            <span>Why this matters</span>
            <strong>{district.name} gets a practical, fundable pilot that improves daily routes before the city commits to permanent infrastructure.</strong>
          </div>
        </div>
        <div className="proposal-section">
          <h4>Selected interventions</h4>
          {chosen.map(item => <p key={item.id}><Check size={14} /> {item.title} - ${item.cost}k</p>)}
        </div>
        <div className="proposal-section">
          <h4>What changes</h4>
          <p><HeartPulse size={14} /> Health +{forecast.totals.health}, Access +{forecast.totals.access}, Climate +{forecast.totals.climate}, Safety +{forecast.totals.safety}</p>
          <p><ShieldCheck size={14} /> Equity lift +{forecast.equityLift}; priority neighborhoods are weighted before popularity.</p>
          <p><Flag size={14} /> {activePilots} active public pilot{activePilots === 1 ? '' : 's'} connected to resident signals.</p>
        </div>
        <div className="proposal-actions">
          <button className="primary" onClick={printProposal}>Print / save PDF <Printer /></button>
          <button className="ghost" onClick={onClose}>Close proposal <ArrowRight /></button>
        </div>
      </section>
    </div>
  )
}

function ProjectNoticeModal({ onClose }) {
  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="notice-backdrop">
      <section className="notice-modal" role="dialog" aria-modal="true" aria-labelledby="project-notice-title">
        <button className="notice-close" type="button" onClick={onClose} aria-label="Close project notice">
          <X />
        </button>
        <h2 id="project-notice-title">Built for FutureHacks 2026.</h2>
        <p>
          This project is just a demo for the fourth week of June's <b>FutureHacks 2026</b> hackathon hosted by the <i>TechShare</i> project.
        </p>
        <p>
          Visit <a href="https://futurehacks.techshareproject.org" target="_blank" rel="noreferrer">futurehacks.techshareproject.org</a> for the event, and see the source code for <a href="https://github.com/placeholder/nora-city-os" target="_blank" rel="noreferrer">this project</a>.
        </p>
      </section>
    </div>
  )
}

function App() {
  const [district, setDistrict] = useState('market')
  const [layer, setLayer] = useState('pulse')
  const [scenario, setScenario] = useState(['shade'])
  const [signals, setSignals] = useState([])
  const [pilots, setPilots] = useState([])
  const [votedSignals, setVotedSignals] = useState({})
  const [activityEvents, setActivityEvents] = useState([])
  const [backendStatus, setBackendStatus] = useState('loading')
  const [signalModal, setSignalModal] = useState(false)
  const [proposal, setProposal] = useState(null)
  const [noticeOpen, setNoticeOpen] = useState(true)
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [demoActive, setDemoActive] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const date = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), [])

  const applyServerState = payload => {
    setSignals(payload.signals ?? [])
    setPilots(payload.pilots ?? [])
    setVotedSignals(payload.votedSignals ?? {})
    setActivityEvents(payload.activityEvents ?? [])
  }

  const showToast = message => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    let active = true

    apiRequest('/api/state')
      .then(payload => {
        if (!active) return
        applyServerState(payload)
        setBackendStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setBackendStatus('error')
        showToast('SQL backend is offline')
      })

    return () => {
      active = false
    }
  }, [])

  const addSignal = async ({ type, title, place, linkedDistrictId }) => {
    try {
      const payload = await apiRequest('/api/signals', {
        method: 'POST',
        body: JSON.stringify({
          type,
          title,
          place,
          linkedDistrictId,
          status: 'new',
          votes: 1,
          createdAt: new Date().toISOString(),
        }),
      })
      applyServerState(payload)
      setBackendStatus('ready')
      setSignalModal(false)
      showToast('Signal saved to SQL')
    } catch {
      setBackendStatus('error')
      showToast('Could not save signal to backend')
    }
  }

  const triageSignal = async id => {
    try {
      const payload = await apiRequest(`/api/signals/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'triaged' }),
      })
      applyServerState(payload)
      setBackendStatus('ready')
      showToast('Signal sent to triage')
    } catch {
      setBackendStatus('error')
      showToast('Could not update signal status')
    }
  }

  const voteSignal = async id => {
    try {
      const alreadyVoted = Boolean(votedSignals[id])
      const payload = await apiRequest(`/api/signals/${encodeURIComponent(id)}/vote`, { method: 'POST' })
      applyServerState(payload)
      setBackendStatus('ready')
      if (!alreadyVoted) showToast('Vote saved to SQL')
    } catch {
      setBackendStatus('error')
      showToast('Could not save vote')
    }
  }

  const promoteSignal = async (id, fallbackSignal = null) => {
    const signal = signals.find(item => item.id === id) ?? fallbackSignal
    if (!signal) {
      showToast('Signal missing')
      return
    }

    try {
      if (fallbackSignal && !signals.some(item => item.id === id)) {
        await apiRequest('/api/signals', {
          method: 'POST',
          body: JSON.stringify({
            ...fallbackSignal,
            createdAt: new Date().toISOString(),
          }),
        })
      }

      const payload = await apiRequest(`/api/signals/${encodeURIComponent(id)}/pilot`, {
        method: 'POST',
        body: JSON.stringify({
          owner: `${districts[signal.linkedDistrictId]?.name ?? 'City'} response team`,
          eta: '14 days',
          status: 'pilot',
          selectedInterventions: scenario.length ? scenario : ['shade'],
        }),
      })
      applyServerState(payload)
      setBackendStatus('ready')
      showToast('Pilot created in SQL')
    } catch {
      setBackendStatus('error')
      showToast('Could not create pilot')
    }
  }

  const ensureDemoSignal = async () => {
    if (signals.some(signal => signal.id === demoSignal.id)) return

    try {
      const payload = await apiRequest('/api/signals', {
        method: 'POST',
        body: JSON.stringify({
          ...demoSignal,
          createdAt: new Date().toISOString(),
        }),
      })
      applyServerState(payload)
      setBackendStatus('ready')
    } catch {
      setBackendStatus('error')
      showToast('Could not add demo signal')
    }
  }

  const runDemoStep = async () => {
    if (demoStep === 0) {
      setDistrict('market')
      setLayer('climate')
      scrollToSection('city-map')
      showToast('Climate layer focused on Market Quarter')
    }
    if (demoStep === 1) {
      await ensureDemoSignal()
      scrollToSection('signals')
      showToast('Demo signal saved to SQL')
    }
    if (demoStep === 2) {
      await promoteSignal(demoSignal.id, demoSignal)
      scrollToSection('pilots')
    }
    if (demoStep === 3) {
      setDistrict('market')
      setScenario(['shade', 'night'])
      scrollToSection('simulator')
      showToast('Scenario bundled within budget')
    }
    if (demoStep === 4) {
      const forecast = calculateScenario(['shade', 'night'], 'market')
      setDistrict('market')
      setScenario(['shade', 'night'])
      await openProposal(forecast)
    }
    setDemoStep(current => Math.min(current + 1, demoSteps.length - 1))
  }

  const startDemo = () => {
    setDemoActive(true)
    setDemoStep(0)
    showToast('3-minute demo ready')
  }

  const restoreSampleCity = async () => {
    try {
      const payload = await apiRequest('/api/demo/reset', { method: 'POST' })
      applyServerState(payload)
      setDistrict('market')
      setLayer('pulse')
      setScenario(['shade'])
      setDemoActive(false)
      setDemoStep(0)
      setProposal(null)
      setBackendStatus('ready')
      showToast('Sample city restored from SQL')
    } catch {
      setBackendStatus('error')
      showToast('Could not restore sample city')
    }
  }

  const openProposal = async forecast => {
    setProposal(forecast)
    showToast('Proposal summary generated')
    try {
      const payload = await apiRequest('/api/activity', {
        method: 'POST',
        body: JSON.stringify({
          type: 'proposal',
          title: `${districts[district]?.name ?? 'District'} proposal generated`,
          entityId: district,
        }),
      })
      applyServerState(payload)
      setBackendStatus('ready')
    } catch {
      setBackendStatus('error')
    }
  }

  const activeDistrict = districts[district]
  const liveScenario = calculateScenario(scenario, district)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="NORA home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>NORA<small>Neighborhood Operating & Resilience Atlas</small></span>
        </a>
        <nav className={mobileNav ? 'open' : ''} aria-label="Primary navigation">
          <a href="#top" className="active" onClick={() => setMobileNav(false)}>City pulse</a>
          <a href="#operations" onClick={() => setMobileNav(false)}>Operations</a>
          <a href="#simulator" onClick={() => setMobileNav(false)}>Sandbox</a>
          <a href="#signals" onClick={() => setMobileNav(false)}>Signals</a>
          <a href="#pilots" onClick={() => setMobileNav(false)}>Pilots</a>
          <a href="#audit" onClick={() => setMobileNav(false)}>Audit trail</a>
          <a href="#story" onClick={() => setMobileNav(false)}>How it works</a>
        </nav>
        <div className="top-actions">
          <span className={`live ${backendStatus}`}><i /> {backendStatus === 'ready' ? 'SQL live' : backendStatus === 'loading' ? 'SQL loading' : 'SQL offline'}</span>
          <button className="avatar" aria-label="Signed in as SK">SK</button>
          <button className="menu" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X /> : <Menu />}</button>
        </div>
      </header>

      <DemoGuide
        active={demoActive}
        step={demoStep}
        onStart={startDemo}
        onRun={runDemoStep}
        onExit={() => setDemoActive(false)}
      />

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="dayline"><Sun size={16} /><span>{date}</span><i /><span>Clear · 73°F</span></div>
            <h1>A city that<br />listens <em>back.</em></h1>
            <p>NORA turns real neighborhood signals into shared decisions, so tomorrow's city is designed with the people who live there.</p>
            <div className="hero-actions">
              <button className="primary" onClick={() => scrollToSection('city-map')}>Explore the living map <ArrowDownRight /></button>
              <button className="ghost" onClick={() => setSignalModal(true)}><Radio /> Add a signal</button>
              <button className="ghost demo-hero-button" onClick={startDemo}><Play /> Run guided demo</button>
            </div>
            <div className="trust-row">
              <div className="faces"><span>AR</span><span>JM</span><span>+2k</span></div>
              <p><strong>2,481 neighbors</strong><br />shaping this week's priorities</p>
            </div>
          </div>
          <div className="hero-visual">
            <FutureCityScene district={activeDistrict} pulse={liveScenario.projectedPulse} selected={scenario} onSelect={setDistrict} />
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="city-core"><Building2 /><strong>{liveScenario.projectedPulse}</strong><span>CITY PULSE</span></div>
            <div className="floating-card card-one"><span><TrainFront /></span><div><small>TRANSIT REACH</small><strong>86%</strong></div><Sparkline color="#345e92" /></div>
            <div className="floating-card card-two"><span><Trees /></span><div><small>COOL ROUTES</small><strong>+12</strong></div><span className="good-pill">This month</span></div>
            <div className="floating-card card-three"><span><MessageCircleMore /></span><div><small>ACTIVE PILOTS</small><strong>{pilots.filter(pilot => pilot.status !== 'resolved').length} public response{pilots.filter(pilot => pilot.status !== 'resolved').length === 1 ? '' : 's'}</strong><p>Market Quarter · live</p></div></div>
            <svg className="hero-city" viewBox="0 0 560 560" aria-hidden="true"><path d="M75 365 L129 327 L178 345 L221 291 L270 316 L319 235 L365 270 L412 205 L487 262 L487 437 L75 437 Z" fill="#dce4d2" /><path d="M105 364v73m54-92v92m66-141v141m50-119v119m48-195v195m44-160v160m47-224v224" /><path d="M75 437h412" /></svg>
          </div>
        </section>

        <CityOperationsSnapshot
          backendStatus={backendStatus}
          signals={signals}
          pilots={pilots}
          activityEvents={activityEvents}
          onRestore={restoreSampleCity}
        />

        <section className="metrics-wrap">
          <div className="metrics-intro"><span className="eyebrow">OUR SHARED BASELINE</span><p>One pulse, built from sensors, services,<br />and lived experience.</p></div>
          <Metric icon={HeartPulse} value="78" label="Everyday wellbeing" delta="+4.2%" tone="coral" />
          <Metric icon={Footprints} value="17 min" label="Daily-needs access" delta="+2.1%" tone="blue" />
          <Metric icon={Leaf} value="64%" label="Nature within reach" delta="+7.8%" tone="green" />
          <Metric icon={Users} value="8.4k" label="Active neighbors" delta="+12%" tone="yellow" />
        </section>

        <section className="map-section" id="city-map">
          <div className="section-heading compact">
            <div><span className="eyebrow">THE LIVING MAP</span><h2>See what the<br />city is <em>feeling.</em></h2></div>
            <div className="layer-switch" aria-label="Map layer">
              <span>VIEW</span>
              {['pulse', 'mobility', 'climate'].map(item => <button aria-pressed={layer === item} className={layer === item ? 'active' : ''} key={item} onClick={() => setLayer(item)}>{item}</button>)}
            </div>
          </div>
          <div className="map-layout"><CityMap selected={district} onSelect={setDistrict} layer={layer} /><DistrictPanel district={activeDistrict} /></div>
        </section>

        <Simulator selected={scenario} setSelected={setScenario} districtId={district} onShare={openProposal} />

        <section className="signals" id="signals">
          <div className="section-heading compact">
            <div><span className="eyebrow">NEIGHBORHOOD SIGNALS</span><h2>Small observations.<br /><em>City-sized insight.</em></h2></div>
            <button className="primary" onClick={() => setSignalModal(true)}><Plus /> Add a signal</button>
          </div>
          <div className="signal-grid">
            {signals.slice(0, 5).map(signal => (
              <SignalCard
                key={signal.id}
                signal={signal}
                voted={Boolean(votedSignals[signal.id])}
                onVote={voteSignal}
                onTriage={triageSignal}
                onPromote={promoteSignal}
              />
            ))}
            <button className="signal-card prompt-card" onClick={() => setSignalModal(true)}>
              <span><Eye /></span>
              <h3>What do you see?</h3>
              <p>Your block is a sensor, too.</p>
              <i><ArrowRight /></i>
            </button>
          </div>
        </section>

        <PilotBoard pilots={pilots} signals={signals} />

        <ActivityTrail events={activityEvents} />

        <section className="story" id="story">
          <div><span className="eyebrow">A DIFFERENT KIND OF SMART CITY</span><h2>Technology in the background.<br /><em>People in the foreground.</em></h2></div>
          <div className="principles">
            <article><span>01</span><ShieldCheck /><h3>Open by default</h3><p>Every forecast explains its data, confidence, and tradeoffs in human language.</p></article>
            <article><span>02</span><Users /><h3>Weighted for fairness</h3><p>Neighborhoods with the largest need, not the loudest voice, rise first.</p></article>
            <article><span>03</span><Zap /><h3>Built to act</h3><p>Signals become small, trackable public experiments instead of sitting in a report.</p></article>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>NORA</span></a>
        <p>Made for the city we're becoming.</p>
        <div><a href="#city-map">Living map</a><a href="#simulator">Sandbox</a><a href="#pilots">Pilots</a><span>Data updated 2m ago</span></div>
      </footer>
      {noticeOpen && <ProjectNoticeModal onClose={() => setNoticeOpen(false)} />}
      {signalModal && <SignalModal defaultDistrict={district} onClose={() => setSignalModal(false)} onSubmit={addSignal} />}
      {proposal && <ProposalModal forecast={proposal} districtId={district} selected={scenario} pilots={pilots} onClose={() => setProposal(null)} />}
      {toast && <div className="toast" role="status"><Check />{toast}</div>}
    </div>
  )
}

export default App
