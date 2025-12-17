export const TREND_PREFS_KEY = 'trend_preferences'

export interface TrendPreferences {
    profile: 'intradia' | 'corto' | 'largo'
    model_type: 'xgboost' | 'random_forest'
}

export const defaultTrendPreferences: TrendPreferences = {
    profile: 'corto',
    model_type: 'xgboost',
}
