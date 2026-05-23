<template>
  <div class="page">
    <header class="topbar">
      <NuxtLink to="/" class="brand">
        <img src="~/assets/images/logo-1.png" alt="" class="brand-img" />
        <span>scan-me</span>
      </NuxtLink>
      <nav class="actions">
        <NuxtLink to="/signin" class="btn btn-ghost btn-sm">Sign in</NuxtLink>
        <NuxtLink to="/signup" class="btn btn-primary btn-sm">Sign up</NuxtLink>
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
  background: var(--color-snow);
  color: var(--color-ink);
  font-family: var(--font-text);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border-bottom: 1px solid var(--color-mist);
  background: var(--color-snow);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}
.brand-img {
  height: 22px;
  width: auto;
  display: block;
}

.actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.content {
  flex: 1;
  padding: var(--space-8);
  min-width: 0;
}

@media (max-width: 768px) {
  .topbar { padding: var(--space-3) var(--space-4); }
  .content { padding: var(--space-6) var(--space-4); }
  .brand span { font-size: var(--text-body-sm); }
}
</style>
