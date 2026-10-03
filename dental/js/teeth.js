/**
 * teeth.js — procedural dental models (no model files).
 *
 * Crowns are lathe-turned silhouettes, squared off with a superellipse and
 * sculpted with gaussian cusps and fissures; roots are tapered lathes. The
 * cervical band is tinted with vertex colours so enamel fades into dentin.
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
const gauss = (d2, s) => Math.exp(-d2 / (2 * s * s));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const ENAMEL = new THREE.Color('#f7f4ee');
const DENTIN = new THREE.Color('#eadcc0');
const EDGE = new THREE.Color('#dfe5ea');   // translucent incisal edge

/* silhouettes, listed neck → tip (y up). Values are unit-ish; scaled per tooth. */
const PROFILES = {
  molar:    [[0.5, -0.32], [0.58, -0.1], [0.66, 0.04], [0.76, 0.18], [0.84, 0.4], [0.87, 0.62], [0.84, 0.8], [0.72, 0.95], [0.48, 1.03], [0.2, 1.05], [0.001, 1.04]],
  premolar: [[0.42, -0.3], [0.5, -0.08], [0.58, 0.06], [0.66, 0.26], [0.7, 0.52], [0.66, 0.74], [0.54, 0.9], [0.3, 0.99], [0.001, 1.0]],
  canine:   [[0.4, -0.3], [0.47, -0.05], [0.54, 0.12], [0.6, 0.45], [0.6, 0.85], [0.52, 1.1], [0.34, 1.3], [0.12, 1.4], [0.001, 1.42]],
  incisor:  [[0.4, -0.3], [0.46, -0.05], [0.52, 0.12], [0.58, 0.5], [0.62, 0.95], [0.62, 1.2], [0.58, 1.32], [0.36, 1.38], [0.001, 1.38]],
};
/* per type: mesio-distal / bucco-lingual scale, squareness, cusps [x, z, amp, sigma], fissure */
const TYPES = {
  molar:    { sx: 1.04, sz: 1.0, sq: 3.2, cusps: [[0.36, 0.33, 0.16, 0.24], [-0.36, 0.33, 0.15, 0.24], [0.36, -0.33, 0.14, 0.24], [-0.36, -0.33, 0.13, 0.24], [0, -0.05, -0.05, 0.3]], fissure: 'cross', roots: 3 },
  premolar: { sx: 0.82, sz: 1.0, sq: 2.6, cusps: [[0, 0.32, 0.17, 0.22], [0, -0.32, 0.12, 0.22]], fissure: 'line', roots: 1 },
  canine:   { sx: 0.86, sz: 0.66, sq: 2.2, cusps: [], fissure: null, roots: 1 },
  incisor:  { sx: 1.0, sz: 0.42, sq: 2.4, cusps: [], fissure: null, roots: 1 },
};

export function crownGeometry(type = 'molar', { seg = 96, scale = 1 } = {}) {
  const T = TYPES[type];
  const prof = new THREE.SplineCurve(PROFILES[type].map(([r, y]) => V2(r, y))).getPoints(seg >= 96 ? 70 : 40);
  let geo = new THREE.LatheGeometry(prof, seg);
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-5);
  const pos = geo.attributes.position;
  const top = PROFILES[type][PROFILES[type].length - 1][1];
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // superellipse: square the cross-section
    const r = Math.hypot(x, z);
    if (r > 1e-5) {
      const a = Math.atan2(z, x), n = T.sq;
      const k = 1 / Math.pow(Math.pow(Math.abs(Math.cos(a)), n) + Math.pow(Math.abs(Math.sin(a)), n), 1 / n);
      x = Math.cos(a) * r * Math.min(k, 1.28); z = Math.sin(a) * r * Math.min(k, 1.28);
    }
    x *= T.sx; z *= T.sz;
    // occlusal anatomy
    const occ = smooth(top * 0.55, top, y);
    let dy = 0;
    for (const [cx, cz, amp, s] of T.cusps) dy += amp * gauss((x - cx) ** 2 + (z - cz) ** 2, s);
    if (T.fissure === 'cross') dy -= 0.09 * Math.max(gauss(x * x, 0.06), gauss(z * z, 0.07));
    if (T.fissure === 'line') dy -= 0.09 * gauss(z * z, 0.07);
    y += dy * occ;
    // gentle labial bulge on the front teeth
    if ((type === 'incisor' || type === 'canine') && z > 0) z += 0.04 * Math.sin(Math.min(1, Math.max(0, y / top)) * Math.PI);
    pos.setXYZ(i, x * scale, y * scale, z * scale);
    c.copy(DENTIN).lerp(ENAMEL, smooth(-0.05, 0.22, y));
    if (type === 'incisor' || type === 'canine') c.lerp(EDGE, smooth(top * 0.72, top, y) * 0.9);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function rootGeometry(length = 1.6, radius = 0.3, seg = 40) {
  const prof = [V2(0.001, -length), V2(radius * 0.18, -length + 0.06), V2(radius * 0.42, -length * 0.82), V2(radius * 0.7, -length * 0.5), V2(radius * 0.9, -length * 0.18), V2(radius, 0.08)];
  let geo = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(30), seg);
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-5);
  geo.computeVertexNormals();
  return geo;
}

export function makeMaterials() {
  return {
    enamel: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.2, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.35, sheenColor: new THREE.Color('#fff4e0'), sheenRoughness: 0.45,
      ior: 1.62, specularIntensity: 0.9, envMapIntensity: 1.15,
    }),
    dentin: new THREE.MeshPhysicalMaterial({ color: '#e8d9bd', roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.9 }),
    titanium: new THREE.MeshStandardMaterial({ color: '#b9bfc8', metalness: 1, roughness: 0.3, envMapIntensity: 1.3 }),
    titaniumWarm: new THREE.MeshStandardMaterial({ color: '#cfc2a2', metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }),
    gum: new THREE.MeshPhysicalMaterial({ color: '#d98a8a', roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.6, sheenColor: new THREE.Color('#ffc4c4') }),
  };
}

/** A full tooth (crown + roots) as a Group. y = 0 at the neck, crown up. */
export function makeTooth(type, mats, { seg = 96, crownMat = null } = {}) {
  const g = new THREE.Group();
  const crown = new THREE.Mesh(crownGeometry(type, { seg }), crownMat || mats.enamel);
  g.add(crown);
  const T = TYPES[type];
  const neck = PROFILES[type][0][0];
  const roots = type === 'molar'
    ? [[0.28, 0.16, 0.12, -0.08, 1.55, 0.3], [-0.28, 0.16, -0.12, -0.08, 1.5, 0.3], [0, -0.26, 0, 0.14, 1.6, 0.34]]
    : [[0, 0, 0, 0, type === 'canine' ? 2.1 : type === 'incisor' ? 1.75 : 1.6, neck * 0.98]];
  roots.forEach(([x, z, rz, rx, len, rad]) => {
    const m = new THREE.Mesh(rootGeometry(len, rad, Math.round(seg / 2.4)), mats.dentin);
    m.position.set(x, -0.3, z); m.rotation.set(rx, 0, rz);
    if (type !== 'molar') m.scale.set(T.sx, 1, T.sz * 1.15);
    g.add(m);
  });
  g.userData.crown = crown;
  return g;
}

/** Titanium implant: tapered core + helical thread + hex platform. Top at y = 0. */
export function makeImplant(mats, { seg = 48 } = {}) {
  const g = new THREE.Group();
  const L = 1.75, rTop = 0.31, rBot = 0.15;
  const coreR = (y) => { const t = Math.min(1, Math.max(0, -y / L)); return rTop - (rTop - rBot) * Math.pow(t, 1.6); };
  const prof = [];
  for (let i = 0; i <= 30; i++) { const y = -L + (i / 30) * L; prof.push(V2(Math.max(0.001, coreR(y) - (i === 0 ? coreR(y) : 0)), y)); }
  prof[0] = V2(0.001, -L - 0.05);
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, seg), mats.titanium));
  const turns = 9, pts = [];
  for (let i = 0; i <= 900; i++) {
    const t = i / 900, y = -L + 0.1 + t * (L - 0.22), a = t * Math.PI * 2 * turns;
    const r = coreR(y) + 0.028;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.036, 6), mats.titanium));
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 6), mats.titanium);
  hex.position.y = 0.04; g.add(hex);
  return g;
}

export function makeAbutment(mats) {
  const prof = [[0.2, -0.22], [0.27, -0.06], [0.3, 0.02], [0.26, 0.14], [0.21, 0.5], [0.16, 0.6], [0.001, 0.62]].map(([r, y]) => V2(r, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(30), 48), mats.titaniumWarm);
  return m;
}

/* ------------------------------------------------------------------ arches */
const ARCH = ['incisor', 'incisor', 'canine', 'premolar', 'premolar', 'molar', 'molar'];
// true mesio-distal crown widths (max profile radius × sx × 2, slightly tucked)
const WIDTH = { incisor: 1.18, canine: 0.98, premolar: 1.08, molar: 1.66 };
const SCALE = { incisor: 0.9, canine: 0.88, premolar: 0.8, molar: 0.92 };

/**
 * Builds a dental arch (14 teeth) on a parabola, crowns pointing up.
 * Returns { group, teeth: [{ mesh, type, home: {pos, rotY}, index, side }] }
 */
export function makeArch(mats, { seg = 64, a = 0.13, lateralScale = [1, 0.84], crownMat = null } = {}) {
  const group = new THREE.Group();
  const teeth = [];
  // walk along z = -a·x² by arc length
  const curve = (x) => new THREE.Vector3(x, 0, -a * x * x);
  const step = 0.002;
  [1, -1].forEach((side) => {
    let x = 0, travelled = 0;
    ARCH.forEach((type, k) => {
      const s = SCALE[type] * (k === 1 ? lateralScale[1] : 1);
      const w = WIDTH[type] * s * 0.98;
      const target = travelled + w / 2;
      // advance x until arc length reaches the tooth centre
      let p = curve(x), acc = travelled;
      while (acc < target) { const nx = x + step * side; const np = curve(nx); acc += np.distanceTo(p); p = np; x = nx; }
      const centre = p.clone();
      // continue to the far edge of the tooth
      const edge = travelled + w;
      while (acc < edge) { const nx = x + step * side; const np = curve(nx); acc += np.distanceTo(p); p = np; x = nx; }
      travelled = acc;
      const tooth = makeTooth(type, mats, { seg, crownMat });
      tooth.scale.setScalar(s);
      const ang = Math.atan2(2 * a * centre.x, 1);         // local +z (labial) along the outward normal
      tooth.position.copy(centre);
      tooth.rotation.y = ang;
      group.add(tooth);
      teeth.push({ mesh: tooth, type, index: k, side, home: { pos: centre.clone(), rotY: ang, scale: s } });
    });
  });
  return { group, teeth };
}

/* ------------------------------------------------------------------ gums */
const HALF_DEPTH = { incisor: 0.3, canine: 0.42, premolar: 0.66, molar: 0.86 };
/**
 * Labial gum surface for an arch built by makeArch (arch-local space, crowns up).
 * Scalloped margin: low over each crown centre, rising into a papilla between teeth.
 */
export function makeGum(arch, mats, { a = 0.13, level = 0.06, papilla = 0.34, depth = 0.95 } = {}) {
  const teeth = arch.teeth.slice().sort((p, q) => p.home.pos.x - q.home.pos.x);
  const xs = teeth.map((t) => t.home.pos.x);
  const bounds = xs.slice(1).map((x, i) => (x + xs[i]) / 2);
  const span = [xs[0] - 0.6, xs[xs.length - 1] + 0.6];
  const NU = 260, NV = 14;
  const pos = new Float32Array((NU + 1) * (NV + 1) * 3);
  const idx = [];
  const halfDepthAt = (x) => {
    let wsum = 0, v = 0;
    teeth.forEach((t) => { const w = Math.exp(-((x - t.home.pos.x) ** 2) / 0.18); wsum += w; v += w * HALF_DEPTH[t.type] * t.home.scale; });
    return wsum ? v / wsum : 0.5;
  };
  for (let i = 0; i <= NU; i++) {
    const x = span[0] + (span[1] - span[0]) * (i / NU);
    const z = -a * x * x;
    const n = new THREE.Vector2(2 * a * x, 1).normalize();          // outward normal in (x, z)
    let edge = level;
    bounds.forEach((b) => { edge += papilla * Math.exp(-((x - b) ** 2) / (2 * 0.075 ** 2)); });
    const hd = halfDepthAt(x);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;                                               // 0 = margin, 1 = deep (hidden)
      const y = edge + (-depth - edge) * v;
      const bulge = 0.05 + 0.14 * Math.sin(Math.min(1, v * 1.6) * Math.PI * 0.5) - 0.04 * v;
      const off = hd + bulge;
      const k = (i * (NV + 1) + j) * 3;
      pos[k] = x + n.x * off; pos[k + 1] = y; pos[k + 2] = z + n.y * off;
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const p0 = i * (NV + 1) + j, p1 = p0 + NV + 1;
    idx.push(p0, p1, p0 + 1, p1, p1 + 1, p0 + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const gumMat = mats.gum.clone(); gumMat.side = THREE.DoubleSide;
  return new THREE.Mesh(geo, gumMat);
}
