// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  // Configuración de runtime (accesible en cliente y servidor)
  runtimeConfig: {
    public: {
      apiBase: '/api',
      wsUrl: '/',
    },
  },

  // Proxy para desarrollo (Nitro server)
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:5080/api',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5080/socket.io',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  // SSR habilitado por defecto en Nuxt 4
  ssr: true,

  // Configuración de Tailwind
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
  },
})
