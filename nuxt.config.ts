export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
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
      wsUrl:
        process.env.API_WS_URL || 'http://localhost:5080',
    },
  },

  // Proxy para desarrollo (Nitro server)
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.API_WS_URL || 'http://localhost:5080',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.API_WS_URL || 'http://localhost:5080',
        ws: true,
        changeOrigin: true,
      },
      '/socket.io/': {
        target: process.env.API_WS_URL || 'http://localhost:5080',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  // Proxy adicional en Vite (dev) para evitar que /socket.io caiga en el router SSR
  vite: {
    server: {
      proxy: {
        '/api': {
          target: process.env.API_WS_URL || 'http://localhost:5080',
          changeOrigin: true,
        },
        '/socket.io': {
          target: process.env.API_WS_URL || 'http://localhost:5080',
          ws: true,
          changeOrigin: true,
        },
        '/socket.io/': {
          target: process.env.API_WS_URL || 'http://localhost:5080',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})
