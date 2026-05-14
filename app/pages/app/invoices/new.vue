<script setup lang="ts">
definePageMeta({ layout: 'app' })

const router = useRouter()
const client = ref('')
const amount = ref<number | null>(null)
const dueDate = ref('')
const notes = ref('')

function saveInvoice() {
  router.push('/app/invoices')
}
</script>

<template>
  <section class="new-invoice">
    <header class="head">
      <div>
        <span class="muted">Invoices</span>
        <h1>New invoice</h1>
      </div>
      <NuxtLink to="/app/invoices" class="btn">Cancel</NuxtLink>
    </header>

    <form class="card form" @submit.prevent="saveInvoice">
      <div class="field">
        <label for="client">Client</label>
        <input id="client" v-model="client" class="input" required />
      </div>

      <div class="grid">
        <div class="field">
          <label for="amount">Amount</label>
          <input
            id="amount"
            v-model.number="amount"
            type="number"
            min="0"
            step="0.01"
            class="input"
            required
          />
        </div>
        <div class="field">
          <label for="due">Due date</label>
          <input id="due" v-model="dueDate" type="date" class="input" required />
        </div>
      </div>

      <div class="field">
        <label for="notes">Notes</label>
        <textarea id="notes" v-model="notes" class="input" rows="4" />
      </div>

      <div class="actions">
        <NuxtLink to="/app/invoices" class="btn">Cancel</NuxtLink>
        <button type="submit" class="btn btn-primary">Save invoice</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.new-invoice {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 640px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
}

.head .muted {
  display: block;
  font-size: var(--font-caption);
  color: var(--fg-muted);
  margin-bottom: 4px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr 1fr;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid var(--border-subtle);
  padding-top: 16px;
}

@media (max-width: 480px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
