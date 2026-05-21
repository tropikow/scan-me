<script setup lang="ts">
definePageMeta({ layout: 'default' })

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

type CollectionRow = {
  id: string
  name: string
  parent_id: string | null
  position: number
}

type ShareInfo = {
  person: { name: string; role: string }
  collections: CollectionRow[]
}

const route = useRoute()
const token = computed(() => route.params.token as string)

type Phase = 'loading' | 'not_found' | 'idle' | 'processing' | 'review' | 'submitted' | 'error'
const phase = ref<Phase>('loading')
const errorMsg = ref<string | null>(null)

const share = ref<ShareInfo | null>(null)
const fileMeta = ref<{ name: string; sizeKb: number } | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const pendingFile = ref<File | null>(null)
const result = ref<ScanResult | null>(null)
const saving = ref(false)

const fields = reactive({
  merchant: '',
  date: '',
  tax: '',
  collection: '' as string,
  tags: ''
})

useHead({
  title: () => share.value?.person.name
    ? `scan-me — send a receipt to ${share.value.person.name}`
    : 'scan-me — share link'
})

onMounted(async () => {
  try {
    const data = await $fetch<ShareInfo>(`/api/public/share/${token.value}`)
    share.value = data
    phase.value = 'idle'
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'statusCode' in err
      ? Number((err as { statusCode: number }).statusCode)
      : 0
    if (status === 404) {
      phase.value = 'not_found'
    } else {
      errorMsg.value = 'Could not load the share link. Please try again later.'
      phase.value = 'error'
    }
  }
})

const collectionOptions = computed<{ id: string; label: string }[]>(() => {
  const rows = share.value?.collections ?? []
  const byId = new Map(rows.map((r) => [r.id, r] as const))
  const labelFor = (row: CollectionRow): string => {
    const chain: string[] = []
    let cur: CollectionRow | undefined = row
    let safety = 0
    while (cur && safety < 50) {
      chain.unshift(cur.name)
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
      safety++
    }
    return chain.join(' › ')
  }
  return rows
    .map((r) => ({ id: r.id, label: labelFor(r) }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const dragOver = ref(false)
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
function pickCamera() { cameraInput.value?.click() }
function pickGallery() { galleryInput.value?.click() }

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

function formatCurrency(n: number | null, currency: string | null): string {
  if (n == null) return '—'
  const symbol =
    currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency || ''
  return `${symbol} ${n.toFixed(2)}`.trim()
}

const totalDisplay = computed(() =>
  result.value ? formatCurrency(result.value.total, result.value.currency) : '—',
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
    const data = await $fetch<ScanResult>(`/api/public/share/${token.value}/scan`, {
      method: 'POST',
      body: form,
    })
    result.value = data
    fields.merchant = data.vendor ?? ''
    fields.date = data.date ?? ''
    fields.tax =
      data.tax != null
        ? `${formatCurrency(data.tax, data.currency)}${
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
    collection_id: fields.collection || null,
    tags: fields.tags
      ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
  }

  try {
    const form = new FormData()
    form.append('file', pendingFile.value)
    form.append('payload', JSON.stringify(payload))
    await $fetch<{ id: string }>(`/api/public/share/${token.value}/invoice`, {
      method: 'POST',
      body: form,
    })
    phase.value = 'submitted'
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'statusMessage' in err
        ? String((err as { statusMessage: string }).statusMessage)
        : 'Could not save invoice. Please try again.'
    errorMsg.value = message
    saving.value = false
  } finally {
    saving.value = false
  }
}

function sendAnother() {
  reset()
}

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})
</script>

<template>
  <div class="share-wrap">
    <!-- LOADING -->
    <div v-if="phase === 'loading'" class="state center">
      <div class="spinner" aria-hidden="true" />
      <div class="state-title">Loading…</div>
    </div>

    <!-- NOT FOUND / REVOKED -->
    <div v-else-if="phase === 'not_found'" class="state center">
      <div class="state-title">Link not found</div>
      <p class="state-hint">
        This share link is invalid or has been revoked. Please ask the person who
        sent it to you to send a new link.
      </p>
    </div>

    <!-- SUBMITTED -->
    <div v-else-if="phase === 'submitted'" class="state center">
      <div class="check-circle" aria-hidden="true">✓</div>
      <div class="state-title">Sent</div>
      <p class="state-hint">
        Your receipt has been sent to <strong>{{ share?.person.name }}</strong>.
        It will appear in their scan-me dashboard shortly.
      </p>
      <button class="btn-hifi btn-primary btn-sm" type="button" @click="sendAnother">
        Send another
      </button>
    </div>

    <!-- MAIN FORM (idle / processing / review / error) -->
    <template v-else>
      <header class="share-head">
        <span class="crumb mono">SHARED RECEIPT UPLOAD</span>
        <h1>
          Send a receipt to
          <span class="who">{{ share?.person.name }}</span>
        </h1>
        <p class="lede">
          Take a photo of your receipt or upload an image. We'll extract the
          details and file it directly with {{ share?.person.name }} — no
          account needed.
        </p>
      </header>

      <!-- IDLE / ERROR: drop zone -->
      <div v-if="phase === 'idle' || phase === 'error'" class="upload-wrap">
        <div
          class="upload-zone"
          :class="{ over: dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop="onDrop"
        >
          <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="upload-input"
            @change="onChange"
          />
          <input
            ref="galleryInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="upload-input"
            @change="onChange"
          />

          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div class="upload-title">Send a receipt</div>
          <div class="upload-hint">Take a photo or upload an image · JPEG, PNG, WebP · up to 10 MB</div>

          <div class="upload-cta">
            <button type="button" class="btn-hifi btn-primary upload-btn" @click="pickCamera">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Take a photo
            </button>
            <button type="button" class="btn-hifi upload-btn" @click="pickGallery">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Choose file
            </button>
          </div>

          <p class="upload-drophint mono">OR DROP A FILE HERE</p>

          <div v-if="errorMsg" class="upload-error">{{ errorMsg }}</div>
        </div>
      </div>

      <!-- PROCESSING -->
      <div v-else-if="phase === 'processing'" class="processing-wrap">
        <div class="spinner" aria-hidden="true" />
        <div class="state-title">Reading your document…</div>
        <div class="state-hint">This usually takes 1–3 seconds.</div>
      </div>

      <!-- REVIEW -->
      <div v-else-if="phase === 'review' && result" class="scan-grid">
        <div class="scan-image-card">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" class="scan-img" alt="Uploaded receipt" />
          <div class="scan-toolbar">
            <span v-if="fileMeta">{{ fileMeta.name }} · {{ fileMeta.sizeKb }} KB</span>
            <button class="link-btn" type="button" @click="reset">↻ Upload another</button>
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
            <span class="lbl">TAGS</span>
            <input v-model="fields.tags" placeholder="comma, separated" />
            <span class="edit">✎</span>
          </div>

          <div v-if="result.items?.length" class="items-list">
            <div class="items-hdr">LINE ITEMS</div>
            <div v-for="(it, i) in result.items" :key="i" class="item-row">
              <span class="item-desc">{{ it.description }}</span>
              <span class="item-amt">{{ formatCurrency(it.amount, result.currency) }}</span>
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
              <button
                class="btn-hifi btn-ghost btn-sm"
                type="button"
                :disabled="saving"
                @click="reset"
              >Discard</button>
              <button
                class="btn-hifi btn-primary btn-sm"
                type="button"
                :disabled="saving"
                @click="save"
              >
                {{ saving ? 'Sending…' : `Send to ${share?.person.name} →` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.share-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

.share-head {
  margin-bottom: 32px;
  text-align: center;
}
.crumb {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.share-head h1 {
  margin: 8px 0 12px;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.share-head .who {
  background: var(--ink);
  color: var(--accent-ink);
  padding: 2px 12px;
  border-radius: 8px;
  white-space: nowrap;
}
.share-head .lede {
  margin: 0 auto;
  max-width: 52ch;
  color: var(--ink-2);
  font-size: 15px;
  line-height: 1.5;
  letter-spacing: -0.005em;
}

/* STATES */
.state.center {
  max-width: 480px;
  margin: 80px auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.state-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.state-hint {
  margin: 0;
  color: var(--ink-3);
  font-size: 14px;
  line-height: 1.5;
}
.check-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--accent-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
}

/* UPLOAD */
.upload-wrap { max-width: 720px; margin: 0 auto; }
.upload-zone {
  border: 1.5px dashed var(--line-2, var(--line));
  border-radius: var(--radius);
  padding: 56px 24px;
  text-align: center;
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.upload-zone.over {
  border-color: var(--ink);
  background: var(--bg);
}
.upload-input { display: none; }
.upload-icon { width: 44px; height: 44px; color: var(--ink-3); margin-bottom: 4px; }
.upload-icon svg { width: 100%; height: 100%; }
.upload-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.upload-hint {
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
  max-width: 36ch;
}
.upload-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
}
.upload-btn {
  padding: 11px 18px;
  font-size: 14px;
  min-width: 160px;
}
.upload-drophint {
  margin: 12px 0 0;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-4);
}
.upload-error {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--accent-error, #E8B4B4);
  border-radius: 8px;
  font-size: 13px;
  color: var(--ink);
}

/* On touch/small screens drag-and-drop isn't a thing — hide the hint and
   give the buttons full width so they're thumb-friendly. */
@media (max-width: 640px) {
  .upload-zone { padding: 40px 18px; }
  .upload-cta { flex-direction: column; width: 100%; max-width: 320px; }
  .upload-btn { width: 100%; min-width: 0; }
  .upload-drophint { display: none; }
}
@media (hover: none) and (pointer: coarse) {
  .upload-drophint { display: none; }
}

/* PROCESSING */
.processing-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-top: 64px;
}
.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--line);
  border-top-color: var(--ink);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* REVIEW (mirrors scan.vue) */
.scan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 900px) { .scan-grid { grid-template-columns: 1fr; } }

.scan-image-card {
  background: var(--surface);
  border-radius: var(--radius);
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
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
}
.scan-toolbar {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.link-btn {
  background: none;
  border: none;
  font: inherit;
  color: var(--ink-3);
  cursor: pointer;
  padding: 0;
}
.link-btn:hover { color: var(--ink); }

.scan-fields { display: flex; flex-direction: column; gap: 4px; }
.scan-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.scan-hdr h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.conf {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.conf-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ink) 18%, transparent);
}

.scan-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 14px 4px;
  border-bottom: 1px solid var(--line);
}
.scan-row .lbl {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
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
  color: var(--ink);
  width: 100%;
  outline: none;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition: background 0.15s, border-color 0.15s;
}
.scan-row input:hover,
.scan-row select:hover { background: var(--surface); }
.scan-row input:focus,
.scan-row select:focus { background: var(--bg); border-color: var(--ink); }
.scan-row .edit { color: var(--ink-3); font-size: 12px; }

.items-list {
  margin: 16px 0;
  padding: 16px;
  background: var(--surface);
  border-radius: var(--radius);
}
.items-hdr {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.item-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--line);
}
.item-row:last-child { border-bottom: none; }
.item-desc { color: var(--ink-2); }
.item-amt {
  color: var(--ink);
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-weight: 500;
}

.scan-total {
  margin-top: 12px;
  padding: 20px;
  background: var(--surface);
  border-radius: var(--radius);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.scan-total .l {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}
.scan-total .v {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.review-error {
  margin: 16px 0 0;
  padding: 10px 14px;
  background: var(--accent-error, #E8B4B4);
  border-radius: 8px;
  font-size: 13px;
  color: var(--ink);
}
.scan-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.scan-actions .left {
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
}
.scan-actions .right { display: flex; gap: 8px; }
</style>
