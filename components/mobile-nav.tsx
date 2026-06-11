"use client"

import { Home, Briefcase, Users, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const tabs = [
    { id: "marketplace", label: "Inicio", icon: Home },
    { id: "businesses", label: "Servicios", icon: Briefcase },
    { id: "rutas", label: "Go", isCenter: true },
    { id: "pool", label: "Pools", icon: Users },
    { id: "safeflow", label: "SafeFlow", icon: QrCode },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset max-w-md mx-auto z-50">
      <div className="flex items-end justify-around py-2 px-2 relative h-16">
        
        {/* Curva de fondo para que parezca que el nav envuelve al botón */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-[84px] h-[84px] bg-card rounded-full border-t border-border" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-[84px] h-[84px] bg-card rounded-full z-0"></div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          if (tab.isCenter) {
            return (
              <div key={tab.id} className="relative flex-1 flex justify-center h-full z-10">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className="absolute -top-7 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-transform active:scale-95 border border-gray-100"
                >
                  <img src="/icon-192.png" alt="Palenque Go" className="w-11 h-11 object-contain -translate-y-2" />
                  <span className="text-[15px] font-extrabold text-[#125238] absolute bottom-1.5 leading-none">Go</span>
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
                "flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all flex-1 h-full justify-end pb-1 z-10",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-[22px] h-[22px]", isActive && "stroke-[2.5]")} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
