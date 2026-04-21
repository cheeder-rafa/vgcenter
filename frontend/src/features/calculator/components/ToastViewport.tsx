import { useEffect } from 'react'

import { useToastStore } from '../store/useToastStore'

const TOAST_DURATION_MS = 2400

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    const timeouts = toasts.map((toast) =>
      window.setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS),
    )

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
    }
  }, [dismiss, toasts])

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto rounded-sm border border-arena-sun/35 bg-arena-void/95 px-4 py-3 font-body text-sm text-white shadow-[0_0_28px_rgba(255,196,61,0.18)] backdrop-blur"
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
