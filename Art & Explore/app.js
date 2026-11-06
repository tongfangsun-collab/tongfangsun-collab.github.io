// ============================================================================
// Art & Explore — Interactive Gallery Engine (app.js)
// Combines the "After Hours" Artist Character Stage with Google Arts & Culture
// pigment exploration, live Met Open Access API enrichment, and deep-zoom.
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
    lightboxArtwork: null,
    lightboxArtist: null,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDraggingZoom: false,
    dragStartX: 0,
    dragStartY: 0
  };

  // Cache for live Met API image lookups in the browser
  const metApiImageCache = new Map();

  // UI Copy Dictionary (Bilingual EN / 中文)
  const UI_COPY = {
    en: {
      stageTitle: "Art & Explore · After Hours",
      stageSubtitle: "The Met Fifth Avenue has closed for the night — stroll the galleries and chat with the 10 masters.",
      navStage: "Character Stage",
      navGallery: "Masterpieces (61)",
      navWings: "Met Floor Wings",
      enterBtn: "Enter Gallery →",
      creditSub: "Top 10 Artists · 61 Masterpieces · New York Metropolitan Museum of Art",
      allArtistsChip: "All 10 Met Masters (61)",
      searchPlaceholder: "Search paintings, galleries, motifs...",
      colorFilterLabel: "Pigment Palette:",
      allWorksHeading: "Curated Masterpieces at The Met",
      worksCountSuffix: "artworks on view",
      askArtistBtn: "💬 Ask Artist",
      inspectZoomBadge: "🔍 Zoom & Inspect",
      chatHeaderTag: "After Hours Studio Chat",
      promptFav: "✨ Which Met work is your favorite?",
      promptTech: "🎨 Secret of your brushwork?",
      promptSecret: "🤫 Tell me a hidden museum story!",
      wingsHeading: "Explore The Met Fifth Avenue by Wing",
      wingsSub: "Click any curatorial department to filter artists and galleries.",
      specArtist: "Artist",
      specDate: "Date",
      specMedium: "Medium",
      specDimensions: "Dimensions",
      specGallery: "Met Location",
      specAccession: "Accession No.",
      specPalette: "Pigments",
      listenAudioBtn: "🔊 Audio Guide",
      stopAudioBtn: "⏹ Stop Audio",
      viewOnMetBtn: "View on The Met ↗",
      viewOnGacBtn: "Google Arts & Culture ↗"
    },
    zh: {
      stageTitle: "Art & Explore · 美术馆夜游",
      stageSubtitle: "纽约大都会艺术博物馆打烊了，和 10 位馆藏艺术大师一起逛展唠嗑",
      navStage: "艺术家剧场",
      navGallery: "馆藏杰作 (61)",
      navWings: "大都会展厅导览",
      enterBtn: "进入展厅 →",
      creditSub: "纽约大都会艺术博物馆 · 10大巨匠 · 61件镇馆名作",
      allArtistsChip: "全部 10 位馆藏大师 (61)",
      searchPlaceholder: "搜索画作名称、展厅、题材...",
      colorFilterLabel: "色彩色谱筛选:",
      allWorksHeading: "大都会馆藏传世杰作",
      worksCountSuffix: "件馆藏作品",
      askArtistBtn: "💬 听画家聊这幅画",
      inspectZoomBadge: "🔍 高清放大细赏",
      chatHeaderTag: "美术馆打烊后 · 与画家唠嗑",
      promptFav: "✨ 您最偏爱大都会哪幅画？",
      promptTech: "🎨 您的独家笔触秘诀是什么？",
      promptSecret: "🤫 讲个画布背后的隐藏八卦！",
      wingsHeading: "按大都会第五大道展翼探索",
      wingsSub: "点击任一策展部门筛选对应展厅的大师与画作。",
      specArtist: "艺术家",
      specDate: "创作年代",
      specMedium: "材质媒介",
      specDimensions: "作品尺寸",
      specGallery: "大都会展厅",
      specAccession: "馆藏编号",
      specPalette: "提取色谱",
      listenAudioBtn: "🔊 语音导览",
      stopAudioBtn: "⏹ 停止播报",
      viewOnMetBtn: "大都会官网详情 ↗",
      viewOnGacBtn: "Google 艺术与文化 ↗"
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
    const w = (canvas.width = 480);
    const h = (canvas.height = 360);
    const pal = artwork.palette || ["#3a6ea5", "#e3b448", "#2d4c39", "#d89c52", "#181818"];

    // Deterministic pseudo-random generator seeded by artwork.id
    let seed = 0;
    for (let i = 0; i < artwork.id.length; i++) {
      seed = (seed * 31 + artwork.id.charCodeAt(i)) & 0x7fffffff;
    }
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 10000) / 10000;
    };

    // Base gradient background from palette
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, pal[0]);
    grad.addColorStop(0.55, pal[1] || pal[0]);
    grad.addColorStop(1, pal[2] || pal[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const motif = artwork.motif || "";

    // Painterly texture strokes based on artist movement
    if (artist.id === "van-gogh") {
      // Swirling Post-Impressionist impasto dashes
      for (let i = 0; i < 240; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const angle = Math.sin(x * 0.015) * 0.7 + Math.cos(y * 0.02) * 0.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.roundRect(-14, -4, 28, 8, 4);
        ctx.fill();
        ctx.restore();
      }
      if (motif.includes("cypress")) {
        // Golden wheat field at bottom + dark obelisk cypresses
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
          ctx.arc(fx, fy, 26 + rand() * 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = pal[1];
          ctx.beginPath();
          ctx.arc(fx, fy, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (artist.id === "monet") {
      // Horizontal shimmering Impressionist water & sky dabs
      for (let i = 0; i < 320; i++) {
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
        ctx.globalAlpha = 0.58;
        ctx.beginPath();
        ctx.ellipse(x, y, 16 + rand() * 14, 4 + rand() * 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (motif.includes("bridge")) {
        // Japanese footbridge arch
        ctx.strokeStyle = "#d8e6d0";
        ctx.lineWidth = 10;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.82, w * 0.48, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();
      }
    } else if (artist.id === "hokusai") {
      // Crisp Edo woodblock horizon + Mount Fuji cone + wave foam
      ctx.fillStyle = "#f2ead8";
      ctx.globalAlpha = 0.92;
      ctx.fillRect(0, 0, w, h * 0.62);
      // Mount Fuji silhouette
      ctx.fillStyle = motif.includes("red-fuji") ? "#b8422b" : "#1b3b6f";
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.78);
      ctx.quadraticCurveTo(w * 0.45, h * 0.65, w * 0.54, h * 0.34);
      ctx.lineTo(w * 0.62, h * 0.34);
      ctx.quadraticCurveTo(w * 0.72, h * 0.65, w * 0.95, h * 0.78);
      ctx.closePath();
      ctx.fill();
      // Snow cap
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
        ctx.arc(w * 0.32, h * 0.52, 110, Math.PI * 0.7, Math.PI * 1.95);
        ctx.lineTo(w * 0.55, h * 0.85);
        ctx.lineTo(0, h * 0.85);
        ctx.fill();
      }
    } else if (artist.id === "rembrandt" || artist.id === "vermeer" || artist.id === "sargent") {
      // Dramatic chiaroscuro / portrait lighting glow
      ctx.fillStyle = pal[0];
      ctx.globalAlpha = 0.95;
      ctx.fillRect(0, 0, w, h);
      const rad = ctx.createRadialGradient(w * 0.48, h * 0.4, 15, w * 0.48, h * 0.45, w * 0.46);
      rad.addColorStop(0, pal[1]);
      rad.addColorStop(0.5, pal[2] || pal[1]);
      rad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);
      // Portrait silhouette
      ctx.fillStyle = pal[3] || "#d9c29c";
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.arc(w * 0.48, h * 0.36, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal[1];
      ctx.beginPath();
      ctx.ellipse(w * 0.48, h * 0.78, 78, 92, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      // Geometric planes & expressive brushwork for Cézanne, Degas, Cassatt, Homer
      for (let i = 0; i < 160; i++) {
        ctx.save();
        ctx.translate(rand() * w, rand() * h);
        ctx.rotate((rand() - 0.5) * 1.2);
        ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
        ctx.globalAlpha = 0.62;
        ctx.fillRect(-24, -14, 48, 28);
        ctx.restore();
      }
    }

    // Subtle canvas weave & vignette frame
    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.65);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(18,16,14,0.28)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // ==========================================================================
  // Live Met Collection API Image Enricher (Client-side progressive enhancement)
  // ==========================================================================
  async function enrichArtworkImage(artwork, imgEl) {
    if (!imgEl || !artwork.objectId) return;

    // First try direct imageUrl if present
    if (artwork.imageUrl) {
      imgEl.src = artwork.imageUrl;
    }

    imgEl.onload = () => {
      imgEl.classList.add("loaded");
    };

    imgEl.onerror = async () => {
      // Fallback: query official Met Collection Open Access API for primaryImageSmall
      if (metApiImageCache.has(artwork.objectId)) {
        const cachedUrl = metApiImageCache.get(artwork.objectId);
        if (cachedUrl && imgEl.src !== cachedUrl) {
          imgEl.src = cachedUrl;
        }
        return;
      }
      try {
        const res = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${artwork.objectId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const apiImg = data.primaryImageSmall || data.primaryImage;
        if (apiImg) {
          metApiImageCache.set(artwork.objectId, apiImg);
          imgEl.src = apiImg;
        }
      } catch (_) {
        // Offline or blocked by sandbox CSP: the bespoke painted canvas remains visible!
      }
    };
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
  // 1. Render "After Hours" Hero Character Stage
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

      node.innerHTML = `
        <div class="speech-bubble">
          <span class="speech-bubble-name">${artist.bubbleName}</span>
          <span class="speech-bubble-quote">${bubbleQuote}</span>
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
        </div>
      `;

      node.addEventListener("mouseenter", () => {
        state.speakingArtistId = artist.id;
        document.querySelectorAll(".artist-character-node").forEach((el) => {
          el.classList.toggle("is-speaking", el.id === `char-node-${artist.id}`);
        });
      });

      node.addEventListener("click", () => {
        selectArtist(artist.id, true);
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
  // 3. Render Artist Studio Banner ("After Hours Chat")
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
              <button class="chat-prompt-chip" data-prompt="favorite">${t("promptFav")}</button>
              <button class="chat-prompt-chip" data-prompt="technique">${t("promptTech")}</button>
              <button class="chat-prompt-chip" data-prompt="secret">${t("promptSecret")}</button>
            </div>
          </div>
        </div>
      </section>
    `;

    host.querySelectorAll(".chat-prompt-chip").forEach((chip) => {
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
      });
    });
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

    pairs.forEach(({ artist, artwork }) => {
      const card = document.createElement("article");
      card.className = "artwork-card";
      card.id = `artwork-card-${artwork.id}`;

      const title = state.lang === "zh" ? artwork.titleZh : artwork.titleEn;
      const artistName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
      const medium = state.lang === "zh" ? artwork.mediumZh : artwork.mediumEn;
      const story = state.lang === "zh" ? artwork.storyZh : artwork.storyEn;

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
          <p class="artwork-story-snippet">${story}</p>
          <div class="artwork-card-footer">
            <button class="ask-artist-mini-btn" type="button">${t("askArtistBtn")}</button>
            <span class="met-accession">Met #${artwork.accession}</span>
          </div>
        </div>
      `;

      const canvas = card.querySelector(".artwork-canvas-fallback");
      drawMasterpieceCanvas(canvas, artwork, artist);

      const imgEl = card.querySelector(".artwork-real-img");
      enrichArtworkImage(artwork, imgEl);

      // Clicking "Ask Artist" updates the studio chat banner with the artist's voice on this painting
      const askBtn = card.querySelector(".ask-artist-mini-btn");
      askBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.speakingArtistId = artist.id;
        if (state.selectedArtistId !== "all" && state.selectedArtistId !== artist.id) {
          state.selectedArtistId = artist.id;
          renderStickyAvatarStrip();
        }
        renderArtistStudioBanner();
        const msgEl = document.getElementById("studio-chat-message");
        if (msgEl) {
          const voice =
            state.lang === "zh" ? artwork.artistVoiceZh : artwork.artistVoiceEn;
          msgEl.textContent = `【${title}】 "${voice}"`;
        }
        const banner = document.getElementById("artist-studio-banner");
        if (banner) {
          banner.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });

      card.addEventListener("click", () => {
        openLightbox(artwork, artist);
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
  // 6. Deep-Zoom Lightbox Modal + Audio Guide
  // ==========================================================================
  function openLightbox(artwork, artist) {
    state.lightboxArtwork = artwork;
    state.lightboxArtist = artist;
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;

    const backdrop = document.getElementById("lightbox-backdrop");
    const zoomWrap = document.getElementById("lightbox-zoom-container");
    const detailsPane = document.getElementById("lightbox-details-pane");
    if (!backdrop || !zoomWrap || !detailsPane) return;

    zoomWrap.innerHTML = "";
    zoomWrap.style.transform = "translate(0px, 0px) scale(1)";

    // Render high-res canvas fallback + real image in lightbox
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
    const cached = metApiImageCache.get(artwork.objectId);
    img.src = cached || artwork.imageUrl || "";
    zoomWrap.appendChild(img);

    const title = state.lang === "zh" ? artwork.titleZh : artwork.titleEn;
    const artistName = state.lang === "zh" ? artist.nameZh : artist.nameEn;
    const medium = state.lang === "zh" ? artwork.mediumZh : artwork.mediumEn;
    const story = state.lang === "zh" ? artwork.storyZh : artwork.storyEn;
    const voice =
      state.lang === "zh" ? artwork.artistVoiceZh : artwork.artistVoiceEn;

    const paletteDots = (artwork.palette || [])
      .map(
        (hex) =>
          `<span title="${hex}" style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${hex};border:1px solid #ddd;margin-right:6px;vertical-align:middle;"></span>`
      )
      .join("");

    const gacQuery = encodeURIComponent(`${artwork.titleEn} ${artist.nameEn} Metropolitan Museum of Art`);

    detailsPane.innerHTML = `
      <button class="lightbox-close-btn" id="lightbox-close-btn" aria-label="Close">✕</button>
      <div>
        <span class="wing-floor-tag">The Metropolitan Museum of Art · ${artwork.gallery}</span>
        <h2 class="studio-artist-title" style="margin-top:6px;font-size:2rem;">${title}</h2>
      </div>
      <div class="lightbox-artist-speaking">
        <img src="${artist.avatar}" alt="${artistName}" />
        <div>
          <strong style="font-size:0.82rem;color:var(--met-crimson);display:block;margin-bottom:4px;">
            ${artist.bubbleName}
          </strong>
          <p class="lightbox-artist-quote">"${voice}"</p>
        </div>
      </div>
      <p style="font-size:0.94rem;color:var(--text-secondary);line-height:1.65;">${story}</p>
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
        <span class="spec-value">${artwork.accession} (Object ID: ${artwork.objectId})</span>
        <span class="spec-label">${t("specPalette")}</span>
        <span class="spec-value">${paletteDots}</span>
      </div>
      <div class="lightbox-external-links">
        <button type="button" class="ext-link-btn ext-link-secondary" id="audio-guide-btn">
          ${t("listenAudioBtn")}
        </button>
        <a href="${artwork.metUrl}" target="_blank" rel="noopener noreferrer" class="ext-link-btn ext-link-primary">
          ${t("viewOnMetBtn")}
        </a>
        <a href="https://artsandculture.google.com/search?q=${gacQuery}" target="_blank" rel="noopener noreferrer" class="ext-link-btn ext-link-secondary">
          ${t("viewOnGacBtn")}
        </a>
      </div>
    `;

    document.getElementById("lightbox-close-btn").addEventListener("click", closeLightbox);

    const audioBtn = document.getElementById("audio-guide-btn");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        toggleAudioGuide(`${title}. ${artistName}. ${voice} ${story}`, audioBtn);
      });
    }

    updateZoomButtons();
    backdrop.classList.add("open");
  }

  function closeLightbox() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const backdrop = document.getElementById("lightbox-backdrop");
    if (backdrop) backdrop.classList.remove("open");
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

  function toggleAudioGuide(text, btnEl) {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      btnEl.textContent = t("listenAudioBtn");
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = state.lang === "zh" ? "zh-CN" : "en-US";
    utter.rate = 0.96;
    utter.onend = () => {
      btnEl.textContent = t("listenAudioBtn");
    };
    btnEl.textContent = t("stopAudioBtn");
    window.speechSynthesis.speak(utter);
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
    setTxt("nav-pill-wings", t("navWings"));
    setTxt("enter-gallery-btn", t("enterBtn"));
    setTxt("stage-credit-sub", t("creditSub"));
    setTxt("color-filter-label", t("colorFilterLabel"));
    setTxt("wings-section-heading", t("wingsHeading"));
    setTxt("wings-section-sub", t("wingsSub"));

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
      });
    }

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

    // Enter Gallery button (matches "进入 ->" in reference screenshot)
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

    // Close lightbox on Escape or backdrop click
    const backdrop = document.getElementById("lightbox-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeLightbox();
      });
    }
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    renderAll();
  });
})();
