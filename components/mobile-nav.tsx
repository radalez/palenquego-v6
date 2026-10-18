"use client"

import { Home, ShieldCheck, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const tabs = [
    { id: "map-explorer", label: "Inicio", icon: Home },
    { id: "safeflow", label: "Safe-Flow", icon: ShieldCheck },
    { id: "rutas", label: "Go", isCenter: true },
    { id: "pool", label: "Mis viajes", icon: Users },
    { id: "profile", label: "Perfil", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/80 safe-area-inset max-w-md mx-auto z-40 shadow-lg">
      <div className="flex items-end justify-around py-2 px-2 relative h-16">
        
        {/* Curva de fondo para que el nav envuelva al botón flotante */}
        <div 
          className="absolute left-1/2 -top-6 -translate-x-1/2 w-[84px] h-[84px] bg-white rounded-full border-t border-gray-200/80" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
        />
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-[84px] h-[84px] bg-white rounded-full z-0" />

        {tabs.map((tab) => {
          const isActive = 
            (tab.id === "map-explorer" && activeTab === "map-explorer") ||
            (tab.id === "safeflow" && activeTab === "safeflow") ||
            (tab.id === "rutas" && (activeTab === "rutas" || activeTab === "rutas-classic")) ||
            (tab.id === "pool" && activeTab === "pool") ||
            (tab.id === "profile" && (activeTab === "profile" || activeTab === "billing" || activeTab === "planes" || activeTab === "pagos" || activeTab === "favoritos" || activeTab === "recomendaciones"))

          if (tab.isCenter) {
            return (
              <div key={tab.id} className="relative flex-1 flex justify-center h-full z-10">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "absolute -top-7 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-white shadow-[0_-4px_14px_rgba(0,0,0,0.1)] transition-all active:scale-95 border-2",
                    isActive ? "border-[#064e3b] shadow-emerald-900/20" : "border-gray-200 shadow-gray-400/20"
                  )}
                >
                  <img src="/icon-192.png" alt="Palenque Go" className="w-11 h-11 object-contain -translate-y-2" />
                  <span className={cn(
                    "text-[15px] font-extrabold absolute bottom-1.5 leading-none",
                    isActive ? "text-[#064e3b]" : "text-[#125238]"
                  )}>
                    Go
                  </span>
                </button>
              </div>
            )
          }

          const Icon = tab.icon!

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all flex-1 h-full justify-end pb-1.5 z-10",
                isActive ? "text-[#064e3b] font-bold" : "text-gray-400 hover:text-gray-600 font-medium",
              )}
            >
              <Icon className={cn("w-[22px] h-[22px]", isActive && "stroke-[2.5]")} />
              <span className="text-[11px] font-medium leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
