// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }        
      ]
    },    
  },
  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY,    
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirectOptions: {
      login: '/signin',
      callback: '/confirm',
      include: ['/app/**'],
      exclude: [],
      cookieRedirect: false
    }
  }
})
