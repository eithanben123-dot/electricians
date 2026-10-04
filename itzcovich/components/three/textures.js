import * as THREE from 'three';

const cache = {};
function canvasTexture(key, size, draw, { srgb = true, repeat = [1, 1] } = {}) {
  if (cache[key]) return cache[key];
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache[key] = t;
  return t;
}

/** fine plaster / concrete grain (used as bump) */
export const plasterBump = () => canvasTexture('plaster', 256, (x, s) => {
  x.fillStyle = '#808080'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i++) { const v = 110 + Math.random() * 40 | 0; x.fillStyle = `rgba(${v},${v},${v},.35)`; x.fillRect(Math.random() * s, Math.random() * s, 1.4, 1.4); }
}, { srgb: false, repeat: [6, 6] });

/** lawn: mottled greens */
export const grass = () => canvasTexture('grass', 512, (x, s) => {
  x.fillStyle = '#7d8f4e'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 26000; i++) {
    const g = Math.random();
    x.fillStyle = g < 0.5 ? 'rgba(98,118,58,.35)' : g < 0.85 ? 'rgba(140,152,84,.3)' : 'rgba(170,165,110,.25)';
    x.fillRect(Math.random() * s, Math.random() * s, 2, 2 + Math.random() * 3);
  }
}, { repeat: [14, 14] });

/** teak deck planks */
export const wood = () => canvasTexture('wood', 512, (x, s) => {
  const planks = 8, h = s / planks;
  for (let i = 0; i < planks; i++) {
    const base = 120 + Math.random() * 30;
    x.fillStyle = `rgb(${base + 40},${base},${base - 45})`; x.fillRect(0, i * h, s, h);
    for (let k = 0; k < 60; k++) { x.strokeStyle = `rgba(70,45,25,${0.05 + Math.random() * 0.08})`; x.beginPath(); const y = i * h + Math.random() * h; x.moveTo(0, y); x.bezierCurveTo(s * 0.3, y + 2, s * 0.6, y - 2, s, y + 1); x.stroke(); }
    x.fillStyle = 'rgba(40,25,15,.55)'; x.fillRect(0, i * h + h - 2, s, 2);
  }
}, { repeat: [1, 1] });

/** travertine stone */
export const travertine = () => canvasTexture('trav', 512, (x, s) => {
  x.fillStyle = '#d9ccb4'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(150,128,96,${0.06 + Math.random() * 0.1})`; x.lineWidth = 1 + Math.random() * 2; const y = Math.random() * s; x.beginPath(); x.moveTo(0, y); x.lineTo(s, y + (Math.random() - 0.5) * 8); x.stroke(); }
  x.strokeStyle = 'rgba(120,100,75,.35)'; x.lineWidth = 2;
  for (let r = 0; r < 4; r++) { x.beginPath(); x.moveTo(0, (r * s) / 4); x.lineTo(s, (r * s) / 4); x.stroke(); }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const xx = (c * s) / 2 + (r % 2) * (s / 4); x.beginPath(); x.moveTo(xx, (r * s) / 4); x.lineTo(xx, ((r + 1) * s) / 4); x.stroke(); }
}, { repeat: [4, 1] });

/** animated-water normal map (tileable value noise → normals) */
export const waterNormal = () => canvasTexture('waterN', 256, (x, s) => {
  const h = new Float32Array(s * s);
  for (const [f, a] of [[4, 1], [8, 0.5], [16, 0.25], [32, 0.12]]) {
    const grid = Array.from({ length: (f + 1) * (f + 1) }, () => Math.random());
    const g = (i, j) => grid[(j % f) * (f + 1) + (i % f)];
    for (let y = 0; y < s; y++) for (let xx = 0; xx < s; xx++) {
      const fx = (xx / s) * f, fy = (y / s) * f, i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      h[y * s + xx] += a * ((g(i, j) * (1 - sx) + g(i + 1, j) * sx) * (1 - sy) + (g(i, j + 1) * (1 - sx) + g(i + 1, j + 1) * sx) * sy);
    }
  }
  const img = x.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let xx = 0; xx < s; xx++) {
    const dx = h[y * s + ((xx + 1) % s)] - h[y * s + ((xx - 1 + s) % s)];
    const dy = h[((y + 1) % s) * s + xx] - h[((y - 1 + s) % s) * s + xx];
    const n = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize();
    const k = (y * s + xx) * 4;
    img.data[k] = (n.x * 0.5 + 0.5) * 255; img.data[k + 1] = (n.y * 0.5 + 0.5) * 255; img.data[k + 2] = (n.z * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}, { srgb: false, repeat: [3, 3] });

/** sand / land for the map */
export const sand = () => canvasTexture('sand', 512, (x, s) => {
  x.fillStyle = '#e9dfcb'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 18000; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(200,185,155,.25)' : 'rgba(250,245,235,.3)'; x.fillRect(Math.random() * s, Math.random() * s, 2, 2); }
}, { repeat: [3, 3] });
