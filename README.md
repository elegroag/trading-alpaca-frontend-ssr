# Frontend Trading Swing (SSR)

Versión SSR del frontend **Trading Swing**, migrada de Vue 3 SPA a **Nuxt 4**.

## Stack tecnológico

- **Framework**: Nuxt 4 (Vue 3 + SSR)
- **HTTP client**: Axios
- **WebSocket**: socket.io-client
- **Gráficos**: Chart.js + `chartjs-plugin-zoom` + `chartjs-plugin-annotation`
- **UI**: Tailwind CSS 4 + DaisyUI + Heroicons

---

## Requisitos previos

- **Node.js >= 18** (recomendado LTS)
- **pnpm** (recomendado) o npm
- Backend Flask de **trading-swing-flask** corriendo en `http://localhost:5080`

---

## Instalación

```bash
cd frontend-ssr
pnpm install
```

---

## Scripts disponibles

- `pnpm dev` – Arranca el servidor de desarrollo en `http://localhost:3000`
- `pnpm build` – Compila la app para producción
- `pnpm preview` – Sirve el build de producción
- `pnpm generate` – Genera sitio estático (si aplica)

---

## Configuración del proxy

El proxy al backend Flask está configurado en `nuxt.config.ts`:

```ts
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
```

Esto permite que las peticiones a `/api` y `/socket.io` se redirijan al backend Flask durante el desarrollo.

---

## Estructura del proyecto

```
frontend-ssr/
├── app/
│   ├── app.vue              # Componente raíz
│   ├── assets/css/main.css  # Estilos globales (Tailwind)
│   ├── components/          # Componentes reutilizables
│   │   └── PriceChartCanvas.vue
│   ├── composables/         # Composables (equivalente a services/)
│   │   ├── useApi.ts        # Cliente REST + tipos
│   │   ├── useAuthState.ts  # Estado de autenticación
│   │   └── useSocket.ts     # Cliente WebSocket
│   ├── layouts/             # Layouts de Nuxt
│   │   ├── default.vue      # Layout principal (sidebar)
│   │   └── auth.vue         # Layout para login/register
│   ├── middleware/          # Middleware de rutas
│   │   └── auth.ts          # Guard de autenticación
│   └── pages/               # Páginas (rutas automáticas)
│       ├── index.vue        # Dashboard (/)
│       ├── login.vue        # Login (/login)
│       ├── register.vue     # Registro (/register)
│       ├── chart.vue        # Gráfico (/chart)
│       ├── screener.vue     # Screener (/screener)
│       ├── favorites.vue    # Favoritos (/favorites)
│       └── profile.vue      # Perfil (/profile)
├── public/                   # Archivos estáticos
├── nuxt.config.ts           # Configuración de Nuxt
├── tailwind.config.js       # Configuración de Tailwind
└── package.json
```

---

## Rutas

| Ruta         | Página           | Layout  | Auth requerida |
| ------------ | ---------------- | ------- | -------------- |
| `/`          | Dashboard        | default | Sí             |
| `/login`     | Login            | auth    | No             |
| `/register`  | Registro         | auth    | No             |
| `/chart`     | Gráfico precios  | default | Sí             |
| `/screener`  | Screener mercado | default | Sí             |
| `/favorites` | Favoritos        | default | Sí             |
| `/profile`   | Perfil usuario   | default | Sí             |

---

## Diferencias con la versión SPA

1. **SSR por defecto**: Las páginas se renderizan en el servidor para mejor SEO y carga inicial.
2. **Auto-imports**: Composables, componentes y utilidades de Vue/Nuxt se importan automáticamente.
3. **Layouts en `layouts/`**: En lugar de manejar layouts en `App.vue`.
4. **Rutas automáticas**: Definidas por la estructura de `pages/`.
5. **Middleware**: Guard de autenticación como middleware de Nuxt.
6. **`ClientOnly`**: Componentes que usan APIs del navegador (Chart.js, WebSocket) se envuelven en `<ClientOnly>`.

---

## Desarrollo

```bash
pnpm dev
```

Abre `http://localhost:3000`. Asegúrate de que el backend Flask esté corriendo en el puerto 5080.

---

## Build de producción

```bash
pnpm build
pnpm preview
```

Para desplegar en producción, consulta la [documentación de Nuxt sobre deployment](https://nuxt.com/docs/getting-started/deployment).
