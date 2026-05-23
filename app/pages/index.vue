<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'scan-me — the receipt becomes the spreadsheet'
})

const trustLogos = ['Freelancers', 'Families', 'Startups', 'Accountants', 'Small teams']

const steps = [
  {
    num: '01 · SNAP',
    title: 'Photograph any receipt.',
    body: 'Point your camera. We handle wrinkled, blurry, faded — even half-folded ones. Personal expenses or business invoices, all in one app.'
  },
  {
    num: '02 · PARSE',
    title: 'Watch it become data.',
    body: 'Our OCR extracts merchant, date, line items, taxes and total in seconds. You confirm, we save it as a structured, searchable invoice.'
  },
  {
    num: '03 · SORT',
    title: 'See where it went.',
    body: 'Group by collection, sub-collection, or person. Hogar › Luz. Tools › Software › Claude. Karen B. (client). It’s your taxonomy.'
  }
]

const betaPerks = [
  'Unlimited scans, people and collections',
  'Full history with no expiration',
  'Public share links and CSV export',
  'Early access to every new feature we ship',
  'A direct line to us — your feedback shapes the product'
]
</script>

<template>
  <div class="landing-page">
    <!-- ============ HERO ============ -->
    <section class="hero">
      <div class="hero-inner">
        <span class="eyebrow">
          <span class="pulse" />
          <span>Now in beta</span>
        </span>

        <h1 class="hero-title">scan&#8209;me<span class="dot">.</span></h1>

        <p class="hero-sub">The receipt becomes the spreadsheet. Snap a photo — get a parsed, sorted, searchable invoice.</p>

        <div class="hero-cta-row">
          <NuxtLink to="/signup" class="btn btn-primary">Start free<span>→</span></NuxtLink>
          <a href="#how" class="btn btn-ghost"><span>See it work</span></a>
        </div>

        <p class="hero-tiny">No card required · Unlimited free access during beta</p>
      </div>

      <!-- ============ PHONE ============ -->
      <div class="phone-stage">
        <div class="phone-glow" />
        <div class="phone">
          <div class="phone-screen">
            <div class="island" />

            <div class="status">
              <span>9:41</span>
              <span class="icons">
                <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.6" /><rect x="5" y="5" width="3" height="6" rx="0.6" /><rect x="10" y="2.5" width="3" height="8.5" rx="0.6" /><rect x="15" y="0" width="3" height="11" rx="0.6" /></svg>
                <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 11a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 8 11Z" /><path d="M3.8 7.2a6 6 0 0 1 8.4 0l-1.4 1.4a4 4 0 0 0-5.6 0L3.8 7.2Z" /><path d="M.6 4a10.6 10.6 0 0 1 14.8 0l-1.4 1.4a8.6 8.6 0 0 0-12 0L.6 4Z" /></svg>
                <svg width="26" height="12" viewBox="0 0 26 12" fill="currentColor"><rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" stroke-opacity="0.4" /><rect x="2" y="2" width="14" height="8" rx="1.6" /><rect x="24" y="4" width="1.6" height="4" rx="0.6" /></svg>
              </span>
            </div>

            <div class="app">
              <div class="app-bar">
                <span class="back">← Preview</span>
                <span class="step-indicator mono">3 / 3</span>
              </div>

              <div class="extracted">
                <span class="check">✓</span>
                <span>EXTRACTED · 98% CONFIDENCE</span>
              </div>

              <article class="dinv-mini" aria-label="Digital invoice preview">
                <header class="dinv-mini-head">
                  <div class="dinv-mini-brand">
                    <span class="dinv-mini-logo" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4">
                        <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
                        <path d="M5 8 L7 10 L11 6" />
                      </svg>
                    </span>
                    <span class="dinv-mini-brand-name">scan-me</span>
                  </div>
                  <div class="dinv-mini-stamp">
                    <span class="dinv-mini-stamp-label mono">Invoice</span>
                    <span class="dinv-mini-stamp-id mono">#A1B2C3D4</span>
                  </div>
                </header>

                <div class="dinv-mini-divider" />

                <section class="dinv-mini-meta">
                  <div class="dinv-mini-meta-block">
                    <span class="dinv-mini-key mono">Issued by</span>
                    <span class="dinv-mini-val">Carrefour Express</span>
                    <span class="dinv-mini-sub">Calle Mayor 12, Madrid</span>
                  </div>
                  <div class="dinv-mini-meta-block r">
                    <span class="dinv-mini-key mono">Date</span>
                    <span class="dinv-mini-val">13 MAY 2026</span>
                    <span class="dinv-mini-sub mono">№ 0481-22</span>
                  </div>
                </section>

                <div class="dinv-mini-divider dashed" />

                <section class="dinv-mini-items">
                  <div class="dinv-mini-row dinv-mini-row-head mono">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Amount</span>
                  </div>
                  <div class="dinv-mini-row">
                    <span class="d-desc">Milk 1L</span>
                    <span class="mono d-qty">2</span>
                    <span class="mono d-amt">3.20</span>
                  </div>
                  <div class="dinv-mini-row">
                    <span class="d-desc">Olive oil 750ml</span>
                    <span class="mono d-qty">1</span>
                    <span class="mono d-amt">9.80</span>
                  </div>
                  <div class="dinv-mini-row">
                    <span class="d-desc">Pasta penne</span>
                    <span class="mono d-qty">1</span>
                    <span class="mono d-amt">1.20</span>
                  </div>
                  <div class="dinv-mini-row">
                    <span class="d-desc">Tomato sauce</span>
                    <span class="mono d-qty">1</span>
                    <span class="mono d-amt">2.10</span>
                  </div>
                </section>

                <div class="dinv-mini-divider dashed" />

                <section class="dinv-mini-totals">
                  <div class="dinv-mini-trow">
                    <span class="dinv-mini-key mono">Subtotal</span>
                    <span class="dinv-mini-val mono">34.86</span>
                  </div>
                  <div class="dinv-mini-trow">
                    <span class="dinv-mini-key mono">Tax · 21%</span>
                    <span class="dinv-mini-val mono">7.32</span>
                  </div>
                  <div class="dinv-mini-trow grand">
                    <span class="dinv-mini-key mono">Total</span>
                    <span class="dinv-mini-val">€ 42.18</span>
                  </div>
                </section>

                <footer class="dinv-mini-foot mono">
                  <span>Generated by scan-me</span>
                  <span>5 items</span>
                </footer>

                <div class="dinv-mini-scan" />
              </article>

              <button type="button" class="save-btn">Save invoice</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ TRUST ============ -->
    <div class="trust">
      <div class="trust-inner">
        <span>BUILT FOR</span>
        <div class="trust-logos">
          <span v-for="logo in trustLogos" :key="logo">{{ logo }}</span>
        </div>
      </div>
    </div>

    <!-- ============ HOW IT WORKS ============ -->
    <section id="how" class="how">
      <div class="section-eyebrow">How it works</div>
      <h2>From shoebox to dashboard, in three steps.</h2>

      <div class="how-grid">
        <div v-for="(step, i) in steps" :key="step.num" class="step">
          <span class="step-num">{{ step.num }}</span>
          <div class="step-icon">
            <svg v-if="i === 0" width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3.5" y="9" width="29" height="22" rx="3" />
              <circle cx="18" cy="20" r="6" />
              <path d="M12 9 L14 5 L22 5 L24 9" />
              <circle cx="26" cy="14" r="0.8" fill="currentColor" />
            </svg>
            <svg v-else-if="i === 1" width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 4 L24 4 L28 8 L28 32 L8 32 Z" />
              <path d="M24 4 L24 8 L28 8" />
              <line x1="12" y1="14" x2="24" y2="14" />
              <line x1="12" y1="19" x2="24" y2="19" />
              <line x1="12" y1="24" x2="20" y2="24" />
            </svg>
            <svg v-else width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="4" y="20" width="6" height="12" rx="1" />
              <rect x="14" y="13" width="6" height="19" rx="1" />
              <rect x="24" y="6" width="6" height="26" rx="1" />
            </svg>
          </div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.body }}</p>
        </div>
      </div>
    </section>

    <!-- ============ FEATURES ============ -->
    <section id="features" class="features">
      <div class="feat-wrap">
        <div class="feat dark">
          <div>
            <span class="feat-eyebrow">OCR engine</span>
            <h3>Reads what cashiers can't write.</h3>
            <p>Trained on thousands of crumpled, low-light, foreign-language and thermal-faded receipts.</p>
          </div>
          <div class="feat-viz">
            <div class="ocr-viz">
              <div class="ocr-thumb">
                <i class="medium" /><i class="short" /><i /><i class="medium" /><i class="short" /><i /><i class="medium" />
              </div>
              <div class="ocr-out">
                <span><span>merchant</span><b>Carrefour</b></span>
                <span><span>total</span><b>€ 42.18</b></span>
                <span><span>tax</span><b>€ 7.32</b></span>
                <span><span>items</span><b>5</b></span>
              </div>
            </div>
          </div>
        </div>

        <div class="feat">
          <div>
            <span class="feat-eyebrow">Collections</span>
            <h3>Nest expenses the way you think.</h3>
            <p>Unlimited depth. Drag to reorganise.</p>
          </div>
          <div class="feat-viz">
            <div class="coll-tree">
              <div class="coll-row"><span class="name">▾ Hogar</span><span class="ct">€ 514</span></div>
              <div class="coll-row indent"><span class="name">· Luz</span><span class="ct">€ 213</span></div>
              <div class="coll-row indent active"><span class="name">· Comida</span><span class="ct">€ 232</span></div>
              <div class="coll-row indent"><span class="name">· Internet</span><span class="ct">€ 69</span></div>
              <div class="coll-row"><span class="name">▾ Herramientas</span><span class="ct">€ 281</span></div>
              <div class="coll-row indent"><span class="name">· Software › Claude</span><span class="ct">€ 198</span></div>
            </div>
          </div>
        </div>

        <div class="feat">
          <div>
            <span class="feat-eyebrow">People</span>
            <h3>Track who spends what.</h3>
            <p>Family, clients, or employees — assign every invoice to a person.</p>
          </div>
          <div class="feat-viz">
            <div class="avatars">
              <span class="avatar">M</span>
              <span class="avatar solid">J</span>
              <span class="avatar">K</span>
              <span class="avatar">A</span>
              <span class="avatar">S</span>
              <span class="avatar avatar-add">+</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PRICING / BETA ============ -->
    <section id="pricing" class="pricing">
      <div class="section-eyebrow">Pricing</div>
      <h2>Free while we&#8209;build.<br />Forever, if you join now.</h2>
      <p class="pricing-sub">scan-me is in its testing phase. Everyone who signs up right now gets unlimited access at no cost — no card, no scan limits, no expiration.</p>

      <article class="beta-card">
        <header class="beta-head">
          <span class="beta-badge">
            <span class="pulse" />
            <span>Beta phase · Unlimited free access</span>
          </span>
          <h3>You help us build it. We won't forget it.</h3>
          <p class="beta-copy">
            If we ever introduce paid plans, you'll hear from us first — well in advance — and your time helping us during the beta will be reflected in whatever offer we make. No surprise charges. No silent migrations. The early users carry the most weight in how this product is shaped.
          </p>
        </header>

        <ul class="beta-features">
          <li v-for="(perk, idx) in betaPerks" :key="idx">
            <span class="feat-mark" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7.5 L6 10.5 L11 4.5" />
              </svg>
            </span>
            <span>{{ perk }}</span>
          </li>
        </ul>

        <NuxtLink to="/signup" class="btn btn-primary beta-cta">
          Claim your free beta seat<span aria-hidden="true">→</span>
        </NuxtLink>

        <p class="beta-fineprint">No card required · Cancel any time · Your data is always exportable</p>
      </article>

      <p class="pricing-foot">
        Have questions about the beta or want to bring your team in early?
        <a href="mailto:hello@scan-me.app">Get in touch</a>.
      </p>
    </section>

    <!-- ============ FINAL CTA ============ -->
    <section class="final">
      <h2>Stop typing<br />your receipts.</h2>
      <p class="sub">Two minutes to sign up. Your first scan is on us. No card. No tutorial. Just go.</p>
      <div class="final-cta-row">
        <NuxtLink to="/signup" class="btn btn-primary">Start free<span>→</span></NuxtLink>
        <a href="#" class="btn btn-ghost">Talk to us</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  font-family: var(--font-text);
}

::selection {
  background: var(--color-ink);
  color: var(--color-snow);
}

/* ============ HERO ============ */
.hero {
  position: relative;
  padding: var(--space-12) var(--space-8) 0;
  text-align: center;
  overflow: hidden;
}
.hero-inner {
  max-width: 980px;
  margin: 0 auto;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-4);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-mist);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-slate);
  letter-spacing: -0.04px;
  opacity: 0;
  transform: translateY(8px);
  animation: rise 0.7s 0.05s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.eyebrow .pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-action);
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
h1.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(54px, 11.5vw, 144px);
  line-height: 0.95;
  letter-spacing: -0.06em;
  margin: var(--space-6) 0 var(--space-5);
  opacity: 0;
  transform: translateY(20px);
  animation: rise 0.9s 0.15s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
h1.hero-title .dot {
  color: var(--color-graphite);
}
.hero-sub {
  font-size: clamp(18px, 2.1vw, 24px);
  color: var(--color-slate);
  max-width: 640px;
  margin: 0 auto;
  line-height: 1.35;
  letter-spacing: -0.015em;
  font-weight: 400;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  animation: rise 0.9s 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.hero-cta-row {
  margin-top: var(--space-10);
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  opacity: 0;
  animation: rise 0.9s 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-mist);
  background: var(--color-snow);
  color: var(--color-ink);
  transition: background var(--transition), border-color var(--transition);
}
.btn:hover {
  background: var(--color-fog);
  text-decoration: none;
}
.btn-primary {
  background: var(--color-action);
  color: var(--color-snow);
  border-color: var(--color-action);
}
.btn-primary:hover {
  background: var(--color-action-hover);
  border-color: var(--color-action-hover);
}
.btn-ghost {
  background: transparent;
  color: var(--color-ink);
  border: 1px solid var(--color-mist);
}
.btn-ghost:hover {
  background: var(--color-fog);
}
.hero-tiny {
  margin-top: var(--space-4);
  font-size: 12.5px;
  color: var(--color-graphite);
  letter-spacing: -0.04px;
  opacity: 0;
  animation: rise 0.9s 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
@keyframes rise {
  to { opacity: 1; transform: translateY(0); }
}

/* ============ PHONE STAGE ============ */
.phone-stage {
  position: relative;
  margin: var(--space-12) auto 0;
  height: clamp(560px, 78vw, 760px);
  perspective: 1600px;
  opacity: 0;
  transform: translateY(40px);
  animation: rise 1.2s 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.phone {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: clamp(280px, 30vw, 360px);
  aspect-ratio: 9 / 19.5;
  border-radius: 46px;
  background: linear-gradient(155deg, #1a1a1a 0%, #0a0a0a 50%, #161616 100%);
  padding: 11px;
  border: 1.5px solid #2a2a2a;
}
.phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 36px;
  background: var(--color-snow);
  position: relative;
  overflow: hidden;
  color: var(--color-ink);
}
.island {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 92px;
  height: 28px;
  border-radius: 16px;
  background: #0a0a0a;
  z-index: 10;
}
.status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  font-size: var(--text-body-sm);
  font-weight: 600;
  letter-spacing: -0.01em;
  z-index: 9;
}
.status .icons {
  display: flex;
  gap: 5px;
  align-items: center;
}
.status :deep(svg) {
  display: block;
}

.app {
  position: absolute;
  inset: 52px 0 0;
  padding: var(--space-4) var(--space-6) var(--space-6);
  display: flex;
  flex-direction: column;
}
.app-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-4);
}
.app-bar .back {
  font-size: var(--text-body-sm);
  color: var(--color-slate);
  font-weight: 500;
}
.app-bar .step-indicator {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.05em;
}

.extracted {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--color-graphite);
  letter-spacing: 0.08em;
  margin: var(--space-1) 0 var(--space-3);
  opacity: 0;
  animation: rise 0.6s 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.extracted .check {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--color-success);
  color: var(--color-snow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 600;
}

/* === Digital invoice (mini, mirrors DigitalInvoice.vue) === */
.dinv-mini {
  position: relative;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  color: var(--color-ink);
  overflow: hidden;
  opacity: 0;
  transform: translateY(8px);
  animation: rise 0.7s 1.3s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.dinv-mini::before,
.dinv-mini::after {
  content: '';
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  height: 0;
  border-top: 1px dashed var(--color-mist);
  pointer-events: none;
}
.dinv-mini::before { top: 0; }
.dinv-mini::after { bottom: 0; }

.dinv-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.dinv-mini-brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dinv-mini-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-ink);
}
.dinv-mini-brand-name {
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: 11px;
}
.dinv-mini-stamp {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
}
.dinv-mini-stamp-label {
  font-family: var(--font-mono);
  font-size: 7.5px;
  color: var(--color-graphite);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.dinv-mini-stamp-id {
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-ink);
  letter-spacing: 0.06em;
}

.dinv-mini-divider {
  height: 0;
  border-top: 1px solid var(--color-mist);
}
.dinv-mini-divider.dashed {
  border-top-style: dashed;
}

.dinv-mini-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.dinv-mini-meta-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dinv-mini-meta-block.r {
  align-items: flex-end;
  text-align: right;
}
.dinv-mini-key {
  font-family: var(--font-mono);
  font-size: 7.5px;
  color: var(--color-graphite);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.dinv-mini-val {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}
.dinv-mini-sub {
  font-size: 8.5px;
  color: var(--color-graphite);
  letter-spacing: 0.02em;
}

.dinv-mini-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dinv-mini-row {
  display: grid;
  grid-template-columns: 1.6fr 0.4fr 0.7fr;
  gap: 6px;
  align-items: baseline;
  font-size: 10px;
  padding: 4px 0;
  border-bottom: 1px dotted var(--color-mist);
}
.dinv-mini-row:last-child { border-bottom: none; }
.dinv-mini-row-head {
  font-size: 7.5px;
  color: var(--color-graphite);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-bottom: 3px;
  border-bottom: 1px solid var(--color-mist);
}
.dinv-mini-row .d-qty,
.dinv-mini-row .d-amt,
.dinv-mini-row-head span:nth-child(2),
.dinv-mini-row-head span:nth-child(3) {
  text-align: right;
}
.dinv-mini-row .d-desc {
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dinv-mini-totals {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dinv-mini-trow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10px;
}
.dinv-mini-trow .dinv-mini-key {
  text-transform: none;
  letter-spacing: 0.04em;
  font-size: 8.5px;
}
.dinv-mini-trow.grand {
  margin-top: var(--space-1);
  padding-top: 6px;
  border-top: 1px solid var(--color-mist);
}
.dinv-mini-trow.grand .dinv-mini-key {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink);
}
.dinv-mini-trow.grand .dinv-mini-val {
  font-family: var(--font-display);
  font-size: var(--text-body);
  font-weight: 600;
  letter-spacing: -0.025em;
}

.dinv-mini-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 7.5px;
  color: var(--color-graphite);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-top: 2px;
}

.dinv-mini-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 22px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 113, 227, 0.18) 50%, transparent 100%);
  animation: scan 2.4s 1.4s cubic-bezier(0.5, 0.05, 0.5, 0.95) 1 forwards;
  pointer-events: none;
  top: -22px;
  z-index: 1;
}
@keyframes scan {
  0%   { top: -22px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.save-btn {
  margin-top: var(--space-4);
  background: var(--color-action);
  color: var(--color-snow);
  border: none;
  padding: var(--space-3);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.04px;
  border-radius: var(--radius-md);
  opacity: 0;
  animation: rise 0.5s 2.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

.phone-glow {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 80px;
  background: radial-gradient(ellipse at center, rgba(10, 10, 10, 0.18) 0%, transparent 60%);
  filter: blur(20px);
  pointer-events: none;
  z-index: -1;
}

/* ============ TRUST ============ */
.trust {
  margin-top: var(--space-12);
  padding: var(--space-8);
  border-top: 1px solid var(--color-mist);
  border-bottom: 1px solid var(--color-mist);
}
.trust-inner {
  max-width: var(--layout-max);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--color-graphite);
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
}
.trust-logos {
  display: flex;
  gap: var(--space-10);
  align-items: center;
  flex-wrap: wrap;
  color: var(--color-slate);
}
.trust-logos span {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  opacity: 0.7;
}

/* ============ HOW IT WORKS ============ */
section.how {
  padding: var(--space-12) var(--space-8);
  text-align: center;
}
.section-eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: var(--space-6);
}
h2 {
  font-weight: 700;
  font-size: clamp(36px, 6vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  max-width: 14ch;
  margin: 0 auto;
  text-wrap: balance;
}
.how-grid {
  margin-top: var(--space-12);
  max-width: var(--layout-max);
  margin-left: auto;
  margin-right: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--color-mist);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
@media (max-width: 768px) {
  .how-grid { grid-template-columns: 1fr; }
}
.step {
  background: var(--color-snow);
  padding: var(--space-10);
  text-align: left;
  position: relative;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}
.step-num {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-graphite);
  letter-spacing: 0.1em;
}
.step-icon {
  margin-top: var(--space-5);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-ink);
}
.step h3 {
  margin: var(--space-6) 0 var(--space-2);
  font-size: var(--text-heading-sm);
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.3;
}
.step p {
  margin: 0;
  color: var(--color-slate);
  font-size: 15px;
  line-height: 1.55;
  letter-spacing: -0.04px;
  text-wrap: pretty;
}

/* ============ FEATURES ============ */
section.features {
  padding: 0 var(--space-8) var(--space-12);
}
.feat-wrap {
  max-width: var(--layout-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: var(--space-4);
}
@media (max-width: 768px) {
  .feat-wrap { grid-template-columns: 1fr; }
}
.feat {
  background: var(--color-fog);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.feat.dark {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-snow);
}
.feat-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
}
.feat h3 {
  margin: var(--space-3) 0 var(--space-2);
  font-size: var(--text-heading-sm);
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.3;
}
.feat p {
  color: var(--color-slate);
  font-size: var(--text-body-sm);
  margin: 0;
  letter-spacing: -0.04px;
}
.feat.dark p {
  color: rgba(255, 255, 255, 0.7);
}
.feat-viz {
  margin-top: auto;
  padding-top: var(--space-6);
  display: flex;
  align-items: flex-end;
  min-height: 120px;
}

.coll-tree {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-slate);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.coll-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.coll-row .name { letter-spacing: -0.04px; }
.coll-row .ct { color: var(--color-graphite); }
.coll-row.indent {
  padding-left: var(--space-4);
  color: var(--color-graphite);
}
.coll-row.active {
  color: var(--color-ink);
  font-weight: 600;
}

.avatars {
  display: flex;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-body-sm);
  color: var(--color-ink);
  background: var(--color-snow);
  border: 2px solid var(--color-fog);
  margin-left: -8px;
  letter-spacing: -0.02em;
}
.avatar:first-child { margin-left: 0; }
.avatar.solid {
  background: var(--color-action);
  color: var(--color-snow);
}
.avatar-add {
  background: transparent;
  border: 1.5px dashed var(--color-graphite);
  color: var(--color-graphite);
}

.ocr-viz {
  width: 100%;
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: var(--space-4);
  align-items: center;
}
.ocr-thumb {
  width: 60px;
  height: 80px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-2);
}
.ocr-thumb i {
  display: block;
  height: 3px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 1.5px;
}
.ocr-thumb i.short { width: 60%; }
.ocr-thumb i.medium { width: 80%; }
.ocr-out {
  font-family: var(--font-mono);
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ocr-out span {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.78);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 4px;
}
.ocr-out span b {
  color: var(--color-snow);
  font-weight: 600;
}

/* ============ FINAL CTA ============ */
section.final {
  padding: var(--space-12) var(--space-8);
  text-align: center;
  border-top: 1px solid var(--color-mist);
}
.final p.sub {
  margin: var(--space-6) auto var(--space-8);
  max-width: 36ch;
  color: var(--color-slate);
  font-size: 17px;
  line-height: 1.5;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.final-cta-row {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

/* ============ PRICING ============ */
section.pricing {
  padding: var(--space-12) var(--space-8);
  text-align: center;
  border-top: 1px solid var(--color-mist);
}
.pricing-sub {
  margin: var(--space-6) auto 0;
  max-width: 52ch;
  color: var(--color-slate);
  font-size: 17px;
  line-height: 1.5;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.beta-card {
  position: relative;
  margin: var(--space-12) auto 0;
  max-width: 640px;
  background: var(--color-snow);
  border: 1px solid var(--color-mist);
  border-radius: var(--radius-lg);
  padding: var(--space-10);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
.beta-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.beta-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-mist);
  color: var(--color-slate);
  background: var(--color-fog);
}
.beta-badge .pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-action);
  animation: betapulse 1.8s ease-out infinite;
}
@keyframes betapulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.beta-head h3 {
  margin: 0;
  font-size: var(--text-heading);
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
  color: var(--color-ink);
}
.beta-copy {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  letter-spacing: -0.04px;
  color: var(--color-slate);
  text-wrap: pretty;
}

.beta-features {
  list-style: none;
  margin: 0;
  padding: var(--space-6) 0 var(--space-1);
  border-top: 1px solid var(--color-mist);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.beta-features li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: 14.5px;
  line-height: 1.45;
  letter-spacing: -0.04px;
  color: var(--color-slate);
}
.feat-mark {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-mist);
  color: var(--color-success);
  margin-top: 1px;
}

.beta-cta {
  justify-content: center;
  width: 100%;
  padding: var(--space-4) var(--space-6);
  font-size: 15px;
}
.beta-fineprint {
  margin: calc(-1 * var(--space-2)) 0 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-graphite);
}

.pricing-foot {
  margin: var(--space-10) auto 0;
  max-width: 60ch;
  font-size: 13px;
  color: var(--color-graphite);
  letter-spacing: -0.04px;
}
.pricing-foot a {
  color: var(--color-link);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
