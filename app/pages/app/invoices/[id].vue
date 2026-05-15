<script setup lang="ts">
definePageMeta({ layout: 'app' })

const route = useRoute()
const invoiceId = computed(() => route.params.id as string)

useHead({ title: () => `scan-me — invoice #${invoiceId.value}` })

const items = [
  { name: 'Milk 1L', qty: 2, unit: '1.60', amount: '3.20' },
  { name: 'Bread sourdough', qty: 1, unit: '2.40', amount: '2.40' },
  { name: 'Olive oil 750ml', qty: 1, unit: '9.80', amount: '9.80' },
  { name: 'Pasta penne', qty: 1, unit: '1.20', amount: '1.20' },
  { name: 'Tomato sauce', qty: 1, unit: '2.10', amount: '2.10' }
]
</script>

<template>
  <div>
    <div class="topbar">
      <div>
        <div class="crumb mono">
          <NuxtLink to="/app/invoices">Invoices</NuxtLink> › #{{ invoiceId }}
        </div>
        <h1>Carrefour Express</h1>
      </div>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm">↓ PDF</button>
        <button class="btn-hifi btn-ghost btn-sm">✎ Edit</button>
        <button class="btn-hifi btn-icon" title="More">⋯</button>
      </div>
    </div>

    <section class="route">
      <div class="inv-hero">
        <div class="inv-thumb">
          <div class="recpaper">
            <h5>CARREFOUR EXPRESS</h5>
            <div class="addr">CALLE MAYOR 12 · MADRID</div>
            <hr />
            <div class="litem"><span>Milk 1L × 2</span><span>3.20</span></div>
            <div class="litem"><span>Bread sourdough</span><span>2.40</span></div>
            <div class="litem"><span>Olive oil 750ml</span><span>9.80</span></div>
            <div class="litem"><span>Pasta penne</span><span>1.20</span></div>
            <div class="litem"><span>Tomato sauce</span><span>2.10</span></div>
            <hr />
            <div class="tot"><span>TOTAL</span><span>€ 42.18</span></div>
          </div>
        </div>

        <div class="inv-meta">
          <span class="card-eyebrow">INVOICE · #{{ invoiceId }}</span>
          <h2 class="merchant">Carrefour Express</h2>
          <div class="bigamt">€ 42.18</div>
          <div class="submeta">13 MAY 2026 · 18:42 · MADRID</div>
          <div class="chips">
            <NuxtLink to="/app/collections" class="chip">Hogar › Comida</NuxtLink>
            <NuxtLink to="/app/people/maria" class="chip outline">
              <span class="avatar sm">M</span> @maria
            </NuxtLink>
            <span class="chip outline">weekly</span>
          </div>

          <table class="inv-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th class="r">Unit</th><th class="r">Amount</th></tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.name">
                <td>{{ item.name }}</td>
                <td>{{ item.qty }}</td>
                <td class="r">{{ item.unit }}</td>
                <td class="r">{{ item.amount }}</td>
              </tr>
              <tr class="subtotal"><td colspan="3">Subtotal</td><td class="r">34.86</td></tr>
              <tr class="subtotal"><td colspan="3">Tax 21%</td><td class="r">7.32</td></tr>
              <tr class="total"><td colspan="3">Total</td><td class="r">€ 42.18</td></tr>
            </tbody>
          </table>
        </div>
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
.crumb {
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
  margin-bottom: 4px;
}
.crumb a { color: var(--ink-3); transition: color 0.15s; }
.crumb a:hover { color: var(--ink); }
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.inv-hero {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1000px) { .inv-hero { grid-template-columns: 1fr; } }

.inv-thumb {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  aspect-ratio: 1 / 1.05;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inv-thumb .recpaper {
  width: 78%;
  aspect-ratio: 4 / 5.2;
  transform: rotate(-1deg);
  padding: 20px 18px;
}

.inv-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-eyebrow {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.merchant {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.bigamt {
  font-size: clamp(48px, 6vw, 72px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-top: 12px;
}
.submeta {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.05em;
}
.chips { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }

.inv-table {
  margin-top: 24px;
  width: 100%;
  border-collapse: collapse;
}
.inv-table th,
.inv-table td {
  text-align: left;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.inv-table th {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
}
.inv-table td.r {
  text-align: right;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-weight: 500;
}
.inv-table th.r { text-align: right; }
.inv-table tr.total td {
  border-bottom: none;
  padding-top: 16px;
  font-weight: 700;
  font-size: 15px;
}
.inv-table tr.subtotal td { color: var(--ink-2); }
</style>
