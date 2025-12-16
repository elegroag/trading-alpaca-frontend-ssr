// Composable para WebSocket (migrado de services/socket.ts)
// Solo se ejecuta en cliente
import { io, type Socket } from 'socket.io-client'

export type EventHandler = (data: unknown) => void

class WebSocketClient {
    private socket: Socket | null = null
    private subscribers: Record<string, EventHandler[]> = {}
    private initialized = false

    init() {
        if (this.initialized || !import.meta.client) return
        this.initialized = true

        const config = useRuntimeConfig()
        const wsUrl = (config.public.wsUrl as string) || '/'

        this.socket = io(wsUrl, {
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            upgrade: true,
        })

        this.socket.on('connect_error', (err) => {
            // Diagnóstico: si el upgrade a websocket falla, Socket.IO debería caer a polling.
            // Este log nos permite ver la causa real (backend caído, 404, proxy, etc.).
            // eslint-disable-next-line no-console
            console.error('[socket.io] connect_error', err)
            this.emit('error', err)
        })

        this.socket.on('connect', () => {
            this.emit('connected', { connected: true })

            const token =
                sessionStorage.getItem('auth_token') ?? localStorage.getItem('auth_token')
            if (token) {
                this.authenticate(token)
            }
        })

        this.socket.on('disconnect', () => {
            this.emit('disconnected', { connected: false })
        })

        const events = [
            'connected',
            'authenticated',
            'quote_update',
            'account_update',
            'positions_update',
            'position_update',
            'subscribed',
            'unsubscribed',
            'error',
        ]
        events.forEach((event) => {
            this.socket?.on(event, (data) => this.emit(event, data))
        })
    }

    subscribe(event: string, handler: EventHandler) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = []
        }
        this.subscribers[event].push(handler)

        if (event === 'connected' && this.socket) {
            handler({ connected: this.socket.connected })
        } else if (event === 'disconnected' && this.socket && !this.socket.connected) {
            handler({ connected: false })
        }
    }

    unsubscribe(event: string, handler: EventHandler) {
        const subs = this.subscribers[event]
        if (!subs) return
        const idx = subs.indexOf(handler)
        if (idx >= 0) subs.splice(idx, 1)
    }

    private emit(event: string, data: unknown) {
        const subs = this.subscribers[event]
        if (!subs || subs.length === 0) return
        subs.forEach((handler) => handler(data))
    }

    authenticate(token: string) {
        this.socket?.emit('authenticate', { token })
    }

    subscribeToSymbol(symbol: string) {
        console.log(`Subscribing to symbol: ${symbol}`)
        this.socket?.emit('subscribe_symbol', { symbol: symbol.toUpperCase() })
    }

    unsubscribeFromSymbol(symbol: string) {
        console.log(`Unsubscribing from symbol: ${symbol}`)
        this.socket?.emit('unsubscribe_symbol', { symbol: symbol.toUpperCase() })
    }

    disconnect() {
        this.socket?.disconnect()
    }

    get connected(): boolean {
        return this.socket?.connected ?? false
    }
}

// Singleton global
let wsClientInstance: WebSocketClient | null = null

export function useSocket() {
    if (!wsClientInstance) {
        wsClientInstance = new WebSocketClient()
    }

    // Inicializar solo en cliente
    if (import.meta.client) {
        wsClientInstance.init()
    }

    return wsClientInstance
}
