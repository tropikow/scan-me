<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — new scan' })

const router = useRouter()

const fields = reactive({
  merchant: 'Carrefour Express',
  date: '13 May 2026',
  tax: '€ 7.32 (21%)',
  collection: 'Hogar › Comida',
  user: '@maria · Family',
  tags: 'weekly · groceries'
})

const collections = ['Hogar › Comida', 'Hogar › Luz', 'Tools › AI', 'Transport']

function save() {
  router.push('/app/invoices/3471')
}
function cancel() {
  router.push('/app/dashboard')
}
</script>

<template>
  <div>
    <div class="topbar">
      <div>
        <div class="crumb mono">Reviewing extracted fields</div>
        <h1>New scan</h1>
      </div>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm" @click="cancel">Cancel</button>
        <button class="btn-hifi btn-primary btn-sm" @click="save">Save invoice →</button>
      </div>
    </div>

    <section class="route">
      <div class="scan-grid">
        <div class="scan-image-card">
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
            <div class="litem"><span>Subtotal</span><span>34.86</span></div>
            <div class="litem"><span>Tax 21%</span><span>7.32</span></div>
            <div class="tot"><span>TOTAL</span><span>€ 42.18</span></div>
          </div>
          <div class="scan-toolbar">
            <span>IMG_2034.JPG · 1.2 MB</span>
            <span>↻ RE-OCR · ⌖ ZOOM</span>
          </div>
        </div>

        <div class="scan-fields">
          <div class="scan-hdr">
            <h2>Review fields</h2>
            <span class="conf"><span class="conf-dot" />98% CONFIDENCE</span>
          </div>

          <div class="scan-row">
            <span class="lbl">MERCHANT</span>
            <input v-model="fields.merchant" />
            <span class="edit">✎</span>
          </div>
          <div class="scan-row">
            <span class="lbl">DATE</span>
            <input v-model="fields.date" />
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
              <option v-for="c in collections" :key="c" :value="c">{{ c }}</option>
            </select>
            <span class="edit">▾</span>
          </div>
          <div class="scan-row">
            <span class="lbl">USER</span>
            <input v-model="fields.user" />
            <span class="edit">▾</span>
          </div>
          <div class="scan-row">
            <span class="lbl">TAGS</span>
            <input v-model="fields.tags" />
            <span class="edit">✎</span>
          </div>

          <div class="scan-total">
            <span class="l">TOTAL</span>
            <span class="v">€ 42.18</span>
          </div>

          <div class="scan-actions">
            <span class="left">5 line items · click table to edit</span>
            <div class="right">
              <button class="btn-hifi btn-ghost btn-sm" @click="cancel">Discard</button>
              <button class="btn-hifi btn-primary btn-sm" @click="save">Save invoice →</button>
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
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.scan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1000px) { .scan-grid { grid-template-columns: 1fr; } }

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
}
.scan-image-card .recpaper {
  width: 76%;
  aspect-ratio: 4 / 5.2;
  transform: rotate(-2deg);
  overflow: hidden;
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
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.scan-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.scan-actions .left {
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
}
.scan-actions .right { display: flex; gap: 8px; }
</style>
