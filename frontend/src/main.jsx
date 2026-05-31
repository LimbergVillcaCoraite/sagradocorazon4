import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './ui.jsx'

const RESIZE_OBSERVER_NOISE = 'ResizeObserver loop completed with undelivered notifications.'

// Some browsers surface a noisy ResizeObserver warning as an uncaught error.
// Normalize and suppress it so it doesn't pollute the console or trigger
// global error handlers. We check for substring matches (some engines append
// extra context) and prevent default behavior. Use capture=true so we get
// the event early.
window.addEventListener('error', (event) => {
  const msg = event?.message || (event?.error && event.error.message)
  if (typeof msg === 'string' && msg.indexOf(RESIZE_OBSERVER_NOISE) !== -1) {
    event.stopImmediatePropagation?.()
    event.preventDefault?.()
  }
}, true)

// Some browsers may deliver this as an unhandledrejection; suppress similarly.
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  const msg = typeof reason === 'string' ? reason : reason && reason.message
  if (typeof msg === 'string' && msg.indexOf(RESIZE_OBSERVER_NOISE) !== -1) {
    event.preventDefault()
  }
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations?.forEach((registration) => registration.unregister())
  }).catch(() => null)
}

if ('caches' in window) {
  caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => null)
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)
