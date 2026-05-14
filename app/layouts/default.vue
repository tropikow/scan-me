<template>
  <div class="page">
    <header class="topbar">
      <NuxtLink to="/" class="brand">ScanMe</NuxtLink>
      <nav class="actions">
        <NuxtLink to="/signin" class="btn">Sign in</NuxtLink>
        <NuxtLink to="/signup" class="btn btn-primary">Sign up</NuxtLink>
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
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border-subtle);
}

.brand {
  font-weight: 600;
  font-size: var(--font-h3);
}

.actions {
  display: flex;
  gap: 8px;
}

.content {
  flex: 1;
  padding: 32px;
}

@media (max-width: 640px) {
  .topbar { padding: 12px 16px; }
  .content { padding: 24px 16px; }
}
</style>
