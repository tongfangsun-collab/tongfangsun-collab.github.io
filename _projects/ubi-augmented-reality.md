---
layout: default
title: Ubi-Interactive Augmented Reality Design
---

<article class="project-detail muse-project-page">
  <!-- Header & Badges -->
  <header class="muse-detail-header">
    <div class="muse-award-pill-row">
      <span class="award-role-pill" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.25); font-weight: 600;">
        ✨ Augmented Reality &amp; NUI
      </span>
      <span class="award-cat-pill">UX Design Intern</span>
      <span class="award-role-pill">Seattle, WA</span>
      <span class="award-role-pill" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25);">
        Featured on GeekWire
      </span>
    </div>
    <h1 class="muse-detail-title">Ubi-Interactive Augmented Reality Design</h1>
    <p class="muse-detail-lead">
      Turning any physical surface—walls, conference tables, glass, or whiteboards—into an interactive multi-touch computing display using 3D depth camera sensors and computer-vision tracking.
    </p>

    <div class="muse-external-actions">
      <a href="http://www.geekwire.com/2015/ubi-interactives-new-hardware-brings-20-point-multi-touch-to-any-screen/" target="_blank" rel="noopener noreferrer" class="btn-pill-black">
        GeekWire Feature ↗
      </a>
      <a href="{{ '/#design-lab' | relative_url }}" class="btn-pill-outline">
        ← Back to Design Lab
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

  <!-- Project Overview Grid (Exact Muse Wireframe) -->
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
        <dd>Augmented Reality (AR), Natural User Interfaces (NUI)</dd>
        <dt>Location</dt>
        <dd>Seattle, WA</dd>
        <dt>Hardware Ecosystem</dt>
        <dd>Depth Sensor (Kinect), Projector, Ubi-Pen Stylus</dd>
        <dt>Press Coverage</dt>
        <dd><a href="http://www.geekwire.com/2015/ubi-interactives-new-hardware-brings-20-point-multi-touch-to-any-screen/" target="_blank" rel="noopener noreferrer">GeekWire Technology Spotlight ↗</a></dd>
      </dl>
    </div>

    <div class="overview-body-content">
      <h2>About The Project</h2>
      <p>
        <strong>Ubi-Interactive</strong> is an Augmented Reality software startup that turns any physical surface into an interactive touchscreen display. By pairing off-the-shelf projectors with 3D depth camera sensors (such as Microsoft Kinect), Ubi democratized large-format touchscreens for education, enterprise meetings, and collaborative workspaces without requiring expensive dedicated hardware.
      </p>

      <h2>User Needs &amp; Problem Space</h2>
      <p>
        While early versions provided basic touch interaction (tap and drag), user research revealed key gaps in real-world workflows:
      </p>
      <ul>
        <li><strong>Educators in Classrooms</strong>: Needed natural stylus writing (Ubi-Pen) alongside finger touch, plus the ability to project physical textbooks and student work live via document cameras.</li>
        <li><strong>Enterprise Teams</strong>: Required shareable digital whiteboards that seamlessly connected remote offices over Skype and Google Drive.</li>
        <li><strong>Diverse Physical Spaces</strong>: Demanded an adaptive setup engine that supported different room shapes, ceiling mounts, table projections, and glass partitions without tedious manual calibration.</li>
      </ul>

      <h2>Design Approach &amp; Key Solutions</h2>
      <p>
        As UX Designer, I redesigned the <strong>Seamless Interface Software</strong>, focusing on clean ergonomics and fast, intuitive interaction:
      </p>
      <ul>
        <li><strong>Floating System Annotation</strong>: A universal floating toolbar enabling notes, drawing, and highlights on top of any Windows application.</li>
        <li><strong>Touchless InAir Gestures</strong>: Leveraging 3D depth tracking so users can point, click, and swipe in mid-air from a distance.</li>
        <li><strong>Scenario-Based Calibration</strong>: A streamlined 6-scenario setup flow that guides non-technical users to calibrate their display in under two minutes.</li>
      </ul>
    </div>
  </section>

  <!-- UI & Interaction Design Stack (Exact Muse Wireframe Stack) -->
  <section class="muse-gallery-section">
    <div class="section-header-row">
      <h2>Seamless Interface Design System</h2>
      <p class="section-subtitle">Core interaction models, multi-modal input tools, and hardware scenario adaptability.</p>
    </div>

    <div class="muse-ui-stack">
      <figure class="muse-ui-item">
        <img
          src="{{ '/ubi/assets/inair_gesture.gif' | relative_url }}"
          alt="InAir Touchless Gesture Interaction Demonstration"
          style="background: #000000; max-height: 480px; object-fit: contain;"
          loading="lazy"
        />
        <figcaption>
          <strong>01 / InAir Touchless Spatial Gestures</strong>
          <p>Utilizing 3D depth-sensing cameras to detect hand hover, point-and-click, and air swipes without surface contact—ideal for hygienic environments and distance presentations.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/ubi/assets/annotation_tool.png' | relative_url }}"
          alt="Floating Annotation Tool and Sub-tools"
          loading="lazy"
        />
        <figcaption>
          <strong>02 / Universal Floating Annotation &amp; Stylus Support</strong>
          <p>System-wide markup widget supporting multi-touch fingers and digital stylus (Ubi-Pen) with palm rejection across any Windows application.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/ubi/assets/document_camera_education.png' | relative_url }}"
          alt="Document Camera Classroom Interface"
          loading="lazy"
        />
        <figcaption>
          <strong>03 / Document Camera Integration for Education</strong>
          <p>Bridging physical textbooks and student specimens with digital projection, enabling teachers to annotate over live feeds and save directly to cloud storage.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/ubi/assets/collaborative_whiteboard.png' | relative_url }}"
          alt="Shareable Collaborative Whiteboard"
          loading="lazy"
        />
        <figcaption>
          <strong>04 / Cloud Collaborative Whiteboard</strong>
          <p>Real-time multi-PC digital canvas designed for enterprise sprint planning and remote meetings with Skype and Google Drive integration.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/ubi/assets/six_setup_cases.png' | relative_url }}"
          alt="Six Physical Environmental Setup Scenarios"
          loading="lazy"
        />
        <figcaption>
          <strong>05 / Environmental Setup &amp; Scenario Calibration</strong>
          <p>Adaptive calibration engine accommodating wall projections, downward table surfaces, ultra-short throw rigs, and conference room glass.</p>
        </figcaption>
      </figure>
    </div>
  </section>
</article>

<style>
.muse-project-page {
  padding: 48px 0 80px 0;
}
.muse-award-pill-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.award-gold-pill {
  background: #fef08a;
  color: #854d0e;
  border: 1px solid #fde047;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
}
.award-cat-pill,
.award-role-pill {
  background: var(--light-gray);
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
  font-size: 0.88rem;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 999px;
}
.muse-detail-title {
  font-size: 3.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 18px 0;
}
.muse-detail-lead {
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--secondary-text);
  margin: 0 0 32px 0;
  max-width: 820px;
}
.muse-external-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 48px;
}
.muse-hero-media {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
  margin-bottom: 64px;
  background: #ffffff;
}
.muse-img-framed {
  width: 100%;
  height: auto;
  display: block;
}
.muse-overview-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 56px;
  align-items: start;
  margin-bottom: 72px;
  padding-bottom: 64px;
  border-bottom: 1px solid var(--border-color);
}
.overview-meta-card {
  background: var(--light-gray);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 28px 24px;
}
.overview-meta-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}
.meta-list {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.meta-list dt {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--secondary-text);
}
.meta-list dd {
  margin: 2px 0 0 0;
  font-size: 0.96rem;
  font-weight: 500;
  color: var(--text-color);
}
.meta-list dd a {
  color: var(--text-color);
  font-weight: 600;
}
.overview-body-content h2 {
  font-size: 1.85rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 32px 0 16px 0;
}
.overview-body-content h2:first-of-type {
  margin-top: 0;
}
.overview-body-content p {
  font-size: 1.08rem;
  line-height: 1.7;
  color: #333336;
  margin: 0 0 20px 0;
}
.overview-body-content ul {
  padding-left: 20px;
  margin-bottom: 24px;
}
.overview-body-content li {
  font-size: 1.02rem;
  line-height: 1.68;
  color: #333336;
  margin-bottom: 12px;
}
.muse-gallery-section {
  padding-top: 24px;
}
.muse-ui-stack {
  display: flex;
  flex-direction: column;
  gap: 56px;
}
.muse-ui-item {
  margin: 0;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
}
.muse-ui-item img {
  width: 100%;
  height: auto;
  display: block;
  border-bottom: 1px solid var(--border-color);
}
.muse-ui-item figcaption {
  padding: 24px 28px;
}
.muse-ui-item figcaption strong {
  display: block;
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 6px;
}
.muse-ui-item figcaption p {
  margin: 0;
  color: var(--secondary-text);
  font-size: 0.98rem;
  line-height: 1.55;
}

@media (max-width: 860px) {
  .muse-overview-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .muse-detail-title {
    font-size: 2.35rem;
  }
}
</style>
