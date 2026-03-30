'use client'
import { useEffect } from 'react'

export default function OneSignalInit() {
    useEffect(() => {
        const init = () => {
            try {
                // @ts-ignore
                const OneSignal = window.plugins?.OneSignal
                if (!OneSignal) {
                    console.log('OneSignal not ready, retrying...')
                    setTimeout(init, 1000)
                    return
                }
                OneSignal.initialize('98c9ac96-ee4b-437e-88ea-096a9f2ce545')
                OneSignal.Notifications.requestPermission(true)
                console.log('OneSignal initialized!')
            } catch (err) {
                console.log('OneSignal error:', err)
            }
        }

        // Wait for Capacitor to load native plugins
        setTimeout(init, 2000)
    }, [])

    return null
}