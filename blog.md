---
layout: default
title: Writing
---

<section class="blog-section">
  <h2>Writing</h2>
  <div class="blog-list">
    {% for post in site.posts %}
      <a href="{{ post.url }}" class="blog-item">
        <span class="date">{{ post.date | date: "%b %d, %Y" }}</span>
        <span class="title">{{ post.title }}</span>
        <span class="arrow">→</span>
      </a>
    {% endfor %}
  </div>
</section>

<style>
.blog-section {
  padding: 80px 0;
}
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.blog-item {
  display: flex;
  align-items: baseline;
  text-decoration: none;
  color: inherit;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
}
.blog-item:hover {
  padding-left: 10px;
  color: var(--secondary-text);
}
.blog-item .date {
  width: 150px;
  font-size: 0.9rem;
  color: var(--secondary-text);
}
.blog-item .title {
  flex: 1;
  font-weight: 500;
}
.blog-item .arrow {
  font-size: 1.2rem;
  opacity: 0;
  transition: var(--transition);
}
.blog-item:hover .arrow {
  opacity: 1;
}
</style>
