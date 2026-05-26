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
  const labelFor = buildCollectionPathLabeler(rows)
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

const totalDisplay = computed(() =>
  result.value ? formatAmount(result.value.total, result.value.currency) : '—',
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
      <button class="btn btn-primary btn-sm" type="button" @click="reset">
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
            <button type="button" class="btn btn-primary upload-btn" @click="pickCamera">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Take a photo
            </button>
            <button type="button" class="btn upload-btn" @click="pickGallery">
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
              <button
                class="btn btn-ghost btn-sm"
                type="button"
                :disabled="saving"
                @click="reset"
              >Discard</button>
              <button
                class="btn btn-primary btn-sm"
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
  padding: var(--space-6) var(--space-4) var(--space-12);
}

.share-head {
  margin-bottom: var(--space-8);
  text-align: center;
}
.crumb {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.share-head h1 {
  margin: var(--space-2) 0 var(--space-3);
  font-size: var(--text-heading-lg);
  font-weight: 700;
  letter-spacing: -0.7px;
  line-height: 1.15;
}
.share-head .who {
  background: var(--color-action);
  color: var(--color-snow);
  padding: 2px var(--space-3);
  border-radius: var(--radius-md);
  white-space: nowrap;
}
.share-head .lede {
  margin: 0 auto;
  max-width: 52ch;
  color: var(--color-slate);
  font-size: 15px;
  line-height: 1.5;
  letter-spacing: -0.04px;
}

/* STATES */
.state.center {
  max-width: 480px;
  margin: var(--space-12) auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}
.state-title {
  font-size: var(--text-heading-sm);
  font-weight: 600;
  letter-spacing: -0.3px;
}
.state-hint {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}
.check-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-success);
  color: var(--color-snow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-heading);
  font-weight: 700;
}

/* UPLOAD */
.upload-wrap { max-width: 720px; margin: 0 auto; }
.upload-zone {
  border: 1.5px dashed var(--color-mist);
  border-radius: var(--radius-lg);
  padding: var(--space-12) var(--space-6);
  text-align: center;
  background: var(--color-fog);
  transition: border-color var(--transition), background var(--transition);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.upload-zone.over {
  border-color: var(--color-action);
  background: var(--color-snow);
}
.upload-input { display: none; }
.upload-icon { width: 44px; height: 44px; color: var(--color-graphite); margin-bottom: var(--space-1); }
.upload-icon svg { width: 100%; height: 100%; }
.upload-title {
  font-size: var(--text-subheading);
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--color-ink);
}
.upload-hint {
  font-size: 13px;
  color: var(--color-graphite);
  letter-spacing: -0.04px;
  max-width: 36ch;
}
.upload-cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-4);
}
.upload-btn {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-body-sm);
  min-width: 160px;
}
.upload-drophint {
  margin: var(--space-3) 0 0;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--color-graphite);
}
.upload-error {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-error);
}

@media (max-width: 768px) {
  .upload-zone { padding: var(--space-10) var(--space-5); }
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
  gap: var(--space-4);
  padding-top: var(--space-12);
}
.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-mist);
  border-top-color: var(--color-action);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* REVIEW (mirrors scan.vue) */
.scan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  align-items: start;
}
@media (max-width: 1024px) { .scan-grid { grid-template-columns: 1fr; } }

.scan-image-card {
  background: var(--color-fog);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
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
}
.scan-toolbar {
  position: absolute;
  bottom: var(--space-3);
  left: var(--space-3);
  right: var(--space-3);
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

.scan-fields { display: flex; flex-direction: column; gap: var(--space-1); }
.scan-hdr {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.scan-hdr h2 {
  margin: 0;
  font-size: var(--text-heading);
  font-weight: 700;
  letter-spacing: -0.5px;
}
.conf {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
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
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4) var(--space-1);
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
  border-radius: var(--radius-sm);
  padding: 6px var(--space-2);
  font-family: inherit;
  font-size: var(--text-body-sm);
  color: var(--color-ink);
  width: 100%;
  outline: none;
  font-weight: 500;
  letter-spacing: -0.04px;
  transition: background var(--transition), border-color var(--transition);
}
.scan-row input:hover,
.scan-row select:hover { background: var(--color-fog); }
.scan-row input:focus,
.scan-row select:focus { background: var(--color-snow); border-color: var(--color-action); }
.scan-row .edit { color: var(--color-graphite); font-size: 12px; }

.items-list {
  margin: var(--space-4) 0;
  padding: var(--space-4);
  background: var(--color-fog);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
}
.items-hdr {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  margin-bottom: var(--space-2);
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
  margin-top: var(--space-3);
  padding: var(--space-5);
  background: var(--color-fog);
  border: 1px solid var(--color-mist);
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
  font-size: var(--text-heading-lg);
  font-weight: 700;
  letter-spacing: -0.7px;
}
.review-error {
  margin: var(--space-4) 0 0;
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-error);
}
.scan-actions {
  margin-top: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.scan-actions .left {
  font-size: 12.5px;
  color: var(--color-graphite);
  letter-spacing: -0.04px;
}
.scan-actions .right { display: flex; gap: var(--space-2); }
</style>
