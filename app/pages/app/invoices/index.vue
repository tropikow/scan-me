<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — invoices' })

const invoices = [
  { id: '3471', merchant: 'Carrefour Express', date: '13 MAY', amt: '€ 42.18' },
  { id: '3470', merchant: 'Endesa', date: '12 MAY', amt: '€ 87.50' },
  { id: '3469', merchant: 'Claude', date: '11 MAY', amt: '€ 20.00' },
  { id: '3468', merchant: 'Iberdrola', date: '11 MAY', amt: '€ 56.12' },
  { id: '3467', merchant: 'Repsol', date: '10 MAY', amt: '€ 38.40' },
  { id: '3466', merchant: 'Mercadona', date: '09 MAY', amt: '€ 64.30' },
  { id: '3465', merchant: 'Lidl', date: '06 MAY', amt: '€ 38.40' },
  { id: '3464', merchant: 'Notion', date: '05 MAY', amt: '€ 96.00' },
  { id: '3463', merchant: 'Renfe', date: '03 MAY', amt: '€ 318.00' },
  { id: '3462', merchant: 'La Tasca', date: '02 MAY', amt: '€ 56.00' },
  { id: '3461', merchant: 'Carrefour', date: '02 MAY', amt: '€ 41.10' },
  { id: '3460', merchant: 'Office Depot', date: '30 APR', amt: '€ 124.00' }
]
</script>

<template>
  <div>
    <div class="topbar">
      <h1>Invoices</h1>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm">Sort ▾</button>
        <NuxtLink to="/app/scan" class="btn-hifi btn-primary btn-sm">+ New scan</NuxtLink>
      </div>
    </div>

    <section class="route">
      <div class="crumb mono">ALL · {{ invoices.length }} INVOICES</div>

      <div class="inv-cards">
        <NuxtLink
          v-for="inv in invoices"
          :key="inv.id"
          :to="`/app/invoices/${inv.id}`"
          class="inv-card"
        >
          <div class="thumb" />
          <div class="name">{{ inv.merchant }}</div>
          <div class="row">
            <span class="date">{{ inv.date }}</span>
            <span class="amt">{{ inv.amt }}</span>
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
