"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Float, MeshReflectorMaterial } from "@react-three/drei"
import type { Group } from "three"
import * as THREE from "three"

type Candle = {
  x: number
  open: number
  close: number
  high: number
  low: number
  depth: number
}

function CameraRig({ tilt }: { tilt: { x: number; y: number } }) {
  const { camera, pointer } = useThree()

  useFrame(() => {
    const targetX = pointer.x * 0.55 + tilt.x
    const targetY = pointer.y * 0.3 + tilt.y
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.035)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.7 + targetY, 0.035)
    camera.lookAt(0.7, 0.55, 0)
  })

  return null
}

function CandleMesh({ candle, index }: { candle: Candle; index: number }) {
  const bullish = candle.close >= candle.open
  const color = bullish ? "#00e599" : "#ff5c6c"
  const bodyHeight = Math.max(Math.abs(candle.close - candle.open), 0.14)
  const bodyY = (candle.open + candle.close) / 2
  const wickHeight = candle.high - candle.low

  return (
    <Float speed={0.35} rotationIntensity={0.025} floatIntensity={0.035} floatingRange={[-0.015, 0.015]}>
      <group position={[candle.x, 0, candle.depth]}>
        <mesh position={[0, (candle.high + candle.low) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, wickHeight, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} metalness={0.65} roughness={0.22} />
        </mesh>
        <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.32, bodyHeight, 0.28]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={bullish ? 0.22 : 0.14}
            metalness={0.58}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.15}
          />
        </mesh>
        <pointLight position={[0, bodyY, 0.45]} color={color} intensity={index % 4 === 0 ? 0.45 : 0} distance={2.2} />
      </group>
    </Float>
  )
}

function MarketScene({ tilt }: { tilt: { x: number; y: number } }) {
  const groupRef = useRef<Group>(null)
  const candles = useMemo<Candle[]>(() => {
    let current = 0.35
    return Array.from({ length: 19 }, (_, index) => {
      const movement = Math.sin(index * 1.73) * 0.34 + Math.cos(index * 0.71) * 0.18 + 0.11
      const open = current
      const close = THREE.MathUtils.clamp(open + movement, -0.65, 2.4)
      const high = Math.max(open, close) + 0.22 + (index % 3) * 0.07
      const low = Math.min(open, close) - 0.2 - (index % 4) * 0.04
      current = close
      return { x: (index - 9) * 0.46, open, close, high, low, depth: Math.sin(index * 0.82) * 0.2 }
    })
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.055, 0.04)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.09 - state.pointer.y * 0.025, 0.04)
  })

  return (
    <>
      <color attach="background" args={["#060a0c"]} />
      <fog attach="fog" args={["#060a0c", 8, 18]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 7, 4]} intensity={2.2} color="#dffdf3" castShadow />
      <pointLight position={[-4, 2, 3]} intensity={5} color="#00e599" distance={9} />
      <pointLight position={[4, 1, -2]} intensity={3} color="#ff5c6c" distance={8} />
      <group ref={groupRef} position={[1.55, -0.35, 0]} rotation={[-0.09, -0.12, -0.015]}>
        {candles.map((candle, index) => <CandleMesh key={index} candle={candle} index={index} />)}
        <gridHelper args={[12, 24, "#17352d", "#10201c"]} position={[0, -0.95, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.98, 0]} receiveShadow>
          <planeGeometry args={[14, 9]} />
          <MeshReflectorMaterial
            blur={[500, 120]}
            resolution={512}
            mixBlur={2}
            mixStrength={12}
            roughness={0.7}
            depthScale={0.8}
            minDepthThreshold={0.2}
            maxDepthThreshold={1.4}
            color="#07100d"
            metalness={0.65}
          />
        </mesh>
      </group>
      <CameraRig tilt={tilt} />
      <Environment preset="night" />
    </>
  )
}

export function HeroBackground() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return
      setTilt({
        x: THREE.MathUtils.clamp(event.gamma / 90, -0.35, 0.35),
        y: THREE.MathUtils.clamp((event.beta - 45) / 180, -0.2, 0.2),
      })
    }
    window.addEventListener("deviceorientation", onOrientation, { passive: true })
    return () => window.removeEventListener("deviceorientation", onOrientation)
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-auto absolute inset-0 overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 1.65]}
        camera={{ position: [0, 2.7, 8.8], fov: 39 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <MarketScene tilt={tilt} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--landing-bg)_2%,color-mix(in_srgb,var(--landing-bg)_94%,transparent)_36%,color-mix(in_srgb,var(--landing-bg)_30%,transparent)_72%,color-mix(in_srgb,var(--landing-bg)_72%,transparent)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--landing-bg)_0%,transparent_18%,transparent_72%,var(--landing-bg)_100%)]" />
      <div className="landing-hero-noise pointer-events-none absolute inset-0 opacity-20" />
    </div>
  )
}
