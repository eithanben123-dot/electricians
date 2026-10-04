'use client';
/**
 * A boutique residential tower with wraparound glass balconies and a rooftop
 * penthouse (pergola, plunge pool) — the "apartments & penthouses" stage.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
import { plasterBump, waterNormal, wood } from './textures';

const FLOORS = 13, FH = 3.25, W = 20, D = 15;

export default function Tower(props) {
  const m = useMemo(() => ({
    slab: new THREE.MeshStandardMaterial({ color: '#f3efe7', roughness: 0.82, bumpMap: plasterBump(), bumpScale: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#7f939b', roughness: 0.03, metalness: 0.25, envMapIntensity: 2, clearcoat: 1 }),
    rail: new THREE.MeshPhysicalMaterial({ color: '#cfe0e4', roughness: 0.02, transparent: true, opacity: 0.28, envMapIntensity: 2 }),
    warm: new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffd09a'), emissiveIntensity: 1.3 }),
    frame: new THREE.MeshStandardMaterial({ color: '#2c2b29', roughness: 0.4, metalness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: '#c8a96e', roughness: 0.35, metalness: 0.9 }),
    teak: new THREE.MeshStandardMaterial({ map: wood(), roughness: 0.7 }),
    water: new THREE.MeshPhysicalMaterial({ color: '#3fa6bd', roughness: 0.05, normalMap: waterNormal(), normalScale: new THREE.Vector2(0.3, 0.3), clearcoat: 1, envMapIntensity: 1.6 }),
    plaza: new THREE.MeshStandardMaterial({ color: '#d9cfbd', roughness: 0.9 }),
    tree: new THREE.MeshStandardMaterial({ color: '#66784a', roughness: 0.95 }),
    low: new THREE.MeshStandardMaterial({ color: '#e7e1d6', roughness: 0.9 }),
  }), []);

  // lit windows: a deterministic pattern so the façade reads as lived-in
  const lit = useMemo(() => {
    const out = [];
    for (let f = 0; f < FLOORS; f++) for (let b = 0; b < 6; b++) if ((f * 7 + b * 3) % 5 < 2) out.push([-W / 2 + 1.7 + b * 3.3, f * FH + 1.6, D / 2 - 0.9]);
    return out;
  }, []);

  return (
    <group {...props}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.plaza}><planeGeometry args={[120, 120]} /></mesh>
      {/* floors */}
      {Array.from({ length: FLOORS }, (_, f) => (
        <group key={f} position={[0, f * FH, 0]}>
          <mesh position={[0, 0.15, 0.6]} castShadow receiveShadow material={m.slab}><boxGeometry args={[W + 1.6, 0.3, D + 1.6]} /></mesh>
          <mesh position={[0, FH / 2 + 0.15, -0.4]} material={m.glass}><boxGeometry args={[W - 1.2, FH - 0.3, D - 2]} /></mesh>
          <mesh position={[0, 0.85, D / 2 + 1.35]} material={m.rail}><boxGeometry args={[W + 1.4, 1.1, 0.04]} /></mesh>
          <mesh position={[0, 1.4, D / 2 + 1.35]} material={m.frame}><boxGeometry args={[W + 1.4, 0.04, 0.06]} /></mesh>
        </group>
      ))}
      <Instances material={m.warm}>
        <boxGeometry args={[2.2, 0.08, 0.6]} />
        {lit.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>
      {/* vertical fins in champagne gold */}
      {[-W / 2 - 0.8, W / 2 + 0.8].map((x, i) => (
        <mesh key={i} position={[x, (FLOORS * FH) / 2, D / 2 + 1.3]} castShadow material={m.gold}><boxGeometry args={[0.18, FLOORS * FH, 0.4]} /></mesh>
      ))}
      {/* penthouse */}
      <group position={[0, FLOORS * FH, 0]}>
        <mesh position={[0, 0.2, 0.6]} receiveShadow castShadow material={m.slab}><boxGeometry args={[W + 1.6, 0.4, D + 1.6]} /></mesh>
        <mesh position={[-3.5, 1.9, -2.5]} material={m.glass}><boxGeometry args={[11, 3.2, 8]} /></mesh>
        <mesh position={[-3.5, 3.65, -2.5]} castShadow material={m.slab}><boxGeometry args={[12.5, 0.3, 9.5]} /></mesh>
        {/* pergola */}
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[4.2 + i * 0.6, 3.4, 2]} castShadow material={m.teak}><boxGeometry args={[0.12, 0.2, 7]} /></mesh>
        ))}
        {[[4, 5.4], [9.8, 5.4], [4, -1.2], [9.8, -1.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.8, z]} castShadow material={m.frame}><boxGeometry args={[0.16, 3.2, 0.16]} /></mesh>
        ))}
        <mesh position={[-4, 0.45, 5.6]} material={m.water}><boxGeometry args={[7, 0.1, 2.6]} /></mesh>
        <mesh position={[0, 0.95, D / 2 + 1.35]} material={m.rail}><boxGeometry args={[W + 1.4, 1.1, 0.04]} /></mesh>
      </group>
      {/* neighbourhood context */}
      {[[-34, 9, -6], [32, 12, -4], [-30, 6, 22], [36, 7, 20]].map(([x, h, z], i) => (
        <mesh key={i} position={[x, h / 2, z]} castShadow receiveShadow material={m.low}><boxGeometry args={[12, h, 10]} /></mesh>
      ))}
      {[[-14, 16], [14, 16], [-18, 4], [18, 4], [0, 22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.8, z]} castShadow material={m.tree}><icosahedronGeometry args={[2.2, 3]} /></mesh>
      ))}
    </group>
  );
}
