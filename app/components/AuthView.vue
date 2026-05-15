<script setup lang="ts">
type Mode = 'signin' | 'signup'
type AccountType = 'personal' | 'business'

const props = withDefaults(defineProps<{ defaultMode?: Mode }>(), {
  defaultMode: 'signin'
})

const router = useRouter()
const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()

watchEffect(() => {
  if (currentUser.value) {
    router.replace('/app/dashboard')
  }
})

const mode = ref<Mode>(props.defaultMode)
const accountType = ref<AccountType>('personal')
const submitting = ref(false)
const errorMsg = ref<string | null>(null)
const pendingConfirmationEmail = ref<string | null>(null)

const name = ref('')
const email = ref('')
const password = ref('')

watch(mode, () => {
  errorMsg.value = null
})

const copy = computed(() =>
  mode.value === 'signin'
    ? {
        eyebrow: 'SIGN IN',
        title: 'Welcome back',
        lead: 'Sign in to continue. Personal or business — same account, both worlds.',
        submit: 'Sign in',
        submittingLabel: 'Signing in…'
      }
    : {
        eyebrow: 'CREATE ACCOUNT',
        title: 'Hi, nice to meet you',
        lead: 'Free, two minutes. No card. Your first scan is on us.',
        submit: 'Create account',
        submittingLabel: 'Creating account…'
      }
)

async function handleSubmit() {
  if (submitting.value) return
  errorMsg.value = null

  if (!email.value || !password.value) {
    errorMsg.value = 'Email and password are required.'
    return
  }
  if (mode.value === 'signup' && password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters.'
    return
  }

  submitting.value = true
  try {
    if (mode.value === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (error) throw error
      await router.push('/app/dashboard')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
          data: {
            full_name: name.value || null,
            account_type: accountType.value
          }
        }
      })
      if (error) throw error

      if (data.session) {
        await router.push('/app/dashboard')
      } else {
        pendingConfirmationEmail.value = email.value
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    errorMsg.value = message
  } finally {
    submitting.value = false
  }
}

function resetConfirmationView() {
  pendingConfirmationEmail.value = null
  mode.value = 'signin'
  password.value = ''
}
</script>

<template>
  <div class="auth-root">
    <header class="auth-top">
      <NuxtLink to="/" class="logo">
        <span class="logo-dot" aria-hidden="true" />
        <span>scan-me</span>
      </NuxtLink>
      <NuxtLink to="/" class="back">← Back to home</NuxtLink>
    </header>

    <main class="auth-main">
      <div class="decor" aria-hidden="true">
        <div class="decor-receipts">
          <div class="decor-receipt">
            <h4>CARREFOUR</h4>
            <div class="lines">
              <i class="w80" /><i class="w90" /><i class="w60" /><i class="w70" />
            </div>
            <div class="total"><span>TOTAL</span><span>€ 42.18</span></div>
          </div>
          <div class="decor-receipt">
            <h4>ENDESA</h4>
            <div class="lines">
              <i class="w90" /><i class="w70" /><i class="w80" /><i class="w60" />
            </div>
            <div class="total"><span>TOTAL</span><span>€ 87.50</span></div>
          </div>
          <div class="decor-receipt">
            <h4>CLAUDE</h4>
            <div class="lines">
              <i class="w70" /><i class="w80" /><i class="w60" />
            </div>
            <div class="total"><span>TOTAL</span><span>€ 20.00</span></div>
          </div>
        </div>
      </div>

      <div v-if="pendingConfirmationEmail" class="auth-card" data-mode="confirm">
        <span class="eyebrow">CHECK YOUR EMAIL</span>
        <h1 class="title">Almost there<span class="title-dot">.</span></h1>
        <p class="lead">
          We sent a confirmation link to <strong>{{ pendingConfirmationEmail }}</strong>.
          Click it to activate your account.
        </p>
        <button class="submit" type="button" @click="resetConfirmationView">
          Back to sign in
        </button>
        <p class="terms">
          Didn't get it? Check your spam folder or try signing up again with a different email.
        </p>
      </div>

      <div v-else class="auth-card" :data-mode="mode">
        <span class="eyebrow">{{ copy.eyebrow }}</span>

        <h1 class="title">{{ copy.title }}<span class="title-dot">.</span></h1>

        <p class="lead">{{ copy.lead }}</p>

        <div class="auth-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            :class="{ active: mode === 'signin' }"
            :aria-selected="mode === 'signin'"
            @click="mode = 'signin'"
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            :class="{ active: mode === 'signup' }"
            :aria-selected="mode === 'signup'"
            @click="mode = 'signup'"
          >
            Sign up
          </button>
        </div>

        <div class="social-row">
          <button class="social" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
              <path d="M5.84 14.1A6.61 6.61 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <button class="social" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M17.05 12.54c-.02-2.05 1.67-3.04 1.75-3.09-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.65.8-3.36 2.03-1.43 2.48-.37 6.16 1.03 8.18.69.99 1.5 2.1 2.56 2.06 1.03-.04 1.41-.66 2.66-.66 1.24 0 1.59.66 2.67.64 1.1-.02 1.8-1.01 2.48-2 .78-1.15 1.1-2.27 1.12-2.33-.02-.01-2.16-.83-2.18-3.27ZM15.05 6.5c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.97 1.55-.85 2.47.9.07 1.82-.46 2.38-1.12Z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        <div class="divider">OR</div>

        <form class="auth-form" autocomplete="off" @submit.prevent="handleSubmit">
          <div v-if="mode === 'signup'" class="field-group">
            <label class="field-label" for="auth-name">Full name</label>
            <input
              id="auth-name"
              v-model="name"
              class="field-input"
              type="text"
              placeholder="Jane Doe"
              autocomplete="name"
            />
          </div>

          <div class="field-group">
            <label class="field-label" for="auth-email">Email</label>
            <input
              id="auth-email"
              v-model="email"
              class="field-input"
              type="email"
              placeholder="you@work.com"
              autocomplete="email"
            />
          </div>

          <div class="field-group">
            <label class="field-label" for="auth-password">Password</label>
            <input
              id="auth-password"
              v-model="password"
              class="field-input"
              type="password"
              placeholder="••••••••"
              :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            />
            <a v-if="mode === 'signin'" class="forgot" href="#">Forgot password?</a>
          </div>

          <div v-if="mode === 'signup'" class="field-group">
            <label class="field-label">Account type</label>
            <div class="seg">
              <button
                type="button"
                :class="{ active: accountType === 'personal' }"
                @click="accountType = 'personal'"
              >
                Personal
              </button>
              <button
                type="button"
                :class="{ active: accountType === 'business' }"
                @click="accountType = 'business'"
              >
                Business
              </button>
            </div>
            <p class="seg-hint">You can add the other later.</p>
          </div>

          <p v-if="errorMsg" class="auth-error" role="alert">{{ errorMsg }}</p>

          <button class="submit" type="submit" :disabled="submitting">
            {{ submitting ? copy.submittingLabel : copy.submit }}
          </button>

          <p v-if="mode === 'signup'" class="terms">
            By creating an account you agree to our <a href="#">terms</a> and <a href="#">privacy policy</a>.
          </p>
        </form>
      </div>
    </main>

    <footer class="auth-foot">
      <span class="mono">© 2026 SCAN-ME</span>
      <div class="foot-links">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Support</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.auth-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ============ HEADER ============ */
.auth-top {
  padding: 22px var(--pad);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.auth-top .logo {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-size: 16px;
  color: var(--ink);
}
.auth-top .logo-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ink);
  display: inline-block;
  position: relative;
}
.auth-top .logo-dot::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 1.5px solid var(--bg);
}
.auth-top .back {
  color: var(--ink-3);
  font-size: 13.5px;
  letter-spacing: -0.005em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s;
}
.auth-top .back:hover {
  color: var(--ink);
}

/* ============ MAIN ============ */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 48px);
  position: relative;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: clamp(28px, 4vw, 40px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
}

.eyebrow {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.title {
  font-size: clamp(32px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
  margin: 0;
  text-wrap: balance;
}
.title-dot {
  color: var(--ink-3);
}

.lead {
  margin: 0;
  font-size: 15px;
  color: var(--ink-2);
  line-height: 1.45;
  letter-spacing: -0.005em;
  max-width: 32ch;
}

/* ============ TAB TOGGLE ============ */
.auth-toggle {
  display: inline-flex;
  background: var(--surface);
  padding: 4px;
  border-radius: 999px;
  align-self: flex-start;
  gap: 2px;
}
.auth-toggle button {
  background: transparent;
  border: none;
  padding: 8px 18px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.auth-toggle button.active {
  background: var(--bg);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 0 0 1px var(--line-2);
}

/* ============ SOCIAL ============ */
.social-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.social:hover {
  background: var(--surface);
  border-color: var(--ink-4);
}
.social svg {
  width: 18px;
  height: 18px;
}

/* ============ DIVIDER ============ */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-3);
  font-size: 11px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  letter-spacing: 0.1em;
  margin: 4px 0;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

/* ============ FORM ============ */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.field-input {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  letter-spacing: -0.005em;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-input::placeholder {
  color: var(--ink-4);
}
.field-input:focus {
  outline: none;
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.08);
}

.seg {
  display: inline-flex;
  width: 100%;
  background: var(--surface);
  padding: 4px;
  border-radius: 10px;
  gap: 2px;
}
.seg button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 9px 12px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--ink-2);
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.seg button.active {
  background: var(--bg);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 0 0 1px var(--line-2);
}
.seg-hint {
  margin: 0;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
}

.forgot {
  align-self: flex-end;
  font-size: 12.5px;
  color: var(--ink-2);
  transition: color 0.15s;
}
.forgot:hover {
  color: var(--ink);
}

.auth-error {
  margin: 0;
  padding: 10px 12px;
  background: var(--accent-error, #E8B4B4);
  color: var(--ink);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  letter-spacing: -0.005em;
}

.submit {
  margin-top: 8px;
  padding: 14px;
  background: var(--ink);
  color: var(--accent-ink);
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: transform 0.18s, opacity 0.18s;
}
.submit:hover:not(:disabled) {
  transform: scale(0.985);
}
.submit:active:not(:disabled) {
  transform: scale(0.97);
}
.submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.terms {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-3);
  line-height: 1.45;
  letter-spacing: -0.005em;
}
.terms a {
  color: var(--ink-2);
  text-decoration: underline;
  text-decoration-color: var(--line);
  text-underline-offset: 2px;
}
.terms a:hover {
  color: var(--ink);
}

/* ============ DECOR ============ */
.decor {
  position: absolute;
  right: max(48px, 6vw);
  top: 50%;
  transform: translateY(-50%);
  width: 360px;
  pointer-events: none;
  opacity: 0;
  animation: auth-rise 1s 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
@media (max-width: 1100px) {
  .decor {
    display: none;
  }
}
.decor-receipts {
  position: relative;
  height: 480px;
  pointer-events: auto;
}
.decor-receipt {
  position: absolute;
  width: 240px;
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.18), 0 8px 16px -8px rgba(0, 0, 0, 0.12);
  padding: 20px;
  transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.decor-receipt:nth-child(1) {
  left: 20px;
  top: 0;
  transform: rotate(-5deg);
}
.decor-receipt:nth-child(2) {
  left: 50px;
  top: 160px;
  transform: rotate(3deg);
}
.decor-receipt:nth-child(3) {
  left: 20px;
  top: 320px;
  transform: rotate(-2deg);
}
.decor-receipts:hover .decor-receipt:nth-child(1) {
  transform: rotate(-7deg) translateY(-6px);
}
.decor-receipts:hover .decor-receipt:nth-child(2) {
  transform: rotate(5deg) translateY(-6px);
}
.decor-receipts:hover .decor-receipt:nth-child(3) {
  transform: rotate(-4deg) translateY(-6px);
}
.decor-receipt h4 {
  margin: 0;
  font-size: 14px;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  letter-spacing: 0.04em;
  color: var(--ink);
  text-align: center;
  border-bottom: 1px dashed var(--line);
  padding-bottom: 8px;
}
.decor-receipt .lines {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.decor-receipt .lines i {
  display: block;
  height: 4px;
  background: var(--ink-4);
  opacity: 0.5;
  border-radius: 2px;
}
.decor-receipt .lines i.w90 { width: 90%; }
.decor-receipt .lines i.w80 { width: 80%; }
.decor-receipt .lines i.w70 { width: 70%; }
.decor-receipt .lines i.w60 { width: 60%; }
.decor-receipt .total {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  font-size: 14px;
  font-weight: 600;
}

/* ============ FOOTER ============ */
.auth-foot {
  padding: 24px var(--pad);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
  color: var(--ink-3);
  letter-spacing: -0.005em;
}
.auth-foot .foot-links a {
  color: var(--ink-3);
  margin-left: 20px;
  transition: color 0.15s;
}
.auth-foot .foot-links a:hover {
  color: var(--ink);
}

/* ============ ENTRANCE ============ */
.auth-card > * {
  opacity: 0;
  transform: translateY(12px);
  animation: auth-rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.auth-card > *:nth-child(1) { animation-delay: 0.05s; }
.auth-card > *:nth-child(2) { animation-delay: 0.12s; }
.auth-card > *:nth-child(3) { animation-delay: 0.18s; }
.auth-card > *:nth-child(4) { animation-delay: 0.24s; }
.auth-card > *:nth-child(5) { animation-delay: 0.30s; }
.auth-card > *:nth-child(6) { animation-delay: 0.36s; }
.auth-card > *:nth-child(7) { animation-delay: 0.42s; }

@keyframes auth-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-card > *,
  .decor {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .decor {
    transform: translateY(-50%) !important;
  }
}
</style>
