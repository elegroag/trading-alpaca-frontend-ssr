export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
    return password.length >= 8
}

export const validateAlpacaKey = (key: string): boolean => {
    return key.trim().length > 0
}
