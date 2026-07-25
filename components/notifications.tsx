"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, WarningCircle, Info, Warning } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "info" | "warning" | "critical"
  title: string
  message: string
}

let addNotificationFn: ((n: Omit<Notification, "id">) => void) | null = null

export function notify(n: Omit<Notification, "id">) {
  if (addNotificationFn) {
    addNotificationFn(n)
  }
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    addNotificationFn = (n) => {
      const id = Math.random().toString(36).slice(2)
      setItems((prev) => [...prev, { ...n, id }])

      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }, 5000)
    }
    return () => {
      addNotificationFn = null
    }
  }, [])

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                "flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg",
                item.type === "info" && "border-blue-500/50 bg-blue-500/10",
                item.type === "warning" &&
                  "border-amber-500/50 bg-amber-500/10",
                item.type === "critical" && "border-red-500/50 bg-red-500/10"
              )}
            >
              {item.type === "info" && (
                <Info size={20} className="text-blue-500" />
              )}
              {item.type === "warning" && (
                <Warning size={20} className="text-amber-500" />
              )}
              {item.type === "critical" && (
                <WarningCircle size={20} className="text-red-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.message}</p>
              </div>
              <button
                onClick={() => dismiss(item.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
