// Minimal service worker for handling push events
self.addEventListener('push', function(event) {
  let data = {}
  if (event.data) {
    data = event.data.json()
  }
  const title = data.title || 'Notificación'
  const options = {
    body: data.body || '',
    icon: '/icon.png'
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})

