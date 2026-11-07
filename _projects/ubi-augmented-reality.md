---
layout: default
title: Ubi-Interactive Augmented Reality Design — Turning Any Surface into a Touchscreen
excerpt: Designing a seamless augmented reality interface that transforms any surface into a multi-touch interactive display using 3D depth camera sensors and computer vision.
color: "#1a1e29"
---

<article class="project-detail muse-project-page">
  <!-- Header & Badges -->
  <header class="muse-detail-header">
    <div class="muse-award-pill-row">
      <span class="award-role-pill" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
        ✨ Augmented Reality &amp; NUI · 2015–2016
      </span>
      <span class="award-cat-pill">UX Design · Startup Intern</span>
      <span class="award-role-pill">Seattle, WA</span>
      <span class="award-role-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
        📰 Featured on GeekWire
      </span>
    </div>
    <h1 class="muse-detail-title">Ubi-Interactive: Augmented Reality Design</h1>
    <p class="muse-detail-lead">
      Transforming any surface—walls, conference tables, glass, or whiteboards—into an interactive multi-touch computing display using 3D depth camera sensors (such as Microsoft Kinect) and computer-vision tracking.
    </p>

    <div class="muse-external-actions">
      <a href="http://www.geekwire.com/2015/ubi-interactives-new-hardware-brings-20-point-multi-touch-to-any-screen/" target="_blank" rel="noopener noreferrer" class="btn-pill-black">
        GeekWire Feature Report ↗
      </a>
      <a href="{{ '/projects/' | relative_url }}" class="btn-pill-outline">
        ← All Projects
      </a>
    </div>
  </header>

  <!-- Hero Image -->
  <section class="muse-hero-media">
    <img
      src="{{ '/ubi/assets/ubi_hero_cover.jpg' | relative_url }}"
      alt="Ubi Interactive Augmented Reality Display - Turning Any Wall into a Touchscreen"
      class="muse-img-framed"
    />
  </section>

  <!-- Project Overview Grid -->
  <section class="muse-overview-grid">
    <div class="overview-meta-card">
      <h3>Project Metadata</h3>
      <dl class="meta-list">
        <dt>Company</dt>
        <dd>Ubi-Interactive Inc.</dd>
        <dt>Timeline</dt>
        <dd>2015 – 2016</dd>
        <dt>Role</dt>
        <dd>UX Designer (Intern)</dd>
        <dt>Domain</dt>
        <dd>Augmented Reality (AR), Natural User Interfaces (NUI), Computer Vision</dd>
        <dt>Location</dt>
        <dd>Seattle, WA</dd>
        <dt>Hardware Ecosystem</dt>
        <dd>Depth Sensors (Kinect), Projectors, Smart Pens</dd>
        <dt>Platforms</dt>
        <dd>Windows 8 / 10 Multi-touch Architecture</dd>
      </dl>
    </div>

    <div class="overview-body-content">
      <h2>Preface &amp; Vision</h2>
      <p>
        <strong>Ubi-Interactive</strong> is an Augmented Reality (AR) platform that transforms any physical surface into an interactive multi-touch digital display. By pairing standard projectors with 3D depth-sensing cameras (such as Microsoft Kinect) and advanced computer-vision tracking, Ubi democratizes large-format touchscreens at a fraction of the cost of dedicated interactive hardware.
      </p>
      <p>
        As a UX Designer in this Seattle startup, I led the redesign of the <strong>Seamless Interface Software</strong>, conceptualizing and validating interaction paradigms across education, corporate meetings, and multi-modal gesture controls.
      </p>

      <h2>Understanding User Needs &amp; Pain Points</h2>
      <p>
        Large touchscreens were becoming indispensable across industries:
      </p>
      <ul>
        <li><strong>Educators &amp; Teachers</strong>: Required interactive whiteboards to engage students with tactile problem-solving, live annotations, and physical document projections.</li>
        <li><strong>Enterprise &amp; Business</strong>: Needed flexible collaboration hubs for sprint planning, remote meetings, and multi-user brainstorms without expensive proprietary hardware.</li>
        <li><strong>Creative Teams</strong>: Desired large-scale canvas space with stylus pen support and cloud screen-sharing.</li>
      </ul>

      <h2>Competitive Analysis &amp; Version 0.5 Evaluation</h2>
      <p>
        Evaluating competitive enterprise systems (SMART Boards, SHARP touch displays, and Microsoft Surface Hub) revealed that existing solutions relied heavily on fragmented, proprietary gestures that created steep learning curves.
      </p>
      <p>
        Auditing Ubi's previous software version revealed critical user pain points:
      </p>
      <ul>
        <li><strong>Interaction Limitations</strong>: Restricted to basic tap, drag, and pinch-to-zoom. Users strongly requested dual input: finger touch + precision digital stylus (Ubi-Pen).</li>
        <li><strong>Remote Collaboration Gap</strong>: Lack of built-in screen sharing for distributed teams during video calls.</li>
        <li><strong>Environment Flexibility</strong>: The need to support varied physical classroom and boardroom setups without complex manual recalibration.</li>
      </ul>
    </div>
  </section>

  <!-- Competitive Analysis Image Block -->
  <section class="muse-gallery-section" style="margin-top: 20px;">
    <div class="gallery-full-card" style="margin-bottom: 40px;">
      <img
        src="{{ '/ubi/assets/competitor_whiteboards.png' | relative_url }}"
        alt="Competitive Analysis of Interactive Touch Displays (SMART, Surface Hub, SHARP)"
        class="muse-img-framed"
      />
      <p class="gallery-card-caption">
        <strong>Competitive Benchmarking</strong>: Analyzing gesture sets, interface ergonomics, and tool placement across SMART Boards, Microsoft Surface Hub, and SHARP displays.
      </p>
    </div>
  </section>

  <!-- Core Functional Prototypes (The 4 Pillars) -->
  <section class="muse-overview-grid" style="border-top: 1px solid var(--border-color); padding-top: 48px;">
    <div class="overview-body-content" style="grid-column: 1 / -1;">
      <h2>Designing Foundations for a Usable Seamless Interface</h2>
      <p>
        Following user interviews and usability tests, I developed wireframes and functional interaction prototypes addressing key scenario requirements across 4 core modules:
      </p>
    </div>
  </section>

  <!-- Pillar 1: Annotation Tool -->
  <section class="muse-gallery-section">
    <div class="section-header-row">
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">01 · Floating Annotation Tool</h3>
      <p class="section-subtitle">Universal stylus and finger markup overlay for any Windows application.</p>
    </div>
    <div class="gallery-full-card" style="margin-bottom: 40px;">
      <img
        src="{{ '/ubi/assets/annotation_tool.png' | relative_url }}"
        alt="Ubi Interactive Annotation Tool and Sub-tools"
        class="muse-img-framed"
      />
      <div class="gallery-card-caption">
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Enables markups, drawing, highlighting, and shape snapping on any projected surface or LED screen.</li>
          <li>System-wide support for third-party Windows apps (PowerPoint, PDF readers, web browsers).</li>
          <li>Seamless multi-input modality: finger touch, palm rejection, and Ubi-Pen stylus tracking.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Pillar 2: Document Camera Interface -->
  <section class="muse-gallery-section">
    <div class="section-header-row">
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">02 · Document Camera Interface for Education</h3>
      <p class="section-subtitle">Bridging physical learning materials with digital classroom projections.</p>
    </div>
    <div class="gallery-full-card" style="margin-bottom: 40px;">
      <img
        src="{{ '/ubi/assets/document_camera_education.png' | relative_url }}"
        alt="Document Camera Classroom Interface"
        class="muse-img-framed"
      />
      <div class="gallery-card-caption">
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Assists teachers in projecting physical textbooks, specimen objects, and student homework live onto the wall.</li>
          <li>Integrates direct annotation over live camera feeds with automatic keystoning and contrast enhancement.</li>
          <li>One-tap snapshot and export to shared classroom Google Drive and Microsoft OneNote.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Pillar 3: Collaborative Whiteboard -->
  <section class="muse-gallery-section">
    <div class="section-header-row">
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">03 · Shareable Collaborative Whiteboard</h3>
      <p class="section-subtitle">Real-time multi-user ideation across remote conference rooms.</p>
    </div>
    <div class="gallery-full-card" style="margin-bottom: 40px;">
      <img
        src="{{ '/ubi/assets/collaborative_whiteboard.png' | relative_url }}"
        alt="Ubi Shareable Collaborative Whiteboard"
        class="muse-img-framed"
      />
      <div class="gallery-card-caption">
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Real-time canvas synchronization connecting multiple distributed client PCs over cloud websockets.</li>
          <li>Tailored for enterprise sprint planning, sticky-note brainstorming, and architectural design reviews.</li>
          <li>Seamless integrations with Skype for Business, Google Drive, and Google Hangouts.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Pillar 4: InAir Gesture Mode (Touchless Interaction) -->
  <section class="muse-gallery-section">
    <div class="section-header-row">
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">04 · InAir Gesture Mode (Touchless NUI)</h3>
      <p class="section-subtitle">3D depth-sensor computer-vision tracking for hygienic, touchless spatial interaction.</p>
    </div>
    <div class="gallery-full-card" style="margin-bottom: 48px;">
      <img
        src="{{ '/ubi/assets/inair_gesture.gif' | relative_url }}"
        alt="InAir Gesture Mode Animated Demonstration"
        class="muse-img-framed"
        style="max-height: 520px; object-fit: contain; background: #000000;"
      />
      <div class="gallery-card-caption">
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          <li><strong>Mid-Air Tracking</strong>: Leverages 3D depth cameras to detect hand hover, mid-air point-and-click, and air swipes without requiring physical surface contact.</li>
          <li><strong>Multi-Sensor Compatibility</strong>: Adapts dynamically across Microsoft Kinect v1/v2, Intel RealSense, and customized IR sensors.</li>
          <li>Ideal for sterile operating rooms, public exhibitions, and collaborative presentations where users stand several feet away from the wall.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Scenario Setup Cases & Workflow Iterations -->
  <section class="muse-overview-grid" style="border-top: 1px solid var(--border-color); padding-top: 48px;">
    <div class="overview-body-content" style="grid-column: 1 / -1;">
      <h2>Environmental Adaptability: 6 Setup Scenarios</h2>
      <p>
        Unlike fixed hardware monitors, Ubi is deployed across diverse physical architectures: ultra-short-throw projectors, ceiling mounts, tabletop projections, and angled boardroom glass. We devised a 6-scenario configuration engine allowing non-technical users to calibrate in under two minutes.
      </p>
    </div>
  </section>

  <section class="muse-gallery-section">
    <div class="gallery-full-card" style="margin-bottom: 48px;">
      <img
        src="{{ '/ubi/assets/six_setup_cases.png' | relative_url }}"
        alt="Six Physical Setup Scenarios for Ubi Interactive"
        class="muse-img-framed"
      />
      <p class="gallery-card-caption">
        <strong>Six Setup Scenarios</strong>: Covering wall mount, table downward projection, ultra-short throw, ceiling rig, dual-screen array, and glass window display.
      </p>
    </div>

    <!-- Software Workflow Iterations -->
    <div class="section-header-row">
      <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">Rapid Workflow Iterations</h3>
      <p class="section-subtitle">Iterative wireframing and user-flow validation in a fast-paced startup environment.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 48px;">
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px;">
        <h4 style="font-size: 1.1rem; font-weight: 600; color: var(--text-color); margin-bottom: 8px;">Iteration 1: Standard Single-Function Flow</h4>
        <img
          src="{{ '/ubi/assets/workflow_iteration_1.png' | relative_url }}"
          alt="Workflow Iteration 1"
          style="width: 100%; border-radius: 8px; margin-bottom: 12px;"
        />
        <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">
          Initial baseline workflow focused on basic calibration and single-touch interaction modes.
        </p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px;">
        <h4 style="font-size: 1.1rem; font-weight: 600; color: var(--text-color); margin-bottom: 8px;">Iteration 2: Multi-Modal &amp; Scenario-Aware</h4>
        <img
          src="{{ '/ubi/assets/workflow_iteration_2.png' | relative_url }}"
          alt="Workflow Iteration 2"
          style="width: 100%; border-radius: 8px; margin-bottom: 12px;"
        />
        <p style="font-size: 0.88rem; color: var(--secondary-text); line-height: 1.5;">
          Advanced architecture supporting automatic sensor detection, cloud whiteboard sharing, and multi-pen tracking.
        </p>
      </div>
    </div>
  </section>

  <!-- Customer Feedback & Press Coverage -->
  <section class="muse-overview-grid" style="border-top: 1px solid var(--border-color); padding-top: 48px;">
    <div class="overview-body-content" style="grid-column: 1 / -1;">
      <h2>Client Feedback &amp; Industry Impact</h2>
      <p>
        The redesigned Seamless Interface significantly improved setup completion rates and earned praise from both education and enterprise clients worldwide:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 24px;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
          <img
            src="{{ '/ubi/assets/user_quote_facebook_1.png' | relative_url }}"
            alt="Customer Testimonial 1"
            style="width: 100%; border-radius: 8px;"
          />
        </div>
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
          <img
            src="{{ '/ubi/assets/user_quote_facebook_2.png' | relative_url }}"
            alt="Customer Testimonial 2"
            style="width: 100%; border-radius: 8px;"
          />
        </div>
      </div>

      <!-- GeekWire Feature -->
      <div style="margin-top: 36px; padding: 24px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #60a5fa;">GeekWire Tech Spotlight</span>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-color); margin-top: 4px;">
              "Ubi Interactive's new hardware brings 20-point multi-touch to any screen"
            </h3>
          </div>
          <a href="http://www.geekwire.com/2015/ubi-interactives-new-hardware-brings-20-point-multi-touch-to-any-screen/" target="_blank" rel="noopener noreferrer" class="btn-pill-black" style="font-size: 0.85rem;">
            Read on GeekWire ↗
          </a>
        </div>
        <p style="font-size: 0.92rem; color: var(--secondary-text); line-height: 1.6;">
          Featured in GeekWire for pioneering software-driven multi-touch projection, eliminating expensive optical panels and enabling teachers and business leaders to turn any physical surface into a responsive digital workspace.
        </p>
      </div>

    </div>
  </section>

  <!-- Bottom CTA -->
  <div style="text-align: center; padding: 60px 0 20px;">
    <a href="{{ '/projects/' | relative_url }}" class="btn-pill-black" style="font-size: 1rem; padding: 14px 28px;">
      ← Explore More Case Studies in Work &amp; Design Lab
    </a>
  </div>

</article>
