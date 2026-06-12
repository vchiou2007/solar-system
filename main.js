/**
 * ============================================
 *  3D Interactive Solar System
 *  Built with Three.js
 *  Pure frontend — deploy to GitHub Pages
 * ============================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ──────────────────────────────────────────
//  SCENE SETUP
// ──────────────────────────────────────────

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    50,                                    // FOV
    window.innerWidth / window.innerHeight, // Aspect
    0.5,                                    // Near
    1000                                    // Far
);
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

// Ambient — faint fill so dark sides aren't pitch black
const ambientLight = new THREE.AmbientLight(0x111133, 0.4);
scene.add(ambientLight);

// Main point light at Sun position
const sunLight = new THREE.PointLight(0xffffff, 300, 200, 0.5);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
scene.add(sunLight);

// Secondary warm light for subtle fill
const sunLight2 = new THREE.PointLight(0xffcc88, 80, 100, 0.6);
sunLight2.position.set(0, 0, 0);
scene.add(sunLight2);

// ──────────────────────────────────────────
//  STARFIELD
// ──────────────────────────────────────────

function createStarfield() {
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
        // Random sphere distribution
        const radius = 80 + Math.random() * 120;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Slight color variation: white → blue-white → yellow-white
        const colorChoice = Math.random();
        if (colorChoice < 0.1) {
            colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
        } else if (colorChoice < 0.2) {
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
        } else {
            const brightness = 0.6 + Math.random() * 0.4;
            colors[i * 3] = brightness;
            colors[i * 3 + 1] = brightness;
            colors[i * 3 + 2] = brightness;
        }

        sizes[i] = 0.1 + Math.random() * 0.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    return stars;
}

const starfield = createStarfield();

// ──────────────────────────────────────────
//  PROCEDURAL TEXTURE GENERATOR
// ──────────────────────────────────────────

function createProceduralTexture(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapU = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// Simple seeded pseudo-random for consistent noise
function seededRandom(x, y, seed) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

// ──────────────────────────────────────────
//  SUN
// ──────────────────────────────────────────

const sunTexture = createProceduralTexture(512, 256, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, '#fff8c0');
    gradient.addColorStop(0.3, '#ffe040');
    gradient.addColorStop(0.6, '#ff8c00');
    gradient.addColorStop(0.85, '#e04000');
    gradient.addColorStop(1, '#801000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    // Add sunspot-like dark spots
    for (let i = 0; i < 30; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        const sr = 2 + Math.random() * 10;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0, 'rgba(180,80,0,0.6)');
        sg.addColorStop(1, 'rgba(255,140,0,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }
});

const sunGeometry = new THREE.SphereGeometry(4, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
    color: new THREE.Color(1, 0.9, 0.3),
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.name = 'Sun';
scene.add(sun);

// Sun glow — layered transparent spheres
function createGlow(radius, color, opacity) {
    const glowTexture = createProceduralTexture(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, 'rgba(255,255,200,1)');
        g.addColorStop(0.15, 'rgba(255,200,50,0.8)');
        g.addColorStop(0.4, 'rgba(255,100,20,0.3)');
        g.addColorStop(0.7, 'rgba(255,40,0,0.05)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
    });
    const geom = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            glowTexture: { value: glowTexture },
            glowColor: { value: new THREE.Color(color) },
            opacity: { value: opacity },
        },
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform sampler2D glowTexture;
            uniform vec3 glowColor;
            uniform float opacity;
            void main() {
                vec4 texColor = texture2D(glowTexture, vUv);
                float alpha = texColor.a * opacity;
                gl_FragColor = vec4(glowColor * texColor.rgb, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.renderOrder = 1;
    return mesh;
}

const glow1 = createGlow(5.5, '#ff8800', 0.6);
const glow2 = createGlow(7.5, '#ff4400', 0.3);
const glow3 = createGlow(10, '#ff2200', 0.12);
scene.add(glow1);
scene.add(glow2);
scene.add(glow3);

// ──────────────────────────────────────────
//  PLANET DATA
// ──────────────────────────────────────────

const planetData = [
    {
        name: 'Mercury',
        radius: 0.35,
        orbitRadius: 7,
        speed: 4.15,
        color: 0xb0a090,
        rotationSpeed: 0.004,
        drawTexture(ctx, w, h) {
            // Gray rocky surface with craters
            ctx.fillStyle = '#b5a898';
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 200; i++) {
                const cx = Math.random() * w;
                const cy = Math.random() * h;
                const cr = 1 + Math.random() * 6;
                const shade = 140 + Math.random() * 40;
                ctx.fillStyle = `rgb(${shade},${shade - 15},${shade - 25})`;
                ctx.beginPath();
                ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                ctx.fill();
            }
        },
    },
    {
        name: 'Venus',
        radius: 0.85,
        orbitRadius: 11,
        speed: 3.0,
        color: 0xe8cda0,
        rotationSpeed: 0.002,
        drawTexture(ctx, w, h) {
            // Cloudy yellowish with swirls
            const base = ctx.createLinearGradient(0, 0, 0, h);
            base.addColorStop(0, '#e8d5a3');
            base.addColorStop(0.5, '#dfc894');
            base.addColorStop(1, '#d4b87a');
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 60; i++) {
                const y = Math.random() * h;
                ctx.fillStyle = `rgba(255,240,210,${0.1 + Math.random() * 0.2})`;
                ctx.fillRect(0, y, w, 2 + Math.random() * 8);
            }
        },
    },
    {
        name: 'Earth',
        radius: 0.9,
        orbitRadius: 16,
        speed: 2.5,
        color: 0x4488cc,
        rotationSpeed: 0.02,
        drawTexture(ctx, w, h) {
            // Ocean base
            const ocean = ctx.createLinearGradient(0, 0, 0, h);
            ocean.addColorStop(0, '#2255aa');
            ocean.addColorStop(0.3, '#3366cc');
            ocean.addColorStop(0.5, '#4477dd');
            ocean.addColorStop(0.7, '#3366cc');
            ocean.addColorStop(1, '#2255aa');
            ctx.fillStyle = ocean;
            ctx.fillRect(0, 0, w, h);
            // Simplified continents
            const continents = [
                { x: 60, y: 80, rx: 40, ry: 50 },
                { x: 110, y: 75, rx: 25, ry: 45 },
                { x: 200, y: 60, rx: 55, ry: 55 },
                { x: 280, y: 70, rx: 30, ry: 40 },
                { x: 340, y: 85, rx: 45, ry: 50 },
                { x: 350, y: 140, rx: 25, ry: 55 },
                { x: 150, y: 150, rx: 20, ry: 35 },
                { x: 420, y: 100, rx: 35, ry: 45 },
                { x: 50, y: 170, rx: 15, ry: 25 },
            ];
            continents.forEach(c => {
                ctx.fillStyle = '#5a9e3a';
                ctx.beginPath();
                ctx.ellipse(c.x, c.y, c.rx, c.ry, Math.random() * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Add some brown/tan patches
                ctx.fillStyle = 'rgba(140,180,100,0.5)';
                ctx.beginPath();
                ctx.ellipse(c.x + 5, c.y - 3, c.rx * 0.6, c.ry * 0.6, 0.2, 0, Math.PI * 2);
                ctx.fill();
            });
            // Cloud wisps
            for (let i = 0; i < 80; i++) {
                ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.08})`;
                ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 20, 1 + Math.random() * 3);
            }
            // Ice caps
            ctx.fillStyle = 'rgba(240,250,255,0.7)';
            ctx.fillRect(0, 0, w, 15);
            ctx.fillRect(0, h - 10, w, 10);
        },
    },
    {
        name: 'Mars',
        radius: 0.55,
        orbitRadius: 22,
        speed: 1.8,
        color: 0xcc6644,
        rotationSpeed: 0.018,
        drawTexture(ctx, w, h) {
            // Red planet with darker patches
            ctx.fillStyle = '#d45a3a';
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 100; i++) {
                const cx = Math.random() * w;
                const cy = Math.random() * h;
                const cr = 3 + Math.random() * 12;
                const shade = 160 + Math.random() * 60;
                ctx.fillStyle = `rgba(${shade + 30},${shade * 0.3},${shade * 0.2},0.5)`;
                ctx.beginPath();
                ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                ctx.fill();
            }
            // Polar caps
            ctx.fillStyle = 'rgba(240,235,220,0.5)';
            ctx.fillRect(0, 0, w, 12);
            ctx.fillRect(0, h - 8, w, 8);
        },
    },
    {
        name: 'Jupiter',
        radius: 3.0,
        orbitRadius: 32,
        speed: 1.0,
        color: 0xd4b896,
        rotationSpeed: 0.04,
        drawTexture(ctx, w, h) {
            // Gas giant with horizontal bands
            const bands = [
                { y: 0, h: 20, c: '#e8d5c0' },
                { y: 20, h: 15, c: '#d4a878' },
                { y: 35, h: 30, c: '#e0c8a8' },
                { y: 65, h: 12, c: '#c88450' },
                { y: 77, h: 25, c: '#ddc098' },
                { y: 102, h: 18, c: '#d49560' },
                { y: 120, h: 28, c: '#e5ccaa' },
                { y: 148, h: 14, c: '#c87840' },
                { y: 162, h: 22, c: '#ddb890' },
                { y: 184, h: 30, c: '#e0c8a0' },
                { y: 214, h: 16, c: '#c89058' },
                { y: 230, h: 26, c: '#e5ccb0' },
            ];
            bands.forEach(b => {
                const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
                g.addColorStop(0, b.c);
                g.addColorStop(0.5, b.c.replace(')', ',0.8)').replace('rgb', 'rgba'));
                g.addColorStop(1, b.c);
                ctx.fillStyle = b.c;
                ctx.fillRect(0, b.y, w, b.h);
            });
            // Turbulence spots
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = `rgba(200,140,90,${0.1 + Math.random() * 0.2})`;
                ctx.beginPath();
                ctx.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 12, 2 + Math.random() * 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // Great Red Spot
            const grsX = w * 0.35, grsY = h * 0.55;
            const grsGrad = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 14);
            grsGrad.addColorStop(0, '#e87850');
            grsGrad.addColorStop(0.6, '#d06040');
            grsGrad.addColorStop(1, 'rgba(200,140,100,0)');
            ctx.fillStyle = grsGrad;
            ctx.beginPath();
            ctx.ellipse(grsX, grsY, 14, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        },
    },
    {
        name: 'Saturn',
        radius: 2.5,
        orbitRadius: 40,
        speed: 0.7,
        color: 0xe8d5a0,
        rotationSpeed: 0.035,
        hasRings: true,
        drawTexture(ctx, w, h) {
            // Pale yellow with subtle bands
            const base = ctx.createLinearGradient(0, 0, 0, h);
            base.addColorStop(0, '#f0e8c8');
            base.addColorStop(0.3, '#e8dca8');
            base.addColorStop(0.5, '#f2eac8');
            base.addColorStop(0.7, '#e0d098');
            base.addColorStop(1, '#ece0b8');
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 50; i++) {
                ctx.fillStyle = `rgba(210,190,150,${0.1 + Math.random() * 0.15})`;
                ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 4);
            }
        },
    },
    {
        name: 'Uranus',
        radius: 1.8,
        orbitRadius: 50,
        speed: 0.5,
        color: 0x88ccdd,
        rotationSpeed: 0.025,
        drawTexture(ctx, w, h) {
            // Pale cyan-blue
            const base = ctx.createLinearGradient(0, 0, 0, h);
            base.addColorStop(0, '#c8e8f0');
            base.addColorStop(0.5, '#a8d8e8');
            base.addColorStop(1, '#b8e0ec');
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 25; i++) {
                ctx.fillStyle = `rgba(200,235,245,${0.1 + Math.random() * 0.15})`;
                ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 5);
            }
        },
    },
    {
        name: 'Neptune',
        radius: 1.7,
        orbitRadius: 56,
        speed: 0.4,
        color: 0x3355cc,
        rotationSpeed: 0.023,
        drawTexture(ctx, w, h) {
            // Deep blue
            const base = ctx.createLinearGradient(0, 0, 0, h);
            base.addColorStop(0, '#3355cc');
            base.addColorStop(0.3, '#4466dd');
            base.addColorStop(0.5, '#3355cc');
            base.addColorStop(0.7, '#4466dd');
            base.addColorStop(1, '#3355cc');
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(80,140,220,${0.1 + Math.random() * 0.15})`;
                ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 4);
            }
        },
    },
    {
        name: 'Pluto',
        radius: 0.28,
        orbitRadius: 64,
        speed: 0.3,
        color: 0xc8b8a0,
        rotationSpeed: 0.003,
        drawTexture(ctx, w, h) {
            // Light brown dwarf planet
            ctx.fillStyle = '#d4c8b8';
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 40; i++) {
                const cx = Math.random() * w;
                const cy = Math.random() * h;
                ctx.fillStyle = `rgba(190,175,160,0.4)`;
                ctx.beginPath();
                ctx.arc(cx, cy, 2 + Math.random() * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        },
    },
];

// ──────────────────────────────────────────
//  CREATE PLANETS
// ──────────────────────────────────────────

const planets = [];
const orbits = [];
const labels = [];

planetData.forEach((data) => {
    // Texture
    const texture = createProceduralTexture(512, 256, data.drawTexture);

    // Planet mesh
    const geometry = new THREE.SphereGeometry(data.radius, 48, 48);
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = data.name;
    mesh.userData = {
        orbitRadius: data.orbitRadius,
        speed: data.speed,
        rotationSpeed: data.rotationSpeed,
        angle: Math.random() * Math.PI * 2, // Random start position
        name: data.name,
    };
    scene.add(mesh);

    // Orbit ring
    const orbitPoints = [];
    const orbitSegments = 256;
    for (let i = 0; i <= orbitSegments; i++) {
        const angle = (i / orbitSegments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
            Math.cos(angle) * data.orbitRadius,
            0,
            Math.sin(angle) * data.orbitRadius
        ));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x334466,
        transparent: true,
        opacity: 0.4,
        depthTest: true,
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    orbits.push(orbitLine);

    // Saturn's rings
    if (data.hasRings) {
        const ringGeom = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.3, 128);
        // Rotate ring to be horizontal (XZ plane)
        const pos = ringGeom.attributes.position;
        const ringVerts = [];
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            ringVerts.push(x, 0, y); // Swap Y→Z for horizontal ring
        }
        ringGeom.setAttribute('position', new THREE.Float32BufferAttribute(ringVerts, 3));
        ringGeom.computeVertexNormals();

        // Ring texture
        const ringCanvas = document.createElement('canvas');
        ringCanvas.width = 512;
        ringCanvas.height = 64;
        const rctx = ringCanvas.getContext('2d');
        const ringGrad = rctx.createLinearGradient(0, 0, 512, 0);
        ringGrad.addColorStop(0, 'rgba(180,160,130,0.1)');
        ringGrad.addColorStop(0.15, 'rgba(210,190,150,0.6)');
        ringGrad.addColorStop(0.25, 'rgba(200,180,140,0.1)');
        ringGrad.addColorStop(0.4, 'rgba(220,200,160,0.8)');
        ringGrad.addColorStop(0.5, 'rgba(230,210,170,0.9)');
        ringGrad.addColorStop(0.6, 'rgba(210,190,150,0.7)');
        ringGrad.addColorStop(0.75, 'rgba(180,160,130,0.3)');
        ringGrad.addColorStop(0.9, 'rgba(150,130,110,0.1)');
        ringGrad.addColorStop(1, 'rgba(100,90,80,0)');
        rctx.fillStyle = ringGrad;
        rctx.fillRect(0, 0, 512, 64);
        const ringTex = new THREE.CanvasTexture(ringCanvas);
        ringTex.colorSpace = THREE.SRGBColorSpace;

        const ringMat = new THREE.MeshBasicMaterial({
            map: ringTex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2; // Lay flat
        ringMesh.userData = { isRing: true };
        mesh.add(ringMesh);
    }

    // Label sprite
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = '#ffffff';
    lctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText(data.name, 128, 32);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.minFilter = THREE.LinearFilter;
    labelTex.colorSpace = THREE.SRGBColorSpace;

    const labelSpriteMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });
    const labelSprite = new THREE.Sprite(labelSpriteMat);
    labelSprite.scale.set(data.radius * 2.5, data.radius * 0.6, 1);
    labelSprite.position.y = data.radius + 0.8;
    labelSprite.userData = { isLabel: true };
    mesh.add(labelSprite);
    labels.push(labelSprite);

    planets.push(mesh);
});

// ──────────────────────────────────────────
//  MOON (orbiting Earth)
// ──────────────────────────────────────────

const earth = planets.find(p => p.name === 'Earth');

const moonTexture = createProceduralTexture(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
        const shade = 180 + Math.random() * 50;
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }
});

const moonGeom = new THREE.SphereGeometry(0.22, 32, 32);
const moonMat = new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 0.9,
    metalness: 0,
});
const moon = new THREE.Mesh(moonGeom, moonMat);
moon.name = 'Moon';
moon.userData = {
    orbitRadius: 1.8,
    speed: 8.0,
    angle: 0,
};
scene.add(moon);

// Moon label
const moonLabelCanvas = document.createElement('canvas');
moonLabelCanvas.width = 128;
moonLabelCanvas.height = 32;
const mlctx = moonLabelCanvas.getContext('2d');
mlctx.fillStyle = '#cccccc';
mlctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
mlctx.textAlign = 'center';
mlctx.textBaseline = 'middle';
mlctx.fillText('Moon', 64, 16);
const moonLabelTex = new THREE.CanvasTexture(moonLabelCanvas);
moonLabelTex.minFilter = THREE.LinearFilter;
moonLabelTex.colorSpace = THREE.SRGBColorSpace;
const moonLabelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: moonLabelTex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
}));
moonLabelSprite.scale.set(0.8, 0.2, 1);
moonLabelSprite.position.y = 0.5;
moon.add(moonLabelSprite);
labels.push(moonLabelSprite);

// Moon orbit ring
const moonOrbitPts = [];
for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    moonOrbitPts.push(new THREE.Vector3(Math.cos(a) * 1.8, 0, Math.sin(a) * 1.8));
}
const moonOrbitGeom = new THREE.BufferGeometry().setFromPoints(moonOrbitPts);
const moonOrbitLine = new THREE.Line(moonOrbitGeom, new THREE.LineBasicMaterial({
    color: 0x334455,
    transparent: true,
    opacity: 0.25,
}));
earth.add(moonOrbitLine);

// ──────────────────────────────────────────
//  ASTEROID BELT (between Mars and Jupiter)
// ──────────────────────────────────────────

function createAsteroidBelt() {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const innerR = 25;
    const outerR = 30;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = innerR + Math.random() * (outerR - innerR);
        const y = (Math.random() - 0.5) * 1.5;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x888899,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const belt = new THREE.Points(geom, mat);
    belt.rotation.x = 0.03;
    scene.add(belt);
    return belt;
}

const asteroidBelt = createAsteroidBelt();

// ──────────────────────────────────────────
//  ANIMATION STATE
// ──────────────────────────────────────────

const state = {
    paused: false,
    speed: 1.0,
    showLabels: true,
};

// ──────────────────────────────────────────
//  ANIMATION LOOP
// ──────────────────────────────────────────

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);
    const effectiveDt = state.paused ? 0 : dt * state.speed;

    // Rotate sun
    sun.rotation.y += effectiveDt * 0.1;

    // Update sun glow positions (follow sun — already at origin so no change needed)
    // Rotate glow layers
    glow1.rotation.y += effectiveDt * 0.03;
    glow2.rotation.y -= effectiveDt * 0.02;
    glow3.rotation.y += effectiveDt * 0.015;

    // Update planets
    planets.forEach((planet) => {
        const ud = planet.userData;

        // Orbital motion
        ud.angle += effectiveDt * ud.speed * 0.5;
        planet.position.x = Math.cos(ud.angle) * ud.orbitRadius;
        planet.position.z = Math.sin(ud.angle) * ud.orbitRadius;

        // Self rotation
        planet.rotation.y += effectiveDt * ud.rotationSpeed;

        // Update label visibility
        planet.children.forEach(child => {
            if (child.userData && child.userData.isLabel) {
                child.visible = state.showLabels;
            }
        });
    });

    // Update moon — relative to Earth
    moon.userData.angle += effectiveDt * moon.userData.speed * 0.5;
    moon.position.x = earth.position.x + Math.cos(moon.userData.angle) * moon.userData.orbitRadius;
    moon.position.z = earth.position.z + Math.sin(moon.userData.angle) * moon.userData.orbitRadius;
    moon.rotation.y += effectiveDt * 0.01;
    moonLabelSprite.visible = state.showLabels;

    // Rotate starfield slowly for ambient motion
    starfield.rotation.y += effectiveDt * 0.002;
    starfield.rotation.x += effectiveDt * 0.001;

    // Rotate asteroid belt
    asteroidBelt.rotation.y += effectiveDt * 0.03;

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
}

// ──────────────────────────────────────────
//  UI CONTROLS
// ──────────────────────────────────────────

const btnPause = document.getElementById('btn-pause');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const btnLabels = document.getElementById('btn-labels');
const btnTopView = document.getElementById('btn-topview');
const btnReset = document.getElementById('btn-reset');

btnPause.addEventListener('click', () => {
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '▶️ 繼續' : '⏯️ 暫停';
    btnPause.classList.toggle('active', state.paused);
});

speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedValue.textContent = state.speed.toFixed(1) + '×';
});

btnLabels.addEventListener('click', () => {
    state.showLabels = !state.showLabels;
    btnLabels.classList.toggle('active', state.showLabels);
    btnLabels.textContent = state.showLabels ? '🏷️ 標籤' : '🏷️ 隱藏';
});

btnTopView.addEventListener('click', () => {
    // Animate to top-down view
    const targetPos = new THREE.Vector3(0, 60, 2);
    const targetLook = new THREE.Vector3(0, 0, 0);
    animateCamera(targetPos, targetLook);
});

btnReset.addEventListener('click', () => {
    const targetPos = new THREE.Vector3(20, 30, 50);
    const targetLook = new THREE.Vector3(0, 0, 0);
    animateCamera(targetPos, targetLook);
});

function animateCamera(targetPos, targetLook) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();
    const duration = 1200;

    function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1.0);
        // Ease in-out
        const eased = t < 0.5
            ? 2 * t * t
            : -1 + (4 - 2 * t) * t;

        camera.position.lerpVectors(startPos, targetPos, eased);
        controls.target.lerpVectors(startTarget, targetLook, eased);
        controls.update();

        if (t < 1) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            state.paused = !state.paused;
            btnPause.textContent = state.paused ? '▶️ 繼續' : '⏯️ 暫停';
            btnPause.classList.toggle('active', state.paused);
            break;
        case 'l':
            state.showLabels = !state.showLabels;
            btnLabels.classList.toggle('active', state.showLabels);
            btnLabels.textContent = state.showLabels ? '🏷️ 標籤' : '🏷️ 隱藏';
            break;
        case 't':
            btnTopView.click();
            break;
        case 'r':
            btnReset.click();
            break;
    }
});

// ──────────────────────────────────────────
//  RESIZE HANDLER
// ──────────────────────────────────────────

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ──────────────────────────────────────────
//  START
// ──────────────────────────────────────────

animate();

// Show brief hint
const tooltip = document.getElementById('info-tooltip');
tooltip.textContent = '🖱️ 拖曳旋轉 | 🔍 滾輪縮放 | ⌨️ 空白鍵暫停 | L 切換標籤';
tooltip.classList.remove('hidden');
setTimeout(() => tooltip.classList.add('hidden'), 6000);

console.log('🪐 3D Solar System ready!');
console.log('Controls: Drag to rotate | Scroll to zoom | Space to pause | L for labels');
