<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — new scan' })

type Item = {
  description: string
  quantity: number | null
  unit_price: number | null
  amount: number
}

type ScanResult = {
  vendor: string | null
  vendor_address: string | null
  invoice_number: string | null
  date: string | null
  currency: string | null
  subtotal: number | null
  tax: number | null
  tax_rate: number | null
  total: number | null
  items: Item[]
  confidence: number
}

const router = useRouter()
const supabase = useSupabaseClient()

type Phase = 'idle' | 'processing' | 'review' | 'error'
const phase = ref<Phase>('idle')
const errorMsg = ref<string | null>(null)
const fileMeta = ref<{ name: string; sizeKb: number } | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const result = ref<ScanResult | null>(null)
const pendingFile = ref<File | null>(null)
const saving = ref(false)

const fields = reactive({
  merchant: '',
  date: '',
  tax: '',
  collection: '' as string,
  person_id: '' as string,
  tags: ''
})

type CollectionRow = {
  id: string
  parent_id: string | null
  name: string
  position: number
}

const { data: collectionRows } = await useAsyncData(
  'scan-collections',
  async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('id, parent_id, name, position')
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    if (error) return [] as CollectionRow[]
    return (data ?? []) as CollectionRow[]
  },
  { default: () => [] as CollectionRow[] },
)

const collectionOptions = computed<{ id: string; label: string }[]>(() => {
  const rows = collectionRows.value ?? []
  const labelFor = buildCollectionPathLabeler(rows)
  return rows
    .map((r) => ({ id: r.id, label: labelFor(r) }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

type PersonRow = { id: string; name: string; role: string }

const { data: personRows } = await useAsyncData(
  'scan-people',
  async () => {
    const { data, error } = await supabase
      .from('people')
      .select('id, name, role')
      .order('name', { ascending: true })
    if (error) return [] as PersonRow[]
    return (data ?? []) as PersonRow[]
  },
  { default: () => [] as PersonRow[] },
)

const personOptions = computed<{ id: string; label: string }[]>(() =>
  (personRows.value ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} · ${p.role}`,
  })),
)

const dragOver = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function pickFile() {
  inputRef.value?.click()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) void handleFile(file)
}

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) void handleFile(file)
}

const totalDisplay = computed(() =>
  result.value ? formatAmount(result.value.total, result.value.currency) : '—'
)

const confidenceDisplay = computed(() => {
  if (!result.value) return '—'
  return `${Math.round(result.value.confidence * 100)}% CONFIDENCE`
})

async function handleFile(file: File) {
  errorMsg.value = null

  if (file.size > 10 * 1024 * 1024) {
    errorMsg.value = 'Image is too large (max 10 MB).'
    phase.value = 'error'
    return
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    errorMsg.value = 'Use a JPEG, PNG, or WebP image.'
    phase.value = 'error'
    return
  }

  fileMeta.value = { name: file.name, sizeKb: Math.round(file.size / 1024) }
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imagePreviewUrl.value = URL.createObjectURL(file)
  pendingFile.value = file
  phase.value = 'processing'

  try {
    const form = new FormData()
    form.append('file', file)
    const data = await $fetch<ScanResult>('/api/scan', {
      method: 'POST',
      body: form
    })
    result.value = data
    fields.merchant = data.vendor ?? ''
    fields.date = data.date ?? ''
    fields.tax =
      data.tax != null
        ? `${formatAmount(data.tax, data.currency)}${
            data.tax_rate != null ? ` (${Math.round(data.tax_rate * 100)}%)` : ''
          }`
        : ''
    fields.tags = ''
    phase.value = 'review'
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'statusMessage' in err
        ? String((err as { statusMessage: string }).statusMessage)
        : 'Could not extract fields. Please try again.'
    errorMsg.value = message
    phase.value = 'error'
  }
}

function reset() {
  phase.value = 'idle'
  errorMsg.value = null
  result.value = null
  fileMeta.value = null
  pendingFile.value = null
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = null
  }
}

async function save() {
  if (saving.value || !result.value || !pendingFile.value) return
  saving.value = true
  errorMsg.value = null

  const payload = {
    vendor: fields.merchant || result.value.vendor,
    vendor_address: result.value.vendor_address,
    invoice_number: result.value.invoice_number,
    date: fields.date || result.value.date,
    currency: result.value.currency,
    subtotal: result.value.subtotal,
    tax: result.value.tax,
    tax_rate: result.value.tax_rate,
    total: result.value.total,
    confidence: result.value.confidence,
    items: result.value.items,
    person_id: fields.person_id || null,
    tags: fields.tags
      ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
  }

  try {
    const form = new FormData()
    form.append('file', pendingFile.value)
    form.append('payload', JSON.stringify(payload))
    const res = await $fetch<{ id: string }>('/api/invoices', {
      method: 'POST',
      body: form
    })
    if (fields.collection) {
      const { error: linkErr } = await supabase
        .from('invoice_collections')
        .insert({ invoice_id: res.id, collection_id: fields.collection })
      if (linkErr) {
        // Non-fatal: invoice was created, just the categorization failed.
        // Surface it but still continue to the detail page.
        console.warn('Could not link invoice to collection:', linkErr.message)
      }
    }
    await router.push(`/app/invoices/${res.id}`)
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'statusMessage' in err
        ? String((err as { statusMessage: string }).statusMessage)
        : 'Could not save invoice. Please try again.'
    errorMsg.value = message
    saving.value = false
  }
}
function cancel() {
  router.push('/app/dashboard')
}

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})
</script>

<template>
  <div>
    <div class="topbar">
      <div>
        <div class="crumb mono">
          <template v-if="phase === 'idle'">Upload a receipt or invoice</template>
          <template v-else-if="phase === 'processing'">Extracting fields…</template>
          <template v-else-if="phase === 'review'">Reviewing extracted fields</template>
          <template v-else>Something went wrong</template>
        </div>
        <h1>New scan</h1>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" @click="cancel">Cancel</button>
        <button
          v-if="phase === 'review'"
          class="btn btn-primary btn-sm"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save invoice →' }}
        </button>
      </div>
    </div>

    <section class="route">
      <!-- IDLE: drop zone -->
      <div v-if="phase === 'idle' || phase === 'error'" class="upload-wrap">
        <div
          class="upload-zone"
          :class="{ over: dragOver }"
          @click="pickFile"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop="onDrop"
        >
          <input
            ref="inputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="upload-input"
            @change="onChange"
          />
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div class="upload-title">Drop a receipt or invoice</div>
          <div class="upload-hint">or click to choose · JPEG, PNG, WebP · up to 10 MB</div>
          <div v-if="errorMsg" class="upload-error">{{ errorMsg }}</div>
        </div>
      </div>

      <!-- PROCESSING -->
      <div v-else-if="phase === 'processing'" class="processing-wrap">
        <div class="processing-card">
          <div class="spinner" aria-hidden="true" />
          <div class="processing-title">Reading your document…</div>
          <div class="processing-hint">This usually takes 1–3 seconds.</div>
        </div>
      </div>

      <!-- REVIEW -->
      <div v-else-if="phase === 'review' && result" class="scan-grid">
        <div class="scan-image-card">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" class="scan-img" alt="Uploaded receipt" />
          <div class="scan-toolbar">
            <span v-if="fileMeta">{{ fileMeta.name }} · {{ fileMeta.sizeKb }} KB</span>
            <button class="link-btn" @click="reset">↻ Upload another</button>
          </div>
        </div>

        <div class="scan-fields">
          <div class="scan-hdr">
            <h2>Review fields</h2>
            <span class="conf"><span class="conf-dot" />{{ confidenceDisplay }}</span>
          </div>

          <div class="scan-row">
            <span class="lbl">MERCHANT</span>
            <input v-model="fields.merchant" />
            <span class="edit">✎</span>
          </div>
          <div class="scan-row">
            <span class="lbl">DATE</span>
            <input v-model="fields.date" placeholder="YYYY-MM-DD" />
            <span class="edit">✎</span>
          </div>
          <div class="scan-row">
            <span class="lbl">TAX</span>
            <input v-model="fields.tax" />
            <span class="edit">✎</span>
          </div>
          <div class="scan-row">
            <span class="lbl">COLLECTION</span>
            <select v-model="fields.collection">
              <option value="">— None —</option>
              <option v-for="c in collectionOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
            <span class="edit">▾</span>
          </div>
          <div class="scan-row">
            <span class="lbl">USER</span>
            <select v-model="fields.person_id">
              <option value="">— None —</option>
              <option v-for="p in personOptions" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
            <span class="edit">▾</span>
          </div>
          <div class="scan-row">
            <span class="lbl">TAGS</span>
            <input v-model="fields.tags" placeholder="comma, separated" />
            <span class="edit">✎</span>
          </div>

          <div v-if="result.items?.length" class="items-list">
            <div class="items-hdr">LINE ITEMS</div>
            <div v-for="(it, i) in result.items" :key="i" class="item-row">
              <span class="item-desc">{{ it.description }}</span>
              <span class="item-amt">{{ formatAmount(it.amount, result.currency) }}</span>
            </div>
          </div>

          <div class="scan-total">
            <span class="l">TOTAL</span>
            <span class="v">{{ totalDisplay }}</span>
          </div>

          <p v-if="errorMsg" class="review-error" role="alert">{{ errorMsg }}</p>

          <div class="scan-actions">
            <span class="left">
              {{ result.items?.length || 0 }} line items · click any field to edit
            </span>
            <div class="right">
              <button class="btn btn-ghost btn-sm" :disabled="saving" @click="reset">Discard</button>
              <button class="btn btn-primary btn-sm" @click="save">Save invoice →</button>
            </div>
          </div>
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
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

/* ============ UPLOAD ============ */
.upload-wrap {
  max-width: 720px;
  margin: 0 auto;
}
.upload-zone {
  border: 1.5px dashed var(--color-mist);
  border-radius: var(--radius-lg);
  padding: 64px 32px;
  text-align: center;
  cursor: pointer;
  background: var(--color-fog);
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.upload-zone:hover,
.upload-zone.over {
  border-color: var(--color-ink);
  background: var(--color-snow);
}
.upload-input { display: none; }
.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--color-graphite);
  margin-bottom: 4px;
}
.upload-icon svg { width: 100%; height: 100%; }
.upload-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}
.upload-hint {
  font-size: 13px;
  color: var(--color-graphite);
  letter-spacing: -0.005em;
}
.upload-error {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--color-error);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-ink);
}

/* ============ PROCESSING ============ */
.processing-wrap {
  display: flex;
  justify-content: center;
  padding-top: 80px;
}
.processing-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 360px;
}
.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-mist);
  border-top-color: var(--color-ink);
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.processing-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.processing-hint {
  font-size: 13px;
  color: var(--color-graphite);
}

/* ============ REVIEW ============ */
.scan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1000px) { .scan-grid { grid-template-columns: 1fr; } }

.scan-image-card {
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  padding: 24px;
  aspect-ratio: 3 / 4;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.scan-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-mist);
}
.scan-toolbar {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
}
.link-btn {
  background: none;
  border: none;
  font: inherit;
  color: var(--color-graphite);
  cursor: pointer;
  padding: 0;
}
.link-btn:hover { color: var(--color-ink); }

.scan-fields { display: flex; flex-direction: column; gap: 4px; }
.scan-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.scan-hdr h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.conf {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-fog);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-slate);
  letter-spacing: 0.04em;
}
.conf-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}

.scan-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 14px 4px;
  border-bottom: 1px solid var(--color-mist);
}
.scan-row .lbl {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.scan-row input,
.scan-row select {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-ink);
  width: 100%;
  outline: none;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition: background 0.15s, border-color 0.15s;
}
.scan-row input:hover,
.scan-row select:hover { background: var(--color-fog); }
.scan-row input:focus,
.scan-row select:focus { background: var(--color-snow); border-color: var(--color-ink); }
.scan-row .edit { color: var(--color-graphite); font-size: 12px; }

.items-list {
  margin: 16px 0;
  padding: 16px;
  background: var(--color-fog);
  border-radius: var(--radius-lg);
}
.items-hdr {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.item-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--color-mist);
}
.item-row:last-child { border-bottom: none; }
.item-desc { color: var(--color-slate); }
.item-amt {
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-weight: 500;
}

.scan-total {
  margin-top: 12px;
  padding: 20px;
  background: var(--color-fog);
  border-radius: var(--radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.scan-total .l {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
}
.scan-total .v {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.review-error {
  margin: 16px 0 0;
  padding: 10px 14px;
  background: var(--color-error);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-ink);
}

.scan-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.scan-actions .left {
  font-size: 12.5px;
  color: var(--color-graphite);
  letter-spacing: -0.005em;
}
.scan-actions .right { display: flex; gap: 8px; }
</style>
