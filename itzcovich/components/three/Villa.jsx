'use client';
/**
 * A contemporary Sharon villa at golden hour — two cantilevered white volumes,
 * floor-to-ceiling glass lit from within, teak screens, travertine wall,
 * an infinity pool, olive trees and cypresses. Units are metres.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { plasterBump, grass, wood, travertine, waterNormal } from './textures';
import { scroll } from '@/lib/scroll';

function useMaterials() {
  return useMemo(() => {
    const bump = plasterBump();
    const deck = wood(); deck.repeat.set(4, 1.2);
    const trav = travertine();
    const wn = waterNormal();
    return {
      plaster: new THREE.MeshStandardMaterial({ color: '#f2ede4', roughness: 0.9, bumpMap: bump, bumpScale: 0.6 }),
      slab: new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.85 }),
      charcoal: new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: 0.45, metalness: 0.6 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#8fa3ab', roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.38, envMapIntensity: 1.8, clearcoat: 1 }),
      interior: new THREE.MeshStandardMaterial({ color: '#3a3027', roughness: 0.9 }),
      warm: new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffcf94'), emissiveIntensity: 1.6 }),
      teak: new THREE.MeshStandardMaterial({ color: '#9a6a43', roughness: 0.65 }),
      deck: new THREE.MeshStandardMaterial({ map: deck, roughness: 0.7 }),
      trav: new THREE.MeshStandardMaterial({ map: trav, roughness: 0.82 }),
      coping: new THREE.MeshStandardMaterial({ color: '#ece6da', roughness: 0.6 }),
      lawn: new THREE.MeshStandardMaterial({ map: grass(), roughness: 1 }),
      water: new THREE.MeshPhysicalMaterial({ color: '#3fa6bd', roughness: 0.04, metalness: 0.05, normalMap: wn, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.94 }),
      poolTile: new THREE.MeshStandardMaterial({ color: '#7fc8d4', roughness: 0.4 }),
      cushion: new THREE.MeshStandardMaterial({ color: '#efe7da', roughness: 0.95 }),
      olive: new THREE.MeshStandardMaterial({ color: '#6f7d55', roughness: 0.95, bumpMap: plasterBump(), bumpScale: 3 }),
      olive2: new THREE.MeshStandardMaterial({ color: '#8d9670', roughness: 0.95, bumpMap: plasterBump(), bumpScale: 3 }),
      bark: new THREE.MeshStandardMaterial({ color: '#6b5a48', roughness: 1 }),
      cypress: new THREE.MeshStandardMaterial({ color: '#3a4d2f', roughness: 0.95, bumpMap: plasterBump(), bumpScale: 3 }),
      hedge: new THREE.MeshStandardMaterial({ color: '#56693c', roughness: 1, bumpMap: plasterBump(), bumpScale: 3 }),
    };
  }, []);
}

const Box = ({ args, position, material, cast = true, receive = true, ...rest }) => (
  <mesh position={position} castShadow={cast} receiveShadow={receive} material={material} {...rest}><boxGeometry args={args} /></mesh>
);

/** a glazed façade: glass pane + slim mullions + warm interior behind it */
function Glazing({ w, h, position, rotation = [0, 0, 0], m, lit = 1, depth = 2.6, bays = 4 }) {
  const step = w / bays;
  return (
    <group position={position} rotation={rotation}>
      {/* interior volume seen through the glass */}
      <Box args={[w - 0.1, h - 0.1, 0.05]} position={[0, 0, -depth]} material={m.interior} cast={false} />
      <Box args={[w - 0.1, 0.05, depth]} position={[0, -h / 2 + 0.05, -depth / 2]} material={m.interior} cast={false} />
      {lit > 0 && Array.from({ length: bays }, (_, i) => (
        <mesh key={i} position={[-w / 2 + step * (i + 0.5), h / 2 - 0.35, -depth + 0.3]} material={m.warm}><boxGeometry args={[step * 0.55, 0.06, 0.6]} /></mesh>
      ))}
      <mesh material={m.glass}><planeGeometry args={[w, h]} /></mesh>
      {Array.from({ length: bays + 1 }, (_, i) => (
        <Box key={i} args={[0.06, h, 0.08]} position={[-w / 2 + step * i, 0, 0.02]} material={m.charcoal} receive={false} />
      ))}
      <Box args={[w, 0.08, 0.1]} position={[0, -h / 2, 0.02]} material={m.charcoal} receive={false} />
    </group>
  );
}

function OliveTree({ position, scale = 1, seed = 1, m }) {
  const blobs = useMemo(() => {
    let s = seed * 9301;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 7 }, () => ({ p: [(r() - 0.5) * 2.2, 2.6 + r() * 1.3, (r() - 0.5) * 2.2], s: 0.75 + r() * 0.6, m: r() > 0.5 }));
  }, [seed]);
  return (
    <group position={position} scale={scale}>
      <mesh castShadow material={m.bark} position={[0, 1.2, 0]} rotation={[0, 0, 0.12]}><cylinderGeometry args={[0.13, 0.22, 2.6, 7]} /></mesh>
      <mesh castShadow material={m.bark} position={[0.35, 2.1, 0]} rotation={[0, 0, -0.6]}><cylinderGeometry args={[0.07, 0.11, 1.3, 6]} /></mesh>
      {blobs.map((b, i) => (
        <mesh key={i} castShadow position={b.p} scale={[b.s * 1.2, b.s * 0.75, b.s * 1.2]} material={b.m ? m.olive : m.olive2}><icosahedronGeometry args={[1, 3]} /></mesh>
      ))}
    </group>
  );
}
const Cypress = ({ position, h = 7, m }) => (
  <group position={position}>
    <mesh castShadow material={m.cypress} position={[0, h / 2, 0]}><coneGeometry args={[0.75, h, 18, 6]} /></mesh>
    <mesh castShadow material={m.cypress} position={[0, h * 0.32, 0]} scale={[1.15, 0.6, 1.15]}><sphereGeometry args={[0.75, 18, 12]} /></mesh>
  </group>
);

function Lounger({ position, rotation = 0, m }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.75, 0.22, 2]} radius={0.06} position={[0, 0.32, 0]} castShadow material={m.cushion} />
      <RoundedBox args={[0.75, 0.2, 0.8]} radius={0.06} position={[0, 0.58, -0.72]} rotation={[0.75, 0, 0]} castShadow material={m.cushion} />
      <Box args={[0.8, 0.2, 2.05]} position={[0, 0.12, 0]} material={m.teak} />
    </group>
  );
}

export default function Villa(props) {
  const m = useMaterials();
  const water = useRef();
  useFrame((_, dt) => {
    if (scroll.reduced) return;
    const n = m.water.normalMap;
    n.offset.x += dt * 0.012; n.offset.y += dt * 0.007;
  });

  return (
    <group {...props}>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.lawn}><planeGeometry args={[140, 140]} /></mesh>

      {/* ——— ground floor volume ——— */}
      <Box args={[18, 3.6, 10]} position={[-1, 1.8, -1]} material={m.plaster} />
      <Glazing w={15} h={3.1} position={[0.2, 1.65, 4.01]} m={m} bays={5} />
      <Box args={[19, 0.32, 11.2]} position={[-1, 3.75, -0.6]} material={m.slab} />
      {/* ——— upper floor, cantilevered toward the pool ——— */}
      <Box args={[13, 3.3, 8.6]} position={[2.6, 5.6, -1.4]} material={m.plaster} />
      <Glazing w={9.5} h={2.8} position={[4.2, 5.55, 2.91]} m={m} bays={4} />
      <Box args={[13.8, 0.3, 9.6]} position={[2.6, 7.4, -1.1]} material={m.slab} />
      {/* teak screen on the upper volume */}
      {Array.from({ length: 22 }, (_, i) => (
        <Box key={i} args={[0.07, 3.1, 0.14]} position={[-3.6 + i * 0.16, 5.6, 2.99]} material={m.teak} receive={false} />
      ))}
      {/* side glazing */}
      <Glazing w={7} h={3.1} position={[8.01, 1.65, -1]} rotation={[0, Math.PI / 2, 0]} m={m} bays={3} />
      {/* travertine wall + fin */}
      <Box args={[0.6, 7.5, 6]} position={[-10.3, 3.75, -1]} material={m.trav} />
      <Box args={[14, 1.2, 0.45]} position={[-14, 0.6, 7]} material={m.trav} />
      {/* terrace deck */}
      <Box args={[20, 0.16, 4.2]} position={[-0.5, 0.08, 6.2]} material={m.deck} cast={false} />

      {/* ——— infinity pool ——— */}
      <group position={[1, 0, 11.4]}>
        <Box args={[16, 0.2, 0.5]} position={[0, 0.1, -2.6]} material={m.coping} />
        <Box args={[0.5, 0.2, 5.6]} position={[-8.2, 0.1, 0]} material={m.coping} />
        <Box args={[0.5, 0.2, 5.6]} position={[8.2, 0.1, 0]} material={m.coping} />
        <Box args={[16.9, 0.12, 0.35]} position={[0, 0.04, 2.75]} material={m.charcoal} />
        <mesh position={[0, -0.6, 0]} material={m.poolTile} receiveShadow><boxGeometry args={[16, 1.1, 5]} /></mesh>
        <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} material={m.water} receiveShadow><planeGeometry args={[16, 5]} /></mesh>
      </group>
      <Lounger position={[-6, 0.16, 6.6]} rotation={Math.PI} m={m} />
      <Lounger position={[-4.6, 0.16, 6.6]} rotation={Math.PI} m={m} />
      <Lounger position={[-3.2, 0.16, 6.6]} rotation={Math.PI} m={m} />

      {/* ——— landscape ——— */}
      <OliveTree position={[-14, 0, 2]} scale={1.15} seed={3} m={m} />
      <OliveTree position={[12.5, 0, 6]} scale={1} seed={7} m={m} />
      <OliveTree position={[-7.5, 0, 16]} scale={0.9} seed={11} m={m} />
      {[-18, -16.2, -14.4, 14, 15.8, 17.6].map((x, i) => <Cypress key={i} position={[x, 0, -9 + (i % 2) * 0.6]} h={7 + (i % 3)} m={m} />)}
      <RoundedBox args={[40, 1.4, 1.4]} radius={0.5} position={[0, 0.7, -13]} castShadow material={m.hedge} />
      <RoundedBox args={[1.4, 1.4, 26]} radius={0.5} position={[-20, 0.7, 0]} castShadow material={m.hedge} />
      <RoundedBox args={[1.4, 1.4, 26]} radius={0.5} position={[20, 0.7, 0]} castShadow material={m.hedge} />
    </group>
  );
}
