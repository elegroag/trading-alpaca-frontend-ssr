<script setup lang="ts">
// Layout principal (migrado de layouts/MainLayout.vue)
import {
  ChartBarIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  NewspaperIcon,
  MagnifyingGlassIcon,
  CircleStackIcon,
  StarIcon,
  Bars3BottomLeftIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
  UserPlusIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, authReady, clearAuth } = useAuthState()
const wsClient = useSocket()

const userEmail = computed(() => user.value?.email ?? '')

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const toggleCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const closeSidebarOnMobile = () => {
  if (import.meta.client && window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
}

const handleLogout = () => {
  clearAuth()
  wsClient.disconnect()
  router.push('/login')
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { to: '/chart', label: 'Gráfico', icon: ChartPieIcon },
  { to: '/screener', label: 'Screener', icon: MagnifyingGlassIcon },
  { to: '/market-symbols', label: 'Símbolos', icon: CircleStackIcon },
  { to: '/orders', label: 'Órdenes', icon: ClipboardDocumentListIcon },
  { to: '/news', label: 'Noticias', icon: NewspaperIcon },
  { to: '/favorites', label: 'Favoritos', icon: StarIcon },
]

const isActiveRoute = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content flex">
    <!-- Overlay para móvil -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="toggleSidebar"
    />

    <!-- Sidebar -->
    <aside
      class="fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-base-200 border-r border-base-300 transition-all duration-300"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed ? 'w-16' : 'w-64',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-14 px-4 border-b border-base-300">
        <div class="flex items-center gap-2 overflow-hidden">
          <ChartPieIcon class="w-6 h-6 flex-shrink-0 text-primary" />
          <span
            v-if="!sidebarCollapsed"
            class="font-semibold text-sm whitespace-nowrap"
          >
            Trading Swing
          </span>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs hidden lg:flex text-gray-200"
          @click="toggleCollapse"
          :title="sidebarCollapsed ? 'Expandir' : 'Colapsar'"
        >
          <Bars3BottomLeftIcon
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-180': sidebarCollapsed }"
          />
        </button>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="menu px-2 gap-1">
          <li v-for="item in navItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
              :class="[
                isActiveRoute(item.to)
                  ? 'bg-primary/90 text-primary-content shadow-sm'
                  : 'hover:bg-base-300/80',
                sidebarCollapsed ? 'justify-center' : '',
              ]"
              @click="closeSidebarOnMobile"
              :title="sidebarCollapsed ? item.label : ''"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="!sidebarCollapsed" class="text-sm">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Usuario (parte inferior) -->
      <div class="border-t border-base-300 p-2" v-if="!authReady">
        <div class="flex items-center justify-center gap-2 px-3 py-3">
          <span class="loading loading-spinner loading-sm" />
          <span v-if="!sidebarCollapsed" class="text-sm text-base-content/70">Cargando…</span>
        </div>
      </div>

      <div class="border-t border-base-300 p-2" v-else-if="isAuthenticated">
        <NuxtLink
          to="/profile"
          class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-base-300 transition-colors"
          :class="[
            isActiveRoute('/profile') ? 'bg-primary/10' : '',
            sidebarCollapsed ? 'justify-center' : '',
          ]"
          @click="closeSidebarOnMobile"
          :title="sidebarCollapsed ? 'Perfil' : ''"
        >
          <div class="avatar placeholder flex-shrink-0">
            <div class="bg-neutral text-neutral-content rounded-full w-8">
              <span class="text-xs">{{ userEmail.charAt(0).toUpperCase() }}</span>
            </div>
          </div>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate">{{ userEmail }}</p>
            <p class="text-xs text-base-content/60">Ver perfil</p>
          </div>
        </NuxtLink>
      </div>

      <!-- Login/Register si no autenticado -->
      <div class="border-t border-base-300 p-2" v-else>
        <NuxtLink
          to="/login"
          class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-base-300 transition-colors"
          :class="sidebarCollapsed ? 'justify-center' : ''"
          @click="closeSidebarOnMobile"
        >
          <ArrowLeftEndOnRectangleIcon class="h-5 w-5 flex-shrink-0" />
          <span v-if="!sidebarCollapsed" class="text-sm">Iniciar sesión</span>
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg bg-primary text-primary-content hover:bg-primary-focus transition-colors"
          :class="sidebarCollapsed ? 'justify-center' : ''"
          @click="closeSidebarOnMobile"
        >
          <UserPlusIcon class="h-5 w-5 flex-shrink-0" />
          <span v-if="!sidebarCollapsed" class="text-sm">Registrarse</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="h-14 border-b border-base-300 bg-base-200/80 backdrop-blur flex items-center px-4 gap-4 sticky top-0 z-20">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square lg:hidden"
          @click="toggleSidebar"
        >
          <Bars3Icon class="h-5 w-5" />
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm hidden lg:flex text-gray-200"
          @click="toggleCollapse"
          :title="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'"
        >
          <Bars3Icon class="h-5 w-5" />
        </button>

        <div class="flex-1">
          <h1 class="text-sm font-medium text-base-content/80">
            {{ navItems.find(i => isActiveRoute(i.to))?.label || 'Trading Swing' }}
          </h1>
        </div>

        <div class="flex items-center gap-2" v-if="authReady && isAuthenticated">
          <span class="hidden sm:inline text-xs text-base-content/60 truncate max-w-[200px]">
            {{ userEmail }}
          </span>

          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square"
            @click="handleLogout"
            title="Cerrar sesión"
          >
            <ArrowRightStartOnRectangleIcon class="h-5 w-5" />
          </button>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex-1 p-4 overflow-auto">
        <div class="mx-auto w-full max-w-9/10">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
aside {
  will-change: transform, width;
}
</style>
