<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — people' })

type PersonRow = {
  id: string
  name: string
  role: string
  note: string | null
  created_at: string
}

const supabase = useSupabaseClient()

const ROLE_PRESETS = ['Family', 'Client', 'Employee', 'Partner', 'Friend', 'Other'] as const

const { data: people, refresh } = await useAsyncData(
  'people-list',
  async () => {
    const { data, error } = await supabase
      .from('people')
      .select('id, name, role, note, created_at')
      .order('created_at', { ascending: false })
    if (error) return [] as PersonRow[]
    return (data ?? []) as PersonRow[]
  },
  { default: () => [] as PersonRow[] },
)

type InvoiceAggRow = { person_id: string; total: number | null; currency: string | null }

const { data: invoiceAgg } = await useAsyncData(
  'people-invoice-agg',
  async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('person_id, total, currency')
      .not('person_id', 'is', null)
      .is('voided_at', null)
    if (error) return [] as InvoiceAggRow[]
    return (data ?? []) as InvoiceAggRow[]
  },
  { default: () => [] as InvoiceAggRow[] },
)

type Stat = { count: number; total: number; currency: string }
const statsByPerson = computed<Map<string, Stat>>(() => {
  const m = new Map<string, Stat>()
  const currencyCounts = new Map<string, Map<string, number>>()
  for (const r of invoiceAgg.value) {
    if (!r.person_id) continue
    const prev = m.get(r.person_id) ?? { count: 0, total: 0, currency: '' }
    prev.count += 1
    prev.total += Number(r.total ?? 0)
    m.set(r.person_id, prev)
    const cc = currencyCounts.get(r.person_id) ?? new Map<string, number>()
    const c = r.currency ?? ''
    cc.set(c, (cc.get(c) ?? 0) + 1)
    currencyCounts.set(r.person_id, cc)
  }
  for (const [pid, cc] of currencyCounts.entries()) {
    let best = ''
    let bestN = 0
    for (const [k, n] of cc.entries()) if (n > bestN) { best = k; bestN = n }
    const stat = m.get(pid)
    if (stat) stat.currency = best
  }
  return m
})

function amtFor(personId: string): string {
  const s = statsByPerson.value.get(personId)
  if (!s || s.count === 0) return '—'
  const sym = currencySymbol(s.currency) || '€'
  return `${sym} ${Math.round(s.total).toLocaleString('en-US')}`
}

function countFor(personId: string): string {
  const n = statsByPerson.value.get(personId)?.count ?? 0
  return `${n} INV`
}

const roleFilter = ref<'All' | string>('All')
const showRoleMenu = ref(false)

const availableRoles = computed(() => {
  const set = new Set<string>(ROLE_PRESETS)
  for (const p of people.value ?? []) set.add(p.role)
  return Array.from(set)
})

const filteredPeople = computed(() => {
  const list = people.value ?? []
  if (roleFilter.value === 'All') return list
  return list.filter((p) => p.role === roleFilter.value)
})

function initialOf(name: string): string {
  const t = name.trim()
  if (!t) return '·'
  return t[0]!.toUpperCase()
}

function tagFor(p: PersonRow): string {
  return p.role.toUpperCase()
}

const showAddDialog = ref(false)
const form = reactive({
  name: '',
  role: 'Family' as string,
  customRole: '',
  note: '',
})
const submitting = ref(false)
const formError = ref<string | null>(null)

function openAdd() {
  form.name = ''
  form.role = 'Family'
  form.customRole = ''
  form.note = ''
  formError.value = null
  showAddDialog.value = true
}

function closeAdd() {
  if (submitting.value) return
  showAddDialog.value = false
}

async function submitAdd() {
  if (submitting.value) return
  formError.value = null
  const name = form.name.trim()
  if (!name) {
    formError.value = 'Name is required.'
    return
  }
  const role = (form.role === 'Other' ? form.customRole.trim() : form.role) || 'Other'
  if (role.length > 40) {
    formError.value = 'Role must be 40 characters or less.'
    return
  }
  const note = form.note.trim() || null

  // Verify session before write — same defensive pattern as collections.
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session) {
    formError.value = 'Your session has expired. Please sign in again.'
    return
  }

  submitting.value = true
  const { error } = await supabase.from('people').insert({ name, role, note })
  submitting.value = false
  if (error) {
    formError.value = `Could not add person: ${error.message}`
    return
  }
  showAddDialog.value = false
  await refresh()
}
</script>

<template>
  <div>
    <div class="topbar">
      <h1>People</h1>
      <div class="actions">
        <div class="role-filter">
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            @click="showRoleMenu = !showRoleMenu"
          >
            Role: {{ roleFilter }} ▾
          </button>
          <div v-if="showRoleMenu" class="role-menu" @click.stop>
            <button
              type="button"
              class="role-menu-item"
              :class="{ active: roleFilter === 'All' }"
              @click="roleFilter = 'All'; showRoleMenu = false"
            >
              All
            </button>
            <button
              v-for="r in availableRoles"
              :key="r"
              type="button"
              class="role-menu-item"
              :class="{ active: roleFilter === r }"
              @click="roleFilter = r; showRoleMenu = false"
            >
              {{ r }}
            </button>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" type="button" @click="openAdd">
          + Add person
        </button>
      </div>
    </div>

    <section class="route">
      <div class="people-grid">
        <NuxtLink
          v-for="p in filteredPeople"
          :key="p.id"
          :to="`/app/people/${p.id}`"
          class="person-card"
        >
          <div class="top">
            <span class="avatar lg">{{ initialOf(p.name) }}</span>
            <span class="chip tiny">{{ p.role }}</span>
          </div>
          <div>
            <div class="name">{{ p.name }}</div>
            <div class="role">{{ tagFor(p) }}</div>
            <div v-if="p.note" class="note">{{ p.note }}</div>
          </div>
          <div class="stats">
            <span class="amt">{{ amtFor(p.id) }}</span>
            <span class="ct">{{ countFor(p.id) }}</span>
          </div>
        </NuxtLink>

        <button type="button" class="person-card add" @click="openAdd">
          <div class="plus">+</div>
          <div>
            <div class="name add-name">Add person</div>
            <div class="role">FAMILY · CLIENT · EMPLOYEE</div>
          </div>
        </button>
      </div>

      <div v-if="(people ?? []).length === 0 && filteredPeople.length === 0" class="empty-hint">
        No people yet. Click <strong>+ Add person</strong> to track someone alongside your invoices.
      </div>
      <div
        v-else-if="filteredPeople.length === 0"
        class="empty-hint"
      >
        No people with role <strong>{{ roleFilter }}</strong>.
        <button class="link" type="button" @click="roleFilter = 'All'">Show all</button>
      </div>
    </section>

    <!-- Add person dialog -->
    <div
      v-if="showAddDialog"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-person-title"
      @click.self="closeAdd"
    >
      <div class="dialog">
        <header class="dialog-head">
          <h2 id="add-person-title">Add person</h2>
          <button
            type="button"
            class="dialog-close"
            aria-label="Close"
            :disabled="submitting"
            @click="closeAdd"
          >×</button>
        </header>

        <form class="dialog-body" @submit.prevent="submitAdd">
          <label class="field">
            <span class="field-label">Name</span>
            <input
              v-model="form.name"
              type="text"
              autocomplete="off"
              placeholder="e.g. Maria López"
              maxlength="120"
              :disabled="submitting"
            />
          </label>

          <label class="field">
            <span class="field-label">Role</span>
            <select v-model="form.role" :disabled="submitting">
              <option v-for="r in ROLE_PRESETS" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>

          <label v-if="form.role === 'Other'" class="field">
            <span class="field-label">Custom role</span>
            <input
              v-model="form.customRole"
              type="text"
              autocomplete="off"
              placeholder="e.g. Supplier, Accountant…"
              maxlength="40"
              :disabled="submitting"
            />
          </label>

          <label class="field">
            <span class="field-label">Note <span class="field-hint">(optional)</span></span>
            <input
              v-model="form.note"
              type="text"
              autocomplete="off"
              placeholder="Anything to remember"
              maxlength="240"
              :disabled="submitting"
            />
          </label>

          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

          <div class="dialog-foot">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="submitting"
              @click="closeAdd"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm"
              :disabled="submitting"
            >
              {{ submitting ? 'Adding…' : 'Add person' }}
            </button>
          </div>
        </form>
      </div>
    </div>
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
.actions { display: flex; gap: 8px; position: relative; }

.role-filter { position: relative; }
.role-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  min-width: 160px;
  box-shadow: var(--shadow-popover);
  z-index: 10;
}
.role-menu-item {
  background: transparent;
  border: none;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-slate);
}
.role-menu-item:hover { background: var(--color-fog); color: var(--color-ink); }
.role-menu-item.active { background: var(--color-fog); color: var(--color-ink); font-weight: 500; }

.route { padding: 36px; }

.people-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.person-card {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: 24px;
  color: inherit;
  transition: transform 0.18s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}
.person-card:hover { transform: translateY(-2px); border-color: var(--color-mist); }
.person-card .top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.person-card .name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-top: 16px;
}
.person-card .role {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.05em;
  margin-top: 2px;
}
.person-card .note {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--color-slate);
  letter-spacing: -0.005em;
  line-height: 1.35;
}
.person-card .stats {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 4px;
}
.person-card .amt {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1;
  color: var(--color-graphite);
}
.person-card .ct {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
}

.person-card.add {
  border-style: dashed;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-graphite);
  background: transparent;
}
.person-card.add:hover { color: var(--color-ink); border-color: var(--color-mist); }
.person-card.add .plus {
  font-size: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-fog);
  display: flex;
  align-items: center;
  justify-content: center;
}
.person-card.add .add-name {
  color: var(--color-slate);
  margin-top: 0;
}

.empty-hint {
  margin-top: 24px;
  text-align: center;
  font-size: 13.5px;
  color: var(--color-graphite);
  letter-spacing: -0.005em;
}
.empty-hint .link {
  background: transparent;
  border: none;
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font: inherit;
  padding: 0 4px;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.32);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
  animation: dialog-fade 0.18s ease-out;
}
.dialog {
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: 14px;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  animation: dialog-rise 0.22s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.dialog-head {
  padding: 20px 24px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.dialog-close {
  background: transparent;
  border: none;
  font-size: 22px;
  color: var(--color-graphite);
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 6px;
}
.dialog-close:hover { color: var(--color-ink); background: var(--color-fog); }
.dialog-close:disabled { opacity: 0.5; cursor: not-allowed; }

.dialog-body {
  padding: 4px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.field-hint {
  font-size: 10px;
  text-transform: none;
  letter-spacing: 0.02em;
  color: var(--color-graphite);
  margin-left: 4px;
}
.field input,
.field select {
  width: 100%;
  padding: 11px 13px;
  font: inherit;
  font-size: 14px;
  color: var(--color-ink);
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: 10px;
  letter-spacing: -0.005em;
  transition: border-color 0.15s;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--color-action);
}
.field input:disabled,
.field select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  margin: 0;
  padding: 10px 12px;
  background: var(--color-error);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-ink);
  line-height: 1.4;
}

.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

@keyframes dialog-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes dialog-rise {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
