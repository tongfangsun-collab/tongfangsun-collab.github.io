/**
 * Architecture 3D Motion — Sydney Opera House
 * Interactive 3D Deconstruction & Exploded View Engine
 * Powered by Three.js & OrbitControls
 */

(function () {
  'use strict';

  // --- Global State ---
  let scene, camera, renderer, controls;
  let layerGroups = []; // Array of { id, group, basePos, explodedPos, boundingBox, meshList }
  let loadPathLinesGroup;
  let waterMesh, waterMaterial;
  let skyDome, citySilhouettes;
  let raycaster, mouse;
  let hoveredLayerId = null;
  let selectedLayerId = null;

  // Animation & Motion State
  let currentExplosion = 0.0; // 0.0 = fully assembled, 1.0 = fully exploded
  let targetExplosion = 0.0;
  let isXRayMode = false;
  let isAutoOrbit = false;
  let cameraTargetPos = new THREE.Vector3(0, 3, 0);

  // DOM Elements
  let canvas, statusBadge, slider, sliderValue, drawer, drawerOverlay;
  let pinsContainer;
  let pinElements = {};

  // Tile Procedural Texture Cache
  let tileTexture;

  // --- Initialization ---
  window.addEventListener('DOMContentLoaded', init);

  function init() {
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
    buildOperaHouseLayers();
    setupEventListeners();
    setupPinsUI();

    // Start with fully assembled view
    updateAssemblyUI(0.0);

    // Initial render & animation loop
    animate();

    // Trigger subtle entrance hint
    setTimeout(() => {
      // Gentle bounce hint
      targetExplosion = 0.35;
      setTimeout(() => { targetExplosion = 0.0; }, 1200);
    }, 800);
  }

  // --- Three.js Setup ---
  function initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.012);

    camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 600);
    // Classic architectural axonometric vantage point
    camera.position.set(34, 26, 38);

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
    renderer.toneMappingExposure = 1.15;

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 3.5, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below ground
    controls.minDistance = 12;
    controls.maxDistance = 120;
    controls.enablePan = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x111622, 0.6);
    scene.add(hemiLight);

    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xfff7ea, 1.4);
    sunLight.position.set(45, 55, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    const d = 35;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x76a5d8, 0.5);
    fillLight.position.set(-35, 30, -35);
    scene.add(fillLight);

    // Subtle Under Stage Rim Light
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    rimLight.position.set(0, -10, 20);
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

    // Base off-white ceramic tone
    ctx.fillStyle = '#f5f4ef';
    ctx.fillRect(0, 0, size, size);

    // Chevron tile bands
    const rows = 32;
    const cols = 32;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isGloss = (r + c) % 2 === 0;
        ctx.fillStyle = isGloss ? '#fbfaf6' : '#edebe2';
        ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

        // Subtle tile seam / grout line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
      }
    }

    tileTexture = new THREE.CanvasTexture(canvasTex);
    tileTexture.wrapS = THREE.RepeatWrapping;
    tileTexture.wrapT = THREE.RepeatWrapping;
    tileTexture.repeat.set(4, 4);
  }

  // --- Build Environment (Harbour water, Skyline & Bennelong Promontory) ---
  function buildEnvironment() {
    // 1. Shimmering Sydney Harbour Water Plane
    const waterGeo = new THREE.PlaneGeometry(240, 240, 64, 64);
    waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f2c42,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.95
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -2.2;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // 2. Distant Sydney Skyline Silhouette (South-West)
    citySilhouettes = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      roughness: 0.85,
      metalness: 0.1
    });

    const bldgHeights = [18, 28, 38, 22, 32, 45, 26, 34, 20, 29];
    for (let i = 0; i < 20; i++) {
      const h = bldgHeights[i % bldgHeights.length] * (0.8 + Math.random() * 0.4);
      const w = 4 + Math.random() * 5;
      const bGeo = new THREE.BoxGeometry(w, h, w);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(-60 - (i % 5) * 8, h / 2 - 2, -40 + Math.floor(i / 5) * 14);
      citySilhouettes.add(bMesh);
    }
    scene.add(citySilhouettes);

    // 3. Sydney Green & Gold Ferry floating in the Harbour
    const ferryGroup = new THREE.Group();
    const ferryHullMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.3 }); // Green
    const ferryCabinMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.4 }); // Gold / Cream
    const hullGeo = new THREE.BoxGeometry(9, 1.4, 3.2);
    const hull = new THREE.Mesh(hullGeo, ferryHullMat);
    hull.position.y = 0.5;
    ferryGroup.add(hull);

    const cabinGeo = new THREE.BoxGeometry(6, 1.2, 2.4);
    const cabin = new THREE.Mesh(cabinGeo, ferryCabinMat);
    cabin.position.y = 1.7;
    ferryGroup.add(cabin);

    ferryGroup.position.set(28, -2.1, 24);
    ferryGroup.rotation.y = -Math.PI / 4;
    scene.add(ferryGroup);
  }

  // --- Dynamic Connecting Load Path Lines ---
  function buildLoadPathLines() {
    loadPathLinesGroup = new THREE.Group();

    // 12 vertical load lines connecting podium pedestals to shell apexes
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00e5ff,
      linewidth: 2,
      scale: 1,
      dashSize: 0.5,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.0
    });

    const anchorPoints = [
      // Concert Hall spine
      { x: 3.5, z: 2.0, maxH: 26 },
      { x: 3.5, z: -2.0, maxH: 24 },
      { x: 3.5, z: -6.0, maxH: 20 },
      { x: 3.5, z: -9.5, maxH: 15 },
      // Joan Sutherland Theatre spine
      { x: -3.5, z: 2.0, maxH: 24 },
      { x: -3.5, z: -2.0, maxH: 22 },
      { x: -3.5, z: -6.0, maxH: 18 },
      { x: -3.5, z: -9.5, maxH: 14 },
      // Podium monumental corners
      { x: 8.0, z: -14.0, maxH: 12 },
      { x: -8.0, z: -14.0, maxH: 12 },
      { x: 7.5, z: 12.0, maxH: 14 },
      { x: -7.5, z: 12.0, maxH: 14 }
    ];

    anchorPoints.forEach(pt => {
      const points = [
        new THREE.Vector3(pt.x, -1.8, pt.z),
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
  // ARCHITECTURAL 3D LAYERS BUILDER (8 LAYERS)
  // ==========================================================================
  function buildOperaHouseLayers() {
    // Standard Materials Palette
    const materials = {
      shell: new THREE.MeshStandardMaterial({
        color: 0xfdfcf9,
        roughness: 0.35,
        metalness: 0.1,
        map: tileTexture,
        bumpMap: tileTexture,
        bumpScale: 0.04,
        side: THREE.DoubleSide
      }),
      concreteRibs: new THREE.MeshStandardMaterial({
        color: 0xd6d1c7,
        roughness: 0.7,
        metalness: 0.05
      }),
      stageDark: new THREE.MeshStandardMaterial({
        color: 0x333130,
        roughness: 0.85,
        metalness: 0.2
      }),
      stageSteel: new THREE.MeshStandardMaterial({
        color: 0x61666d,
        roughness: 0.4,
        metalness: 0.6
      }),
      auditoriumWood: new THREE.MeshStandardMaterial({
        color: 0xc89666,
        roughness: 0.55,
        metalness: 0.05
      }),
      seatingPlush: new THREE.MeshStandardMaterial({
        color: 0x8a1c38,
        roughness: 0.7,
        metalness: 0.0
      }),
      foyerFloor: new THREE.MeshStandardMaterial({
        color: 0xb5afa4,
        roughness: 0.6,
        metalness: 0.05
      }),
      glassBronze: new THREE.MeshPhysicalMaterial({
        color: 0xba8c58,
        roughness: 0.1,
        metalness: 0.15,
        transparent: true,
        opacity: 0.58,
        transmission: 0.7,
        ior: 1.52,
        side: THREE.DoubleSide
      }),
      mullionBronze: new THREE.MeshStandardMaterial({
        color: 0x5a4430,
        roughness: 0.45,
        metalness: 0.5
      }),
      podiumGranite: new THREE.MeshStandardMaterial({
        color: 0xc4b9ab,
        roughness: 0.8,
        metalness: 0.04
      }),
      siteSandstone: new THREE.MeshStandardMaterial({
        color: 0xa49887,
        roughness: 0.9,
        metalness: 0.02
      })
    };

    // Helper: Create a single Utzon spherical shell vault segment
    function createShellMesh(radius, arcAngle, widthRatio, mat) {
      // Create a quarter-spherical curved shell with thickness
      const shellGeo = new THREE.SphereGeometry(
        radius,
        32,
        24,
        0,
        Math.PI * 0.48 * widthRatio,
        0,
        Math.PI * 0.42 * arcAngle
      );

      const mesh = new THREE.Mesh(shellGeo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    // Helper: Create a paired sail roof vault
    function createSailPair(scale, heightOffset, zPos, xPos, mat) {
      const pairGroup = new THREE.Group();

      // East half
      const eastSail = createShellMesh(6.2 * scale, 1.0, 0.9, mat);
      eastSail.rotation.set(-0.35, 0.25, -0.2);
      eastSail.position.set(0.1, 0, 0);
      pairGroup.add(eastSail);

      // West half (mirrored)
      const westSail = createShellMesh(6.2 * scale, 1.0, 0.9, mat);
      westSail.scale.x = -1;
      westSail.rotation.set(-0.35, -0.25, 0.2);
      westSail.position.set(-0.1, 0, 0);
      pairGroup.add(westSail);

      // Ridge Beam Cap
      const ridgeGeo = new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 5.8 * scale, 12);
      const ridge = new THREE.Mesh(ridgeGeo, materials.concreteRibs);
      ridge.rotation.x = Math.PI / 4;
      ridge.position.set(0, 3.2 * scale, 0.8 * scale);
      pairGroup.add(ridge);

      pairGroup.position.set(xPos, heightOffset, zPos);
      return pairGroup;
    }

    // ========================================================================
    // LAYER 08: Precast Spherical Shell Roofs ("The Sails")
    // ========================================================================
    const group08 = new THREE.Group();
    group08.name = "Layer 08";

    // Concert Hall (Major Hall, East) - 4 Sail pairs
    const chSails = [
      { s: 1.25, h: 4.8, z: 3.5, x: 4.2 },  // A1 (Main sail)
      { s: 1.05, h: 4.2, z: -1.2, x: 4.2 }, // A2
      { s: 0.82, h: 3.6, z: -5.6, x: 4.2 }, // A3
      { s: 0.58, h: 3.0, z: -9.2, x: 4.2 }  // A4
    ];
    chSails.forEach(cfg => {
      group08.add(createSailPair(cfg.s, cfg.h, cfg.z, cfg.x, materials.shell));
    });

    // Joan Sutherland Theatre (Minor Hall, West) - 4 Sail pairs
    const jstSails = [
      { s: 1.10, h: 4.4, z: 3.5, x: -4.2 },
      { s: 0.92, h: 3.9, z: -1.2, x: -4.2 },
      { s: 0.72, h: 3.3, z: -5.6, x: -4.2 },
      { s: 0.52, h: 2.8, z: -9.2, x: -4.2 }
    ];
    jstSails.forEach(cfg => {
      group08.add(createSailPair(cfg.s, cfg.h, cfg.z, cfg.x, materials.shell));
    });

    // Restaurant Shell Pair (South-Central)
    group08.add(createSailPair(0.65, 2.8, -13.2, 0.0, materials.shell));

    registerLayer(8, group08, 0.0, 18.0);

    // ========================================================================
    // LAYER 07: Fan Radial Concrete Rib Arches
    // ========================================================================
    const group07 = new THREE.Group();
    group07.name = "Layer 07";

    // Helper: fan of structural rib arches
    function createRibFan(radius, count, spread, xCenter, zCenter, yBase) {
      const fanGroup = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const angle = (-spread / 2 + (spread / (count - 1)) * i);
        const ribCurve = new THREE.TorusGeometry(radius, 0.14, 8, 24, Math.PI * 0.45);
        const ribMesh = new THREE.Mesh(ribCurve, materials.concreteRibs);
        ribMesh.rotation.z = Math.PI * 0.15;
        ribMesh.rotation.y = angle;
        ribMesh.position.set(0, 0, 0);
        fanGroup.add(ribMesh);
      }
      fanGroup.position.set(xCenter, yBase, zCenter);
      return fanGroup;
    }

    // Concrete ribs beneath Concert Hall shells
    group07.add(createRibFan(5.6, 9, 0.7, 4.2, 3.5, 3.2));
    group07.add(createRibFan(4.8, 7, 0.6, 4.2, -1.2, 2.8));
    group07.add(createRibFan(3.8, 6, 0.5, 4.2, -5.6, 2.4));

    // Concrete ribs beneath Opera Theatre shells
    group07.add(createRibFan(5.0, 8, 0.7, -4.2, 3.5, 3.0));
    group07.add(createRibFan(4.2, 6, 0.6, -4.2, -1.2, 2.6));
    group07.add(createRibFan(3.4, 5, 0.5, -4.2, -5.6, 2.2));

    registerLayer(7, group07, 0.0, 13.5);

    // ========================================================================
    // LAYER 06: Performance Stages & Fly Tower Machinery
    // ========================================================================
    const group06 = new THREE.Group();
    group06.name = "Layer 06";

    // Concert Hall Stage Box & Acoustic Reflectors
    const chStageGeo = new THREE.BoxGeometry(6.4, 2.2, 5.4);
    const chStage = new THREE.Mesh(chStageGeo, materials.stageDark);
    chStage.position.set(4.2, 2.2, 0.5);
    group06.add(chStage);

    // Fly Tower Framing & Catwalk Trusses
    const trussGeo = new THREE.BoxGeometry(5.8, 3.5, 3.6);
    const trussMesh = new THREE.Mesh(
      trussGeo,
      new THREE.MeshStandardMaterial({ color: 0x4a4f56, wireframe: true })
    );
    trussMesh.position.set(4.2, 4.2, 1.2);
    group06.add(trussMesh);

    // Opera Theatre Stage Box (Joan Sutherland Theatre)
    const jstStageGeo = new THREE.BoxGeometry(5.6, 2.0, 4.8);
    const jstStage = new THREE.Mesh(jstStageGeo, materials.stageDark);
    jstStage.position.set(-4.2, 2.0, 0.5);
    group06.add(jstStage);

    const jstTrussGeo = new THREE.BoxGeometry(5.0, 3.2, 3.2);
    const jstTruss = new THREE.Mesh(
      jstTrussGeo,
      new THREE.MeshStandardMaterial({ color: 0x4a4f56, wireframe: true })
    );
    jstTruss.position.set(-4.2, 3.8, 1.2);
    group06.add(jstTruss);

    // Stage Proscenium acoustic arch portals
    const portalMat = new THREE.MeshStandardMaterial({ color: 0x8a623a, roughness: 0.5 });
    const portalGeo = new THREE.TorusGeometry(2.4, 0.18, 8, 16, Math.PI);
    const chPortal = new THREE.Mesh(portalGeo, portalMat);
    chPortal.position.set(4.2, 2.2, -1.8);
    group06.add(chPortal);

    const jstPortal = new THREE.Mesh(portalGeo.clone(), portalMat);
    jstPortal.scale.set(0.85, 0.85, 0.85);
    jstPortal.position.set(-4.2, 2.0, -1.6);
    group06.add(jstPortal);

    registerLayer(6, group06, 0.0, 9.8);

    // ========================================================================
    // LAYER 05: Concert Hall & Opera Auditoriums (Seating Tiers)
    // ========================================================================
    const group05 = new THREE.Group();
    group05.name = "Layer 05";

    // Helper: stepped fan seating amphitheater
    function createAuditoriumTiers(width, depth, tiersCount, xPos, zPos) {
      const audGroup = new THREE.Group();

      for (let t = 0; t < tiersCount; t++) {
        const stepH = 0.22;
        const radius = 2.0 + t * 0.45;
        const arc = Math.PI * 0.75;
        const tierGeo = new THREE.CylinderGeometry(
          radius,
          radius + 0.35,
          stepH,
          16,
          1,
          false,
          -arc / 2,
          arc
        );

        // Timber tier riser
        const tierMesh = new THREE.Mesh(tierGeo, materials.auditoriumWood);
        tierMesh.position.set(0, t * stepH, 0);
        audGroup.add(tierMesh);

        // Crimson plush seat cushion row
        const seatRowGeo = new THREE.CylinderGeometry(
          radius - 0.08,
          radius + 0.22,
          0.12,
          16,
          1,
          false,
          -arc / 2 + 0.1,
          arc - 0.2
        );
        const seatMesh = new THREE.Mesh(seatRowGeo, materials.seatingPlush);
        seatMesh.position.set(0, t * stepH + 0.14, 0);
        audGroup.add(seatMesh);
      }

      audGroup.position.set(xPos, 1.4, zPos);
      return audGroup;
    }

    // Concert Hall Seating (Major Hall)
    group05.add(createAuditoriumTiers(6.0, 7.0, 7, 4.2, -5.2));

    // Opera Theatre Seating (Minor Hall)
    group05.add(createAuditoriumTiers(5.2, 6.0, 6, -4.2, -5.0));

    registerLayer(5, group05, 0.0, 6.8);

    // ========================================================================
    // LAYER 04: Grand Foyers & Public Concourse Spine
    // ========================================================================
    const group04 = new THREE.Group();
    group04.name = "Layer 04";

    // Northern Harbour Viewing Foyer Lounge (Cantilevered over water)
    const northFoyerGeo = new THREE.BoxGeometry(16.5, 0.45, 6.0);
    const northFoyer = new THREE.Mesh(northFoyerGeo, materials.foyerFloor);
    northFoyer.position.set(0, 1.2, 7.8);
    group04.add(northFoyer);

    // Central Public Circulation Spine & Ticketing Hall
    const concourseSpineGeo = new THREE.BoxGeometry(15.0, 0.45, 16.0);
    const concourseSpine = new THREE.Mesh(concourseSpineGeo, materials.foyerFloor);
    concourseSpine.position.set(0, 1.0, -3.0);
    group04.add(concourseSpine);

    // Southern Entrance Grand Promenade Deck
    const southFoyerGeo = new THREE.BoxGeometry(17.5, 0.5, 7.0);
    const southFoyer = new THREE.Mesh(southFoyerGeo, materials.foyerFloor);
    southFoyer.position.set(0, 0.8, -13.5);
    group04.add(southFoyer);

    // Internal concrete circulation stairwells
    const stairGeo = new THREE.BoxGeometry(2.0, 0.8, 3.5);
    const stairL = new THREE.Mesh(stairGeo, materials.podiumGranite);
    stairL.position.set(-6.5, 0.6, 2.0);
    group04.add(stairL);

    const stairR = new THREE.Mesh(stairGeo, materials.podiumGranite);
    stairR.position.set(6.5, 0.6, 2.0);
    group04.add(stairR);

    registerLayer(4, group04, 0.0, 4.2);

    // ========================================================================
    // LAYER 03: Bronze-Tinted Structural Glass Curtain Walls
    // ========================================================================
    const group03 = new THREE.Group();
    group03.name = "Layer 03";

    // Northern glass wall facing Sydney Harbour (Major Hall)
    const glassCHGeo = new THREE.CylinderGeometry(
      3.8,
      4.6,
      5.2,
      12,
      1,
      true,
      -Math.PI * 0.4,
      Math.PI * 0.8
    );
    const glassCH = new THREE.Mesh(glassCHGeo, materials.glassBronze);
    glassCH.position.set(4.2, 3.2, 5.8);
    glassCH.rotation.y = Math.PI;
    group03.add(glassCH);

    // Northern glass wall (Minor Hall)
    const glassJSTGeo = new THREE.CylinderGeometry(
      3.2,
      4.0,
      4.6,
      12,
      1,
      true,
      -Math.PI * 0.4,
      Math.PI * 0.8
    );
    const glassJST = new THREE.Mesh(glassJSTGeo, materials.glassBronze);
    glassJST.position.set(-4.2, 2.9, 5.8);
    glassJST.rotation.y = Math.PI;
    group03.add(glassJST);

    // Southern mouth glazing panels
    const glassSouthGeo = new THREE.PlaneGeometry(6.2, 3.5);
    const glassSouth = new THREE.Mesh(glassSouthGeo, materials.glassBronze);
    glassSouth.position.set(0, 2.6, -15.8);
    group03.add(glassSouth);

    // Bronze Mullion Framing Bars
    for (let m = -3; m <= 3; m++) {
      const mulGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.0, 6);
      const mulMesh = new THREE.Mesh(mulGeo, materials.mullionBronze);
      mulMesh.position.set(4.2 + m * 0.8, 3.2, 6.2);
      group03.add(mulMesh);

      const mulMesh2 = new THREE.Mesh(mulGeo, materials.mullionBronze);
      mulMesh2.position.set(-4.2 + m * 0.7, 2.9, 6.2);
      group03.add(mulMesh2);
    }

    registerLayer(3, group03, 0.0, 2.2);

    // ========================================================================
    // LAYER 02: Monumental Stepped Concrete Podium
    // ========================================================================
    const group02 = new THREE.Group();
    group02.name = "Layer 02";

    // Main Podium Upper Terrace Slab
    const upperPodiumGeo = new THREE.BoxGeometry(20.0, 1.2, 32.0);
    const upperPodium = new THREE.Mesh(upperPodiumGeo, materials.podiumGranite);
    upperPodium.position.set(0, 0.0, 0.0);
    upperPodium.castShadow = true;
    upperPodium.receiveShadow = true;
    group02.add(upperPodium);

    // Monumental Southern Grand Entrance Stairs (100m wide inspiration)
    const stepsCount = 10;
    for (let s = 0; s < stepsCount; s++) {
      const stepW = 19.5 - s * 0.2;
      const stepD = 1.0;
      const stepH = 0.12;
      const stepGeo = new THREE.BoxGeometry(stepW, stepH, stepD);
      const stepMesh = new THREE.Mesh(stepGeo, materials.podiumGranite);
      stepMesh.position.set(0, -0.6 - s * stepH, -16.0 - s * stepD * 0.85);
      stepMesh.receiveShadow = true;
      group02.add(stepMesh);
    }

    // Lower Substructure Retention Wall & Undercroft Cutout
    const subGeo = new THREE.BoxGeometry(21.5, 1.2, 34.0);
    const subMesh = new THREE.Mesh(subGeo, materials.podiumGranite);
    subMesh.position.set(0, -1.0, 0.0);
    subMesh.receiveShadow = true;
    group02.add(subMesh);

    // Foundation support pedestals for shell arches (anchoring points)
    const pedestalGeo = new THREE.BoxGeometry(1.6, 0.8, 1.8);
    [
      { x: 5.5, z: 2.8 }, { x: 5.5, z: -2.0 }, { x: 5.5, z: -6.5 },
      { x: -5.5, z: 2.8 }, { x: -5.5, z: -2.0 }, { x: -5.5, z: -6.5 }
    ].forEach(p => {
      const ped = new THREE.Mesh(pedestalGeo, materials.podiumGranite);
      ped.position.set(p.x, 0.8, p.z);
      ped.castShadow = true;
      group02.add(ped);
    });

    registerLayer(2, group02, 0.0, 0.0);

    // ========================================================================
    // LAYER 01: Bennelong Point & Sydney Harbour Waterfront Context
    // ========================================================================
    const group01 = new THREE.Group();
    group01.name = "Layer 01";

    // Sandstone Peninsula Plateau (Bennelong Point)
    const promontoryGeo = new THREE.BoxGeometry(26.0, 1.0, 42.0);
    const promontory = new THREE.Mesh(promontoryGeo, materials.siteSandstone);
    promontory.position.set(0, -1.8, -2.0);
    promontory.receiveShadow = true;
    group01.add(promontory);

    // Curved Granite Sea Wall Perimeter & Promenade
    const seaWallGeo = new THREE.BoxGeometry(28.0, 0.8, 44.0);
    const seaWall = new THREE.Mesh(seaWallGeo, materials.siteSandstone);
    seaWall.position.set(0, -2.1, -2.0);
    group01.add(seaWall);

    // Promenade Waterfront Railing & Boardwalk Edge
    const boardwalkGeo = new THREE.BoxGeometry(26.4, 0.1, 42.4);
    const boardwalkMat = new THREE.MeshStandardMaterial({ color: 0x8a7b68, roughness: 0.8 });
    const boardwalk = new THREE.Mesh(boardwalkGeo, boardwalkMat);
    boardwalk.position.set(0, -1.25, -2.0);
    group01.add(boardwalk);

    // 588 Foundation Piers reaching bedrock (visualized underwater)
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x3d4349, roughness: 0.9 });
    for (let px = -10; px <= 10; px += 5) {
      for (let pz = -16; pz <= 16; pz += 6) {
        const pierGeo = new THREE.CylinderGeometry(0.35, 0.35, 4.0, 8);
        const pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(px, -3.8, pz);
        group01.add(pier);
      }
    }

    registerLayer(1, group01, 0.0, -1.8);
  }

  // Register a layer into tracking list
  function registerLayer(id, group, basePosY, explodedPosY) {
    scene.add(group);

    // Store all meshes for raycasting & material highlighting
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
      // Smooth vertical separation along Y axis with staggered ease
      const currentY = THREE.MathUtils.lerp(item.basePosY, item.explodedPosY, progress);
      item.group.position.y = currentY;

      // Slight axonometric offset on Z for upper layers when exploded
      if (item.id >= 6) {
        item.group.position.z = (item.id - 5) * 0.4 * progress;
      } else {
        item.group.position.z = 0;
      }
    });

    // Animate connecting structural load lines
    if (loadPathLinesGroup) {
      loadPathLinesGroup.children.forEach(line => {
        line.material.opacity = Math.min(1.0, progress * 1.5);
      });
    }

    // Water & environment reactivity:
    // When assembled (progress = 0), water has high specular reflection and vibrant deep blue.
    // When exploded (progress > 0), water subtly dims to keep visual focus on the separated architectural components.
    if (waterMaterial) {
      waterMaterial.opacity = 0.95 - progress * 0.35;
      waterMaterial.roughness = 0.12 + progress * 0.2;
    }
  }

  // Update 2D Screen Positions for Floating 3D Pins
  function updatePinsProjection() {
    if (!camera || !pinsContainer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isExploded = currentExplosion > 0.08;

    layerGroups.forEach(item => {
      const pin = pinElements[item.id];
      if (!pin) return;

      // When fully assembled, hide individual pins to avoid clutter
      if (!isExploded) {
        pin.style.opacity = '0';
        pin.style.pointerEvents = 'none';
        return;
      }

      // Compute world position for pin (slightly to the right of the layer)
      const pinPos = new THREE.Vector3(12.5, item.group.position.y + 0.5, item.group.position.z);
      pinPos.project(camera);

      // Check if behind camera
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
    // 1. Mouse Wheel Scroll Interaction
    // User request:
    // "假设我滚动鼠标上的滚珠，往上是拆解整个建筑，点击每个被拆解的部分有解释说明，向下滑是把拆解的部分完全拼成一个整体，最后还原建筑本身和周围环境的样貌"
    window.addEventListener('wheel', onWindowScroll, { passive: false });

    function onWindowScroll(e) {
      // If user is scrolling inside the open inspection drawer or modal, don't intercept 3D explosion
      if (e.target.closest('.drawer-content') || e.target.closest('.modal-body')) {
        return;
      }

      e.preventDefault();

      // Normalize delta across browsers and touchpads
      const delta = e.deltaY;
      const sensitivity = 0.0018;

      // Scrolling UP (deltaY < 0): Explode architecture!
      // Scrolling DOWN (deltaY > 0): Assemble architecture!
      if (delta < 0) {
        targetExplosion = Math.min(1.0, targetExplosion + Math.abs(delta) * sensitivity);
      } else if (delta > 0) {
        targetExplosion = Math.max(0.0, targetExplosion - Math.abs(delta) * sensitivity);
      }

      // Sync slider with target
      if (slider) {
        slider.value = Math.round(targetExplosion * 100);
      }
      updateAssemblyUI(targetExplosion);
    }

    // 2. Touch gestures for mobile/tablet (Swipe up to explode, swipe down to assemble)
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.target.closest('.drawer-content') || e.target.closest('.modal-body')) return;
      const touchY = e.touches[0].clientY;
      const diffY = touchStartY - touchY; // positive = dragged up

      // Swipe UP: Explode; Swipe DOWN: Assemble
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
      btn.addEventListener('click', (e) => {
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

    // Window Resize
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
        statusBadge.innerHTML = '<span class="indicator-dot"></span> Assembled Building';
      } else if (progress > 0.9) {
        statusBadge.className = 'status-badge';
        statusBadge.innerHTML = '<span class="indicator-dot"></span> Exploded View (100%)';
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

    // Collect all layer meshes
    const allMeshes = [];
    layerGroups.forEach(lg => allMeshes.push(...lg.meshes));

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
    layerGroups.forEach(lg => allMeshes.push(...lg.meshes));

    const intersects = raycaster.intersectObjects(allMeshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const layerId = hit.object.userData.layerId;
      if (layerId) {
        selectLayer(layerId);
      }
    }
  }

  // Highlight layer on hover
  function highlightLayer(id) {
    if (hoveredLayerId === id) return;
    hoveredLayerId = id;

    // Highlight chip in bottom bar
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.layerId, 10) === id);
    });

    // Highlight floating pin
    Object.keys(pinElements).forEach(k => {
      pinElements[k].classList.toggle('active', parseInt(k, 10) === id);
    });
  }

  function unhighlightLayer() {
    if (!hoveredLayerId) return;
    hoveredLayerId = null;

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

    // If currently assembled, expand to exploded view so user can clearly see the layer!
    if (targetExplosion < 0.4) {
      targetExplosion = 0.85;
      if (slider) slider.value = 85;
      updateAssemblyUI(0.85);
    }

    // Highlight pins and chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.layerId, 10) === id);
    });
    Object.keys(pinElements).forEach(k => {
      pinElements[k].classList.toggle('active', parseInt(k, 10) === id);
    });

    // Populate and open drawer
    populateDrawer(layerData);
    drawer.classList.add('open');

    // Smoothly fly camera to focus on this layer
    const targetObj = layerGroups.find(lg => lg.id === id);
    if (targetObj) {
      const targetY = targetObj.group.position.y + 2.0;
      controls.target.set(0, targetY, 0);
    }
  }

  function closeDrawer() {
    selectedLayerId = null;
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

  // Populate English Technical Drawer
  function populateDrawer(data) {
    document.getElementById('drawer-layer-badge').textContent = `LAYER ${String(data.id).padStart(2, '0')} · ${data.category.toUpperCase()}`;
    document.getElementById('drawer-title').textContent = data.title;
    document.getElementById('drawer-title-zh').textContent = `${data.subTitleZh} — Jørn Utzon & Ove Arup (1959–1973)`;

    document.getElementById('drawer-meta-elevation').textContent = data.elevation;
    document.getElementById('drawer-meta-stage').textContent = data.stage;
    document.getElementById('drawer-meta-category').textContent = data.category;
    document.getElementById('drawer-meta-weight').textContent = "Precast Reinforced System";

    document.getElementById('drawer-lead').textContent = data.leadSummary;
    document.getElementById('drawer-concept').textContent = data.concept;
    document.getElementById('drawer-engineering').textContent = data.engineering;

    // Materials list
    const matList = document.getElementById('drawer-materials-list');
    matList.innerHTML = '';
    data.materials.forEach(m => {
      const li = document.createElement('li');
      li.textContent = m;
      matList.appendChild(li);
    });

    // Load transmission
    document.getElementById('drawer-load-desc').textContent = data.loadTransmission;

    // Image & Diagram
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
          m.material.opacity = isXRayMode ? 0.28 : 1.0;
          m.material.wireframe = isXRayMode;
        }
      });
    }
  }

  function toggleAutoOrbit() {
    isAutoOrbit = !isAutoOrbit;
    const btn = document.getElementById('btn-auto-orbit');
    if (btn) btn.classList.toggle('active', isAutoOrbit);
  }

  function setCameraPreset(preset) {
    if (!controls || !camera) return;

    if (preset === 'axo') {
      // Classic 45-degree isometric axonometric view
      camera.position.set(34, 26, 38);
      controls.target.set(0, 3.5, 0);
    } else if (preset === 'front') {
      // Direct northern waterfront perspective facing the harbour
      camera.position.set(0, 8, 48);
      controls.target.set(0, 4.0, 0);
    } else if (preset === 'elevation') {
      // Longitudinal side cutaway elevation view (East)
      camera.position.set(50, 6, 0);
      controls.target.set(0, 3.5, 0);
    } else if (preset === 'top') {
      // Bird's eye plan view looking down
      camera.position.set(0.1, 62, 0.1);
      controls.target.set(0, 0, 0);
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

  // --- Animation Render Loop ---
  function animate() {
    requestAnimationFrame(animate);

    // Smooth Lerp for explosion animation (physics-like feel)
    const lerpFactor = 0.1;
    currentExplosion += (targetExplosion - currentExplosion) * lerpFactor;
    if (Math.abs(currentExplosion - targetExplosion) < 0.001) {
      currentExplosion = targetExplosion;
    }

    updateExplosionPositions(currentExplosion);
    updatePinsProjection();

    // Gentle Auto-Orbit turntable
    if (isAutoOrbit) {
      scene.rotation.y += 0.003;
    }

    // Subtle water ripples animation
    if (waterMesh) {
      waterMesh.position.y = -2.2 + Math.sin(Date.now() * 0.0015) * 0.06;
    }

    controls.update();
    renderer.render(scene, camera);
  }
})();
