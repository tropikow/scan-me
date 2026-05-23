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
          <img src="~/assets/images/logo-1.png" alt="" class="logo-img" />
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
          <img src="~/assets/images/logo-1.png" alt="" class="logo-img foot-logo-img" />
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
  background: var(--color-snow);
  color: var(--color-ink);
  font-family: var(--font-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
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
  background: color-mix(in srgb, var(--color-snow) 80%, transparent);
  border-bottom: 1px solid var(--color-mist);
}
.inner {
  max-width: var(--layout-max);
  margin: 0 auto;
  padding: var(--space-4) var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-5);
}
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: var(--text-body);
  color: var(--color-ink);
}
.logo-img {
  height: 28px;
  width: auto;
  display: block;
}
.nav-links {
  display: flex;
  gap: var(--space-8);
  margin-left: var(--space-8);
  flex: 1;
}
.nav-links a {
  color: var(--color-slate);
  font-size: var(--text-body-sm);
  font-weight: 500;
  letter-spacing: -0.04px;
  transition: color var(--transition);
}
.nav-links a:hover {
  color: var(--color-ink);
  text-decoration: none;
}
.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-body-sm);
  font-weight: 600;
  padding: var(--space-2) var(--space-4);
  background: var(--color-action);
  color: var(--color-snow);
  border-radius: var(--radius-pill);
  letter-spacing: -0.04px;
  transition: background var(--transition);
}
.nav-cta:hover {
  background: var(--color-action-hover);
  text-decoration: none;
}
.nav-signin {
  font-size: var(--text-body-sm);
  color: var(--color-ink);
  font-weight: 500;
}
.nav-signin:hover {
  text-decoration: none;
}
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
}

/* ============ FOOTER ============ */
footer {
  padding: var(--space-12) var(--space-8) var(--space-10);
  border-top: 1px solid var(--color-mist);
  background: var(--color-snow);
}
.foot-inner {
  max-width: var(--layout-max);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-6);
  font-size: 13px;
  color: var(--color-graphite);
  letter-spacing: -0.04px;
}
.foot-logo {
  font-size: var(--text-body-sm);
}
.foot-logo-img {
  height: 22px;
}
.foot-links {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
}
.foot-links a {
  color: var(--color-graphite);
  transition: color var(--transition);
}
.foot-links a:hover {
  color: var(--color-ink);
  text-decoration: none;
}
</style>
