---
layout: post
title: "How I Built Origami Hand Detection with Antigravity"
subtitle: "Turning a flat sheet of yellow paper into a 6-step waving Origami Pikachu controlled by your fingers — using MediaPipe HandLandmarker, 120-frame canvas scrubbing, and Antigravity."
date: 2026-11-22
author: Tong Fang Sun
kicker: Design Lab · Behind the Build
read_time: 6 min read
tags:
  - Antigravity
  - MediaPipe
  - Tangible UI
  - Computer Vision
  - AI + UX
cover_image: /Hand%20detection/origami_steps_grid.jpg
cover_alt: Six-step Origami Pikachu folding progression controlled by hand gestures
cover_caption: "From a flat square sheet (0 fingers) to a waving Origami Pikachu (5 fingers) — all scrubbed in real time with your bare hand."
demo_url: /Hand%20detection/
excerpt: "A product designer’s behind-the-scenes guide to building Origami Hand Detection with Antigravity: palm-normalized 0–5 finger counting, 60fps 120-frame canvas scrubbing, edge-feathered tabletop immersion, and two-hand zoom."
---

Origami is one of the most tactile experiences in the physical world. You start with a single flat square of paper, crease it step by step, and watch a character emerge between your fingers.

When I set out to build **[Origami Hand Detection]({{ '/Hand%20detection/' | relative_url }})** for my Design Lab, I wanted to capture that exact physical delight on the web—without forcing anyone to click a slider or wear a VR headset. Hold up **0 fingers** (a closed fist) and you see a flat sheet of yellow origami paper on a warm wooden desk. Raise **1, 2, 3, 4, or 5 fingers** and the paper smoothly folds—or unfolds in reverse—through all six stages until Pikachu stands up and waves back at you.

Building a responsive computer-vision interaction that feels effortless at 60fps usually takes days of wrestling with webcam pipelines, landmark math, and video codec quirks. Working with **Antigravity**, I was able to focus almost entirely on interaction feel and visual craft while iterating rapidly through four clear engineering breakthroughs.

---

## Stage 1: Designing the 0–5 Finger Grammar with MediaPipe

My first instinct was to map every folding stage to a natural, unmistakable hand count—no obscure sign language to memorize:

- **0 Fingers (`✊` Fist)** → Step 1: Flat square yellow sheet
- **1–4 Fingers** → Steps 2–5: Progressive origami folds, ears, cheeks, and lightning tail
- **5 Fingers (`🖐️` Open Palm)** → Step 6: Completed Origami Pikachu waving hello
- **Two Hands (`🙌` Spread / Pinch)** → Continuous zoom from `50%` to `175%`

The catch with raw webcam hand tracking is jitter. Early prototypes flicker wildly between 3 and 4 fingers—especially with the thumb, which bends sideways instead of vertically.

<div class="prompt-callout">
  <div class="prompt-callout-label">How I Directed Antigravity on Gesture Stability</div>
  <p>“Use Google MediaPipe HandLandmarker (@mediapipe/tasks-vision) to count 0 to 5 extended fingers reliably across different camera distances. Normalize thumb extension against palm width (landmarks 5 to 17) instead of raw screen coordinates so it never flickers when the user moves closer or farther from the webcam.”</p>
</div>

Antigravity implemented a palm-normalized ratio detector in `countFingers0To5()` that compares wrist-to-fingertip distance against both the PIP and MCP joints, while checking the thumb against `palmWidth`:

```javascript
function isMainFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const wrist = landmarks[0];
  const dTip = dist2D(landmarks[tipIdx], wrist);
  const dPip = dist2D(landmarks[pipIdx], wrist);
  const dMcp = dist2D(landmarks[mcpIdx], wrist);
  return dTip > dPip * 1.07 && dTip > dMcp * 1.18;
}
```

That single architectural choice—normalizing against the hand’s own anatomy rather than pixel coordinates—made finger counting immediately rock-solid under everyday laptop lighting.

---

## Stage 2: Why I Ditched `<video>` Seeking for 120-Frame Canvas Scrubbing

My first version scrubbed an HTML5 `<video>` element (`origami_pikachu.mp4`) by setting `video.currentTime` whenever the finger count changed. It worked in theory, but felt laggy in practice: browsers decode MP4 keyframes asynchronously, so scrubbing backward from 5 fingers to 2 fingers stuttered noticeably.

I asked Antigravity to solve the seek latency at the root. Together we switched to a **120-frame preloaded JPEG sequence** (`frames/frame_000.jpg` through `frame_119.jpg`) rendered onto an HTML5 `<canvas>` with fractional cross-fading:

- Raising or lowering fingers updates a `targetFrameFloat` between `0` and `119`.
- Every animation tick eases `currentFrameFloat` smoothly toward the target with velocity clamping (`maxStepPerTick`).
- Between consecutive integer frames (`fFloor` and `fCeil`), the renderer blends `imgA` and `imgB` by the fractional alpha `frac`—creating buttery 60fps forward *and* reverse folding motion with zero codec stutter.

<div class="medium-diptych">
  <figure>
    <img src="{{ '/Hand%20detection/step1.jpg' | relative_url }}" alt="Origami Pikachu Step 1 — Flat yellow square paper" loading="lazy" />
    <figcaption>0 fingers (Fist): flat creased square on the studio desk.</figcaption>
  </figure>
  <figure>
    <img src="{{ '/Hand%20detection/step6.jpg' | relative_url }}" alt="Origami Pikachu Step 6 — Completed waving Pikachu" loading="lazy" />
    <figcaption>5 fingers (Open Palm): finished Pikachu waving back.</figcaption>
  </figure>
</div>

> Great tangible UI lives or dies on perceived latency. Replacing `<video>` seeking with 120 preloaded canvas frames turned a cool CV demo into something that actually feels like folding paper in mid-air.

---

## Stage 3: Eliminating Black Bars with Edge-Feathered Tabletop Immersion

Once the folding animation was smooth, a visual design problem bothered me: on wide desktop monitors, a centered vertical or 4:3 origami frame leaves awkward dark letterbox bars on the left and right. Cropping to `object-fit: cover` wasn’t an option either—it sliced off Pikachu’s ear-tips or paws.

So I briefed Antigravity on a custom studio compositing trick inside `drawImmersiveFrame()`:

1. **Full-bleed blurred backdrop**: Draw the current frame stretched horizontally with a `26px` blur at the exact same vertical horizon so the warm wooden tabletop grain extends edge-to-edge across `100vw × 100vh`.
2. **Offscreen feathered subject**: Render the crisp Pikachu frame onto an offscreen canvas (`subjectCanvas`), apply a `destination-in` horizontal linear gradient (`14%` soft feather on left and right edges), and composite it seamlessly onto the tabletop.

The result: **zero black bars on any screen ratio**, while Pikachu remains 100% uncropped from ear-tips to paws—even when you spread two hands apart to zoom in to `175%`.

<div class="prompt-callout">
  <div class="prompt-callout-label">Polishing the Fullscreen Stage with Antigravity</div>
  <p>“Keep Pikachu 100% visible from ear-tips to paws on widescreen monitors with zero dark borders. Extend the wooden table backdrop across 100vw × 100vh with a horizon-aligned blur, and feather the left/right edges of the crisp center subject onto an offscreen canvas so the table merges invisibly.”</p>
</div>

---

## Stage 4: Dual Modes, Keyboard Fallbacks, and Framer Portability

Not everyone opens a portfolio link in a room where they want to turn on their webcam. In the final polish pass with Antigravity, we made sure the experience stayed joyful in every context:

- **Dual Display Modes**: A single HUD toggle switches between **Video Animation** (120-frame scrub) and **6-Step Image Panels** (`step1.jpg`–`step6.jpg`) for inspecting each fold crease clearly.
- **Zero-Camera Fallback**: Pressing keys `0`–`5` (or clicking any of the 6 step cards) triggers the exact same 60fps folding interpolation; pressing `H` toggles Pure Mode to hide the glassmorphism HUD completely.
- **Framer & Trio Experiments**: Alongside the standalone web app, Antigravity helped package a drop-in React/Framer component (`FramerOrigamiHandDetection.tsx`) and a companion Pokémon Trio prototype (Pikachu, Raichu, and Eevee) built on a watertight 25-vertex origami crease mesh.

<figure class="medium-figure">
  <img src="{{ '/Hand%20detection/step4.jpg' | relative_url }}" alt="Origami Pikachu mid-fold stage with ears and tail emerging" loading="lazy" />
  <figcaption>Step 4 mid-fold: ears, red cheeks, and lightning tail emerging smoothly as you raise your fingers.</figcaption>
</figure>

---

## What This Project Taught Me About Designing with Antigravity

Building **Origami Hand Detection** reinforced something I now rely on in every Design Lab experiment:

1. **Solve feel problems with engineering, not just visuals.** Switching from MP4 seeking to 120-frame canvas interpolation wasn’t a visual tweak—it was an engineering architecture shift that transformed the *emotional feel* of the interaction. Antigravity made that pivot take minutes instead of days.
2. **Treat edge cases as first-class UX.** Palm-normalized thumb math, two-hand zoom bounds, widescreen edge feathering, and keyboard fallbacks are what separate a fragile hackathon script from a portfolio piece anyone can enjoy.
3. **Prototype directly in the real medium.** Instead of mocking up hand-tracking curves in static slides, Antigravity lets me test real webcam ergonomics in the browser on minute one—and iterate until the gesture feels invisible.

<div class="medium-cta-card">
  <div>
    <h3>Try Origami Hand Detection Live</h3>
    <p>Allow camera access and hold up 0–5 fingers to fold Pikachu in real time—or press keys 0–5 to scrub all six steps.</p>
  </div>
  <a href="{{ '/Hand%20detection/' | relative_url }}" class="btn-pill-white">Launch Origami Demo →</a>
</div>
