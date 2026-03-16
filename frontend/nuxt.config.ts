import fs from 'fs'

export default defineNuxtConfig({
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'nuxt-oidc-auth',
  ],

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  compatibilityDate: '2026-03-16',
})