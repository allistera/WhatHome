import Aura from '@primeuix/themes/aura'

// `license` is a valid runtime option (read by @primeui/license-manager) but is
// omitted from @primevue/nuxt-module's public PrimeVueOptions type, so it's built
// as a separate, loosely-typed variable to avoid TypeScript's excess-property check.
const primevueOptions: Record<string, unknown> = {
  // Free Community key from https://primeui.dev/pricing — required at runtime or
  // PrimeVue shows a license notice. Set PRIMEVUE_LICENSE_KEY in your environment.
  license: process.env.PRIMEVUE_LICENSE_KEY,
  theme: {
    preset: Aura,
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
  primevue: {
    // Disabled: PrimeVue ships components with names that collide with this app's
    // own (e.g. ConfirmDialog), and auto-import silently shadows the local one.
    // Every PrimeVue component used in this app is imported explicitly instead.
    autoImport: false,
    options: primevueOptions
  }
})
