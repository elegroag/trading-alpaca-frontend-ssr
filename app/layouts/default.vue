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

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && sidebarOpen.value) {
    sidebarOpen.value = false
  }
}

// Manejar foco del teclado
const handleNavKeydown = (event: KeyboardEvent, item: any) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    router.push(item.to)
    closeSidebarOnMobile()
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

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

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
      class="sidebar fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-base-200 to-base-300 border-r border-base-300 transition-all duration-300 ease-in-out shadow-xl"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed ? 'w-16 sidebar-collapsed' : 'w-64',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-base-300/50">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="relative">
            <ChartPieIcon class="w-7 h-7 flex-shrink-0 text-primary" />
          </div>
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 -translate-x-2"
          >
            <span
              v-if="!sidebarCollapsed"
              class="font-bold text-base text-primary whitespace-nowrap"
            >
              Trading Swing
            </span>
          </transition>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs hidden lg:flex hover:bg-primary/20 hover:text-primary transition-all duration-200 group"
          @click="toggleCollapse"
          :title="sidebarCollapsed ? 'Expandir' : 'Colapsar'"
        >
          <Bars3BottomLeftIcon
            class="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
            :class="{ 'rotate-180': sidebarCollapsed }"
          />
        </button>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
        <ul class="flex flex-col gap-2 w-full">
          <li v-for="(item, index) in navItems" :key="item.to" class="w-full">
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              :style="{ transitionDelay: `${index * 50}ms` }"
            >
              <NuxtLink
                :to="item.to"
                class="group flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden nav-item"
                :class="[
                  isActiveRoute(item.to)
                    ? 'bg-gradient-to-r from-primary/90 to-primary-focus text-primary-content shadow-lg scale-105'
                    : 'hover:bg-base-300/60 hover:scale-105 hover:shadow-md',
                  sidebarCollapsed ? 'justify-center px-1' : '',
                ]"
                @click="closeSidebarOnMobile"
                @keydown="(e) => handleNavKeydown(e, item)"
                :title="sidebarCollapsed ? item.label : ''"
                :aria-label="item.label"
                role="navigation"
                tabindex="0"
              >
                <!-- Efecto de brillo en hover -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <component 
                  :is="item.icon" 
                  class="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" 
                  :class="isActiveRoute(item.to) ? 'text-primary-content' : 'text-base-content/80'"
                />
                <transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 translate-x-2"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100 translate-x-0"
                  leave-to-class="opacity-0 translate-x-2"
                >
                  <span 
                    v-if="!sidebarCollapsed" 
                    class="text-sm font-medium"
                  >
                    {{ item.label }}
                  </span>
                </transition>
                
                <!-- Indicador activo -->
                <div 
                  v-if="isActiveRoute(item.to) && !sidebarCollapsed"
                  class="absolute right-2 w-1 h-6 bg-primary-content rounded-full animate-pulse"
                />
              </NuxtLink>
            </transition>
          </li>
        </ul>
      </nav>

      <!-- Usuario (parte inferior) -->
      <div class="border-t border-base-300/50 p-2 bg-gradient-to-t from-base-300/20 to-transparent" v-if="!authReady">
        <div class="flex items-center justify-center gap-3 px-2 py-3">
          <div class="relative">
            <span class="loading loading-spinner loading-sm text-primary" />
            <div class="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
          </div>
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-2"
          >
            <span v-if="!sidebarCollapsed" class="text-sm text-base-content/70 font-medium">Cargando…</span>
          </transition>
        </div>
      </div>

      <div class="border-t border-base-300/50 p-2 bg-gradient-to-t from-base-300/20 to-transparent" v-else-if="isAuthenticated">
        <NuxtLink
          to="/profile"
          class="group flex items-center gap-3 w-full px-2 py-3 rounded-xl hover:bg-base-300/60 transition-all duration-200 relative overflow-hidden nav-item"
          :class="[
            isActiveRoute('/profile') ? 'bg-primary/10 shadow-md' : '',
            sidebarCollapsed ? 'justify-center px-1' : '',
          ]"
          @click="closeSidebarOnMobile"
          @keydown="(e) => handleNavKeydown(e, { to: '/profile', label: 'Perfil' })"
          :title="sidebarCollapsed ? 'Perfil' : ''"
          :aria-label="'Perfil de usuario'"
          role="navigation"
          tabindex="0"
        >
          <!-- Efecto de brillo -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <div class="avatar placeholder flex-shrink-0 relative">
            <div class="bg-gradient-to-br from-primary to-primary-focus text-primary-content rounded-full w-9 h-9 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <span class="text-sm font-bold">{{ userEmail.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-2"
          >
            <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate text-base-content">{{ userEmail }}</p>
              <p class="text-xs text-base-content/60 group-hover:text-primary/80 transition-colors duration-200">Ver perfil</p>
            </div>
          </transition>
        </NuxtLink>
      </div>

      <!-- Login/Register si no autenticado -->
      <div class="border-t border-base-300/50 p-2 bg-gradient-to-t from-base-300/20 to-transparent" v-else>
        <NuxtLink
          to="/login"
          class="group flex items-center gap-3 w-full px-2 py-3 rounded-xl hover:bg-base-300/60 transition-all duration-200 relative overflow-hidden mb-2 nav-item"
          :class="sidebarCollapsed ? 'justify-center px-1' : ''"
          @click="closeSidebarOnMobile"
          @keydown="(e) => handleNavKeydown(e, { to: '/login', label: 'Iniciar sesión' })"
          :aria-label="'Iniciar sesión'"
          role="navigation"
          tabindex="0"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <ArrowLeftEndOnRectangleIcon class="h-5 w-5 flex-shrink-0 text-base-content/80 group-hover:text-primary transition-colors duration-200" />
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-2"
          >
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Iniciar sesión</span>
          </transition>
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="group flex items-center gap-3 w-full px-2 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-focus text-primary-content hover:from-primary-focus hover:to-primary transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden nav-item"
          :class="sidebarCollapsed ? 'justify-center px-1' : ''"
          @click="closeSidebarOnMobile"
          @keydown="(e) => handleNavKeydown(e, { to: '/register', label: 'Registrarse' })"
          :aria-label="'Registrarse'"
          role="navigation"
          tabindex="0"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <UserPlusIcon class="h-5 w-5 flex-shrink-0" />
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-2"
          >
            <span v-if="!sidebarCollapsed" class="text-sm font-bold">Registrarse</span>
          </transition>
        </NuxtLink>
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="h-16 border-b border-base-300/50 bg-gradient-to-r from-base-200/90 to-base-300/90 backdrop-blur-lg flex items-center px-4 gap-4 sticky top-0 z-20 shadow-sm">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square lg:hidden hover:bg-primary/20 hover:text-primary transition-all duration-200 group"
          @click="toggleSidebar"
        >
          <Bars3Icon class="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm hidden lg:flex hover:bg-primary/20 hover:text-primary transition-all duration-200 group"
          @click="toggleCollapse"
          :title="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'"
        >
          <Bars3Icon class="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
        </button>

        <div class="flex-1">
          <h1 class="text-base font-semibold text-base-content/90 bg-gradient-to-r from-base-content to-primary/80 bg-clip-text text-transparent">
            {{ navItems.find(i => isActiveRoute(i.to))?.label || 'Trading Swing' }}
          </h1>
        </div>

        <div class="flex items-center gap-3" v-if="authReady && isAuthenticated">
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-300/50 border border-base-300/50">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span class="text-xs text-base-content/80 font-medium truncate max-w-[200px]">
              {{ userEmail }}
            </span>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 group"
            @click="handleLogout"
            title="Cerrar sesión"
          >
            <ArrowRightStartOnRectangleIcon class="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
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
