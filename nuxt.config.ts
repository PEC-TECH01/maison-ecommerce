
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-30',

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  modules: ['@pinia/nuxt'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseKey: '',
    },
  },

  typescript: {
    strict: true,
  },
})
