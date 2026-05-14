<script setup lang="ts">
const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')

function signUp() {
  router.push('/app/dashboard')
}
</script>

<template>
  <section class="auth">
    <div class="card auth-card">
      <header class="head">
        <h2>Create your account</h2>
        <p class="muted">Start sending invoices in minutes.</p>
      </header>
      <form class="form" @submit.prevent="signUp">
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" v-model="name" type="text" autocomplete="name" class="input" required />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" autocomplete="email" class="input" required />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" autocomplete="new-password" class="input" required />
        </div>
        <button type="submit" class="btn btn-primary">Create account</button>
      </form>
      <p class="footer muted">
        Already have an account? <NuxtLink to="/signin" class="link">Sign in</NuxtLink>
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
