<script setup lang="ts">
const navLinks = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' }
]
</script>

<template>
  <div class="landing-root">
    <nav class="top">
      <div class="inner">
        <NuxtLink to="/" class="logo" aria-label="scan-me home">
          <span class="dot" aria-hidden="true" />
          <span>scan-me</span>
        </NuxtLink>

        <div class="nav-links">
          <a v-for="link in navLinks" :key="link.href" :href="link.href">
            {{ link.label }}
          </a>
        </div>

        <NuxtLink to="/signin" class="nav-signin">Sign in</NuxtLink>
        <NuxtLink to="/signup" class="nav-cta">Get started →</NuxtLink>
      </div>
    </nav>

    <main>
      <slot />
    </main>

    <footer>
      <div class="foot-inner">
        <div class="logo foot-logo">
          <span class="dot" aria-hidden="true" />
          <span>scan-me</span>
        </div>
        <div class="foot-links">
          <a href="#">Product</a>
          <a href="#">Pricing</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
        <span class="mono">© 2026</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-root {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'ss01', 'cv11';
  line-height: 1.4;
  min-height: 100vh;
}

/* ============ NAV ============ */
nav.top {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: saturate(1.4) blur(20px);
  -webkit-backdrop-filter: saturate(1.4) blur(20px);
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  border-bottom: var(--hairline) solid var(--line-2);
}
.inner {
  max-width: var(--max);
  margin: 0 auto;
  padding: 14px var(--pad);
  display: flex;
  align-items: center;
  gap: 18px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: 16px;
  color: var(--ink);
}
.logo .dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ink);
  display: inline-block;
  position: relative;
}
.logo .dot::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 1.5px solid var(--bg);
}
.nav-links {
  display: flex;
  gap: 28px;
  margin-left: 32px;
  flex: 1;
}
.nav-links a {
  color: var(--ink-2);
  font-size: 13.5px;
  font-weight: 450;
  letter-spacing: -0.005em;
  transition: color 0.15s;
}
.nav-links a:hover {
  color: var(--ink);
}
.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 500;
  padding: 7px 14px;
  background: var(--ink);
  color: var(--accent-ink);
  border-radius: 999px;
  letter-spacing: -0.005em;
  transition: transform 0.18s, opacity 0.18s;
}
.nav-cta:hover {
  transform: scale(0.97);
}
.nav-signin {
  font-size: 13.5px;
  color: var(--ink);
  font-weight: 450;
}
@media (max-width: 720px) {
  .nav-links {
    display: none;
  }
}

/* ============ FOOTER ============ */
footer {
  padding: 56px var(--pad) 40px;
  border-top: 1px solid var(--line);
  background: var(--bg);
}
.foot-inner {
  max-width: var(--max);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
}
.foot-logo {
  font-size: 14px;
}
.foot-logo .dot {
  width: 14px;
  height: 14px;
}
.foot-links {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}
.foot-links a {
  color: var(--ink-3);
  transition: color 0.15s;
}
.foot-links a:hover {
  color: var(--ink);
}
</style>
