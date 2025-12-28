// Composable para acceso a la API REST (migrado de services/api.ts)
import axios from 'axios'

const config = useRuntimeConfig()
const apiBaseUrl = config.public.wsUrl as string || 'http://localhost:5080'

const api = axios.create({
    baseURL: `${apiBaseUrl}/api`,
})

// Interceptor para añadir token JWT
api.interceptors.request.use((config) => {
    if (import.meta.client) {
        const token =
            sessionStorage.getItem('auth_token') ?? localStorage.getItem('auth_token')
        if (token) {
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

// Interfaces
export interface Account {
    account_id: string
    cash: number
    buying_power: number
    portfolio_value: number
    equity: number
    currency: string
    status: string
}

export interface Position {
    symbol: string
    qty: number
    avg_entry_price: number
    current_price: number
    market_value: number
    unrealized_pl: number
    unrealized_plpc: number
    side: string
}

export interface Order {
    order_id: string
    symbol: string
    qty: number
    side: string
    order_type: string
    time_in_force: string
    limit_price: number | null
    stop_price: number | null
    status: string
    filled_qty: number
    filled_avg_price: number | null
    created_at: string | null
    updated_at: string | null
}

export interface Bar {
    timestamp: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export interface Quote {
    symbol: string
    price: number
    size: number
    timestamp: string | null
    close?: number | null
    name?: string | null
    asset_class?: string | null
    asset_attributes?: string[] | null
}

export interface UserProfile {
    id: string
    email: string
    nombre?: string | null
    apellido?: string | null
    rol: string
    alpaca_base_url?: string | null
    paper_trading: boolean
    created_at?: string | null
    updated_at?: string | null
    last_login_at?: string | null
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    email: string
    password: string
    nombre?: string
    apellido?: string
    alpaca_api_key?: string
    alpaca_secret_key?: string
    alpaca_base_url?: string
}

export interface AuthData {
    token: string
    user: UserProfile
}

export interface UpdateKeysPayload {
    alpaca_api_key?: string
    alpaca_secret_key?: string
    alpaca_base_url?: string
    paper_trading?: boolean
}

export interface CreateOrderPayload {
    symbol: string
    qty: number
    side: 'buy' | 'sell'
    order_type: 'market' | 'limit'
    limit_price?: number
}

export interface ApiResponse<T> {
    success: boolean
    data: T
    error?: string
}

export interface ChartData {
    bars: Bar[]
    quote: Quote
}

export interface MostActiveItem {
    symbol: string | null
    name: string | null
    volume: number | null
    trade_count: number | null
    price: number | null
    close: number | null
    market: string | null
    by: string | null
    last_updated: string | null
}

export interface MarketMoversData {
    gainers: Array<{
        symbol: string | null
        percent_change: number | null
        change: number | null
        price: number | null
        close: number | null
        direction: 'gainer'
        market: string | null
        last_updated: string | null
    }>
    losers: Array<{
        symbol: string | null
        percent_change: number | null
        change: number | null
        price: number | null
        close: number | null
        direction: 'loser'
        market: string | null
        last_updated: string | null
    }>
    market: string | null
    last_updated: string | null
}

export interface MarketSymbolDocument {
    id: string | null
    symbol: string
    name: string | null
    market: string | null
    price: number | null
    close: number | null
    change: number | null
    percent_change: number | null
    direction: string | null
    volume: number | null
    trade_count: number | null
    last_screener_timestamp: string | null
}

export interface NewsItem {
    symbol: string
    title: string
    publisher?: string | null
    date?: string | null
    url?: string | null
    source?: string | null
}

export interface FairValueMethod {
    buy: number
    sell: number
}

export interface FairValueSignal {
    method: string
    signal: string
    strength: string
    reason: string
}

export interface FairValueSignals {
    signals: FairValueSignal[]
    buy_score: number
    sell_score: number
    neutral_score: number
    total_score: number
    recommendation: string
    recommendation_color: string
}

export interface FairValueData {
    current_price: number
    zscore: number
    ema20: number
    ema50: number
    atr: number
    support20: number
    resistance20: number
    fair_values: {
        atr: FairValueMethod
        ema: FairValueMethod
        support_resistance: FairValueMethod
    }
    buy_range: { min: number; max: number }
    sell_range: { min: number; max: number }
    signals: FairValueSignals
}

export interface TrendAnalysisResult {
    symbol: string
    trend_code: number
    trend_label: string
    probabilities?: Record<string, number> | null
    n_samples: number
    classification_report: string
    model_type?: string
    profile?: string
    future_days?: number
    up_threshold?: number
    down_threshold?: number
    fair_value?: FairValueData | null
}

export interface TrendPreferences {
    profile: 'intradia' | 'corto' | 'largo'
    model_type: 'xgboost' | 'random_forest'
}

// APIs
export const AuthAPI = {
    async register(payload: RegisterPayload): Promise<ApiResponse<UserProfile>> {
        const { data } = await api.post<ApiResponse<UserProfile>>('/auth/register', payload)
        return data
    },

    async login(payload: LoginPayload): Promise<ApiResponse<AuthData>> {
        const { data } = await api.post<ApiResponse<AuthData>>('/auth/login', payload)
        return data
    },

    async me(): Promise<ApiResponse<UserProfile>> {
        const { data } = await api.get<ApiResponse<UserProfile>>('/user/me')
        return data
    },

    async updateKeys(payload: UpdateKeysPayload): Promise<ApiResponse<UserProfile>> {
        const { data } = await api.put<ApiResponse<UserProfile>>('/user/keys', payload)
        return data
    },
}

export const TradingAPI = {
    async getAccount(): Promise<ApiResponse<Account>> {
        const { data } = await api.get<ApiResponse<Account>>('/account')
        return data
    },

    async getPositions(): Promise<ApiResponse<Position[]>> {
        const { data } = await api.get<ApiResponse<Position[]>>('/positions')
        return data
    },

    async getOrders(): Promise<ApiResponse<Order[]>> {
        const { data } = await api.get<ApiResponse<Order[]>>('/orders')
        return data
    },

    async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
        const { data } = await api.post<ApiResponse<Order>>('/orders', payload)
        return data
    },

    async cancelOrder(orderId: string): Promise<ApiResponse<{ message: string }>> {
        const { data } = await api.delete<ApiResponse<{ message: string }>>(`/orders/${orderId}`)
        return data
    },

    async getBars(symbol: string, timeframe = '1D', limit = 100): Promise<ApiResponse<Bar[]>> {
        const { data } = await api.get<ApiResponse<Bar[]>>(`/bars/${symbol}`, {
            params: { timeframe, limit },
        })
        return data
    },

    async getChartData(symbol: string, timeframe = '1D', limit = 100): Promise<ApiResponse<ChartData>> {
        const { data } = await api.get<ApiResponse<ChartData>>(`/chart-data/${symbol}`, {
            params: { timeframe, limit },
        })
        return data
    },

    async getQuote(symbol: string): Promise<ApiResponse<Quote>> {
        const { data } = await api.get<ApiResponse<Quote>>(`/quote/${symbol}`)
        return data
    },

    async getMostActives(params?: {
        by?: 'volume' | 'trades'
        limit?: number
        market?: 'stocks' | 'crypto'
        minPrice?: number | null
        maxPrice?: number | null
    }): Promise<ApiResponse<MostActiveItem[]>> {
        const queryParams: Record<string, unknown> = {}
        if (params?.by) queryParams.by = params.by
        if (params?.limit != null) queryParams.limit = params.limit
        if (params?.market) queryParams.market = params.market
        if (params?.minPrice != null) queryParams.min_price = params.minPrice
        if (params?.maxPrice != null) queryParams.max_price = params.maxPrice

        const { data } = await api.get<ApiResponse<MostActiveItem[]>>('/screener/most-actives', {
            params: queryParams,
        })
        return data
    },

    async getMarketMovers(params?: {
        limit?: number
        market?: 'stocks' | 'crypto'
        minPrice?: number | null
        maxPrice?: number | null
    }): Promise<ApiResponse<MarketMoversData>> {
        const queryParams: Record<string, unknown> = {}
        if (params?.limit != null) queryParams.limit = params.limit
        if (params?.market) queryParams.market = params.market
        if (params?.minPrice != null) queryParams.min_price = params.minPrice
        if (params?.maxPrice != null) queryParams.max_price = params.maxPrice

        const { data } = await api.get<ApiResponse<MarketMoversData>>('/screener/market-movers', {
            params: queryParams,
        })
        return data
    },
}

export const ScreenerAPI = {
    async syncSymbols(payload?: {
        topMostActives?: number
        topMovers?: number
        market?: 'stocks' | 'crypto'
    }): Promise<ApiResponse<{ processed: number }>> {
        const body: Record<string, unknown> = {}
        if (payload?.topMostActives != null) body.top_most_actives = payload.topMostActives
        if (payload?.topMovers != null) body.top_movers = payload.topMovers
        if (payload?.market) body.market = payload.market

        const { data } = await api.post<ApiResponse<{ processed: number }>>('/screener/sync-symbols', body)
        return data
    },

    async getMarketSymbols(params?: { limit?: number }): Promise<ApiResponse<MarketSymbolDocument[]>> {
        const { data } = await api.get<ApiResponse<MarketSymbolDocument[]>>('/market-symbols', { params })
        return data
    },
}

export const NewsAPI = {
    async getNews(symbol: string, params?: { limit?: number }): Promise<ApiResponse<NewsItem[]>> {
        const sym = (symbol || '').trim().toUpperCase()
        const { data } = await api.get<ApiResponse<NewsItem[]>>(`/news/${sym}`, { params })
        return data
    },
}

export const SymbolPreferencesAPI = {
    async getSymbols(): Promise<ApiResponse<string[]>> {
        const { data } = await api.get<ApiResponse<string[]>>('/user/preferences/symbols')
        return data
    },

    async setSymbols(symbols: string[]): Promise<ApiResponse<string[]>> {
        const { data } = await api.put<ApiResponse<string[]>>('/user/preferences/symbols', { symbols })
        return data
    },

    async addSymbols(payload: { symbol?: string; symbols?: string[] }): Promise<ApiResponse<string[]>> {
        const { data } = await api.post<ApiResponse<string[]>>('/user/preferences/symbols', payload)
        return data
    },

    async removeSymbols(payload?: { symbol?: string; symbols?: string[] }): Promise<ApiResponse<string[]>> {
        const { data } = await api.delete<ApiResponse<string[]>>('/user/preferences/symbols', {
            data: payload ?? {},
        })
        return data
    },

    async getFavoriteDetails(): Promise<ApiResponse<MarketSymbolDocument[]>> {
        const { data } = await api.get<ApiResponse<MarketSymbolDocument[]>>('/user/favorites/details')
        return data
    },

    async getTrendPreferences(): Promise<ApiResponse<TrendPreferences>> {
        const { data } = await api.get<ApiResponse<TrendPreferences>>('/user/trend-preferences')
        return data
    },

    async getFavoriteTrend(payload: {
        symbol: string
        profile?: 'intradia' | 'corto' | 'largo'
        model_type?: 'xgboost' | 'random_forest'
    }): Promise<ApiResponse<TrendAnalysisResult>> {
        const { data } = await api.post<ApiResponse<TrendAnalysisResult>>('/user/favorites/trend', payload)
        return data
    },

    async refreshFavorites(): Promise<ApiResponse<MarketSymbolDocument[]>> {
        const { data } = await api.post<ApiResponse<MarketSymbolDocument[]>>('/user/favorites/refresh')
        return data
    },
}

// Composable wrapper
export function useApi() {
    return {
        AuthAPI,
        TradingAPI,
        ScreenerAPI,
        NewsAPI,
        SymbolPreferencesAPI,
    }
}
