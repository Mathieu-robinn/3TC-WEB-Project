const config = defineNuxtConfig({
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
  ],

  /** `~/components` (partagé) + composants métier par feature. */
  components: [
    '~/components',
    { path: '~/features/auth/components', pathPrefix: false },
    { path: '~/features/participants/components', pathPrefix: false },
    { path: '~/features/equipes/components', pathPrefix: false },
    { path: '~/features/transpondeurs/components', pathPrefix: false },
    { path: '~/features/communication/components', pathPrefix: false },
    { path: '~/features/parametres/components', pathPrefix: false },
    { path: '~/features/dashboard/components', pathPrefix: false },
    { path: '~/features/comptes/components', pathPrefix: false },
    { path: '~/features/logs/components', pathPrefix: false },
    { path: '~/features/notifications/components', pathPrefix: false },
  ],

  pinia: {
    storesDirs: [
      'features/auth/stores',
      'features/theme/stores',
      'features/participants/stores',
      'features/equipes/stores',
      'features/transpondeurs/stores',
      'features/editions/stores',
      'features/notifications/stores',
    ],
  },

  runtimeConfig: {
    public: {
      /** Base URL de l’API (surchargée par NUXT_PUBLIC_API_BASE en .env) */
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
    },
  },

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/css/admin-pages.css',
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

export default config
