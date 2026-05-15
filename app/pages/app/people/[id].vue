<script setup lang="ts">
definePageMeta({ layout: 'app' })

const route = useRoute()
const slug = computed(() => route.params.id as string)

useHead({ title: () => `scan-me — ${slug.value}` })

const receipts = [
  { id: '3471', name: 'OFFICE', lines: [{ k: 'Paper A4', v: '12.00' }, { k: 'Pens × 6', v: '14.40' }, { k: 'Printer ink', v: '89.00' }, { k: 'Tape', v: '4.60' }], total: '€ 124' },
  { id: '3463', name: 'RENFE', lines: [{ k: 'MAD → BCN', v: '164.00' }, { k: 'Lounge', v: '28.00' }, { k: 'Hotel', v: '120.00' }], total: '€ 318' },
  { id: '3462', name: 'LA TASCA', lines: [{ k: 'Lunch × 2', v: '42.00' }, { k: 'Wine', v: '14.00' }], total: '€ 56' },
  { id: '3464', name: 'NOTION', lines: [{ k: 'Team plan', v: '80.00' }, { k: 'AI add-on', v: '16.00' }], total: '€ 96' }
]

const breakdown = [
  { nm: 'Travel', v: '€ 1,420', w: 85 },
  { nm: 'Office supplies', v: '€ 980', w: 60 },
  { nm: 'SaaS · tools', v: '€ 720', w: 45 },
  { nm: 'Food', v: '€ 540', w: 32 },
  { nm: 'Other', v: '€ 550', w: 30 }
]
</script>

<template>
  <div>
    <div class="topbar">
      <div>
        <div class="crumb mono">
          <NuxtLink to="/app/people">People</NuxtLink> › Karen Brown
        </div>
        <h1>Karen Brown</h1>
      </div>
      <div class="actions">
        <button class="btn-hifi btn-ghost btn-sm">✎ Edit</button>
        <NuxtLink to="/app/scan" class="btn-hifi btn-primary btn-sm">+ Assign invoice</NuxtLink>
      </div>
    </div>

    <section class="route">
      <div class="person-hero">
        <span class="avatar lg hero-avatar">K</span>
        <div>
          <h2>Karen Brown</h2>
          <div class="submeta">CLIENT · KAREN@BRO.CO · SINCE MAR 2025</div>
          <div class="chips">
            <span class="chip solid">Client</span>
            <span class="chip translucent">B2B</span>
            <span class="chip translucent">monthly</span>
          </div>
        </div>
        <div class="right">
          <div class="lbl">THIS MONTH</div>
          <div class="num">€ 940</div>
          <div class="lbl spaced">12 INVOICES · ALL TIME € 4,210</div>
        </div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-title-row">
            <h3>Recent receipts</h3>
            <NuxtLink to="/app/invoices" class="btn-hifi btn-ghost btn-sm">See all 12 →</NuxtLink>
          </div>
          <div class="receipt-strip">
            <NuxtLink
              v-for="r in receipts"
              :key="r.id"
              :to="`/app/invoices/${r.id}`"
              class="recpaper-card"
            >
              <h5>{{ r.name }}</h5>
              <hr />
              <div v-for="l in r.lines" :key="l.k" class="litem">
                <span>{{ l.k }}</span><span>{{ l.v }}</span>
              </div>
              <div class="tot"><span>TOTAL</span><span>{{ r.total }}</span></div>
            </NuxtLink>
          </div>
        </div>

        <div class="card">
          <div class="card-title-row">
            <h3>By collection</h3>
            <span class="chip outline mono">ALL TIME</span>
          </div>
          <div class="breakdown">
            <div v-for="b in breakdown" :key="b.nm">
              <div class="bd-row">
                <span class="nm">{{ b.nm }}</span>
                <span class="v">{{ b.v }}</span>
              </div>
              <div class="bd-bar"><i :style="{ width: `${b.w}%` }" /></div>
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
.crumb a { color: var(--ink-3); transition: color 0.15s; }
.crumb a:hover { color: var(--ink); }
.actions { display: flex; gap: 8px; }

.route { padding: 36px; }

.person-hero {
  background: var(--ink);
  color: var(--accent-ink);
  border-radius: var(--radius);
  padding: 32px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}
.hero-avatar {
  width: 88px;
  height: 88px;
  font-size: 36px;
  background: rgba(255, 255, 255, 0.10);
  color: var(--accent-ink);
}
.person-hero h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.person-hero .submeta {
  margin-top: 4px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 12px;
  color: color-mix(in srgb, var(--accent-ink) 65%, transparent);
  letter-spacing: 0.04em;
}
.person-hero .chips { display: flex; gap: 8px; margin-top: 14px; }
.chip.translucent {
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.85);
}
.person-hero .right { margin-left: auto; text-align: right; }
.person-hero .right .lbl {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: color-mix(in srgb, var(--accent-ink) 55%, transparent);
  letter-spacing: 0.08em;
}
.person-hero .right .lbl.spaced { margin-top: 10px; }
.person-hero .right .num {
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-top: 4px;
}

.split {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
@media (max-width: 1000px) { .split { grid-template-columns: 1fr; } }

.card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
}
.card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.015em;
}
.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.receipt-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.recpaper-card {
  aspect-ratio: 4 / 5;
  background: #fdfbf6;
  border-radius: 8px;
  box-shadow: 0 8px 22px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--line-2);
  padding: 16px 14px;
  transition: transform 0.18s;
  color: inherit;
  display: block;
}
.recpaper-card:hover { transform: translateY(-3px); }
.recpaper-card h5 {
  margin: 0;
  text-align: center;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.04em;
}
.recpaper-card hr { border: none; border-top: 1px dashed #ccc; margin: 8px 0; }
.recpaper-card .litem {
  display: flex;
  justify-content: space-between;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 9px;
  color: #333;
  margin-bottom: 3px;
}
.recpaper-card .tot {
  display: flex;
  justify-content: space-between;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #0a0a0a;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.breakdown {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}
.bd-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}
.bd-row .nm {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.bd-row .v {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-weight: 600;
}
.bd-bar {
  height: 4px;
  background: var(--surface);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.bd-bar > i {
  display: block;
  height: 100%;
  background: var(--ink);
  border-radius: 2px;
}
</style>
