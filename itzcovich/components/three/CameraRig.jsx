'use client';
/**
 * Scroll-driven camera. Each "stage" section of the page owns a list of camera
 * stops; the DOM writes the sections' scroll ranges into `scroll.anchors`, and
 * this rig turns the current scroll position into a smooth camera path.
 * Desktop: subject framed in the left half (copy sits on the right, RTL).
 * Portrait: subject centred in the upper half, camera pulled back.
 */
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scroll } from '@/lib/scroll';
import { cityWorld } from './SharonMap';

export const TOWER = new THREE.Vector3(110, 0, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const T = (x, y, z) => TOWER.clone().add(V(x, y, z));

export const STAGES = {
  hero:     [{ pos: V(-30, 7.5, 48), look: V(-1, 3, 1), shift: 0.34 }],
  featured: [{ pos: T(40, 10, 70), look: T(0, 16, 0), shift: 0.34 }, { pos: T(34, 30, 60), look: T(0, 28, 0), shift: 0.34 }, { pos: T(24, 52, 40), look: T(-2, 42, 2), shift: 0.34 }],
  services: [{ pos: V(18, 3.2, 30), look: V(1, 1.4, 9), shift: 0.32 }, { pos: V(-10, 2.8, 31), look: V(1, 1.6, 8), shift: 0.32 }],
  // one stop that follows the city the visitor picked (hover / tap), not the scroll position
  areas:    () => { const c = cityWorld(scroll.activeArea || 0); return [{ pos: c.clone().add(V(3, 10.5, 13)), look: c.clone().add(V(0, 0.8, 0)), shift: 0.28 }]; },
  about:    [{ pos: V(34, 6, 20), look: V(2, 3.2, 1), shift: 0.32 }, { pos: V(30, 9, 26), look: V(2, 3.6, 2), shift: 0.32 }],
  sell:     [{ pos: V(20, 28, 36), look: V(0, 0, 5), shift: 0.3 }, { pos: V(14, 24, 38), look: V(0, 0, 6), shift: 0.3 }],
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export default function CameraRig({ sun }) {
  const { camera, size } = useThree();
  const key = useRef('');
  const path = useRef(null);
  const cur = useRef({ pos: STAGES.hero[0].pos.clone().add(V(-8, 6, 18)), look: STAGES.hero[0].look.clone() });
  const tmp = useRef({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() }).current;

  function build() {
    const portrait = size.width / size.height < 0.9;
    const controls = [];
    scroll.anchors.forEach(({ name, start, end }) => {
      const def = STAGES[name];
      if (!def) return;
      const stops = (typeof def === 'function' ? def() : def).map((s) => {
        if (!portrait) return s;
        const dir = s.pos.clone().sub(s.look);
        return { pos: s.look.clone().add(dir.multiplyScalar(1.45)), look: s.look.clone().add(V(0, -dir.length() * 0.12, 0)), shift: 0 };
      });
      const span = Math.max(0, end - start);
      if (stops.length === 1 || span < 2) { controls.push({ y: start, ...stops[0], mode: 'travel' }); if (span >= 2) controls.push({ y: end, ...stops[0], pos: stops[0].pos.clone().add(V(0, 0, -1.2)), mode: 'travel' }); return; }
      const n = stops.length, w = (0.5 / n) * 0.7;
      stops.forEach((s, k) => {
        const c = k / (n - 1);
        controls.push({ y: start + span * Math.max(0, c - w), ...s, mode: 'dwell' });
        controls.push({ y: start + span * Math.min(1, c + w), ...s, pos: s.pos.clone().add(V(0, 0, -0.6)), mode: k === n - 1 ? 'travel' : 'move' });
      });
    });
    controls.sort((a, b) => a.y - b.y);
    if (controls.length < 2) return null;
    return {
      controls,
      pos: new THREE.CatmullRomCurve3(controls.map((c) => c.pos), false, 'centripetal'),
      look: new THREE.CatmullRomCurve3(controls.map((c) => c.look), false, 'centripetal'),
      shift: controls.map((c) => c.shift),
    };
  }

  useFrame((state, dt) => {
    const k = `${scroll.anchors.map((a) => `${a.name}${a.start | 0}`).join()}|${size.width}x${size.height}|${scroll.activeArea}`;
    if (k !== key.current) { key.current = k; path.current = build(); }
    const P = path.current;
    if (!P) return;
    const { controls } = P, n = controls.length, y = scroll.y;
    let i = 0;
    while (i < n - 2 && y >= controls[i + 1].y) i++;
    const a = controls[i], b = controls[i + 1];
    let t = THREE.MathUtils.clamp((y - a.y) / Math.max(1, b.y - a.y), 0, 1);
    t = a.mode === 'dwell' ? easeSine(t) : ease(t);
    const u = (i + t) / (n - 1);
    const pos = P.pos.getPoint(u), look = P.look.getPoint(u);
    const shift = THREE.MathUtils.lerp(a.shift, b.shift, t);

    // frame the subject: slide the aim point so the subject lands left of centre
    tmp.fwd.copy(look).sub(pos);
    const dist = tmp.fwd.length();
    tmp.right.crossVectors(tmp.fwd.normalize(), camera.up).normalize();
    tmp.up.crossVectors(tmp.right, tmp.fwd);
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * camera.aspect;
    look.addScaledVector(tmp.right, halfW * shift);
    // gentle mouse parallax
    if (!scroll.reduced) pos.addScaledVector(tmp.right, scroll.pointer.x * 0.6).addScaledVector(tmp.up, scroll.pointer.y * 0.35);

    const s = scroll.reduced ? 1 : 1 - Math.exp(-dt * 2.4);
    cur.current.pos.lerp(pos, s); cur.current.look.lerp(look, s);
    camera.position.copy(cur.current.pos);
    camera.lookAt(cur.current.look);

    // the sun (and its shadow frustum) follows whatever we're looking at
    if (sun.current) {
      sun.current.target.position.copy(cur.current.look);
      sun.current.position.copy(cur.current.look).add(V(-38, 30, 26));
      sun.current.target.updateMatrixWorld();
    }
    state.focus = cur.current.look;
  });
  return null;
}
