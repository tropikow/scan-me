<script setup lang="ts">
definePageMeta({ layout: 'app' })

const stats = [
  { label: 'Open', value: 4 },
  { label: 'Paid this month', value: 12 },
  { label: 'Overdue', value: 1 }
]
</script>

<template>
  <section class="dashboard">
    <header class="head">
      <div>
        <span class="muted">Overview</span>
        <h1>Dashboard</h1>
      </div>
      <NuxtLink to="/app/invoices/new" class="btn btn-primary">New invoice</NuxtLink>
    </header>

    <div class="grid">
      <article v-for="stat in stats" :key="stat.label" class="card stat">
        <span class="label">{{ stat.label }}</span>
        <span class="value">{{ stat.value }}</span>
      </article>
    </div>

    <article class="card">
      <header class="card-head">
        <h3>Recent activity</h3>
        <NuxtLink to="/app/invoices" class="muted link">View all</NuxtLink>
      </header>
      <p class="muted">Your latest invoices will appear here.</p>
    </article>
  </section>
</template>

<style scoped>
.dashboard {
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

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat .label {
  color: var(--fg-muted);
  font-size: var(--font-caption);
}

.stat .value {
  font-size: var(--font-h1);
  font-weight: 600;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.link {
  text-decoration: underline;
}
</style>
