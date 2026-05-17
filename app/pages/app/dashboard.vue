<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const dashData = [42, 28, 68, 38, 90, 72, 118, 86, 52, 104, 124, 92, 110, 76, 98, 86, 132, 108, 72, 94, 48, 68, 114, 82, 124, 60, 88, 116, 72, 104]
const dashMax = Math.max(...dashData)

function startOfWeekISO(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = (day + 6) % 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
  return monday.toISOString()
}

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

const kpis = computed(() => [
  {
    lbl: 'INVOICES',
    value: String(invoiceStats.value?.total ?? 0),
    sub:
      (invoiceStats.value?.thisWeek ?? 0) > 0
        ? `+ ${invoiceStats.value?.thisWeek} this week`
        : 'No new this week',
  },
  { lbl: 'PEOPLE', value: '7', sub: '4 active' },
  { lbl: 'TOP CATEGORY', value: 'Hogar', valueSmall: true, sub: '€ 514 · 40%' },
  { lbl: 'AVG / INVOICE', value: '€ 27', sub: '↓ €4 vs Apr' },
])

const recent = [
  { id: '3471', code: 'CA', name: 'Carrefour Express', meta: '13 MAY · HOGAR › COMIDA', amt: '€ 42.18' },
  { id: '3470', code: 'EN', name: 'Endesa', meta: '12 MAY · HOGAR › LUZ', amt: '€ 87.50' },
  { id: '3469', code: 'CL', name: 'Claude', meta: '11 MAY · TOOLS › AI', amt: '€ 20.00' },
  { id: '3468', code: 'IB', name: 'Iberdrola', meta: '11 MAY · HOGAR › LUZ', amt: '€ 56.12' },
  { id: '3467', code: 'RE', name: 'Repsol', meta: '10 MAY · TRANSPORT', amt: '€ 38.40' }
]
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
              <div class="num">€ 1,284</div>
              <div class="hero-meta">VS € 1,189 IN APRIL</div>
            </div>
            <span class="delta">↑ 8%</span>
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
            <span class="chip outline mono">May 2026 ▾</span>
          </div>
          <div class="chart">
            <div
              v-for="(v, i) in dashData"
              :key="i"
              class="bar"
              :class="{ muted: i > 12 }"
              :style="{ height: `${(v / dashMax * 100).toFixed(1)}%` }"
              :title="String(v)"
            />
          </div>
          <div class="chart-axis">
            <span>01</span><span>05</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
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
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

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
.chart .bar.muted { background: var(--surface-2); }
.chart .bar:hover { opacity: 1; }
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
</style>
