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

// ─── Export (CSV) ─────────────────────────────────────────────────────────
type PersonOpt = { id: string; name: string }

const exportOpen = ref(false)
const exportLoading = ref(false)
const exportError = ref<string | null>(null)
const filterFrom = ref('')
const filterTo = ref('')
const filterPersonId = ref('')
const filterVendor = ref('')
const peopleOpts = ref<PersonOpt[]>([])
const vendorOpts = ref<string[]>([])
const optsLoaded = ref(false)

async function loadExportOptions() {
  if (optsLoaded.value) return
  const [peopleRes, vendorRes] = await Promise.all([
    supabase.from('people').select('id, name').order('name', { ascending: true }),
    supabase
      .from('invoices')
      .select('vendor')
      .not('vendor', 'is', null)
      .order('vendor', { ascending: true }),
  ])
  peopleOpts.value = (peopleRes.error ? [] : (peopleRes.data ?? [])) as PersonOpt[]
  const seen = new Set<string>()
  vendorOpts.value = ((vendorRes.error ? [] : (vendorRes.data ?? [])) as { vendor: string | null }[])
    .map((r) => (r.vendor ?? '').trim())
    .filter((v) => {
      if (!v || seen.has(v)) return false
      seen.add(v)
      return true
    })
  optsLoaded.value = true
}

async function openExport() {
  exportError.value = null
  exportOpen.value = true
  await loadExportOptions()
}
function closeExport() {
  if (exportLoading.value) return
  exportOpen.value = false
}

// RFC 4180 escaping: wrap in quotes, double any internal quotes.
function csvCell(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',')
}

type PersonRel = { name: string | null } | { name: string | null }[] | null
type ExportInvoice = {
  vendor: string | null
  invoice_number: string | null
  invoice_date: string | null
  created_at: string
  currency: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
  notes: string | null
  voided_at: string | null
  people: PersonRel
}
function personName(rel: PersonRel): string {
  if (!rel) return ''
  const row = Array.isArray(rel) ? rel[0] : rel
  return row?.name ?? ''
}

async function runExport() {
  exportLoading.value = true
  exportError.value = null
  try {
    let q = supabase
      .from('invoices')
      .select(
        'vendor, invoice_number, invoice_date, created_at, currency, subtotal, tax, total, notes, voided_at, people:person_id(name)',
      )
      .order('created_at', { ascending: false })

    // Date range is applied on created_at (scan time) to match the rest
    // of the app's "this month" / dashboard convention. invoice_date is
    // exported as a separate column so the user can still see vendor dates.
    if (filterFrom.value) q = q.gte('created_at', `${filterFrom.value}T00:00:00Z`)
    if (filterTo.value) q = q.lte('created_at', `${filterTo.value}T23:59:59Z`)
    if (filterPersonId.value) q = q.eq('person_id', filterPersonId.value)
    if (filterVendor.value) q = q.eq('vendor', filterVendor.value)

    const { data: rows, error: err } = await q
    if (err) throw err
    const list = (rows ?? []) as unknown as ExportInvoice[]

    if (list.length === 0) {
      exportError.value = 'No invoices match those filters.'
      return
    }

    const header = [
      'vendor',
      'invoice_number',
      'invoice_date',
      'scanned_at',
      'currency',
      'subtotal',
      'tax',
      'total',
      'person',
      'notes',
      'voided',
    ]
    const lines = [csvRow(header)]
    for (const r of list) {
      lines.push(
        csvRow([
          r.vendor ?? '',
          r.invoice_number ?? '',
          r.invoice_date ?? '',
          r.created_at.slice(0, 10),
          r.currency ?? '',
          r.subtotal ?? '',
          r.tax ?? '',
          r.total ?? '',
          personName(r.people),
          r.notes ?? '',
          r.voided_at ? 'yes' : 'no',
        ]),
      )
    }

    // UTF-8 BOM so Excel on Windows opens accents correctly.
    const csv = '﻿' + lines.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const today = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan-me-invoices-${today}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    exportOpen.value = false
  } catch (e) {
    exportError.value = e instanceof Error ? e.message : 'Export failed.'
  } finally {
    exportLoading.value = false
  }
}

function onExportKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && exportOpen.value) closeExport()
}
onMounted(() => document.addEventListener('keydown', onExportKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onExportKeydown))

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
        <button class="btn btn-ghost btn-sm" @click="refresh()">Refresh</button>
        <button class="btn btn-sm" @click="openExport">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>
          Export
        </button>
        <NuxtLink to="/app/scan" class="btn btn-primary btn-sm">+ New scan</NuxtLink>
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
        <NuxtLink to="/app/scan" class="btn btn-primary btn-sm">+ New scan</NuxtLink>
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

    <Teleport to="body">
      <div v-if="exportOpen" class="export-overlay" @click.self="closeExport">
        <div class="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
          <header class="export-head">
            <div>
              <div class="export-eyebrow mono">EXPORT</div>
              <h2 id="export-title">Download invoices</h2>
            </div>
            <button
              type="button"
              class="export-close"
              aria-label="Close"
              :disabled="exportLoading"
              @click="closeExport"
            >×</button>
          </header>

          <form class="export-body" @submit.prevent="runExport">
            <div class="export-field">
              <label class="export-label mono">DATE RANGE (SCANNED)</label>
              <div class="export-range">
                <input v-model="filterFrom" type="date" class="export-input" />
                <span class="export-sep">→</span>
                <input v-model="filterTo" type="date" class="export-input" />
              </div>
            </div>

            <div class="export-field">
              <label class="export-label mono" for="export-person">PERSON</label>
              <select id="export-person" v-model="filterPersonId" class="export-input">
                <option value="">All people</option>
                <option v-for="p in peopleOpts" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>

            <div class="export-field">
              <label class="export-label mono" for="export-vendor">MERCHANT</label>
              <select id="export-vendor" v-model="filterVendor" class="export-input">
                <option value="">All merchants</option>
                <option v-for="v in vendorOpts" :key="v" :value="v">{{ v }}</option>
              </select>
            </div>

            <p v-if="exportError" class="export-err">{{ exportError }}</p>

            <footer class="export-foot">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="exportLoading"
                @click="closeExport"
              >Cancel</button>
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="exportLoading"
              >
                <template v-if="exportLoading">Generating…</template>
                <template v-else>Download .csv</template>
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
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

.crumb {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
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
  background: var(--color-fog);
  border-radius: var(--radius-lg);
}
.state.error { color: var(--color-slate); margin-bottom: 16px; }
.empty-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.empty-hint {
  font-size: 13px;
  color: var(--color-graphite);
  margin-bottom: 12px;
}

.inv-cards {
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
  transition: transform 0.18s, border-color 0.15s, opacity 0.15s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inv-card:hover { transform: translateY(-2px); border-color: var(--color-mist); }
.inv-card.voided {
  opacity: 0.65;
  background: var(--color-fog);
}
.inv-card.voided:hover { opacity: 0.85; }

.inv-card-link {
  color: inherit;
  display: flex;
  flex-direction: column;
}
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
.inv-card.voided .thumb::before {
  filter: grayscale(1);
}
.thumb-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-ink);
  color: var(--color-snow);
  font-family: var(--font-mono);
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
.inv-card.voided .name { text-decoration: line-through; text-decoration-color: var(--color-graphite); }
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
.inv-card.voided .row .amt { text-decoration: line-through; color: var(--color-graphite); }

.void-btn {
  margin-top: auto;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: 1px solid var(--color-mist);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--color-slate);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.void-btn:hover:not(:disabled) {
  background: var(--color-fog);
  border-color: var(--color-mist);
  color: var(--color-ink);
}
.void-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.void-tag {
  margin-top: auto;
  width: 100%;
  padding: 7px 10px;
  background: var(--color-fog);
  border: 1px dashed var(--color-mist);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--color-graphite);
  text-align: center;
  user-select: none;
}
</style>

<style>
/* Unscoped: teleported to <body>, scoped styles wouldn't reach it. */
.export-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  animation: export-fade 0.18s ease-out;
}
@keyframes export-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.export-modal {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  font-family: var(--font-text);
  color: var(--color-ink);
  animation: export-pop 0.18s ease-out;
}
@keyframes export-pop {
  from { opacity: 0; transform: translateY(6px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
.export-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 22px 14px;
  border-bottom: 1px solid var(--color-mist);
}
.export-eyebrow {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--color-graphite);
  margin-bottom: 4px;
}
.export-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.export-close {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-mist);
  border-radius: 6px;
  color: var(--color-graphite);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.export-close:hover:not(:disabled) {
  background: var(--color-fog);
  color: var(--color-ink);
  border-color: var(--color-mist);
}
.export-close:disabled { opacity: 0.4; cursor: not-allowed; }

.export-body {
  padding: 18px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.export-field { display: flex; flex-direction: column; gap: 6px; }
.export-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--color-graphite);
}
.export-input {
  width: 100%;
  padding: 9px 12px;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13.5px;
  color: var(--color-ink);
  letter-spacing: -0.005em;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
}
.export-input:hover { background: var(--color-fog); }
.export-input:focus { background: var(--color-snow); border-color: var(--color-ink); }
.export-range {
  display: flex;
  align-items: center;
  gap: 10px;
}
.export-range .export-input { flex: 1; min-width: 0; }
.export-sep {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
}
.export-err {
  margin: 0;
  padding: 10px 12px;
  background: var(--color-error);
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--color-ink);
}
.export-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

@media (max-width: 480px) {
  .export-overlay { padding: 12px; align-items: flex-end; }
  .export-modal { max-width: 100%; }
  .export-range { flex-direction: column; align-items: stretch; }
  .export-sep { display: none; }
}
</style>
