<script setup lang="ts">
import invoiceArt from '~/assets/images/invoice_art.webp'

definePageMeta({ layout: 'landing' })
</script>

<template>
  <div class="layout">
    <aside class="pitch">
      <p>Scan your invoices with our OCR and manage your payments — we'll take care of the data.</p>
    </aside>

    <section class="hero">
      <h1>Scan Me</h1>
      <p class="subtitle">The receipt becomes the spreadsheet</p>
      <img :src="invoiceArt" alt="Illustration of an invoice" class="hero-art" />
    </section>

    <aside class="pitch pitch-right">
      <p>Stop guessing who's spending on your behalf — track every teammate with their own unique link.</p>
    </aside>
  </div>

  <section id="how-it-works" class="how">
    <header class="how-head">
      <h2>How it works</h2>
    </header>

    <div class="how-grid">
      <article class="how-card">
        <p>
          ScanMe captures your paper invoices and turns them into digital ones you can
          send, save, and use to generate reports, track expenses, and forecast
          spending. Our OCR (optical character recognition) reads everything on each
          invoice and pulls out as much data as it can. It keeps learning from your
          activity to get more accurate over time — and when a field isn't recognized,
          it flags it so you can fill it in with a single tap.
        </p>
      </article>

      <article class="how-card">
        <p>
          Thanks to our trained OCR, recording expenses is effortless. We automatically
          categorize every entry so you see clear, real numbers — easy to read, quick
          to update, with no long forms to fill out.
        </p>
      </article>

      <article class="how-card">
        <p>
          Your data stays private. Other users can't see your sensitive spending —
          only you and the people you authorize ever see your transactions.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 640px) 240px;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin: 24px auto 96px;
  padding: 0 32px;
}

.pitch {
  max-width: 240px;
  color: var(--fg-muted);
  font-size: var(--font-body);
  font-weight: 700;
  line-height: 1.5;
}

.pitch-right {
  text-align: right;
  justify-self: end;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.subtitle {
  color: var(--fg-muted);
  max-width: 480px;
  margin-bottom: 50px;
}

.hero-art {
  width: 100%;
  max-width: 470px;
  height: auto;
  display: block;
  margin-top: -84px;
}

.how {
  max-width: 1160px;
  margin: 0 auto;
  padding: 48px 32px 96px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.how-head h2 {
  text-align: center;
}

.how-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: stretch;
}

.how-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  line-height: 1.5;
}

.how-card-empty {
  min-height: 160px;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
    padding: 0 16px;
  }
  .pitch {
    max-width: 480px;
    margin: 0 auto;
    text-align: center;
  }
  .pitch-right {
    text-align: center;
    justify-self: center;
  }
  .how {
    padding: 32px 16px 64px;
  }
  .how-grid {
    grid-template-columns: 1fr;
  }
}
</style>
