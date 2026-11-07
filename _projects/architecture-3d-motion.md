---
layout: default
title: Architecture 3D Motion — Sydney Opera House Deconstruction
excerpt: Interactive 3D architectural deconstruction and dynamic exploded view of Jørn Utzon's Sydney Opera House with scroll-controlled assembly and technical structural inspection.
color: "#0b0d11"
---

<article class="project-detail architecture-project-page">
  <!-- Header -->
  <header class="muse-detail-header" style="margin-bottom: 24px;">
    <div class="muse-award-pill-row">
      <span class="award-role-pill" style="background: rgba(0, 229, 255, 0.15); color: #00e5ff; border: 1px solid rgba(0, 229, 255, 0.3);">
        📐 Architecture &amp; Creative Tech · 2026
      </span>
      <span class="award-cat-pill">Three.js · WebGL · 3D Motion</span>
      <span class="award-role-pill">Exploded Axonometric</span>
    </div>
    <h1 class="muse-detail-title">Architecture 3D Motion: Sydney Opera House</h1>
    <p class="muse-detail-lead">
      An interactive 3D architectural deconstruction exploring the 8 structural layers of Jørn Utzon and Ove Arup's landmark Sydney Opera House. Scroll wheel up to deconstruct into an exploded axonometric stack with load-path vectors; scroll down to seamlessly assemble the building back into its Bennelong Point harbour context.
    </p>

    <div class="muse-external-actions" style="margin-top: 20px;">
      <a href="{{ '/Architecture%203D%20Motion/' | relative_url }}" class="btn-pill-black" style="background: #00e5ff; color: #0b0d11; font-weight: 700;">
        Launch Interactive 3D Experience ↗
      </a>
      <a href="{{ '/Architecture%203D%20Motion/assets/sydney_opera_house_exploded_axonometric.jpg' | relative_url }}" target="_blank" rel="noopener noreferrer" class="btn-pill-outline">
        View Full Axonometric Blueprint ↗
      </a>
    </div>
  </header>

  <!-- Interactive 3D Embed or Hero Preview -->
  <section class="framer-project-block" style="margin-bottom: 48px;">
    <div class="framer-showcase-card" style="padding: 0; overflow: hidden; background: #0b0d11; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px;">
      <a href="{{ '/Architecture%203D%20Motion/' | relative_url }}" title="Launch Fullscreen 3D Motion Experience">
        <img
          src="{{ '/Architecture%203D%20Motion/assets/cover_architecture_3d_motion.jpg' | relative_url }}"
          alt="Sydney Opera House 3D Deconstruction Preview"
          style="width: 100%; height: auto; display: block;"
        />
      </a>
    </div>
  </section>

  <!-- Key Architectural Concepts -->
  <section class="muse-content-body" style="max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 36px;">

    <div>
      <h2 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 12px; color: var(--text-color);">
        Motion Mechanics: Scroll-Driven Architectural Assembly
      </h2>
      <p style="font-size: 1.05rem; line-height: 1.7; color: var(--secondary-text);">
        Architecture is rarely static when analyzed as an engineering system. In this interactive WebGL experience, the mouse wheel acts as a physical controller for structural assembly:
      </p>
      <ul style="margin-top: 14px; padding-left: 20px; font-size: 1rem; line-height: 1.8; color: var(--secondary-text);">
        <li><strong>Scroll Wheel Up (▴):</strong> Separates the building vertically into its 8 distinct structural tiers—revealing the hidden interior backstage machinery, acoustic seating bowls, fan radial rib arches, and the precast spherical roof shells. Dynamic load-transmission lines stretch between components.</li>
        <li><strong>Click to Inspect:</strong> Clicking any separated component opens a detailed technical drawer with material specifications, structural roles, and historical drawings in English.</li>
        <li><strong>Scroll Wheel Down (▾):</strong> Smoothly contracts the layers back into alignment, snapping the shells onto the podium and restoring the animated Sydney Harbour waters, passing ferries, and urban skyline context.</li>
      </ul>
    </div>

    <!-- 8 Structural Layers Overview -->
    <div>
      <h2 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 16px; color: var(--text-color);">
        The 8 Structural Layers
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">08 · Precast Shell Roofs</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">1,056,006 Swedish Höganäs tiles covering spherical vaults derived from a single 75m radius sphere.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">07 · Concrete Rib Arches</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">Radial precast rib arches post-tensioned on site, transferring thrust down to foundation thrust blocks.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">06 · Stages &amp; Fly Towers</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">Dual stage machinery, scenery elevators, counterweight fly lofts, and acoustic proscenium reflectors.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">05 · Concert &amp; Opera Halls</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">Steeply raked continental seating tiers with white birch acoustic clouds and custom magenta upholstery.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">04 · Grand Public Foyers</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">Sweeping circulation galleries and northern harbour lounges cantilevered out over the water.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">03 · Bronze Glass Facades</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">Folded prismatic bronze-tinted glass curtain walls designed by Peter Hall, suspended without columns.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">02 · Monumental Podium</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">100m wide monumental stairs and granite-clad platform concealing all backstage services.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #00e5ff; margin-bottom: 6px;">01 · Harbour Context</h3>
          <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">Bennelong Point promontory with 588 foundation caissons sunk 25m into Hawkesbury sandstone bedrock.</p>
        </div>
      </div>
    </div>

    <!-- Utzon's 1962 Cross Section Drawing -->
    <div style="margin-top: 10px;">
      <h2 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 12px; color: var(--text-color);">
        Historical Context: Utzon's 1962 Yellow Book
      </h2>
      <p style="font-size: 1.05rem; line-height: 1.7; color: var(--secondary-text); margin-bottom: 16px;">
        In January 1962, Jørn Utzon submitted his historic 38-page report, known as the "Yellow Book", containing detailed geometric proofs of the Spherical Solution, precast rib segments, and tiling layouts.
      </p>
      <img
        src="{{ '/Architecture%203D%20Motion/assets/utzon_yellow_book_cross_section_1962.jpg' | relative_url }}"
        alt="Utzon 1962 Yellow Book Section"
        style="width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);"
      />
    </div>

    <!-- Actions CTA -->
    <div style="text-align: center; padding: 40px 0;">
      <a href="{{ '/Architecture%203D%20Motion/' | relative_url }}" class="btn-pill-black" style="background: #00e5ff; color: #0b0d11; font-weight: 700; font-size: 1.05rem; padding: 14px 28px;">
        Open 3D Motion Deconstruction Viewer →
      </a>
    </div>

  </section>
</article>
