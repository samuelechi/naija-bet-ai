self.addEventListener('push', function (event) {
    if (!event.data) return

    const data = event.data.json()

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: { url: data.url || 'https://naijabetai.com' },
            vibrate: [100, 50, 100],
        })
    )
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    )
})