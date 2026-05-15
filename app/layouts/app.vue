<script setup lang="ts">
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const displayName = computed(() => {
  const meta = user.value?.user_metadata as { full_name?: string } | undefined
  return meta?.full_name || user.value?.email || 'Account'
})

const avatarInitial = computed(() => {
  const source = displayName.value || user.value?.email || '?'
  return source.charAt(0).toUpperCase()
})

const planLabel = computed(() => {
  const meta = user.value?.user_metadata as { account_type?: string } | undefined
  const type = meta?.account_type === 'business' ? 'BUSINESS' : 'PERSONAL'
  return `${type} · FREE`
})

async function signOut() {
  await supabase.auth.signOut()
  await router.push('/signin')
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="sb-head">
        <NuxtLink to="/app/dashboard" class="sb-logo">
          <img src="~/assets/images/logo-1.png" alt="" class="sb-logo-img" />
          <span>scan-me</span>
        </NuxtLink>
        <button class="btn-hifi btn-icon" title="Notifications" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M9 17a3 3 0 0 0 6 0"/></svg>
        </button>
      </div>

      <div class="sb-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="16.3" y1="16.3" x2="21" y2="21"/></svg>
        <input type="text" placeholder="Search receipts, people…" />
        <kbd>⌘K</kbd>
      </div>

      <NuxtLink to="/app/scan" class="sb-scan">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
        Scan a receipt
        <span class="kbd">⌘N</span>
      </NuxtLink>

      <nav class="sb-nav">
        <NuxtLink to="/app/dashboard" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          Dashboard
        </NuxtLink>
        <NuxtLink to="/app/invoices" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
          Invoices
          <span class="count">47</span>
        </NuxtLink>
        <NuxtLink to="/app/collections" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7a1 1 0 0 1 1-1h4l2 2h10a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>
          Collections
        </NuxtLink>
        <NuxtLink to="/app/people" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 16c.5-1.5 2-2.5 4-2.5s3 1 3 2.5"/></svg>
          People
          <span class="count">7</span>
        </NuxtLink>
      </nav>

      <div class="sb-foot">
        <div class="sb-nav-label">ACCOUNT</div>
        <button type="button" class="nav-item" @click="signOut">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 17l5-5-5-5"/><line x1="20" y1="12" x2="9" y2="12"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
          Sign out
        </button>
        <div class="sb-user">
          <span class="avatar md">{{ avatarInitial }}</span>
          <div>
            <div class="sb-user-name">{{ displayName }}</div>
            <div class="sb-user-plan">{{ planLabel }}</div>
          </div>
        </div>
      </div>
    </aside>

    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, 'Helvetica Neue', sans-serif;
}
@media (max-width: 880px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none !important; }
}

.sidebar {
  border-right: 1px solid var(--line);
  padding: 22px 14px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  background: var(--bg);
  position: sticky;
  top: 0;
  height: 100vh;
}

.sb-head {
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sb-logo {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: 15px;
  color: var(--ink);
}
.sb-logo-img {
  height: 22px;
  width: auto;
  display: block;
}

.sb-search {
  position: relative;
  padding: 0 6px;
}
.sb-search input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  background: var(--surface);
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  color: var(--ink);
  letter-spacing: -0.005em;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
}
.sb-search input::placeholder { color: var(--ink-3); }
.sb-search input:focus { background: var(--bg); border-color: var(--ink); }
.sb-search svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  width: 14px;
  height: 14px;
}
.sb-search kbd {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 10px;
  color: var(--ink-3);
  background: var(--bg);
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid var(--line);
}

.sb-scan {
  background: var(--ink);
  color: var(--accent-ink);
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.18s;
}
.sb-scan:hover { transform: scale(0.985); }
.sb-scan svg { width: 16px; height: 16px; }
.sb-scan .kbd {
  margin-left: auto;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 10px;
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 5px;
  border-radius: 3px;
}

.sb-nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--ink-2);
  font-size: 13.5px;
  font-weight: 450;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  width: 100%;
}
.nav-item:hover { background: var(--surface); color: var(--ink); }
.nav-item.router-link-active {
  background: var(--surface);
  color: var(--ink);
  font-weight: 500;
}
.nav-item :deep(svg) { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.8; }
.nav-item.router-link-active :deep(svg) { opacity: 1; }
.nav-item .count {
  margin-left: auto;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
}

.sb-foot {
  margin-top: auto;
  padding: 0 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb-nav-label {
  padding: 0 12px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
  margin: 8px 0 6px;
}
.sb-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.15s;
}
.sb-user:hover { background: var(--surface); }
.sb-user-name {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  line-height: 1.1;
  color: var(--ink);
}
.sb-user-plan {
  font-size: 11px;
  color: var(--ink-3);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
}
.sb-user .gear { margin-left: auto; color: var(--ink-3); }

.main { min-width: 0; }
</style>
