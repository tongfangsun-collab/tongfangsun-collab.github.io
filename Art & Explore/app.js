// ============================================================================
// Art & Explore — Interactive Gallery Engine (app.js)
// Features:
// 1. "After Hours" Artist Character Stage with unclipped speech bubbles
// 2. Artist Docent Guided Introductions (Text + Web Speech Voice Synthesis)
// 3. Full-Screen Immersive Masterpiece Theatre with Next/Prev + Deep Zoom
// 4. MediaPipe HandLandmarker Livestream Gesture Control:
//    - Hand move -> Moves virtual cursor + auto-scrolls near viewport edges
//    - Two-finger touch (thumb tip #4 + index tip #8 pinch) -> Clicks UI elements
// ============================================================================

(function () {
  const DATA = window.MET_MUSEUM_DATA;
  if (!DATA) return;

  const state = {
    lang: "en", // "en" | "zh"
    selectedArtistId: "all", // "all" or artist.id
    speakingArtistId: "van-gogh",
    activeColorFilter: "all", // "all" | "blue" | "gold" | "red" | "green" | "dark"
    searchQuery: "",
    filteredPairs: [],
    lightboxIndex: 0,
    lightboxArtwork: null,
    lightboxArtist: null,
    docentMode: "voice", // "voice" | "story" | "technique"
    autoNarrate: true,
    specsDrawerOpen: false,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDraggingZoom: false,
    dragStartX: 0,
    dragStartY: 0,
    // MediaPipe HandLandmarker state
    handActive: false,
    handLoading: false,
    handLandmarker: null,
    webcamStream: null,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    isPinching: false,
    lastPinchTime: 0,
    hoveredElement: null
  };

  // Cache for live Met API image lookups in the browser
  const metApiImageCache = new Map();

  // UI Copy Dictionary (Bilingual EN / 中文)
  const UI_COPY = {
    en: {
      stageTitle: "Art & Explore · After Hours",
      stageSubtitle:
        "The Met Fifth Avenue has closed for the night — stroll the galleries and let the 10 masters introduce their art.",
      handBtnOff: "✋ Hand Gesture Control",
      handBtnLoading: "⏳ Starting Camera...",
      handBtnOn: "✋ Hand Active (Pinch = Click)",
      navStage: "Character Stage",
      navGallery: "Masterpieces (61)",
      navImmersive: "✨ Full-Screen Tour",
      navWings: "Met Floor Wings",
      immersiveHeroBtn: "🖼️ Full-Screen Artist Tour",
      enterBtn: "Enter Gallery →",
      creditSub: "Top 10 Artists · 61 Masterpieces · New York Metropolitan Museum of Art",
      allArtistsChip: "All 10 Met Masters (61)",
      searchPlaceholder: "Search paintings, galleries, motifs...",
      colorFilterLabel: "Pigment Palette:",
      allWorksHeading: "Curated Masterpieces at The Met",
      worksCountSuffix: "artworks on view",
      askArtistBtn: "🗣️ Artist Introduces Work",
      inspectZoomBadge: "⛶ Full-Screen & Artist Intro",
      chatHeaderTag: "After Hours Studio Chat",
      promptFav: "✨ Which Met work is your favorite?",
      promptTech: "🎨 Secret of your brushwork?",
      promptSecret: "🤫 Tell me a hidden museum story!",
      promptTour: "🖼️ Guide Me in Full Screen",
      wingsHeading: "Explore The Met Fifth Avenue by Wing",
      wingsSub: "Click any curatorial department to filter artists and galleries.",
      specArtist: "Artist",
      specDate: "Date",
      specMedium: "Medium",
      specDimensions: "Dimensions",
      specGallery: "Met Location",
      specAccession: "Accession No.",
      specPalette: "Pigments",
      docentTabArtist: "🎨 Artist's Personal Intro",
      docentTabCurator: "🏛️ Met Curatorial Story",
      docentTabTechnique: "🖌️ Brushwork & Technique",
      listenAudioBtn: "🔊 Hear Artist Speak",
      stopAudioBtn: "⏹ Stop Voice",
      nextArtBtn: "Next Artwork →",
      viewOnMetBtn: "View on The Met ↗",
      viewOnGacBtn: "Google Arts & Culture ↗",
      fullScreenBtn: "⛶ Full Screen",
      specsBtn: "📋 Curatorial Specs",
      charTourBadge: "🗣️ Click for Guided Tour",
      hudDefaultHint: "Move hand → Move cursor · Two-finger touch (Thumb + Index) → Click"
    },
    zh: {
      stageTitle: "Art & Explore · 美术馆夜游",
      stageSubtitle: "纽约大都会艺术博物馆打烊了，让 10 位馆藏艺术大师亲自为您导览代表作",
      handBtnOff: "✋ 开启手势隔空操控",
      handBtnLoading: "⏳ 正在启动摄像头...",
      handBtnOn: "✋ 手势操控中 (双指轻触=点击)",
      navStage: "艺术家剧场",
      navGallery: "馆藏杰作 (61)",
      navImmersive: "✨ 全屏沉浸导览",
      navWings: "大都会展厅导览",
      immersiveHeroBtn: "🖼️ 全屏大师语音导览",
      enterBtn: "进入展厅 →",
      creditSub: "纽约大都会艺术博物馆 · 10大巨匠 · 61件镇馆名作",
      allArtistsChip: "全部 10 位馆藏大师 (61)",
      searchPlaceholder: "搜索画作名称、展厅、题材...",
      colorFilterLabel: "色彩色谱筛选:",
      allWorksHeading: "大都会馆藏传世杰作",
      worksCountSuffix: "件馆藏作品",
      askArtistBtn: "🗣️ 画家亲自为您讲解",
      inspectZoomBadge: "⛶ 全屏沉浸赏析",
      chatHeaderTag: "美术馆打烊后 · 与画家唠嗑",
      promptFav: "✨ 您最偏爱大都会哪幅画？",
      promptTech: "🎨 您的独家笔触秘诀是什么？",
      promptSecret: "🤫 讲个画布背后的隐藏八卦！",
      promptTour: "🖼️ 进入全屏沉浸大师导览",
      wingsHeading: "按大都会第五大道展翼探索",
      wingsSub: "点击任一策展部门筛选对应展厅的大师与画作。",
      specArtist: "艺术家",
      specDate: "创作年代",
      specMedium: "材质媒介",
      specDimensions: "作品尺寸",
      specGallery: "大都会展厅",
      specAccession: "馆藏编号",
      specPalette: "提取色谱",
      docentTabArtist: "🎨 画家第一人称自述",
      docentTabCurator: "🏛️ 大都会策展故事",
      docentTabTechnique: "🖌️ 技法与秘密",
      listenAudioBtn: "🔊 听画家语音讲解",
      stopAudioBtn: "⏹ 停止语音",
      nextArtBtn: "下一幅杰作 →",
      viewOnMetBtn: "大都会官网详情 ↗",
      viewOnGacBtn: "Google 艺术与文化 ↗",
      fullScreenBtn: "⛶ 浏览器全屏",
      specsBtn: "📋 馆藏档案参数",
      charTourBadge: "🗣️ 点击听大师导览",
      hudDefaultHint: "移动手掌 → 移动光标 · 拇指与食指轻触捏合 → 点击"
    }
  };

  function t(key) {
    return UI_COPY[state.lang][key] || UI_COPY.en[key] || key;
  }

  // ==========================================================================
  // Bespoke Masterpiece Canvas Painter (Rich Painterly Fallback & Underlayer)
  // ==========================================================================
  function drawMasterpieceCanvas(canvas, artwork, artist) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = 640);
    const h = (canvas.height = 480);
    const pal = artwork.palette || ["#3a6ea5", "#e3b448", "#2d4c39", "#d89c52", "#181818"];

    let seed = 0;
    for (let i = 0; i < artwork.id.length; i++) {
      seed = (seed * 31 + artwork.id.charCodeAt(i)) & 0x7fffffff;
    }
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 10000) / 10000;
    };

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, pal[0]);
    grad.addColorStop(0.55, pal[1] || pal[0]);
    grad.addColorStop(1, pal[2] || pal[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const motif = artwork.motif || "";

    if (artist.id === "van-gogh") {
      for (let i = 0; i < 260; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const angle = Math.sin(x * 0.015) * 0.7 + Math.cos(y * 0.02) * 0.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
        ctx.globalAlpha = 0.68;
        ctx.beginPath();
        ctx.roundRect(-16, -4, 32, 8, 4);
        ctx.fill();
        ctx.restore();
      }
      if (motif.includes("cypress")) {
        ctx.fillStyle = pal[2];
        ctx.globalAlpha = 0.88;
        ctx.fillRect(0, h * 0.64, w, h * 0.36);
        ctx.fillStyle = pal[3];
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.85);
        ctx.quadraticCurveTo(w * 0.65, h * 0.35, w * 0.76, h * 0.08);
        ctx.quadraticCurveTo(w * 0.85, h * 0.4, w * 0.8, h * 0.85);
        ctx.fill();
      } else if (motif.includes("sunflower") || motif.includes("irises")) {
        for (let f = 0; f < 9; f++) {
          const fx = w * (0.22 + rand() * 0.56);
          const fy = h * (0.24 + rand() * 0.52);
          ctx.fillStyle = pal[0];
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(fx, fy, 30 + rand() * 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = pal[1];
          ctx.beginPath();
          ctx.arc(fx, fy, 13, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (artist.id === "monet") {
      for (let i = 0; i < 340; i++) {
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(x, y, 18 + rand() * 16, 5 + rand() * 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (motif.includes("bridge")) {
        ctx.strokeStyle = "#d8e6d0";
        ctx.lineWidth = 12;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.82, w * 0.48, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();
      }
    } else if (artist.id === "hokusai") {
      ctx.fillStyle = "#f2ead8";
      ctx.globalAlpha = 0.92;
      ctx.fillRect(0, 0, w, h * 0.62);
      ctx.fillStyle = motif.includes("red-fuji") ? "#b8422b" : "#1b3b6f";
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.78);
      ctx.quadraticCurveTo(w * 0.45, h * 0.65, w * 0.54, h * 0.34);
      ctx.lineTo(w * 0.62, h * 0.34);
      ctx.quadraticCurveTo(w * 0.72, h * 0.65, w * 0.95, h * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(w * 0.51, h * 0.44);
      ctx.lineTo(w * 0.54, h * 0.34);
      ctx.lineTo(w * 0.62, h * 0.34);
      ctx.lineTo(w * 0.65, h * 0.44);
      ctx.closePath();
      ctx.fill();
      if (motif.includes("wave")) {
        ctx.fillStyle = "#1b3b6f";
        ctx.beginPath();
        ctx.arc(w * 0.32, h * 0.52, 135, Math.PI * 0.7, Math.PI * 1.95);
        ctx.lineTo(w * 0.55, h * 0.85);
        ctx.lineTo(0, h * 0.85);
        ctx.fill();
      }
    } else if (artist.id === "rembrandt" || artist.id === "vermeer" || artist.id === "sargent") {
      ctx.fillStyle = pal[0];
      ctx.globalAlpha = 0.95;
      ctx.fillRect(0, 0, w, h);
      const rad = ctx.createRadialGradient(w * 0.48, h * 0.4, 18, w * 0.48, h * 0.45, w * 0.46);
      rad.addColorStop(0, pal[1]);
      rad.addColorStop(0.5, pal[2] || pal[1]);
      rad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = pal[3] || "#d9c29c";
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.arc(w * 0.48, h * 0.36, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal[1];
      ctx.beginPath();
      ctx.ellipse(w * 0.48, h * 0.78, 96, 112, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 0; i < 180; i++) {
        ctx.save();
        ctx.translate(rand() * w, rand() * h);
        ctx.rotate((rand() - 0.5) * 1.2);
        ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
        ctx.globalAlpha = 0.62;
        ctx.fillRect(-28, -16, 56, 32);
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.65);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(18,16,14,0.28)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // ==========================================================================
  // Live Met Collection API Image Enricher
  // ==========================================================================
  async function fetchMetObjectImage(objectId) {
    if (!objectId) return null;
    if (metApiImageCache.has(objectId)) {
      return metApiImageCache.get(objectId);
    }
    const promise = (async () => {
      try {
        const res = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
          small: data.primaryImageSmall || data.primaryImage || null,
          large: data.primaryImage || data.primaryImageSmall || null
        };
      } catch (_) {
        return null;
      }
    })();
    metApiImageCache.set(objectId, promise);
    const resolved = await promise;
    metApiImageCache.set(objectId, resolved);
    return resolved;
  }

  async function enrichArtworkImage(artwork, imgEl, preferLarge = false) {
    if (!imgEl || !artwork.objectId) return;

    let fellBackToApi = false;

    imgEl.onload = () => {
      imgEl.classList.add("loaded");
    };

    imgEl.onerror = async () => {
      if (fellBackToApi) return;
      fellBackToApi = true;
      const apiObj = await fetchMetObjectImage(artwork.objectId);
      const url = apiObj ? (preferLarge ? apiObj.large : apiObj.small) : null;
      if (url && imgEl.src !== url) {
        imgEl.src = url;
      }
    };

    if (artwork.imageUrl && artwork.imageUrl.includes("/iiif/")) {
      imgEl.src = artwork.imageUrl;
    } else {
      const apiObj = await fetchMetObjectImage(artwork.objectId);
      const url = apiObj ? (preferLarge ? apiObj.large : apiObj.small) : null;
      if (url) {
        fellBackToApi = true;
        imgEl.src = url;
      } else if (artwork.imageUrl) {
        imgEl.src = artwork.imageUrl;
      }
    }
  }

  // ==========================================================================
  // Color Family Classifier for Pigment Filter
  // ==========================================================================
  function matchesColorFilter(artwork, filter) {
    if (filter === "all") return true;
    const hexes = artwork.palette || [];
    for (const hex of hexes.slice(0, 3)) {
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      if (filter === "blue" && b > r + 20 && b > g) return true;
      if (filter === "gold" && r > 180 && g > 130 && b < 120) return true;
      if (filter === "red" && r > g + 45 && r > b + 40) return true;
      if (filter === "green" && g > r && g >= b - 10 && g > 80) return true;
      if (filter === "dark" && r < 55 && g < 55 && b < 55) return true;
    }
    return false;
  }

  // ==========================================================================
  // 1. Render "After Hours" Hero Character Stage (Unclipped Speech Bubbles!)
  // ==========================================================================
  function renderCharacterParade() {
    const container = document.getElementById("character-parade");
    if (!container) return;
    container.innerHTML = "";

    DATA.artists.forEach((artist) => {
      const node = document.createElement("div");
      node.className =
        "artist-character-node" +
        (state.speakingArtistId === artist.id ? " is-speaking" : "");
      node.id = `char-node-${artist.id}`;
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");

      const bubbleQuote =
        state.lang === "zh" ? artist.bubbleGreetingZh : artist.bubbleGreetingEn;
      const displayName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
      const metaText =
        state.lang === "zh" ? artist.galleryZh : artist.galleryEn;

      // Notice `.speech-bubble-slot` keeps the bubble inside the layout box so overflow-x never clips it!
      node.innerHTML = `
        <div class="speech-bubble-slot">
          <div class="speech-bubble">
            <span class="speech-bubble-name">${artist.bubbleName}</span>
            <span class="speech-bubble-quote">${bubbleQuote}</span>
          </div>
        </div>
        <div class="character-head-wrap">
          <img
            src="${artist.avatar}"
            alt="${displayName}"
            class="character-head-img"
            loading="eager"
          />
        </div>
        <div class="character-caption">
          <span class="character-caption-name">${displayName}</span>
          <span class="character-caption-meta">${metaText} · ${artist.artworks.length} works</span>
          <span class="character-tour-badge">${t("charTourBadge")}</span>
        </div>
      `;

      node.addEventListener("mouseenter", () => {
        state.speakingArtistId = artist.id;
        document.querySelectorAll(".artist-character-node").forEach((el) => {
          el.classList.toggle("is-speaking", el.id === `char-node-${artist.id}`);
        });
      });

      // Clicking an artist character selects them AND launches their personal introduction!
      node.addEventListener("click", () => {
        selectArtist(artist.id, true);
        if (artist.artworks && artist.artworks.length > 0) {
          speakArtistText(
            state.lang === "zh"
              ? `${artist.nameZh}。${artist.bubbleGreetingZh} ${artist.chatResponses.favoriteZh}`
              : `${artist.nameEn}. ${artist.bubbleGreetingEn} ${artist.chatResponses.favoriteEn}`
          );
        }
      });

      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectArtist(artist.id, true);
        }
      });

      container.appendChild(node);
    });
  }

  // ==========================================================================
  // 2. Render Sticky Avatar Filter Bar
  // ==========================================================================
  function renderStickyAvatarStrip() {
    const strip = document.getElementById("artist-avatar-strip");
    if (!strip) return;
    strip.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className =
      "avatar-chip" + (state.selectedArtistId === "all" ? " active" : "");
    allBtn.id = "chip-artist-all";
    allBtn.textContent = t("allArtistsChip");
    allBtn.addEventListener("click", () => selectArtist("all", false));
    strip.appendChild(allBtn);

    DATA.artists.forEach((artist) => {
      const btn = document.createElement("button");
      btn.className =
        "avatar-chip" + (state.selectedArtistId === artist.id ? " active" : "");
      btn.id = `chip-artist-${artist.id}`;
      const name = state.lang === "zh" ? artist.nameZh : artist.nameEn;
      btn.innerHTML = `
        <img src="${artist.avatar}" alt="${name}" />
        <span>${name} (${artist.artworks.length})</span>
      `;
      btn.addEventListener("click", () => selectArtist(artist.id, false));
      strip.appendChild(btn);
    });
  }

  // ==========================================================================
  // 3. Render Artist Studio Banner ("After Hours Chat" + Guided Tour Trigger)
  // ==========================================================================
  function renderArtistStudioBanner() {
    const host = document.getElementById("artist-studio-container");
    if (!host) return;

    const activeArtist =
      state.selectedArtistId === "all"
        ? DATA.artists.find((a) => a.id === state.speakingArtistId) ||
          DATA.artists[0]
        : DATA.artists.find((a) => a.id === state.selectedArtistId);

    if (!activeArtist) {
      host.innerHTML = "";
      return;
    }

    const name = state.lang === "zh" ? activeArtist.nameZh : activeArtist.nameEn;
    const nat =
      state.lang === "zh" ? activeArtist.nationalityZh : activeArtist.nationalityEn;
    const wing =
      state.lang === "zh" ? activeArtist.galleryZh : activeArtist.galleryEn;
    const bio = state.lang === "zh" ? activeArtist.bioZh : activeArtist.bioEn;
    const defaultChat =
      state.lang === "zh"
        ? activeArtist.chatResponses.favoriteZh
        : activeArtist.chatResponses.favoriteEn;

    host.innerHTML = `
      <section class="artist-studio-banner" id="artist-studio-banner">
        <div class="studio-character-column">
          <div class="studio-character-stage">
            <img src="${activeArtist.avatar}" alt="${name}" />
          </div>
          <span class="studio-wing-pill">📍 The Met · ${wing}</span>
        </div>
        <div class="studio-info-column">
          <div class="studio-header-row">
            <div>
              <h2 class="studio-artist-title">${name}</h2>
              <p class="studio-artist-lifespan">${activeArtist.lifespan} · ${nat}</p>
            </div>
          </div>
          <p class="studio-bio">${bio}</p>
          <div class="after-hours-chat-box">
            <div class="chat-box-header">
              <span class="chat-speaker-tag">💬 ${t("chatHeaderTag")} · ${name}</span>
            </div>
            <p class="chat-message-text" id="studio-chat-message">"${defaultChat}"</p>
            <div class="chat-prompt-chips">
              <button type="button" class="chat-prompt-chip" data-prompt="favorite">${t("promptFav")}</button>
              <button type="button" class="chat-prompt-chip" data-prompt="technique">${t("promptTech")}</button>
              <button type="button" class="chat-prompt-chip" data-prompt="secret">${t("promptSecret")}</button>
              <button type="button" class="chat-prompt-chip chip-crimson" id="studio-start-tour-btn">${t("promptTour")}</button>
            </div>
          </div>
        </div>
      </section>
    `;

    host.querySelectorAll(".chat-prompt-chip[data-prompt]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const key = chip.getAttribute("data-prompt");
        const msgEl = document.getElementById("studio-chat-message");
        if (!msgEl) return;
        let text = "";
        if (key === "favorite") {
          text =
            state.lang === "zh"
              ? activeArtist.chatResponses.favoriteZh
              : activeArtist.chatResponses.favoriteEn;
        } else if (key === "technique") {
          text =
            state.lang === "zh"
              ? activeArtist.chatResponses.techniqueZh
              : activeArtist.chatResponses.techniqueEn;
        } else {
          text =
            state.lang === "zh"
              ? activeArtist.chatResponses.secretZh
              : activeArtist.chatResponses.secretEn;
        }
        msgEl.textContent = `"${text}"`;
        speakArtistText(text);
      });
    });

    const startTourBtn = document.getElementById("studio-start-tour-btn");
    if (startTourBtn) {
      startTourBtn.addEventListener("click", () => {
        if (activeArtist.artworks && activeArtist.artworks.length > 0) {
          openLightbox(activeArtist.artworks[0], activeArtist, true);
        }
      });
    }
  }

  // ==========================================================================
  // 4. Render Masterpiece Grid
  // ==========================================================================
  function renderArtworksGrid() {
    const grid = document.getElementById("artworks-grid");
    const headingEl = document.getElementById("gallery-section-heading");
    const countEl = document.getElementById("artwork-count-badge");
    if (!grid) return;

    grid.innerHTML = "";
    const query = state.searchQuery.trim().toLowerCase();

    const pairs = [];
    DATA.artists.forEach((artist) => {
      if (state.selectedArtistId !== "all" && artist.id !== state.selectedArtistId) {
        return;
      }
      artist.artworks.forEach((artwork) => {
        if (!matchesColorFilter(artwork, state.activeColorFilter)) return;
        if (query) {
          const hay = [
            artwork.titleEn,
            artwork.titleZh,
            artist.nameEn,
            artist.nameZh,
            artwork.gallery,
            artwork.date,
            artwork.storyEn,
            artwork.storyZh
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(query)) return;
        }
        pairs.push({ artist, artwork });
      });
    });

    state.filteredPairs = pairs;

    if (headingEl) {
      if (state.selectedArtistId === "all") {
        headingEl.textContent = t("allWorksHeading");
      } else {
        const artObj = DATA.artists.find((a) => a.id === state.selectedArtistId);
        headingEl.textContent =
          state.lang === "zh"
            ? `${artObj.nameZh} · 大都会馆藏代表作`
            : `${artObj.nameEn} · Highlights at The Met`;
      }
    }

    if (countEl) {
      countEl.textContent = `${pairs.length} ${t("worksCountSuffix")}`;
    }

    pairs.forEach(({ artist, artwork }, index) => {
      const card = document.createElement("article");
      card.className = "artwork-card";
      card.id = `artwork-card-${artwork.id}`;

      const title = state.lang === "zh" ? artwork.titleZh : artwork.titleEn;
      const artistName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
      const medium = state.lang === "zh" ? artwork.mediumZh : artwork.mediumEn;
      const voice =
        state.lang === "zh" ? artwork.artistVoiceZh : artwork.artistVoiceEn;

      const swatchesHtml = (artwork.palette || [])
        .map((c) => `<span class="pigment-swatch" style="background:${c}"></span>`)
        .join("");

      card.innerHTML = `
        <div class="artwork-media-frame">
          <canvas class="artwork-canvas-fallback"></canvas>
          <img
            class="artwork-real-img"
            alt="${title} — ${artistName}"
            loading="lazy"
          />
          <span class="artwork-gallery-pill">📍 ${artwork.gallery}</span>
          <span class="artwork-zoom-badge">${t("inspectZoomBadge")}</span>
        </div>
        <div class="pigment-strip">${swatchesHtml}</div>
        <div class="artwork-body">
          <div class="artwork-artist-mini">
            <img src="${artist.avatar}" alt="${artistName}" />
            <span>${artistName}</span>
          </div>
          <h3 class="artwork-title">${title}</h3>
          <div class="artwork-meta-line">${artwork.date} · ${medium}</div>
          <p class="artwork-story-snippet">“${voice}”</p>
          <div class="artwork-card-footer">
            <button class="ask-artist-mini-btn" type="button">${t("askArtistBtn")}</button>
            <span class="met-accession">Met #${artwork.accession}</span>
          </div>
        </div>
      `;

      const canvas = card.querySelector(".artwork-canvas-fallback");
      drawMasterpieceCanvas(canvas, artwork, artist);

      const imgEl = card.querySelector(".artwork-real-img");
      enrichArtworkImage(artwork, imgEl, false);

      // Clicking "Artist Introduces Work" opens the Full-Screen Immersive Stage with spoken introduction
      const askBtn = card.querySelector(".ask-artist-mini-btn");
      askBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.lightboxIndex = index;
        openLightbox(artwork, artist, true);
      });

      card.addEventListener("click", () => {
        state.lightboxIndex = index;
        openLightbox(artwork, artist, true);
      });

      grid.appendChild(card);
    });
  }

  // ==========================================================================
  // 5. Render Met Fifth Avenue Wings Overview
  // ==========================================================================
  function renderWingsSection() {
    const grid = document.getElementById("wings-grid");
    if (!grid) return;
    grid.innerHTML = "";

    DATA.museumInfo.wings.forEach((wing) => {
      const card = document.createElement("div");
      card.className = "wing-card";
      card.id = `wing-card-${wing.id}`;

      const floor = state.lang === "zh" ? wing.floorZh : wing.floorEn;
      const name = state.lang === "zh" ? wing.nameZh : wing.nameEn;
      const desc = state.lang === "zh" ? wing.descZh : wing.descEn;

      const avatarsHtml = wing.artists
        .map((aid) => {
          const a = DATA.artists.find((x) => x.id === aid);
          if (!a) return "";
          const aname = state.lang === "zh" ? a.nameZh : a.nameEn;
          return `<img src="${a.avatar}" alt="${aname}" title="${aname}" />`;
        })
        .join("");

      card.innerHTML = `
        <span class="wing-floor-tag">${floor}</span>
        <h3 class="wing-name">${name}</h3>
        <p class="wing-desc">${desc}</p>
        <div class="wing-artists-avatars">${avatarsHtml}</div>
      `;

      card.addEventListener("click", () => {
        if (wing.artists.length > 0) {
          selectArtist(wing.artists[0], true);
        }
      });

      grid.appendChild(card);
    });
  }

  // ==========================================================================
  // 6. FULL-SCREEN IMMERSIVE ARTWORK STAGE & ARTIST DOCENT OVERLAY
  // ==========================================================================
  function getDocentNarrationText(artwork, artist, mode) {
    const title = state.lang === "zh" ? artwork.titleZh : artwork.titleEn;
    const artistName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
    const voice = state.lang === "zh" ? artwork.artistVoiceZh : artwork.artistVoiceEn;
    const story = state.lang === "zh" ? artwork.storyZh : artwork.storyEn;
    const tech =
      state.lang === "zh"
        ? artist.chatResponses.techniqueZh
        : artist.chatResponses.techniqueEn;

    if (mode === "story") {
      return story;
    }
    if (mode === "technique") {
      return `${tech} (${voice})`;
    }
    // Default "voice": First-person artist introduction
    if (state.lang === "zh") {
      return `大家好，我是${artistName}。欢迎来到大都会艺术博物馆 ${artwork.gallery}，您眼前这幅是我创作于 ${artwork.date} 年的《${title}》。${voice}`;
    }
    return `Hello, I am ${artistName}. Welcome to ${artwork.gallery} at The Met — before you is my ${artwork.date} work, "${title}". ${voice}`;
  }

  function speakArtistText(text, onStateChange) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = state.lang === "zh" ? "zh-CN" : "en-US";
    utter.rate = 0.96;

    const avatarWrap = document.getElementById("docent-avatar-wrap");
    if (avatarWrap) avatarWrap.classList.add("speaking");

    utter.onend = () => {
      if (avatarWrap) avatarWrap.classList.remove("speaking");
      if (onStateChange) onStateChange(false);
    };
    utter.onerror = () => {
      if (avatarWrap) avatarWrap.classList.remove("speaking");
      if (onStateChange) onStateChange(false);
    };

    if (onStateChange) onStateChange(true);
    window.speechSynthesis.speak(utter);
  }

  function openLightbox(artwork, artist, autoSpeak = true) {
    state.lightboxArtwork = artwork;
    state.lightboxArtist = artist;
    state.docentMode = "voice";
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;

    // Sync lightboxIndex with filteredPairs
    const idx = state.filteredPairs.findIndex((p) => p.artwork.id === artwork.id);
    if (idx !== -1) state.lightboxIndex = idx;

    const backdrop = document.getElementById("lightbox-backdrop");
    const zoomWrap = document.getElementById("lightbox-zoom-container");
    const docentHost = document.getElementById("immersive-artist-docent");
    const detailsPane = document.getElementById("lightbox-details-pane");
    const galleryTag = document.getElementById("immersive-gallery-tag");
    const counterPill = document.getElementById("immersive-counter-pill");
    if (!backdrop || !zoomWrap || !docentHost || !detailsPane) return;

    if (galleryTag) {
      galleryTag.textContent = `📍 The Met · ${artwork.gallery}`;
    }
    if (counterPill && state.filteredPairs.length > 0) {
      counterPill.textContent = `${state.lightboxIndex + 1} / ${state.filteredPairs.length}`;
    }

    zoomWrap.innerHTML = "";
    zoomWrap.style.transform = "translate(0px, 0px) scale(1)";

    // Render high-res canvas fallback + real full-res Met image
    const canvas = document.createElement("canvas");
    drawMasterpieceCanvas(canvas, artwork, artist);
    zoomWrap.appendChild(canvas);

    const img = document.createElement("img");
    img.alt = artwork.titleEn;
    img.style.display = "none";
    img.onload = () => {
      canvas.style.display = "none";
      img.style.display = "block";
    };
    zoomWrap.appendChild(img);
    enrichArtworkImage(artwork, img, true);

    renderImmersiveDocent(artwork, artist, autoSpeak);
    renderImmersiveSpecsDrawer(artwork, artist);

    updateZoomButtons();
    backdrop.classList.add("open");
  }

  function renderImmersiveDocent(artwork, artist, autoSpeak) {
    const docentHost = document.getElementById("immersive-artist-docent");
    if (!docentHost) return;

    const title = state.lang === "zh" ? artwork.titleZh : artwork.titleEn;
    const artistName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
    const medium = state.lang === "zh" ? artwork.mediumZh : artwork.mediumEn;
    const speechText = getDocentNarrationText(artwork, artist, state.docentMode);

    docentHost.innerHTML = `
      <div class="docent-avatar-wrap" id="docent-avatar-wrap">
        <img src="${artist.avatar}" alt="${artistName}" />
      </div>
      <div class="docent-content">
        <div class="docent-header-line">
          <div class="docent-title-group">
            <h2 class="docent-artwork-title">${title}</h2>
            <span class="docent-artist-badge">🗣️ ${artist.bubbleName} · ${artwork.date} · ${medium}</span>
          </div>
        </div>
        <p class="docent-speech-text" id="docent-speech-text">“${speechText}”</p>
        <div class="docent-controls-row">
          <div class="docent-mode-chips">
            <button type="button" class="docent-chip-btn ${state.docentMode === "voice" ? "active" : ""}" data-docent-mode="voice">
              ${t("docentTabArtist")}
            </button>
            <button type="button" class="docent-chip-btn ${state.docentMode === "story" ? "active" : ""}" data-docent-mode="story">
              ${t("docentTabCurator")}
            </button>
            <button type="button" class="docent-chip-btn ${state.docentMode === "technique" ? "active" : ""}" data-docent-mode="technique">
              ${t("docentTabTechnique")}
            </button>
          </div>
          <div class="docent-mode-chips">
            <button type="button" class="docent-chip-btn voice-btn" id="docent-speak-btn">
              ${t("listenAudioBtn")}
            </button>
            <button type="button" class="docent-chip-btn" id="docent-next-art-btn">
              ${t("nextArtBtn")}
            </button>
          </div>
        </div>
      </div>
    `;

    docentHost.querySelectorAll(".docent-chip-btn[data-docent-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.docentMode = btn.getAttribute("data-docent-mode") || "voice";
        renderImmersiveDocent(artwork, artist, true);
      });
    });

    const speakBtn = document.getElementById("docent-speak-btn");
    if (speakBtn) {
      speakBtn.addEventListener("click", () => {
        if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          speakBtn.textContent = t("listenAudioBtn");
          document.getElementById("docent-avatar-wrap")?.classList.remove("speaking");
        } else {
          speakArtistText(speechText, (isSpeaking) => {
            if (speakBtn) {
              speakBtn.textContent = isSpeaking ? t("stopAudioBtn") : t("listenAudioBtn");
            }
          });
        }
      });
    }

    const nextBtn = document.getElementById("docent-next-art-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => stepLightboxArtwork(1));
    }

    if (autoSpeak) {
      speakArtistText(speechText, (isSpeaking) => {
        const b = document.getElementById("docent-speak-btn");
        if (b) b.textContent = isSpeaking ? t("stopAudioBtn") : t("listenAudioBtn");
      });
    }
  }

  function renderImmersiveSpecsDrawer(artwork, artist) {
    const detailsPane = document.getElementById("lightbox-details-pane");
    if (!detailsPane) return;

    const title = state.lang === "zh" ? artwork.titleZh : artwork.titleEn;
    const artistName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
    const medium = state.lang === "zh" ? artwork.mediumZh : artwork.mediumEn;
    const story = state.lang === "zh" ? artwork.storyZh : artwork.storyEn;

    const paletteDots = (artwork.palette || [])
      .map(
        (hex) =>
          `<span title="${hex}" style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${hex};border:1px solid #ddd;margin-right:6px;vertical-align:middle;"></span>`
      )
      .join("");

    const gacQuery = encodeURIComponent(
      `${artwork.titleEn} ${artist.nameEn} Metropolitan Museum of Art`
    );

    detailsPane.innerHTML = `
      <div>
        <span class="wing-floor-tag">The Metropolitan Museum of Art · ${artwork.gallery}</span>
        <h3 class="studio-artist-title" style="margin-top:4px;font-size:1.65rem;">${title}</h3>
      </div>
      <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">${story}</p>
      <div class="lightbox-specs-table">
        <span class="spec-label">${t("specArtist")}</span>
        <span class="spec-value">${artistName} (${artist.lifespan})</span>
        <span class="spec-label">${t("specDate")}</span>
        <span class="spec-value">${artwork.date}</span>
        <span class="spec-label">${t("specMedium")}</span>
        <span class="spec-value">${medium}</span>
        <span class="spec-label">${t("specDimensions")}</span>
        <span class="spec-value">${artwork.dimensions}</span>
        <span class="spec-label">${t("specGallery")}</span>
        <span class="spec-value">The Met Fifth Ave · ${artwork.gallery}</span>
        <span class="spec-label">${t("specAccession")}</span>
        <span class="spec-value">${artwork.accession} (ID: ${artwork.objectId})</span>
        <span class="spec-label">${t("specPalette")}</span>
        <span class="spec-value">${paletteDots}</span>
      </div>
      <div class="lightbox-external-links">
        <a href="${artwork.metUrl}" target="_blank" rel="noopener noreferrer" class="ext-link-btn ext-link-primary">
          ${t("viewOnMetBtn")}
        </a>
        <a href="https://artsandculture.google.com/search?q=${gacQuery}" target="_blank" rel="noopener noreferrer" class="ext-link-btn ext-link-secondary">
          ${t("viewOnGacBtn")}
        </a>
      </div>
    `;
  }

  function stepLightboxArtwork(delta) {
    if (!state.filteredPairs.length) return;
    state.lightboxIndex =
      (state.lightboxIndex + delta + state.filteredPairs.length) %
      state.filteredPairs.length;
    const nextPair = state.filteredPairs[state.lightboxIndex];
    if (nextPair) {
      openLightbox(nextPair.artwork, nextPair.artist, true);
    }
  }

  function closeLightbox() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    const backdrop = document.getElementById("lightbox-backdrop");
    if (backdrop) backdrop.classList.remove("open");
    const drawer = document.getElementById("lightbox-details-pane");
    if (drawer) drawer.classList.remove("open");
    state.specsDrawerOpen = false;
  }

  function toggleNativeFullscreen() {
    const theatre = document.getElementById("lightbox-backdrop");
    if (!theatre) return;
    if (!document.fullscreenElement) {
      theatre.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function applyZoomTransform() {
    const zoomWrap = document.getElementById("lightbox-zoom-container");
    if (!zoomWrap) return;
    zoomWrap.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`;
  }

  function updateZoomButtons() {
    document.querySelectorAll(".zoom-btn[data-zoom]").forEach((btn) => {
      const z = parseFloat(btn.getAttribute("data-zoom"));
      btn.classList.toggle("active", z === state.zoomLevel);
    });
  }

  // ==========================================================================
  // 7. MEDIAPIPE HAND LANDMARKER LIVESTREAM GESTURE CONTROLLER
  //    https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker#livestream
  //    - Hand movement moves the virtual cursor across the viewport
  //    - Two-finger touch (Thumb tip #4 + Index finger tip #8 pinch) triggers click
  // ==========================================================================
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];

  async function toggleHandGestureControl() {
    if (state.handActive) {
      stopHandGestureControl();
      return;
    }
    if (state.handLoading) return;

    state.handLoading = true;
    updateHandButtonUI();

    const hud = document.getElementById("hand-camera-hud");
    const statusEl = document.getElementById("hand-hud-status");
    if (hud) hud.classList.add("open");
    if (statusEl) {
      statusEl.textContent =
        state.lang === "zh"
          ? "正在加载 Google MediaPipe HandLandmarker 模型..."
          : "Loading Google MediaPipe HandLandmarker model...";
    }

    try {
      if (!state.handLandmarker) {
        const visionModule = await import(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14"
        );
        const { FilesetResolver, HandLandmarker } = visionModule;
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        state.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      const video = document.getElementById("hand-webcam-video");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" }
      });
      state.webcamStream = stream;
      video.srcObject = stream;
      await video.play();

      state.handActive = true;
      state.handLoading = false;
      updateHandButtonUI();

      const cursorEl = document.getElementById("hand-virtual-cursor");
      if (cursorEl) cursorEl.classList.add("visible");
      if (statusEl) statusEl.textContent = t("hudDefaultHint");

      requestAnimationFrame(predictWebcamLoop);
    } catch (err) {
      console.error("MediaPipe HandLandmarker error:", err);
      state.handLoading = false;
      state.handActive = false;
      updateHandButtonUI();
      if (statusEl) {
        statusEl.textContent =
          state.lang === "zh"
            ? "无法访问摄像头或加载模型，请检查浏览器摄像头权限。"
            : "Camera access denied or unavailable. Please allow webcam access in Brave.";
      }
    }
  }

  function stopHandGestureControl() {
    state.handActive = false;
    state.handLoading = false;
    if (state.webcamStream) {
      state.webcamStream.getTracks().forEach((track) => track.stop());
      state.webcamStream = null;
    }
    const hud = document.getElementById("hand-camera-hud");
    if (hud) hud.classList.remove("open");
    const cursorEl = document.getElementById("hand-virtual-cursor");
    if (cursorEl) cursorEl.classList.remove("visible");
    clearGestureHover();
    updateHandButtonUI();
  }

  function updateHandButtonUI() {
    const btn = document.getElementById("hand-gesture-toggle-btn");
    const label = document.getElementById("hand-gesture-btn-label");
    if (!btn || !label) return;
    btn.classList.toggle("active", state.handActive);
    if (state.handLoading) {
      label.textContent = t("handBtnLoading");
    } else if (state.handActive) {
      label.textContent = t("handBtnOn");
    } else {
      label.textContent = t("handBtnOff");
    }
  }

  let lastVideoTime = -1;
  function predictWebcamLoop() {
    if (!state.handActive) return;

    const video = document.getElementById("hand-webcam-video");
    const canvas = document.getElementById("hand-landmark-canvas");
    if (!video || !canvas || !state.handLandmarker) {
      requestAnimationFrame(predictWebcamLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    const nowInMs = performance.now();
    if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
      lastVideoTime = video.currentTime;
      const results = state.handLandmarker.detectForVideo(video, nowInMs);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.landmarks && results.landmarks.length > 0) {
        const lm = results.landmarks[0];
        drawHandSkeleton(ctx, lm, canvas.width, canvas.height);
        processHandLandmarks(lm);
      }
    }

    requestAnimationFrame(predictWebcamLoop);
  }

  function drawHandSkeleton(ctx, landmarks, w, h) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 2;
    for (const [i, j] of HAND_CONNECTIONS) {
      const a = landmarks[i];
      const b = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }
    landmarks.forEach((pt, idx) => {
      const isPinchTip = idx === 4 || idx === 8;
      ctx.fillStyle = isPinchTip
        ? state.isPinching
          ? "#28e070"
          : "#e4002b"
        : "#ffffff";
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, isPinchTip ? 5.5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function processHandLandmarks(landmarks) {
    // Landmark 8 = Index Finger Tip, Landmark 4 = Thumb Tip
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    if (!indexTip || !thumbTip) return;

    // Midpoint between thumb tip & index tip for natural aiming
    const rawX = 1 - (indexTip.x * 0.7 + thumbTip.x * 0.3); // Mirrored X
    const rawY = indexTip.y * 0.7 + thumbTip.y * 0.3;

    // Clamp with comfortable camera margin so reaching screen edges is effortless
    const normX = Math.max(0, Math.min(1, (rawX - 0.1) / 0.8));
    const normY = Math.max(0, Math.min(1, (rawY - 0.1) / 0.8));

    const targetX = normX * window.innerWidth;
    const targetY = normY * window.innerHeight;

    // Smooth exponential filter so cursor glides without jitter
    state.cursorX += (targetX - state.cursorX) * 0.32;
    state.cursorY += (targetY - state.cursorY) * 0.32;

    const cursorEl = document.getElementById("hand-virtual-cursor");
    const cursorLabel = document.getElementById("hand-cursor-label");
    if (cursorEl) {
      cursorEl.style.transform = `translate3d(${state.cursorX}px, ${state.cursorY}px, 0)`;
    }

    // Gentle auto-scroll when hand moves near top or bottom of viewport (when not in full-screen modal)
    const lightboxOpen = document
      .getElementById("lightbox-backdrop")
      ?.classList.contains("open");
    if (!lightboxOpen) {
      if (state.cursorY < 75) {
        window.scrollBy({ top: -12, behavior: "auto" });
      } else if (state.cursorY > window.innerHeight - 75) {
        window.scrollBy({ top: 12, behavior: "auto" });
      }
      // Horizontal scroll on character stage when hovering near left/right edges of character parade
      const parade = document.getElementById("character-parade");
      if (parade && state.cursorY < 500) {
        if (state.cursorX < 90) {
          parade.scrollBy({ left: -14, behavior: "auto" });
        } else if (state.cursorX > window.innerWidth - 90) {
          parade.scrollBy({ left: 14, behavior: "auto" });
        }
      }
    }

    // Highlight interactive element underneath the virtual hand cursor
    updateGestureHoverElement(state.cursorX, state.cursorY);

    // 2D distance between Thumb Tip (#4) and Index Finger Tip (#8) in normalized camera space
    const dx = indexTip.x - thumbTip.x;
    const dy = indexTip.y - thumbTip.y;
    const pinchDist = Math.hypot(dx, dy);

    // Two-finger touch threshold (with hysteresis)
    const PINCH_TRIGGER = 0.058;
    const PINCH_RELEASE = 0.082;
    const now = performance.now();

    if (!state.isPinching && pinchDist < PINCH_TRIGGER) {
      state.isPinching = true;
      if (cursorEl) cursorEl.classList.add("pinching");
      if (cursorLabel) {
        cursorLabel.textContent = state.lang === "zh" ? "点击!" : "Click!";
      }
      if (now - state.lastPinchTime > 480) {
        state.lastPinchTime = now;
        triggerVirtualClick(state.cursorX, state.cursorY);
      }
    } else if (state.isPinching && pinchDist > PINCH_RELEASE) {
      state.isPinching = false;
      if (cursorEl) cursorEl.classList.remove("pinching");
      if (cursorLabel) {
        cursorLabel.textContent = state.lang === "zh" ? "移动" : "Move";
      }
    }
  }

  function findInteractiveTarget(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return (
      el.closest(
        "button, a, .artist-character-node, .artwork-card, .wing-card, input"
      ) || el
    );
  }

  function clearGestureHover() {
    if (state.hoveredElement) {
      state.hoveredElement.classList.remove("gesture-hover");
      state.hoveredElement = null;
    }
  }

  function updateGestureHoverElement(x, y) {
    const target = findInteractiveTarget(x, y);
    if (target === state.hoveredElement) return;
    clearGestureHover();
    if (target && target.classList) {
      target.classList.add("gesture-hover");
      state.hoveredElement = target;

      // If hovering over an artist head in the hero stage, show their speech bubble!
      if (target.classList.contains("artist-character-node")) {
        const artistId = target.id.replace("char-node-", "");
        if (artistId && state.speakingArtistId !== artistId) {
          state.speakingArtistId = artistId;
          document.querySelectorAll(".artist-character-node").forEach((node) => {
            node.classList.toggle("is-speaking", node === target);
          });
        }
      }
    }
  }

  function triggerVirtualClick(x, y) {
    const target = findInteractiveTarget(x, y);
    if (!target) return;
    target.click();
  }

  // ==========================================================================
  // Navigation & State Updaters
  // ==========================================================================
  function selectArtist(artistId, scrollToGallery) {
    state.selectedArtistId = artistId;
    if (artistId !== "all") {
      state.speakingArtistId = artistId;
    }
    renderCharacterParade();
    renderStickyAvatarStrip();
    renderArtistStudioBanner();
    renderArtworksGrid();

    if (scrollToGallery) {
      const target = document.getElementById("museum-main-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function updateStaticCopy() {
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt("stage-title-text", t("stageTitle"));
    setTxt("stage-subtitle-text", t("stageSubtitle"));
    setTxt("nav-pill-stage", t("navStage"));
    setTxt("nav-pill-gallery", t("navGallery"));
    setTxt("nav-pill-immersive", t("navImmersive"));
    setTxt("nav-pill-wings", t("navWings"));
    setTxt("start-immersive-tour-btn", t("immersiveHeroBtn"));
    setTxt("enter-gallery-btn", t("enterBtn"));
    setTxt("stage-credit-sub", t("creditSub"));
    setTxt("color-filter-label", t("colorFilterLabel"));
    setTxt("wings-section-heading", t("wingsHeading"));
    setTxt("wings-section-sub", t("wingsSub"));
    setTxt("immersive-fullscreen-btn", t("fullScreenBtn"));
    setTxt("immersive-info-toggle-btn", t("specsBtn"));
    setTxt("hand-hud-status", t("hudDefaultHint"));

    updateHandButtonUI();

    const searchInput = document.getElementById("museum-search-input");
    if (searchInput) {
      searchInput.placeholder = t("searchPlaceholder");
    }

    const langEn = document.getElementById("lang-en");
    const langZh = document.getElementById("lang-zh");
    if (langEn && langZh) {
      langEn.classList.toggle("active-lang", state.lang === "en");
      langZh.classList.toggle("active-lang", state.lang === "zh");
    }
  }

  function renderAll() {
    updateStaticCopy();
    renderCharacterParade();
    renderStickyAvatarStrip();
    renderArtistStudioBanner();
    renderArtworksGrid();
    renderWingsSection();
  }

  // ==========================================================================
  // Event Listeners & Initialization
  // ==========================================================================
  function initEvents() {
    // Language toggle (EN / 中文)
    const langBtn = document.getElementById("lang-switch-btn");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        state.lang = state.lang === "en" ? "zh" : "en";
        renderAll();
        if (
          document.getElementById("lightbox-backdrop")?.classList.contains("open") &&
          state.lightboxArtwork &&
          state.lightboxArtist
        ) {
          renderImmersiveDocent(state.lightboxArtwork, state.lightboxArtist, true);
          renderImmersiveSpecsDrawer(state.lightboxArtwork, state.lightboxArtist);
        }
      });
    }

    // Hand Gesture Control button & HUD close button
    document
      .getElementById("hand-gesture-toggle-btn")
      ?.addEventListener("click", toggleHandGestureControl);
    document
      .getElementById("hand-hud-close-btn")
      ?.addEventListener("click", stopHandGestureControl);

    // Parade horizontal scroll buttons
    const prevBtn = document.getElementById("parade-prev-btn");
    const nextBtn = document.getElementById("parade-next-btn");
    const parade = document.getElementById("character-parade");
    if (prevBtn && parade) {
      prevBtn.addEventListener("click", () => {
        parade.scrollBy({ left: -340, behavior: "smooth" });
      });
    }
    if (nextBtn && parade) {
      nextBtn.addEventListener("click", () => {
        parade.scrollBy({ left: 340, behavior: "smooth" });
      });
    }

    // Full-Screen Tour buttons (in top nav and hero bar)
    const launchImmersiveTour = () => {
      if (state.filteredPairs.length > 0) {
        state.lightboxIndex = 0;
        const first = state.filteredPairs[0];
        openLightbox(first.artwork, first.artist, true);
      }
    };
    document
      .getElementById("nav-pill-immersive")
      ?.addEventListener("click", launchImmersiveTour);
    document
      .getElementById("start-immersive-tour-btn")
      ?.addEventListener("click", launchImmersiveTour);

    // Enter Gallery button
    const enterBtn = document.getElementById("enter-gallery-btn");
    if (enterBtn) {
      enterBtn.addEventListener("click", () => {
        const mainSec = document.getElementById("museum-main-section");
        if (mainSec) mainSec.scrollIntoView({ behavior: "smooth" });
      });
    }

    // Top nav pills
    document.getElementById("nav-pill-stage")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.getElementById("nav-pill-gallery")?.addEventListener("click", () => {
      document.getElementById("museum-main-section")?.scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("nav-pill-wings")?.addEventListener("click", () => {
      document.getElementById("wings-overview-section")?.scrollIntoView({ behavior: "smooth" });
    });

    // Search input
    const searchInput = document.getElementById("museum-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        renderArtworksGrid();
      });
    }

    // Color palette filter dots
    document.querySelectorAll(".color-dot-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeColorFilter = btn.getAttribute("data-color") || "all";
        document.querySelectorAll(".color-dot-btn").forEach((b) => {
          b.classList.toggle("active", b === btn);
        });
        renderArtworksGrid();
      });
    });

    // Full-screen immersive stage controls
    document
      .getElementById("lightbox-close-btn")
      ?.addEventListener("click", closeLightbox);
    document
      .getElementById("immersive-prev-btn")
      ?.addEventListener("click", () => stepLightboxArtwork(-1));
    document
      .getElementById("immersive-next-btn")
      ?.addEventListener("click", () => stepLightboxArtwork(1));
    document
      .getElementById("immersive-fullscreen-btn")
      ?.addEventListener("click", toggleNativeFullscreen);
    document
      .getElementById("immersive-info-toggle-btn")
      ?.addEventListener("click", (e) => {
        state.specsDrawerOpen = !state.specsDrawerOpen;
        document
          .getElementById("lightbox-details-pane")
          ?.classList.toggle("open", state.specsDrawerOpen);
        e.currentTarget.classList.toggle("active", state.specsDrawerOpen);
      });

    // Lightbox zoom controls
    document.querySelectorAll(".zoom-btn[data-zoom]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.zoomLevel = parseFloat(btn.getAttribute("data-zoom")) || 1;
        if (state.zoomLevel === 1) {
          state.panX = 0;
          state.panY = 0;
        }
        applyZoomTransform();
        updateZoomButtons();
      });
    });

    // Lightbox drag-to-pan when zoomed
    const stage = document.getElementById("lightbox-stage");
    if (stage) {
      stage.addEventListener("mousedown", (e) => {
        if (state.zoomLevel <= 1) return;
        state.isDraggingZoom = true;
        state.dragStartX = e.clientX - state.panX;
        state.dragStartY = e.clientY - state.panY;
      });
      window.addEventListener("mousemove", (e) => {
        if (!state.isDraggingZoom) return;
        state.panX = e.clientX - state.dragStartX;
        state.panY = e.clientY - state.dragStartY;
        applyZoomTransform();
      });
      window.addEventListener("mouseup", () => {
        state.isDraggingZoom = false;
      });
    }

    // Keyboard shortcuts in full-screen immersive theatre
    window.addEventListener("keydown", (e) => {
      const isOpen = document
        .getElementById("lightbox-backdrop")
        ?.classList.contains("open");
      if (!isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepLightboxArtwork(1);
      if (e.key === "ArrowLeft") stepLightboxArtwork(-1);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    renderAll();
  });
})();
