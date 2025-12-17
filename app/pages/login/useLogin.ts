export function useLogin() {
    const route = useRoute()
    const router = useRouter()
    const { AuthAPI } = useApi()
    const { setAuth } = useAuthState()
    const wsClient = useSocket()

    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const error = ref<string | null>(null)

    const handleSubmit = async () => {
        loading.value = true
        error.value = null
        try {
            const response = await AuthAPI.login({
                email: email.value.trim(),
                password: password.value,
            })

            if (!response.success) {
                error.value = response.error ?? 'Error de autenticación'
                return
            }

            const { token, user } = response.data
            setAuth(token, user)
            wsClient.authenticate(token)

            const redirect = (route.query.redirect as string) || '/'
            router.push(redirect)
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al iniciar sesión'
        } finally {
            loading.value = false
        }
    }

    return {
        email,
        password,
        loading,
        error,
        handleSubmit,
    }
}
