<script setup lang="ts">
const navLinks = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' }
]
</script>

<template>
  <div class="page">
    <header class="navbar">
      <NuxtLink to="/" class="logo" aria-label="ScanMe home">
        <span class="logo-mark" aria-hidden="true" />
        <span class="logo-text">ScanMe</span>
      </NuxtLink>

      <nav class="nav">
        <a v-for="link in navLinks" :key="link.href" :href="link.href" class="nav-link">
          {{ link.label }}
        </a>
        <NuxtLink to="/signin" class="btn btn-primary">Sign in</NuxtLink>
      </nav>
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: var(--bg-surface);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.logo-mark {
  width: 24px;
  height: 24px;
  border: 1px solid var(--fg-primary);
  border-radius: var(--radius-sm);
}

.logo-text {
  font-weight: 600;
  font-size: var(--font-h3);
}

.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: var(--fg-muted);
  font-size: var(--font-body);
  transition: color var(--transition);
}

.nav-link:hover {
  color: var(--fg-primary);
}

.content {
  flex: 1;
  padding: 32px;
}

@media (max-width: 640px) {
  .navbar { padding: 12px 16px; }
  .nav { gap: 12px; }
  .nav-link { display: none; }
  .content { padding: 24px 16px; }
}
</style>
