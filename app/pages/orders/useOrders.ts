export function useOrders() {
    const ordersListRef = ref<{ loadOrders: () => void } | null>(null)

    const handleOrderCreated = () => {
        if (ordersListRef.value && typeof ordersListRef.value.loadOrders === 'function') {
            ordersListRef.value.loadOrders()
        }
    }

    const refreshOrders = () => {
        if (ordersListRef.value && typeof ordersListRef.value.loadOrders === 'function') {
            ordersListRef.value.loadOrders()
        }
    }

    return {
        ordersListRef,
        handleOrderCreated,
        refreshOrders,
    }
}
