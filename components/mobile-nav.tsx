"use client"

import { Home, Compass, Briefcase, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const tabs = [
    { id: "map-explorer", label: "Inicio", icon: Home },
    { id: "rutas", label: "Explorar", icon: Compass },
    { id: "pool", label: "Mis viajes", icon: Briefcase },
    { id: "profile", label: "Perfil", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-inset max-w-md mx-auto z-40 shadow-lg">
      <div className="flex items-center justify-around py-2 px-3 h-16">
        {tabs.map((tab) => {
          const isActive = 
            (tab.id === "map-explorer" && activeTab === "map-explorer") ||
            (tab.id === "rutas" && (activeTab === "rutas" || activeTab === "rutas-classic" || activeTab === "marketplace" || activeTab === "businesses")) ||
            (tab.id === "pool" && activeTab === "pool") ||
            (tab.id === "profile" && (activeTab === "profile" || activeTab === "billing" || activeTab === "planes" || activeTab === "pagos" || activeTab === "favoritos" || activeTab === "recomendaciones"))

          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all flex-1 h-full",
                isActive 
                  ? "text-[#064e3b] font-bold" 
                  : "text-gray-400 hover:text-gray-600 font-medium",
              )}
            >
              <div className={cn(
                "p-1 rounded-full transition-transform",
                isActive && "scale-110 text-[#064e3b]"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              </div>
              <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
