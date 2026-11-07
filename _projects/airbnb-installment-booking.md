---
layout: default
title: Airbnb Installment Booking ("Pay Less Up Front")
---

<article class="project-detail muse-project-page">
  <!-- 1. Header & Badges -->
  <header class="muse-detail-header">
    <div class="muse-award-pill-row">
      <span class="award-role-pill" style="background: rgba(255, 56, 92, 0.12); color: #e11d48; border: 1px solid rgba(255, 56, 92, 0.25); font-weight: 600;">
        ✨ FinTech &amp; Travel UX
      </span>
      <span class="award-cat-pill">UX &amp; Product Design Intern</span>
      <span class="award-role-pill">Airbnb Guest Growth Team</span>
      <span class="award-role-pill" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25);">
        Shipped Globally · Featured on CNN Tech
      </span>
    </div>
    <h1 class="muse-detail-title">Airbnb Installment Booking Design</h1>
    <p class="muse-detail-lead">
      Originating and designing Airbnb’s flexible split-payment experience ("Pay Less Up Front")—reducing upfront booking barriers for travelers while streamlining a 54-step legacy checkout into an intuitive mobile flow across Explore 2.0 and Airbnb Plus.
    </p>

    <div class="muse-external-actions">
      <a href="https://money.cnn.com/2018/01/16/technology/airbnb-pay-less-up-front/index.html" target="_blank" rel="noopener noreferrer" class="btn-pill-black">
        CNN Tech Coverage ↗
      </a>
      <a href="https://player.vimeo.com/video/258049220" target="_blank" rel="noopener noreferrer" class="btn-pill-outline">
        Watch Booking Prototype ↗
      </a>
      <a href="{{ '/#design-lab' | relative_url }}" class="btn-pill-outline">
        ← Back to Design Lab
      </a>
    </div>
  </header>

  <!-- 2. Hero Media -->
  <section class="muse-hero-media">
    <img
      src="{{ '/airbnb/assets/01_payless_1.png' | relative_url }}"
      alt="Airbnb Installment Booking — Pay Less Up Front Mobile Experience"
      class="muse-img-framed"
    />
  </section>

  <!-- 3. Two-Column Overview Grid -->
  <section class="muse-overview-grid">
    <div class="overview-meta-card">
      <h3>Project Metadata</h3>
      <dl class="meta-list">
        <dt>Company / Team</dt>
        <dd>Airbnb · Guest Book &amp; Growth Team</dd>
        <dt>Timeline</dt>
        <dd>2017 – Jan 2018 (Global Launch)</dd>
        <dt>Role</dt>
        <dd>UX / UI Designer (Intern)</dd>
        <dt>Collaborators</dt>
        <dd>Christopher (Lead UX Researcher), Xin Zhang (Product Designer)</dd>
        <dt>Releases</dt>
        <dd>Explore 2.0 (09/2017) · Pay Less Up Front (01/2018) · Airbnb Plus (02/2018)</dd>
        <dt>Key Tools</dt>
        <dd>Airbnb DLS (Lottie), Sketch 3, Principle, Redpen.io</dd>
        <dt>Press Coverage</dt>
        <dd><a href="https://money.cnn.com/2018/01/16/technology/airbnb-pay-less-up-front/index.html" target="_blank" rel="noopener noreferrer">CNN Money / Tech Feature ↗</a></dd>
      </dl>
    </div>

    <div class="overview-body-content">
      <h2>About The Project</h2>
      <p>
        During my UX internship on Airbnb’s <strong>Guest Growth Team</strong>, user research revealed that while Airbnb was growing rapidly (120%+ YoY), high upfront travel costs and payment trust concerns remained the top conversion blockers for prospective guests—especially among the core 18–34 demographic.
      </p>
      <p>
        Partnering with Lead UX Researcher Christopher and Product Designer Xin Zhang, I initiated and designed the <strong>Installment Booking</strong> experience from zero to one, which officially launched globally in January 2018 as Airbnb’s <strong>"Pay Less Up Front"</strong> feature across Mobile and Web.
      </p>

      <h2>User Needs &amp; Problem Space</h2>
      <p>
        Through demographic segmentation and focus group research across four distinct traveler cohorts, we uncovered key behavioral insights:
      </p>
      <ul>
        <li><strong>Upfront Budget Friction</strong>: Paying 100% of a high-ticket group or long-lead reservation months in advance locked up travelers' cash flow and prevented otherwise viable trips.</li>
        <li><strong>Trust &amp; Service Confidence</strong>: Guests strongly favored deferring part of the payment closer to check-in or check-out, as it reinforced confidence in host reliability and cancellation clarity without hurting host payout assurance.</li>
        <li><strong>Overwhelming Checkout Complexity</strong>: The existing booking tree had grown to 54+ conditional steps (averaging 15 minutes to complete), requiring structural simplification before embedding split-payment options.</li>
      </ul>

      <h2>Design Approach &amp; Key Solutions</h2>
      <ul>
        <li><strong>Two-Stage "Pay Less Up Front" Model</strong>: Mapped installment concepts across the end-to-end journey (Before Travel, In Travel, After Travel) and aligned business strategy on splitting payments between initial booking and pre-check-in automated reminders.</li>
        <li><strong>Streamlined Booking Information Architecture</strong>: Restructured the redundant 54-step booking tree into a linear 6-stage mobile flow (Search → Select → Review → Book → Fee &amp; Installment Review → Confirm).</li>
        <li><strong>DLS Visual System &amp; Paper Prototype Validation</strong>: Conducted talk-aloud paper usability testing with 12 Airbnb users, iterating into high-fidelity A/B prototypes built on Airbnb’s Design Language System (DLS) for Explore 2.0 and Airbnb Plus.</li>
      </ul>
    </div>
  </section>

  <!-- 4. Stacked UI/UX Visual Cards -->
  <section class="muse-gallery-section">
    <div class="section-header-row">
      <h2>System &amp; Experience Design</h2>
      <p class="section-subtitle">Information architecture simplification, Airbnb DLS component patterns, and shipped product impact.</p>
    </div>

    <div class="muse-ui-stack">
      <figure class="muse-ui-item">
        <img
          src="{{ '/airbnb/assets/17_interaction.gif' | relative_url }}"
          alt="Airbnb Installment Booking Interactive Prototype"
          style="background: #fafafa; max-height: 540px; object-fit: contain;"
          loading="lazy"
        />
        <figcaption>
          <strong>01 / Interactive Installment Booking Prototype</strong>
          <p>High-fidelity motion prototype demonstrating seamless payment schedule selection, transparent installment fee breakdown, and one-tap confirmation inside the mobile checkout flow.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/airbnb/assets/16_new.png' | relative_url }}"
          alt="Airbnb DLS, Explore 2.0, and Airbnb Plus Visual Evolution"
          loading="lazy"
        />
        <figcaption>
          <strong>02 / Evolution Across Airbnb DLS, Explore 2.0 &amp; Airbnb Plus</strong>
          <p>Adapting the installment booking entry points across two major visual design milestones—transitioning from classic teal DLS headers to the airy editorial hierarchy of Explore 2.0 and Airbnb Plus.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/airbnb/assets/12_Booking_Process.png' | relative_url }}"
          alt="Simplified Airbnb Booking Information Architecture"
          loading="lazy"
        />
        <figcaption>
          <strong>03 / Streamlined Booking Information Architecture</strong>
          <p>Consolidating a fragmented 54-step legacy decision tree into a clear 6-step linear pipeline, isolating first-time ID verification and installment payment selection at the exact moment of price review.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/airbnb/assets/14_Airbnb_booking_flow.PNG' | relative_url }}"
          alt="End-to-End Mobile Wireframe and High-Fidelity Flow"
          loading="lazy"
        />
        <figcaption>
          <strong>04 / End-to-End Mobile Checkout &amp; Installment Flow</strong>
          <p>Complete screen-by-screen booking architecture validated with 12 participants via tactile paper prototyping and iterative usability testing prior to engineering handoff.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/airbnb/assets/19_v3.png' | relative_url }}"
          alt="Airbnb Design Language System (DLS) Component Architecture"
          loading="lazy"
        />
        <figcaption>
          <strong>05 / Airbnb Design Language System (DLS) Components</strong>
          <p>Modular cards, interactive input rows, and editorial marquee specifications built to ensure cross-platform parity between iOS, Android, and responsive web checkout.</p>
        </figcaption>
      </figure>

      <figure class="muse-ui-item">
        <img
          src="{{ '/airbnb/assets/21_airbnb.PNG' | relative_url }}"
          alt="Airbnb Launches Pay Less Up Front Official Release"
          loading="lazy"
        />
        <figcaption>
          <strong>06 / Global Product Launch — "Pay Less Up Front" (Jan 2018)</strong>
          <p>Originating from this internship UX research and prototype, Airbnb officially launched "Pay Less Up Front" worldwide across Mobile and Web in January 2018, allowing travelers to pay 50% at booking and the remainder closer to check-in.</p>
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
