<script setup lang="ts">
definePageMeta({ layout: 'app' })

type InvoiceRow = {
  id: string
  vendor: string | null
  vendor_address: string | null
  invoice_number: string | null
  invoice_date: string | null
  currency: string | null
  subtotal: number | null
  tax: number | null
  tax_rate: number | null
  total: number | null
  confidence: number | null
  image_path: string | null
  tags: string[] | null
  created_at: string
  voided_at: string | null
}

type InvoiceItem = {
  id: string
  position: number
  description: string
  quantity: number | null
  unit_price: number | null
  amount: number
}

const route = useRoute()
const invoiceId = computed(() => route.params.id as string)

const supabase = useSupabaseClient()

const { data, pending, error } = await useAsyncData(
  () => `invoice-${invoiceId.value}`,
  async () => {
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId.value)
      .maybeSingle()
    if (invErr) throw invErr
    if (!inv) return null

    const { data: items, error: itemsErr } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId.value)
      .order('position', { ascending: true })
    if (itemsErr) throw itemsErr

    let signedUrl: string | null = null
    if ((inv as InvoiceRow).image_path) {
      const { data: signed } = await supabase.storage
        .from('receipts')
        .createSignedUrl((inv as InvoiceRow).image_path as string, 60 * 60)
      signedUrl = signed?.signedUrl ?? null
    }

    return {
      invoice: inv as InvoiceRow,
      items: (items ?? []) as InvoiceItem[],
      signedUrl
    }
  }
)

useHead({
  title: () => `scan-me — ${data.value?.invoice?.vendor || 'invoice'}`
})

function formatDate(iso: string | null, fallback?: string): string {
  const src = iso || fallback || ''
  if (!src) return '—'
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return '—'
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

function symbolFor(currency: string | null): string {
  return currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency || ''
}
function fmt(n: number | null, currency: string | null): string {
  if (n == null) return '—'
  const s = symbolFor(currency)
  return `${s} ${n.toFixed(2)}`.trim()
}
function fmtPlain(n: number | null): string {
  return n == null ? '—' : n.toFixed(2)
}

function downloadPdf() {
  if (typeof window === 'undefined') return
  window.print()
}
</script>

<template>
  <div>
    <div class="topbar">
      <div>
        <div class="crumb mono">
          <NuxtLink to="/app/invoices">Invoices</NuxtLink> ›
          <span v-if="data?.invoice">#{{ data.invoice.id.slice(0, 8) }}</span>
          <span v-else>#{{ invoiceId.slice(0, 8) }}</span>
        </div>
        <h1>{{ data?.invoice?.vendor || (pending ? 'Loading…' : 'Not found') }}</h1>
      </div>
      <div class="actions">
        <button
          class="btn btn-ghost btn-sm"
          :disabled="pending || !data?.invoice"
          @click="downloadPdf"
        >↓ PDF</button>
        <button class="btn btn-ghost btn-sm" disabled>✎ Edit</button>
      </div>
    </div>

    <section class="route">
      <div v-if="pending" class="state">Loading…</div>

      <div v-else-if="error || !data?.invoice" class="state error">
        Invoice not found. <NuxtLink to="/app/invoices">Back to invoices</NuxtLink>
      </div>

      <div v-else class="inv-hero">
        <div class="inv-left">
          <DigitalInvoice
            :invoice-id="data.invoice.id"
            :vendor="data.invoice.vendor"
            :vendor-address="data.invoice.vendor_address"
            :invoice-number="data.invoice.invoice_number"
            :invoice-date="data.invoice.invoice_date"
            :created-at="data.invoice.created_at"
            :currency="data.invoice.currency"
            :subtotal="data.invoice.subtotal"
            :tax="data.invoice.tax"
            :tax-rate="data.invoice.tax_rate"
            :total="data.invoice.total"
            :items="data.items"
            :voided-at="data.invoice.voided_at"
          />

          <div class="inv-original">
            <div class="inv-original-head">
              <span class="card-eyebrow">Original file</span>
              <span class="inv-original-hint mono">As uploaded</span>
            </div>
            <div class="inv-original-body">
              <img
                v-if="data.signedUrl"
                :src="data.signedUrl"
                alt="Original receipt scan"
                class="inv-img"
              />
              <div v-else class="inv-thumb-empty">No image available</div>
            </div>
          </div>
        </div>

        <div class="inv-meta">
          <span class="card-eyebrow">INVOICE · #{{ data.invoice.id.slice(0, 8) }}</span>
          <h2 class="merchant">{{ data.invoice.vendor || 'Untitled' }}</h2>
          <div class="bigamt">{{ fmt(data.invoice.total, data.invoice.currency) }}</div>
          <div class="submeta">
            {{ formatDate(data.invoice.invoice_date, data.invoice.created_at) }}
            <template v-if="data.invoice.vendor_address"> · {{ data.invoice.vendor_address }}</template>
            <template v-if="data.invoice.invoice_number"> · №{{ data.invoice.invoice_number }}</template>
          </div>

          <div v-if="data.invoice.tags?.length" class="chips">
            <span v-for="t in data.invoice.tags" :key="t" class="chip outline">{{ t }}</span>
          </div>

          <table v-if="data.items.length" class="inv-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="r">Unit</th>
                <th class="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in data.items" :key="it.id">
                <td>{{ it.description }}</td>
                <td>{{ it.quantity ?? '—' }}</td>
                <td class="r">{{ fmtPlain(it.unit_price) }}</td>
                <td class="r">{{ fmtPlain(it.amount) }}</td>
              </tr>
              <tr v-if="data.invoice.subtotal != null" class="subtotal">
                <td colspan="3">Subtotal</td>
                <td class="r">{{ fmtPlain(data.invoice.subtotal) }}</td>
              </tr>
              <tr v-if="data.invoice.tax != null" class="subtotal">
                <td colspan="3">
                  Tax<template v-if="data.invoice.tax_rate != null"> {{ Math.round(data.invoice.tax_rate * 100) }}%</template>
                </td>
                <td class="r">{{ fmtPlain(data.invoice.tax) }}</td>
              </tr>
              <tr class="total">
                <td colspan="3">Total</td>
                <td class="r">{{ fmt(data.invoice.total, data.invoice.currency) }}</td>
              </tr>
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

.state {
  padding: 48px 24px;
  text-align: center;
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  color: var(--color-slate);
}
.state.error a { color: var(--color-ink); text-decoration: underline; }

.inv-hero {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1000px) { .inv-hero { grid-template-columns: 1fr; } }

.inv-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.inv-original {
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inv-original-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.inv-original-hint {
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.06em;
}
.inv-original-body {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: 8px;
  padding: 16px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.inv-img {
  max-width: 100%;
  max-height: 460px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-mist);
}
.inv-thumb-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
}

.inv-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
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
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
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
  border-bottom: 1px solid var(--color-mist);
  font-size: 13px;
}
.inv-table th {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
}
.inv-table td.r {
  text-align: right;
  font-family: var(--font-mono);
  font-weight: 500;
}
.inv-table th.r { text-align: right; }
.inv-table tr.subtotal td {
  font-family: var(--font-mono);
  color: var(--color-slate);
}
.inv-table tr.total td {
  border-bottom: none;
  padding-top: 16px;
  font-weight: 600;
  font-size: 15px;
}
</style>

<style>
@media print {
  @page {
    margin: 12mm;
    size: A4;
  }

  html,
  body {
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .sidebar,
  .topbar,
  .inv-original,
  .inv-meta {
    display: none !important;
  }

  .shell {
    display: block !important;
  }

  .main {
    display: block !important;
  }

  .route {
    padding: 0 !important;
  }

  .inv-hero {
    display: block !important;
    margin: 0 !important;
    gap: 0 !important;
  }

  .inv-left {
    display: block !important;
    gap: 0 !important;
  }

  .dinv {
    border: 1px solid #e6e2dc !important;
    box-shadow: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
