/**
 * scene.js — AETHER's digital world.
 *
 * One continuous WebGL space the camera travels through on scroll:
 *   core (hero) → service trio → agent network → device carousel →
 *   data tunnel (process) → morphing particle cloud (benefits) →
 *   playground (showcase) → portal (contact).
 * Everything is procedural: shaders, lathe/extrude geometry, canvas textures.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BG = 0x04050b;
const BLUE = new THREE.Color(0.16, 0.42, 1.0);
const CYAN = new THREE.Color(0.25, 0.85, 1.0);
const VIOLET = new THREE.Color(0.58, 0.3, 1.0);
const MAGENTA = new THREE.Color(0.86, 0.32, 1.0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

/* world anchors */
const P = {
  hero: V(0, 0, 0),
  services: V(0, 0, -34),
  agents: V(0, 0, -66),
  portfolio: V(0, 0, -98),
  tunnelA: V(0, 0, -112),
  tunnelB: V(0, 0, -162),
  benefits: V(0, 0, -182),
  showcase: V(0, 0, -206),
  contact: V(0, 0, -232),
};
const SERVICE_X = [6.5, 0, -6.5];

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* ------------------------------------------------------------------ camera stops */
const off = (base, x, y, z) => base.clone().add(V(x, y, z));
function tunnelCurve() {
  const a = P.tunnelA, b = P.tunnelB;
  return new THREE.CatmullRomCurve3([a, off(a, 2.4, 1.2, -12), off(a, -2.6, -1.0, -25), off(a, 1.8, 0.8, -38), b], false, 'centripetal');
}
const TUNNEL = tunnelCurve();
const tunnelStop = (u) => ({ pos: TUNNEL.getPointAt(u), look: TUNNEL.getPointAt(Math.min(1, u + 0.07)).add(V(0.9, 0, 0)) });

export const CHAPTERS = {
  hero:      { focus: P.hero, shift: 2.3, stops: [{ pos: V(0, 0.3, 11.5), look: V(2.3, 0.1, 0) }] },
  services:  { focus: P.services, dwell: true, stops: SERVICE_X.map((x) => ({ pos: off(P.services, x, 0.5, 7.6), look: off(P.services, x + 1.9, 0, 0) })) },
  agents:    { focus: P.agents, shift: 2.4, stops: [{ pos: off(P.agents, 1.2, 1.4, 11.5), look: off(P.agents, 2.6, 0, 0) }, { pos: off(P.agents, -1.4, -0.6, 9.6), look: off(P.agents, 2.2, 0, 0) }] },
  portfolio: { focus: off(P.portfolio, 0, 0, 4.4), pull: 1.25, stops: [{ pos: off(P.portfolio, 0, 0.9, 12.4), look: off(P.portfolio, 2.0, 0, 4.4) }, { pos: off(P.portfolio, -0.4, 0.5, 11.8), look: off(P.portfolio, 1.9, 0, 4.4) }] },
  process:   { focus: P.tunnelA, glide: true, pull: 1, stops: [0.0, 0.22, 0.46, 0.7, 0.9].map(tunnelStop) },
  benefits:  { focus: P.benefits, stops: [{ pos: off(P.benefits, 0.4, 0.4, 9.2), look: off(P.benefits, 2.1, 0, 0) }, { pos: off(P.benefits, -0.6, -0.2, 8.4), look: off(P.benefits, 2.0, 0, 0) }] },
  showcase:  { focus: P.showcase, shift: 2.1, stops: [{ pos: off(P.showcase, 0, 0.3, 10.5), look: off(P.showcase, 2.1, 0, 0) }, { pos: off(P.showcase, -0.3, 0.2, 10.0), look: off(P.showcase, 2.05, 0, 0) }] },
  contact:   { focus: P.contact, shift: 3.1, stops: [{ pos: off(P.contact, -0.6, 0.6, 14.5), look: off(P.contact, 3.1, 0.3, 0) }, { pos: off(P.contact, -0.2, 0.4, 13.6), look: off(P.contact, 3.0, 0.3, 0) }] },
};

/* ------------------------------------------------------------------ portfolio data (screens) */
export const PROJECTS = [
  { name: 'LUMIÈRE', tag: 'Fashion · Commerce', bg: ['#16121f', '#0b0a12'], accent: ['#f0b8ff', '#7b4dff'], device: 'laptop', head: 'Wear the light.' },
  { name: 'ATLAS', tag: 'Capital · Advisory', bg: ['#0a1422', '#05080f'], accent: ['#6fd3ff', '#2d5bff'], device: 'phone', head: 'Capital, considered.' },
  { name: 'KORA', tag: 'Clinics · Booking AI', bg: ['#0e1a1a', '#060c0d'], accent: ['#7dffd8', '#2ab3ff'], device: 'tablet', head: 'Care that answers.' },
  { name: 'NORD', tag: 'Architecture', bg: ['#161616', '#080808'], accent: ['#ffffff', '#8a8fff'], device: 'laptop', head: 'Space, drawn in light.' },
  { name: 'PULSE', tag: 'Fitness · Automation', bg: ['#1a0d18', '#0a0509'], accent: ['#ff7ad9', '#7a3bff'], device: 'phone', head: 'Train smarter.' },
];

export function createWorld(canvas, opts = {}) {
  const { mobile = false, reduced = false, onHover = () => {}, onPick = () => {} } = opts;
  const high = !mobile;

  /* ---------------------------------------------------------------- renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG); // transmission samples this
  scene.fog = new THREE.FogExp2(BG, 0.034);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 160);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.3, 0.4, 1.05);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const uTime = { value: 0 };
  const updaters = [];          // per-frame callbacks (dt, t)
  const pickables = [];
  const tick = (fn) => updaters.push(fn);

  /* ---------------------------------------------------------------- helpers */
  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.userData.redraw = () => { draw(c.getContext('2d'), w, h); t.needsUpdate = true; };
    return t;
  }
  const glowTex = canvasTex(128, 128, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
  const halo = (color, scale, opacity = 0.5) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity }));
    s.scale.setScalar(scale); return s;
  };
  const pointsMat = (size, color) => new THREE.ShaderMaterial({
    uniforms: { uSize: { value: size * dpr }, uColor: { value: color.clone() }, uTime, uAlpha: { value: 1 } },
    vertexShader: `attribute float aSeed; uniform float uSize, uTime; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.35 + aSeed) / -mv.z;
        vA = (0.35 + 0.65 * aSeed) * (0.85 + 0.15 * sin(uTime * (0.3 + aSeed) + aSeed * 40.0)) * smoothstep(60.0, 4.0, -mv.z); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA * uAlpha; gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  function pulseMat(color, { speed = 0.3, density = 4, intensity = 3 } = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime, uColor: { value: color.clone() }, uI: { value: intensity }, uSpeed: { value: speed }, uDensity: { value: density } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime, uI, uSpeed, uDensity; uniform vec3 uColor; varying vec2 vUv;
        void main(){ float x = fract(vUv.x * uDensity - uTime * uSpeed); float p = smoothstep(0.0, 0.02, x) * pow(1.0 - x, 14.0);
          float base = 0.07; gl_FragColor = vec4(uColor * (p * uI + base), p + base); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
  }
  const chrome = new THREE.MeshStandardMaterial({ color: 0xaab4cc, metalness: 1, roughness: 0.18 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x23262e, metalness: 0.85, roughness: 0.32 });
  const glossBlack = new THREE.MeshPhysicalMaterial({ color: 0x08090c, metalness: 0.4, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 });

  /* ================================================================ CORE */
  function makeCore(radius = 1, detail = high ? 56 : 28, colA = BLUE, colB = VIOLET) {
    const g = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime, uPointer: { value: V(0, 0, 1) }, uPointerAmt: { value: 0 }, uPulse: { value: -1 }, uEnergy: { value: 1 }, uGlow: { value: 1 }, uColA: { value: colA.clone() }, uColB: { value: colB.clone() } },
      vertexShader: NOISE + `
        uniform float uTime, uPointerAmt, uPulse, uEnergy; uniform vec3 uPointer;
        varying vec3 vN; varying vec3 vView; varying float vNoise;
        void main(){
          vec3 n = normalize(position);
          float t = uTime * 0.16;
          float d = snoise(n * 1.4 + vec3(t, t * 0.7, -t)) * 0.15 + snoise(n * 3.6 - vec3(t * 1.2)) * 0.03;
          float bulge = pow(max(dot(n, uPointer), 0.0), 5.0) * 0.16 * uPointerAmt;
          float ang = acos(clamp(dot(n, uPointer), -1.0, 1.0));
          float wave = uPulse >= 0.0 ? exp(-pow((ang - uPulse * 3.4) * 3.2, 2.0)) * 0.16 * (1.0 - uPulse) : 0.0;
          vNoise = d + wave;
          vec3 p = n * (1.0 + (d + bulge + wave) * uEnergy);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vN = normalize(normalMatrix * n); vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uColA, uColB; uniform float uGlow; varying vec3 vN; varying vec3 vView; varying float vNoise;
        void main(){
          float fres = pow(1.0 - max(dot(vN, vView), 0.0), 2.4);
          vec3 c = mix(uColA, uColB, smoothstep(-0.18, 0.22, vNoise));
          vec3 col = c * (0.08 + 0.75 * smoothstep(-0.05, 0.3, vNoise)) + mix(uColB, vec3(1.0), 0.2) * fres * 0.85;
          gl_FragColor = vec4(col * uGlow, 1.0);
        }`,
    });
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.78, detail), mat);
    g.add(blob);

    const shellGeo = new THREE.IcosahedronGeometry(radius * 1.32, 1);
    const shell = new THREE.Mesh(shellGeo, high
      ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0, transmission: 1, thickness: 0.5, ior: 1.45, iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [180, 620], clearcoat: 1, flatShading: true, envMapIntensity: 1.6 })
      : new THREE.MeshPhysicalMaterial({ color: 0x9fb4ff, roughness: 0.1, transparent: true, opacity: 0.12, iridescence: 1, flatShading: true, depthWrite: false }));
    g.add(shell);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(shellGeo), new THREE.LineBasicMaterial({ color: CYAN.clone().multiplyScalar(1.0), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(edges);

    const rings = [];
    [[radius * 1.85, 0.008, BLUE, [1.2, 0.2, 0]], [radius * 2.15, 0.006, VIOLET, [0.4, 0.9, 0.2]], [radius * 2.5, 0.004, CYAN, [-0.5, 0.3, 0.6]]].forEach(([r, tube, col, rot], i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube * radius * 2.5, 8, 220), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.85) }));
      ring.rotation.set(...rot);
      ring.userData.spin = (i % 2 ? -1 : 1) * (0.05 + i * 0.02);
      g.add(ring); rings.push(ring);
    });
    // satellites riding the rings
    rings.forEach((ring) => {
      const sat = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.045, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.3, 1.5) }));
      sat.position.x = ring.geometry.parameters.radius;
      ring.add(sat);
    });

    // chrome shards in orbit
    const SH = 46;
    const shards = new THREE.InstancedMesh(new THREE.OctahedronGeometry(radius * 0.09, 0), chrome, SH);
    const seeds = Array.from({ length: SH }, () => ({ r: radius * (2.0 + Math.random() * 1.8), a: Math.random() * TAU, y: (Math.random() - 0.5) * radius * 2.4, s: 0.5 + Math.random() * 1.2, sp: (0.02 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1), rot: Math.random() * TAU }));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V(1, 1, 1), pp = V(0, 0, 0);
    g.add(shards);

    g.add(halo(BLUE, radius * 3.2, 0.05));
    const api = {
      group: g, mat, shell, energy: 1, pointerAmt: 0, pulse: -1,
      update(dt, t) {
        rings.forEach((r) => { r.rotation.z += r.userData.spin * dt; });
        shell.rotation.y += dt * 0.025; shell.rotation.x += dt * 0.012; edges.rotation.copy(shell.rotation);
        seeds.forEach((s, i) => {
          const a = s.a + t * s.sp;
          pp.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.3 + s.rot) * 0.08, Math.sin(a) * s.r);
          e.set(t * s.sp * 2 + s.rot, t * 0.12 + s.rot, 0); q.setFromEuler(e); sc.setScalar(s.s);
          m4.compose(pp, q, sc); shards.setMatrixAt(i, m4);
        });
        shards.instanceMatrix.needsUpdate = true;
        if (api.pulse >= 0) { api.pulse += dt * 0.6; if (api.pulse > 1) api.pulse = -1; }
        mat.uniforms.uPulse.value = api.pulse;
        mat.uniforms.uEnergy.value = api.energy;
        mat.uniforms.uPointerAmt.value += (api.pointerAmt - mat.uniforms.uPointerAmt.value) * Math.min(1, dt * 4);
      },
    };
    blob.userData.owner = shell.userData.owner = api;
    return api;
  }

  /* ================================================================ DEVICES */
  function siteTexture(p) {
    return canvasTex(1024, 2048, (x, w, h) => {
      const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, p.bg[0]); bg.addColorStop(1, p.bg[1]);
      x.fillStyle = bg; x.fillRect(0, 0, w, h);
      const blob = (cx, cy, r, c) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
      blob(w * 0.72, 330, 420, p.accent[1] + 'cc'); blob(w * 0.3, 520, 300, p.accent[0] + '55');
      x.fillStyle = '#ffffff'; x.font = '700 34px Inter, Arial, sans-serif'; x.textBaseline = 'middle';
      x.fillText(p.name, 60, 70);
      x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '400 22px Inter, Arial, sans-serif';
      ['Work', 'Studio', 'Journal', 'Contact'].forEach((m, i) => x.fillText(m, w - 470 + i * 112, 70));
      x.fillStyle = '#fff'; x.font = '600 108px "Space Grotesk", Inter, Arial, sans-serif';
      const words = p.head.split(' ');
      x.fillText(words.slice(0, Math.ceil(words.length / 2)).join(' '), 60, 330);
      x.fillText(words.slice(Math.ceil(words.length / 2)).join(' '), 60, 450);
      x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '400 28px Inter, Arial, sans-serif'; x.fillText(p.tag, 64, 560);
      const pill = (px, py, pw, fill, text, tc) => { x.fillStyle = fill; x.beginPath(); x.roundRect(px, py, pw, 72, 36); x.fill(); x.fillStyle = tc; x.font = '500 24px Inter, Arial'; x.fillText(text, px + 34, py + 37); };
      pill(60, 640, 230, p.accent[0], 'Explore →', '#0a0a0a');
      pill(310, 640, 210, 'rgba(255,255,255,.08)', 'Showreel', '#fff');
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
        const gx = 60 + c * 462, gy = 800 + r * 400;
        const g = x.createLinearGradient(gx, gy, gx + 440, gy + 360);
        g.addColorStop(0, p.accent[(r + c) % 2] + '99'); g.addColorStop(1, p.bg[0]);
        x.fillStyle = g; x.beginPath(); x.roundRect(gx, gy, 440, 330, 22); x.fill();
        x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(gx, gy + 348, 220, 12);
        x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(gx, gy + 370, 140, 10);
      }
      x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(60, 1990, w - 120, 2);
    });
  }
  const keysTex = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#16181d'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#0b0c0f';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { x.beginPath(); x.roundRect(14 + c * 34.6, 14 + r * 34, 30, 28, 4); x.fill(); }
    x.fillStyle = '#1d2027'; x.beginPath(); x.roundRect(w * 0.33, 196, w * 0.34, 54, 6); x.fill();
  });

  function makeDevice(kind, tex) {
    const g = new THREE.Group();
    const screenMat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.95, 0.95, 1.0) });
    tex.repeat.set(1, kind === 'phone' ? 0.42 : kind === 'tablet' ? 0.62 : 0.32);
    tex.offset.y = 1 - tex.repeat.y;
    let screen;
    if (kind === 'laptop') {
      const base = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.1, 2.15, 3, 0.04), darkMetal); g.add(base);
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.1), new THREE.MeshStandardMaterial({ map: keysTex, roughness: 0.6 }));
      deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.052, -0.3); g.add(deck);
      const pivot = new THREE.Group(); pivot.position.set(0, 0.05, -1.06); pivot.rotation.x = -0.26; g.add(pivot);
      const lid = new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.08, 0.07, 3, 0.04), darkMetal); lid.position.y = 1.04; pivot.add(lid);
      screen = new THREE.Mesh(new THREE.PlaneGeometry(3.02, 1.9), screenMat); screen.position.set(0, 1.05, 0.037); pivot.add(screen);
      g.position.y = -0.7;
    } else {
      const [w, h, r] = kind === 'phone' ? [0.86, 1.78, 0.13] : [1.9, 2.55, 0.12];
      const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.09, 4, r), glossBlack); g.add(body);
      const rim = new THREE.Mesh(new RoundedBoxGeometry(w + 0.02, h + 0.02, 0.07, 4, r), chrome); g.add(rim);
      screen = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.08), screenMat); screen.position.z = 0.047; g.add(screen);
      if (kind === 'phone') { const isl = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.06, 0.01, 2, 0.03), new THREE.MeshBasicMaterial({ color: 0x000000 })); isl.position.set(0, h / 2 - 0.12, 0.052); g.add(isl); }
    }
    const glow = halo(VIOLET, kind === 'laptop' ? 4 : 2.6, 0.05); glow.position.z = -0.6; g.add(glow);
    return { group: g, screen, tex };
  }

  /* ================================================================ NETWORK */
  function makeNetwork(n, radius, color = CYAN) {
    const g = new THREE.Group();
    const nodes = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      const k = radius * (0.55 + Math.random() * 0.45);
      nodes.push(V(Math.cos(th) * r * k, y * k, Math.sin(th) * r * k));
    }
    const edges = [];
    nodes.forEach((a, i) => {
      nodes.map((b, j) => [j, a.distanceToSquared(b)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 3)
        .forEach(([j]) => { if (i < j) edges.push([i, j]); });
    });
    const out = nodes.map(() => []);
    edges.forEach(([i, j], k) => { out[i].push(k); });
    const lp = new Float32Array(edges.length * 6);
    edges.forEach(([i, j], k) => { lp.set([...nodes[i].toArray(), ...nodes[j].toArray()], k * 6); });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(0.8), transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(lines);
    const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(radius * 0.016, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    const m = new THREE.Matrix4(), col = new THREE.Color();
    nodes.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); dots.setMatrixAt(i, m); dots.setColorAt(i, col.copy(i % 3 ? color : VIOLET).multiplyScalar(0.7 + Math.random() * 0.6)); });
    g.add(dots);
    // pulses travelling along edges
    const PN = Math.min(140, edges.length);
    const pulses = Array.from({ length: PN }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), s: 0.4 + Math.random() * 0.9 }));
    const pPos = new Float32Array(PN * 3), pSeed = new Float32Array(PN).map(() => Math.random());
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pg.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
    const pm = pointsMat(radius * 26, new THREE.Color(0.8, 0.95, 1.3));
    const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; g.add(pts);
    const tmp = V(0, 0, 0);
    return {
      group: g, nodes, lines, speed: 1,
      update(dt) {
        pulses.forEach((p, i) => {
          p.t += dt * p.s * this.speed;
          if (p.t >= 1) { // hop to a neighbouring edge
            const next = out[edges[p.e][1]];
            p.e = next.length ? next[(Math.random() * next.length) | 0] : (Math.random() * edges.length) | 0;
            p.t = 0;
          }
          const [a, b] = edges[p.e];
          tmp.copy(nodes[a]).lerp(nodes[b], p.t);
          pPos[i * 3] = tmp.x; pPos[i * 3 + 1] = tmp.y; pPos[i * 3 + 2] = tmp.z;
        });
        pg.attributes.position.needsUpdate = true;
      },
    };
  }

  /* ================================================================ GEARS */
  function gearGeo(teeth, r, depth) {
    const s = new THREE.Shape(), ri = r * 0.84, step = TAU / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts = [[ri, a], [r, a + step * 0.22], [r, a + step * 0.48], [ri, a + step * 0.7]];
      pts.forEach(([rr, aa], k) => { const px = Math.cos(aa) * rr, py = Math.sin(aa) * rr; if (i === 0 && k === 0) s.moveTo(px, py); else s.lineTo(px, py); });
    }
    s.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.22, 0, TAU, true); s.holes.push(hole);
    for (let k = 0; k < 5; k++) { const h = new THREE.Path(); const a = k / 5 * TAU; h.absarc(Math.cos(a) * r * 0.54, Math.sin(a) * r * 0.54, r * 0.13, 0, TAU, true); s.holes.push(h); }
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, curveSegments: 18 });
    geo.center();
    return geo;
  }

  /* ================================================================ 01 HERO */
  const hero = new THREE.Group(); hero.position.copy(P.hero); scene.add(hero);
  const core = makeCore(1.25);
  hero.add(core.group);
  pickables.push({ obj: core.shell, info: { type: 'core' } });
  tick((dt, t) => core.update(dt, t));
  // floating devices around the core
  const heroPhone = makeDevice('phone', siteTexture(PROJECTS[1]));
  heroPhone.group.position.set(1.5, 2.5, -3.6); heroPhone.group.rotation.set(0.1, 0.5, -0.12); heroPhone.group.scale.setScalar(1.1);
  const heroTab = makeDevice('tablet', siteTexture(PROJECTS[2]));
  heroTab.group.position.set(-2.9, -2.4, -2.4); heroTab.group.rotation.set(-0.15, 0.55, 0.1); heroTab.group.scale.setScalar(0.95);
  hero.add(heroPhone.group, heroTab.group);
  tick((dt, t) => {
    heroPhone.group.position.y = 2.5 + Math.sin(t * 0.4) * 0.08; heroPhone.group.rotation.y = 0.5 + Math.sin(t * 0.3) * 0.15;
    heroTab.group.position.y = -2.4 + Math.sin(t * 0.35 + 1) * 0.07; heroTab.group.rotation.y = 0.55 + Math.sin(t * 0.25 + 2) * 0.12;
    heroPhone.tex.offset.y = (1 - heroPhone.tex.repeat.y) * (0.5 + 0.5 * Math.cos(t * 0.18));
    heroTab.tex.offset.y = (1 - heroTab.tex.repeat.y) * (0.5 + 0.5 * Math.cos(t * 0.15 + 1));
  });

  /* ================================================================ 02 SERVICES */
  const services = new THREE.Group(); services.position.copy(P.services); scene.add(services);
  const svcItems = [];
  // 0 · AI agents — neural sphere around a small core
  {
    const g = new THREE.Group(); g.position.x = SERVICE_X[0];
    const net = makeNetwork(70, 1.7, CYAN); g.add(net.group);
    const mini = makeCore(0.42, high ? 32 : 18, CYAN, VIOLET); g.add(mini.group);
    tick((dt, t) => { net.update(dt); mini.update(dt, t); net.group.rotation.y += dt * 0.05; });
    services.add(g); svcItems.push(g);
  }
  // 1 · websites — laptop
  {
    const g = new THREE.Group(); g.position.x = SERVICE_X[1];
    const lap = makeDevice('laptop', siteTexture(PROJECTS[0])); lap.group.rotation.set(0.35, -0.45, 0); g.add(lap.group);
    // floating UI panels
    const panelTex = canvasTex(256, 160, (x, w, h) => {
      x.fillStyle = 'rgba(30,40,90,.55)'; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 18); x.fill();
      x.strokeStyle = 'rgba(140,170,255,.7)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#9fb6ff'; x.fillRect(24, 30, 120, 12); x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(24, 56, 190, 8); x.fillRect(24, 74, 160, 8);
      x.fillStyle = '#7b5cff'; x.beginPath(); x.roundRect(24, 104, 90, 32, 16); x.fill();
    });
    [[1.9, 1.3, 0.6], [-1.9, 0.8, 0.9], [1.4, -0.6, 1.4]].forEach(([px, py, pz], i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.69), new THREE.MeshBasicMaterial({ map: panelTex, transparent: true, depthWrite: false, color: new THREE.Color(1.4, 1.4, 1.6) }));
      m.position.set(px, py, pz); m.rotation.y = -px * 0.15; g.add(m);
      tick((dt, t) => { m.position.y = py + Math.sin(t * 0.4 + i * 2) * 0.05; });
    });
    tick((dt, t) => { lap.tex.offset.y = (1 - lap.tex.repeat.y) * (0.5 + 0.5 * Math.cos(t * 0.12)); lap.group.rotation.y = -0.45 + Math.sin(t * 0.15) * 0.03; });
    services.add(g); svcItems.push(g);
  }
  // 2 · automation — meshing gears + flowing pipes
  {
    const g = new THREE.Group(); g.position.x = SERVICE_X[2];
    const gm = new THREE.MeshStandardMaterial({ color: 0x8e9cc4, metalness: 1, roughness: 0.22 });
    const gm2 = new THREE.MeshStandardMaterial({ color: 0x6d58c9, metalness: 1, roughness: 0.28 });
    const g1 = new THREE.Mesh(gearGeo(18, 1.0, 0.22), gm); g1.position.set(0, 0, 0);
    const g2 = new THREE.Mesh(gearGeo(12, 0.68, 0.22), gm2); g2.position.set(1.52, 0.42, 0.05);
    const g3 = new THREE.Mesh(gearGeo(14, 0.78, 0.22), gm); g3.position.set(-1.05, -1.22, -0.05);
    g.add(g1, g2, g3);
    const pipeMat = pulseMat(CYAN, { speed: 0.25, density: 3, intensity: 1.8 });
    [[V(-2.8, 1.6, -0.6), V(-1.4, 1.9, 0.2), V(0, 1.4, 0.4), V(1.6, 1.6, -0.2), V(2.9, 0.6, -0.8)],
      [V(2.6, -1.8, -0.4), V(1.0, -1.6, 0.5), V(-0.4, -2.2, 0.3), V(-2.6, -0.4, -0.6)]].forEach((pts) => {
      const c = new THREE.CatmullRomCurve3(pts);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 120, 0.045, 8), new THREE.MeshStandardMaterial({ color: 0x1b1f2b, metalness: 0.6, roughness: 0.3 })));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 120, 0.06, 8), pipeMat));
    });
    g.rotation.set(0.25, -0.35, 0);
    tick((dt) => { g1.rotation.z += dt * 0.18; g2.rotation.z -= dt * 0.18 * 18 / 12; g3.rotation.z -= dt * 0.18 * 18 / 14; });
    services.add(g); svcItems.push(g);
  }
  svcItems.forEach((g, i) => pickables.push({ obj: g, info: { type: 'service', index: i }, recursive: true }));

  /* ================================================================ 03 AGENTS */
  const agents = new THREE.Group(); agents.position.copy(P.agents); scene.add(agents);
  const brain = makeNetwork(high ? 180 : 110, 3.0, BLUE);
  agents.add(brain.group);
  const AGENT_COLORS = [[CYAN, BLUE], [VIOLET, MAGENTA], [BLUE, CYAN], [MAGENTA, VIOLET]];
  const AGENT_POS = [V(-3.9, 1.6, 0.2), V(0.5, 2.1, -0.4), V(-3.3, -1.9, 0.3), V(0.4, -2.0, -0.4)];
  const agentOrbs = AGENT_POS.map((p, i) => {
    const o = makeCore(0.3, high ? 28 : 16, AGENT_COLORS[i][0], AGENT_COLORS[i][1]);
    o.group.position.copy(p);
    agents.add(o.group);
    // synapses to nearest nodes
    const near = brain.nodes.map((n, k) => [k, n.distanceToSquared(p)]).sort((a, b) => a[1] - b[1]).slice(0, 6);
    const mat = pulseMat(AGENT_COLORS[i][0], { speed: 0.4, density: 1.5, intensity: 1 });
    near.forEach(([k]) => {
      const c = new THREE.CatmullRomCurve3([p.clone(), p.clone().lerp(brain.nodes[k], 0.5).add(V(0, 0.3, 0)), brain.nodes[k].clone()]);
      agents.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.014, 5), mat));
    });
    pickables.push({ obj: o.shell, info: { type: 'agent', index: i } });
    return { core: o, mat, glow: 0 };
  });
  tick((dt, t) => {
    brain.update(dt);
    brain.group.rotation.y = Math.sin(t * 0.05) * 0.12;
    agentOrbs.forEach((a, i) => {
      a.core.update(dt, t);
      const on = state.activeAgent === i ? 1 : 0;
      a.glow += (on - a.glow) * Math.min(1, dt * 4);
      a.core.group.scale.setScalar(1 + a.glow * 0.45);
      a.core.mat.uniforms.uGlow.value = 0.5 + a.glow * 0.45;
      a.mat.uniforms.uI.value = 0.4 + a.glow * 2;
      a.mat.uniforms.uSpeed.value = 0.3 + a.glow * 0.3;
      a.core.group.position.y = AGENT_POS[i].y + Math.sin(t * 0.35 + i) * 0.05;
    });
  });

  /* ================================================================ 04 PORTFOLIO */
  const folio = new THREE.Group(); folio.position.copy(P.portfolio); scene.add(folio);
  const carousel = new THREE.Group(); folio.add(carousel);
  const R = 4.4;
  const devices = PROJECTS.map((p, i) => {
    const d = makeDevice(p.device, siteTexture(p));
    const holder = new THREE.Group();
    const a = (i / PROJECTS.length) * TAU;
    holder.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    holder.rotation.y = a;
    holder.add(d.group);
    if (p.device === 'laptop') d.group.scale.setScalar(0.92);
    carousel.add(holder);
    pickables.push({ obj: holder, info: { type: 'project', index: i }, recursive: true });
    return { ...d, holder, hover: 0 };
  });
  const floorRing = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 6, 240), new THREE.MeshBasicMaterial({ color: VIOLET.clone().multiplyScalar(1.1) }));
  floorRing.rotation.x = Math.PI / 2; floorRing.position.y = -1.6; folio.add(floorRing);
  const floorGlow = new THREE.Mesh(new THREE.CircleGeometry(R * 1.25, 64), new THREE.ShaderMaterial({
    uniforms: { uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; float ring = smoothstep(0.02, 0.0, abs(fract(r * 6.0 - uTime * 0.2) - 0.5) - 0.47);
        float a = (1.0 - r) * 0.1 + ring * 0.1 * (1.0 - r); gl_FragColor = vec4(vec3(0.3, 0.35, 1.0) * a, a); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = -1.62; folio.add(floorGlow);
  let carouselAngle = 0;
  tick((dt, t) => {
    const target = -state.project * (TAU / PROJECTS.length);
    carouselAngle += (target - carouselAngle) * Math.min(1, dt * (reduced ? 30 : 2.2));
    carousel.rotation.y = carouselAngle;
    devices.forEach((d, i) => {
      d.tex.offset.y = (1 - d.tex.repeat.y) * (0.5 + 0.5 * Math.cos(t * 0.2 + i));
      const h = state.hover && state.hover.type === 'project' && state.hover.index === i ? 1 : 0;
      d.hover += (h - d.hover) * Math.min(1, dt * 6);
      d.group.position.y = Math.sin(t * 0.4 + i * 1.3) * 0.04 + d.hover * 0.15;
      d.group.rotation.x = -d.hover * 0.05;
    });
  });

  /* ================================================================ 05 TUNNEL */
  const tunnel = new THREE.Group(); scene.add(tunnel);
  const gates = [0.22, 0.46, 0.7, 0.9].map((u, i) => {
    const p = TUNNEL.getPointAt(u), tan = TUNNEL.getTangentAt(u);
    const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().add(tan));
    const ringMat = new THREE.MeshBasicMaterial({ color: (i % 2 ? VIOLET : CYAN).clone().multiplyScalar(1.3) });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.02, 8, 160), ringMat); g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.006, 6, 160), ringMat); g.add(ring2);
    // numbered ticks
    for (let k = 0; k < 24; k++) {
      const tk = new THREE.Mesh(new THREE.BoxGeometry(0.02, k % 6 ? 0.12 : 0.3, 0.02), ringMat);
      const a = (k / 24) * TAU; tk.position.set(Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0); tk.rotation.z = a - Math.PI / 2; g.add(tk);
    }
    const numTex = canvasTex(256, 256, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = '#fff'; x.font = '500 120px "Space Grotesk", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1).padStart(2, '0'), w / 2, w / 2); });
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: numTex, transparent: true, depthWrite: false, color: new THREE.Color(1, 1, 1.15) }));
    num.position.set(-2.1, 1.6, 0); num.rotation.y = Math.PI; g.add(num);
    tunnel.add(g);
    return { g, ring, ring2, mat: ringMat, base: ringMat.color.clone(), lit: 0 };
  });
  // streaks lining the tunnel
  const STREAKS = high ? 900 : 450;
  const streak = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.012, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), STREAKS);
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), z = V(0, 0, 1);
    for (let i = 0; i < STREAKS; i++) {
      const u = Math.random(), p = TUNNEL.getPointAt(u), tan = TUNNEL.getTangentAt(u);
      const n = V(0, 1, 0).cross(tan).normalize(), b = tan.clone().cross(n);
      const a = Math.random() * TAU, rr = 2.9 + Math.random() * 3.5;
      p.addScaledVector(n, Math.cos(a) * rr).addScaledVector(b, Math.sin(a) * rr);
      q.setFromUnitVectors(z, tan);
      m.compose(p, q, V(1, 1, 0.5 + Math.random() * 2.5));
      streak.setMatrixAt(i, m);
      streak.setColorAt(i, col.copy(Math.random() < 0.5 ? CYAN : VIOLET).multiplyScalar(0.25 + Math.random() * 0.75));
    }
  }
  tunnel.add(streak);
  // data stream flowing down the centre
  const stream = new THREE.Mesh(new THREE.TubeGeometry(TUNNEL, 400, 0.03, 6), pulseMat(CYAN, { speed: 0.18, density: 10, intensity: 1.6 }));
  stream.position.y = -1.4; tunnel.add(stream);
  tick((dt) => {
    gates.forEach((g, i) => {
      const on = state.step >= i ? 1 : 0;
      g.lit += (on - g.lit) * Math.min(1, dt * 4);
      g.mat.color.copy(g.base).multiplyScalar(0.25 + g.lit * 0.9);
      g.ring.rotation.z += dt * (0.03 + g.lit * 0.08) * (i % 2 ? -1 : 1);
    });
  });

  /* ================================================================ 06 BENEFITS (morphing particles) */
  const benefits = new THREE.Group(); benefits.position.copy(P.benefits); scene.add(benefits);
  const PCOUNT = high ? 9000 : 4500;
  const shapes = [0, 1, 2, 3].map(() => new Float32Array(PCOUNT * 3));
  const aRand = new Float32Array(PCOUNT);
  for (let i = 0; i < PCOUNT; i++) {
    aRand[i] = Math.random();
    // 0 · sphere (always-on)
    const y = 1 - (i / (PCOUNT - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963, sr = 2.4;
    shapes[0].set([Math.cos(th) * r * sr, y * sr, Math.sin(th) * r * sr], i * 3);
    // 1 · lattice cube (less manual work)
    const n = 21, gx = i % n, gy = ((i / n) | 0) % n, gz = ((i / n / n) | 0) % n, cs = 3.4 / (n - 1);
    shapes[1].set([gx * cs - 1.7, gy * cs - 1.7, gz * cs - 1.7], i * 3);
    // 2 · speed ring / torus
    const u = Math.random() * TAU, v = Math.random() * TAU, R0 = 2.2, r0 = 0.32 + Math.random() * 0.25;
    shapes[2].set([(R0 + r0 * Math.cos(v)) * Math.cos(u), r0 * Math.sin(v), (R0 + r0 * Math.cos(v)) * Math.sin(u)], i * 3);
    // 3 · double helix (growth)
    const k = i / PCOUNT, strand = i % 2, ang = k * TAU * 3 + strand * Math.PI, jitter = (Math.random() - 0.5) * 0.18;
    shapes[3].set(i % 7 === 0
      ? [Math.cos(k * TAU * 3) * 1.1 * (Math.random() * 2 - 1), k * 5 - 2.5, Math.sin(k * TAU * 3) * 1.1 * (Math.random() * 2 - 1)]
      : [Math.cos(ang) * 1.1 + jitter, k * 5 - 2.5, Math.sin(ang) * 1.1 + jitter], i * 3);
  }
  const morphGeo = new THREE.BufferGeometry();
  morphGeo.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3));
  shapes.forEach((s, i) => morphGeo.setAttribute('p' + i, new THREE.BufferAttribute(s, 3)));
  morphGeo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));
  const morphMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uMorph: { value: 0 }, uSize: { value: 42 * dpr }, uPointer: { value: V(99, 99, 99) } },
    vertexShader: `attribute vec3 p0, p1, p2, p3; attribute float aRand; uniform float uTime, uMorph, uSize; uniform vec3 uPointer; varying vec3 vC; varying float vA;
      void main(){
        float m = clamp(uMorph, 0.0, 3.0);
        vec3 a = m < 1.0 ? p0 : (m < 2.0 ? p1 : p2);
        vec3 b = m < 1.0 ? p1 : (m < 2.0 ? p2 : p3);
        float f = m >= 3.0 ? 1.0 : fract(m);
        if (m >= 3.0) { a = p3; b = p3; }
        float e = smoothstep(0.0, 1.0, clamp((f - aRand * 0.35) / 0.65, 0.0, 1.0));
        vec3 pos = mix(a, b, e);
        float swirl = sin(e * 3.14159) * (0.4 + aRand * 0.4);
        float cs = cos(swirl), sn = sin(swirl);
        pos.xz = mat2(cs, -sn, sn, cs) * pos.xz;
        pos += 0.02 * vec3(sin(uTime * 0.5 + aRand * 30.0), cos(uTime * 0.4 + aRand * 20.0), sin(uTime * 0.3 + aRand * 10.0));
        vec3 toP = pos - uPointer; float dP = length(toP);
        pos += normalize(toP) * smoothstep(1.2, 0.0, dP) * 0.35;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.4 + aRand * 0.8) / -mv.z;
        vC = mix(vec3(0.25, 0.55, 1.0), vec3(0.7, 0.35, 1.0), smoothstep(-2.0, 2.0, pos.y + aRand));
        vA = 0.55 + 0.45 * aRand;
      }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(vC * a * 1.35, a); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const morph = new THREE.Points(morphGeo, morphMat); morph.frustumCulled = false;
  benefits.add(morph);
  let morphV = 0;
  tick((dt, t) => {
    morphV += (state.morph - morphV) * Math.min(1, dt * (reduced ? 30 : 1.8));
    morphMat.uniforms.uMorph.value = morphV;
    morph.rotation.y = t * 0.03;
  });

  /* ================================================================ 07 SHOWCASE */
  const show = new THREE.Group(); show.position.copy(P.showcase); scene.add(show);
  const spinner = new THREE.Group(); show.add(spinner);
  const showCore = makeCore(1.2, high ? 64 : 30, VIOLET, CYAN);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, 0.36, high ? 260 : 140, 36, 2, 3), high
    ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 1, thickness: 1.2, ior: 1.6, iridescence: 1, iridescenceIOR: 1.8, clearcoat: 1, envMapIntensity: 1.8, dispersion: 4 })
    : new THREE.MeshPhysicalMaterial({ color: 0x9aa8ff, roughness: 0.15, metalness: 0.9, iridescence: 1 }));
  const wire = new THREE.Group();
  {
    const ico = new THREE.IcosahedronGeometry(1.7, 3);
    wire.add(new THREE.LineSegments(new THREE.WireframeGeometry(ico), new THREE.LineBasicMaterial({ color: CYAN.clone().multiplyScalar(1.0), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })));
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', ico.getAttribute('position'));
    pg.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(ico.getAttribute('position').count).map(() => Math.random()), 1));
    wire.add(new THREE.Points(pg, pointsMat(50, new THREE.Color(0.9, 0.9, 1.4))));
  }
  const modes = [showCore.group, knot, wire];
  modes.forEach((m, i) => { m.visible = i === 0; spinner.add(m); });
  pickables.push({ obj: spinner, info: { type: 'showcase' }, recursive: true });
  const spin = { vx: 0, vy: 0.1, x: 0, y: 0, dragging: false, scale: modes.map((_, i) => (i === 0 ? 1 : 0)) };
  tick((dt, t) => {
    showCore.update(dt, t);
    if (!spin.dragging) { spin.vy += (0.1 - spin.vy) * Math.min(1, dt * 0.8); spin.vx += (0 - spin.vx) * Math.min(1, dt * 0.8); }
    spin.y += spin.vy * dt; spin.x += spin.vx * dt; spin.x *= 0.995;
    spinner.rotation.set(spin.x, spin.y, 0);
    modes.forEach((m, i) => {
      const target = state.mode === i ? 1 : 0;
      spin.scale[i] += (target - spin.scale[i]) * Math.min(1, dt * 6);
      m.visible = spin.scale[i] > 0.01;
      m.scale.setScalar(Math.max(0.001, spin.scale[i]));
    });
  });

  /* ================================================================ 08 PORTAL */
  const portal = new THREE.Group(); portal.position.copy(P.contact); scene.add(portal);
  const portalRing = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.07, 16, 280), new THREE.ShaderMaterial({
    uniforms: { uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ float k = 0.5 + 0.5 * sin(vUv.x * 6.2831 * 2.0 - uTime * 0.4);
        vec3 c = mix(vec3(0.2, 0.6, 1.6), vec3(1.2, 0.4, 2.2), k) * (0.45 + k * 0.45); gl_FragColor = vec4(c, 1.0); }`,
  }));
  portal.add(portalRing);
  const vortex = new THREE.Mesh(new THREE.CircleGeometry(3.85, 128), new THREE.ShaderMaterial({
    uniforms: { uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: NOISE + `uniform float uTime; varying vec2 vUv;
      void main(){ vec2 p = (vUv - 0.5) * 2.0; float r = length(p); float a = atan(p.y, p.x);
        float sw = a + r * 4.0 - uTime * 0.25;
        float n = snoise(vec3(cos(sw) * r * 2.0, sin(sw) * r * 2.0, uTime * 0.15)) * 0.5 + 0.5;
        float band = pow(n, 3.0) * smoothstep(1.0, 0.25, r) * smoothstep(0.0, 0.25, r);
        vec3 c = mix(vec3(0.15, 0.4, 1.0), vec3(0.65, 0.25, 1.0), n) * band * 0.55 + vec3(0.1, 0.12, 0.35) * smoothstep(1.0, 0.0, r) * 0.3;
        gl_FragColor = vec4(c, band); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  portal.add(vortex);
  const portalCore = makeCore(0.7, high ? 40 : 22, CYAN, MAGENTA);
  portal.add(portalCore.group);
  pickables.push({ obj: portalCore.shell, info: { type: 'portal' } });
  tick((dt, t) => { portalCore.update(dt, t); portalRing.rotation.z = t * 0.02; });

  /* ================================================================ ENVIRONMENT */
  // holographic floor grid along the whole route
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(120, 320, 1, 1), new THREE.ShaderMaterial({
    uniforms: { uTime, uCam: { value: V(0, 0, 0) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime; uniform vec3 uCam; varying vec3 vW;
      void main(){
        vec2 c = vW.xz / 2.0; vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        float d = distance(vW.xz, uCam.xz);
        float fade = exp(-d * 0.055);
        float scan = smoothstep(0.92, 1.0, 1.0 - abs(fract(vW.z * 0.025 + uTime * 0.02) - 0.5) * 2.0);
        vec3 col = mix(vec3(0.15, 0.3, 0.9), vec3(0.55, 0.3, 1.0), 0.5 + 0.5 * sin(vW.x * 0.05)) * line * (0.3 + scan * 0.4);
        float a = line * fade * 0.8;
        gl_FragColor = vec4(col * fade, a);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  grid.rotation.x = -Math.PI / 2; grid.position.set(0, -5.2, -115);
  scene.add(grid);

  // star dust
  const SN = high ? 5000 : 2500;
  const sp = new Float32Array(SN * 3), ss = new Float32Array(SN);
  for (let i = 0; i < SN; i++) { sp.set([(Math.random() - 0.5) * 90, (Math.random() - 0.35) * 50, 30 - Math.random() * 290], i * 3); ss[i] = Math.random(); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aSeed', new THREE.BufferAttribute(ss, 1));
  const stars = new THREE.Points(sg, pointsMat(34, new THREE.Color(0.55, 0.6, 0.9))); stars.frustumCulled = false;
  scene.add(stars);

  // lights ride with the camera so every chapter gets the same blue/violet rim
  const rig = new THREE.Group(); scene.add(rig);
  const lBlue = new THREE.PointLight(0x3d7bff, 40, 30, 1.6); lBlue.position.set(-6, 3, -3); rig.add(lBlue);
  const lViolet = new THREE.PointLight(0x9a5cff, 40, 30, 1.6); lViolet.position.set(6, -2, -4); rig.add(lViolet);
  const lKey = new THREE.DirectionalLight(0xdfe6ff, 1.2); lKey.position.set(2, 5, 6); rig.add(lKey); rig.add(lKey.target);
  scene.add(new THREE.HemisphereLight(0x5a6cff, 0x05040a, 0.35));

  // chapter groups are culled by distance to keep far worlds from ghosting through the fog
  const cull = [[hero, 26], [services, 30], [agents, 26], [folio, 26], [benefits, 24], [show, 22], [portal, 26]].map(([g, r]) => ({ g, r }));
  const tunnelMid = TUNNEL.getPointAt(0.5);

  /* ================================================================ TIMELINE */
  let controls = [], posCurve = null, lookCurve = null;
  const portrait = () => camera.aspect < 0.85;
  function stopFor(ch, s) {
    if (!portrait()) return { pos: s.pos.clone(), look: s.look.clone() };
    if (ch.glide) return { pos: s.pos.clone(), look: s.look.clone().add(V(-0.9, -0.5, 0)) };
    // portrait: subject centred in the upper half, camera pulled back
    const subj = s.look.clone(); subj.x -= ch.shift ?? 1.9;
    const dir = s.pos.clone().sub(subj), dist = dir.length();
    const pos = subj.clone().addScaledVector(dir.normalize(), dist * (ch.pull ?? 1.5));
    const look = subj.clone(); look.y -= dist * 0.24;
    return { pos, look };
  }
  /** anchors: [{ name, start, end }] scroll px in page order */
  function setTimeline(anchors) {
    controls = [];
    anchors.forEach(({ name, start, end }) => {
      const ch = CHAPTERS[name];
      const stops = ch.stops.map((s) => stopFor(ch, s));
      const span = end - start;
      if (span < 2) { controls.push({ y: start, ...stops[0], mode: 'travel' }); return; }
      if (stops.length === 1) stops.push({ pos: stops[0].pos.clone().add(V(0, 0, -0.6)), look: stops[0].look.clone() });
      const n = stops.length;
      if (ch.dwell) {
        const w = 0.5 / n * 0.62;
        stops.forEach((s, k) => {
          const c = n === 1 ? 0 : k / (n - 1);
          const a = Math.max(0, c - w), b = Math.min(1, c + w);
          controls.push({ y: start + span * a, ...s, mode: 'dwell' });
          controls.push({ y: start + span * b, pos: s.pos.clone().add(V(0, 0, -0.35)), look: s.look.clone(), mode: k === n - 1 ? 'travel' : 'move' });
        });
      } else {
        stops.forEach((s, k) => controls.push({ y: start + span * (k / (n - 1)), ...s, mode: k === n - 1 ? 'travel' : ch.glide ? 'glide' : 'dwell' }));
      }
    });
    controls.sort((a, b) => a.y - b.y);
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
    t = a.mode === 'glide' ? t : a.mode === 'dwell' ? easeSine(t) : ease(t);
    const u = (i + t) / (n - 1);
    return { pos: posCurve.getPoint(u), look: lookCurve.getPoint(u) };
  }

  /* ================================================================ INTERACTION */
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  function setPointer(nx, ny) { pointer.set(nx, ny); mouse.x = nx; mouse.y = ny; }
  function pick() {
    ray.setFromCamera(pointer, camera);
    let best = null;
    for (const p of pickables) {
      if (!isVisible(p.obj)) continue;
      const hit = ray.intersectObject(p.obj, !!p.recursive)[0];
      if (hit && hit.distance < 24 && (!best || hit.distance < best.d)) best = { d: hit.distance, info: p.info, point: hit.point };
    }
    return best;
  }
  function isVisible(o) { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; }
  function click() {
    const hit = pick();
    if (!hit) return false;
    const { info } = hit;
    if (info.type === 'core') { core.pulse = 0; burst(hit.point); }
    else if (info.type === 'portal') { portalCore.pulse = 0; burst(hit.point); }
    else if (info.type === 'showcase') { if (state.mode === 0) showCore.pulse = 0; burst(hit.point); }
    onPick(info);
    return true;
  }
  // drag to spin the showcase
  let drag = null;
  function dragStart(nx, ny) {
    setPointer(nx, ny);
    const hit = pick();
    if (hit && hit.info.type === 'showcase') { drag = { x: nx, y: ny }; spin.dragging = true; return true; }
    return false;
  }
  function dragMove(nx, ny) {
    if (!drag) return;
    spin.vy = (nx - drag.x) * 60; spin.vx = -(ny - drag.y) * 40;
    drag.x = nx; drag.y = ny;
  }
  function dragEnd() { drag = null; spin.dragging = false; }

  // particle burst (sparks of light)
  const BN = 500;
  const bPos = new Float32Array(BN * 3), bVel = new Float32Array(BN * 3), bLife = new Float32Array(BN);
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(bPos, 3).setUsage(THREE.DynamicDrawUsage));
  bg.setAttribute('aLife', new THREE.BufferAttribute(bLife, 1).setUsage(THREE.DynamicDrawUsage));
  const bMat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 40 * dpr } },
    vertexShader: `attribute float aLife; uniform float uSize; varying float vL;
      void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aLife > 0.0 ? uSize * aLife / -mv.z : 0.0; }`,
    fragmentShader: `varying float vL; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vL;
      gl_FragColor = vec4(mix(vec3(0.5, 0.3, 1.0), vec3(0.6, 0.9, 1.0), vL) * a * 1.6, a); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const burstPts = new THREE.Points(bg, bMat); burstPts.frustumCulled = false; scene.add(burstPts);
  let bCur = 0;
  function burst(at, n = 120) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const i = bCur++ % BN;
      const d = V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 4);
      bPos.set(at.toArray(), i * 3); bVel.set(d.toArray(), i * 3); bLife[i] = 1;
    }
  }

  /* ================================================================ STATE */
  const state = {
    intro: reduced ? 1 : 0,
    activeService: 0, activeAgent: -1, project: 0, step: -1, morph: 0, mode: 0,
    hover: null,
  };

  /* ================================================================ RESIZE */
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    bloom.resolution.set((w * dpr) / 2, (h * dpr) / 2);
    camera.aspect = w / h;
    camera.fov = portrait() ? 52 : 35;
    camera.updateProjectionMatrix();
  }

  /* ================================================================ RENDER */
  const camPos = V(0, 3, 26), camLook = V(0, 0, 0);
  const fwd = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0), tmp = V(0, 0, 0);
  const coreWorld = V(0, 0, 0), invQ = new THREE.Quaternion();
  let time = 0, lastPick = 0, hoverKey = '', frameAvg = 16, slow = 0;

  function render(scrollY, dt) {
    dt = Math.min(dt, 0.05);
    time += dt; uTime.value = reduced ? 0 : time;
    if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / 3.4);

    const s = sample(scrollY);
    if (s) {
      if (state.intro < 1) { const k = 1 - ease(state.intro); s.pos.add(tmp.set(0, 2.5 * k, 18 * k)); }
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 1.6);
      mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 1.6);
      fwd.copy(s.look).sub(s.pos).normalize();
      right.crossVectors(fwd, camera.up).normalize(); up.crossVectors(right, fwd).normalize();
      const par = reduced ? 0 : 1;
      s.pos.addScaledVector(right, mouse.sx * 0.16 * par).addScaledVector(up, mouse.sy * 0.1 * par);
      const k = reduced ? 1 : 1 - Math.exp(-dt * 4.5);
      camPos.lerp(s.pos, k); camLook.lerp(s.look, k);
      camera.position.copy(camPos); camera.lookAt(camLook);
      // tunnel roll
      const tr = state.step >= 0 && state.step < 4 && camera.position.z < P.tunnelA.z && camera.position.z > P.tunnelB.z;
      void tr;
    }
    rig.position.copy(camera.position); rig.quaternion.copy(camera.quaternion);

    // hero core: energy ramp + pointer bulge (pointer direction in core-local space)
    core.energy = 0.25 + 0.75 * ease(state.intro);
    core.group.getWorldPosition(coreWorld);
    ray.setFromCamera(pointer, camera);
    tmp.copy(ray.ray.direction).multiplyScalar(camera.position.distanceTo(coreWorld)).add(ray.ray.origin).sub(coreWorld);
    core.pointerAmt = tmp.length() < 4.5 && !reduced ? 1 : 0;
    invQ.copy(core.group.getWorldQuaternion(new THREE.Quaternion())).invert();
    core.mat.uniforms.uPointer.value.copy(tmp.normalize().applyQuaternion(invQ));
    if (!reduced) { core.group.rotation.y += dt * 0.03; core.group.rotation.x = mouse.sy * 0.06; }

    // services: focus scaling
    svcItems.forEach((g, i) => {
      const on = state.activeService === i ? 1 : 0;
      g.userData.f = (g.userData.f ?? on) + (on - (g.userData.f ?? on)) * Math.min(1, dt * 4);
      g.scale.setScalar(0.82 + g.userData.f * 0.18);
      g.position.y = Math.sin(time * 0.35 + i * 2) * 0.06;
      if (!reduced && i < 2) g.rotation.y += (mouse.sx * 0.1 - g.rotation.y) * Math.min(1, dt * 1.2);
    });

    // benefits pointer repulsion (pointer projected to the cloud's plane)
    if (camera.position.distanceTo(P.benefits) < 16) {
      tmp.copy(ray.ray.direction).multiplyScalar(camera.position.distanceTo(P.benefits)).add(ray.ray.origin).sub(P.benefits);
      tmp.applyAxisAngle(V(0, 1, 0), -morph.rotation.y);
      morphMat.uniforms.uPointer.value.copy(tmp);
    }

    // culling
    cull.forEach((c) => { c.g.visible = camera.position.distanceTo(c.g.position) < c.r; });
    tunnel.visible = camera.position.z < P.tunnelA.z + 14 && camera.position.z > P.tunnelB.z - 12 || camera.position.distanceTo(tunnelMid) < 30;
    grid.material.uniforms.uCam.value.copy(camera.position);

    updaters.forEach((fn) => fn(dt, reduced ? 0 : time));

    // bursts
    let alive = false;
    for (let i = 0; i < BN; i++) {
      if (bLife[i] <= 0) continue; alive = true;
      const d = 1 - dt * 1.6;
      bVel[i * 3] *= d; bVel[i * 3 + 1] *= d; bVel[i * 3 + 2] *= d;
      bPos[i * 3] += bVel[i * 3] * dt; bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt; bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt;
      bLife[i] = Math.max(0, bLife[i] - dt * 0.9);
    }
    if (alive) { bg.attributes.position.needsUpdate = true; bg.attributes.aLife.needsUpdate = true; }

    // hover (throttled)
    if (time - lastPick > 0.07) {
      lastPick = time;
      const h = pick();
      const key = h ? h.info.type + (h.info.index ?? '') : '';
      if (key !== hoverKey) { hoverKey = key; state.hover = h ? h.info : null; onHover(state.hover); }
    }

    composer.render(dt);

    frameAvg = frameAvg * 0.95 + dt * 1000 * 0.05;
    if (frameAvg > 26 && dpr > 1) { if (++slow > 90) { dpr = Math.max(1, dpr - 0.25); slow = 0; resize(); } } else slow = 0;
  }

  resize();
  return { render, resize, setTimeline, setPointer, click, dragStart, dragMove, dragEnd, state, renderer, debug: { scene, camera, bloom } };
}
