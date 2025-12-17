// Middleware de autenticación (migrado del guard de router)
export default defineNuxtRouteMiddleware((to) => {
    // Solo ejecutar en cliente
    if (!import.meta.client) return

    const publicRoutes = ['/login', '/register']
    const token = sessionStorage.getItem('auth_token') ?? localStorage.getItem('auth_token')

    // Si está en ruta pública y tiene token, redirigir al dashboard
    if (publicRoutes.includes(to.path)) {
        if (token) {
            return navigateTo('/dashboard')
        }
        return
    }

    // Si no tiene token, redirigir a login
    if (!token) {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
})
