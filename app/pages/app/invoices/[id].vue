<script setup lang="ts">
definePageMeta({ layout: 'app' })

const route = useRoute()
const invoiceId = computed(() => String(route.params.id))

const invoice = {
  client: 'Acme Co.',
  email: 'billing@acme.co',
  amount: 1240,
  dueDate: '2026-06-01',
  status: 'open',
  items: [
    { description: 'Scanner setup', quantity: 1, price: 800 },
    { description: 'Training session', quantity: 2, price: 220 }
  ]
}

function formatAmount(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
</script>

<template>
  <section class="detail">
    <header class="head">
      <div>
        <span class="muted">Invoice</span>
        <h1>#{{ invoiceId }}</h1>
      </div>
      <div class="actions">
        <NuxtLink to="/app/invoices" class="btn">Back</NuxtLink>
        <button type="button" class="btn btn-primary">Send</button>
      </div>
    </header>

    <article class="card summary">
      <div class="row">
        <span class="label">Client</span>
        <span>{{ invoice.client }}</span>
      </div>
      <div class="row">
        <span class="label">Email</span>
        <span>{{ invoice.email }}</span>
      </div>
      <div class="row">
        <span class="label">Due date</span>
        <span>{{ invoice.dueDate }}</span>
      </div>
      <div class="row">
        <span class="label">Status</span>
        <span class="status" :data-status="invoice.status">{{ invoice.status }}</span>
      </div>
    </article>

    <article class="card items">
      <h3>Line items</h3>
      <ul class="item-list">
        <li v-for="item in invoice.items" :key="item.description" class="item">
          <span class="item-desc">{{ item.description }}</span>
          <span class="muted">× {{ item.quantity }}</span>
          <span class="item-price">{{ formatAmount(item.price * item.quantity) }}</span>
        </li>
      </ul>
      <footer class="total">
        <span>Total</span>
        <span>{{ formatAmount(invoice.amount) }}</span>
      </footer>
    </article>
  </section>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 720px;
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

.actions {
  display: flex;
  gap: 8px;
}

.summary {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.row:last-child { border-bottom: none; }

.label {
  color: var(--fg-muted);
}

.status {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-caption);
  text-transform: capitalize;
  border: 1px solid var(--border-subtle);
}

.status[data-status='paid'] { background: var(--accent-success); }
.status[data-status='open'] { background: var(--accent-info); }
.status[data-status='overdue'] { background: var(--accent-error); }

.items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.item-desc {
  font-weight: 500;
}

.item-price {
  font-variant-numeric: tabular-nums;
}

.total {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  font-weight: 600;
  font-size: var(--font-h3);
}
</style>
