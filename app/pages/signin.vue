<script setup lang="ts">
const router = useRouter()
const email = ref('')
const password = ref('')

function signIn() {
  router.push('/app/dashboard')
}
</script>

<template>
  <section class="auth">
    <div class="card auth-card">
      <header class="head">
        <h2>Welcome back</h2>
        <p class="muted">Sign in to manage your invoices.</p>
      </header>
      <form class="form" @submit.prevent="signIn">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" class="input" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" autocomplete="current-password" class="input" required />
        </div>
        <button type="submit" class="btn btn-primary">Sign in</button>
      </form>
      <p class="footer muted">
        Don't have an account? <NuxtLink to="/signup" class="link">Sign up</NuxtLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer {
  text-align: center;
}

.link {
  color: var(--fg-primary);
  text-decoration: underline;
}
</style>
