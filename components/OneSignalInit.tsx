'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function OneSignalInit() {
    useEffect(() => {
        const init = async () => {
            await new Promise(r => setTimeout(r, 2000))

            let attempts = 0
            const tryInit = async () => {
                attempts++
                try {
                    // @ts-ignore
                    const OneSignal = window.plugins?.OneSignal
                    if (!OneSignal) {
                        if (attempts < 10) setTimeout(tryInit, 1000)
                        return
                    }

                    OneSignal.initialize('98c9ac96-ee4b-437e-88ea-096a9f2ce545')
                    OneSignal.Notifications.requestPermission(true)

                    // Tag user with their Supabase ID for individual targeting
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session?.user?.id) {
                        OneSignal.login(session.user.id)
                        console.log('OneSignal tagged user:', session.user.id)
                    }

                } catch (err) {
                    console.log('OneSignal not available')
                }
            }

            tryInit()
        }

        init()
    }, [])

    return null
}