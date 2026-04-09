'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function PWANotificationInit() {
    useEffect(() => {
        const init = async () => {
            // Only run in browser, skip if no service worker support
            if (typeof window === 'undefined') return
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

            // Get current user
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) return

            // Register service worker
            const reg = await navigator.serviceWorker.register('/sw.js')
            console.log('SW registered:', reg.scope)

            // Check existing permission
            if (Notification.permission === 'denied') return
            if (Notification.permission === 'granted') {
                await subscribe(reg, session.user.id)
                return
            }

            // Ask for permission (only if not yet asked)
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') return

            await subscribe(reg, session.user.id)
        }

        const subscribe = async (reg: ServiceWorkerRegistration, userId: string) => {
            try {
                const existing = await reg.pushManager.getSubscription()
                if (existing) {
                    // Already subscribed — just save to Supabase in case it's a new device
                    await saveSubscription(existing, userId)
                    return
                }

                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                    ),
                })

                await saveSubscription(subscription, userId)
            } catch (err) {
                console.error('Push subscribe error:', err)
            }
        }

        const saveSubscription = async (subscription: PushSubscription, userId: string) => {
            await fetch('/api/notifications/pwa-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, userId }),
            })
        }

        init()
    }, [])

    return null
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}