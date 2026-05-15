<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — people' })

const people = [
  { slug: 'maria', initial: 'M', role: 'Family', tag: 'FAMILY · @maria', name: 'Maria López', amt: '€ 312', count: '8 INV' },
  { slug: 'jose', initial: 'J', role: 'Family', tag: 'FAMILY · @jose', name: 'José Ruiz', amt: '€ 184', count: '5 INV' },
  { slug: 'karen', initial: 'K', role: 'Client', solid: true, tag: 'CLIENT · KAREN@BRO.CO', name: 'Karen Brown', amt: '€ 940', count: '12 INV' },
  { slug: 'devco', initial: 'D', role: 'Client', tag: 'B2B · BILLING@DEV.CO', name: 'DevCo S.L.', amt: '€ 1.2k', count: '18 INV' },
  { slug: 'alex', initial: 'A', role: 'Employee', tag: 'EMPLOYEE · @alex', name: 'Alex Torres', amt: '€ 220', count: '6 INV' },
  { slug: 'sara', initial: 'S', role: 'Employee', tag: 'EMPLOYEE · @sara', name: 'Sara Pérez', amt: '€ 178', count: '4 INV' },
  { slug: 'luis', initial: 'L', role: 'Family', tag: 'FAMILY · @luis', name: 'Luis García', amt: '€ 65', count: '2 INV' }
]
</script>

<template>
  <div>
    <div class="topbar">
      <h1>People</h1>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm">Role: All ▾</button>
        <button class="btn-hifi btn-primary btn-sm">+ Add person</button>
      </div>
    </div>

    <section class="route">
      <div class="people-grid">
        <NuxtLink
          v-for="p in people"
          :key="p.slug"
          :to="`/app/people/${p.slug}`"
          class="person-card"
        >
          <div class="top">
            <span class="avatar lg" :class="{ solid: p.solid }">{{ p.initial }}</span>
            <span class="chip tiny">{{ p.role }}</span>
          </div>
          <div>
            <div class="name">{{ p.name }}</div>
            <div class="role">{{ p.tag }}</div>
          </div>
          <div class="stats">
            <span class="amt">{{ p.amt }}</span>
            <span class="ct">{{ p.count }}</span>
          </div>
        </NuxtLink>

        <button type="button" class="person-card add">
          <div class="plus">+</div>
          <div>
            <div class="name add-name">Add person</div>
            <div class="role">FAMILY · CLIENT · EMPLOYEE</div>
          </div>
        </button>
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
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.people-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.person-card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
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
.person-card:hover { transform: translateY(-2px); border-color: var(--ink-4); }
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
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.05em;
  margin-top: 2px;
}
.person-card .stats {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 4px;
}
.person-card .amt {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1;
}
.person-card .ct {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
}

.person-card.add {
  border-style: dashed;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--ink-3);
  background: transparent;
}
.person-card.add:hover { color: var(--ink); border-color: var(--ink-4); }
.person-card.add .plus {
  font-size: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
}
.person-card.add .add-name {
  color: var(--ink-2);
  margin-top: 0;
}
</style>
