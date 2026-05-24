"use client"

import { Store, Users, QrCode, Briefcase, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const tabs = [
    { id: "marketplace", label: "Inicio", icon: Store },
    { id: "businesses", label: "Tiendas", icon: Briefcase },
    { id: "rutas", label: "Go", icon: Navigation, isCenter: true },
    { id: "pool", label: "Pools", icon: Users },
    { id: "safeflow", label: "SafeFlow", icon: QrCode },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset max-w-md mx-auto z-50">
      <div className="flex items-end justify-around py-2 px-2 relative h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          if (tab.isCenter) {
            return (
              <div key={tab.id} className="relative flex-1 flex justify-center h-full">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className="absolute -top-6 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-palenque shadow-lg border-4 border-background transition-transform active:scale-95"
                >
                  <Icon className="w-8 h-8 text-primary-foreground stroke-[2.5] -translate-y-1" />
                  <span className="text-[10px] font-bold text-primary-foreground absolute bottom-2">Go</span>
                </button>
              </div>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all flex-1 h-full justify-end pb-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
