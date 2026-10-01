/**
 * scene.js — the WebGL world.
 *
 * One continuous scene the camera flies through as the page scrolls:
 *   bulb (hero) → filament macro → braided cord → distribution panel →
 *   brass wall switch → twisted copper cable → back to the bulb.
 *
 * Everything is procedural (no model files): lathe-turned glass and brass,
 * tube-swept wires, rounded-box breakers, canvas-drawn labels.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BG = 0x060607;
const AMBER = new THREE.Color(1.0, 0.5, 0.16);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* Camera keyframes per chapter. `a` = where the chapter starts, `b` = where it
   drifts to while the chapter is pinned. `focus` = the object (used on mobile,
   where the subject is centred above the text instead of beside it). */
export const KEYFRAMES = {
  hero:      { focus: V(0, 0.55, 0),     a: { pos: V(0, 0.95, 8.4),     look: V(1.35, 0.75, 0) } },
  manifesto: { focus: V(0, -0.1, 0),     a: { pos: V(0.5, 0.05, 2.05),  look: V(0.85, -0.05, 0) },    b: { pos: V(0.05, -0.3, 1.7), look: V(0.8, -0.12, 0) } },
  current:   { focus: V(0, 5.0, -0.8),   a: { pos: V(2.0, 3.0, 2.3),    look: V(0.55, 4.1, -0.6) },    b: { pos: V(1.9, 7.0, 0.6),   look: V(0.45, 7.7, -3.4) } },
  panel:     { focus: V(0, 6.5, -14),    pull: 1.2, a: { pos: V(0.5, 6.75, -5.4),  look: V(2.0, 6.5, -14) },      b: { pos: V(-0.3, 6.45, -6.1), look: V(1.25, 6.45, -14) } },
  safety:    { focus: V(7, 6.5, -20),    a: { pos: V(7.5, 6.8, -13.7),  look: V(8.7, 6.5, -20) },      b: { pos: V(6.95, 6.4, -14.3), look: V(8.15, 6.45, -20) } },
  process:   { focus: V(3.6, 4.2, -16.4),a: { pos: V(1.9, 3.75, -11.2), look: V(3.1, 3.95, -15.4) },   b: { pos: V(4.1, 3.65, -14.4), look: V(6.2, 3.9, -18.2) } },
  contact:   { focus: V(0, 0.55, 0),     a: { pos: V(-1.6, 0.5, 8.6),   look: V(1.2, 0.75, 0) },       b: { pos: V(-1.1, 0.7, 8.0),   look: V(1.2, 0.8, 0) } },
};

const MCB = [
  { label: 'לוחות', rating: 'C25' },
  { label: 'חיבור', rating: 'C32' },
  { label: 'תאורה', rating: 'C10' },
  { label: 'תקלות', rating: 'C16' },
  { label: 'טעינה', rating: 'C32' },
  { label: 'בית חכם', rating: 'C10' },
  { label: 'הארקה', rating: 'C16' },
  { label: 'שיפוץ', rating: 'C20' },
];

export function createScene(canvas, opts = {}) {
  const { mobile = false, reduced = false, onHover = () => {}, onCircuitClick = () => {}, onPowerToggle = () => {} } = opts;
  const high = !mobile;

  /* ---------------------------------------------------------------- renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const maxDpr = mobile ? 1.5 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(BG, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);   // required: transmission samples it (otherwise glass reads milky)
  scene.fog = new THREE.FogExp2(BG, 0.062);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 90);
  camera.position.copy(KEYFRAMES.hero.a.pos);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------------------------------------------------------------- textures */
  function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    t.userData.redraw = () => { draw(c.getContext('2d'), w, h); t.needsUpdate = true; };
    return t;
  }

  // layered value noise — used as bump for plaster, metal and plastic
  const noise = (scale) => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (const [n, s, a] of [[9000, 1, 0.22], [2400, 3, 0.12], [500, 9, 0.06]]) {
      for (let i = 0; i < n; i++) {
        const v = Math.random() * 255 | 0;
        x.fillStyle = `rgba(${v},${v},${v},${a})`;
        x.fillRect(Math.random() * w, Math.random() * h, s, s);
      }
    }
  }, { srgb: false, repeat: [scale, scale] });

  const glowTex = canvasTex(256, 256, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,.45)');
    g.addColorStop(0.5, 'rgba(255,255,255,.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });

  const braidTex = canvasTex(64, 64, (x, w, h) => {
    x.fillStyle = '#161514'; x.fillRect(0, 0, w, h);
    x.lineWidth = 5;
    for (let i = -h; i < w + h; i += 10) {
      x.strokeStyle = '#2a2724'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke();
      x.strokeStyle = '#0c0b0a'; x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke();
    }
  }, { repeat: [160, 2] });

  const earthTex = canvasTex(64, 16, (x, w, h) => {
    x.fillStyle = '#2f7a35'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#d4b51e'; x.fillRect(0, 0, w / 2, h);
  }, { repeat: [90, 1] });

  /* --------------------------------------------------------------- materials */
  const M = {
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a25e, metalness: 1, roughness: 0.3, bumpMap: noise(3), bumpScale: 0.15 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.75, roughness: 0.38, bumpMap: noise(4), bumpScale: 0.2 }),
    wire: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 1, roughness: 0.35 }),
    cord: new THREE.MeshStandardMaterial({ map: braidTex, bumpMap: braidTex, bumpScale: 1.2, roughness: 0.85, metalness: 0.05 }),
    insul: new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.55, metalness: 0.1 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: 0.48, metalness: 0, bumpMap: noise(2), bumpScale: 0.08 }),
    lever: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.36, metalness: 0.05 }),
  };

  /* ================================================================== BULB */
  const bulbPivot = new THREE.Group();          // pendulum pivot at holder top
  bulbPivot.position.set(0, 2.25, 0);
  scene.add(bulbPivot);
  const bulb = new THREE.Group();
  bulb.position.y = -1.25;                       // neck sits 1.25 below pivot
  bulbPivot.add(bulb);

  // glass — Edison ST64 silhouette, profile listed bottom → top so normals face out
  const glassProfile = [[0.001, -1.96], [0.18, -1.93], [0.38, -1.84], [0.55, -1.68], [0.65, -1.45], [0.68, -1.2], [0.66, -0.98], [0.58, -0.7], [0.46, -0.45], [0.36, -0.25], [0.31, -0.1], [0.3, 0]];
  const glassPts = new THREE.SplineCurve(glassProfile.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(90);
  const glassMat = high
    ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.06, ior: 1.5, attenuationColor: new THREE.Color(0xffd9ad), attenuationDistance: 2.5, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.4 })
    : new THREE.MeshPhysicalMaterial({ color: 0xfff0dc, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, envMapIntensity: 2.6, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(glassPts, 110), glassMat);
  glass.userData.pick = { type: 'bulb' };
  bulb.add(glass);

  // brass screw base with real thread profile
  const thread = [new THREE.Vector2(0.285, -0.03), new THREE.Vector2(0.318, -0.01)];
  for (let i = 0; i <= 140; i++) {
    const y = i / 140 * 0.5;
    thread.push(new THREE.Vector2(0.31 + 0.02 * Math.sin(y * Math.PI * 2 * 11), y));
  }
  thread.push(new THREE.Vector2(0.3, 0.52), new THREE.Vector2(0.27, 0.54));
  bulb.add(new THREE.Mesh(new THREE.LatheGeometry(thread, 72), M.brass));

  // lamp holder: matte black, knurled brass ring, strain relief
  const holderProfile = [[0.34, 0.3], [0.385, 0.33], [0.385, 0.6], [0.4, 0.62], [0.4, 0.7], [0.385, 0.72], [0.385, 0.96], [0.3, 1.03], [0.12, 1.09], [0.06, 1.16], [0.046, 1.25]];
  bulb.add(new THREE.Mesh(new THREE.LatheGeometry(holderProfile.map(([r, y]) => new THREE.Vector2(r, y)), 72), M.blackMetal));
  for (const y of [0.635, 0.685]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.401, 0.012, 10, 90), M.brass);
    ring.rotation.x = Math.PI / 2; ring.position.y = y; bulb.add(ring);
  }

  // inner glass stem
  const stemPts = [[0.001, -0.66], [0.025, -0.62], [0.04, -0.45], [0.075, -0.15], [0.09, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  bulb.add(new THREE.Mesh(new THREE.LatheGeometry(stemPts, 24), new THREE.MeshStandardMaterial({ color: 0xd9c9b2, roughness: 0.1, transparent: true, opacity: 0.28, depthWrite: false })));

  // squirrel-cage filament: zig-zag between two rings, with a coiled wire swept around it
  const PEAKS = 20, TOP = -0.8, BOT = -1.36, FR = 0.2;
  const zig = [];
  for (let k = 0; k <= PEAKS; k++) {
    const a = k / PEAKS * Math.PI * 2;
    zig.push(V(Math.cos(a) * FR, k % 2 ? BOT : TOP, Math.sin(a) * FR));
  }
  const coil = [];
  for (let k = 0; k < PEAKS; k++) {
    const p0 = zig[k], p1 = zig[k + 1];
    const d = p1.clone().sub(p0).normalize();
    const radial = p0.clone().add(p1).setY(0).normalize();
    const n = new THREE.Vector3().crossVectors(d, radial).normalize();
    const b = new THREE.Vector3().crossVectors(d, n).normalize();
    const STEPS = 220;
    for (let s = 0; s < STEPS; s++) {
      const t = s / STEPS, ang = t * Math.PI * 2 * 34;
      coil.push(p0.clone().lerp(p1, t).addScaledVector(n, Math.cos(ang) * 0.007).addScaledVector(b, Math.sin(ang) * 0.007));
    }
  }
  const filamentMat = new THREE.MeshBasicMaterial({ color: AMBER.clone() });
  const filament = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), coil.length, 0.0032, 4, false), filamentMat);
  bulb.add(filament);

  // support wires
  const supports = [];
  const addWire = (a, b, r = 0.0022) => supports.push(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, r, 4), M.wire));
  addWire(V(0, -0.64, 0), V(0, -1.42, 0), 0.004);
  zig.slice(0, PEAKS).forEach((p, k) => addWire(V(0, k % 2 ? -1.41 : -0.64, 0), p));
  supports.forEach((m) => bulb.add(m));

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: AMBER, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 }));
  halo.position.set(0, -1.08, 0); halo.scale.setScalar(2.1);
  bulb.add(halo);

  const bulbLight = new THREE.PointLight(0xffa04a, 0, 14, 2);
  bulbLight.position.set(0, -1.08, 0);
  bulb.add(bulbLight);

  /* ================================================================ CORD + PULSES */
  function pulseMaterial(color, { speed = 0.25, density = 6, intensity = 2.5 } = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uI: { value: intensity }, uSpeed: { value: speed }, uDensity: { value: density } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime, uI, uSpeed, uDensity; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          float x = fract(vUv.x * uDensity - uTime * uSpeed);
          float p = smoothstep(0.0, 0.015, x) * pow(1.0 - x, 22.0);
          float rim = 0.55 + 0.45 * sin(vUv.y * 6.2831);
          gl_FragColor = vec4(uColor * p * uI * rim, p);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
  }
  const pulseMats = [];

  const cordCurve = new THREE.CatmullRomCurve3([V(0, 2.22, 0), V(0, 3.6, 0), V(0, 5.6, -0.3), V(0, 7.6, -1.6), V(0, 9.3, -4.5), V(0.2, 9.5, -9), V(0.2, 9.7, -12.6), V(0.2, 9.2, -13.95), V(0.2, 8.02, -14.0)], false, 'centripetal');
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 600, 0.038, 12), M.cord));
  const cordPulse = pulseMaterial(0xffb066, { speed: -0.18, density: 5, intensity: 3.2 });
  pulseMats.push(cordPulse);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 600, 0.046, 10), cordPulse));

  /* ================================================================== PANEL */
  const panel = new THREE.Group();
  panel.position.set(0, 6.5, -14);
  scene.add(panel);
  const pickables = [glass];

  const enclosure = new THREE.Mesh(new RoundedBoxGeometry(4.5, 3.3, 0.55, 4, 0.08), new THREE.MeshStandardMaterial({ color: 0x1a1b1e, metalness: 0.7, roughness: 0.44, bumpMap: noise(5), bumpScale: 0.25 }));
  enclosure.position.z = -0.12;
  enclosure.receiveShadow = true;
  panel.add(enclosure);

  const coverMat = new THREE.MeshStandardMaterial({ color: 0x26282c, metalness: 0.55, roughness: 0.5, bumpMap: noise(6), bumpScale: 0.2 });
  const W = 4.15, H = 2.95, SW = 3.66, SH = 0.68, SY = 0.05, CZ = 0.2, CT = 0.035;
  const coverBox = (w, h, x, y) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, CT, 2, 0.012), coverMat);
    m.position.set(x, y, CZ); m.receiveShadow = true; panel.add(m);
  };
  coverBox(W, H / 2 - (SY + SH / 2), 0, (H / 2 + SY + SH / 2) / 2);
  coverBox(W, SY - SH / 2 + H / 2, 0, (-H / 2 + SY - SH / 2) / 2);
  coverBox((W - SW) / 2, SH, SW / 2 + (W - SW) / 4, SY);
  coverBox((W - SW) / 2, SH, -(SW / 2 + (W - SW) / 4), SY);

  const recess = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH + 0.6), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.9 }));
  recess.position.set(0, SY, 0.02); panel.add(recess);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.1, 0.13, 0.03), new THREE.MeshStandardMaterial({ color: 0xb8bbc0, metalness: 1, roughness: 0.28 }));
  rail.position.set(0, SY, 0.05); panel.add(rail);

  // cover screws
  for (const [x, y] of [[1.92, 1.32], [-1.92, 1.32], [1.92, -1.32], [-1.92, -1.32]]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 20), M.brass);
    s.rotation.x = Math.PI / 2; s.position.set(x, y, CZ + 0.025); panel.add(s);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.01), M.lever);
    slot.position.set(x, y, CZ + 0.04); slot.rotation.z = Math.random() * Math.PI; panel.add(slot);
  }

  // breaker face print (rating, voltage, tiny wiring symbol)
  const faceTex = (rating, small) => canvasTex(128, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#2a2a2a'; x.textAlign = 'center';
    x.font = '600 30px "JetBrains Mono", monospace'; x.fillText(rating, w / 2, h - 34);
    x.font = '400 13px "JetBrains Mono", monospace'; x.fillText(small, w / 2, h - 14);
    x.fillText('ZRM', w / 2, 28);
    x.strokeStyle = '#2a2a2a'; x.lineWidth = 2;
    x.strokeRect(w / 2 - 14, 40, 28, 18);
  });

  const modules = [{ kind: 'main', w: 0.58, rating: '3×40A', small: '400V~' }, { kind: 'rcd', w: 0.58, rating: '30mA', small: 'ΔI 0.03A' }, ...MCB.map((m) => ({ kind: 'mcb', w: 0.3, rating: m.rating, small: '230V~', label: m.label }))];
  const breakers = [];
  const GAP = 0.006;
  let xc = SW / 2 - 0.01;
  modules.forEach((mod, idx) => {
    const x = xc - mod.w / 2;
    xc -= mod.w + GAP;
    const g = new THREE.Group();
    g.position.set(x, SY, 0);
    panel.add(g);

    const body = new THREE.Mesh(new RoundedBoxGeometry(mod.w - 0.012, 0.98, 0.3, 3, 0.03), M.plastic);
    body.position.z = 0.06; g.add(body);
    const nose = new THREE.Mesh(new RoundedBoxGeometry(mod.w - 0.016, 0.62, 0.17, 3, 0.022), M.plastic);
    nose.position.z = 0.24; nose.castShadow = nose.receiveShadow = true; g.add(nose);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(mod.w - 0.04, 0.58), new THREE.MeshStandardMaterial({ map: faceTex(mod.rating, mod.small), transparent: true, roughness: 0.6 }));
    face.position.z = 0.3255; g.add(face);

    // status window (red = off / green = on)
    const status = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(0.12, mod.w * 0.4), 0.05), new THREE.MeshBasicMaterial({ color: 0x8a1b1b }));
    status.position.set(0, 0.215, 0.327); g.add(status);

    // LED
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(1, 0.62, 0.3), emissiveIntensity: 0 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.017, 16, 12), ledMat);
    led.position.set(0, -0.235, 0.325); g.add(led);

    // lever on pivot
    const leverColor = mod.kind === 'main' ? 0x9b1518 : mod.kind === 'rcd' ? 0x1d3a6b : 0x18181a;
    const pivot = new THREE.Group(); pivot.position.set(0, 0, 0.31); g.add(pivot);
    const lever = new THREE.Mesh(new RoundedBoxGeometry(mod.w * (mod.kind === 'mcb' ? 0.55 : 0.75), 0.14, 0.13, 2, 0.022), M.lever.clone());
    lever.material.color.setHex(leverColor);
    lever.position.z = 0.06; lever.castShadow = true; pivot.add(lever);

    if (mod.kind === 'rcd') {
      const test = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0xd9b21c, roughness: 0.4 }));
      test.rotation.x = Math.PI / 2; test.position.set(0.17, -0.2, 0.335); g.add(test);
    }

    const b = { group: g, pivot, led: ledMat, status: status.material, angle: 0.55, on: false, kind: mod.kind, circuit: mod.kind === 'mcb' ? idx - 2 : -1, glow: 0 };
    if (b.circuit >= 0) {
      nose.userData.pick = lever.userData.pick = face.userData.pick = { type: 'breaker', index: b.circuit };
      pickables.push(nose, lever, face);
    }
    breakers.push(b);
  });

  // printed label strip above the row (Hebrew, RTL — right-most is circuit 01)
  const labelTex = canvasTex(2048, 96, (x, w, h) => {
    x.fillStyle = '#e7dfcf'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1b1a18'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.direction = 'rtl';
    const k = w / SW;
    let cx = SW / 2 - 0.01;
    modules.forEach((mod, i) => {
      const center = cx - mod.w / 2; cx -= mod.w + GAP;
      const px = (center + SW / 2) * k;
      const text = mod.kind === 'main' ? 'ראשי' : mod.kind === 'rcd' ? 'פחת' : mod.label;
      x.font = `500 ${mod.kind === 'mcb' ? 40 : 46}px Heebo, Arial, sans-serif`;
      x.fillText(text, px, h * 0.58);
      x.font = '400 18px "JetBrains Mono", monospace';
      x.fillText(String(i).padStart(2, '0'), px, h * 0.18);
      x.fillRect((cx + GAP / 2 + SW / 2) * k, 10, 2, h - 20);
    });
  });
  const labelStrip = new THREE.Mesh(new THREE.PlaneGeometry(SW, 0.17), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.7 }));
  labelStrip.position.set(0, SY + SH / 2 + 0.16, CZ + CT / 2 + 0.002);
  panel.add(labelStrip);

  const plateTex = canvasTex(512, 64, (x, w, h) => {
    x.fillStyle = '#1c1d20'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#b89a66'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '500 26px "JetBrains Mono", monospace';
    x.fillText('ZEREM · 3×80A · IEC 61439', w / 2, h / 2);
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.21), new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.6, roughness: 0.35 }));
  plate.position.set(0, -1.05, CZ + CT / 2 + 0.002); panel.add(plate);

  // cable bundle leaving the top of the panel
  [-1.5, -0.9, -0.35, 0.75, 1.3].forEach((x0, i) => {
    const c = new THREE.CatmullRomCurve3([V(x0, 1.62, -0.1), V(x0 * 1.05, 2.4, -0.2), V(x0 * 1.3, 4.0, -1.2), V(x0 * 1.6, 6.5, -2.0)]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 60, 0.05 + (i % 2) * 0.012, 10), M.insul);
    panel.add(m);
  });

  const panelSpot = new THREE.SpotLight(0xfff1dd, 28, 16, 0.5, 0.8, 1.6);
  panelSpot.position.set(1.4, 10.2, -9.8);
  panelSpot.target.position.set(0, 6.3, -14);
  panelSpot.castShadow = high;
  panelSpot.shadow.mapSize.set(1024, 1024);
  panelSpot.shadow.bias = -0.0004;
  panelSpot.shadow.camera.near = 1; panelSpot.shadow.camera.far = 14;
  scene.add(panelSpot, panelSpot.target);

  /* =========================================================== WALL SWITCH */
  const wallG = new THREE.Group();
  wallG.position.set(7, 6.5, -20);
  scene.add(wallG);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 11), new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.93, bumpMap: noise(7), bumpScale: 1.4 }));
  wall.receiveShadow = true;
  wallG.add(wall);

  const brassPlate = new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.06, 0.07, 4, 0.03), new THREE.MeshStandardMaterial({ color: 0xbe9b62, metalness: 1, roughness: 0.27, bumpMap: noise(1.2), bumpScale: 0.12 }));
  brassPlate.position.z = 0.035; brassPlate.castShadow = true;
  wallG.add(brassPlate);

  const inset = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.8, 0.03, 3, 0.02), new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.5 }));
  inset.position.set(0.48, 0, 0.07); wallG.add(inset);
  const rockerPivot = new THREE.Group(); rockerPivot.position.set(0.48, 0, 0.1); wallG.add(rockerPivot);
  const rocker = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.68, 0.09, 5, 0.04), new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.5, metalness: 0.1 }));
  rocker.castShadow = true;
  rockerPivot.add(rocker);
  rocker.userData.pick = { type: 'rocker' };
  pickables.push(rocker, inset);
  inset.userData.pick = { type: 'rocker' };
  const locatorMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(1, 0.55, 0.2), emissiveIntensity: 2.5 });
  const locator = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.01), locatorMat);
  locator.position.set(0, -0.27, 0.05); rockerPivot.add(locator);

  // Israeli type-H socket
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 48), new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.35 }));
  sock.rotation.x = Math.PI / 2; sock.position.set(-0.48, 0, 0.08); wallG.add(sock);
  for (const [x, y] of [[0, 0.1], [-0.095, -0.075], [0.095, -0.075]]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.052, 20), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    h.rotation.x = Math.PI / 2; h.position.set(-0.48 + x, y, 0.085); wallG.add(h);
  }

  const washer = new THREE.SpotLight(0xffc68a, 0, 12, 0.62, 1, 1.4);
  washer.position.set(7.2, 10.6, -19.45);
  washer.target.position.set(7.2, 4.2, -20);
  washer.castShadow = high;
  washer.shadow.mapSize.set(1024, 1024);
  washer.shadow.bias = -0.0004;
  scene.add(washer, washer.target);
  const ledLineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
  const ledLine = new THREE.Mesh(new THREE.BoxGeometry(7, 0.025, 0.025), ledLineMat);
  ledLine.position.set(0, 3.6, 0.03); wallG.add(ledLine);
  const switchFill = new THREE.PointLight(0x8fa6ff, 6, 9, 2);
  switchFill.position.set(4.5, 7.5, -16.5);
  scene.add(switchFill);

  /* ================================================= TWISTED COPPER CABLE */
  const procCurve = new THREE.CatmullRomCurve3([V(1.8, 4.95, -14.05), V(2.5, 3.7, -14.8), V(4.2, 3.9, -16.8), V(5.4, 5.2, -18.9), V(6.05, 6.0, -19.95)], false, 'centripetal');
  const N = 700, frames = procCurve.computeFrenetFrames(N, false);
  const strands = [[], [], []];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = procCurve.getPointAt(t), a = t * Math.PI * 2 * 18;
    for (let s = 0; s < 3; s++) {
      const ang = a + s * Math.PI * 2 / 3;
      strands[s].push(p.clone().addScaledVector(frames.normals[i], Math.cos(ang) * 0.05).addScaledVector(frames.binormals[i], Math.sin(ang) * 0.05));
    }
  }
  const strandMats = [
    new THREE.MeshStandardMaterial({ color: 0x5e3216, roughness: 0.38, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x1d4b8c, roughness: 0.38, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.38, metalness: 0.05 }),
  ];
  strands.forEach((pts, s) => scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, 0.042, 10), strandMats[s])));
  // exposed copper tip where it meets the panel
  const tip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V(1.75, 5.15, -14.0), V(1.8, 4.92, -14.05)), 1, 0.03, 10), new THREE.MeshStandardMaterial({ color: 0xc8784a, metalness: 1, roughness: 0.25 }));
  scene.add(tip);
  const procPulse = pulseMaterial(0xffc27a, { speed: 0.22, density: 7, intensity: 3.6 });
  pulseMats.push(procPulse);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(procCurve, 500, 0.11, 12), procPulse));

  /* ============================================================ LIGHTING */
  scene.add(new THREE.HemisphereLight(0x8090b0, 0x0a0806, 0.22));
  const rim = new THREE.DirectionalLight(0x7d98ff, 1.1);
  rim.position.set(-6, 8, -10);
  scene.add(rim);
  const key = new THREE.SpotLight(0xffe3c4, 45, 14, 0.42, 0.9, 1.5);
  key.position.set(3.5, 4.5, 4.5);
  key.target.position.set(0, 0.2, 0);
  scene.add(key, key.target);

  const cull = [
    { obj: panel, at: panel.position, r: 15.5 },
    { obj: wallG, at: wallG.position, r: 12.5 },
    { obj: bulbPivot, at: V(0, 1, 0), r: 16 },
  ];

  /* ========================================================= PARTICLES */
  // dust motes distributed along the camera route
  const routePts = Object.values(KEYFRAMES).flatMap((k) => [k.a.pos, k.a.look, ...(k.b ? [k.b.pos, k.b.look] : [])]);
  const DUST = mobile ? 900 : 1800;
  const dPos = new Float32Array(DUST * 3), dSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const a = routePts[i % routePts.length], b = routePts[(i * 7 + 3) % routePts.length];
    const p = a.clone().lerp(b, Math.random());
    dPos[i * 3] = p.x + (Math.random() - 0.5) * 5;
    dPos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 4;
    dPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 5;
    dSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 26 * dpr }, uColor: { value: new THREE.Color(1.0, 0.78, 0.55) } },
    vertexShader: `attribute float aSeed; uniform float uTime, uSize; varying float vA;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.18 + aSeed * 40.0) * 0.25;
        p.x += cos(uTime * 0.13 + aSeed * 23.0) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.25 + aSeed) / -mv.z;
        vA = smoothstep(16.0, 1.5, -mv.z) * smoothstep(0.3, 1.2, -mv.z) * (0.15 + 0.6 * aSeed) * (0.6 + 0.4 * sin(uTime * (0.5 + aSeed) + aSeed * 9.0));
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  // sparks
  const SPK = 600;
  const sPos = new Float32Array(SPK * 3), sVel = new Float32Array(SPK * 3), sLife = new Float32Array(SPK), sRate = new Float32Array(SPK);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sparkGeo.setAttribute('aLife', new THREE.BufferAttribute(sLife, 1).setUsage(THREE.DynamicDrawUsage));
  const sparkMat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 34 * dpr } },
    vertexShader: `attribute float aLife; uniform float uSize; varying float vL;
      void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aLife > 0.0 ? uSize * (0.3 + aLife) / -mv.z : 0.0; }`,
    fragmentShader: `varying float vL;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d);
        vec3 c = mix(vec3(1.0, 0.35, 0.06), vec3(1.0, 0.92, 0.75), vL * vL) * (2.0 + 4.0 * vL);
        gl_FragColor = vec4(c * a, a * vL); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.frustumCulled = false;
  scene.add(sparks);
  let sCursor = 0;
  function emitSparks(origin, n, speed = 2.2, up = 0.6) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const i = sCursor++ % SPK;
      const d = V(Math.random() - 0.5, Math.random() - 0.5 + up, Math.random() - 0.5 + 0.3).normalize().multiplyScalar(speed * (0.3 + Math.random()));
      sPos.set([origin.x, origin.y, origin.z], i * 3);
      sVel.set([d.x, d.y, d.z], i * 3);
      sLife[i] = 1; sRate[i] = 0.7 + Math.random() * 1.4;
    }
  }

  /* ========================================================== TIMELINE */
  let controls = [];
  let posCurve = null, lookCurve = null;
  const isPortrait = () => camera.aspect < 0.85;

  function frameFor(name, which) {
    const k = KEYFRAMES[name];
    const s = (which === 'b' && k.b) ? k.b : k.a;
    if (!isPortrait()) return { pos: s.pos.clone(), look: s.look.clone() };
    // portrait: subject centred in the upper half, camera pulled back
    const dir = s.pos.clone().sub(k.focus);
    const dist = dir.length();
    const pos = k.focus.clone().addScaledVector(dir.normalize(), dist * (k.pull ?? 1.55));
    const look = k.focus.clone(); look.y -= dist * 0.26;
    return { pos, look };
  }

  /** anchors: [{ name, start, end }] in scroll pixels, in page order */
  function setTimeline(anchors) {
    controls = [];
    anchors.forEach(({ name, start, end }) => {
      controls.push({ y: start, ...frameFor(name, 'a'), hold: end - start > 2 });
      if (end - start > 2) controls.push({ y: end, ...frameFor(name, 'b'), hold: false });
    });
    posCurve = new THREE.CatmullRomCurve3(controls.map((c) => c.pos), false, 'centripetal');
    lookCurve = new THREE.CatmullRomCurve3(controls.map((c) => c.look), false, 'centripetal');
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  function sample(y) {
    const n = controls.length;
    if (n < 2) return null;
    let i = 0;
    while (i < n - 2 && y >= controls[i + 1].y) i++;
    const a = controls[i], b = controls[i + 1];
    let t = THREE.MathUtils.clamp((y - a.y) / Math.max(1, b.y - a.y), 0, 1);
    t = a.hold ? easeSine(t) : ease(t);
    const u = (i + t) / (n - 1);
    return { pos: posCurve.getPoint(u), look: lookCurve.getPoint(u) };
  }

  /* ========================================================= INTERACTION */
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let hover = null;

  function setPointer(nx, ny) { pointer.set(nx, ny); mouse.x = nx; mouse.y = ny; }
  function pickAt() {
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit && hit.distance < 16 ? hit.object.userData.pick : null;
  }
  function click() {
    const info = pickAt();
    if (!info) return false;
    if (info.type === 'bulb') {
      state.flicker = 0.45;
      emitSparks(filament.getWorldPosition(V(0, 0, 0)).add(V(0, -1.08, 0)), 90, 2.4, 0.2);
    } else if (info.type === 'breaker') onCircuitClick(info.index);
    else if (info.type === 'rocker') onPowerToggle();
    return true;
  }

  /* ============================================================== STATE */
  const state = {
    ignition: reduced ? 1 : 0,  // 0 → 1 during intro
    flicker: 0,
    panel: 0,                    // panel chapter progress 0..1
    highlight: -1,               // circuit index currently highlighted
    power: false,                // wall switch
    intro: reduced ? 1 : 0,
  };

  /* ============================================================= RESIZE */
  let w = 1, h = 1;
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloom.resolution.set(w * dpr / 2, h * dpr / 2);
    camera.aspect = w / h;
    camera.fov = isPortrait() ? 44 : 32;
    camera.updateProjectionMatrix();
    dustMat.uniforms.uSize.value = 26 * dpr * (h / 900);
    sparkMat.uniforms.uSize.value = 34 * dpr * (h / 900);
  }

  /* ============================================================= RENDER */
  const camPos = camera.position.clone(), camLook = KEYFRAMES.hero.a.look.clone();
  const tmp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const filamentWorld = new THREE.Vector3();
  let time = 0, lastHoverCheck = 0, frameAvg = 16, lowFrames = 0;

  function render(scrollY, dt) {
    dt = Math.min(dt, 0.05);
    time += dt;

    // intro: ignition flicker + camera dolly from the dark
    if (!reduced && state.intro < 1) state.intro = Math.min(1, state.intro + dt / 3.2);
    if (!reduced && state.ignition < 1) {
      const prev = state.ignition;
      state.ignition = Math.min(1, state.ignition + dt / 2.2);
      if (prev < 0.42 && state.ignition >= 0.42) emitSparks(filament.getWorldPosition(filamentWorld).add(V(0, -1.08, 0)), 70, 2.0, 0.1);
    }

    // camera
    const s = sample(scrollY);
    if (s) {
      if (state.intro < 1) {
        const k = 1 - ease(state.intro);
        s.pos.add(tmp.set(-0.6 * k, 1.4 * k, 6 * k));
      }
      mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 3));
      mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 3));
      const fwd = tmp.copy(s.look).sub(s.pos);
      const dist = fwd.length();
      right.crossVectors(fwd.normalize(), camera.up).normalize();
      up.crossVectors(right, fwd).normalize();
      const par = reduced ? 0 : Math.min(1, dist / 6);
      s.pos.addScaledVector(right, mouse.sx * 0.32 * par).addScaledVector(up, mouse.sy * 0.2 * par);
      s.look.addScaledVector(right, mouse.sx * 0.08 * par);
      const k = reduced ? 1 : 1 - Math.exp(-dt * 9);
      camPos.lerp(s.pos, k); camLook.lerp(s.look, k);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
    }

    // bulb: ignition curve, hover flare, click flicker, proximity dimming
    const ig = state.ignition;
    let p = ig < 1 ? (ig < 0.15 ? 0 : ig < 0.42 ? (Math.sin(ig * 140) > 0.2 ? 0.55 : 0.04) * (ig / 0.42) : 0.35 + 0.65 * ease((ig - 0.42) / 0.58)) : 1;
    if (state.flicker > 0) { state.flicker -= dt; p *= Math.sin(time * 90) > 0 ? 1.25 : 0.25; }
    const flare = hover && hover.type === 'bulb' ? 1.3 : 1;
    state.flare = (state.flare ?? 1) + (flare - (state.flare ?? 1)) * (1 - Math.exp(-dt * 6));
    filament.getWorldPosition(filamentWorld); filamentWorld.y -= 1.08;
    const prox = THREE.MathUtils.clamp(camera.position.distanceTo(filamentWorld) / 3.6, 0.3, 1);
    const breath = reduced ? 1 : 1 + Math.sin(time * 1.7) * 0.03 + Math.sin(time * 23) * 0.008;
    const P = p * state.flare * breath;
    filamentMat.color.copy(AMBER).multiplyScalar(0.05 + P * 6 * prox);
    halo.material.opacity = 0.15 * P * prox;
    bulbLight.intensity = P * 26;

    // pendulum sway
    if (!reduced) {
      bulbPivot.rotation.z = Math.sin(time * 0.55) * 0.018 - mouse.sx * 0.03;
      bulbPivot.rotation.x = Math.cos(time * 0.42) * 0.012 + mouse.sy * 0.02;
    }

    // breakers follow panel progress
    const pp = state.panel;
    breakers.forEach((b, i) => {
      const thresh = b.kind === 'main' ? 0.02 : b.kind === 'rcd' ? 0.06 : 0.11 + b.circuit * 0.1;
      const on = pp > thresh;
      if (on !== b.on) {
        b.on = on;
        if (on && camera.position.distanceTo(panel.position) < 12) {
          const wp = b.group.getWorldPosition(V(0, 0, 0)); wp.z += 0.4;
          emitSparks(wp, 18, 1.5, 0.4);
        }
      }
      const target = on ? -0.55 : 0.55;
      b.angle += (target - b.angle) * (1 - Math.exp(-dt * (reduced ? 60 : 16)));
      b.pivot.rotation.x = b.angle;
      b.status.color.setHex(on ? 0x1f7a3b : 0x8a1b1b);
      const hl = b.circuit >= 0 && b.circuit === state.highlight ? 1 : 0;
      b.glow += (hl - b.glow) * (1 - Math.exp(-dt * 8));
      b.led.emissiveIntensity = (on ? 2.2 : 0) + b.glow * (5 + Math.sin(time * 8) * 1.5);
      b.group.position.z = b.glow * 0.06;
    });

    // wall switch
    state.pw = (state.pw ?? 0) + ((state.power ? 1 : 0) - (state.pw ?? 0)) * (1 - Math.exp(-dt * (reduced ? 60 : 5)));
    rockerPivot.rotation.x = state.power ? 0.1 : -0.1;
    washer.intensity = state.pw * 70;
    ledLineMat.color.copy(AMBER).multiplyScalar(state.pw * 6);
    locatorMat.emissiveIntensity = 2.5 * (1 - state.pw);
    switchFill.intensity = 6 + state.pw * 4;

    // distance culling — keeps far chapters from ghosting through the fog
    cull.forEach((c) => { c.obj.visible = camera.position.distanceTo(c.at) < c.r; });

    // shaders
    const tSec = reduced ? 0 : time;
    pulseMats.forEach((m) => { m.uniforms.uTime.value = tSec; });
    procPulse.uniforms.uI.value = 2.4 + state.pw * 2.4;
    dustMat.uniforms.uTime.value = tSec;

    // sparks
    let alive = false;
    for (let i = 0; i < SPK; i++) {
      if (sLife[i] <= 0) continue;
      alive = true;
      sVel[i * 3 + 1] -= 5.5 * dt;
      const drag = 1 - dt * 0.8;
      sVel[i * 3] *= drag; sVel[i * 3 + 1] *= drag; sVel[i * 3 + 2] *= drag;
      sPos[i * 3] += sVel[i * 3] * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt;
      sLife[i] = Math.max(0, sLife[i] - dt * sRate[i]);
    }
    if (alive) { sparkGeo.attributes.position.needsUpdate = true; sparkGeo.attributes.aLife.needsUpdate = true; }

    // hover picking (throttled)
    if (time - lastHoverCheck > 0.06) {
      lastHoverCheck = time;
      const info = pickAt();
      const key = info ? info.type + (info.index ?? '') : '';
      const prevKey = hover ? hover.type + (hover.index ?? '') : '';
      if (key !== prevKey) { hover = info; onHover(info); }
    }

    composer.render(dt);

    // adaptive resolution: if we can't hold ~40fps, shed pixels
    frameAvg = frameAvg * 0.95 + dt * 1000 * 0.05;
    if (frameAvg > 26 && dpr > 1) {
      if (++lowFrames > 90) { dpr = Math.max(1, dpr - 0.25); lowFrames = 0; resize(); }
    } else lowFrames = 0;
  }

  // redraw canvas labels once web fonts are in
  function refreshLabels() {
    labelTex.userData.redraw(); plateTex.userData.redraw();
    breakers.forEach((b) => b.group.children.forEach((c) => c.material?.map?.userData?.redraw?.()));
  }

  resize();
  return { render, resize, setTimeline, setPointer, click, state, refreshLabels, renderer, debug: { halo, bloom, glass, glassMat, bulbLight, filamentMat, scene } };
}
