import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// Toast context and provider
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())
  const addToast = useCallback((message, { type = 'info', duration = 4000 } = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const toast = { id, message, type }
    setToasts((t) => [...t, toast])
    if (duration > 0) {
      const timer = window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
        timersRef.current.delete(id)
      }, duration)
      timersRef.current.set(id, timer)
    }
    return id
  }, [])
  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <div className="toast__body">{t.message}</div>
            <button type="button" className="toast__close" onClick={() => removeToast(t.id)} aria-label="Cerrar">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// LoadingButton: small button with spinner
export function LoadingButton({ children, loading = false, className = '', disabled = false, ...props }) {
  return (
    <button
      {...props}
      className={className}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="loading-inline" aria-hidden>
          <span className="spinner" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}

// no default export

