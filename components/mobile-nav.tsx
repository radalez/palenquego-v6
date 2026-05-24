"use client"

import { Store, Users, QrCode, Map, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const { currentUser } = useAppStore()

  const tabs = [
    { id: "marketplace", label: "Servicios", icon: Store },
    { id: "businesses", label: "Tiendas", icon: Briefcase },
    { id: "pool", label: "Pool", icon: Users },
    { id: "safeflow", label: "Safe-Flow", icon: QrCode },
    { id: "rutas", label: "Rutas", icon: Map },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-1",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
