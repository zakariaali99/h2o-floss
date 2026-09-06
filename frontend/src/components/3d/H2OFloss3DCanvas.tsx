import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface H2OFloss3DCanvasProps {
  psi: number
  modeIndex: number
  isSpraying: boolean
  autoRotate?: boolean
  zoomLevel?: number // External zoom offset (-3 to +3)
  cameraPreset?: 'all' | 'nozzle' | 'buttons' | 'tank'
  isDark?: boolean
}

export function H2OFloss3DCanvas({
  psi,
  modeIndex,
  isSpraying,
  autoRotate = true,
  zoomLevel = 0,
  cameraPreset = 'all',
  isDark = true,
}: H2OFloss3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const previousTouchRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.05, y: 0.15 })
  const targetRotationRef = useRef({ x: 0.05, y: 0.15 })
  const baseZoomRef = useRef(8.2)
  const targetZoomRef = useRef(8.2)
  const targetYRef = useRef(-0.3)

  // Camera presets and external zoom control
  useEffect(() => {
    let presetBaseZoom = 8.2
    let presetY = -0.3

    if (cameraPreset === 'nozzle') {
      presetBaseZoom = 5.6
      presetY = -1.15
      targetRotationRef.current = { x: 0.1, y: 0.25 }
    } else if (cameraPreset === 'buttons') {
      presetBaseZoom = 5.8
      presetY = -0.3
      targetRotationRef.current = { x: 0.0, y: 0.0 }
    } else if (cameraPreset === 'tank') {
      presetBaseZoom = 6.2
      presetY = 0.65
      targetRotationRef.current = { x: 0.05, y: 0.4 }
    } else {
      presetBaseZoom = 8.2
      presetY = -0.3
      targetRotationRef.current = { x: 0.05, y: 0.15 }
    }

    baseZoomRef.current = presetBaseZoom
    targetYRef.current = presetY
    targetZoomRef.current = Math.max(4.0, Math.min(12.0, presetBaseZoom - zoomLevel))
  }, [cameraPreset, zoomLevel])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // 1. SCENE & CAMERA (THEME AWARE)
    const scene = new THREE.Scene()
    const bgColor = isDark ? 0x020617 : 0xf8fafc
    const gridColor1 = isDark ? 0x06b6d4 : 0x0284c7
    const gridColor2 = isDark ? 0x0f172a : 0xe2e8f0

    scene.background = new THREE.Color(bgColor)
    scene.fog = new THREE.FogExp2(bgColor, 0.025)

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.2, targetZoomRef.current)
    camera.lookAt(0, 0, 0)

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 3. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(4, 7, 6)
    keyLight.castShadow = true
    scene.add(keyLight)

    const cyanFillLight = new THREE.DirectionalLight(0x38bdf8, 1.6)
    cyanFillLight.position.set(-5, 4, 4)
    scene.add(cyanFillLight)

    const backRim = new THREE.DirectionalLight(0x06b6d4, 3.5)
    backRim.position.set(0, 2, -5)
    scene.add(backRim)

    // Studio Grid Floor
    const gridHelper = new THREE.GridHelper(24, 24, gridColor1, gridColor2)
    gridHelper.position.y = -3.2
    scene.add(gridHelper)

    // 4. SEAMLESS UNIFIED 3D H2O FLOSS DEVICE
    const deviceGroup = new THREE.Group()
    deviceGroup.scale.set(0.85, 0.85, 0.85)
    deviceGroup.position.y = targetYRef.current
    scene.add(deviceGroup)

    // --- A. Ergonomic Matte White Body ---
    const bodyPoints = [
      new THREE.Vector3(0.38, 1.9, 0),
      new THREE.Vector3(0.48, 1.6, 0),
      new THREE.Vector3(0.56, 1.1, 0),
      new THREE.Vector3(0.50, 0.4, 0),
      new THREE.Vector3(0.55, -0.2, 0),
      new THREE.Vector3(0.64, -0.75, 0),
    ]
    const bodyCurve = new THREE.CatmullRomCurve3(bodyPoints)
    const lathePoints = bodyCurve.getPoints(36).map((p) => new THREE.Vector2(p.x, p.y))
    const bodyGeo = new THREE.LatheGeometry(lathePoints, 48)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05,
    })
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
    bodyMesh.castShadow = true
    deviceGroup.add(bodyMesh)

    // Top Cap
    const topCapGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 48)
    const topCap = new THREE.Mesh(topCapGeo, bodyMat)
    topCap.position.y = 1.9
    deviceGroup.add(topCap)

    // --- B. Chrome Collar & Purple LED Ring ---
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.30, 0.2, 36)
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
    })
    const collarMesh = new THREE.Mesh(collarGeo, chromeMat)
    collarMesh.position.y = 2.05
    deviceGroup.add(collarMesh)

    const purpleRingGeo = new THREE.TorusGeometry(0.22, 0.03, 16, 32)
    const purpleRingMat = new THREE.MeshBasicMaterial({ color: 0xc084fc })
    const purpleRing = new THREE.Mesh(purpleRingGeo, purpleRingMat)
    purpleRing.rotation.x = Math.PI / 2
    purpleRing.position.y = 2.15
    deviceGroup.add(purpleRing)

    // --- C. Transparent 45° Curved Nozzle ---
    const nozzlePoints = [
      new THREE.Vector3(0, 2.15, 0),
      new THREE.Vector3(0, 2.9, 0),
      new THREE.Vector3(0, 3.2, 0.08),
      new THREE.Vector3(0, 3.45, 0.35),
    ]
    const nozzleCurve = new THREE.CatmullRomCurve3(nozzlePoints)
    const nozzleGeo = new THREE.TubeGeometry(nozzleCurve, 32, 0.042, 16, false)
    const nozzleMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f9ff,
      transmission: 0.95,
      transparent: true,
      roughness: 0.06,
      ior: 1.48,
    })
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat)
    deviceGroup.add(nozzleMesh)

    const tipOrigin = new THREE.Vector3(0, 3.45, 0.35)

    // --- D. Front Control Panel ---
    const panelGroup = new THREE.Group()
    panelGroup.position.set(0, 0.45, 0.52)

    const panelBezelGeo = new THREE.CapsuleGeometry(0.18, 0.85, 16, 24)
    panelBezelGeo.scale(1, 1, 0.25)
    const panelBezel = new THREE.Mesh(panelBezelGeo, chromeMat)
    panelGroup.add(panelBezel)

    // Buttons
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 })
    const pwrBtnGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 24)
    const pwrBtn = new THREE.Mesh(pwrBtnGeo, btnMat)
    pwrBtn.rotation.x = Math.PI / 2
    pwrBtn.position.set(0, 0.32, 0.05)
    panelGroup.add(pwrBtn)

    const modeBtn = new THREE.Mesh(pwrBtnGeo, btnMat)
    modeBtn.rotation.x = Math.PI / 2
    modeBtn.position.set(0, 0.08, 0.05)
    panelGroup.add(modeBtn)

    // 5 Mode LEDs
    for (let i = 0; i < 5; i++) {
      const ledGeo = new THREE.SphereGeometry(0.02, 16, 16)
      const isActive = i === modeIndex
      const ledMat = new THREE.MeshBasicMaterial({
        color: isActive ? 0x00f0ff : 0x334155,
      })
      const ledMesh = new THREE.Mesh(ledGeo, ledMat)
      ledMesh.position.set(0, -0.12 - i * 0.07, 0.05)
      panelGroup.add(ledMesh)
    }

    deviceGroup.add(panelGroup)

    // --- E. Translucent 300ml Water Tank ---
    const tankPoints = [
      new THREE.Vector3(0.64, -0.75, 0),
      new THREE.Vector3(0.72, -1.3, 0),
      new THREE.Vector3(0.70, -2.1, 0),
      new THREE.Vector3(0.60, -2.6, 0),
      new THREE.Vector3(0.0, -2.65, 0),
    ]
    const tankCurve = new THREE.CatmullRomCurve3(tankPoints)
    const tankLathePoints = tankCurve.getPoints(32).map((p) => new THREE.Vector2(p.x, p.y))
    const tankGeo = new THREE.LatheGeometry(tankLathePoints, 48)
    const tankMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.333,
    })
    const tankMesh = new THREE.Mesh(tankGeo, tankMat)
    tankMesh.castShadow = true
    deviceGroup.add(tankMesh)

    // Internal Water
    const waterGeo = new THREE.CylinderGeometry(0.62, 0.65, 1.5, 36)
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
    })
    const waterMesh = new THREE.Mesh(waterGeo, waterMat)
    waterMesh.position.y = -1.7
    deviceGroup.add(waterMesh)

    // Gravity Tube & Ball
    const siphonPoints = [
      new THREE.Vector3(0, -0.75, 0),
      new THREE.Vector3(0.1, -1.5, 0.08),
      new THREE.Vector3(0.18, -2.3, 0.12),
    ]
    const siphonCurve = new THREE.CatmullRomCurve3(siphonPoints)
    const siphonGeo = new THREE.TubeGeometry(siphonCurve, 20, 0.028, 12, false)
    const siphonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.4 })
    const siphonMesh = new THREE.Mesh(siphonGeo, siphonMat)
    deviceGroup.add(siphonMesh)

    const ballGeo = new THREE.SphereGeometry(0.08, 16, 16)
    const ballMesh = new THREE.Mesh(ballGeo, chromeMat)
    ballMesh.position.set(0.18, -2.3, 0.12)
    deviceGroup.add(ballMesh)

    // 5. HYPER-REALISTIC MIST & DROPLET PARTICLES
    const particleCount = 650
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities: { vx: number; vy: number; vz: number; life: number; maxLife: number }[] = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = tipOrigin.x
      positions[i * 3 + 1] = tipOrigin.y
      positions[i * 3 + 2] = tipOrigin.z

      velocities.push({
        vx: 0,
        vy: 0,
        vz: 0,
        life: Math.random(),
        maxLife: 0.5 + Math.random() * 0.4,
      })
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.075,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particleSystem = new THREE.Points(particleGeo, particleMat)
    deviceGroup.add(particleSystem)

    // 6. TOUCH & MOUSE LISTENERS
    const handleStart = (clientX: number, clientY: number) => {
      isDraggingRef.current = true
      previousTouchRef.current = { x: clientX, y: clientY }
    }

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return
      const deltaX = clientX - previousTouchRef.current.x
      const deltaY = clientY - previousTouchRef.current.y

      targetRotationRef.current.y += deltaX * 0.008
      targetRotationRef.current.x = Math.max(-0.4, Math.min(0.45, targetRotationRef.current.x + deltaY * 0.008))

      previousTouchRef.current = { x: clientX, y: clientY }
    }

    const handleEnd = () => {
      isDraggingRef.current = false
    }

    // Mouse
    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY)
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onMouseUp = () => handleEnd()

    // Touch (Mobile 1-Finger Orbit)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onTouchEnd = () => handleEnd()

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    // 7. ANIMATION LOOP
    let animationFrameId: number
    const clock = new THREE.Clock()
    let currentZoom = targetZoomRef.current

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      // Smooth Camera Zoom & Position Lerp
      currentZoom += (targetZoomRef.current - currentZoom) * 0.1
      camera.position.z = currentZoom
      deviceGroup.position.y += (targetYRef.current - deviceGroup.position.y) * 0.1

      // Idle Auto-Rotate
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.003
      }

      // Smooth Rotation Lerp
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1
      deviceGroup.rotation.x = rotationRef.current.x
      deviceGroup.rotation.y = rotationRef.current.y

      // Dynamic Particle Spray Physics
      const posArray = particleGeo.attributes.position.array as Float32Array
      const speedMult = (psi / 100) * 11

      if (isSpraying) {
        particleSystem.visible = true
        for (let i = 0; i < particleCount; i++) {
          const v = velocities[i]
          v.life += delta

          if (v.life > v.maxLife) {
            v.life = 0
            posArray[i * 3] = tipOrigin.x
            posArray[i * 3 + 1] = tipOrigin.y
            posArray[i * 3 + 2] = tipOrigin.z

            v.vx = (Math.random() - 0.5) * 0.25
            v.vy = 0.6 + (Math.random() - 0.5) * 0.2
            v.vz = 1.8 + (Math.random() - 0.5) * 0.3
          } else {
            posArray[i * 3] += v.vx * speedMult * delta
            posArray[i * 3 + 1] += (v.vy * speedMult - 2.8 * v.life * v.life) * delta
            posArray[i * 3 + 2] += v.vz * speedMult * delta
          }
        }
        particleGeo.attributes.position.needsUpdate = true
      } else {
        particleSystem.visible = false
      }

      renderer.render(scene, camera)
    }

    animate()

    // 8. RESIZE
    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      renderer.dispose()
    }
  }, [psi, modeIndex, isSpraying, autoRotate, isDark])

  return (
    <div
      ref={containerRef}
      className="size-full cursor-grab active:cursor-grabbing select-none"
      title="اسحب لتدوير الجهاز 360°"
    />
  )
}
