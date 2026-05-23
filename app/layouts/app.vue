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

const { data: invoiceCount, refresh: refreshInvoiceCount } = await useAsyncData(
  'sidebar-invoice-count',
  async () => {
    if (!user.value) return 0
    const { count, error } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
    if (error) return 0
    return count ?? 0
  },
  { default: () => 0, watch: [user] },
)

const { data: peopleCount } = await useAsyncData(
  'sidebar-people-count',
  async () => {
    if (!user.value) return 0
    const { count, error } = await supabase
      .from('people')
      .select('id', { count: 'exact', head: true })
    if (error) return 0
    return count ?? 0
  },
  { default: () => 0, watch: [user] },
)

// ─── Sidebar search ───────────────────────────────────────────────────────
type PersonHit = { id: string; name: string; role: string }
type InvoiceHit = {
  id: string
  vendor: string | null
  total: number | null
  currency: string | null
  created_at: string
}

const searchQuery = ref('')
const showResults = ref(false)
const searching = ref(false)
const peopleHits = ref<PersonHit[]>([])
const invoiceHits = ref<InvoiceHit[]>([])
const searchContainer = ref<HTMLElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0

// Escape LIKE wildcards so the user types literal text, not patterns.
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`)
}

async function runSearch(raw: string) {
  const q = raw.trim()
  if (q.length < 2) {
    peopleHits.value = []
    invoiceHits.value = []
    searching.value = false
    return
  }
  const seq = ++searchSeq
  searching.value = true
  const pattern = `%${escapeLike(q)}%`

  const [peopleRes, invoiceRes] = await Promise.all([
    supabase
      .from('people')
      .select('id, name, role')
      .ilike('name', pattern)
      .order('name', { ascending: true })
      .limit(5),
    supabase
      .from('invoices')
      .select('id, vendor, total, currency, created_at')
      .ilike('vendor', pattern)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Drop out-of-order responses (later query already started).
  if (seq !== searchSeq) return

  peopleHits.value = (peopleRes.error ? [] : (peopleRes.data ?? [])) as PersonHit[]
  invoiceHits.value = (invoiceRes.error ? [] : (invoiceRes.data ?? [])) as InvoiceHit[]
  searching.value = false
}

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!val.trim()) {
    peopleHits.value = []
    invoiceHits.value = []
    searching.value = false
    return
  }
  searchTimer = setTimeout(() => runSearch(val), 180)
})

function focusSearch() {
  showResults.value = true
}

function clearSearch() {
  searchQuery.value = ''
  peopleHits.value = []
  invoiceHits.value = []
  showResults.value = false
}

function onClickOutside(e: MouseEvent) {
  const root = searchContainer.value
  if (!root) return
  if (!root.contains(e.target as Node)) {
    showResults.value = false
  }
}

const hasResults = computed(
  () => peopleHits.value.length > 0 || invoiceHits.value.length > 0,
)

const formatAmount = (n: number | null, currency: string | null) => {
  if (n == null) return ''
  const sym =
    currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency || ''
  return `${sym} ${n.toFixed(2)}`.trim()
}

const mobileNavOpen = ref(false)

function openMobileNav() {
  mobileNavOpen.value = true
}
function closeMobileNav() {
  mobileNavOpen.value = false
}

// Close the dropdown / drawer when the route changes (user clicked a result, etc.)
watch(() => router.currentRoute.value.fullPath, () => {
  showResults.value = false
  mobileNavOpen.value = false
})

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  if (searchTimer) clearTimeout(searchTimer)
})

async function signOut() {
  await supabase.auth.signOut()
  await router.push('/signin')
}
</script>

<template>
  <div class="shell" :class="{ 'nav-open': mobileNavOpen }">
    <button
      type="button"
      class="mobile-menu-btn"
      aria-label="Open menu"
      @click="openMobileNav"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
    </button>

    <div
      v-if="mobileNavOpen"
      class="mobile-overlay"
      aria-hidden="true"
      @click="closeMobileNav"
    />

    <aside class="sidebar" :class="{ open: mobileNavOpen }">
      <div class="sb-head">
        <NuxtLink to="/app/dashboard" class="sb-logo">
          <img src="~/assets/images/logo-1.png" alt="" class="sb-logo-img" />
          <span>scan-me</span>
        </NuxtLink>
        <button class="btn btn-icon sb-close" title="Close menu" aria-label="Close menu" @click="closeMobileNav">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
        <button class="btn btn-icon sb-notif" title="Notifications" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M9 17a3 3 0 0 0 6 0"/></svg>
        </button>
      </div>

      <div ref="searchContainer" class="sb-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="16.3" y1="16.3" x2="21" y2="21"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search receipts, people…"
          autocomplete="off"
          spellcheck="false"
          @focus="focusSearch"
          @keydown.esc="clearSearch"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="sb-search-clear"
          aria-label="Clear search"
          @click="clearSearch"
        >×</button>
        <kbd v-else>⌘K</kbd>

        <div
          v-if="showResults && searchQuery.trim().length >= 2"
          class="sb-search-panel"
          role="listbox"
        >
          <div v-if="searching && !hasResults" class="sb-search-state mono">Searching…</div>
          <template v-else-if="hasResults">
            <div v-if="peopleHits.length" class="sb-search-group">
              <div class="sb-search-group-lb mono">People</div>
              <NuxtLink
                v-for="p in peopleHits"
                :key="`p-${p.id}`"
                :to="`/app/people/${p.id}`"
                class="sb-search-item"
                @click="clearSearch"
              >
                <span class="sb-search-avatar">{{ p.name.charAt(0).toUpperCase() }}</span>
                <span class="sb-search-text">
                  <span class="sb-search-name">{{ p.name }}</span>
                  <span class="sb-search-meta mono">{{ p.role }}</span>
                </span>
              </NuxtLink>
            </div>
            <div v-if="invoiceHits.length" class="sb-search-group">
              <div class="sb-search-group-lb mono">Invoices</div>
              <NuxtLink
                v-for="inv in invoiceHits"
                :key="`i-${inv.id}`"
                :to="`/app/invoices/${inv.id}`"
                class="sb-search-item"
                @click="clearSearch"
              >
                <span class="sb-search-avatar mono">{{ (inv.vendor || '·').charAt(0).toUpperCase() }}</span>
                <span class="sb-search-text">
                  <span class="sb-search-name">{{ inv.vendor || 'Untitled' }}</span>
                  <span class="sb-search-meta mono">{{ formatAmount(inv.total, inv.currency) }}</span>
                </span>
              </NuxtLink>
            </div>
          </template>
          <div v-else class="sb-search-state mono">No matches</div>
        </div>
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
          <span v-if="invoiceCount" class="count">{{ invoiceCount }}</span>
        </NuxtLink>
        <NuxtLink to="/app/collections" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7a1 1 0 0 1 1-1h4l2 2h10a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>
          Collections
        </NuxtLink>
        <NuxtLink to="/app/people" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 16c.5-1.5 2-2.5 4-2.5s3 1 3 2.5"/></svg>
          People
          <span v-if="peopleCount" class="count">{{ peopleCount }}</span>
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
  grid-template-columns: var(--layout-sidebar) 1fr;
  min-height: 100vh;
  background: var(--color-fog);
  color: var(--color-ink);
  font-family: var(--font-text);
}

.sidebar {
  border-right: 1px solid var(--color-mist);
  padding: var(--space-6) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  background: var(--color-snow);
  position: sticky;
  top: 0;
  height: 100vh;
}

.mobile-menu-btn {
  display: none;
  position: fixed;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 30;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-md);
  color: var(--color-ink);
  cursor: pointer;
}
.mobile-menu-btn:hover { background: var(--color-fog); }

.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 40;
  animation: overlay-in 0.18s ease-out;
}
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sb-close { display: none; }

@media (max-width: 1024px) {
  .shell { grid-template-columns: 1fr; }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(86vw, 300px);
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.22s ease-out;
    z-index: 50;
    overflow-y: auto;
  }
  .sidebar.open { transform: translateX(0); }

  .mobile-menu-btn { display: inline-flex; }
  .mobile-overlay { display: block; }
  .sb-close { display: inline-flex; }
  .sb-notif { display: none; }
}

.sb-head {
  padding: 0 var(--space-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sb-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: 15px;
  color: var(--color-ink);
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
  padding: var(--space-2) var(--space-3) var(--space-2) 32px;
  background: var(--color-fog);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  color: var(--color-ink);
  letter-spacing: -0.04px;
  outline: none;
  transition: background var(--transition), border-color var(--transition);
}
.sb-search input::placeholder { color: var(--color-graphite); }
.sb-search input:focus { background: var(--color-snow); border-color: var(--color-action); }
.sb-search svg {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-graphite);
  width: 14px;
  height: 14px;
}
.sb-search kbd {
  position: absolute;
  right: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-graphite);
  background: var(--color-snow);
  padding: 2px 5px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-mist);
}
.sb-search-clear {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-graphite);
  font-size: var(--text-body);
  line-height: 1;
  padding: var(--space-1) 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.sb-search-clear:hover { color: var(--color-ink); background: var(--color-fog); }

.sb-search-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 6px;
  right: 6px;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-md);
  padding: 6px;
  max-height: 360px;
  overflow-y: auto;
  box-shadow: var(--shadow-popover);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sb-search-state {
  padding: var(--space-3) var(--space-3);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}
.sb-search-group { display: flex; flex-direction: column; gap: 1px; }
.sb-search-group-lb {
  padding: 6px var(--space-3) var(--space-1);
  font-size: 10px;
  color: var(--color-graphite);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.sb-search-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: inherit;
  transition: background 0.12s;
}
.sb-search-item:hover { background: var(--color-fog); text-decoration: none; }
.sb-search-avatar {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--color-fog);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-ink);
  flex-shrink: 0;
}
.sb-search-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.sb-search-name {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.04px;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sb-search-meta {
  font-size: 10.5px;
  color: var(--color-graphite);
  letter-spacing: 0.04em;
  margin-top: 1px;
}

.sb-scan {
  background: var(--color-action);
  color: var(--color-snow);
  padding: 9px var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: background var(--transition);
}
.sb-scan:hover { background: var(--color-action-hover); text-decoration: none; }
.sb-scan svg { width: 16px; height: 16px; }
.sb-scan .kbd {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 5px;
  border-radius: var(--radius-sm);
}

.sb-nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-slate);
  font-size: var(--text-body-sm);
  font-weight: 500;
  letter-spacing: -0.04px;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  width: 100%;
}
.nav-item:hover { background: var(--color-fog); color: var(--color-ink); text-decoration: none; }
.nav-item.router-link-active {
  background: var(--color-fog);
  color: var(--color-ink);
  font-weight: 600;
}
.nav-item :deep(svg) { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.8; }
.nav-item.router-link-active :deep(svg) { opacity: 1; }
.nav-item .count {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
}

.sb-foot {
  margin-top: auto;
  padding: 0 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb-nav-label {
  padding: 0 var(--space-3);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-graphite);
  letter-spacing: 0.1em;
  margin: var(--space-2) 0 6px;
}
.sb-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: background var(--transition);
}
.sb-user:hover { background: var(--color-fog); }
.sb-user-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.04px;
  line-height: 1.1;
  color: var(--color-ink);
}
.sb-user-plan {
  font-size: 11px;
  color: var(--color-graphite);
  font-family: var(--font-mono);
}
.sb-user .gear { margin-left: auto; color: var(--color-graphite); }

.main { min-width: 0; overflow-x: hidden; }
@media (max-width: 1024px) {
  .main { padding-top: 0; }
}
</style>
