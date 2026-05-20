<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

function startOfWeekISO(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = (day + 6) % 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
  return monday.toISOString()
}

const _now = new Date()
const curMonthStart = new Date(_now.getFullYear(), _now.getMonth(), 1).toISOString()
const nextMonthStart = new Date(_now.getFullYear(), _now.getMonth() + 1, 1).toISOString()
const prevMonthStart = new Date(_now.getFullYear(), _now.getMonth() - 1, 1).toISOString()
const prevMonthLabel = new Date(_now.getFullYear(), _now.getMonth() - 1, 1)
  .toLocaleDateString('en-US', { month: 'long' })
  .toUpperCase()

const daysInCurMonth = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate()
const curMonthLabel = _now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const curDayOfMonth = _now.getDate()

const { data: monthSpend } = await useAsyncData(
  'dashboard-month-spend',
  async () => {
    if (!user.value) return { current: 0, previous: 0 }
    const [curRes, prevRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('total')
        .is('voided_at', null)
        .gte('created_at', curMonthStart)
        .lt('created_at', nextMonthStart),
      supabase
        .from('invoices')
        .select('total')
        .is('voided_at', null)
        .gte('created_at', prevMonthStart)
        .lt('created_at', curMonthStart),
    ])
    const sum = (rows: { total: number | null }[] | null | undefined) =>
      (rows ?? []).reduce((acc, r) => acc + (r.total ?? 0), 0)
    const count = (rows: { total: number | null }[] | null | undefined) =>
      (rows ?? []).length
    return {
      current: curRes.error ? 0 : sum(curRes.data),
      previous: prevRes.error ? 0 : sum(prevRes.data),
      currentCount: curRes.error ? 0 : count(curRes.data),
      previousCount: prevRes.error ? 0 : count(prevRes.data),
    }
  },
  {
    default: () => ({ current: 0, previous: 0, currentCount: 0, previousCount: 0 }),
    watch: [user],
  },
)

const monthSpendDisplay = computed(() => {
  const cur = monthSpend.value?.current ?? 0
  const prev = monthSpend.value?.previous ?? 0
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  let delta = '—'
  if (prev > 0) {
    const pct = Math.round(((cur - prev) / prev) * 100)
    const arrow = pct >= 0 ? '↑' : '↓'
    delta = `${arrow} ${Math.abs(pct)}%`
  } else if (cur > 0) {
    delta = 'NEW'
  }
  return {
    amount: fmt(cur),
    prevAmount: fmt(prev),
    prevLabel: prevMonthLabel,
    delta,
  }
})

const { data: dailySpendRows } = await useAsyncData(
  'dashboard-daily-spend',
  async () => {
    if (!user.value) return [] as { created_at: string; total: number | null }[]
    const { data, error } = await supabase
      .from('invoices')
      .select('created_at, total')
      .is('voided_at', null)
      .gte('created_at', curMonthStart)
      .lt('created_at', nextMonthStart)
    if (error) return [] as { created_at: string; total: number | null }[]
    return (data ?? []) as { created_at: string; total: number | null }[]
  },
  {
    default: () => [] as { created_at: string; total: number | null }[],
    watch: [user],
  },
)

const dashData = computed<number[]>(() => {
  const buckets = new Array(daysInCurMonth).fill(0) as number[]
  for (const row of dailySpendRows.value ?? []) {
    if (!row.created_at) continue
    const d = new Date(row.created_at)
    if (Number.isNaN(d.getTime())) continue
    const idx = d.getDate() - 1
    if (idx < 0 || idx >= buckets.length) continue
    buckets[idx] = (buckets[idx] ?? 0) + (row.total ?? 0)
  }
  return buckets
})

const dashMax = computed(() => {
  const max = Math.max(0, ...dashData.value)
  return max === 0 ? 1 : max
})

const dashHasData = computed(() => dashData.value.some((v) => v > 0))

const axisLabels = computed(() => {
  const last = daysInCurMonth
  const stops = [1, 5, 10, 15, 20, 25, last]
  return stops.map((d) => String(d).padStart(2, '0'))
})

const { data: topCategory } = await useAsyncData(
  'dashboard-top-category',
  async () => {
    if (!user.value) return null as { name: string; amount: number } | null
    const [invRes, linksRes, collRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, total')
        .is('voided_at', null)
        .gte('created_at', curMonthStart)
        .lt('created_at', nextMonthStart),
      supabase.from('invoice_collections').select('invoice_id, collection_id'),
      supabase.from('collections').select('id, parent_id, name'),
    ])
    if (invRes.error || linksRes.error || collRes.error) return null
    type CollNode = { id: string; parent_id: string | null; name: string }
    const invoiceTotals = new Map<string, number>()
    for (const i of (invRes.data ?? []) as { id: string; total: number | null }[]) {
      invoiceTotals.set(i.id, Number(i.total ?? 0))
    }
    const collById = new Map<string, CollNode>()
    for (const c of (collRes.data ?? []) as CollNode[]) collById.set(c.id, c)
    const rootCache = new Map<string, string | null>()
    const rootOf = (id: string): string | null => {
      const cached = rootCache.get(id)
      if (cached !== undefined) return cached
      let cur = collById.get(id)
      let safety = 0
      while (cur && cur.parent_id && safety < 50) {
        const next = collById.get(cur.parent_id)
        if (!next) break
        cur = next
        safety++
      }
      const rootId = cur?.id ?? null
      rootCache.set(id, rootId)
      return rootId
    }
    const totalByRoot = new Map<string, number>()
    const seenByRoot = new Map<string, Set<string>>()
    type LinkRow = { invoice_id: string; collection_id: string }
    for (const link of (linksRes.data ?? []) as LinkRow[]) {
      const total = invoiceTotals.get(link.invoice_id)
      if (total == null) continue // outside the month, voided, or not visible
      const rootId = rootOf(link.collection_id)
      if (!rootId) continue
      const seen = seenByRoot.get(rootId) ?? new Set<string>()
      if (seen.has(link.invoice_id)) continue
      seen.add(link.invoice_id)
      seenByRoot.set(rootId, seen)
      totalByRoot.set(rootId, (totalByRoot.get(rootId) ?? 0) + total)
    }
    if (totalByRoot.size === 0) return null
    let topId: string | null = null
    let topAmount = 0
    for (const [rootId, amount] of totalByRoot) {
      if (amount > topAmount) {
        topAmount = amount
        topId = rootId
      }
    }
    if (!topId) return null
    return {
      name: collById.get(topId)?.name ?? 'Untitled',
      amount: topAmount,
    }
  },
  { default: () => null as { name: string; amount: number } | null, watch: [user] },
)

const topCategoryKpi = computed(() => {
  const t = topCategory.value
  if (!t) {
    return { value: '—', valueSmall: true, sub: 'No assignments this month' }
  }
  const totalMonth = monthSpend.value?.current ?? 0
  const pct = totalMonth > 0 ? Math.round((t.amount / totalMonth) * 100) : 0
  const amt = Math.round(t.amount).toLocaleString('en-US')
  return {
    value: t.name,
    valueSmall: true,
    sub: pct > 0 ? `€ ${amt} · ${pct}%` : `€ ${amt}`,
  }
})

const { data: peopleStats } = await useAsyncData(
  'dashboard-people-stats',
  async () => {
    if (!user.value) return { total: 0, topRole: null as string | null, topRoleCount: 0 }
    const { data, error } = await supabase
      .from('people')
      .select('role')
    if (error) return { total: 0, topRole: null as string | null, topRoleCount: 0 }
    const rows = (data ?? []) as { role: string }[]
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.role, (counts.get(r.role) ?? 0) + 1)
    let topRole: string | null = null
    let topRoleCount = 0
    for (const [role, count] of counts) {
      if (count > topRoleCount) {
        topRole = role
        topRoleCount = count
      }
    }
    return { total: rows.length, topRole, topRoleCount }
  },
  {
    default: () => ({ total: 0, topRole: null as string | null, topRoleCount: 0 }),
    watch: [user],
  },
)

const peopleKpi = computed(() => {
  const total = peopleStats.value?.total ?? 0
  const topRole = peopleStats.value?.topRole
  const topRoleCount = peopleStats.value?.topRoleCount ?? 0
  if (total === 0) return { value: '0', sub: 'None tracked' }
  const sub = topRole ? `${topRoleCount} ${topRole.toLowerCase()}` : `${total} tracked`
  return { value: String(total), sub }
})

const { data: invoiceStats } = await useAsyncData(
  'dashboard-invoice-stats',
  async () => {
    if (!user.value) return { total: 0, thisWeek: 0 }
    const weekStart = startOfWeekISO()
    const [totalRes, weekRes] = await Promise.all([
      supabase.from('invoices').select('id', { count: 'exact', head: true }),
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart),
    ])
    return {
      total: totalRes.error ? 0 : totalRes.count ?? 0,
      thisWeek: weekRes.error ? 0 : weekRes.count ?? 0,
    }
  },
  { default: () => ({ total: 0, thisWeek: 0 }), watch: [user] },
)

const avgInvoice = computed(() => {
  const cur = monthSpend.value?.current ?? 0
  const curN = monthSpend.value?.currentCount ?? 0
  const prev = monthSpend.value?.previous ?? 0
  const prevN = monthSpend.value?.previousCount ?? 0
  const curAvg = curN > 0 ? Math.round(cur / curN) : 0
  const prevAvg = prevN > 0 ? Math.round(prev / prevN) : 0
  const value = curN === 0 ? '—' : `€ ${curAvg}`
  let sub = '—'
  if (curN > 0 && prevN > 0) {
    const diff = curAvg - prevAvg
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '·'
    sub = diff === 0
      ? `· same as ${prevMonthLabel}`
      : `${arrow} €${Math.abs(diff)} vs ${prevMonthLabel}`
  } else if (curN > 0) {
    sub = 'NEW'
  }
  return { value, sub }
})

const kpis = computed(() => [
  {
    lbl: 'INVOICES',
    value: String(invoiceStats.value?.total ?? 0),
    sub:
      (invoiceStats.value?.thisWeek ?? 0) > 0
        ? `+ ${invoiceStats.value?.thisWeek} this week`
        : 'No new this week',
  },
  { lbl: 'PEOPLE', value: peopleKpi.value.value, sub: peopleKpi.value.sub },
  {
    lbl: 'TOP CATEGORY',
    value: topCategoryKpi.value.value,
    valueSmall: topCategoryKpi.value.valueSmall,
    sub: topCategoryKpi.value.sub,
  },
  { lbl: 'AVG / INVOICE', value: avgInvoice.value.value, sub: avgInvoice.value.sub },
])

type RecentInvoice = {
  id: string
  vendor: string | null
  invoice_date: string | null
  currency: string | null
  total: number | null
  created_at: string
}

const { data: recentRows } = await useAsyncData(
  'dashboard-recent-invoices',
  async () => {
    if (!user.value) return [] as RecentInvoice[]
    const { data, error } = await supabase
      .from('invoices')
      .select('id, vendor, invoice_date, currency, total, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) return [] as RecentInvoice[]
    return (data ?? []) as RecentInvoice[]
  },
  { default: () => [] as RecentInvoice[], watch: [user] },
)

function initialsFor(vendor: string | null): string {
  if (!vendor) return '··'
  const parts = vendor.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '··'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

function formatMetaDate(iso: string | null, fallback: string): string {
  const src = iso || fallback
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return '—'
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    .toUpperCase()
}

function formatAmount(n: number | null, currency: string | null): string {
  if (n == null) return '—'
  const symbol =
    currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency || ''
  return `${symbol} ${n.toFixed(2)}`.trim()
}

const recent = computed(() =>
  (recentRows.value ?? []).map((row) => ({
    id: row.id,
    code: initialsFor(row.vendor),
    name: row.vendor || 'Unknown vendor',
    meta: `${formatMetaDate(row.invoice_date, row.created_at)} · ${row.currency || '—'}`,
    amt: formatAmount(row.total, row.currency),
  })),
)
</script>

<template>
  <div>
    <div class="topbar">
      <h1>Dashboard</h1>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm">↓ Export</button>
        <NuxtLink to="/app/scan" class="btn-hifi btn-primary btn-sm">+ New scan</NuxtLink>
      </div>
    </div>

    <section class="route">
      <div class="dash-hero">
        <div class="card card-dark">
          <span class="card-eyebrow">SPENT THIS MONTH</span>
          <div class="hero-amount">
            <div>
              <div class="num">€ {{ monthSpendDisplay.amount }}</div>
              <div class="hero-meta">VS € {{ monthSpendDisplay.prevAmount }} IN {{ monthSpendDisplay.prevLabel }}</div>
            </div>
            <span class="delta">{{ monthSpendDisplay.delta }}</span>
          </div>
          <svg class="spark" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path d="M 0 60 L 25 50 L 50 55 L 75 42 L 100 48 L 125 38 L 150 44 L 175 30 L 200 36 L 225 24 L 250 28 L 275 18 L 300 22 L 325 14 L 350 18 L 400 6" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 0 60 L 25 50 L 50 55 L 75 42 L 100 48 L 125 38 L 150 44 L 175 30 L 200 36 L 225 24 L 250 28 L 275 18 L 300 22 L 325 14 L 350 18 L 400 6 L 400 80 L 0 80 Z" fill="rgba(255,255,255,0.08)" />
          </svg>
        </div>

        <div class="kpi-grid">
          <div v-for="k in kpis" :key="k.lbl" class="kpi">
            <span class="lbl">{{ k.lbl }}</span>
            <div class="v" :class="{ small: k.valueSmall }">{{ k.value }}</div>
            <span class="sub">{{ k.sub }}</span>
          </div>
        </div>
      </div>

      <div class="split">
        <div class="card chart-card">
          <div class="card-title-row">
            <h3>Spend over time</h3>
            <span class="chip outline mono">{{ curMonthLabel }}</span>
          </div>
          <div v-if="dashHasData" class="chart">
            <div
              v-for="(v, i) in dashData"
              :key="i"
              class="bar"
              :class="{ muted: i + 1 > curDayOfMonth, empty: v === 0 }"
              :style="{ height: `${((v / dashMax) * 100).toFixed(1)}%` }"
              :title="`Day ${String(i + 1).padStart(2, '0')} · ${v.toFixed(2)}`"
            />
          </div>
          <div v-else class="chart-empty">
            No spend recorded this month yet.
          </div>
          <div class="chart-axis">
            <span v-for="lbl in axisLabels" :key="lbl">{{ lbl }}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title-row">
            <h3>Recent invoices</h3>
            <NuxtLink to="/app/invoices" class="btn-hifi btn-ghost btn-sm">All →</NuxtLink>
          </div>
          <div class="list">
            <NuxtLink
              v-for="row in recent"
              :key="row.id"
              :to="`/app/invoices/${row.id}`"
              class="list-row"
            >
              <div class="ico">{{ row.code }}</div>
              <div>
                <div class="name">{{ row.name }}</div>
                <div class="meta">{{ row.meta }}</div>
              </div>
              <div class="amt">{{ row.amt }}</div>
            </NuxtLink>
            <div v-if="recent.length === 0" class="list-empty">
              No invoices yet. <NuxtLink to="/app/scan">Scan your first receipt →</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <NuxtLink to="/app/scan" class="drop-zone">
        <div class="ico-big">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="12" y1="4" x2="12" y2="16" /><polyline points="6 10 12 4 18 10" /><line x1="4" y1="20" x2="20" y2="20" /></svg>
        </div>
        <div>
          <h4>Got a new receipt?</h4>
          <p>Drop a photo or PDF here · or paste · we'll parse and sort.</p>
        </div>
        <div class="acts">
          <span class="btn-hifi btn-ghost btn-sm">From photos</span>
          <span class="btn-hifi btn-primary btn-sm">📷 Scan now</span>
        </div>
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.topbar {
  padding: 20px 36px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  z-index: 5;
}
.topbar h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.025em; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

.route { padding: 36px; }

@media (max-width: 880px) {
  .topbar { padding: 16px 16px 16px 64px; gap: 12px; flex-wrap: wrap; }
  .topbar h1 { font-size: 18px; }
  .route { padding: 20px 16px; }
}

/* hero */
.dash-hero {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 1000px) { .dash-hero { grid-template-columns: 1fr; } }

.card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
}
.card-dark {
  background: var(--ink);
  color: var(--accent-ink);
  border-color: var(--ink);
}
.card-eyebrow {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.card-dark .card-eyebrow { color: color-mix(in srgb, var(--accent-ink) 55%, transparent); }
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

.hero-amount {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 14px;
}
.hero-amount .num {
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}
.hero-amount .delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  background: rgba(255, 255, 255, 0.12);
}
.hero-meta {
  margin-top: 8px;
  font-size: 13px;
  color: color-mix(in srgb, var(--accent-ink) 70%, transparent);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  letter-spacing: 0.02em;
}
.spark { margin-top: 20px; height: 80px; width: 100%; }

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.kpi {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kpi .lbl {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.kpi .v {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1;
}
.kpi .v.small { font-size: 22px; }
.kpi .sub {
  margin-top: auto;
  font-size: 11.5px;
  color: var(--ink-3);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
}

/* split */
.split {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
@media (max-width: 1000px) { .split { grid-template-columns: 1fr; } }

.chart-card { padding: 24px 24px 12px; }
.chart {
  height: 220px;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 0 4px;
}
.chart .bar {
  flex: 1;
  background: var(--ink);
  border-radius: 4px 4px 0 0;
  min-width: 8px;
  opacity: 0.9;
  transition: opacity 0.15s;
}
@media (max-width: 880px) {
  .chart { gap: 3px; padding: 0 2px; }
  .chart .bar { min-width: 0; border-radius: 2px 2px 0 0; }
}
.chart .bar.muted { background: var(--surface-2); }
.chart .bar.empty { min-height: 2px; background: var(--surface-2); opacity: 0.6; }
.chart .bar:hover { opacity: 1; }
.chart-empty {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--ink-3);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
}
.chart-axis {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px 0;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: 0.05em;
}

/* list */
.list { display: flex; flex-direction: column; }
.list-row {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  color: inherit;
  transition: opacity 0.15s;
}
.list-row:last-child { border-bottom: none; }
.list-row:hover { opacity: 0.7; }
.list-row .ico {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-weight: 600;
  font-size: 13px;
}
.list-row .name { font-size: 14px; font-weight: 500; letter-spacing: -0.01em; line-height: 1.2; }
.list-row .meta {
  font-size: 11.5px;
  color: var(--ink-3);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  margin-top: 2px;
}
.list-row .amt {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-weight: 600;
  font-size: 14px;
}
.list-empty {
  padding: 16px 0;
  font-size: 13px;
  color: var(--ink-3);
}
.list-empty a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }

/* drop zone */
.drop-zone {
  margin-top: 16px;
  background: var(--bg);
  border: 1.5px dashed var(--line);
  border-radius: var(--radius);
  padding: 36px;
  display: flex;
  align-items: center;
  gap: 24px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  color: inherit;
}
.drop-zone:hover { background: var(--surface); border-color: var(--ink-4); }
.drop-zone .ico-big {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--ink);
}
.drop-zone h4 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
.drop-zone p { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); }
.drop-zone .acts { margin-left: auto; display: flex; gap: 8px; }

@media (max-width: 880px) {
  .drop-zone {
    padding: 20px;
    gap: 14px;
    flex-wrap: wrap;
    text-align: left;
  }
  .drop-zone .acts {
    margin-left: 0;
    width: 100%;
    flex-wrap: wrap;
  }
  .drop-zone h4 { font-size: 16px; }
  .card { padding: 18px; }
  .kpi { padding: 14px; }
  .kpi .v { font-size: 22px; }
  .kpi .v.small { font-size: 16px; word-break: break-word; }
  .hero-amount { flex-wrap: wrap; }
  .chart-card { padding: 18px 18px 10px; }
  .chart { height: 160px; }
  .chart-empty { height: 160px; }
}
</style>
