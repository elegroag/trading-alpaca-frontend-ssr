export function useRegister() {
    const router = useRouter()
    const { AuthAPI } = useApi()
    const { setAuth } = useAuthState()
    const wsClient = useSocket()

    const email = ref('')
    const password = ref('')
    const nombre = ref('')
    const apellido = ref('')
    const alpacaApiKey = ref('')
    const alpacaSecretKey = ref('')
    const alpacaBaseUrl = ref('')
    const loading = ref(false)
    const error = ref<string | null>(null)

    const handleSubmit = async () => {
        loading.value = true
        error.value = null
        try {
            const payload = {
                email: email.value.trim(),
                password: password.value,
                nombre: nombre.value || undefined,
                apellido: apellido.value || undefined,
                alpaca_api_key: alpacaApiKey.value.trim(),
                alpaca_secret_key: alpacaSecretKey.value.trim(),
                alpaca_base_url: alpacaBaseUrl.value.trim() || undefined,
            }

            const response = await AuthAPI.register(payload)
            if (!response.success) {
                error.value = response.error ?? 'Error al registrar usuario'
                return
            }

            // Tras registro exitoso, iniciar sesión automáticamente
            const loginResponse = await AuthAPI.login({
                email: payload.email,
                password: payload.password,
            })

            if (!loginResponse.success) {
                error.value = loginResponse.error ?? 'Registro ok, pero error al iniciar sesión'
                return
            }

            const { token, user } = loginResponse.data
            setAuth(token, user)
            wsClient.authenticate(token)

            router.push('/dashboard')
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al registrar usuario'
        } finally {
            loading.value = false
        }
    }

    return {
        email,
        password,
        nombre,
        apellido,
        alpacaApiKey,
        alpacaSecretKey,
        alpacaBaseUrl,
        loading,
        error,
        handleSubmit,
    }
}
