<template>
  <div class="page">
    <header class="topbar">
      <NuxtLink to="/" class="brand">
        <img src="~/assets/images/logo-1.png" alt="" class="brand-img" />
        <span>scan-me</span>
      </NuxtLink>
      <nav class="actions">
        <NuxtLink to="/signin" class="btn-hifi btn-ghost btn-sm">Sign in</NuxtLink>
        <NuxtLink to="/signup" class="btn-hifi btn-primary btn-sm">Sign up</NuxtLink>
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
  background: var(--bg);
  color: var(--ink);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, 'Helvetica Neue', sans-serif;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px var(--pad);
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.brand-img {
  height: 22px;
  width: auto;
  display: block;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.content {
  flex: 1;
  padding: 32px var(--pad);
  min-width: 0;
}

@media (max-width: 640px) {
  .topbar { padding: 12px 16px; }
  .content { padding: 24px 16px; }
  .brand span { font-size: 14px; }
}
</style>
