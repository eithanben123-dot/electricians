'use client';
/**
 * The WebGL world: one persistent canvas behind the page.
 */
import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sky, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, N8AO, DepthOfField, Vignette, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Villa from './Villa';
import Tower from './Tower';
import SharonMap from './SharonMap';
import CameraRig, { TOWER } from './CameraRig';
import { scroll } from '@/lib/scroll';

function Effects() {
  const dof = useRef();
  const { scene } = useThree();
  useFrame((state) => { if (dof.current && state.focus) dof.current.target = state.focus; });
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={2.2} intensity={2.2} distanceFalloff={1.2} halfRes quality="performance" />
      <DepthOfField ref={dof} focalLength={0.03} bokehScale={2.2} height={480} />
      <Bloom luminanceThreshold={0.95} intensity={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.55} />
    </EffectComposer>
  );
}

function Pointer() {
  useFrame(() => {}); // pointer is written by the DOM into scroll.pointer
  return null;
}

export default function World() {
  const sun = useRef();
  const [quality, setQuality] = useState(scroll.mobile ? 'low' : 'high');
  const high = quality === 'high';
  return (
    <Canvas
      className="world-canvas"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, scroll.mobile ? 1.5 : 1.8]}
      camera={{ fov: scroll.mobile ? 42 : 30, near: 0.5, far: 600, position: [-25, 10, 50] }}
      gl={{ antialias: !high, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setQuality('low')} />
      <AdaptiveDpr pixelated={false} />
      <color attach="background" args={['#efe5d3']} />
      <fog attach="fog" args={['#e6e2d6', 90, 260]} />
      <Sky distance={4500} sunPosition={[-60, 14, 40]} turbidity={4} rayleigh={2.4} mieCoefficient={0.006} mieDirectionalG={0.86} />
      <hemisphereLight args={['#dfe9f5', '#b49f7d', 0.55]} />
      <directionalLight
        ref={sun}
        color="#ffd9a8"
        intensity={3.2}
        castShadow
        shadow-mapSize={[high ? 2048 : 1024, high ? 2048 : 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#ffe4c0" position={[-10, 8, 12]} scale={[18, 8, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#dbe8f5" position={[12, 12, -6]} scale={[20, 10, 1]} />
        <Lightformer form="ring" intensity={3} color="#ffd29a" position={[-30, 6, 20]} scale={6} />
        <Lightformer form="rect" intensity={0.8} color="#f3ede2" position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Villa />
        <Tower position={TOWER} />
        <SharonMap />
      </Suspense>
      <CameraRig sun={sun} />
      <Pointer />
      {high && !scroll.reduced && <Effects />}
    </Canvas>
  );
}
