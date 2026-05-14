<script setup lang="ts">
import invoiceArt from '~/assets/images/invoice_art.webp'

definePageMeta({ layout: 'landing' })
</script>

<template>
  <div class="layout">
    <aside class="pitch">
      <p>Scan your invoices with our OCR, handle your payments, we'll take care of the data.</p>
    </aside>

    <section class="hero">
      <h1>Scan Me</h1>
      <p class="subtitle">The receipt becomes the spreadsheet</p>
      <img :src="invoiceArt" alt="Illustration of an invoice" class="hero-art" />
    </section>

    <aside class="pitch pitch-right">
      <p>Don't guess who's spending for you, manage this with our unique links for each user you create.</p>
    </aside>
  </div>

  <section id="how-it-works" class="how">
    <header class="how-head">
      <h2>How it works</h2>
    </header>

    <div class="how-grid">
      <article class="how-card">
        <p>
          The application registers physical invoices and transforms them into virtual
          invoices that you can manage by sending or saving them to generate reports,
          track expenses, traceability, and projections. An OCR (optical character
          recognition) tool reads all the information on your invoices, extracting as
          much information as possible. This OCR is constantly being trained to extract
          data more accurately as it learns from your data. If it doesn't recognize
          certain fields, it will provide them so you can easily fill them in.
        </p>
      </article>

      <article class="how-card">
        <p>
          With our OCR training, you can simply record your expenses. We will segment
          all your expenses so you can see real data. Our way of viewing the data will
          be easy to read, easy to record, without complications or long forms to fill
          out.
        </p>
      </article>

      <article class="how-card">
        <p>
          Your data is always secure, preventing other users from seeing sensitive
          spending information; only you and those you authorize know about your
          transactions.
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
