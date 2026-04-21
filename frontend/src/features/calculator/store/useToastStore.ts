import { create } from 'zustand'

export type ToastMessage = {
  id: number
  message: string
}

type ToastState = {
  toasts: ToastMessage[]
  push: (message: string) => number
  dismiss: (id: number) => void
  clear: () => void
}

let nextToastId = 1

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message) => {
    const id = nextToastId
    nextToastId += 1
    set((state) => ({
      toasts: [...state.toasts, { id, message }],
    }))
    return id
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}))
