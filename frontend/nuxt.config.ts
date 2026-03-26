// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data?: Record<string, unknown>) => {
  try {
    const payload = JSON.stringify({
      sessionId: 'af213e',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    })
    const f = (globalThis as any).fetch as undefined | ((...args: any[]) => Promise<any>)
    if (f) {
      f('http://127.0.0.1:7539/ingest/1b4e92d2-fdac-4670-8b79-2c9180122afa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'af213e' },
        body: payload,
      }).catch(() => {})
      return
    }

    // Fallback for Node versions without global fetch (keep non-blocking).
    import('node:http')
      .then(({ request }) => {
        const req = request(
          'http://127.0.0.1:7539/ingest/1b4e92d2-fdac-4670-8b79-2c9180122afa',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Session-Id': 'af213e',
              'Content-Length': Buffer.byteLength(payload),
            },
          },
          (res) => res.resume(),
        )
        req.on('error', () => {})
        req.end(payload)
      })
      .catch(() => {})
  } catch {}
}
__agentLog('A', 'frontend/nuxt.config.ts:bootstrap', 'nuxt.config.ts evaluated', {
  platform: process.platform,
  node: process.version,
  pm: process.env.npm_config_user_agent,
  lifecycle: process.env.npm_lifecycle_event,
})
// #endregion agent log

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
  ],

  pinia: {
    storesDirs: [
      'features/auth/stores',
      'features/theme/stores',
      'features/participants/stores',
      'features/equipes/stores',
      'features/transpondeurs/stores',
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
  ],

  build: {
    transpile: ['vuetify'],
  },

  /** Minification CSS : esbuild se trompe sur les @layer de Vuetify 4. */
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
    plugins: [
      {
        name: 'agent-log-rollup-entry-names',
        apply: 'build',
        generateBundle(_outputOptions, bundle) {
          try {
            const entries: Array<Record<string, unknown>> = []
            for (const [fileName, item] of Object.entries(bundle)) {
              if (item && (item as any).type === 'chunk' && (item as any).isEntry) {
                const chunk = item as any
                entries.push({
                  fileName,
                  name: chunk.name,
                  facadeModuleId: chunk.facadeModuleId,
                })
              }
            }
            __agentLog('B', 'frontend/nuxt.config.ts:vite.generateBundle', 'rollup entry chunks', {
              entryCount: entries.length,
              entries,
            })
          } catch {}
        },
      },
    ],
  },

  hooks: {
    'vite:extendConfig'(viteConfig, env) {
      __agentLog('B', 'frontend/nuxt.config.ts:hook.vite:extendConfig', 'vite config snapshot', {
        isClient: env?.isClient,
        isServer: env?.isServer,
        mode: viteConfig?.mode,
        buildTarget: (viteConfig as any)?.build?.target,
        rollupOutputEntryFileNames: (viteConfig as any)?.build?.rollupOptions?.output?.entryFileNames,
        rollupOutputChunkFileNames: (viteConfig as any)?.build?.rollupOptions?.output?.chunkFileNames,
      })
    },
  },

  compatibilityDate: '2026-03-16',
})
// #region agent log
__agentLog('A', 'frontend/nuxt.config.ts:export', 'nuxt config created', {
  viteBuildCssMinify: (config as any)?.vite?.build?.cssMinify,
  rollupOptions: (config as any)?.vite?.build?.rollupOptions ? 'present' : 'absent',
  entryFileNames: (config as any)?.vite?.build?.rollupOptions?.output
    ? (config as any)?.vite?.build?.rollupOptions?.output?.entryFileNames
    : undefined,
})
// #endregion agent log

export default config
