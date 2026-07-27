import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// Matches the app's brand red (--color-primary in main.css) rather than Aura's
// default emerald, so PrimeVue components (Button, Tag, etc.) stay on-brand.
const WhatHomePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf6f5',
      100: '#f6d4d1',
      200: '#f0b2ac',
      300: '#e99088',
      400: '#e26e63',
      500: '#db4c3f',
      600: '#ba4136',
      700: '#99352c',
      800: '#782a23',
      900: '#581e19',
      950: '#371310'
    }
  }
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@primevue/nuxt-module'],
  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  nitro: {
    experimental: {
      wasm: false
    }
  },
  app: {
    head: {
      title: 'WhatHome',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  runtimeConfig: {
    public: {
      // @primevue/nuxt-module reads the license key from this specific runtimeConfig
      // key (not from primevue.options.license, which it silently ignores). Free
      // Community key from https://primeui.dev/pricing — set PRIMEVUE_LICENSE_KEY in
      // your environment; without it, PrimeVue shows an in-app license notice.
      PRIMEUI_LICENSE: process.env.PRIMEVUE_LICENSE_KEY ?? ''
    }
  },
  primevue: {
    // Disabled: PrimeVue ships components with names that collide with this app's
    // own (e.g. ConfirmDialog), and auto-import silently shadows the local one.
    // Every PrimeVue component used in this app is imported explicitly instead.
    autoImport: false,
    options: {
      theme: {
        preset: WhatHomePreset,
        options: {
          // Matches the existing prefers-color-scheme based dark mode in main.css.
          darkModeSelector: 'system',
          cssLayer: {
            name: 'primevue',
            order: 'primevue'
          }
        }
      }
    }
  }
})
