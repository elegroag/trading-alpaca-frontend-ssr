// Composable para estado de autenticación (migrado de services/authState.ts)
import type { UserProfile } from './useApi'

const currentUser = ref<UserProfile | null>(null)

function loadFromStorage() {
    if (!import.meta.client) return

    const raw = sessionStorage.getItem('auth_user') ?? localStorage.getItem('auth_user')

    if (!raw) {
        currentUser.value = null
        return
    }
    try {
        currentUser.value = JSON.parse(raw) as UserProfile
    } catch (e) {
        console.error('Error parsing auth_user from storage', e)
        currentUser.value = null
    }
}

function getToken(): string | null {
    if (!import.meta.client) return null
    return sessionStorage.getItem('auth_token') ?? localStorage.getItem('auth_token')
}

function setAuth(token: string, user: UserProfile) {
    if (!import.meta.client) return

    const serialized = JSON.stringify(user)
    sessionStorage.setItem('auth_token', token)
    sessionStorage.setItem('auth_user', serialized)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', serialized)
    currentUser.value = user
}

function clearAuth() {
    if (!import.meta.client) return

    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    currentUser.value = null
}

export function useAuthState() {
    const isAuthenticated = computed(() => !!currentUser.value)

    // Cargar desde storage en cliente
    if (import.meta.client && !currentUser.value) {
        loadFromStorage()
    }

    return {
        user: currentUser,
        isAuthenticated,
        getToken,
        setAuth,
        clearAuth,
        reload: loadFromStorage,
    }
}
