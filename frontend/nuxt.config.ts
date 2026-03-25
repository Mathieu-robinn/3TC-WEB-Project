export default defineNuxtConfig({
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    public: {
      /** Base URL de l’API (surchargée par NUXT_PUBLIC_API_BASE en .env) */
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
    },
  },

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  /** Minification CSS : esbuild se trompe sur les @layer de Vuetify 4. */
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },

  compatibilityDate: '2026-03-16',
})