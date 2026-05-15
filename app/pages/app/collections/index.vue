<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'scan-me — collections' })

interface TreeNode {
  id: string
  label: string
  count: number
  indent?: boolean
  open?: boolean
}

const tree: TreeNode[] = [
  { id: 'hogar', label: 'Hogar', count: 14, open: true },
  { id: 'hogar-luz', label: 'Luz', count: 5, indent: true },
  { id: 'hogar-comida', label: 'Comida', count: 6, indent: true },
  { id: 'hogar-internet', label: 'Internet', count: 3, indent: true },
  { id: 'herramientas', label: 'Herramientas', count: 8, open: true },
  { id: 'herramientas-software', label: 'Software › Claude', count: 5, indent: true },
  { id: 'herramientas-hardware', label: 'Hardware', count: 3, indent: true },
  { id: 'transporte', label: 'Transporte', count: 4 },
  { id: 'comida-fuera', label: 'Comida fuera', count: 6 }
]
const active = ref('hogar-comida')

const items = [
  { id: '3471', name: 'Carrefour', date: '13 MAY', amt: '€ 42.18' },
  { id: '3466', name: 'Mercadona', date: '09 MAY', amt: '€ 64.30' },
  { id: '3465', name: 'Lidl', date: '06 MAY', amt: '€ 38.40' },
  { id: '3461', name: 'Carrefour', date: '02 MAY', amt: '€ 41.10' },
  { id: '3459', name: 'Mercadona', date: '30 APR', amt: '€ 28.20' },
  { id: '3458', name: 'Local mkt', date: '28 APR', amt: '€ 18.80' }
]
</script>

<template>
  <div>
    <div class="topbar">
      <h1>Collections</h1>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm">Sort ▾</button>
        <button class="btn-hifi btn-primary btn-sm">+ New collection</button>
      </div>
    </div>

    <section class="route">
      <div class="coll-grid">
        <div class="coll-tree">
          <div class="hdr">
            <span class="lb">TREE</span>
            <button type="button" title="New collection">+</button>
          </div>
          <button
            v-for="node in tree"
            :key="node.id"
            type="button"
            class="ti"
            :class="{ indent: node.indent, active: active === node.id }"
            @click="active = node.id"
          >
            <span v-if="!node.indent" class="caret">{{ node.open ? '▾' : '▸' }}</span>
            {{ node.label }}
            <span class="ct">{{ node.count }}</span>
          </button>
        </div>

        <div class="coll-content">
          <div class="crumb">HOGAR › COMIDA</div>
          <h2>Comida</h2>
          <div class="meta">6 INVOICES · € 232 · MAY 2026</div>

          <div class="inv-cards">
            <NuxtLink
              v-for="item in items"
              :key="item.id"
              :to="`/app/invoices/${item.id}`"
              class="inv-card"
            >
              <div class="thumb" />
              <div class="name">{{ item.name }}</div>
              <div class="row">
                <span class="date">{{ item.date }}</span>
                <span class="amt">{{ item.amt }}</span>
              </div>
            </NuxtLink>
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
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.coll-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1000px) { .coll-grid { grid-template-columns: 1fr; } }

.coll-tree {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.coll-tree .hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px 12px;
}
.coll-tree .hdr .lb {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.coll-tree .hdr button {
  background: transparent;
  border: none;
  color: var(--ink-2);
  font-size: 16px;
  padding: 4px;
  line-height: 1;
  cursor: pointer;
}
.coll-tree .hdr button:hover { color: var(--ink); }

.ti {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  color: var(--ink-2);
  cursor: pointer;
  font-weight: 450;
  letter-spacing: -0.005em;
  background: transparent;
  border: none;
  font-family: inherit;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}
.ti:hover { background: var(--bg); color: var(--ink); }
.ti.active {
  background: var(--bg);
  color: var(--ink);
  font-weight: 500;
  box-shadow: 0 0 0 1px var(--line-2);
}
.ti.indent {
  padding-left: 26px;
  color: var(--ink-3);
  font-size: 13px;
}
.ti.indent.active { color: var(--ink); }
.ti .ct {
  margin-left: auto;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.ti.active .ct { color: var(--ink-2); }
.ti .caret { width: 12px; opacity: 0.5; }

.coll-content .crumb {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.coll-content h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.coll-content .meta {
  margin-top: 6px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--ink-3);
}

.inv-cards {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.inv-card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  color: inherit;
  transition: transform 0.18s, border-color 0.15s;
}
.inv-card:hover { transform: translateY(-2px); border-color: var(--ink-4); }
.inv-card .thumb {
  aspect-ratio: 4 / 3;
  background: var(--surface);
  border-radius: 6px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}
.inv-card .thumb::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 3px;
  background: #fdfbf6;
  background-image:
    linear-gradient(transparent calc(33% - 1px), rgba(0, 0, 0, 0.06) 33%, transparent 33%),
    linear-gradient(transparent calc(66% - 1px), rgba(0, 0, 0, 0.04) 66%, transparent 66%);
  transform: rotate(-1.5deg);
}
.inv-card .name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.inv-card .row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 6px;
}
.inv-card .row .date {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.inv-card .row .amt {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 600;
}
</style>
