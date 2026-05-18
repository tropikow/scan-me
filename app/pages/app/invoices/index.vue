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
  voided_at: string | null
}

const supabase = useSupabaseClient()
const updatingId = ref<string | null>(null)
const actionError = ref<string | null>(null)

const { data, pending, error, refresh } = await useAsyncData('invoices-list', async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, vendor, invoice_date, currency, total, created_at, voided_at')
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

async function voidInvoice(inv: InvoiceRow) {
  if (updatingId.value || inv.voided_at) return
  const ok = window.confirm(
    `Anular esta factura de "${inv.vendor || 'Untitled'}"? Esta acción no se puede deshacer. ` +
      'Para recuperar el importe en tus totales tendrás que volver a subir la factura.',
  )
  if (!ok) return
  updatingId.value = inv.id
  actionError.value = null
  const now = new Date().toISOString()
  const { error: updErr } = await supabase
    .from('invoices')
    .update({ voided_at: now })
    .eq('id', inv.id)
  if (updErr) {
    actionError.value = `Could not void invoice: ${updErr.message}`
  } else {
    inv.voided_at = now
  }
  updatingId.value = null
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

      <div v-if="actionError" class="state error">{{ actionError }}</div>

      <div v-if="error" class="state error">
        Could not load invoices. Try refreshing.
      </div>

      <div v-else-if="!pending && (!data || data.length === 0)" class="state empty">
        <div class="empty-title">No invoices yet</div>
        <div class="empty-hint">Upload your first receipt to get started.</div>
        <NuxtLink to="/app/scan" class="btn-hifi btn-primary btn-sm">+ New scan</NuxtLink>
      </div>

      <div v-else class="inv-cards">
        <div
          v-for="inv in data"
          :key="inv.id"
          class="inv-card"
          :class="{ voided: !!inv.voided_at }"
        >
          <NuxtLink :to="`/app/invoices/${inv.id}`" class="inv-card-link">
            <div class="thumb">
              <span v-if="inv.voided_at" class="thumb-badge">VOIDED</span>
            </div>
            <div class="name">{{ inv.vendor || 'Untitled' }}</div>
            <div class="row">
              <span class="date">{{ formatDate(inv.invoice_date, inv.created_at) }}</span>
              <span class="amt">{{ formatAmount(inv.total, inv.currency) }}</span>
            </div>
          </NuxtLink>
          <div v-if="inv.voided_at" class="void-tag" aria-label="Factura anulada">
            ⊘ Anulada
          </div>
          <button
            v-else
            type="button"
            class="void-btn"
            :disabled="updatingId === inv.id"
            @click.prevent.stop="voidInvoice(inv)"
          >
            <template v-if="updatingId === inv.id">Anulando…</template>
            <template v-else>⊘ Anular</template>
          </button>
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
.state.error { color: var(--ink-2); margin-bottom: 16px; }
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
  transition: transform 0.18s, border-color 0.15s, opacity 0.15s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inv-card:hover { transform: translateY(-2px); border-color: var(--ink-4); }
.inv-card.voided {
  opacity: 0.65;
  background: var(--surface);
}
.inv-card.voided:hover { opacity: 0.85; }

.inv-card-link {
  color: inherit;
  display: flex;
  flex-direction: column;
}
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
.inv-card.voided .thumb::before {
  filter: grayscale(1);
}
.thumb-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--ink);
  color: var(--bg);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  padding: 3px 7px;
  border-radius: 4px;
  z-index: 1;
}
.inv-card .name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.inv-card.voided .name { text-decoration: line-through; text-decoration-color: var(--ink-3); }
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
.inv-card.voided .row .amt { text-decoration: line-through; color: var(--ink-3); }

.void-btn {
  margin-top: auto;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.void-btn:hover:not(:disabled) {
  background: var(--surface);
  border-color: var(--ink-4);
  color: var(--ink);
}
.void-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.void-tag {
  margin-top: auto;
  width: 100%;
  padding: 7px 10px;
  background: var(--surface);
  border: 1px dashed var(--line-2, var(--line));
  border-radius: 6px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--ink-3);
  text-align: center;
  user-select: none;
}
</style>
