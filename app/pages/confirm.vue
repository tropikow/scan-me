<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'scan-me — confirming…'
})

const router = useRouter()
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) {
    router.replace('/app/dashboard')
  }
})

onMounted(() => {
  setTimeout(() => {
    if (!user.value) {
      router.replace('/signin')
    }
  }, 5000)
})
</script>

<template>
  <div class="confirm-root">
    <div class="confirm-card">
      <span class="eyebrow">CONFIRMING</span>
      <h1 class="title">One sec<span class="title-dot">.</span></h1>
      <p class="lead">Finalizing your session…</p>
    </div>
  </div>
</template>

<style scoped>
.confirm-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-snow);
  color: var(--color-ink);
  font-family: var(--font-text);
  padding: var(--space-6);
}
.confirm-card {
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-graphite);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.title {
  margin: 0;
  font-size: var(--text-heading-lg);
  font-weight: 700;
  letter-spacing: -0.7px;
  line-height: 1.15;
}
.title-dot { color: var(--color-graphite); }
.lead {
  margin: 0;
  color: var(--color-slate);
  font-size: 15px;
}
</style>
