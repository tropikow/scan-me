<script setup lang="ts">
definePageMeta({ layout: 'app' })

const invoices = [
  { id: '1001', client: 'Acme Co.', amount: 1240, status: 'paid' },
  { id: '1002', client: 'Globex', amount: 320, status: 'open' },
  { id: '1003', client: 'Initech', amount: 880, status: 'overdue' },
  { id: '1004', client: 'Hooli', amount: 450, status: 'open' }
]

function formatAmount(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
</script>

<template>
  <section class="invoices">
    <header class="head">
      <div>
        <span class="muted">Billing</span>
        <h1>Invoices</h1>
      </div>
      <NuxtLink to="/app/invoices/new" class="btn btn-primary">New invoice</NuxtLink>
    </header>

    <ul class="list">
      <li v-for="invoice in invoices" :key="invoice.id" class="row">
        <NuxtLink :to="`/app/invoices/${invoice.id}`" class="row-link">
          <span class="id">#{{ invoice.id }}</span>
          <span class="client">{{ invoice.client }}</span>
          <span class="amount">{{ formatAmount(invoice.amount) }}</span>
          <span class="status" :data-status="invoice.status">{{ invoice.status }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.invoices {
  display: flex;
  flex-direction: column;
  gap: 32px;
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

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition), background-color var(--transition);
}

.row:hover {
  border-color: var(--accent-action);
}

.row-link {
  display: grid;
  grid-template-columns: 80px 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px 24px;
}

.id {
  color: var(--fg-muted);
  font-size: var(--font-caption);
  font-variant-numeric: tabular-nums;
}

.client {
  font-weight: 500;
}

.amount {
  font-variant-numeric: tabular-nums;
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

@media (max-width: 640px) {
  .row-link {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'id status'
      'client amount';
    row-gap: 4px;
  }
  .id { grid-area: id; }
  .client { grid-area: client; }
  .amount { grid-area: amount; }
  .status { grid-area: status; justify-self: end; }
}
</style>
