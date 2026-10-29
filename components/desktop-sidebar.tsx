"use client"

import { useState, useEffect } from "react"
import { Store, Users, QrCode, Map, Briefcase, Crown, Zap, Star, Gem, LogOut, ChevronRight, ChevronLeft, CreditCard, Bell, Shield, HelpCircle, User, Home, ShieldCheck, Truck, Download, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface DesktopSidebarProps {
  activeTab: string
  onNavigate: (tab: string) => void
  onToggleCollapse?: () => void
}

export function DesktopSidebar({ activeTab, onNavigate, onToggleCollapse }: DesktopSidebarProps) {
  const { userPlan, logout, currentUser } = useAppStore()
  const [isMounted, setIsMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone
      setIsStandalone(standalone)
      if (standalone) {
        setInstalled(true)
      }

      if ("getInstalledRelatedApps" in navigator) {
        ;(navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (apps && apps.length > 0) {
            setInstalled(true)
          }
        }).catch(() => {})
      }

      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt)
      }

      const onBeforeInstall = (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        ;(window as any).deferredPrompt = e
      }

      const onPromptAvailable = (e: any) => {
        setDeferredPrompt(e.detail)
      }

      const onAppInstalled = () => {
        setInstalled(true)
        setDeferredPrompt(null)
      }

      window.addEventListener("beforeinstallprompt", onBeforeInstall)
      window.addEventListener("pwa-prompt-available", onPromptAvailable)
      window.addEventListener("appinstalled", onAppInstalled)

      return () => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstall)
        window.removeEventListener("pwa-prompt-available", onPromptAvailable)
        window.removeEventListener("appinstalled", onAppInstalled)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (isStandalone) {
      return
    }

    const prompt = deferredPrompt || (typeof window !== "undefined" && (window as any).deferredPrompt)
    if (prompt) {
      try {
        prompt.prompt()
        const choice = await prompt.userChoice
        if (choice && choice.outcome === "accepted") {
          setInstalled(true)
          setDeferredPrompt(null)
          if (typeof window !== "undefined") {
            (window as any).deferredPrompt = null
          }
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      setInstalled(true)
    }
  }

  const plans = [
    { id: "FREE", label: "Plan Gratis", icon: Zap, description: "Acceso básico", color: "bg-blue-100 text-blue-700" },
    { id: "ORO", label: "Partner ORO", icon: Star, description: "Gestor/Turoperador", color: "bg-amber-100 text-amber-700" },
    { id: "PLATINO", label: "Partner PLATINO", icon: Crown, description: "Socio VIP", color: "bg-purple-100 text-purple-700" },
    { id: "PRO", label: "Soporte PRO", icon: Gem, description: "Profesional", color: "bg-pink-100 text-pink-700" },
  ]

  const mainTabs = [
    { id: "map-explorer", label: "Inicio", icon: Home },
    { id: "marketplace", label: "Servicios", icon: Briefcase },
    { id: "pool", label: "Pool", icon: Users },
    { id: "safeflow", label: "Safe-Flow", icon: ShieldCheck },
    { id: "rutas", label: "Go", icon: Map },
  ]

  const secondaryTabs = [
    { id: "profile", label: "Mi Perfil", icon: User },
    { id: "planes", label: "Planes y Membresías", icon: Crown },
    { id: "pagos-extended", label: "Métodos de Pago", icon: CreditCard },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "privacidad-extended", label: "Privacidad y Seguridad", icon: Shield },
    { id: "soporte-extended", label: "Ayuda y Soporte", icon: HelpCircle },
  ]

  return (
    <div className="w-72 bg-card border-r border-border h-full flex flex-col overflow-y-auto">
      <div className="p-6">
        {/* Logo/Brand + Botón para ocultar menú */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img src="/icon-192.png" alt="Palenque Go" className="w-10 h-10 object-contain rounded-xl" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight leading-none">Palenque Go</h1>
              <span className="text-[10px] text-muted-foreground font-medium">Movilidad & Experiencias</span>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Ocultar menú lateral"
              className="w-8 h-8 rounded-xl bg-muted/60 hover:bg-emerald-50 hover:text-[#064e3b] text-muted-foreground flex items-center justify-center transition-all active:scale-95 border border-transparent hover:border-emerald-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sección de Chofer / Conductor */}
        {currentUser?.tipo === "CHOFER" && (
          <div className="mb-6 p-3.5 bg-gradient-to-br from-[#105238]/10 to-[#105238]/5 rounded-2xl border-2 border-[#105238]/30 shadow-sm">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#105238]">Modo Chofer</span>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                currentUser.kyc_status === 'APPROVED' ? "bg-emerald-100 text-emerald-800" :
                currentUser.kyc_status === 'PENDING' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300" :
                "bg-amber-100 text-amber-800"
              )}>
                {currentUser.kyc_status === 'APPROVED' ? 'Aprobado' :
                 currentUser.kyc_status === 'PENDING' ? 'En Revisión' : 'KYC Requerido'}
              </span>
            </div>
            <button
              onClick={() => onNavigate("conductor")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-sm shadow-sm",
                activeTab === "conductor" ? "bg-[#105238] text-white" : "bg-white dark:bg-card text-[#105238] hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Truck className={cn("w-5 h-5", activeTab === "conductor" ? "text-white" : "text-[#105238]")} />
                <span>Panel de Chofer</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        )}

        {/* Sección de Aliado Comercial */}
        {currentUser?.tipo === "ALIADO" && (
          <div className="mb-6 p-3.5 bg-gradient-to-br from-[#105238]/10 to-[#105238]/5 rounded-2xl border-2 border-[#105238]/30 shadow-sm">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#105238]">Modo Aliado</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                Comercio
              </span>
            </div>
            <a
              href={useAppStore.getState().accessToken ? `https://palenquego.com/admin/sso/?token=${useAppStore.getState().accessToken}` : "https://palenquego.com/admin/"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-sm shadow-sm bg-[#105238] text-white hover:bg-[#0c3e2b]"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-white" />
                <span>Panel de Negocios</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </a>
          </div>
        )}

        {/* Main Navigation */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Explorar</p>
          <div className="space-y-1">
            {mainTabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <IconComponent className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-border my-6" />

        {/* Current Plan Card */}
        {isMounted && (
          <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("planes")}>
            <p className="text-xs text-muted-foreground mb-2">Plan Actual</p>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <p className="font-semibold text-foreground">
                {currentUser?.plan || "Plan Gratis"}
              </p>
            </div>
          </div>
        )}

        {/* Secondary Navigation */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Configuración</p>
          <div className="space-y-1">
            {secondaryTabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group text-sm",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-foreground" />}
                </button>
              )
            })}
          </div>

          {/* Botón Instalar App de Escritorio (PWA Nativa) */}
          {!isStandalone && (
            <div className="pt-3">
              <button
                type="button"
                onClick={handleInstall}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all shadow-xs group border text-left cursor-pointer",
                  installed
                    ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:shadow-md active:scale-98"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    installed ? "bg-emerald-600 text-white" : "bg-white/20 text-white"
                  )}>
                    {installed ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Download className="w-4 h-4 stroke-[2.2]" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs leading-tight truncate">
                      {installed ? "App Instalada" : "Instalar App"}
                    </span>
                    <span className={cn(
                      "text-[10px] leading-tight truncate mt-0.5",
                      installed ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-emerald-100"
                    )}>
                      {installed ? "Modo Ventana Listo" : "Para tu PC / Escritorio"}
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  installed ? "text-emerald-600" : "text-white/80"
                )} />
              </button>
            </div>
          )}
        </div>

      </div>
      
      {/* Footer / Logout */}
      <div className="mt-auto p-6 border-t border-border bg-card">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}