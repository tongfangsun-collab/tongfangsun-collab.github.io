---
layout: post
title: "How I Built an Interactive 3D Sydney Opera House with Antigravity"
subtitle: "From Jørn Utzon’s 1962 Yellow Book to a 229,647-triangle Blender 4.5 model controlled by your bare hands in WebGL — a product designer’s workflow with Antigravity."
date: 2026-11-22
author: Tong Fang Sun
kicker: Design Lab · Behind the Build
read_time: 7 min read
tags:
  - Antigravity
  - Three.js
  - MediaPipe
  - Creative Coding
  - AI + UX
cover_image: /Architecture%203D%20Motion/assets/cover_architecture_3d_motion.jpg
cover_alt: Sydney Opera House — Interactive 3D Architectural Deconstruction built with Antigravity
cover_caption: "The finished Architecture 3D Motion experience: 8 separable structural tiers rendered in real-time WebGL over Bennelong Point."
demo_url: /Architecture%203D%20Motion/
excerpt: "How I partnered with Antigravity as a product designer to turn Jørn Utzon’s Sydney Opera House into an 8-layer exploded 3D WebGL experience with a 229k-triangle Blender mesh and MediaPipe hand gesture control."
---

I have always been fascinated by architectural exploded axonometrics—the kind of drawings where a building lifts gently apart along a vertical axis so you can see how the roof shells, rib arches, concert halls, and foundation podium actually hold each other up.

The problem is that on paper, an exploded diagram is frozen. You can’t rotate it, you can’t collapse it back into its harbour context, and you certainly can’t reach into the air and pull the building apart with your own hands.

When I started **[Architecture 3D Motion]({{ '/Architecture%203D%20Motion/' | relative_url }})**, I wanted to turn Jørn Utzon and Ove Arup’s Sydney Opera House into a living, touchless architectural instrument right inside my GitHub Pages portfolio. As a product designer, my strength is interaction craft, spatial hierarchy, and visual storytelling—not hand-writing 1,500 lines of Three.js buffer geometry loaders and MediaPipe gesture math from scratch.

So I built the entire project collaboratively with **Antigravity**. Here is the exact four-stage workflow that took it from a rough architectural sketch to a 229,647-triangle, hand-tracked WebGL experience.

---

## Stage 1: Briefing Antigravity Like a Design Partner, Not a Code Generator

The biggest mistake designers make with AI coding agents is asking for "a 3D website." You get generic cubes and spinning spheres.

Instead, I treated Antigravity like a senior creative technologist sitting next to me at a studio desk. I started by anchoring the project in **real architectural structure**: Jørn Utzon’s 1962 *Yellow Book* and Ove Arup’s engineering archives, broken into **8 distinct vertical layers**—from the Bennelong Point harbour site (`01`) and monumental podium (`02`), up through bronze glass curtain walls (`03`), harbour foyers (`04`), auditoriums (`05`), stage machinery (`06`), fan radial concrete rib arches (`07`), and finally the 75-metre spherical shell roofs (`08`).

<div class="prompt-callout">
  <div class="prompt-callout-label">How I Framed the First Brief in Antigravity</div>
  <p>“Build an interactive 3D architectural deconstruction of the Sydney Opera House in Three.js. Scrolling the mouse wheel up should separate the building vertically into 8 structural tiers with dynamic load-path vectors connecting them. Scrolling down reassembles the shells onto the podium in Sydney Harbour. Clicking any layer opens an engineering inspection drawer with materials, load transmission, and historical blueprints.”</p>
</div>

Within the first iteration, Antigravity scaffolded the entire WebGL architecture—`index.html`, `style.css`, `data.js`, and `app.js`—wired up OrbitControls with damped inertia, built the 0%–100% scroll-scrubbed explosion engine, and generated floating 2D-projected layer pins so every structural tier stayed legible in 3D space.

<div class="medium-diptych">
  <figure>
    <img src="{{ '/Architecture%203D%20Motion/assets/utzon_yellow_book_cross_section_1962.jpg' | relative_url }}" alt="Jørn Utzon 1962 Yellow Book Cross Section" loading="lazy" />
    <figcaption>Architectural reference: Jørn Utzon’s 1962 Yellow Book section.</figcaption>
  </figure>
  <figure>
    <img src="{{ '/Architecture%203D%20Motion/assets/sydney_opera_house_exploded_axonometric.jpg' | relative_url }}" alt="Exploded Axonometric Reference" loading="lazy" />
    <figcaption>Target composition: 8-tier vertical exploded axonometric hierarchy.</figcaption>
  </figure>
</div>

> When you give an agentic tool a clear interaction grammar—what happens at 0%, what happens at 100%, and what each click reveals—it stops guessing and starts engineering toward your design intent.

---

## Stage 2: Breaking Past the “Procedural Look” with a 229,647-Triangle Blender 4.5 Model

The first working prototype proved the motion felt great, but looking closely at the sails, I could still tell they were procedural WebGL approximations. Real architectural storytelling lives in silhouette accuracy—the exact curvature of the spherical vaults, the chevron ribs underneath, and the stepped granite podium.

So in the second milestone, I brought in an authentic **Blender 4.5** architectural model—**229,647 triangles** cleanly separated into our 8 structural layers—and asked Antigravity to upgrade the rendering pipeline without sacrificing GitHub Pages load speed.

Instead of shipping a bloated raw text mesh, we structured the geometry into a compact manifest (`soh_blender_mesh.json`) paired with a 4.1 MB raw binary vertex buffer (`soh_blender_mesh.bin`), streamed directly into `THREE.BufferGeometry` at runtime.

```javascript
// Exploded vertical offsets (in world units) for all 8 Blender 4.5 layers
const LAYER_EXPLODED_Y = {
  1: -2.8,  // 01 Harbour Waterfront & Site
  2:  0.0,  // 02 Monumental Podium (Anchor)
  3:  4.6,  // 03 Bronze Glass Curtain Walls
  4:  9.2,  // 04 Harbour Foyers & Lounges
  5: 14.2,  // 05 Concert Hall & Opera Auditoriums
  6: 19.6,  // 06 Stages & Fly Tower Machinery
  7: 25.8,  // 07 Fan Radial Concrete Rib Arches
  8: 33.2   // 08 Precast Spherical Shell Roofs
};
```

On top of the raw Blender geometry, Antigravity helped me layer three visual details that made the model feel like an architectural studio render:

- **Procedural Swedish Höganäs Tile Texture**: A canvas-generated normal/albedo pattern replicating the iconic 1,056,006 gloss-white and matte-cream chevron ceramic tiles.
- **ACES Filmic Tone Mapping & Harbour Atmosphere**: Deep twilight sky fog (`0x0a0e17`), animated Sydney Harbour water, passing ferries, and a silhouette of the Sydney Harbour Bridge.
- **Translucent X-Ray Mode**: A single dock toggle that turns the outer precast shells semi-transparent so you can inspect the radial concrete ribs and auditorium seating bowls even while assembled.

<figure class="medium-figure">
  <img src="{{ '/Architecture%203D%20Motion/assets/exploded_axonometric_full.jpg' | relative_url }}" alt="Full 8-layer exploded axonometric render of the Sydney Opera House" loading="lazy" />
  <figcaption>All 8 Blender 4.5 structural layers separated vertically with dynamic load-transmission vectors.</figcaption>
</figure>

---

## Stage 3: Replacing the Mouse with Your Hands (MediaPipe Gesture Control)

Once the 3D explosion felt silky with a mouse wheel, a bigger UX question surfaced: *what if you could hold the building in mid-air?*

Earlier in my Design Lab, I had experimented with **Google MediaPipe HandLandmarker** for my 6-step Origami Pikachu project. I wanted to bring that same tangible, zero-hardware spatial interaction into Architecture 3D Motion.

Working with Antigravity, I added a collapsible live webcam HUD (`MediaPipe Hand / Holistic`) and designed two intuitive spatial gestures:

1. **Open / Close Hand (`🖐️` / `✊`) → Explode / Assemble**: Measuring the normalized finger-spread distance from the palm center so closing your hand into a fist snaps the Opera House back into its unified form, while opening your palm expands all 8 layers upward.
2. **Left-to-Right Hand Shift (`👈 → 👉`) → Waterfront to Elevation**: In the next iteration, I asked Antigravity to map horizontal hand translation across the camera frame to a smooth camera orbit—letting you sweep effortlessly from the iconic **Harbour Waterfront** perspective into a clean **Side Cutaway Elevation**.

<div class="prompt-callout">
  <div class="prompt-callout-label">Iterating on Spatial Ergonomics in Antigravity</div>
  <p>“Add MediaPipe Hand / Holistic gesture control with a live landmark HUD: closed fist = assembled (0%), open hand = exploded (100%). Then map left-to-right hand position smoothly from the Waterfront preset to the Elevation preset so a single hand controls both assembly and architectural angle.”</p>
</div>

Because Antigravity could inspect my existing `OrbitControls`, camera presets, and animation loop in `app.js`, it didn’t fight the existing mouse controls—it blended hand-tracked targets into the exact same damped `lerp` loop, so mouse, slider, layer chips, and webcam gestures all coexist seamlessly.

---

## Stage 4: The Final 10% — Craft, Language Polish, and Shipping

The difference between a tech demo and a portfolio piece is always the last 10%.

In the final pass with Antigravity, we audited every visible string across `index.html`, `app.js`, and `data.js` to remove lingering bilingual labels, aligned the floating instruction pill with the new hand-shift gesture, verified the 8 quick-select layer chips and blueprint gallery modal, and pushed everything straight to GitHub Pages—zero build servers, zero paid hosting, instant load in any modern browser.

---

## Three Lessons for Designers Building with Antigravity

Looking back at the four commits that built **Architecture 3D Motion**, using Antigravity changed how I think about the boundary between "designing" and "building":

1. **Design in vertical slices, not giant specs.** Starting with a working scroll-driven prototype (Commit 1), then swapping in the 229k-triangle Blender mesh (Commit 2), then layering MediaPipe open/close gestures (Commit 3), then adding left-to-right camera sweeping (Commit 4) kept every step testable and fun.
2. **Bring real assets and real references.** Feeding authentic architectural taxonomy (Utzon’s 8 tiers, Höganäs tiles, 1962 Yellow Book sections) and real Blender geometry elevates an AI-assisted web app from "demo" to "craft."
3. **Stay in the director’s chair for motion feel.** Damping factors, exploded Y-spacing, camera vantage angles, and gesture dead-zones are *design decisions*. Antigravity handles the WebGL matrix math and buffer streaming so you can spend 90% of your energy tuning how the interaction *feels*.

<div class="medium-cta-card">
  <div>
    <h3>Try Architecture 3D Motion Live</h3>
    <p>Scroll to explode, click any of the 8 tiers to inspect, or enable your webcam to deconstruct the Sydney Opera House with your hands.</p>
  </div>
  <a href="{{ '/Architecture%203D%20Motion/' | relative_url }}" class="btn-pill-white">Launch 3D Experience →</a>
</div>
