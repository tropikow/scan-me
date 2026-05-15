<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — invoices' })

type InvoiceRow = {
  id: string
  vendor: string | null
  invoice_date: string | null
  currency: string | null
  total: number | null
  created_at: string
}

const supabase = useSupabaseClient()

const { data, pending, error, refresh } = await useAsyncData('invoices-list', async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, vendor, invoice_date, currency, total, created_at')
    .order('created_at', { ascending: false })
    .limit(120)
  if (error) throw error
  return (data ?? []) as InvoiceRow[]
})

function formatDate(iso: string | null, fallback: string): string {
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
</script>

<template>
  <div>
    <div class="topbar">
      <h1>Invoices</h1>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm" @click="refresh()">Refresh</button>
        <NuxtLink to="/app/scan" class="btn-hifi btn-primary btn-sm">+ New scan</NuxtLink>
      </div>
    </div>

    <section class="route">
      <div class="crumb mono">
        <template v-if="pending">LOADING…</template>
        <template v-else-if="error">ERROR LOADING</template>
        <template v-else>ALL · {{ data?.length ?? 0 }} INVOICES</template>
      </div>

      <div v-if="error" class="state error">
        Could not load invoices. Try refreshing.
      </div>

      <div v-else-if="!pending && (!data || data.length === 0)" class="state empty">
        <div class="empty-title">No invoices yet</div>
        <div class="empty-hint">Upload your first receipt to get started.</div>
        <NuxtLink to="/app/scan" class="btn-hifi btn-primary btn-sm">+ New scan</NuxtLink>
      </div>

      <div v-else class="inv-cards">
        <NuxtLink
          v-for="inv in data"
          :key="inv.id"
          :to="`/app/invoices/${inv.id}`"
          class="inv-card"
        >
          <div class="thumb" />
          <div class="name">{{ inv.vendor || 'Untitled' }}</div>
          <div class="row">
            <span class="date">{{ formatDate(inv.invoice_date, inv.created_at) }}</span>
            <span class="amt">{{ formatAmount(inv.total, inv.currency) }}</span>
          </div>
        </NuxtLink>
      </div>
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

.crumb {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.state {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border-radius: var(--radius);
}
.state.error { color: var(--ink-2); }
.empty-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.empty-hint {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: 12px;
}

.inv-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.inv-card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  color: inherit;
  transition: transform 0.18s, border-color 0.15s;
}
.inv-card:hover { transform: translateY(-2px); border-color: var(--ink-4); }
.inv-card .thumb {
  aspect-ratio: 4 / 3;
  background: var(--surface);
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
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.inv-card .row .amt {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 600;
}
</style>
