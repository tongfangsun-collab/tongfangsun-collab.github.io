---
layout: default
title: Writing
permalink: /blog/
---

<section class="medium-index-section">
  <header class="section-header-row">
    <h1 class="section-display-title">Writing</h1>
    <p class="section-subtitle">Essays, behind-the-scenes build logs, and notes on AI + UX, creative coding, and building with Antigravity.</p>
  </header>

  <div class="medium-feed">
    {% for post in site.posts %}
      <a href="{{ post.url | relative_url }}" class="medium-feed-card">
        <div class="medium-feed-copy">
          <div class="medium-feed-meta">
            <span class="medium-feed-author">{{ post.author | default: "Tong Fang Sun" }}</span>
            {% if post.kicker %}
              <span aria-hidden="true">·</span>
              <span class="medium-feed-kicker">{{ post.kicker }}</span>
            {% endif %}
          </div>
          <h2 class="medium-feed-title">{{ post.title }}</h2>
          {% if post.subtitle or post.excerpt %}
          <p class="medium-feed-excerpt">{{ post.subtitle | default: post.excerpt | strip_html | truncate: 185 }}</p>
          {% endif %}
          <div class="medium-feed-footer">
            <span>{{ post.date | date: "%b %d, %Y" }}</span>
            {% if post.read_time %}
              <span aria-hidden="true">·</span>
              <span>{{ post.read_time }}</span>
            {% endif %}
            {% if post.tags and post.tags.size > 0 %}
              <span class="medium-feed-tag">{{ post.tags.first }}</span>
            {% endif %}
          </div>
        </div>

        {% if post.cover_image %}
        <div class="medium-feed-thumb">
          <img src="{{ post.cover_image | relative_url }}" alt="{{ post.title }}" loading="lazy" />
        </div>
        {% endif %}
      </a>
    {% endfor %}
  </div>
</section>

<style>
.medium-index-section {
  padding: 72px 0 88px;
}
.medium-feed {
  display: flex;
  flex-direction: column;
}
.medium-feed-card {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 36px;
  align-items: center;
  text-decoration: none;
  color: inherit;
  padding: 34px 0;
  border-top: 1px solid var(--border-color);
  transition: var(--transition);
}
.medium-feed-card:last-child {
  border-bottom: 1px solid var(--border-color);
}
.medium-feed-card:hover .medium-feed-title {
  opacity: 0.72;
}
.medium-feed-card:hover .medium-feed-thumb img {
  transform: scale(1.03);
}
.medium-feed-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--secondary-text);
  margin-bottom: 10px;
}
.medium-feed-author {
  font-weight: 600;
  color: var(--text-color);
}
.medium-feed-kicker {
  color: #16a34a;
  font-weight: 600;
}
.medium-feed-title {
  margin: 0 0 10px 0;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: -0.024em;
  line-height: 1.24;
  color: var(--text-color);
  transition: opacity 0.2s ease;
}
.medium-feed-excerpt {
  margin: 0 0 18px 0;
  font-size: 1rem;
  line-height: 1.58;
  color: var(--secondary-text);
}
.medium-feed-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.84rem;
  color: var(--secondary-text);
}
.medium-feed-tag {
  background: var(--light-gray);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
}
.medium-feed-thumb {
  width: 220px;
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--light-gray);
}
.medium-feed-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.28s ease;
}
@media (max-width: 720px) {
  .medium-feed-card {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .medium-feed-thumb {
    width: 100%;
    order: -1;
  }
}
</style>
