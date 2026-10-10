"use client"

import { toast as toastManager } from "./toast"

export function useToast() {
  return {
    toast: (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
      toastManager.add({
        title: props.title,
        description: props.description,
        type: props.variant === "destructive" ? "error" : "success",
      })
    },
  }
}

export const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
  toastManager.add({
    title: props.title,
    description: props.description,
    type: props.variant === "destructive" ? "error" : "success",
  })
}
