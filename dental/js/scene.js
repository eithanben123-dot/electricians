/**
 * scene.js — the clinic's WebGL layer.
 *
 * Three stages share one transparent canvas (fixed behind the page):
 *   hero    — a sculpted molar under studio light, with a quiet digital-scan sweep
 *   implant — crown / abutment / titanium implant, exploded by scroll
 *   arch    — a full dental arch that assembles tooth by tooth (the process)
 * Plus `renderSmiles()` — renders the before/after "intra-oral" simulations
 * into images once, off-screen.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeMaterials, makeTooth, makeImplant, makeAbutment, makeArch, makeGum, crownGeometry } from './teeth.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const BLUE = new THREE.Color('#2f6fd6');

function studio(renderer, scene, envIntensity = 0.95) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = envIntensity;
  const key = new THREE.DirectionalLight('#ffffff', 1.6); key.position.set(4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight('#bcd4ff', 1.4); rim.position.set(-6, 3, -5); scene.add(rim);
  const fill = new THREE.HemisphereLight('#ffffff', '#c9d6ea', 0.6); scene.add(fill);
}

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(20,40,80,0.32)'); g.addColorStop(0.45, 'rgba(20,40,80,0.12)'); g.addColorStop(1, 'rgba(20,40,80,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createDentalScene(canvas, { mobile = false, reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.8);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  studio(renderer, scene);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.4, 11);

  const seg = mobile ? 64 : 112;
  const mats = makeMaterials();
  const shadowTex = shadowTexture();
  const contactShadow = (w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m; };

  /* ------------------------------------------------------------ hero molar */
  const hero = new THREE.Group(); scene.add(hero);
  const heroSpin = new THREE.Group(); hero.add(heroSpin);
  const molar = makeTooth('molar', mats, { seg });
  molar.position.y = -0.25;
  heroSpin.add(molar);
  const heroShadow = contactShadow(4.2); heroShadow.position.y = -2.6; hero.add(heroShadow);

  // digital scan: a soft ring of light that sweeps the tooth, and a sparse point cloud
  const scanMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: BLUE.clone() }, uAlpha: { value: 0.0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying vec2 vUv;
      void main(){ float r = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.86, r) * smoothstep(0.55, 0.9, r) * uAlpha; gl_FragColor = vec4(uColor, a); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), scanMat);
  scan.rotation.x = -Math.PI / 2; hero.add(scan);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#7fa7e8', transparent: true, opacity: 0.35 });
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.006, 6, 220), ringMat);
  orbit.rotation.set(1.25, 0.25, 0); hero.add(orbit);
  const pc = [];
  for (let i = 0; i < 260; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), r = 2.0 + Math.random() * 0.9;
    pc.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v) * 0.9, r * Math.sin(v) * Math.sin(u));
  }
  const pcGeo = new THREE.BufferGeometry(); pcGeo.setAttribute('position', new THREE.Float32BufferAttribute(pc, 3));
  const dots = new THREE.Points(pcGeo, new THREE.PointsMaterial({ color: '#5b8ee0', size: 0.028, transparent: true, opacity: 0.55, depthWrite: false }));
  hero.add(dots);

  /* ------------------------------------------------------------ implant stage */
  const implant = new THREE.Group(); implant.visible = false; scene.add(implant);
  const implantSpin = new THREE.Group(); implant.add(implantSpin);
  const iCrown = new THREE.Mesh(crownGeometry('molar', { seg }), mats.enamel); iCrown.scale.setScalar(0.92);
  const iAbut = makeAbutment(mats);
  const iScrew = makeImplant(mats, { seg: mobile ? 32 : 48 });
  implantSpin.add(iCrown, iAbut, iScrew);
  const implantShadow = contactShadow(3.2); implantShadow.position.y = -3.4; implant.add(implantShadow);
  const anchors = { crown: new THREE.Object3D(), abutment: new THREE.Object3D(), implant: new THREE.Object3D() };
  anchors.crown.position.set(0.9, 0.55, 0); iCrown.add(anchors.crown);
  anchors.abutment.position.set(0.32, 0.3, 0); iAbut.add(anchors.abutment);
  anchors.implant.position.set(0.36, -0.9, 0); iScrew.add(anchors.implant);

  /* ------------------------------------------------------------ arch stage */
  const archStage = new THREE.Group(); archStage.visible = false; scene.add(archStage);
  const arch = makeArch(mats, { seg: mobile ? 40 : 64 });
  arch.group.scale.setScalar(0.25);
  archStage.add(arch.group);
  arch.teeth.forEach((t) => t.mesh.children.slice(1).forEach((root) => { root.visible = false; }));
  // frosted plinth following the arch — the teeth seat into it like a digital model
  {
    const xs = arch.teeth.map((t) => t.home.pos.x), a = 0.13, half = 0.95;
    const x0 = Math.min(...xs) - 0.7, x1 = Math.max(...xs) + 0.7;
    const at = (x, off) => { const n = new THREE.Vector2(2 * a * x, 1).normalize(); return new THREE.Vector2(x + n.x * off, -a * x * x + n.y * off); };
    const shape = new THREE.Shape();
    for (let i = 0; i <= 80; i++) { const p = at(x0 + (x1 - x0) * (i / 80), half); i ? shape.lineTo(p.x, p.y) : shape.moveTo(p.x, p.y); }
    for (let i = 80; i >= 0; i--) { const p = at(x0 + (x1 - x0) * (i / 80), -half); shape.lineTo(p.x, p.y); }
    shape.closePath();
    const plinth = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 4 }),
      new THREE.MeshPhysicalMaterial({ color: '#e6edf7', roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 0.4, sheenColor: new THREE.Color('#cfe0ff') }),
    );
    plinth.rotation.x = Math.PI / 2;      // shape y → world z, extrusion goes downward
    plinth.position.y = -0.12;
    arch.group.add(plinth);
  }
  const archShadow = contactShadow(7); archShadow.position.y = -1.0; archShadow.scale.set(1, 0.7, 1); archStage.add(archShadow);
  // assemble order: midline outward, alternating sides
  const order = arch.teeth.slice().sort((a, b) => a.index - b.index || a.side - b.side);
  order.forEach((t, i) => { t.at = 0.06 + (i / order.length) * 0.66; });

  /* ------------------------------------------------------------ state */
  const state = {
    intro: reduced ? 1 : 0,
    hero: 0,          // 0 → hero in view, 1 → scrolled away
    implant: -1,      // -1 hidden, 0..1 progress through the pinned stage
    implantShift: 0,  // viewport heights the section is off-screen (keeps the model glued to the page)
    arch: -1,
    archShift: 0,
    pointer: { x: 0, y: 0, sx: 0, sy: 0 },
  };

  /* ------------------------------------------------------------ layout */
  let w = 1, h = 1, viewW = 1, viewH = 1;
  const portrait = () => w / h < 0.9;
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = portrait() ? 40 : 30;
    camera.updateProjectionMatrix();
    viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    viewW = viewH * camera.aspect;
  }
  /** desktop: subject sits in the left half (copy is on the right, RTL); portrait: centred, upper area */
  const PORTRAIT = { hero: { y: 1.35, s: 0.82 }, implant: { y: 1.95, s: 0.56 }, arch: { y: 2.35, s: 0.82 } };
  const slot = (stage = 'hero') => portrait() ? { x: 0, ...PORTRAIT[stage] } : { x: -viewW * 0.21, y: 0, s: 1 };

  /* ------------------------------------------------------------ anchors → screen */
  const tmp = new THREE.Vector3();
  function project(obj) {
    obj.getWorldPosition(tmp); tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, visible: tmp.z < 1 };
  }

  /* ------------------------------------------------------------ render */
  let time = 0;
  function render(dt) {
    dt = Math.min(dt, 0.05); time += dt;
    const t = reduced ? 0 : time;
    const P = state.pointer;
    P.sx += (P.x - P.sx) * Math.min(1, dt * 2.5); P.sy += (P.y - P.sy) * Math.min(1, dt * 2.5);
    const S = slot('hero'), SI = slot('implant'), SA = slot('arch');
    if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / 1.8);
    const intro = easeOut(state.intro);

    // hero
    hero.visible = state.hero < 0.999;
    if (hero.visible) {
      const k = ease(clamp(state.hero));
      hero.position.set(S.x, S.y - 0.6 * (1 - intro) + k * 3.2, 0);
      hero.scale.setScalar(S.s * (0.88 + 0.12 * intro) * (1 - k * 0.25));
      heroShadow.visible = !portrait();
      heroSpin.rotation.y = 0.5 + t * 0.18 + P.sx * 0.35 + k * 1.2;
      heroSpin.rotation.x = 0.12 - P.sy * 0.18 + Math.sin(t * 0.5) * 0.02;
      heroSpin.position.y = Math.sin(t * 0.8) * 0.05;
      const sweep = (Math.sin(t * 0.55) * 0.5 + 0.5);
      scan.position.y = -1.6 + sweep * 3.0;
      scanMat.uniforms.uAlpha.value = (reduced ? 0.35 : 0.25 + 0.2 * Math.sin(t * 1.1) ** 2) * intro * (1 - k);
      orbit.rotation.z = t * 0.05;
      ringMat.opacity = 0.32 * intro * (1 - k);
      dots.material.opacity = 0.5 * intro * (1 - k);
      dots.rotation.y = t * 0.03;
    }

    // implant — assembled → exploded → slow turn
    implant.visible = state.implant >= 0 && state.implant <= 1.0001;
    if (implant.visible) {
      const p = state.implant;
      const enter = easeOut(clamp(p / 0.12));
      const d = ease(clamp((p - 0.14) / 0.5));
      implant.position.set(SI.x, SI.y + 0.25 + (1 - enter) * -0.6 - state.implantShift * viewH, 0);
      implant.scale.setScalar(SI.s * 0.92);
      iCrown.position.y = 0.48 + d * 0.85;
      iAbut.position.y = 0.0 + d * 0.3;
      iScrew.position.y = -0.04 - d * 0.5;
      implantSpin.rotation.y = -0.6 + p * Math.PI * 1.2 + P.sx * 0.25;
      implantSpin.rotation.x = 0.1 - P.sy * 0.1;
      iScrew.rotation.y = d * Math.PI * 2;
    }

    // arch — teeth settle into place one by one
    archStage.visible = state.arch >= 0 && state.arch <= 1.0001;
    if (archStage.visible) {
      const p = state.arch;
      archStage.position.set(SA.x, SA.y - 0.2 - state.archShift * viewH, 0);
      archStage.scale.setScalar(SA.s * (portrait() ? 1.0 : 1.15));
      arch.group.rotation.x = 0.95 - ease(clamp(p / 0.9)) * 0.5;
      arch.group.rotation.y = -0.35 + p * 0.7 + P.sx * 0.15;
      arch.group.position.z = 0.6;
      order.forEach((tooth) => {
        const f = easeOut(clamp((p - tooth.at) / 0.12));
        const m = tooth.mesh;
        m.visible = f > 0.001;
        m.position.set(tooth.home.pos.x, tooth.home.pos.y + (1 - f) * 3.2, tooth.home.pos.z);
        m.rotation.set((1 - f) * 0.6, tooth.home.rotY + (1 - f) * 0.8 * tooth.side, 0);
        m.scale.setScalar(tooth.home.scale * (0.6 + 0.4 * f));
      });
      scene.environmentIntensity = 0.95 + clamp((p - 0.82) / 0.15) * 0.35;
    } else scene.environmentIntensity = 0.95;

    renderer.render(scene, camera);
  }

  resize();
  return {
    render, resize, state,
    labels: () => ({ crown: project(anchors.crown), abutment: project(anchors.abutment), implant: project(anchors.implant) }),
  };
}

/* =========================================================================
   Before / after: intra-oral style renders, generated once, off-screen.
   ========================================================================= */
export function renderSmiles({ width = 1200, height = 800 } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const bgC = document.createElement('canvas'); bgC.width = 512; bgC.height = 340;
  const bx = bgC.getContext('2d');
  const bg = bx.createRadialGradient(256, 190, 10, 256, 190, 300);
  bg.addColorStop(0, '#2a0f12'); bg.addColorStop(0.55, '#3d1418'); bg.addColorStop(1, '#5a2026');
  bx.fillStyle = bg; bx.fillRect(0, 0, 512, 340);
  const bgT = new THREE.CanvasTexture(bgC); bgT.colorSpace = THREE.SRGBColorSpace; scene.background = bgT;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = 0.85;
  const flash = new THREE.DirectionalLight('#ffffff', 1.6); flash.position.set(1.5, 1.2, 8); scene.add(flash);
  const side = new THREE.DirectionalLight('#eaf1ff', 0.9); side.position.set(-6, -1, 4); scene.add(side);
  const top = new THREE.DirectionalLight('#fff3e6', 0.6); top.position.set(0, 6, 3); scene.add(top);

  const camera = new THREE.PerspectiveCamera(15, width / height, 0.1, 100);
  camera.position.set(0, -0.55, 10.5); camera.lookAt(0, -0.6, 0);

  const mats = makeMaterials();
  const variants = [
    { key: 'whitening', before: { tint: '#d9bf86', rough: 0.42 }, after: {} },
    { key: 'veneers', before: { tint: '#e4d6bb', rough: 0.36, uneven: true }, after: {} },
    { key: 'ortho', before: { crowd: true }, after: {} },
  ];
  const out = [];
  const seeded = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

  function smile(cfg) {
    const rand = seeded(11);
    const g = new THREE.Group();
    const crownMat = cfg.tint ? mats.enamel.clone() : mats.enamel;
    if (cfg.tint) { crownMat.color = new THREE.Color(cfg.tint); crownMat.roughness = cfg.rough; crownMat.clearcoat = 0.4; }
    const greyMat = mats.enamel.clone(); greyMat.color = new THREE.Color('#bdb5a3'); greyMat.roughness = 0.4;
    // upper arch flipped (crowns down); lower arch sits behind it, closed bite with a little overbite
    const upper = makeArch(mats, { seg: 80, crownMat });
    const lower = makeArch(mats, { seg: 80, crownMat, a: 0.15 });
    upper.group.add(makeGum(upper, mats, { a: 0.13 }));
    lower.group.add(makeGum(lower, mats, { a: 0.15, papilla: 0.3 }));
    upper.group.rotation.z = Math.PI; upper.group.scale.setScalar(0.6);
    lower.group.scale.setScalar(0.54); lower.group.position.set(0, -1.32, -0.3);
    [upper, lower].forEach((A, ai) => A.teeth.forEach((t) => {
      t.mesh.children.slice(1).forEach((root) => { root.visible = false; });   // roots live inside the gum
      const front = t.index <= 2;
      if (cfg.uneven && front && ai === 0) {
        t.mesh.scale.y *= 0.74 + rand() * 0.22;
        t.mesh.rotation.z = (rand() - 0.5) * 0.22;
        t.mesh.position.x *= 1.04;                                          // small diastemas
        if (t.index === 1 && t.side === 1) t.mesh.userData.crown.material = greyMat;   // one discoloured tooth
      }
      if (cfg.crowd && front) {
        t.mesh.rotation.y += (rand() - 0.5) * 1.3;
        t.mesh.position.z += (rand() - 0.5) * 0.7;
        t.mesh.position.x *= 0.9;
        t.mesh.position.y += (rand() - 0.5) * 0.18;
        t.mesh.rotation.z = (rand() - 0.5) * 0.2;
      }
    }));
    g.add(upper.group, lower.group);
    return g;
  }

  variants.forEach((v) => {
    const pair = {};
    ['before', 'after'].forEach((side) => {
      const g = smile(v[side]);
      scene.add(g);
      renderer.render(scene, camera);
      pair[side] = canvas.toDataURL('image/jpeg', 0.88);
      scene.remove(g);
      g.traverse((o) => { o.geometry?.dispose(); });
    });
    out.push({ key: v.key, ...pair });
  });
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
