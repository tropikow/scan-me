<script setup lang="ts">
const navItems = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/invoices', label: 'Invoices' }
]
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <NuxtLink to="/app/dashboard" class="brand">ScanMe</NuxtLink>
      <nav class="nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <NuxtLink to="/" class="nav-link signout">Sign out</NuxtLink>
    </aside>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 16px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
}

.brand {
  font-weight: 600;
  font-size: var(--font-h3);
  padding: 0 12px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: var(--fg-muted);
  font-size: var(--font-body);
  transition: background-color var(--transition), color var(--transition);
}

.nav-link:hover {
  background: var(--surface-hover);
  color: var(--fg-primary);
}

.nav-link.router-link-active {
  background: var(--accent-action);
  color: var(--fg-primary);
}

.signout {
  border-top: 1px solid var(--border-subtle);
  border-radius: 0;
  padding-top: 16px;
  margin-top: auto;
}

.signout:hover {
  background: transparent;
  color: var(--fg-primary);
}

.main {
  padding: 32px;
}

@media (max-width: 640px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 16px;
  }
  .nav { flex-direction: row; flex-wrap: wrap; }
  .signout { margin-top: 0; border-top: none; padding-top: 8px; }
  .main { padding: 24px 16px; }
}
</style>
