"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  House,
  HardDrives,
  Warning,
  ClockCounterClockwise,
  Gear,
  List,
  X,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/routers", label: "Routers", icon: HardDrives },
  { href: "/events", label: "Events", icon: Warning },
  { href: "/history", label: "History", icon: ClockCounterClockwise },
  { href: "/settings", label: "Settings", icon: Gear },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X size={20} /> : <List size={20} />}
      </Button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              "md:relative"
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2">
                  <HardDrives className="h-6 w-6" />
                  <span className="font-heading text-lg font-semibold">
                    Router Monitor
                  </span>
                </Link>
              </div>

              <nav className="flex-1 gap-1 p-4">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon size={20} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <Separator />
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  v0.1.0 • Local Network Monitor
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
