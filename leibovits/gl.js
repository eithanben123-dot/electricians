/* "השיטה" — brass particles that morph with the scroll:
   I. a drifting cloud of data  →  II. a cadastral grid of land parcels  →  III. a building.
   Progress comes from script.js (window.__method). Renders only while on screen. */
import * as THREE from 'three';

const canvas = document.getElementById('gl');
const state = window.__method || { p: 0, visible: true };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

if (canvas && hasWebGL()) init();

function init() {
  const small = innerWidth < 820;
  const N = small ? 7000 : 16000;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.setClearColor(0x070605, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(small ? 52 : 38, 1, 0.1, 200);

  /* ---------- shape samplers ---------- */
  const rnd = mulberry32(7);
  // I — cloud: a soft ellipsoid of dust, denser at the core
  const cloud = (i) => {
    const u = rnd(), v = rnd(), r = Math.pow(rnd(), 0.6) * 9;
    const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
    return [r * Math.sin(ph) * Math.cos(th) * 1.4, r * Math.cos(ph) * 0.7 + 1.2, r * Math.sin(ph) * Math.sin(th)];
  };
  // II — parcels: a jittered grid of plots on the ground, sampled along their edges
  const G = 11, cell = 1.45, ground = -2.4;
  const corners = [];
  for (let x = 0; x <= G; x++) { corners[x] = []; for (let z = 0; z <= G; z++) corners[x][z] = [(x - G / 2) * cell + (rnd() - 0.5) * 0.5, (z - G / 2) * cell + (rnd() - 0.5) * 0.5]; }
  const segs = [];
  for (let x = 0; x <= G; x++) for (let z = 0; z <= G; z++) {
    if (x < G) segs.push([corners[x][z], corners[x + 1][z]]);
    if (z < G) segs.push([corners[x][z], corners[x][z + 1]]);
  }
  const parcels = () => {
    if (rnd() < 0.12) { // a few points scattered inside plots — "data" still settling
      const a = corners[(rnd() * G) | 0][(rnd() * G) | 0];
      return [a[0] + rnd() * cell, ground + 0.02, a[1] + rnd() * cell];
    }
    const s = segs[(rnd() * segs.length) | 0], t = rnd();
    return [s[0][0] + (s[1][0] - s[0][0]) * t, ground + (rnd() - 0.5) * 0.04, s[0][1] + (s[1][1] - s[0][1]) * t];
  };
  // III — building: stacked floor plates, corner columns, mullions, slim balconies, crown
  const W = 3.2, D = 2.3, FLOORS = 13, FH = 0.5;
  const bEdges = [];
  const rect = (y, w, d, ox = 0, oz = 0) => {
    const a = [-w / 2 + ox, y, -d / 2 + oz], b = [w / 2 + ox, y, -d / 2 + oz], c = [w / 2 + ox, y, d / 2 + oz], e = [-w / 2 + ox, y, d / 2 + oz];
    bEdges.push([a, b], [b, c], [c, e], [e, a]);
  };
  for (let f = 0; f <= FLOORS; f++) {
    const y = ground + f * FH;
    rect(y, W, D);
    if (f > 0 && f < FLOORS && f % 2 === 0) rect(y, W * 0.7, 0.5, 0, D / 2 + 0.25); // balcony
  }
  const top = ground + FLOORS * FH;
  rect(top + 0.18, W * 0.82, D * 0.8); rect(top + 0.36, W * 0.82, D * 0.8);         // crown
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => bEdges.push([[sx * W / 2, ground, sz * D / 2], [sx * W / 2, top, sz * D / 2]]));
  for (let k = 1; k < 8; k++) {
    const x = -W / 2 + (W / 8) * k;
    bEdges.push([[x, ground, D / 2], [x, top, D / 2]], [[x, ground, -D / 2], [x, top, -D / 2]]);
  }
  for (let k = 1; k < 6; k++) {
    const z = -D / 2 + (D / 6) * k;
    bEdges.push([[W / 2, ground, z], [W / 2, top, z]], [[-W / 2, ground, z], [-W / 2, top, z]]);
  }
  rect(ground - 0.01, W * 3.2, D * 3.2); rect(ground - 0.01, W * 4.6, D * 4.6); // site boundary rings
  const lens = bEdges.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  const total = lens.reduce((s, l) => s + l, 0);
  const cum = []; lens.reduce((s, l, i) => (cum[i] = s + l), 0);
  const building = () => {
    const r = rnd() * total; let i = 0; while (cum[i] < r) i++;
    const [a, b] = bEdges[i], t = rnd();
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };

  /* ---------- geometry ---------- */
  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), C = new Float32Array(N * 3), R = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    A.set(cloud(i), i * 3); B.set(parcels(i), i * 3); C.set(building(i), i * 3); R[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(A.slice(), 3)); // bounding only
  geo.setAttribute('aA', new THREE.BufferAttribute(A, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(B, 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(C, 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(R, 1));

  const uniforms = {
    uP: { value: 0 }, uT: { value: 0 },
    uPx: { value: renderer.getPixelRatio() },
    uBrass: { value: new THREE.Color('#c79d5e') }, uIvory: { value: new THREE.Color('#efe6d6') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute float aR;
      uniform float uP; uniform float uT; uniform float uPx;
      varying float vA; varying float vMix;
      void main(){
        float r = aR;
        float t1 = smoothstep(0.06 + r*0.16, 0.34 + r*0.16, uP);
        float t2 = smoothstep(0.48 + r*0.16, 0.80 + r*0.14, uP);
        vec3 drift = vec3(sin(uT*0.4 + r*40.0), cos(uT*0.33 + r*31.0), sin(uT*0.27 + r*17.0)) * (0.35 * (1.0 - t1));
        vec3 p = mix(mix(aA + drift, aB, t1), aC, t2);
        // a breath of turbulence mid-flight
        float fly = sin(3.14159 * t1) + sin(3.14159 * t2);
        p += vec3(sin(r*91.0+uT), cos(r*53.0+uT*1.3), sin(r*27.0-uT)) * 0.35 * fly;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = (1.6 + r * 2.4) * (1.0 + 0.6 * fly) * (1.0 + 0.5 * (1.0 - t1));
        gl_PointSize = size * uPx * (18.0 / -mv.z);
        vA = (0.45 + 0.55 * r) * clamp(14.0 / -mv.z, 0.25, 1.2);
        vMix = step(0.82, r);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBrass; uniform vec3 uIvory;
      varying float vA; varying float vMix;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = mix(uBrass, uIvory, vMix);
        gl_FragColor = vec4(col * a * vA, a * vA);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  /* ---------- camera choreography ---------- */
  const look = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let mx = 0, my = 0, sp = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // desktop: frame the subject in the left half — the copy lives on the right (RTL)
    if (!small) camera.setViewOffset(w, h, w * 0.2, -h * 0.04, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!state.visible && sp === state.p) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    sp += (state.p - sp) * (reduced ? 1 : 1 - Math.exp(-dt * 4));
    uniforms.uP.value = sp;
    if (!reduced) uniforms.uT.value += dt;

    // high & far over the cloud → low over the parcels → orbit around the building
    const ang = 0.5 + sp * 2.1 + (reduced ? 0 : uniforms.uT.value * 0.04);
    const dist = THREE.MathUtils.lerp(20, small ? 19 : 16, sp);
    const h = THREE.MathUtils.lerp(9, 3.2, Math.min(1, sp * 1.4));
    pos.set(Math.sin(ang) * dist, h, Math.cos(ang) * dist);
    look.set(0, THREE.MathUtils.lerp(0.2, small ? 1.6 : 0.9, sp), 0);
    camera.position.copy(pos).add(new THREE.Vector3(mx * 1.6, -my * 1.0, 0));
    camera.lookAt(look);
    renderer.render(scene, camera);
  }
  frame();
}

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* =====================================================================================
   The city — a fixed WebGL layer behind the whole page. Hundreds of brass wireframe
   towers along an avenue; the page scroll flies the camera down the avenue while
   streams of light (traffic) flow below. Script.js feeds window.__city = { p, on }.
   ===================================================================================== */
const cityCanvas = document.getElementById('city');
if (cityCanvas && hasWebGL()) initCity();

function initCity() {
  const city = window.__city || { p: 0, on: true };
  const small = innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas: cityCanvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.6));
  renderer.setClearColor(0x070605, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(small ? 70 : 58, 1, 0.1, 400);
  const rnd = mulberry32(21);

  const LEN = 300, AVE = 7;                      // avenue length (z) and half-width
  const pts = [], rs = [], kind = [];
  const push = (x, y, z, k) => { pts.push(x, y, z); rs.push(rnd()); kind.push(k); };
  const edge = (a, b, n, k) => { for (let i = 0; i < n; i++) { const t = rnd(); push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, k); } };
  const budget = small ? 0.45 : 1;

  // towers on both sides of the avenue, several rows deep
  for (let z = 10; z > -LEN; z -= 7 + rnd() * 5) {
    for (const side of [-1, 1]) {
      for (let row = 0; row < 3; row++) {
        if (rnd() < 0.18) continue;
        const w = 2.4 + rnd() * 3, d = 2.4 + rnd() * 3;
        const h = (row === 0 ? 6 : 10) + Math.pow(rnd(), 2) * (row === 2 ? 46 : 30);
        const x = side * (AVE + 2 + row * 8 + rnd() * 3);
        const zc = z + (rnd() - 0.5) * 3;
        const c = [[x - w / 2, zc - d / 2], [x + w / 2, zc - d / 2], [x + w / 2, zc + d / 2], [x - w / 2, zc + d / 2]];
        const dens = budget * (row === 2 ? 0.6 : 1);
        // vertical edges
        c.forEach(([cx, cz]) => edge([cx, 0, cz], [cx, h, cz], Math.round(h * 5 * dens), 0));
        // floor rings (windows lines)
        for (let y = 0; y <= h; y += 1.1) {
          if (rnd() > 0.55) continue;
          for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4]; edge([a[0], y, a[1]], [b[0], y, b[1]], Math.round(4 * dens), rnd() < 0.08 ? 2 : 0); }
        }
        // crown
        for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4]; edge([a[0], h, a[1]], [b[0], h, b[1]], Math.round(14 * dens), 2); }
      }
    }
  }
  // ground grid
  for (let z = 10; z > -LEN; z -= 4) edge([-60, 0, z], [60, 0, z], Math.round(40 * budget), 1);
  for (let x = -60; x <= 60; x += 6) edge([x, 0, 10], [x, 0, -LEN], Math.round(120 * budget), 1);
  // traffic: light streams along the avenue (animated in the shader)
  const TRAFFIC = small ? 900 : 2400;
  for (let i = 0; i < TRAFFIC; i++) push((rnd() < 0.5 ? -1 : 1) * (1 + rnd() * (AVE - 2)), 0.15, -rnd() * LEN, 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.setAttribute('aR', new THREE.Float32BufferAttribute(rs, 1));
  geo.setAttribute('aK', new THREE.Float32BufferAttribute(kind, 1));

  const uniforms = { uT: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uLen: { value: LEN }, uCamZ: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aR; attribute float aK;
      uniform float uT; uniform float uPx; uniform float uLen; uniform float uCamZ;
      varying float vA; varying vec3 vC;
      void main(){
        vec3 p = position;
        if (aK > 2.5) {                               // traffic: flows, wraps around the camera
          float dir = p.x > 0.0 ? 1.0 : -1.0;
          p.z = mod(p.z + dir * uT * (6.0 + aR * 10.0) - uCamZ + 20.0, uLen) + uCamZ - uLen + 20.0;
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        float fog = clamp(1.0 - dist / 170.0, 0.0, 1.0);
        float tw = 0.75 + 0.25 * sin(uT * 2.0 + aR * 60.0);
        float base = aK < 0.5 ? 0.55 : aK < 1.5 ? 0.22 : aK < 2.5 ? 1.0 : 1.2;
        vA = base * fog * fog * (aK > 1.5 ? tw : 1.0);
        vC = aK < 0.5 ? vec3(0.78, 0.60, 0.36) : aK < 1.5 ? vec3(0.55, 0.45, 0.32) : aK < 2.5 ? vec3(1.0, 0.86, 0.6) : (p.x > 0.0 ? vec3(1.0, 0.78, 0.45) : vec3(0.95, 0.92, 0.85));
        float s = aK < 0.5 ? 1.2 : aK < 1.5 ? 1.0 : aK < 2.5 ? 2.2 : 3.0;
        gl_PointSize = s * uPx * (14.0 / max(dist, 1.0)) * (0.7 + aR * 0.6) + 0.6;
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying vec3 vC;
      void main(){
        float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * vA;
        gl_FragColor = vec4(vC * a, a);
      }`,
  });
  const cloud = new THREE.Points(geo, mat);
  cloud.frustumCulled = false;
  scene.add(cloud);

  let mx = 0, my = 0, sp = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  const look = new THREE.Vector3(), clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!city.on) return;
    sp += (city.p - sp) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
    if (!reduced) uniforms.uT.value += dt;
    // fly down the avenue: low between the towers, rising for a final aerial view
    const z = 14 - sp * (LEN - 70);
    const rise = Math.pow(Math.max(0, sp - 0.72) / 0.28, 2);
    const y = 4.5 + Math.sin(sp * Math.PI * 3) * 1.5 + rise * 38;
    const x = Math.sin(sp * Math.PI * 2.2) * 2.6;
    camera.position.set(x + mx * 1.8, y - my * 1.2, z);
    look.set(Math.sin(sp * Math.PI * 2.2 + 0.6) * 4, y * (1 - rise * 0.75) + 1.5 - rise * 8, z - 30);
    camera.lookAt(look);
    camera.rotateZ(Math.sin(sp * Math.PI * 4) * 0.05);   // gentle banking
    uniforms.uCamZ.value = z;
    renderer.render(scene, camera);
  })();
}
