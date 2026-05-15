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
  background: var(--bg);
  color: var(--ink);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  padding: 24px;
}
.confirm-card {
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}
.eyebrow {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.title {
  margin: 0;
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
}
.title-dot { color: var(--ink-3); }
.lead {
  margin: 0;
  color: var(--ink-2);
  font-size: 15px;
}
</style>
