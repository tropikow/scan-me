<script setup lang="ts">
definePageMeta({ layout: 'app' })

type Person = {
  id: string
  name: string
  role: string
  note: string | null
  created_at: string
  share_token: string
}

type InvoiceRow = {
  id: string
  vendor: string | null
  invoice_date: string | null
  created_at: string
  currency: string | null
  total: number | null
  voided_at: string | null
}

type CollectionLink = {
  invoice_id: string
  collections: { id: string; name: string } | null
  invoices: { total: number | null; person_id: string | null; voided_at: string | null } | null
}

const route = useRoute()
const supabase = useSupabaseClient()
const personId = computed(() => route.params.id as string)

const { data: person, refresh: refreshPerson } = await useAsyncData(
  () => `person-${personId.value}`,
  async () => {
    const { data, error } = await supabase
      .from('people')
      .select('id, name, role, note, created_at, share_token')
      .eq('id', personId.value)
      .maybeSingle()
    if (error) return null
    return (data as Person | null) ?? null
  },
  { watch: [personId] },
)

const { data: invoices } = await useAsyncData(
  () => `person-invoices-${personId.value}`,
  async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, vendor, invoice_date, created_at, currency, total, voided_at')
      .eq('person_id', personId.value)
      .is('voided_at', null)
      .order('invoice_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) return [] as InvoiceRow[]
    return (data ?? []) as InvoiceRow[]
  },
  { default: () => [] as InvoiceRow[], watch: [personId] },
)

const { data: collectionLinks } = await useAsyncData(
  () => `person-collections-${personId.value}`,
  async () => {
    const { data, error } = await supabase
      .from('invoice_collections')
      .select(
        'invoice_id, collections!inner(id, name), invoices!inner(total, person_id, voided_at)',
      )
      .eq('invoices.person_id', personId.value)
      .is('invoices.voided_at', null)
    if (error) return [] as CollectionLink[]
    return (data ?? []) as unknown as CollectionLink[]
  },
  { default: () => [] as CollectionLink[], watch: [personId] },
)

useHead({ title: () => `scan-me — ${person.value?.name ?? 'person'}` })

const shareLink = computed(() => {
  const token = person.value?.share_token
  if (!token) return ''
  // On the server we don't have window; we use the request origin from useRequestURL.
  const url = useRequestURL()
  return `${url.origin}/p/${token}`
})

const copied = ref(false)
const regenerating = ref(false)
const shareError = ref<string | null>(null)

async function copyShareLink() {
  shareError.value = null
  if (!shareLink.value) return
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    shareError.value = 'Could not copy. Long-press the link to copy manually.'
  }
}

async function regenerateShareLink() {
  if (regenerating.value || !person.value) return
  const ok = window.confirm(
    'Generate a new link? The current link will stop working immediately and ' +
    'anyone with it will have to use the new one.',
  )
  if (!ok) return
  regenerating.value = true
  shareError.value = null
  const newToken = crypto.randomUUID()
  const { error } = await supabase
    .from('people')
    .update({ share_token: newToken })
    .eq('id', person.value.id)
  regenerating.value = false
  if (error) {
    shareError.value = `Could not regenerate link: ${error.message}`
    return
  }
  await refreshPerson()
}

const dominantSymbol = computed(() => {
  const counts = new Map<string, number>()
  for (const i of invoices.value) {
    const c = i.currency ?? ''
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  let best = ''
  let bestN = 0
  for (const [k, n] of counts) {
    if (n > bestN) { best = k; bestN = n }
  }
  return currencySymbol(best) || '€'
})

function fmtMoney(n: number): string {
  return `${dominantSymbol.value} ${Math.round(n).toLocaleString('en-US')}`
}

function initialOf(name: string | null | undefined): string {
  const t = (name ?? '').trim()
  return t ? t[0]!.toUpperCase() : '·'
}

const monthRange = computed(() => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start, end }
})

// Align with dashboard.vue: "this month" is keyed off created_at (when the
// invoice was scanned), not the receipt's printed invoice_date, which often
// falls in a different calendar month.
function inThisMonth(createdAt: string): boolean {
  if (!createdAt) return false
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return false
  return d >= monthRange.value.start && d < monthRange.value.end
}

const thisMonthTotal = computed(() => {
  let sum = 0
  for (const i of invoices.value) {
    if (inThisMonth(i.created_at)) sum += Number(i.total ?? 0)
  }
  return sum
})

const allTimeTotal = computed(() => {
  let s = 0
  for (const i of invoices.value) s += Number(i.total ?? 0)
  return s
})

const allTimeCount = computed(() => invoices.value.length)
const recent = computed(() => invoices.value.slice(0, 4))

const sinceLabel = computed(() => {
  const src = person.value?.created_at
  if (!src) return ''
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
})

const submeta = computed(() => {
  const parts: string[] = []
  if (person.value?.role) parts.push(person.value.role.toUpperCase())
  if (person.value?.note) parts.push(person.value.note.toUpperCase())
  if (sinceLabel.value) parts.push(`SINCE ${sinceLabel.value}`)
  return parts.join(' · ')
})

type BdRow = { nm: string; v: string; raw: number; w: number }

const breakdown = computed<BdRow[]>(() => {
  const totals = new Map<string, number>()
  const linkedInvoiceIds = new Set<string>()

  for (const row of collectionLinks.value) {
    const name = row.collections?.name ?? 'Uncategorised'
    const amount = Number(row.invoices?.total ?? 0)
    totals.set(name, (totals.get(name) ?? 0) + amount)
    linkedInvoiceIds.add(row.invoice_id)
  }

  let uncat = 0
  for (const inv of invoices.value) {
    if (!linkedInvoiceIds.has(inv.id)) uncat += Number(inv.total ?? 0)
  }
  if (uncat > 0) totals.set('Uncategorised', (totals.get('Uncategorised') ?? 0) + uncat)

  const arr = Array.from(totals.entries())
    .map(([nm, raw]) => ({ nm, raw }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 6)

  const max = arr.reduce((m, r) => Math.max(m, r.raw), 0) || 1
  return arr.map((r) => ({
    nm: r.nm,
    raw: r.raw,
    v: fmtMoney(r.raw),
    w: Math.max(2, Math.round((r.raw / max) * 100)),
  }))
})

</script>

<template>
  <div>
    <div class="topbar">
      <div>
        <div class="crumb mono">
          <NuxtLink to="/app/people">People</NuxtLink> › {{ person?.name ?? '…' }}
        </div>
        <h1>{{ person?.name ?? 'Person not found' }}</h1>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" type="button">✎ Edit</button>
        <NuxtLink to="/app/scan" class="btn btn-primary btn-sm">+ Assign invoice</NuxtLink>
      </div>
    </div>

    <section v-if="person" class="route">
      <div class="person-hero">
        <span class="avatar lg hero-avatar">{{ initialOf(person.name) }}</span>
        <div>
          <h2>{{ person.name }}</h2>
          <div class="submeta">{{ submeta }}</div>
          <div class="chips">
            <span class="chip solid">{{ person.role }}</span>
          </div>
        </div>
        <div class="right">
          <div class="lbl">THIS MONTH</div>
          <div class="num">{{ fmtMoney(thisMonthTotal) }}</div>
          <div class="lbl spaced">
            {{ allTimeCount }} {{ allTimeCount === 1 ? 'INVOICE' : 'INVOICES' }} ·
            ALL TIME {{ fmtMoney(allTimeTotal) }}
          </div>
        </div>
      </div>

      <div class="share-card">
        <div class="share-head">
          <div>
            <div class="share-title">Public upload link</div>
            <div class="share-hint">
              {{ person.name }} can use this link to send you a receipt without signing in.
              Anyone with the link can upload — keep it private.
            </div>
          </div>
          <div class="share-actions">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="regenerating"
              @click="regenerateShareLink"
            >
              {{ regenerating ? 'Regenerating…' : '↻ Regenerate' }}
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!shareLink"
              @click="copyShareLink"
            >
              {{ copied ? '✓ Copied' : 'Copy link' }}
            </button>
          </div>
        </div>
        <div class="share-link mono">{{ shareLink || '…' }}</div>
        <div v-if="shareError" class="share-error">{{ shareError }}</div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-title-row">
            <h3>Recent receipts</h3>
            <NuxtLink
              v-if="allTimeCount > recent.length"
              to="/app/invoices"
              class="btn btn-ghost btn-sm"
            >
              See all {{ allTimeCount }} →
            </NuxtLink>
          </div>

          <div v-if="recent.length" class="inv-cards">
            <NuxtLink
              v-for="r in recent"
              :key="r.id"
              :to="`/app/invoices/${r.id}`"
              class="inv-card"
            >
              <div class="thumb" />
              <div class="name">{{ r.vendor || 'Untitled' }}</div>
              <div class="row">
                <span class="date">{{ formatShortDate(r.invoice_date, r.created_at) }}</span>
                <span class="amt">{{ formatAmount(r.total, r.currency) }}</span>
              </div>
            </NuxtLink>
          </div>
          <div v-else class="empty">
            No invoices assigned to {{ person.name }} yet.
            <NuxtLink to="/app/scan" class="link">Assign one →</NuxtLink>
          </div>
        </div>

        <div class="card">
          <div class="card-title-row">
            <h3>By collection</h3>
            <span class="chip outline mono">ALL TIME</span>
          </div>
          <div v-if="breakdown.length" class="breakdown">
            <div v-for="b in breakdown" :key="b.nm">
              <div class="bd-row">
                <span class="nm">{{ b.nm }}</span>
                <span class="v">{{ b.v }}</span>
              </div>
              <div class="bd-bar"><i :style="{ width: `${b.w}%` }" /></div>
            </div>
          </div>
          <div v-else class="empty">No collection data yet.</div>
        </div>
      </div>
    </section>

    <section v-else class="route">
      <div class="not-found">
        <h2>Person not found</h2>
        <p>This person may have been deleted, or you don't have access to it.</p>
        <NuxtLink to="/app/people" class="btn btn-primary btn-sm">← Back to People</NuxtLink>
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
.crumb {
  font-size: 13px;
  color: var(--color-graphite);
  letter-spacing: -0.005em;
  margin-bottom: 4px;
}
.crumb a { color: var(--color-graphite); transition: color 0.15s; }
.crumb a:hover { color: var(--color-ink); }
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.person-hero {
  background: var(--color-ink);
  color: var(--color-snow);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}
.hero-avatar {
  width: 88px;
  height: 88px;
  font-size: 36px;
  background: rgba(255, 255, 255, 0.10);
  color: var(--color-snow);
}
.person-hero h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.person-hero .submeta {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: color-mix(in srgb, var(--color-snow) 65%, transparent);
  letter-spacing: 0.04em;
}
.person-hero .chips { display: flex; gap: 8px; margin-top: 14px; }
.chip.translucent {
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.85);
}
.person-hero .right { margin-left: auto; text-align: right; }
.person-hero .right .lbl {
  font-family: var(--font-mono);
  font-size: 11px;
  color: color-mix(in srgb, var(--color-snow) 55%, transparent);
  letter-spacing: 0.08em;
}
.person-hero .right .lbl.spaced { margin-top: 10px; }
.person-hero .right .num {
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-top: 4px;
}

.split {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
@media (max-width: 1000px) { .split { grid-template-columns: 1fr; } }

.card {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.015em;
}
.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* Recent receipts — mirrors .inv-card in app/pages/app/invoices/index.vue */
.inv-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
.inv-card {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: 16px;
  color: inherit;
  transition: transform 0.18s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.breakdown {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}
.bd-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}
.bd-row .nm {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.bd-row .v {
  font-family: var(--font-mono);
  font-weight: 600;
}
.bd-bar {
  height: 4px;
  background: var(--color-fog);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.bd-bar > i {
  display: block;
  height: 100%;
  background: var(--color-ink);
  border-radius: 2px;
}

.empty {
  padding: 18px 4px;
  text-align: center;
  font-size: 13.5px;
  color: var(--color-graphite);
  letter-spacing: -0.005em;
}
.empty .link {
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-left: 6px;
}

.not-found {
  padding: 64px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.not-found h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.not-found p {
  margin: 0 0 8px;
  color: var(--color-graphite);
  font-size: 14px;
}

/* === Share link card === */
.share-card {
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.share-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.share-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--color-ink);
}
.share-hint {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--color-graphite);
  line-height: 1.45;
  max-width: 64ch;
}
.share-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.share-link {
  padding: 12px 14px;
  background: var(--color-fog);
  border: 1px solid var(--color-mist);
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--color-slate);
  word-break: break-all;
  user-select: all;
}
.share-error {
  padding: 10px 12px;
  background: var(--color-error);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-ink);
}
</style>
