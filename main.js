/**
 * ============================================
 *  3D Interactive Solar System v2
 *  Built with Three.js — Pure frontend
 *  Features: lighting toggle, 3 BG levels,
 *  vibrant planet colors, visible orbits
 * ============================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ──────────────────────────────────────────
//  GLOBAL STATE
// ──────────────────────────────────────────

const state = {
    paused: false,
    speed: 1.0,
    showLabels: true,
    realisticLighting: true,   // true = lit/dark sides, false = full bright
    bgLevel: 'dark',           // 'dark' | 'mid' | 'bright'
};

// Track all planet meshes for material swapping
const planetMeshes = [];

// ──────────────────────────────────────────
//  SCENE SETUP
// ──────────────────────────────────────────

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

function applyBackground(level) {
    switch (level) {
        case 'dark':
            scene.background = new THREE.Color(0x000010);
            scene.fog = new THREE.FogExp2(0x000015, 0.00008);
            break;
        case 'mid':
            scene.background = new THREE.Color(0x0a1030);
            scene.fog = new THREE.FogExp2(0x0a1030, 0.00005);
            break;
        case 'bright':
            scene.background = new THREE.Color(0x152050);
            scene.fog = new THREE.FogExp2(0x152050, 0.00003);
            break;
    }
}
applyBackground(state.bgLevel);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 1000);
camera.position.set(20, 30, 50);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// ──────────────────────────────────────────
//  ORBIT CONTROLS
// ──────────────────────────────────────────

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 8;
controls.maxDistance = 150;
controls.target.set(0, 0, 0);
controls.update();

// ──────────────────────────────────────────
//  LIGHTING
// ──────────────────────────────────────────

const ambientLight = new THREE.AmbientLight(0x111133, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 300, 200, 0.5);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
scene.add(sunLight);

const sunLight2 = new THREE.PointLight(0xffcc88, 80, 100, 0.6);
sunLight2.position.set(0, 0, 0);
scene.add(sunLight2);

function updateAmbientForBg(level) {
    switch (level) {
        case 'dark': ambientLight.intensity = 0.5; break;
        case 'mid': ambientLight.intensity = 0.9; break;
        case 'bright': ambientLight.intensity = 1.5; break;
    }
}

// ──────────────────────────────────────────
//  STARFIELD
// ──────────────────────────────────────────

function createStarfield() {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const radius = 80 + Math.random() * 120;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        const r = Math.random();
        if (r < 0.08) { colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0; }
        else if (r < 0.15) { colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6; }
        else if (r < 0.18) { colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.5; }
        else { const b = 0.5 + Math.random() * 0.5; colors[i * 3] = b; colors[i * 3 + 1] = b; colors[i * 3 + 2] = b; }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 });
    const stars = new THREE.Points(geom, mat);
    scene.add(stars);
    return stars;
}
const starfield = createStarfield();

// ──────────────────────────────────────────
//  TEXTURE HELPER
// ──────────────────────────────────────────

function createTexture(w, h, drawFn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    drawFn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// ──────────────────────────────────────────
//  SUN — with dramatic glow
// ──────────────────────────────────────────

const sunTex = createTexture(512, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.08, '#fffde0');
    g.addColorStop(0.25, '#ffe040');
    g.addColorStop(0.5, '#ff9900');
    g.addColorStop(0.75, '#ee5500');
    g.addColorStop(0.9, '#cc2200');
    g.addColorStop(1, '#881100');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) {
        const sx = Math.random() * w, sy = Math.random() * h, sr = 3 + Math.random() * 14;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0, 'rgba(255,200,50,0.7)'); sg.addColorStop(0.5, 'rgba(255,120,20,0.4)'); sg.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
});

const sunGeom = new THREE.SphereGeometry(4.5, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

// Glow layers
function makeGlow(radius, color, opacity) {
    const gt = createTexture(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, 'rgba(255,255,220,1)'); g.addColorStop(0.12, 'rgba(255,200,60,0.9)');
        g.addColorStop(0.35, 'rgba(255,100,20,0.4)'); g.addColorStop(0.65, 'rgba(255,30,0,0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    });
    const gm = new THREE.SphereGeometry(radius, 32, 32);
    const mm = new THREE.ShaderMaterial({
        uniforms: { gTex: { value: gt }, gCol: { value: new THREE.Color(color) }, gOp: { value: opacity } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'varying vec2 vUv; uniform sampler2D gTex; uniform vec3 gCol; uniform float gOp; void main() { vec4 t = texture2D(gTex, vUv); gl_FragColor = vec4(gCol * t.rgb, t.a * gOp); }',
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const m = new THREE.Mesh(gm, mm); m.renderOrder = 1; return m;
}
const g1 = makeGlow(6, '#ffaa00', 0.7); const g2 = makeGlow(8.5, '#ff6600', 0.35); const g3 = makeGlow(11.5, '#ff3300', 0.12);
scene.add(g1); scene.add(g2); scene.add(g3);

// ──────────────────────────────────────────
//  PLANET DATA — vibrant colors
// ──────────────────────────────────────────

const planetDefs = [
    {
        name: 'Mercury', radius: 0.4, orbit: 7.5, speed: 4.0, rot: 0.004,
        draw(ctx, w, h) {
            ctx.fillStyle = '#b8ada0'; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 250; i++) {
                const cx = Math.random() * w, cy = Math.random() * h, cr = 1 + Math.random() * 7;
                const s = 120 + Math.random() * 50;
                ctx.fillStyle = `rgb(${s},${s-15},${s-30})`;
                ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
            }
            // Brighter streaks
            for (let i = 0; i < 15; i++) {
                ctx.strokeStyle = 'rgba(200,190,175,0.3)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(Math.random() * w, Math.random() * h); ctx.lineTo(Math.random() * w, Math.random() * h); ctx.stroke();
            }
        },
    },
    {
        name: 'Venus', radius: 0.9, orbit: 11.5, speed: 2.9, rot: 0.002,
        draw(ctx, w, h) {
            const bg = ctx.createLinearGradient(0, 0, 0, h);
            bg.addColorStop(0, '#f0e0b0'); bg.addColorStop(0.3, '#e8d498'); bg.addColorStop(0.5, '#f2e4b8'); bg.addColorStop(0.7, '#e0cc88'); bg.addColorStop(1, '#ecd8a0');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 80; i++) {
                ctx.fillStyle = `rgba(255,245,220,${0.08 + Math.random() * 0.18})`;
                ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 10);
            }
        },
    },
    {
        name: 'Earth', radius: 0.95, orbit: 16.5, speed: 2.4, rot: 0.02,
        draw(ctx, w, h) {
            const ocn = ctx.createLinearGradient(0, 0, 0, h);
            ocn.addColorStop(0, '#1144aa'); ocn.addColorStop(0.3, '#2266cc'); ocn.addColorStop(0.5, '#3377ee'); ocn.addColorStop(0.7, '#2266cc'); ocn.addColorStop(1, '#1144aa');
            ctx.fillStyle = ocn; ctx.fillRect(0, 0, w, h);
            const lands = [{ x: 70, y: 80, rx: 42, ry: 52 }, { x: 120, y: 72, rx: 26, ry: 48 }, { x: 210, y: 58, rx: 58, ry: 56 },
                { x: 290, y: 68, rx: 32, ry: 42 }, { x: 350, y: 82, rx: 48, ry: 52 }, { x: 360, y: 145, rx: 26, ry: 58 },
                { x: 160, y: 155, rx: 22, ry: 38 }, { x: 50, y: 175, rx: 16, ry: 28 }];
            lands.forEach(l => {
                ctx.fillStyle = '#4a9e2a'; ctx.beginPath(); ctx.ellipse(l.x, l.y, l.rx, l.ry, Math.random() * 0.3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(100,170,80,0.45)'; ctx.beginPath(); ctx.ellipse(l.x + 6, l.y - 4, l.rx * 0.55, l.ry * 0.55, 0.2, 0, Math.PI * 2); ctx.fill();
            });
            for (let i = 0; i < 100; i++) { ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.07})`; ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 22, 1 + Math.random() * 3); }
            ctx.fillStyle = 'rgba(240,248,255,0.8)'; ctx.fillRect(0, 0, w, 16); ctx.fillRect(0, h - 11, w, 11);
        },
    },
    {
        name: 'Mars', radius: 0.6, orbit: 22.5, speed: 1.7, rot: 0.018,
        draw(ctx, w, h) {
            ctx.fillStyle = '#e0553a'; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 120; i++) {
                const cx = Math.random() * w, cy = Math.random() * h, cr = 4 + Math.random() * 14;
                ctx.fillStyle = `rgba(${180 + Math.random() * 50},${Math.random() * 50},${Math.random() * 20},0.55)`;
                ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = 'rgba(245,240,225,0.55)'; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 9, w, 9);
        },
    },
    {
        name: 'Jupiter', radius: 3.3, orbit: 33, speed: 0.95, rot: 0.045,
        draw(ctx, w, h) {
            const bands = [
                [0, 28, '#f0dfc8'], [28, 20, '#d4a068'], [48, 38, '#ecd8b8'], [86, 16, '#c07040'],
                [102, 32, '#e8d0a8'], [134, 24, '#d89058'], [158, 36, '#f0e0c0'], [194, 18, '#c47038'],
                [212, 30, '#e4cca0'], [242, 14, '#cc8848']
            ];
            bands.forEach(b => { ctx.fillStyle = b[2]; ctx.fillRect(0, b[0], w, b[1]); });
            for (let i = 0; i < 60; i++) {
                ctx.fillStyle = `rgba(210,150,100,${0.08 + Math.random() * 0.18})`;
                ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, 4 + Math.random() * 16, 2 + Math.random() * 8, 0, 0, Math.PI * 2); ctx.fill();
            }
            // ★ GREAT RED SPOT — 加大、加明顯
            const grsX = w * 0.33, grsY = h * 0.54;
            const grs = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 22);
            grs.addColorStop(0, '#ff6644');
            grs.addColorStop(0.2, '#ee5533');
            grs.addColorStop(0.5, '#d0402a');
            grs.addColorStop(0.75, '#c04030');
            grs.addColorStop(1, 'rgba(200,130,90,0)');
            ctx.fillStyle = grs;
            ctx.beginPath(); ctx.ellipse(grsX, grsY, 22, 11, 0.05, 0, Math.PI * 2); ctx.fill();
            // Inner bright core
            const grs2 = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 8);
            grs2.addColorStop(0, '#ff9977'); grs2.addColorStop(1, 'rgba(255,100,60,0)');
            ctx.fillStyle = grs2;
            ctx.beginPath(); ctx.ellipse(grsX, grsY, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
            // Secondary smaller spot
            const ssX = w * 0.65, ssY = h * 0.48;
            const ss = ctx.createRadialGradient(ssX, ssY, 0, ssX, ssY, 10);
            ss.addColorStop(0, '#e87850'); ss.addColorStop(0.5, '#d06040'); ss.addColorStop(1, 'rgba(200,130,90,0)');
            ctx.fillStyle = ss; ctx.beginPath(); ctx.ellipse(ssX, ssY, 10, 5, -0.05, 0, Math.PI * 2); ctx.fill();
        },
    },
    {
        name: 'Saturn', radius: 2.7, orbit: 41, speed: 0.65, rot: 0.038, hasRings: true,
        draw(ctx, w, h) {
            const bg = ctx.createLinearGradient(0, 0, 0, h);
            bg.addColorStop(0, '#f6f0d8'); bg.addColorStop(0.3, '#f0e4b8'); bg.addColorStop(0.5, '#f8f0d8'); bg.addColorStop(0.7, '#e8d898'); bg.addColorStop(1, '#f2e8c0');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(220,200,160,${0.08 + Math.random() * 0.12})`; ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 5); }
        },
    },
    {
        name: 'Uranus', radius: 1.9, orbit: 51, speed: 0.45, rot: 0.028,
        draw(ctx, w, h) {
            const bg = ctx.createLinearGradient(0, 0, 0, h);
            bg.addColorStop(0, '#c8f0f8'); bg.addColorStop(0.5, '#88d8e8'); bg.addColorStop(1, '#b0e8f4');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(200,240,250,${0.1 + Math.random() * 0.15})`; ctx.fillRect(0, Math.random() * h, w, 3 + Math.random() * 6); }
        },
    },
    {
        name: 'Neptune', radius: 1.8, orbit: 57, speed: 0.35, rot: 0.025,
        draw(ctx, w, h) {
            const bg = ctx.createLinearGradient(0, 0, 0, h);
            bg.addColorStop(0, '#2244cc'); bg.addColorStop(0.3, '#3355ee'); bg.addColorStop(0.5, '#2244cc'); bg.addColorStop(0.7, '#3355ee'); bg.addColorStop(1, '#2244cc');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2); }
            for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(60,120,220,${0.08 + Math.random() * 0.12})`; ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 5); }
        },
    },
    {
        name: 'Pluto', radius: 0.3, orbit: 65, speed: 0.25, rot: 0.003,
        draw(ctx, w, h) {
            ctx.fillStyle = '#e0d5c8'; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 50; i++) {
                const cx = Math.random() * w, cy = Math.random() * h;
                ctx.fillStyle = `rgba(200,185,170,0.45)`; ctx.beginPath(); ctx.arc(cx, cy, 2 + Math.random() * 6, 0, Math.PI * 2); ctx.fill();
            }
            // Heart-shaped bright area (like real Pluto!)
            const hx = w * 0.5, hy = h * 0.45;
            ctx.fillStyle = 'rgba(240,230,215,0.6)'; ctx.beginPath();
            ctx.moveTo(hx, hy + 18); ctx.bezierCurveTo(hx - 22, hy - 2, hx - 30, hy - 22, hx, hy - 5); ctx.bezierCurveTo(hx + 30, hy - 22, hx + 22, hy - 2, hx, hy + 18);
            ctx.fill();
        },
    },
];

// ──────────────────────────────────────────
//  ORBIT COLORS — each planet gets a unique orbit color
// ──────────────────────────────────────────

const orbitColors = [
    0x888899, // Mercury – silver
    0xddaa66, // Venus – gold
    0x4488ff, // Earth – blue
    0xff6644, // Mars – red
    0xddaa55, // Jupiter – gold-orange
    0xeebb77, // Saturn – pale gold
    0x66ccdd, // Uranus – teal
    0x4466dd, // Neptune – deep blue
    0x998877, // Pluto – gray-brown
];

// ──────────────────────────────────────────
//  BUILD PLANETS
// ──────────────────────────────────────────

const planets = [];
const orbits = [];
const labels = [];

planetDefs.forEach((def, idx) => {
    const tex = createTexture(512, 256, def.draw);

    // Create BOTH material types upfront
    const standardMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0.05 });
    const basicMat = new THREE.MeshBasicMaterial({ map: tex });

    const geom = new THREE.SphereGeometry(def.radius, 48, 48);
    const mesh = new THREE.Mesh(geom, state.realisticLighting ? standardMat : basicMat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.name = def.name;
    mesh.userData = {
        orbitRadius: def.orbit, speed: def.speed, rotationSpeed: def.rot,
        angle: Math.random() * Math.PI * 2, name: def.name,
        standardMat, basicMat, // store both materials for toggling
    };
    scene.add(mesh);
    planetMeshes.push(mesh);

    // Orbit ring — colored, more visible
    const orbitPoints = [];
    const segs = 256;
    for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(a) * def.orbit, 0, Math.sin(a) * def.orbit));
    }
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
        color: orbitColors[idx],
        transparent: true,
        opacity: 0.55,
        depthTest: true,
    });
    const orbitLine = new THREE.Line(orbitGeom, orbitMat);
    scene.add(orbitLine);
    orbits.push(orbitLine);

    // Saturn rings
    if (def.hasRings) {
        const ringGeom = new THREE.RingGeometry(def.radius * 1.4, def.radius * 2.5, 160);
        const rp = ringGeom.attributes.position;
        const rv = [];
        for (let i = 0; i < rp.count; i++) { rv.push(rp.getX(i), 0, rp.getY(i)); }
        ringGeom.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3));
        ringGeom.computeVertexNormals();

        const rc = document.createElement('canvas'); rc.width = 512; rc.height = 64;
        const rctx = rc.getContext('2d');
        const rg = rctx.createLinearGradient(0, 0, 512, 0);
        rg.addColorStop(0, 'rgba(160,140,110,0.05)');
        rg.addColorStop(0.1, 'rgba(210,185,140,0.5)');
        rg.addColorStop(0.2, 'rgba(230,200,160,0.7)');
        rg.addColorStop(0.3, 'rgba(180,155,120,0.15)');
        rg.addColorStop(0.45, 'rgba(240,215,175,0.85)');
        rg.addColorStop(0.55, 'rgba(220,195,155,0.75)');
        rg.addColorStop(0.7, 'rgba(190,160,130,0.25)');
        rg.addColorStop(0.85, 'rgba(150,125,100,0.1)');
        rg.addColorStop(1, 'rgba(80,70,55,0)');
        rctx.fillStyle = rg; rctx.fillRect(0, 0, 512, 64);
        const ringTex = new THREE.CanvasTexture(rc); ringTex.colorSpace = THREE.SRGBColorSpace;

        const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.userData = { isRing: true };
        mesh.add(ringMesh);
    }

    // Label
    const lc = document.createElement('canvas'); lc.width = 256; lc.height = 64;
    const lctx = lc.getContext('2d');
    lctx.fillStyle = '#ffffff'; lctx.font = 'bold 28px "Segoe UI", Arial, sans-serif'; lctx.textAlign = 'center'; lctx.textBaseline = 'middle';
    lctx.fillText(def.name, 128, 32);
    const lTex = new THREE.CanvasTexture(lc); lTex.minFilter = THREE.LinearFilter; lTex.colorSpace = THREE.SRGBColorSpace;
    const lSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: lTex, transparent: true, depthTest: false, depthWrite: false }));
    lSprite.scale.set(def.radius * 2.5, def.radius * 0.6, 1);
    lSprite.position.y = def.radius + 0.9;
    lSprite.userData = { isLabel: true };
    mesh.add(lSprite);
    labels.push(lSprite);

    planets.push(mesh);
});

// ──────────────────────────────────────────
//  MOON
// ──────────────────────────────────────────

const earth = planets.find(p => p.name === 'Earth');
const moonTex = createTexture(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 100; i++) { const s = 170 + Math.random() * 60; ctx.fillStyle = `rgb(${s},${s},${s})`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, Math.PI * 2); ctx.fill(); }
});
const moonGeom = new THREE.SphereGeometry(0.24, 32, 32);
const moonStd = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.9, metalness: 0 });
const moonBasic = new THREE.MeshBasicMaterial({ map: moonTex });
const moon = new THREE.Mesh(moonGeom, state.realisticLighting ? moonStd : moonBasic);
moon.name = 'Moon';
moon.userData = { orbitRadius: 2.0, speed: 7.5, angle: 0, standardMat: moonStd, basicMat: moonBasic };
scene.add(moon);

// Moon label
const mlc = document.createElement('canvas'); mlc.width = 128; mlc.height = 32;
const mlctx = mlc.getContext('2d'); mlctx.fillStyle = '#cccccc'; mlctx.font = 'bold 18px "Segoe UI", Arial, sans-serif'; mlctx.textAlign = 'center'; mlctx.textBaseline = 'middle';
mlctx.fillText('Moon', 64, 16);
const mlTex = new THREE.CanvasTexture(mlc); mlTex.minFilter = THREE.LinearFilter; mlTex.colorSpace = THREE.SRGBColorSpace;
const moonLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: mlTex, transparent: true, depthTest: false, depthWrite: false }));
moonLabel.scale.set(0.9, 0.22, 1); moonLabel.position.y = 0.55; moon.add(moonLabel); labels.push(moonLabel);

// Moon orbit
const mOpts = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; mOpts.push(new THREE.Vector3(Math.cos(a) * 2.0, 0, Math.sin(a) * 2.0)); }
const mOrbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(mOpts), new THREE.LineBasicMaterial({ color: 0x556688, transparent: true, opacity: 0.3 }));
earth.add(mOrbit);

// ──────────────────────────────────────────
//  ASTEROID BELT
// ──────────────────────────────────────────

function createAsteroidBelt() {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 26 + Math.random() * 5;
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * 1.8; pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: 0.1, color: 0x999988, blending: THREE.AdditiveBlending, depthWrite: false });
    const belt = new THREE.Points(g, m); belt.rotation.x = 0.03; scene.add(belt); return belt;
}
const asteroidBelt = createAsteroidBelt();

// ──────────────────────────────────────────
//  TOGGLE LIGHTING MODE
// ──────────────────────────────────────────

function setLightingMode(realistic) {
    state.realisticLighting = realistic;
    planetMeshes.forEach(m => {
        m.material = realistic ? m.userData.standardMat : m.userData.basicMat;
    });
    if (moon.userData.standardMat) {
        moon.material = realistic ? moon.userData.standardMat : moon.userData.basicMat;
    }
    document.getElementById('btn-lighting').textContent = realistic ? '🌓 寫實光影' : '☀️ 全亮模式';
}

// ──────────────────────────────────────────
//  ANIMATION
// ──────────────────────────────────────────

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const edt = state.paused ? 0 : dt * state.speed;

    sun.rotation.y += edt * 0.1;
    g1.rotation.y += edt * 0.03; g2.rotation.y -= edt * 0.02; g3.rotation.y += edt * 0.015;

    planets.forEach(p => {
        const ud = p.userData;
        ud.angle += edt * ud.speed * 0.5;
        p.position.x = Math.cos(ud.angle) * ud.orbitRadius;
        p.position.z = Math.sin(ud.angle) * ud.orbitRadius;
        p.rotation.y += edt * ud.rotationSpeed;
        p.children.forEach(c => { if (c.userData && c.userData.isLabel) c.visible = state.showLabels; });
    });

    moon.userData.angle += edt * moon.userData.speed * 0.5;
    moon.position.x = earth.position.x + Math.cos(moon.userData.angle) * moon.userData.orbitRadius;
    moon.position.z = earth.position.z + Math.sin(moon.userData.angle) * moon.userData.orbitRadius;
    moon.rotation.y += edt * 0.01;
    moonLabel.visible = state.showLabels;

    starfield.rotation.y += edt * 0.002; starfield.rotation.x += edt * 0.001;
    asteroidBelt.rotation.y += edt * 0.03;

    controls.update();
    renderer.render(scene, camera);
}

// ──────────────────────────────────────────
//  UI HANDLERS
// ──────────────────────────────────────────

// Pause
const btnPause = document.getElementById('btn-pause');
btnPause.addEventListener('click', () => {
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '▶️ 繼續' : '⏯️ 暫停';
    btnPause.classList.toggle('active', state.paused);
});

// Speed
const spdSlider = document.getElementById('speed-slider');
const spdVal = document.getElementById('speed-value');
spdSlider.addEventListener('input', () => { state.speed = parseFloat(spdSlider.value); spdVal.textContent = state.speed.toFixed(1) + '×'; });

// Labels
const btnLabels = document.getElementById('btn-labels');
btnLabels.addEventListener('click', () => {
    state.showLabels = !state.showLabels;
    btnLabels.classList.toggle('active', state.showLabels);
    btnLabels.textContent = state.showLabels ? '🏷️ 標籤' : '🏷️ 隱藏';
});

// Lighting toggle
const btnLighting = document.getElementById('btn-lighting');
btnLighting.addEventListener('click', () => {
    setLightingMode(!state.realisticLighting);
});

// Background brightness
const btnBgDark = document.getElementById('btn-bg-dark');
const btnBgMid = document.getElementById('btn-bg-mid');
const btnBgBright = document.getElementById('btn-bg-bright');

function setBgLevel(level) {
    state.bgLevel = level;
    applyBackground(level);
    updateAmbientForBg(level);
    btnBgDark.classList.toggle('active', level === 'dark');
    btnBgMid.classList.toggle('active', level === 'mid');
    btnBgBright.classList.toggle('active', level === 'bright');
}

btnBgDark.addEventListener('click', () => setBgLevel('dark'));
btnBgMid.addEventListener('click', () => setBgLevel('mid'));
btnBgBright.addEventListener('click', () => setBgLevel('bright'));

// Camera
const btnTop = document.getElementById('btn-topview');
const btnReset = document.getElementById('btn-reset');

function animCam(tPos, tLook) {
    const sPos = camera.position.clone(), sTgt = controls.target.clone(), sTime = performance.now(), dur = 1200;
    function step(now) {
        const t = Math.min((now - sTime) / dur, 1);
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.position.lerpVectors(sPos, tPos, e); controls.target.lerpVectors(sTgt, tLook, e); controls.update();
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

btnTop.addEventListener('click', () => animCam(new THREE.Vector3(0, 65, 3), new THREE.Vector3(0, 0, 0)));
btnReset.addEventListener('click', () => animCam(new THREE.Vector3(20, 30, 50), new THREE.Vector3(0, 0, 0)));

// Keyboard
window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); btnPause.click(); break;
        case 'l': btnLabels.click(); break;
        case 'k': btnLighting.click(); break;         // ★ K = 光影切換
        case 'b':                                       // ★ B = 背景循環
            const order = ['dark', 'mid', 'bright'];
            const next = order[(order.indexOf(state.bgLevel) + 1) % 3];
            setBgLevel(next); break;
        case 't': btnTop.click(); break;
        case 'r': btnReset.click(); break;
    }
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ──────────────────────────────────────────
//  START
// ──────────────────────────────────────────

animate();

const tip = document.getElementById('info-tooltip');
tip.textContent = '🖱️ 拖曳旋轉 | 🔍 滾輪縮放 | ⌨️ 空白:暫停 K:光影 B:背景 L:標籤';
tip.classList.remove('hidden');
setTimeout(() => tip.classList.add('hidden'), 7000);

console.log('🪐 3D Solar System v2 ready!');
console.log('K = toggle lighting | B = cycle background | Space = pause | L = labels');
