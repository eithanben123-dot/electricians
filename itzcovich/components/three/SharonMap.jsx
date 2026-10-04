'use client';
/**
 * The Sharon, in relief — built from real coordinates: Mediterranean coastline,
 * highways 2 / 4 / 531, and the six cities as clusters of built blocks.
 * The active city (driven by the "Areas" section) rises in champagne light.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { AREAS } from '@/lib/data';
import { scroll } from '@/lib/scroll';
import { sand, waterNormal } from './textures';

export const MAP_ORIGIN = new THREE.Vector3(-110, 0, 0);
export const project = (lat, lng) => new THREE.Vector3((lng - 34.87) * 110, 0, -(lat - 32.22) * 120);
export const cityWorld = (i) => project(AREAS[i].lat, AREAS[i].lng).add(MAP_ORIGIN);

const COAST = [[32.47, 34.884], [32.4, 34.866], [32.33, 34.851], [32.28, 34.838], [32.23, 34.826], [32.19, 34.812], [32.16, 34.802], [32.12, 34.79], [32.07, 34.775], [31.96, 34.745]];
const ROADS = [
  [[32.46, 34.905], [32.33, 34.872], [32.23, 34.85], [32.16, 34.825], [32.08, 34.805]],          // highway 2
  [[32.46, 34.94], [32.33, 34.905], [32.22, 34.895], [32.12, 34.88], [32.02, 34.86]],            // highway 4
  [[32.168, 34.82], [32.17, 34.86], [32.165, 34.9], [32.16, 34.95]],                               // 531
];

function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

export default function SharonMap() {
  const gold = useRef();
  const beams = useRef([]);
  const labels = useRef([]);

  const { land, blocks, roads, mats } = useMemo(() => {
    const shape = new THREE.Shape();
    const pts = COAST.map(([la, ln]) => project(la, ln));
    shape.moveTo(pts[0].x, -pts[0].z);
    pts.slice(1).forEach((p) => shape.lineTo(p.x, -p.z));
    const se = project(31.96, 35.12), ne = project(32.47, 35.12);
    shape.lineTo(se.x, -se.z); shape.lineTo(ne.x, -ne.z); shape.closePath();
    const land = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.2, bevelSegments: 3 });

    const blocks = [];
    AREAS.forEach((a, ci) => {
      const c = project(a.lat, a.lng), r = rng(ci * 97 + 13);
      const n = a.key === 'netanya' ? 70 : a.hq ? 80 : 55;
      for (let k = 0; k < n; k++) {
        const ang = r() * Math.PI * 2, d = Math.sqrt(r()) * (a.hq ? 1.7 : 1.5);
        const tall = a.key === 'netanya' && r() > 0.7;
        const h = tall ? 0.8 + r() * 1.2 : 0.12 + r() * 0.45;
        blocks.push({ ci, p: [c.x + Math.cos(ang) * d, 0.75 + h / 2, c.z + Math.sin(ang) * d], s: [0.14 + r() * 0.18, h, 0.14 + r() * 0.18] });
      }
    });
    const roads = ROADS.map((line) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line.map(([la, ln]) => project(la, ln).setY(0.78))), 120, 0.035, 5));
    const mats = {
      land: new THREE.MeshStandardMaterial({ map: sand(), roughness: 0.95 }),
      sea: new THREE.MeshPhysicalMaterial({ color: '#7fb3bf', roughness: 0.08, normalMap: waterNormal(), normalScale: new THREE.Vector2(0.25, 0.25), clearcoat: 1, envMapIntensity: 1.4 }),
      block: new THREE.MeshStandardMaterial({ color: '#f5f1e9', roughness: 0.8 }),
      road: new THREE.MeshStandardMaterial({ color: '#c8a96e', roughness: 0.4, metalness: 0.6 }),
      beam: new THREE.MeshBasicMaterial({ color: '#e7c98f', transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }),
      ring: new THREE.MeshBasicMaterial({ color: '#c8a96e', transparent: true, opacity: 0.0 }),
    };
    return { land, blocks, roads, mats };
  }, []);

  const beamMats = useMemo(() => AREAS.map(() => mats.beam.clone()), [mats]);
  const ringMats = useMemo(() => AREAS.map(() => mats.ring.clone()), [mats]);

  useFrame((state, dt) => {
    const k = Math.min(1, dt * 4);
    AREAS.forEach((_, i) => {
      const on = scroll.activeArea === i ? 1 : 0;
      beamMats[i].opacity += (on * 0.14 - beamMats[i].opacity) * k;
      ringMats[i].opacity += ((on ? 0.9 : 0.25) - ringMats[i].opacity) * k;
      const b = beams.current[i];
      if (b) b.scale.y += ((on ? 1 : 0.001) - b.scale.y) * k;
      const l = labels.current[i];
      if (l) l.classList.toggle('is-on', !!on);
    });
    if (!scroll.reduced) mats.sea.normalMap.offset.x += dt * 0.01;
  });

  return (
    <group position={MAP_ORIGIN}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} material={mats.sea} receiveShadow><planeGeometry args={[160, 160]} /></mesh>
      <mesh geometry={land} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} material={mats.land} receiveShadow castShadow />
      {roads.map((g, i) => <mesh key={i} geometry={g} material={mats.road} />)}
      <Instances material={mats.block} castShadow receiveShadow limit={blocks.length}>
        <boxGeometry />
        {blocks.map((b, i) => <Instance key={i} position={b.p} scale={b.s} />)}
      </Instances>
      {AREAS.map((a, i) => {
        const c = project(a.lat, a.lng);
        return (
          <group key={a.key} position={[c.x, 0.78, c.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={ringMats[i]}><ringGeometry args={[a.hq ? 2.0 : 1.75, a.hq ? 2.08 : 1.82, 64]} /></mesh>
            <mesh ref={(el) => (beams.current[i] = el)} position={[0, 4, 0]} material={beamMats[i]}><cylinderGeometry args={[0.03, 0.35, 8, 24, 1, true]} /></mesh>
            <Html position={[0, 2.6, 0]} center zIndexRange={[5, 0]} wrapperClass="map-label-wrap">
              <span ref={(el) => (labels.current[i] = el)} className={`map-label${a.hq ? ' map-label--hq' : ''}`}>{a.name}</span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
