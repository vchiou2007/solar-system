/**
 * 3D Solar System v2.2 — Orbital inclinations added
 * Each planet orbits on a slightly tilted plane (like real solar system)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const state = { paused: false, speed: 1.0, showLabels: true, realisticLighting: true, bgLevel: 'dark' };
const planetMeshes = [];

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 1000);
camera.position.set(20, 30, 50); camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 8; controls.maxDistance = 150; controls.target.set(0, 0, 0); controls.update();

const ambientLight = new THREE.AmbientLight(0x111133, 0.5); scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 300, 200, 0.5); sunLight.position.set(0, 0, 0); scene.add(sunLight);
const sunLight2 = new THREE.PointLight(0xffcc88, 80, 100, 0.6); sunLight2.position.set(0, 0, 0); scene.add(sunLight2);

function applyBackground(lvl) {
    switch (lvl) {
        case 'dark': scene.background = new THREE.Color(0x000008); scene.fog = new THREE.FogExp2(0x000010, 0.0001); ambientLight.intensity = 0.4; sunLight2.intensity = 40; renderer.toneMappingExposure = 0.9; break;
        case 'mid': scene.background = new THREE.Color(0x0a1540); scene.fog = new THREE.FogExp2(0x0a1540, 0.00004); ambientLight.intensity = 0.9; sunLight2.intensity = 90; renderer.toneMappingExposure = 1.3; break;
        case 'bright': scene.background = new THREE.Color(0x1a3070); scene.fog = new THREE.FogExp2(0x1a3070, 0.00002); ambientLight.intensity = 1.6; sunLight2.intensity = 150; renderer.toneMappingExposure = 1.8; break;
    }
}
applyBackground(state.bgLevel);

function mkStars() {
    const n = 2500, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const r = 80 + Math.random() * 120, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); p[i * 3] = r * Math.sin(ph) * Math.cos(th); p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); p[i * 3 + 2] = r * Math.cos(ph); const q = Math.random(); if (q < 0.08) { c[i * 3] = 0.7; c[i * 3 + 1] = 0.8; c[i * 3 + 2] = 1.0; } else if (q < 0.15) { c[i * 3] = 1.0; c[i * 3 + 1] = 0.85; c[i * 3 + 2] = 0.6; } else { const b = 0.5 + Math.random() * 0.5; c[i * 3] = b; c[i * 3 + 1] = b; c[i * 3 + 2] = b; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const s = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.15, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); return s;
}
const starfield = mkStars();

function mkTex(w, h, fn) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }

// ── SUN ──
const sunTex = mkTex(512, 256, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.08, '#fffde0'); g.addColorStop(0.25, '#ffe040'); g.addColorStop(0.5, '#ff9900'); g.addColorStop(0.75, '#ee5500'); g.addColorStop(0.9, '#cc2200'); g.addColorStop(1, '#881100'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 50; i++) { const sx = Math.random() * w, sy = Math.random() * h, sr = 3 + Math.random() * 14; const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr); sg.addColorStop(0, 'rgba(255,200,50,0.7)'); sg.addColorStop(0.5, 'rgba(255,120,20,0.4)'); sg.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill(); } });
const sun = new THREE.Mesh(new THREE.SphereGeometry(4.5, 64, 64), new THREE.MeshBasicMaterial({ map: sunTex })); scene.add(sun);

function mkGlow(r, col, op) { const gt = mkTex(256, 256, (ctx) => { const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,220,1)'); g.addColorStop(0.12, 'rgba(255,200,60,0.9)'); g.addColorStop(0.35, 'rgba(255,100,20,0.4)'); g.addColorStop(0.65, 'rgba(255,30,0,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); }); const gm = new THREE.SphereGeometry(r, 32, 32); const mm = new THREE.ShaderMaterial({ uniforms: { gTex: { value: gt }, gCol: { value: new THREE.Color(col) }, gOp: { value: op } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'varying vec2 vUv; uniform sampler2D gTex; uniform vec3 gCol; uniform float gOp; void main() { vec4 t = texture2D(gTex, vUv); gl_FragColor = vec4(gCol * t.rgb, t.a * gOp); }', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); const m = new THREE.Mesh(gm, mm); m.renderOrder = 1; return m; }
const g1 = mkGlow(6, '#ffaa00', 0.7), g2 = mkGlow(8.5, '#ff6600', 0.35), g3 = mkGlow(11.5, '#ff3300', 0.12);
scene.add(g1); scene.add(g2); scene.add(g3);

// ── PLANET DATA (inc = orbital inclination in degrees) ──
const orbitColors = [0x888899, 0xddaa66, 0x4488ff, 0xff6644, 0xddaa55, 0xeebb77, 0x66ccdd, 0x4466dd, 0x998877];

const planetDefs = [
    { name: 'Mercury', r: 0.4, orb: 7.5, sp: 4.0, rot: 0.004, inc: 7.0, draw(ctx, w, h) { ctx.fillStyle = '#b8ada0'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 250; i++) { const cx = Math.random() * w, cy = Math.random() * h, cr = 1 + Math.random() * 7, s = 120 + Math.random() * 50; ctx.fillStyle = `rgb(${s},${s - 15},${s - 30})`; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill(); } for (let i = 0; i < 15; i++) { ctx.strokeStyle = 'rgba(200,190,175,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.random() * w, Math.random() * h); ctx.lineTo(Math.random() * w, Math.random() * h); ctx.stroke(); } } },
    { name: 'Venus', r: 0.9, orb: 11.5, sp: 2.9, rot: 0.002, inc: 3.4, draw(ctx, w, h) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f0e0b0'); bg.addColorStop(0.3, '#e8d498'); bg.addColorStop(0.5, '#f2e4b8'); bg.addColorStop(0.7, '#e0cc88'); bg.addColorStop(1, '#ecd8a0'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 80; i++) { ctx.fillStyle = `rgba(255,245,220,${0.08 + Math.random() * 0.18})`; ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 10); } } },
    { name: 'Earth', r: 0.95, orb: 16.5, sp: 2.4, rot: 0.02, inc: 0.0, draw(ctx, w, h) { const ocn = ctx.createLinearGradient(0, 0, 0, h); ocn.addColorStop(0, '#1144aa'); ocn.addColorStop(0.3, '#2266cc'); ocn.addColorStop(0.5, '#3377ee'); ocn.addColorStop(0.7, '#2266cc'); ocn.addColorStop(1, '#1144aa'); ctx.fillStyle = ocn; ctx.fillRect(0, 0, w, h); [{ x: 70, y: 80, rx: 42, ry: 52 }, { x: 120, y: 72, rx: 26, ry: 48 }, { x: 210, y: 58, rx: 58, ry: 56 }, { x: 290, y: 68, rx: 32, ry: 42 }, { x: 350, y: 82, rx: 48, ry: 52 }, { x: 360, y: 145, rx: 26, ry: 58 }, { x: 160, y: 155, rx: 22, ry: 38 }, { x: 50, y: 175, rx: 16, ry: 28 }].forEach(ll => { ctx.fillStyle = '#4a9e2a'; ctx.beginPath(); ctx.ellipse(ll.x, ll.y, ll.rx, ll.ry, Math.random() * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(100,170,80,0.45)'; ctx.beginPath(); ctx.ellipse(ll.x + 6, ll.y - 4, ll.rx * 0.55, ll.ry * 0.55, 0.2, 0, Math.PI * 2); ctx.fill(); }); for (let i = 0; i < 100; i++) { ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.07})`; ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 22, 1 + Math.random() * 3); } ctx.fillStyle = 'rgba(240,248,255,0.8)'; ctx.fillRect(0, 0, w, 16); ctx.fillRect(0, h - 11, w, 11); } },
    { name: 'Mars', r: 0.6, orb: 22.5, sp: 1.7, rot: 0.018, inc: 1.9, draw(ctx, w, h) { ctx.fillStyle = '#e0553a'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { const cx = Math.random() * w, cy = Math.random() * h, cr = 4 + Math.random() * 14; ctx.fillStyle = `rgba(${180 + Math.random() * 50},${Math.random() * 50},${Math.random() * 20},0.55)`; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = 'rgba(245,240,225,0.55)'; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 9, w, 9); } },
    { name: 'Jupiter', r: 3.3, orb: 33, sp: 0.95, rot: 0.045, inc: 1.3, draw(ctx, w, h) { [[0, 28, '#f0dfc8'], [28, 20, '#d4a068'], [48, 38, '#ecd8b8'], [86, 16, '#c07040'], [102, 32, '#e8d0a8'], [134, 24, '#d89058'], [158, 36, '#f0e0c0'], [194, 18, '#c47038'], [212, 30, '#e4cca0'], [242, 14, '#cc8848']].forEach(b => { ctx.fillStyle = b[2]; ctx.fillRect(0, b[0], w, b[1]); }); for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(210,150,100,${0.08 + Math.random() * 0.18})`; ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, 4 + Math.random() * 16, 2 + Math.random() * 8, 0, 0, Math.PI * 2); ctx.fill(); } const grsX = w * 0.33, grsY = h * 0.54; const grs = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 22); grs.addColorStop(0, '#ff6644'); grs.addColorStop(0.2, '#ee5533'); grs.addColorStop(0.5, '#d0402a'); grs.addColorStop(0.75, '#c04030'); grs.addColorStop(1, 'rgba(200,130,90,0)'); ctx.fillStyle = grs; ctx.beginPath(); ctx.ellipse(grsX, grsY, 22, 11, 0.05, 0, Math.PI * 2); ctx.fill(); const grs2 = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 8); grs2.addColorStop(0, '#ff9977'); grs2.addColorStop(1, 'rgba(255,100,60,0)'); ctx.fillStyle = grs2; ctx.beginPath(); ctx.ellipse(grsX, grsY, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); const ssX = w * 0.65, ssY = h * 0.48; const ss = ctx.createRadialGradient(ssX, ssY, 0, ssX, ssY, 10); ss.addColorStop(0, '#e87850'); ss.addColorStop(0.5, '#d06040'); ss.addColorStop(1, 'rgba(200,130,90,0)'); ctx.fillStyle = ss; ctx.beginPath(); ctx.ellipse(ssX, ssY, 10, 5, -0.05, 0, Math.PI * 2); ctx.fill(); } },
    { name: 'Saturn', r: 2.7, orb: 41, sp: 0.65, rot: 0.038, inc: 2.5, hasRings: true, draw(ctx, w, h) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f6f0d8'); bg.addColorStop(0.3, '#f0e4b8'); bg.addColorStop(0.5, '#f8f0d8'); bg.addColorStop(0.7, '#e8d898'); bg.addColorStop(1, '#f2e8c0'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(220,200,160,${0.08 + Math.random() * 0.12})`; ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 5); } } },
    { name: 'Uranus', r: 1.9, orb: 51, sp: 0.45, rot: 0.028, inc: 0.8, draw(ctx, w, h) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#c8f0f8'); bg.addColorStop(0.5, '#88d8e8'); bg.addColorStop(1, '#b0e8f4'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(200,240,250,${0.1 + Math.random() * 0.15})`; ctx.fillRect(0, Math.random() * h, w, 3 + Math.random() * 6); } } },
    { name: 'Neptune', r: 1.8, orb: 57, sp: 0.35, rot: 0.025, inc: 1.8, draw(ctx, w, h) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2244cc'); bg.addColorStop(0.3, '#3355ee'); bg.addColorStop(0.5, '#2244cc'); bg.addColorStop(0.7, '#3355ee'); bg.addColorStop(1, '#2244cc'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2); } for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(60,120,220,${0.08 + Math.random() * 0.12})`; ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 5); } } },
    { name: 'Pluto', r: 0.3, orb: 65, sp: 0.25, rot: 0.003, inc: 17.1, draw(ctx, w, h) { ctx.fillStyle = '#e0d5c8'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 50; i++) { const cx = Math.random() * w, cy = Math.random() * h; ctx.fillStyle = 'rgba(200,185,170,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, 2 + Math.random() * 6, 0, Math.PI * 2); ctx.fill(); } const hx = w * 0.5, hy = h * 0.45; ctx.fillStyle = 'rgba(240,230,215,0.6)'; ctx.beginPath(); ctx.moveTo(hx, hy + 18); ctx.bezierCurveTo(hx - 22, hy - 2, hx - 30, hy - 22, hx, hy - 5); ctx.bezierCurveTo(hx + 30, hy - 22, hx + 22, hy - 2, hx, hy + 18); ctx.fill(); } },
];

// ── BUILD PLANETS (no pivots — direct tilted orbits) ──
const planets = [], labels = [], orbitLines = [];
planetDefs.forEach((def, idx) => {
    const incRad = def.inc * Math.PI / 180;
    const tex = mkTex(512, 256, def.draw);
    const stdMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0.05 });
    const basicMat = new THREE.MeshBasicMaterial({ map: tex });
    const geom = new THREE.SphereGeometry(def.r, 48, 48);
    const mesh = new THREE.Mesh(geom, state.realisticLighting ? stdMat : basicMat);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = def.name;
    mesh.userData = { orbR: def.orb, sp: def.sp, rotSp: def.rot, incRad, ang: Math.random() * Math.PI * 2, name: def.name, stdMat, basicMat };
    scene.add(mesh);
    planetMeshes.push(mesh);

    // ★ TILTED orbit line — directly computed in world space
    const pts = [];
    for (let i = 0; i <= 256; i++) {
        const a = (i / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3(
            Math.cos(a) * def.orb,
            Math.sin(a) * def.orb * Math.sin(incRad),
            Math.sin(a) * def.orb * Math.cos(incRad)
        ));
    }
    const orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: orbitColors[idx], transparent: true, opacity: 0.55 })
    );
    scene.add(orbitLine);
    orbitLines.push(orbitLine);

    // Saturn rings
    if (def.hasRings) {
        const rg = new THREE.RingGeometry(def.r * 1.4, def.r * 2.5, 160); const rp = rg.attributes.position; const rv = []; for (let i = 0; i < rp.count; i++) rv.push(rp.getX(i), 0, rp.getY(i));
        rg.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3)); rg.computeVertexNormals();
        const rc = document.createElement('canvas'); rc.width = 512; rc.height = 64; const rctx = rc.getContext('2d');
        const rgrad = rctx.createLinearGradient(0, 0, 512, 0); rgrad.addColorStop(0, 'rgba(160,140,110,0.05)'); rgrad.addColorStop(0.1, 'rgba(210,185,140,0.5)'); rgrad.addColorStop(0.2, 'rgba(230,200,160,0.7)'); rgrad.addColorStop(0.3, 'rgba(180,155,120,0.15)'); rgrad.addColorStop(0.45, 'rgba(240,215,175,0.85)'); rgrad.addColorStop(0.55, 'rgba(220,195,155,0.75)'); rgrad.addColorStop(0.7, 'rgba(190,160,130,0.25)'); rgrad.addColorStop(0.85, 'rgba(150,125,100,0.1)'); rgrad.addColorStop(1, 'rgba(80,70,55,0)');
        rctx.fillStyle = rgrad; rctx.fillRect(0, 0, 512, 64); const rtex = new THREE.CanvasTexture(rc); rtex.colorSpace = THREE.SRGBColorSpace;
        const rm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rtex, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
        rm.rotation.x = Math.PI / 2; rm.userData = { isRing: true }; mesh.add(rm);
    }

    // Label
    const lc = document.createElement('canvas'); lc.width = 256; lc.height = 64; const lctx = lc.getContext('2d');
    lctx.fillStyle = '#ffffff'; lctx.font = 'bold 28px "Segoe UI", Arial'; lctx.textAlign = 'center'; lctx.textBaseline = 'middle'; lctx.fillText(def.name, 128, 32);
    const lt = new THREE.CanvasTexture(lc); lt.minFilter = THREE.LinearFilter; lt.colorSpace = THREE.SRGBColorSpace;
    const ls = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthTest: false, depthWrite: false }));
    ls.scale.set(def.r * 2.5, def.r * 0.6, 1); ls.position.y = def.r + 0.9; ls.userData = { isLabel: true }; mesh.add(ls); labels.push(ls);
    planets.push(mesh);
});

// ── MOON (still relative to Earth, Earth's pivot handles tilt) ──
const earth = planets.find(p => p.name === 'Earth');
const moonTex = mkTex(128, 64, (ctx, w, h) => { ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 100; i++) { const s = 170 + Math.random() * 60; ctx.fillStyle = `rgb(${s},${s},${s})`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, Math.PI * 2); ctx.fill(); } });
const moonStd = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.9 });
const moonBasic = new THREE.MeshBasicMaterial({ map: moonTex });
const moon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 32), state.realisticLighting ? moonStd : moonBasic);
moon.name = 'Moon'; moon.userData = { orbR: 2.0, sp: 7.5, ang: 0, stdMat: moonStd, basicMat: moonBasic };
// Moon follows Earth world position
scene.add(moon);
const mlc = document.createElement('canvas'); mlc.width = 128; mlc.height = 32; const mlctx = mlc.getContext('2d'); mlctx.fillStyle = '#cccccc'; mlctx.font = 'bold 18px "Segoe UI", Arial'; mlctx.textAlign = 'center'; mlctx.textBaseline = 'middle'; mlctx.fillText('Moon', 64, 16);
const mlt = new THREE.CanvasTexture(mlc); mlt.minFilter = THREE.LinearFilter; mlt.colorSpace = THREE.SRGBColorSpace;
const moonLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: mlt, transparent: true, depthTest: false, depthWrite: false }));
moonLabel.scale.set(0.9, 0.22, 1); moonLabel.position.y = 0.55; moon.add(moonLabel); labels.push(moonLabel);

// ── ASTEROID BELT ──
const abCount = 1500, abPos = new Float32Array(abCount * 3);
for (let i = 0; i < abCount; i++) { const a = Math.random() * Math.PI * 2, r = 26 + Math.random() * 5; abPos[i * 3] = Math.cos(a) * r; abPos[i * 3 + 1] = (Math.random() - 0.5) * 1.8; abPos[i * 3 + 2] = Math.sin(a) * r; }
const abGeom = new THREE.BufferGeometry(); abGeom.setAttribute('position', new THREE.BufferAttribute(abPos, 3));
const asteroidBelt = new THREE.Points(abGeom, new THREE.PointsMaterial({ size: 0.1, color: 0x999988, blending: THREE.AdditiveBlending, depthWrite: false }));
asteroidBelt.rotation.x = 0.03; scene.add(asteroidBelt);

// ── LIGHTING TOGGLE ──
function setLightingMode(realistic) {
    state.realisticLighting = realistic;
    planetMeshes.forEach(m => { m.material = realistic ? m.userData.stdMat : m.userData.basicMat; });
    if (moon.userData.stdMat) moon.material = realistic ? moon.userData.stdMat : moon.userData.basicMat;
    const btn = document.getElementById('btn-lighting'); if (btn) btn.textContent = realistic ? '🌓 寫實光影' : '☀️ 全亮模式';
}

// ── BG LEVEL ──
function setBgLevel(lvl) {
    state.bgLevel = lvl; applyBackground(lvl);
    ['dark', 'mid', 'bright'].forEach(x => { const b = document.getElementById('btn-bg-' + x); if (b) b.classList.toggle('active', x === lvl); });
}

// ── ANIMATION ──
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1), edt = state.paused ? 0 : dt * state.speed;
    sun.rotation.y += edt * 0.1; g1.rotation.y += edt * 0.03; g2.rotation.y -= edt * 0.02; g3.rotation.y += edt * 0.015;

    // ★ Planets orbit on tilted planes (direct world-space calc)
    planets.forEach((p, idx) => {
        const u = p.userData;
        u.ang += edt * u.sp * 0.5;
        p.position.x = Math.cos(u.ang) * u.orbR;
        p.position.y = Math.sin(u.ang) * u.orbR * Math.sin(u.incRad);
        p.position.z = Math.sin(u.ang) * u.orbR * Math.cos(u.incRad);
        p.rotation.y += edt * u.rotSp;
        p.children.forEach(c => { if (c.userData && c.userData.isLabel) c.visible = state.showLabels; });
    });

    // Moon orbits around Earth's world position
    moon.userData.ang += edt * moon.userData.sp * 0.5;
    const eWorld = new THREE.Vector3(); earth.getWorldPosition(eWorld);
    moon.position.x = eWorld.x + Math.cos(moon.userData.ang) * moon.userData.orbR;
    moon.position.z = eWorld.z + Math.sin(moon.userData.ang) * moon.userData.orbR;
    moon.position.y = eWorld.y;
    moon.rotation.y += edt * 0.01;
    moonLabel.visible = state.showLabels;

    starfield.rotation.y += edt * 0.002; starfield.rotation.x += edt * 0.001;
    asteroidBelt.rotation.y += edt * 0.03;
    controls.update(); renderer.render(scene, camera);
}

// ── UI ──
function $(id) { return document.getElementById(id); }
$('btn-pause').addEventListener('click', () => { state.paused = !state.paused; $('btn-pause').textContent = state.paused ? '▶️ 繼續' : '⏯️ 暫停'; $('btn-pause').classList.toggle('active', state.paused); });
$('speed-slider').addEventListener('input', () => { state.speed = parseFloat($('speed-slider').value); $('speed-value').textContent = state.speed.toFixed(1) + '×'; });
$('btn-labels').addEventListener('click', () => { state.showLabels = !state.showLabels; $('btn-labels').classList.toggle('active', state.showLabels); $('btn-labels').textContent = state.showLabels ? '🏷️ 標籤' : '🏷️ 隱藏'; });
$('btn-lighting').addEventListener('click', () => setLightingMode(!state.realisticLighting));
$('btn-bg-dark').addEventListener('click', () => setBgLevel('dark'));
$('btn-bg-mid').addEventListener('click', () => setBgLevel('mid'));
$('btn-bg-bright').addEventListener('click', () => setBgLevel('bright'));

function animCam(tPos, tLook) { const sPos = camera.position.clone(), sTgt = controls.target.clone(), sTime = performance.now(), dur = 1200; function step(now) { const t = Math.min((now - sTime) / dur, 1), e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; camera.position.lerpVectors(sPos, tPos, e); controls.target.lerpVectors(sTgt, tLook, e); controls.update(); if (t < 1) requestAnimationFrame(step); } requestAnimationFrame(step); }
$('btn-topview').addEventListener('click', () => animCam(new THREE.Vector3(0, 65, 3), new THREE.Vector3(0, 0, 0)));
$('btn-reset').addEventListener('click', () => animCam(new THREE.Vector3(20, 30, 50), new THREE.Vector3(0, 0, 0)));

window.addEventListener('keydown', (e) => { switch (e.key.toLowerCase()) { case ' ': e.preventDefault(); $('btn-pause').click(); break; case 'l': $('btn-labels').click(); break; case 'k': $('btn-lighting').click(); break; case 'b': const ord = ['dark', 'mid', 'bright']; setBgLevel(ord[(ord.indexOf(state.bgLevel) + 1) % 3]); break; case 't': $('btn-topview').click(); break; case 'r': $('btn-reset').click(); break; } });
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

animate();
$('info-tooltip').textContent = '🖱️ 拖曳 | 🔍 縮放 | ⌨️ 空白:暫停 K:光影 B:背景 L:標籤';
$('info-tooltip').classList.remove('hidden');
setTimeout(() => $('info-tooltip').classList.add('hidden'), 7000);
