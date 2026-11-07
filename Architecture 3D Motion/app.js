/**
 * Architecture 3D Motion — Sydney Opera House (Blender 4.5 Architectural Model)
 * Interactive 8-Layer 3D Deconstruction & Exploded View Engine
 * Powered by Three.js & Authentic Blender 4.5 Geometry (229,647 Triangles)
 */

(function () {
  'use strict';

  // --- Global State ---
  let scene, camera, renderer, controls;
  let layerGroups = []; // Array of { id, group, basePosY, explodedPosY, meshes, data }
  let loadPathLinesGroup;
  let waterMesh, waterMaterial;
  let harbourBridgeMesh, citySilhouettes, ferryGroup;
  let raycaster, mouse;
  let hoveredLayerId = null;
  let selectedLayerId = null;

  // Animation & Motion State
  let currentExplosion = 0.0; // 0.0 = fully assembled, 1.0 = fully exploded
  let targetExplosion = 0.0;
  let isXRayMode = false;
  let isAutoOrbit = false;

  // DOM Elements
  let canvas, statusBadge, slider, sliderValue, drawer;
  let pinsContainer;
  let pinElements = {};

  // Procedural Swedish Höganäs Tile Texture
  let tileTexture;

  // Exploded Y offsets for each of the 8 layers
  const LAYER_EXPLODED_Y = {
    1: -2.8,
    2: 0.0,
    3: 4.6,
    4: 9.2,
    5: 14.2,
    6: 19.6,
    7: 25.8,
    8: 33.2
  };

  // --- Initialization ---
  window.addEventListener('DOMContentLoaded', init);

  async function init() {
    canvas = document.getElementById('webgl-canvas');
    statusBadge = document.getElementById('status-badge');
    slider = document.getElementById('explosion-slider');
    sliderValue = document.getElementById('slider-value');
    drawer = document.getElementById('detail-drawer');
    pinsContainer = document.getElementById('layer-pins-container');

    initThree();
    generateTileTexture();
    buildEnvironment();
    buildLoadPathLines();
    setupEventListeners();
    setupPinsUI();

    if (statusBadge) {
      statusBadge.innerHTML = '<span class="indicator-dot"></span> Loading Blender 3D Mesh...';
    }

    try {
      await loadBlenderOperaHouseLayers();
      updateAssemblyUI(0.0);
    } catch (err) {
      console.error('Failed to load Blender mesh:', err);
    }

    animate();
  }

  // --- Three.js Setup ---
  function initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.0055);

    camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 800);
    // Iconic North-West Harbour Axonometric Vantage Point (viewing the sails & northern glass lounges)
    camera.position.set(38, 24, 44);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 4.5, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.015;
    controls.minDistance = 12;
    controls.maxDistance = 160;
    controls.enablePan = true;

    // Studio + Daylight Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.58);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe4f0ff, 0x182030, 0.65);
    scene.add(hemiLight);

    // Warm Australian Sunlight
    const sunLight = new THREE.DirectionalLight(0xfff8eb, 1.45);
    sunLight.position.set(48, 68, 42);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    const d = 45;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Cool Harbour Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x7aa8dc, 0.65);
    fillLight.position.set(-45, 35, -40);
    scene.add(fillLight);

    // Warm Uplight from Podium Reflection
    const rimLight = new THREE.DirectionalLight(0xffeed6, 0.35);
    rimLight.position.set(0, -15, 30);
    scene.add(rimLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
  }

  // --- Procedural Swedish Höganäs Tile Texture ---
  function generateTileTexture() {
    const size = 512;
    const canvasTex = document.createElement('canvas');
    canvasTex.width = size;
    canvasTex.height = size;
    const ctx = canvasTex.getContext('2d');

    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, size, size);

    const rows = 32;
    const cols = 32;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isGloss = (r + c) % 2 === 0;
        ctx.fillStyle = isGloss ? '#fcfbf7' : '#efece2';
        ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
      }
    }

    tileTexture = new THREE.CanvasTexture(canvasTex);
    tileTexture.wrapS = THREE.RepeatWrapping;
    tileTexture.wrapT = THREE.RepeatWrapping;
    tileTexture.repeat.set(6, 6);
  }

  // --- Build Sydney Harbour Environment ---
  function buildEnvironment() {
    // 1. Sydney Harbour Water Plane
    const waterGeo = new THREE.PlaneGeometry(360, 360, 64, 64);
    waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d2b45,
      roughness: 0.14,
      metalness: 0.72,
      transparent: true,
      opacity: 0.96
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.35;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // 2. Circular Quay / Sydney CBD Skyline (South)
    citySilhouettes = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x161e2b,
      roughness: 0.8,
      metalness: 0.2
    });

    const bldgHeights = [18, 28, 42, 24, 34, 48, 26, 36, 22, 31];
    for (let i = 0; i < 22; i++) {
      const h = bldgHeights[i % bldgHeights.length] * (0.8 + (i * 17 % 10) * 0.04);
      const w = 4.5 + (i % 4) * 1.5;
      const bGeo = new THREE.BoxGeometry(w, h, w);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(-45 + (i % 7) * 14, h / 2 - 1, -68 - Math.floor(i / 7) * 14);
      citySilhouettes.add(bMesh);
    }
    scene.add(citySilhouettes);

    // 3. Sydney Green & Gold Harbour Ferry
    ferryGroup = new THREE.Group();
    const ferryHullMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.35 });
    const ferryCabinMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.4 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.1, 2.6), ferryHullMat);
    hull.position.y = 0.4;
    ferryGroup.add(hull);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.95, 2.0), ferryCabinMat);
    cabin.position.y = 1.35;
    ferryGroup.add(cabin);

    ferryGroup.position.set(28, -0.25, 22);
    ferryGroup.rotation.y = -Math.PI / 3.5;
    scene.add(ferryGroup);
  }

  // --- Dynamic Structural Load-Path Guide Lines ---
  function buildLoadPathLines() {
    loadPathLinesGroup = new THREE.Group();

    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00e5ff,
      linewidth: 2,
      scale: 1,
      dashSize: 0.7,
      gapSize: 0.4,
      transparent: true,
      opacity: 0.0
    });

    const anchorPoints = [
      // Concert Hall (Major Hall) structural arch pedestals
      { x: 4.5, z: 6.0, maxH: 42 },
      { x: 4.5, z: 0.0, maxH: 44 },
      { x: 4.5, z: -6.0, maxH: 40 },
      { x: 4.5, z: -12.0, maxH: 36 },
      // Joan Sutherland Theatre (Minor Hall) structural arch pedestals
      { x: -9.5, z: 6.0, maxH: 39 },
      { x: -9.5, z: 0.0, maxH: 41 },
      { x: -9.5, z: -6.0, maxH: 38 },
      // Bennelong Restaurant shell & Podium corners
      { x: 11.0, z: -14.0, maxH: 36 },
      { x: 12.0, z: 14.0, maxH: 20 },
      { x: -14.0, z: 14.0, maxH: 20 }
    ];

    anchorPoints.forEach(pt => {
      const points = [
        new THREE.Vector3(pt.x, -2.5, pt.z),
        new THREE.Vector3(pt.x, pt.maxH, pt.z)
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, lineMat.clone());
      line.computeLineDistances();
      loadPathLinesGroup.add(line);
    });

    scene.add(loadPathLinesGroup);
  }

  // ==========================================================================
  // BLENDER 4.5 8-LAYER MESH LOADER & MATERIAL ENGINE
  // ==========================================================================
  async function loadBlenderOperaHouseLayers() {
    const [metaRes, binRes] = await Promise.all([
      fetch('assets/soh_blender_mesh.json?v=20261107b'),
      fetch('assets/soh_blender_mesh.bin?v=20261107b')
    ]);
    const meta = await metaRes.json();
    const arrayBuffer = await binRes.arrayBuffer();

    const materials = {
      // Layer 08: Precast Spherical Shell Roofs ("The Sails")
      shell_gloss: new THREE.MeshStandardMaterial({
        color: 0xfbf9f2,
        roughness: 0.24,
        metalness: 0.08,
        map: tileTexture,
        bumpMap: tileTexture,
        bumpScale: 0.025,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      }),
      shell_chevron: new THREE.MeshStandardMaterial({
        color: 0xf0ebe0,
        roughness: 0.36,
        metalness: 0.06,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      }),
      shell_ridge: new THREE.MeshStandardMaterial({
        color: 0xe3dcd0,
        roughness: 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      }),

      // Layer 07: Fan Radial Concrete Rib Arches
      ribs_fan: new THREE.MeshStandardMaterial({
        color: 0xd6cec0,
        roughness: 0.68,
        metalness: 0.05,
        side: THREE.DoubleSide
      }),
      ribs_spine: new THREE.MeshStandardMaterial({
        color: 0xc4bbb0,
        roughness: 0.72,
        metalness: 0.06,
        side: THREE.DoubleSide
      }),

      // Layer 06: Performance Stages, Fly Tower & Acoustic Vaults
      stage_vault: new THREE.MeshStandardMaterial({
        color: 0x3b424c,
        roughness: 0.75,
        metalness: 0.22,
        side: THREE.DoubleSide
      }),
      stage_wood_canopy: new THREE.MeshStandardMaterial({
        color: 0xc98e54,
        roughness: 0.48,
        metalness: 0.06,
        side: THREE.DoubleSide
      }),
      stage_deck: new THREE.MeshStandardMaterial({
        color: 0x6b533e,
        roughness: 0.65,
        metalness: 0.1,
        side: THREE.DoubleSide
      }),

      // Layer 05: Concert Hall & Opera Auditoriums
      auditorium_timber: new THREE.MeshStandardMaterial({
        color: 0xc48850,
        roughness: 0.52,
        metalness: 0.05,
        side: THREE.DoubleSide
      }),
      auditorium_seats: new THREE.MeshStandardMaterial({
        color: 0x992440,
        roughness: 0.65,
        metalness: 0.02,
        side: THREE.DoubleSide
      }),
      auditorium_walls: new THREE.MeshStandardMaterial({
        color: 0xa67346,
        roughness: 0.58,
        metalness: 0.04,
        side: THREE.DoubleSide
      }),

      // Layer 04: Grand Foyers & Public Concourse
      foyer_concourse: new THREE.MeshStandardMaterial({
        color: 0xd2c8b8,
        roughness: 0.58,
        metalness: 0.05,
        side: THREE.DoubleSide
      }),
      foyer_teak: new THREE.MeshStandardMaterial({
        color: 0xad703e,
        roughness: 0.46,
        metalness: 0.06,
        side: THREE.DoubleSide
      }),
      foyer_carpet: new THREE.MeshStandardMaterial({
        color: 0x6e2b5c,
        roughness: 0.78,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),

      // Layer 03: Bronze-Tinted Structural Glass Curtain Walls
      glass_pane: new THREE.MeshPhysicalMaterial({
        color: 0x8cc2e8,
        roughness: 0.12,
        metalness: 0.18,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide
      }),
      glass_internal: new THREE.MeshPhysicalMaterial({
        color: 0x9cd0f0,
        roughness: 0.15,
        metalness: 0.12,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide
      }),
      bronze_mullion: new THREE.MeshStandardMaterial({
        color: 0x6e5239,
        roughness: 0.42,
        metalness: 0.55,
        side: THREE.DoubleSide
      }),

      // Layer 02: Monumental Stepped Concrete Podium
      podium_terrace: new THREE.MeshStandardMaterial({
        color: 0xd5c8b6,
        roughness: 0.76,
        metalness: 0.04,
        side: THREE.DoubleSide
      }),
      podium_parapet: new THREE.MeshStandardMaterial({
        color: 0xc4b6a4,
        roughness: 0.8,
        metalness: 0.04,
        side: THREE.DoubleSide
      }),

      // Layer 01: Bennelong Point & Harbour Sea Wall
      site_seawall: new THREE.MeshStandardMaterial({
        color: 0x9e9181,
        roughness: 0.85,
        metalness: 0.03,
        side: THREE.DoubleSide
      }),
      site_peninsula: new THREE.MeshStandardMaterial({
        color: 0x827668,
        roughness: 0.9,
        metalness: 0.02,
        side: THREE.DoubleSide
      }),

      // Layer 00: Sydney Harbour Bridge Context
      harbour_bridge: new THREE.MeshStandardMaterial({
        color: 0x2c3644,
        roughness: 0.55,
        metalness: 0.65,
        side: THREE.DoubleSide
      })
    };

    // Create 8 layer groups (8 down to 1)
    const groupsById = {};
    for (let id = 1; id <= 8; id++) {
      const g = new THREE.Group();
      g.name = `Layer 0${id}`;
      groupsById[id] = g;
    }

    // Decode each binary chunk into a BufferGeometry
    meta.chunks.forEach(ch => {
      const vcnt = ch.vertexCount;
      const tcnt = ch.triCount;
      const vq = new Uint16Array(arrayBuffer, ch.vByteOffset, vcnt * 3);
      const positions = new Float32Array(vcnt * 3);

      const vmin0 = ch.vmin[0], vmin1 = ch.vmin[1], vmin2 = ch.vmin[2];
      const vspan0 = ch.vspan[0] / 65535.0;
      const vspan1 = ch.vspan[1] / 65535.0;
      const vspan2 = ch.vspan[2] / 65535.0;

      for (let i = 0, j = 0; i < vcnt; i++, j += 3) {
        positions[j]     = vmin0 + vq[j]     * vspan0;
        positions[j + 1] = vmin1 + vq[j + 1] * vspan1;
        positions[j + 2] = vmin2 + vq[j + 2] * vspan2;
      }

      const indices = ch.idxType === 'uint16'
        ? new Uint16Array(arrayBuffer, ch.iByteOffset, tcnt * 3)
        : new Uint32Array(arrayBuffer, ch.iByteOffset, tcnt * 3);

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setIndex(new THREE.BufferAttribute(indices, 1));

      // Generate planar UVs for shell ceramic tile texture mapping
      if (ch.layerId === 8) {
        const uvs = new Float32Array(vcnt * 2);
        for (let i = 0, j = 0, u = 0; i < vcnt; i++, j += 3, u += 2) {
          uvs[u]     = (positions[j] + positions[j + 2]) * 0.12;
          uvs[u + 1] = positions[j + 1] * 0.15;
        }
        geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      }

      geom.computeVertexNormals();

      const baseMat = materials[ch.matKey] || materials.podium_terrace;
      const meshMat = baseMat.clone();
      const mesh = new THREE.Mesh(geom, meshMat);
      mesh.castShadow = ch.layerId >= 2;
      mesh.receiveShadow = true;
      mesh.userData.matKey = ch.matKey;

      if (ch.layerId === 0) {
        // Position the Sydney Harbour Bridge across the harbour to the West/North-West
        mesh.position.set(-55, -0.3, 42);
        mesh.rotation.y = Math.PI * 0.28;
        harbourBridgeMesh = mesh;
        scene.add(mesh);
      } else {
        mesh.userData.layerId = ch.layerId;
        groupsById[ch.layerId].add(mesh);
      }
    });

    // Register layers 8 down to 1
    for (let id = 8; id >= 1; id--) {
      registerLayer(id, groupsById[id], 0.0, LAYER_EXPLODED_Y[id]);
    }

    updateExplosionPositions(currentExplosion);
  }

  function registerLayer(id, group, basePosY, explodedPosY) {
    scene.add(group);

    const meshes = [];
    group.traverse(child => {
      if (child.isMesh) {
        child.userData.layerId = id;
        meshes.push(child);
      }
    });

    layerGroups.push({
      id: id,
      group: group,
      basePosY: basePosY,
      explodedPosY: explodedPosY,
      meshes: meshes,
      data: ARCHITECTURE_DATA.layers.find(l => l.id === id)
    });
  }

  // --- Dynamic Floating 3D Pin Setup ---
  function setupPinsUI() {
    pinsContainer.innerHTML = '';
    pinElements = {};

    ARCHITECTURE_DATA.layers.forEach(layer => {
      const pin = document.createElement('div');
      pin.className = 'layer-pin';
      pin.id = `layer-pin-${layer.id}`;
      pin.innerHTML = `
        <span class="pin-number">${String(layer.id).padStart(2, '0')}</span>
        <span class="pin-title">${layer.title.split(' ')[0]} ${layer.title.split(' ')[1] || ''}</span>
        <span class="pin-zh">${layer.subTitleZh.split(' ')[0]}</span>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLayer(layer.id);
      });

      pin.addEventListener('mouseenter', () => highlightLayer(layer.id));
      pin.addEventListener('mouseleave', () => unhighlightLayer());

      pinsContainer.appendChild(pin);
      pinElements[layer.id] = pin;
    });
  }

  // --- Update 3D Positions & Load Lines Based on Explosion Progress ---
  function updateExplosionPositions(progress) {
    layerGroups.forEach(item => {
      const currentY = THREE.MathUtils.lerp(item.basePosY, item.explodedPosY, progress);
      item.group.position.y = currentY;

      // When 100% assembled (progress < 0.02) and not in X-Ray mode,
      // keep internal structural layers (4, 5, 6, 7) tucked inside so zero interior geometry
      // ever causes Z-fighting through the exterior ceramic shells or podium slabs.
      if (item.id >= 4 && item.id <= 7 && !isXRayMode) {
        item.group.visible = progress > 0.015;
      } else {
        item.group.visible = true;
      }
    });

    // Smoothly adjust camera target height as building explodes upwards
    if (controls && !selectedLayerId) {
      controls.target.y = THREE.MathUtils.lerp(4.2, 14.5, progress);
    }

    // Animate connecting structural load lines
    if (loadPathLinesGroup) {
      loadPathLinesGroup.children.forEach(line => {
        line.material.opacity = Math.min(0.85, progress * 1.35);
      });
    }

    // Water & harbour environment reactivity
    if (waterMaterial) {
      waterMaterial.opacity = 0.96 - progress * 0.32;
      waterMaterial.roughness = 0.14 + progress * 0.18;
    }
  }

  // Update 2D Screen Positions for Floating 3D Pins
  function updatePinsProjection() {
    if (!camera || !pinsContainer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isExploded = currentExplosion > 0.06;

    layerGroups.forEach(item => {
      const pin = pinElements[item.id];
      if (!pin) return;

      if (!isExploded) {
        pin.style.opacity = '0';
        pin.style.pointerEvents = 'none';
        return;
      }

      const pinPos = new THREE.Vector3(16.0, item.group.position.y + 2.2, 4.0);
      pinPos.project(camera);

      if (pinPos.z > 1) {
        pin.style.opacity = '0';
        pin.style.pointerEvents = 'none';
        return;
      }

      const screenX = (pinPos.x * 0.5 + 0.5) * width;
      const screenY = (-(pinPos.y * 0.5) + 0.5) * height;

      pin.style.left = `${screenX}px`;
      pin.style.top = `${screenY}px`;
      pin.style.opacity = '1';
      pin.style.pointerEvents = 'auto';
    });
  }

  // --- Scroll & Wheel Interaction Mechanics ---
  function setupEventListeners() {
    // 1. Mouse Wheel Scroll Interaction:
    // Scroll UP (deltaY < 0) -> Deconstruct / Explode the 8 layers
    // Scroll DOWN (deltaY > 0) -> Assemble into complete building & harbour context
    window.addEventListener('wheel', onWindowScroll, { passive: false });

    function onWindowScroll(e) {
      if (e.target.closest('.drawer-content') || e.target.closest('.modal-body')) {
        return;
      }

      e.preventDefault();

      const delta = e.deltaY;
      const sensitivity = 0.0018;

      if (delta < 0) {
        targetExplosion = Math.min(1.0, targetExplosion + Math.abs(delta) * sensitivity);
      } else if (delta > 0) {
        targetExplosion = Math.max(0.0, targetExplosion - Math.abs(delta) * sensitivity);
      }

      if (slider) {
        slider.value = Math.round(targetExplosion * 100);
      }
      updateAssemblyUI(targetExplosion);
    }

    // 2. Touch gestures for mobile/tablet
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.target.closest('.drawer-content') || e.target.closest('.modal-body')) return;
      const touchY = e.touches[0].clientY;
      const diffY = touchStartY - touchY;

      targetExplosion = THREE.MathUtils.clamp(targetExplosion + diffY * 0.002, 0.0, 1.0);
      touchStartY = touchY;

      if (slider) slider.value = Math.round(targetExplosion * 100);
      updateAssemblyUI(targetExplosion);
    }, { passive: true });

    // 3. Explosion Scrub Slider
    if (slider) {
      slider.addEventListener('input', (e) => {
        targetExplosion = parseFloat(e.target.value) / 100;
        updateAssemblyUI(targetExplosion);
      });
    }

    // 4. Quick Action Buttons
    const btnExplode = document.getElementById('btn-explode');
    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        targetExplosion = 1.0;
        if (slider) slider.value = 100;
        updateAssemblyUI(1.0);
      });
    }

    const btnAssemble = document.getElementById('btn-assemble');
    if (btnAssemble) {
      btnAssemble.addEventListener('click', () => {
        selectedLayerId = null;
        targetExplosion = 0.0;
        if (slider) slider.value = 0;
        updateAssemblyUI(0.0);
      });
    }

    const btnXRay = document.getElementById('btn-xray');
    if (btnXRay) {
      btnXRay.addEventListener('click', toggleXRayMode);
    }

    const btnAutoOrbit = document.getElementById('btn-auto-orbit');
    if (btnAutoOrbit) {
      btnAutoOrbit.addEventListener('click', toggleAutoOrbit);
    }

    // Camera preset buttons
    const btnPresetAxo = document.getElementById('btn-view-axo');
    if (btnPresetAxo) btnPresetAxo.addEventListener('click', () => setCameraPreset('axo'));

    const btnPresetFront = document.getElementById('btn-view-front');
    if (btnPresetFront) btnPresetFront.addEventListener('click', () => setCameraPreset('front'));

    const btnPresetElevation = document.getElementById('btn-view-elevation');
    if (btnPresetElevation) btnPresetElevation.addEventListener('click', () => setCameraPreset('elevation'));

    const btnPresetTop = document.getElementById('btn-view-top');
    if (btnPresetTop) btnPresetTop.addEventListener('click', () => setCameraPreset('top'));

    // 5. Layer Chips at Bottom
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.layerId, 10);
        selectLayer(id);
      });
    });

    // 6. Raycasting Click & Hover Detection
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('click', onCanvasClick);

    // 7. Drawer Close & Nav
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', closeDrawer);
    }

    const btnDrawerPrev = document.getElementById('btn-drawer-prev');
    if (btnDrawerPrev) {
      btnDrawerPrev.addEventListener('click', () => navigateLayer(-1));
    }

    const btnDrawerNext = document.getElementById('btn-drawer-next');
    if (btnDrawerNext) {
      btnDrawerNext.addEventListener('click', () => navigateLayer(1));
    }

    // 8. Gallery Modal
    const btnOpenGallery = document.getElementById('btn-open-gallery');
    const modalGallery = document.getElementById('modal-gallery');
    const btnCloseModal = document.getElementById('btn-close-modal');

    if (btnOpenGallery && modalGallery) {
      btnOpenGallery.addEventListener('click', () => {
        modalGallery.classList.add('open');
      });
    }
    if (btnCloseModal && modalGallery) {
      btnCloseModal.addEventListener('click', () => {
        modalGallery.classList.remove('open');
      });
    }

    // 9. Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    window.addEventListener('resize', onWindowResize);
  }

  // --- UI Assembly State Updating ---
  function updateAssemblyUI(progress) {
    if (sliderValue) {
      sliderValue.textContent = `${Math.round(progress * 100)}%`;
    }

    if (statusBadge) {
      if (progress < 0.05) {
        statusBadge.className = 'status-badge assembled';
        statusBadge.innerHTML = '<span class="indicator-dot"></span> Assembled Building (Blender 3D)';
      } else if (progress > 0.9) {
        statusBadge.className = 'status-badge';
        statusBadge.innerHTML = '<span class="indicator-dot"></span> Exploded 8-Layer View (100%)';
      } else {
        statusBadge.className = 'status-badge';
        statusBadge.innerHTML = `<span class="indicator-dot"></span> Deconstructing (${Math.round(progress * 100)}%)`;
      }
    }
  }

  // --- Raycasting & Pointer Handlers ---
  function onCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allMeshes = [];
    layerGroups.forEach(lg => {
      if (lg.group.visible) allMeshes.push(...lg.meshes);
    });

    const intersects = raycaster.intersectObjects(allMeshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const layerId = hit.object.userData.layerId;
      if (layerId) {
        highlightLayer(layerId);
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    unhighlightLayer();
    canvas.style.cursor = 'grab';
  }

  function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allMeshes = [];
    layerGroups.forEach(lg => {
      if (lg.group.visible) allMeshes.push(...lg.meshes);
    });

    const intersects = raycaster.intersectObjects(allMeshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const layerId = hit.object.userData.layerId;
      if (layerId) {
        selectLayer(layerId);
      }
    }
  }

  function setLayerEmissive(activeId) {
    layerGroups.forEach(lg => {
      const isMatch = lg.id === activeId;
      lg.meshes.forEach(m => {
        if (m.material && m.material.emissive) {
          m.material.emissive.setHex(isMatch ? 0x2a2008 : 0x000000);
        }
      });
    });
  }

  function highlightLayer(id) {
    if (hoveredLayerId === id) return;
    hoveredLayerId = id;

    setLayerEmissive(id);

    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.layerId, 10) === id);
    });

    Object.keys(pinElements).forEach(k => {
      pinElements[k].classList.toggle('active', parseInt(k, 10) === id);
    });
  }

  function unhighlightLayer() {
    if (!hoveredLayerId) return;
    hoveredLayerId = null;

    setLayerEmissive(selectedLayerId);

    if (!selectedLayerId) {
      document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
      Object.keys(pinElements).forEach(k => pinElements[k].classList.remove('active'));
    } else {
      document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.layerId, 10) === selectedLayerId);
      });
      Object.keys(pinElements).forEach(k => {
        pinElements[k].classList.toggle('active', parseInt(k, 10) === selectedLayerId);
      });
    }
  }

  // Select layer & open English technical drawer
  function selectLayer(id) {
    selectedLayerId = id;
    const layerData = ARCHITECTURE_DATA.layers.find(l => l.id === id);
    if (!layerData) return;

    if (targetExplosion < 0.45) {
      targetExplosion = 0.88;
      if (slider) slider.value = 88;
      updateAssemblyUI(0.88);
    }

    setLayerEmissive(id);

    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.layerId, 10) === id);
    });
    Object.keys(pinElements).forEach(k => {
      pinElements[k].classList.toggle('active', parseInt(k, 10) === id);
    });

    populateDrawer(layerData);
    drawer.classList.add('open');

    const targetObj = layerGroups.find(lg => lg.id === id);
    if (targetObj) {
      const targetY = THREE.MathUtils.lerp(targetObj.basePosY, targetObj.explodedPosY, targetExplosion) + 3.0;
      controls.target.set(0, targetY, 0);
    }
  }

  function closeDrawer() {
    selectedLayerId = null;
    setLayerEmissive(null);
    drawer.classList.remove('open');
    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
    Object.keys(pinElements).forEach(k => pinElements[k].classList.remove('active'));
  }

  function navigateLayer(delta) {
    if (!selectedLayerId) selectedLayerId = 8;
    let nextId = selectedLayerId + delta;
    if (nextId > 8) nextId = 1;
    if (nextId < 1) nextId = 8;
    selectLayer(nextId);
  }

  function populateDrawer(data) {
    document.getElementById('drawer-layer-badge').textContent = `LAYER ${String(data.id).padStart(2, '0')} · ${data.category.toUpperCase()}`;
    document.getElementById('drawer-title').textContent = data.title;
    document.getElementById('drawer-title-zh').textContent = `${data.subTitleZh} — Jørn Utzon & Ove Arup (1959–1973)`;

    document.getElementById('drawer-meta-elevation').textContent = data.elevation;
    document.getElementById('drawer-meta-stage').textContent = data.stage;
    document.getElementById('drawer-meta-category').textContent = data.category;
    document.getElementById('drawer-meta-weight').textContent = "Blender 4.5 Precast System";

    document.getElementById('drawer-lead').textContent = data.leadSummary;
    document.getElementById('drawer-concept').textContent = data.concept;
    document.getElementById('drawer-engineering').textContent = data.engineering;

    const matList = document.getElementById('drawer-materials-list');
    matList.innerHTML = '';
    data.materials.forEach(m => {
      const li = document.createElement('li');
      li.textContent = m;
      matList.appendChild(li);
    });

    document.getElementById('drawer-load-desc').textContent = data.loadTransmission;

    const mainImg = document.getElementById('drawer-main-image');
    if (mainImg) mainImg.src = data.image;

    const diagImg = document.getElementById('drawer-diagram-image');
    if (diagImg) diagImg.src = data.diagram;
  }

  // --- X-Ray & Camera Presets ---
  function toggleXRayMode() {
    isXRayMode = !isXRayMode;
    const btn = document.getElementById('btn-xray');
    if (btn) btn.classList.toggle('active', isXRayMode);

    const layer08 = layerGroups.find(lg => lg.id === 8);
    if (layer08) {
      layer08.meshes.forEach(m => {
        if (m.material) {
          m.material.transparent = isXRayMode;
          m.material.opacity = isXRayMode ? 0.25 : 1.0;
          m.material.wireframe = isXRayMode;
        }
      });
    }
    updateExplosionPositions(currentExplosion);
  }

  function toggleAutoOrbit() {
    isAutoOrbit = !isAutoOrbit;
    const btn = document.getElementById('btn-auto-orbit');
    if (btn) btn.classList.toggle('active', isAutoOrbit);
  }

  function setCameraPreset(preset) {
    if (!controls || !camera) return;

    const centerH = THREE.MathUtils.lerp(4.2, 14.5, currentExplosion);
    if (preset === 'axo') {
      camera.position.set(38, 24 + currentExplosion * 14, 44);
      controls.target.set(0, centerH, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 10 + currentExplosion * 10, 56);
      controls.target.set(0, centerH, 0);
    } else if (preset === 'elevation') {
      camera.position.set(58, 9 + currentExplosion * 10, 0);
      controls.target.set(0, centerH, 0);
    } else if (preset === 'top') {
      camera.position.set(0.1, 78 + currentExplosion * 20, 0.1);
      controls.target.set(0, centerH * 0.5, 0);
    }
    controls.update();
  }

  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // =========================================================================
  // MediaPipe Holistic Landmarker & Hand Landmarker Gesture Control
  // "Hands Close = Assemble (0%)" | "Hands Open = Exploded (100%)"
  // =========================================================================
  let handControlEnabled = true;
  let mpVision = null;
  let holisticLandmarker = null;
  let handLandmarker = null;
  let lastVideoTime = -1;
  let smoothedHandExplosion = 0.0;
  let hasHandLock = false;

  const webcamVideo = document.getElementById('webcam-video');
  const landmarkCanvas = document.getElementById('landmark-canvas');
  const landmarkCtx = landmarkCanvas ? landmarkCanvas.getContext('2d') : null;
  const handHudCard = document.getElementById('hand-hud-card');
  const btnHandToggle = document.getElementById('btn-hand-toggle');
  const btnHudMinimize = document.getElementById('btn-hud-minimize');
  const handCamDot = document.getElementById('hand-cam-dot');
  const hudStatusDot = document.getElementById('hud-status-dot');
  const hudStatusTitle = document.getElementById('hud-status-title');
  const gestureIcon = document.getElementById('gesture-icon');
  const gestureLabel = document.getElementById('gesture-label');
  const gestureMeterFill = document.getElementById('gesture-meter-fill');

  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];

  function dist2D(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /**
   * Computes single-hand openness in [0.0, 1.0]:
   *  - 0.0 = Closed fist / fingers pinched together (Assemble)
   *  - 1.0 = Wide open palm with 5 fingers extended (Explode)
   */
  function computeSingleHandOpenness(lm) {
    const wrist = lm[0];
    const palmScale = Math.max(0.04, dist2D(wrist, lm[9]));

    // Average fingertip distance to wrist normalized by palm scale
    const tips = [4, 8, 12, 16, 20];
    let tipSum = 0;
    for (let i = 0; i < tips.length; i++) {
      tipSum += dist2D(lm[tips[i]], wrist) / palmScale;
    }
    const avgTipRatio = tipSum / tips.length; // ~0.95 when fist closed, ~2.05 when palm spread open

    // Check extended finger count (index, middle, ring, pinky, thumb)
    const f8  = dist2D(lm[8], wrist)  > dist2D(lm[6], wrist)  * 1.06;
    const f12 = dist2D(lm[12], wrist) > dist2D(lm[10], wrist) * 1.06;
    const f16 = dist2D(lm[16], wrist) > dist2D(lm[14], wrist) * 1.06;
    const f20 = dist2D(lm[20], wrist) > dist2D(lm[18], wrist) * 1.06;
    const f4  = dist2D(lm[4], lm[17]) > dist2D(lm[2], lm[17]) * 1.14;
    const extCount = (f8 ? 1 : 0) + (f12 ? 1 : 0) + (f16 ? 1 : 0) + (f20 ? 1 : 0) + (f4 ? 1 : 0);

    const ratioScore = THREE.MathUtils.clamp((avgTipRatio - 1.08) / 0.86, 0.0, 1.0);
    const countScore = extCount / 5.0;

    let openness = ratioScore * 0.65 + countScore * 0.35;
    if (extCount === 0) openness = Math.min(openness, 0.05);
    if (extCount === 5 && ratioScore > 0.72) openness = Math.max(openness, 0.96);
    return THREE.MathUtils.clamp(openness, 0.0, 1.0);
  }

  /**
   * Computes gesture explosion target from 1 or 2 detected hands:
   *  - If 2 hands are visible: combines two-hand spread distance (hands close together = 0% assemble,
   *    hands spread apart = 100% explode) AND individual palm openness so either opening both palms
   *    or spreading two hands apart explodes the Opera House, and closing hands together or closing fists assembles it.
   *  - If 1 hand is visible: uses single-hand openness (closed fist = 0% assemble, open hand = 100% explode).
   */
  function evaluateHandsExplosion(hands) {
    if (!hands || hands.length === 0) return null;

    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];
      const open1 = computeSingleHandOpenness(h1);
      const open2 = computeSingleHandOpenness(h2);
      const avgOpenness = (open1 + open2) * 0.5;

      // Palm centers (average of wrist 0, index MCP 5, middle MCP 9)
      const c1 = { x: (h1[0].x + h1[5].x + h1[9].x) / 3, y: (h1[0].y + h1[5].y + h1[9].y) / 3 };
      const c2 = { x: (h2[0].x + h2[5].x + h2[9].x) / 3, y: (h2[0].y + h2[5].y + h2[9].y) / 3 };
      const palmDist = dist2D(c1, c2);

      // palmDist <= 0.19 -> hands close together (0.0); palmDist >= 0.54 -> hands wide apart (1.0)
      const spreadScore = THREE.MathUtils.clamp((palmDist - 0.19) / 0.35, 0.0, 1.0);

      // If both fists are closed (< 0.2) OR palms are brought close together (< 0.18), assemble!
      if (avgOpenness < 0.18 || palmDist < 0.17) {
        return Math.min(avgOpenness, spreadScore) * 0.5;
      }
      // Otherwise blend two-hand spread distance and palm openness
      return THREE.MathUtils.clamp( Math.max(spreadScore, avgOpenness * 0.92), 0.0, 1.0 );
    }

    return computeSingleHandOpenness(hands[0]);
  }

  function drawHandLandmarks(hands, poseLandmarks, opennessVal) {
    if (!landmarkCtx || !landmarkCanvas) return;
    const w = landmarkCanvas.width;
    const h = landmarkCanvas.height;
    landmarkCtx.clearRect(0, 0, w, h);

    // Optional Holistic upper-body shoulder/arm lines if available
    if (poseLandmarks && poseLandmarks.length > 16) {
      const posePairs = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16]];
      landmarkCtx.strokeStyle = 'rgba(247, 183, 49, 0.45)';
      landmarkCtx.lineWidth = 2;
      posePairs.forEach(([a, b]) => {
        const pa = poseLandmarks[a];
        const pb = poseLandmarks[b];
        if (pa && pb) {
          landmarkCtx.beginPath();
          landmarkCtx.moveTo(pa.x * w, pa.y * h);
          landmarkCtx.lineTo(pb.x * w, pb.y * h);
          landmarkCtx.stroke();
        }
      });
    }

    if (!hands || hands.length === 0) return;

    const strokeCol = opennessVal > 0.5 ? '#00e5ff' : '#10b981';

    // If 2 hands are detected, draw a glowing distance line between the two palms
    if (hands.length >= 2) {
      const p1 = hands[0][9];
      const p2 = hands[1][9];
      landmarkCtx.save();
      landmarkCtx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
      landmarkCtx.setLineDash([4, 4]);
      landmarkCtx.lineWidth = 2;
      landmarkCtx.beginPath();
      landmarkCtx.moveTo(p1.x * w, p1.y * h);
      landmarkCtx.lineTo(p2.x * w, p2.y * h);
      landmarkCtx.stroke();
      landmarkCtx.restore();
    }

    hands.forEach(lm => {
      landmarkCtx.strokeStyle = strokeCol;
      landmarkCtx.lineWidth = 2.2;
      HAND_CONNECTIONS.forEach(([i, j]) => {
        landmarkCtx.beginPath();
        landmarkCtx.moveTo(lm[i].x * w, lm[i].y * h);
        landmarkCtx.lineTo(lm[j].x * w, lm[j].y * h);
        landmarkCtx.stroke();
      });

      for (let i = 0; i < lm.length; i++) {
        const isTip = (i === 4 || i === 8 || i === 12 || i === 16 || i === 20);
        landmarkCtx.fillStyle = isTip ? '#ffffff' : strokeCol;
        landmarkCtx.beginPath();
        landmarkCtx.arc(lm[i].x * w, lm[i].y * h, isTip ? 3.6 : 2.3, 0, Math.PI * 2);
        landmarkCtx.fill();
      }
    });
  }

  async function initMediaPipeControl() {
    if (!webcamVideo) return;

    if (btnHandToggle) {
      btnHandToggle.addEventListener('click', () => {
        handControlEnabled = !handControlEnabled;
        btnHandToggle.classList.toggle('active', handControlEnabled);
        if (handHudCard) handHudCard.classList.toggle('hidden', !handControlEnabled);
        if (handCamDot) {
          handCamDot.classList.toggle('off', !handControlEnabled);
        }
        if (handControlEnabled && !webcamVideo.srcObject) {
          startCameraStream();
        }
      });
    }

    if (btnHudMinimize && handHudCard) {
      btnHudMinimize.addEventListener('click', () => {
        const isMin = handHudCard.classList.toggle('minimized');
        btnHudMinimize.textContent = isMin ? '+' : '—';
      });
    }

    try {
      const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
      const FilesetResolver = visionModule.FilesetResolver;
      const HolisticLandmarker = visionModule.HolisticLandmarker;
      const HandLandmarker = visionModule.HandLandmarker;

      mpVision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Load HandLandmarker (2 hands) as primary ultra-responsive hand detector,
      // and HolisticLandmarker if available for holistic pose + dual-hand tracking
      handLandmarker = await HandLandmarker.createFromOptions(mpVision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      if (HolisticLandmarker) {
        try {
          holisticLandmarker = await HolisticLandmarker.createFromOptions(mpVision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO'
          });
          if (hudStatusTitle) hudStatusTitle.textContent = 'MediaPipe Holistic + Hands';
        } catch (_) {
          // HandLandmarker is already active and handles 1 & 2 hands
        }
      }

      await startCameraStream();
    } catch (err) {
      console.warn('MediaPipe initialization notice:', err);
      if (gestureLabel) gestureLabel.textContent = 'Click to Enable Camera';
    }
  }

  async function startCameraStream() {
    if (!webcamVideo || webcamVideo.srcObject) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      webcamVideo.srcObject = stream;
      if (handCamDot) handCamDot.classList.add('ready');
      if (hudStatusDot) hudStatusDot.classList.add('ready');
      if (gestureLabel) gestureLabel.textContent = 'Show Hand: Close ✊ / Open 🖐️';
    } catch (err) {
      if (gestureLabel) gestureLabel.textContent = 'Click HUD to Enable Camera';
      if (handHudCard) {
        handHudCard.addEventListener('click', () => startCameraStream(), { once: true });
      }
    }
  }

  function processMediaPipeFrame(now) {
    if (
      !handControlEnabled ||
      !webcamVideo ||
      webcamVideo.readyState < 2 ||
      webcamVideo.videoWidth === 0 ||
      lastVideoTime === webcamVideo.currentTime
    ) {
      return;
    }

    lastVideoTime = webcamVideo.currentTime;
    let detectedHands = [];
    let detectedPose = null;

    if (handLandmarker) {
      const handRes = handLandmarker.detectForVideo(webcamVideo, now);
      if (handRes && handRes.landmarks && handRes.landmarks.length > 0) {
        detectedHands = handRes.landmarks;
      }
    }

    if (holisticLandmarker) {
      try {
        const holRes = holisticLandmarker.detectForVideo(webcamVideo, now);
        if (holRes) {
          if (holRes.poseLandmarks && holRes.poseLandmarks.length > 0) {
            detectedPose = holRes.poseLandmarks[0];
          }
          if (detectedHands.length === 0) {
            if (holRes.leftHandLandmarks && holRes.leftHandLandmarks.length > 0) {
              detectedHands.push(holRes.leftHandLandmarks[0]);
            }
            if (holRes.rightHandLandmarks && holRes.rightHandLandmarks.length > 0) {
              detectedHands.push(holRes.rightHandLandmarks[0]);
            }
          }
        }
      } catch (_) {}
    }

    if (detectedHands.length > 0) {
      const rawOpenness = evaluateHandsExplosion(detectedHands);
      if (rawOpenness !== null) {
        if (!hasHandLock) {
          smoothedHandExplosion = rawOpenness;
          hasHandLock = true;
        } else {
          smoothedHandExplosion += (rawOpenness - smoothedHandExplosion) * 0.22;
        }

        // Snap cleanly to 0.0 (Assembled) when hands are closed and 1.0 (Exploded) when hands are wide open
        let mappedTarget = smoothedHandExplosion;
        if (mappedTarget < 0.08) mappedTarget = 0.0;
        else if (mappedTarget > 0.90) mappedTarget = 1.0;

        targetExplosion = mappedTarget;
        if (slider) slider.value = Math.round(targetExplosion * 100);
        updateAssemblyUI(targetExplosion);

        const pct = Math.round(targetExplosion * 100);
        if (gestureMeterFill) gestureMeterFill.style.width = `${pct}%`;

        if (targetExplosion <= 0.12) {
          if (gestureIcon) gestureIcon.textContent = '✊';
          if (gestureLabel) gestureLabel.textContent = `Hands Closed · Assemble (${pct}%)`;
        } else if (targetExplosion >= 0.85) {
          if (gestureIcon) gestureIcon.textContent = '🖐️';
          if (gestureLabel) gestureLabel.textContent = `Hands Open · Exploded (${pct}%)`;
        } else {
          if (gestureIcon) gestureIcon.textContent = '🙌';
          if (gestureLabel) gestureLabel.textContent = `Hand Opening · ${pct}% Exploded`;
        }

        drawHandLandmarks(detectedHands, detectedPose, targetExplosion);
      }
    } else {
      hasHandLock = false;
      drawHandLandmarks([], detectedPose, targetExplosion);
      if (webcamVideo.srcObject && gestureLabel) {
        gestureLabel.textContent = 'Raise Hand: ✊ Assemble · 🖐️ Explode';
      }
    }
  }

  initMediaPipeControl();

  // --- Animation Render Loop ---
  function animate(now) {
    requestAnimationFrame(animate);

    processMediaPipeFrame(now || performance.now());

    const lerpFactor = 0.1;
    currentExplosion += (targetExplosion - currentExplosion) * lerpFactor;
    if (Math.abs(currentExplosion - targetExplosion) < 0.001) {
      currentExplosion = targetExplosion;
    }

    updateExplosionPositions(currentExplosion);
    updatePinsProjection();

    if (isAutoOrbit) {
      scene.rotation.y += 0.0028;
    }

    if (waterMesh) {
      waterMesh.position.y = -0.35 + Math.sin(Date.now() * 0.0015) * 0.05;
    }

    controls.update();
    renderer.render(scene, camera);
  }
})();
