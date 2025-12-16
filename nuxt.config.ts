// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

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
})
