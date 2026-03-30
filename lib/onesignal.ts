export const initOneSignal = async () => {
    if (typeof window === 'undefined') return

    try {
        // @ts-ignore
        const OneSignal = window.plugins?.OneSignal
        if (!OneSignal) return

        OneSignal.initialize('98c9ac96-ee4b-437e-88ea-096a9f2ce545')
        OneSignal.Notifications.requestPermission(true)
    } catch (err) {
        console.log('OneSignal not available')
    }
}