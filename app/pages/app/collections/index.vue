<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — collections' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

type CollectionRow = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  position: number
}

type CollectionStat = {
  collection_id: string
  invoice_count: number
  total_amount: number | string
}

type InvoiceCardRow = {
  id: string
  vendor: string | null
  invoice_date: string | null
  created_at: string
  total: number | null
  currency: string | null
}

const active = ref<string | null>(null)
const expanded = ref<Set<string>>(new Set())

const { data: collections, refresh: refreshCollections } = await useAsyncData(
  'collections-list',
  async () => {
    if (!user.value) return [] as CollectionRow[]
    const { data, error } = await supabase
      .from('collections')
      .select('id, parent_id, name, slug, position')
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    if (error) return [] as CollectionRow[]
    return (data ?? []) as CollectionRow[]
  },
  { default: () => [] as CollectionRow[], watch: [user] },
)

const { data: stats, refresh: refreshStats } = await useAsyncData(
  'collections-stats',
  async () => {
    if (!user.value) return [] as CollectionStat[]
    const { data, error } = await supabase
      .from('v_collection_stats')
      .select('collection_id, invoice_count, total_amount')
    if (error) return [] as CollectionStat[]
    return (data ?? []) as CollectionStat[]
  },
  { default: () => [] as CollectionStat[], watch: [user] },
)

const statsMap = computed(() => {
  const map = new Map<string, { count: number; total: number }>()
  for (const s of stats.value ?? []) {
    map.set(s.collection_id, {
      count: Number(s.invoice_count) || 0,
      total: Number(s.total_amount) || 0,
    })
  }
  return map
})

const childrenByParent = computed(() => {
  const map = new Map<string | null, CollectionRow[]>()
  for (const row of collections.value ?? []) {
    const key = row.parent_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return map
})

type FlatNode = {
  id: string
  name: string
  depth: number
  count: number
  hasChildren: boolean
}

const flatTree = computed<FlatNode[]>(() => {
  const out: FlatNode[] = []
  const walk = (parentId: string | null, depth: number) => {
    const kids = childrenByParent.value.get(parentId) ?? []
    for (const c of kids) {
      const grand = childrenByParent.value.get(c.id) ?? []
      out.push({
        id: c.id,
        name: c.name,
        depth,
        count: statsMap.value.get(c.id)?.count ?? 0,
        hasChildren: grand.length > 0,
      })
      if (expanded.value.has(c.id)) walk(c.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
})

watchEffect(() => {
  const list = collections.value ?? []
  if (list.length === 0) return
  for (const c of list) {
    if (c.parent_id === null && (childrenByParent.value.get(c.id) ?? []).length > 0) {
      expanded.value.add(c.id)
    }
  }
  if (active.value === null) {
    const firstWithCount = list.find((c) => (statsMap.value.get(c.id)?.count ?? 0) > 0)
    active.value = (firstWithCount ?? list[0]!).id
  }
})

function toggle(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

const activeNode = computed(() => {
  if (!active.value) return null
  return (collections.value ?? []).find((c) => c.id === active.value) ?? null
})

const activeStats = computed(() => {
  if (!active.value) return { count: 0, total: 0 }
  return statsMap.value.get(active.value) ?? { count: 0, total: 0 }
})

const activeBreadcrumb = computed(() => {
  if (!activeNode.value) return ''
  const byId = new Map((collections.value ?? []).map((c) => [c.id, c] as const))
  const chain: string[] = []
  let cur: CollectionRow | undefined = activeNode.value
  while (cur) {
    chain.unshift(cur.name.toUpperCase())
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
  }
  return chain.join(' › ')
})

const { data: invoiceRows, pending: invoicesPending } = await useAsyncData(
  'collection-invoices',
  async () => {
    if (!active.value || !user.value) return [] as InvoiceCardRow[]
    const { data: links, error: linkErr } = await supabase
      .from('invoice_collections')
      .select('invoice_id')
      .eq('collection_id', active.value)
    if (linkErr || !links || links.length === 0) return [] as InvoiceCardRow[]
    const ids = links.map((l: { invoice_id: string }) => l.invoice_id)
    const { data, error } = await supabase
      .from('invoices')
      .select('id, vendor, invoice_date, created_at, total, currency')
      .in('id', ids)
      .order('invoice_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) return [] as InvoiceCardRow[]
    return (data ?? []) as InvoiceCardRow[]
  },
  { default: () => [] as InvoiceCardRow[], watch: [active, user] },
)

function formatDate(iso: string | null, fallback: string): string {
  const src = iso || fallback
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()
}

function formatAmount(n: number | null, currency: string | null): string {
  if (n == null) return '—'
  const sym =
    currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency || ''
  return `${sym} ${Number(n).toFixed(2)}`.trim()
}

function formatTotal(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function createCollection(parentId: string | null) {
  const promptLabel = parentId ? 'Sub-collection name' : 'Collection name'
  const raw = window.prompt(promptLabel)
  if (!raw) return
  const name = raw.trim()
  if (!name) return
  const slug = slugify(name)
  if (!slug) {
    window.alert('Please use a name containing at least one letter or number.')
    return
  }
  // Read the session straight from the Supabase client (source of truth)
  // rather than the Nuxt composable, which can be stale or unhydrated.
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  if (!session) {
    window.alert('Your session has expired. Please sign in again.')
    return
  }
  // user_id is filled by the column DEFAULT auth.uid() (migration 0004),
  // so we never have to send it from the client.
  const { error } = await supabase
    .from('collections')
    .insert({
      parent_id: parentId,
      name,
      slug,
    })
  if (error) {
    window.alert(`Could not create: ${error.message}`)
    return
  }
  await Promise.all([refreshCollections(), refreshStats()])
  if (parentId) expanded.value.add(parentId)
}

const monthLabel = new Date()
  .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  .toUpperCase()
</script>

<template>
  <div>
    <div class="topbar">
      <h1>Collections</h1>
      <div class="actions">
        <button class="btn btn-ghost btn-sm">Sort ▾</button>
        <button class="btn btn-primary btn-sm" @click="createCollection(null)">
          + New collection
        </button>
      </div>
    </div>

    <section class="route">
      <div v-if="(collections ?? []).length === 0" class="empty-state">
        <p>You haven't created any collections yet.</p>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="createCollection(null)"
        >
          + Create your first collection
        </button>
      </div>

      <div v-else class="coll-grid">
        <div class="coll-tree">
          <div class="hdr">
            <span class="lb">TREE</span>
            <button type="button" title="New top-level collection" @click="createCollection(null)">+</button>
          </div>
          <button
            v-for="node in flatTree"
            :key="node.id"
            type="button"
            class="ti"
            :class="{ indent: node.depth > 0, active: active === node.id }"
            :style="{ paddingLeft: 10 + node.depth * 16 + 'px' }"
            @click="active = node.id"
          >
            <span
              v-if="node.hasChildren"
              class="caret clickable"
              @click.stop="toggle(node.id)"
            >
              {{ expanded.has(node.id) ? '▾' : '▸' }}
            </span>
            <span v-else class="caret" aria-hidden="true">·</span>
            <span class="lbl">{{ node.name }}</span>
            <span class="ct">{{ node.count }}</span>
          </button>
        </div>

        <div class="coll-content">
          <template v-if="activeNode">
            <div class="crumb-row">
              <div class="crumb">{{ activeBreadcrumb }}</div>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="createCollection(activeNode.id)"
              >
                + Sub
              </button>
            </div>
            <h2>{{ activeNode.name }}</h2>
            <div class="meta">
              {{ activeStats.count }} INVOICE{{ activeStats.count === 1 ? '' : 'S' }}
              · {{ formatTotal(activeStats.total) }}
              · {{ monthLabel }}
            </div>

            <div v-if="invoicesPending" class="state-msg">Loading…</div>
            <div v-else-if="(invoiceRows ?? []).length === 0" class="state-msg">
              No invoices in this collection yet.
            </div>
            <div v-else class="inv-cards">
              <NuxtLink
                v-for="item in invoiceRows"
                :key="item.id"
                :to="`/app/invoices/${item.id}`"
                class="inv-card"
              >
                <div class="thumb" />
                <div class="name">{{ item.vendor || 'Unknown vendor' }}</div>
                <div class="row">
                  <span class="date">{{ formatDate(item.invoice_date, item.created_at) }}</span>
                  <span class="amt">{{ formatAmount(item.total, item.currency) }}</span>
                </div>
              </NuxtLink>
            </div>
          </template>
          <div v-else class="state-msg">Select a collection to see its invoices.</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.topbar {
  padding: 20px 36px;
  border-bottom: 1px solid var(--color-mist);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--color-snow) 80%, transparent);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  z-index: 5;
}
.topbar h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.025em; }
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.empty-state {
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  padding: 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--color-slate);
}
.empty-state p { margin: 0; font-size: 14px; }

.coll-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1000px) { .coll-grid { grid-template-columns: 1fr; } }

.coll-tree {
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.coll-tree .hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px 12px;
}
.coll-tree .hdr .lb {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.1em;
}
.coll-tree .hdr button {
  background: transparent;
  border: none;
  color: var(--color-slate);
  font-size: 16px;
  padding: 4px;
  line-height: 1;
  cursor: pointer;
}
.coll-tree .hdr button:hover { color: var(--color-ink); }

.ti {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  color: var(--color-slate);
  cursor: pointer;
  font-weight: 500;
  letter-spacing: -0.04px;
  background: transparent;
  border: 1px solid transparent;
  font-family: inherit;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.ti:hover { background: var(--color-snow); color: var(--color-ink); }
.ti.active {
  background: var(--color-snow);
  color: var(--color-ink);
  font-weight: 600;
  border-color: var(--color-mist);
}
.ti.indent { color: var(--color-graphite); font-size: 13px; }
.ti.indent.active { color: var(--color-ink); }
.ti .ct {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
}
.ti.active .ct { color: var(--color-slate); }
.ti .caret { width: 12px; opacity: 0.5; text-align: center; }
.ti .caret.clickable { cursor: pointer; opacity: 0.8; }
.ti .caret.clickable:hover { opacity: 1; }
.ti .lbl { flex-shrink: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.crumb-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.coll-content .crumb {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.coll-content h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.coll-content .meta {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
}

.state-msg {
  margin-top: 24px;
  padding: 32px;
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  font-size: 13px;
  color: var(--color-graphite);
  text-align: center;
  font-family: var(--font-mono);
}

.inv-cards {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.inv-card {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: 16px;
  color: inherit;
  transition: transform 0.18s, border-color 0.15s;
}
.inv-card:hover { transform: translateY(-2px); border-color: var(--color-mist); }
.inv-card .thumb {
  aspect-ratio: 4 / 3;
  background: var(--color-fog);
  border-radius: 6px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}
.inv-card .thumb::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 3px;
  background: #fdfbf6;
  background-image:
    linear-gradient(transparent calc(33% - 1px), rgba(0, 0, 0, 0.06) 33%, transparent 33%),
    linear-gradient(transparent calc(66% - 1px), rgba(0, 0, 0, 0.04) 66%, transparent 66%);
  transform: rotate(-1.5deg);
}
.inv-card .name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.inv-card .row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 6px;
}
.inv-card .row .date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
}
.inv-card .row .amt {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}
</style>
