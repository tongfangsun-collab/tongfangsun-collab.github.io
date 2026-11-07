import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// =========================================================================
// 1. Pokémon Configuration & Image Preloading
// =========================================================================
const POKEMON_CONFIG = {
  pikachu: {
    name: "Pikachu",
    src: "图1.jpg",
    glow: "rgba(250, 204, 21, 0.30)",
    paperFront: "#facc15",
    paperBack: "#eab308",
    paperAccent: "#fef08a"
  },
  eevee: {
    name: "Eevee",
    src: "图3.jpg",
    glow: "rgba(217, 119, 6, 0.32)",
    paperFront: "#c87d3b",
    paperBack: "#9a5822",
    paperAccent: "#fef3c7"
  },
  raichu: {
    name: "Raichu",
    src: "图2.jpg",
    glow: "rgba(251, 146, 60, 0.34)",
    paperFront: "#f97316",
    paperBack: "#d9530f",
    paperAccent: "#fde047"
  }
};

const loadedImages = {};
Object.entries(POKEMON_CONFIG).forEach(([key, cfg]) => {
  const img = new Image();
  img.src = cfg.src;
  loadedImages[key] = img;
});

// DOM References
const video = document.getElementById("webcam");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const toggleHudBtn = document.getElementById("toggleHudBtn");
const origamiStage = document.getElementById("origamiStage");
const origamiViewport = document.getElementById("origamiViewport");
const canvas = document.getElementById("origami_canvas");
const ctx = canvas.getContext("2d");
const gesturePills = document.querySelectorAll(".gesture-pill");
const zoomPill = document.getElementById("zoomPill");
const zoomLabel = document.getElementById("zoomLabel");

// Toggle pure mode
toggleHudBtn.addEventListener("click", () => {
  const isPure = document.body.classList.toggle("pure-mode");
  toggleHudBtn.textContent = isPure ? "Show Legend" : "Hide Legend";
});
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h") toggleHudBtn.click();
});

// =========================================================================
// 2. Watertight Shared-Vertex Origami Crease Pattern Mesh
// =========================================================================
const BASE_VERTICES = [
  // 0: Center
  { u: 0.50, v: 0.50, ring: 0 },
  // 1..8: Inner Ring (I0..I7)
  { u: 0.50, v: 0.30, ring: 1, sector: 0 },
  { u: 0.66, v: 0.34, ring: 1, sector: 1 },
  { u: 0.70, v: 0.50, ring: 1, sector: 2 },
  { u: 0.66, v: 0.66, ring: 1, sector: 3 },
  { u: 0.50, v: 0.70, ring: 1, sector: 4 },
  { u: 0.34, v: 0.66, ring: 1, sector: 5 },
  { u: 0.30, v: 0.50, ring: 1, sector: 6 },
  { u: 0.34, v: 0.34, ring: 1, sector: 7 },
  // 9..16: Middle Ring (M0..M7)
  { u: 0.50, v: 0.14, ring: 2, sector: 0 },
  { u: 0.78, v: 0.20, ring: 2, sector: 1 },
  { u: 0.86, v: 0.50, ring: 2, sector: 2 },
  { u: 0.78, v: 0.80, ring: 2, sector: 3 },
  { u: 0.50, v: 0.86, ring: 2, sector: 4 },
  { u: 0.22, v: 0.80, ring: 2, sector: 5 },
  { u: 0.14, v: 0.50, ring: 2, sector: 6 },
  { u: 0.22, v: 0.20, ring: 2, sector: 7 },
  // 17..24: Outer Sheet Boundary (O0..O7)
  { u: 0.50, v: 0.00, ring: 3, sector: 0, isEdge: true },   // 17: Top Edge
  { u: 1.00, v: 0.00, ring: 3, sector: 1, isCorner: true }, // 18: Top-Right Corner
  { u: 1.00, v: 0.50, ring: 3, sector: 2, isEdge: true },   // 19: Right Edge
  { u: 1.00, v: 1.00, ring: 3, sector: 3, isCorner: true }, // 20: Bottom-Right Corner
  { u: 0.50, v: 1.00, ring: 3, sector: 4, isEdge: true },   // 21: Bottom Edge
  { u: 0.00, v: 1.00, ring: 3, sector: 5, isCorner: true }, // 22: Bottom-Left Corner
  { u: 0.00, v: 0.50, ring: 3, sector: 6, isEdge: true },   // 23: Left Edge
  { u: 0.00, v: 0.00, ring: 3, sector: 7, isCorner: true }  // 24: Top-Left Corner
];

const TRIANGLES = [];
for (let s = 0; s < 8; s++) {
  const nextS = (s + 1) % 8;
  const i0 = 1 + s;
  const i1 = 1 + nextS;
  const m0 = 9 + s;
  const m1 = 9 + nextS;
  const o0 = 17 + s;
  const o1 = 17 + nextS;

  TRIANGLES.push({ indices: [0, i0, i1], ring: 0, sector: s });
  TRIANGLES.push({ indices: [i0, m0, i1], ring: 1, sector: s });
  TRIANGLES.push({ indices: [i1, m0, m1], ring: 1, sector: s });

  if (s % 2 === 0) {
    TRIANGLES.push({ indices: [m0, o0, m1], ring: 2, sector: s, isEdgeFlap: true });
    TRIANGLES.push({ indices: [m1, o0, o1], ring: 3, sector: s, isCornerFlap: true });
  } else {
    TRIANGLES.push({ indices: [m0, o0, o1], ring: 3, sector: s, isCornerFlap: true });
    TRIANGLES.push({ indices: [m0, o1, m1], ring: 2, sector: s, isEdgeFlap: true });
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function foldVertexAroundCrease(P, A, B, theta) {
  const abx = B.x - A.x;
  const aby = B.y - A.y;
  const lenSq = abx * abx + aby * aby || 1;
  const apx = P.x - A.x;
  const apy = P.y - A.y;
  const proj = (apx * abx + apy * aby) / lenSq;
  const hx = A.x + proj * abx;
  const hy = A.y + proj * aby;
  const vx = P.x - hx;
  const vy = P.y - hy;
  const dist = Math.hypot(vx, vy);

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  return {
    x: hx + vx * cosT,
    y: hy + vy * cosT - dist * sinT * 0.15,
    z: dist * sinT,
    foldedOver: cosT < 0,
    lift: sinT
  };
}

function drawTexturedTriangle(ctx, img, s0, s1, s2, d0, d1, d2, alpha = 1) {
  if (!img || !img.complete || img.naturalWidth === 0 || alpha <= 0.01) return;

  const cx = (d0.x + d1.x + d2.x) / 3;
  const cy = (d0.y + d1.y + d2.y) / 3;
  const expand = (p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const l = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / l) * 0.75, y: p.y + (dy / l) * 0.75 };
  };
  const e0 = expand(d0);
  const e1 = expand(d1);
  const e2 = expand(d2);

  const dsx1 = s1.x - s0.x;
  const dsy1 = s1.y - s0.y;
  const dsx2 = s2.x - s0.x;
  const dsy2 = s2.y - s0.y;
  const det = dsx1 * dsy2 - dsx2 * dsy1;
  if (Math.abs(det) < 1e-4) return;

  const ddx1 = d1.x - d0.x;
  const ddy1 = d1.y - d0.y;
  const ddx2 = d2.x - d0.x;
  const ddy2 = d2.y - d0.y;

  const a = (ddx1 * dsy2 - ddx2 * dsy1) / det;
  const b = (ddy1 * dsy2 - ddy2 * dsy1) / det;
  const c = (dsx1 * ddx2 - dsx2 * ddx1) / det;
  const d = (dsx1 * ddy2 - dsx2 * ddy1) / det;
  const e = d0.x - a * s0.x - c * s0.y;
  const f = d0.y - b * s0.x - d * s0.y;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(e0.x, e0.y);
  ctx.lineTo(e1.x, e1.y);
  ctx.lineTo(e2.x, e2.y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

let viewW = 470;
let viewH = 590;
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  viewW = origamiViewport.clientWidth || 470;
  viewH = origamiViewport.clientHeight || 590;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =========================================================================
// 3. Multi-Stage Origami Unfold & Step-by-Step Fold Engine
// =========================================================================
let currentPokemon = "pikachu";
let fromPokemon = "pikachu";
let toPokemon = "pikachu";
let isAnimating = false;
let animStartTime = 0;
const ANIM_DURATION = 1950;
let queuedPokemon = null;

function morphTo(targetKey) {
  if (!POKEMON_CONFIG[targetKey]) return;
  if (!isAnimating && targetKey === currentPokemon) return;

  if (isAnimating) {
    queuedPokemon = targetKey;
    return;
  }

  fromPokemon = currentPokemon;
  toPokemon = targetKey;
  currentPokemon = targetKey;
  isAnimating = true;
  animStartTime = performance.now();

  const targetCfg = POKEMON_CONFIG[targetKey];
  origamiStage.style.setProperty("--stage-glow", targetCfg.glow);

  gesturePills.forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.pokemon === targetKey);
  });
}

gesturePills.forEach((pill) => {
  pill.addEventListener("click", () => morphTo(pill.dataset.pokemon));
});

function renderOrigamiFrame(now) {
  ctx.clearRect(0, 0, viewW, viewH);

  if (!isAnimating) {
    const img = loadedImages[currentPokemon];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, viewW, viewH);
    }
    return;
  }

  const elapsed = now - animStartTime;
  const rawT = clamp(elapsed / ANIM_DURATION, 0, 1);

  const fromCfg = POKEMON_CONFIG[fromPokemon];
  const toCfg = POKEMON_CONFIG[toPokemon];
  const fromImg = loadedImages[fromPokemon];
  const toImg = loadedImages[toPokemon];

  ctx.fillStyle = "#16110c";
  ctx.fillRect(0, 0, viewW, viewH);

  const isUnfoldingPhase = rawT < 0.46;
  const activeImg = isUnfoldingPhase ? fromImg : toImg;

  const colorMix = easeInOutCubic(clamp((rawT - 0.36) / 0.22, 0, 1));
  const paperFrontColor = lerpColor(fromCfg.paperFront, toCfg.paperFront, colorMix);
  const paperBackColor = lerpColor(fromCfg.paperBack, toCfg.paperBack, colorMix);
  const paperAccentColor = lerpColor(fromCfg.paperAccent, toCfg.paperAccent, colorMix);

  let photoAlpha = 1;
  if (rawT < 0.38) {
    photoAlpha = 1 - easeInOutCubic(clamp((rawT - 0.04) / 0.32, 0, 1)) * 0.90;
  } else if (rawT < 0.62) {
    photoAlpha = 0.10;
  } else {
    photoAlpha = 0.10 + easeInOutCubic(clamp((rawT - 0.62) / 0.34, 0, 1)) * 0.90;
  }

  let creaseAlpha = 0;
  if (rawT < 0.12) {
    creaseAlpha = easeInOutCubic(rawT / 0.12);
  } else if (rawT < 0.88) {
    creaseAlpha = 1;
  } else {
    creaseAlpha = 1 - easeInOutCubic((rawT - 0.88) / 0.12);
  }

  const sheetEnvelope = Math.sin(rawT * Math.PI);
  const margin = sheetEnvelope * 28;
  const sheetW = viewW - margin * 2;
  const sheetH = viewH - margin * 2;

  const pts = BASE_VERTICES.map((v) => ({
    x: margin + v.u * sheetW,
    y: margin + v.v * sheetH,
    z: 0,
    foldedOver: false,
    lift: 0
  }));

  let cornerAngles = [0, 0, 0, 0];
  let edgeAngles = [0, 0, 0, 0];
  let midPinch = 0;

  if (rawT < 0.45) {
    // PHASE 1: UNFOLD TO FLAT SHEET
    const gatherIn = easeInOutCubic(clamp(rawT / 0.11, 0, 1));

    for (let e = 0; e < 4; e++) {
      const start = 0.12 + e * 0.025;
      const unfold = easeInOutCubic(clamp((rawT - start) / 0.11, 0, 1));
      edgeAngles[e] = Math.PI * 0.85 * gatherIn * (1 - unfold);
    }

    for (let c = 0; c < 4; c++) {
      const start = 0.24 + c * 0.038;
      const unfold = easeInOutCubic(clamp((rawT - start) / 0.12, 0, 1));
      cornerAngles[c] = Math.PI * 0.92 * gatherIn * (1 - unfold);
    }

    midPinch = Math.sin(clamp(rawT / 0.44, 0, 1) * Math.PI) * 0.14;
  } else if (rawT < 0.53) {
    // PHASE 2: FLAT SHEET
    cornerAngles = [0, 0, 0, 0];
    edgeAngles = [0, 0, 0, 0];
    midPinch = 0;
  } else {
    // PHASE 3: STEP-BY-STEP FOLD INTO TARGET POKÉMON
    const finalRelease = easeInOutCubic(clamp((rawT - 0.85) / 0.13, 0, 1));

    for (let c = 0; c < 4; c++) {
      const start = 0.53 + c * 0.04;
      const foldIn = easeInOutCubic(clamp((rawT - start) / 0.11, 0, 1));
      cornerAngles[c] = Math.PI * 0.92 * foldIn * (1 - finalRelease);
    }

    for (let e = 0; e < 4; e++) {
      const start = 0.69 + e * 0.025;
      const foldIn = easeInOutCubic(clamp((rawT - start) / 0.10, 0, 1));
      edgeAngles[e] = Math.PI * 0.85 * foldIn * (1 - finalRelease);
    }

    midPinch = Math.sin(clamp((rawT - 0.72) / 0.24, 0, 1) * Math.PI) * 0.18;
  }

  if (Math.abs(midPinch) > 0.001) {
    const cx = pts[0].x;
    const cy = pts[0].y;
    for (let s = 0; s < 8; s++) {
      const mIdx = 9 + s;
      const sign = s % 2 === 0 ? -1 : 1;
      pts[mIdx].x += (pts[mIdx].x - cx) * midPinch * sign * 0.45;
      pts[mIdx].y += (pts[mIdx].y - cy) * midPinch * sign * 0.45;
      pts[mIdx].lift = Math.abs(midPinch) * 2.5;
    }
  }

  const edgeDefs = [
    { vIdx: 17, aIdx: 16, bIdx: 10 },
    { vIdx: 19, aIdx: 10, bIdx: 12 },
    { vIdx: 21, aIdx: 12, bIdx: 14 },
    { vIdx: 23, aIdx: 14, bIdx: 16 }
  ];
  edgeDefs.forEach((def, idx) => {
    const theta = edgeAngles[idx];
    if (theta > 0.001) {
      pts[def.vIdx] = foldVertexAroundCrease(pts[def.vIdx], pts[def.aIdx], pts[def.bIdx], theta);
    }
  });

  const cornerDefs = [
    { vIdx: 24, aIdx: 23, bIdx: 17 },
    { vIdx: 18, aIdx: 17, bIdx: 19 },
    { vIdx: 20, aIdx: 19, bIdx: 21 },
    { vIdx: 22, aIdx: 21, bIdx: 23 }
  ];
  cornerDefs.forEach((def, idx) => {
    const theta = cornerAngles[idx];
    if (theta > 0.001) {
      pts[def.vIdx] = foldVertexAroundCrease(pts[def.vIdx], pts[def.aIdx], pts[def.bIdx], theta);
    }
  });

  const sortedTris = [...TRIANGLES].sort((a, b) => {
    const za = (pts[a.indices[0]].z + pts[a.indices[1]].z + pts[a.indices[2]].z) / 3 + a.ring * 2;
    const zb = (pts[b.indices[0]].z + pts[b.indices[1]].z + pts[b.indices[2]].z) / 3 + b.ring * 2;
    return za - zb;
  });

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  for (const tri of sortedTris) {
    const [i0, i1, i2] = tri.indices;
    const p0 = pts[i0];
    const p1 = pts[i1];
    const p2 = pts[i2];

    const cross = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
    const isBackFace = cross < 0 || p0.foldedOver || p1.foldedOver || p2.foldedOver;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();

    if (isBackFace) {
      ctx.fillStyle = tri.sector % 2 === 0 ? paperBackColor : paperAccentColor;
    } else {
      ctx.fillStyle = paperFrontColor;
    }
    ctx.fill();

    if (!isBackFace && activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      const imgW = activeImg.naturalWidth;
      const imgH = activeImg.naturalHeight;
      const s0 = { x: BASE_VERTICES[i0].u * imgW, y: BASE_VERTICES[i0].v * imgH };
      const s1 = { x: BASE_VERTICES[i1].u * imgW, y: BASE_VERTICES[i1].v * imgH };
      const s2 = { x: BASE_VERTICES[i2].u * imgW, y: BASE_VERTICES[i2].v * imgH };
      drawTexturedTriangle(ctx, activeImg, s0, s1, s2, p0, p1, p2, photoAlpha);
    }

    const avgLift = (p0.lift + p1.lift + p2.lift) / 3;
    const sectorLight = (tri.sector % 2 === 0 ? 1 : -1) * 0.08 * creaseAlpha;
    const shade = avgLift * 0.25 + sectorLight;
    if (Math.abs(shade) > 0.01) {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle =
        shade > 0
          ? `rgba(255, 255, 255, ${clamp(shade, 0, 0.30)})`
          : `rgba(0, 0, 0, ${clamp(-shade, 0, 0.30)})`;
      ctx.fill();
    }

    if (creaseAlpha > 0.01) {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.strokeStyle = `rgba(90, 45, 12, ${0.34 * creaseAlpha})`;
      ctx.lineWidth = 1.15;
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.24 * creaseAlpha})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();

  if (rawT >= 1) {
    isAnimating = false;
    if (queuedPokemon && queuedPokemon !== currentPokemon) {
      const next = queuedPokemon;
      queuedPokemon = null;
      morphTo(next);
    } else {
      queuedPokemon = null;
    }
  }
}

// =========================================================================
// 4. Hand Gesture & Two-Hand Zoom Recognition
// =========================================================================
function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const wrist = landmarks[0];
  const dTip = dist2D(landmarks[tipIdx], wrist);
  const dPip = dist2D(landmarks[pipIdx], wrist);
  const dMcp = dist2D(landmarks[mcpIdx], wrist);
  return dTip > dPip * 1.08 && dTip > dMcp * 1.18;
}

function classifySingleHandGesture(landmarks) {
  const indexExt = isFingerExtended(landmarks, 8, 6, 5);
  const middleExt = isFingerExtended(landmarks, 12, 10, 9);
  const ringExt = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);

  const mainExtendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return "eevee";
  }
  if (mainExtendedCount >= 3) {
    return "raichu";
  }
  if (mainExtendedCount === 0) {
    return "pikachu";
  }
  return null;
}

let currentZoom = 1.0;
let targetZoom = 1.0;
let twoHandAnchorDist = null;
let twoHandAnchorZoom = 1.0;
let twoHandActiveFrames = 0;
let lastTwoHandTimestamp = 0;

zoomPill.addEventListener("click", () => {
  targetZoom = 1.0;
  twoHandAnchorDist = null;
});

// =========================================================================
// 5. MediaPipe HandLandmarker (2 Hands) & Main Loop
// =========================================================================
let handLandmarker = null;
let lastVideoTime = -1;
let candidateTarget = null;
let holdFrames = 0;
const REQUIRED_FRAMES = 6;

async function initMediaPipe() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }
    });
    video.srcObject = stream;
    statusDot.classList.add("ready");
    statusText.textContent = "Camera Active (1 Hand: Morph · 2 Hands: Zoom)";
  } catch (err) {
    console.warn("Camera init notice:", err);
    statusText.textContent = "Click anywhere to enable camera";
    document.body.addEventListener(
      "click",
      async () => {
        if (!video.srcObject && handLandmarker) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" }
          });
          video.srcObject = stream;
          statusDot.classList.add("ready");
          statusText.textContent = "Camera Active (1 Hand: Morph · 2 Hands: Zoom)";
        }
      },
      { once: true }
    );
  }
}

function mainLoop(now) {
  if (
    handLandmarker &&
    video.readyState >= 2 &&
    lastVideoTime !== video.currentTime &&
    video.videoWidth > 0
  ) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, now);
    const hands = results.landmarks || [];

    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];

      const p1 = {
        x: (h1[4].x + h1[8].x + h1[9].x) / 3,
        y: (h1[4].y + h1[8].y + h1[9].y) / 3
      };
      const p2 = {
        x: (h2[4].x + h2[8].x + h2[9].x) / 3,
        y: (h2[4].y + h2[8].y + h2[9].y) / 3
      };
      const handDist = dist2D(p1, p2);

      twoHandActiveFrames++;
      lastTwoHandTimestamp = now;
      holdFrames = 0;

      if (twoHandActiveFrames === 2) {
        twoHandAnchorDist = Math.max(0.12, handDist);
        twoHandAnchorZoom = targetZoom;
      } else if (twoHandActiveFrames > 2 && twoHandAnchorDist) {
        const ratioZoom = twoHandAnchorZoom * Math.pow(handDist / twoHandAnchorDist, 1.25);
        const absZoom = 0.45 + ((handDist - 0.14) / 0.48) * 1.25;
        const blended = ratioZoom * 0.65 + absZoom * 0.35;
        targetZoom = clamp(blended, 0.50, 1.75);
      }

      zoomPill.classList.add("zooming");
    } else if (hands.length === 1) {
      twoHandActiveFrames = 0;
      twoHandAnchorDist = null;
      zoomPill.classList.remove("zooming");

      if (now - lastTwoHandTimestamp > 450) {
        const detected = classifySingleHandGesture(hands[0]);
        if (detected) {
          if (candidateTarget === detected) {
            holdFrames = Math.min(REQUIRED_FRAMES, holdFrames + 1);
          } else {
            candidateTarget = detected;
            holdFrames = 1;
          }

          if (holdFrames >= REQUIRED_FRAMES) {
            morphTo(detected);
          }
        } else {
          holdFrames = Math.max(0, holdFrames - 1);
        }
      }
    } else {
      twoHandActiveFrames = 0;
      twoHandAnchorDist = null;
      holdFrames = 0;
      zoomPill.classList.remove("zooming");
    }
  }

  currentZoom += (targetZoom - currentZoom) * 0.16;
  origamiStage.style.transform = `scale(${currentZoom.toFixed(3)})`;
  zoomLabel.textContent = `2-Hand Zoom · ${Math.round(currentZoom * 100)}%`;

  renderOrigamiFrame(now);
  requestAnimationFrame(mainLoop);
}

initMediaPipe();
requestAnimationFrame(mainLoop);
