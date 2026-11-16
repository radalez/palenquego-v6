"use client"

import { useState, useEffect, useRef } from "react"
import {
  Store,
  Users,
  QrCode,
  Map,
  Briefcase,
  Crown,
  Zap,
  Star,
  Gem,
  LogOut,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  User,
  Compass,
  ShieldCheck,
  Truck,
  Download,
  Check,
  Heart,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface DesktopSidebarProps {
  activeTab: string
  onNavigate: (tab: string) => void
  onToggleCollapse?: () => void
}

export function DesktopFloatingIconRail({
  activeTab,
  onNavigate,
  onExpand,
}: {
  activeTab: string
  onNavigate: (tab: string) => void
  onExpand: () => void
}) {
  const { unreadNotificationsCount, userFavorites } = useAppStore()
  const likesCount = userFavorites?.length || 0

  const mainRailTabs = [
    { id: "marketplace", label: "Experiencias", icon: Briefcase },
    { id: "map-explorer", label: "Explorar", icon: Compass },
    { id: "pool", label: "Mis Viajes", icon: Users },
    { id: "safeflow", label: "Safe-Flow", icon: ShieldCheck },
    { id: "rutas", label: "Go", icon: Map },
  ]

  return (
    <div className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 z-50 flex-col items-center py-3 px-2 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-[#aeb6a1]/80 shadow-[0_14px_38px_rgba(16,82,56,0.18)] rounded-3xl gap-2 animate-in fade-in duration-200 select-none">
      {/* 1. ARRIBA: Campanita (Notificaciones) */}
      <button
        type="button"
        onClick={() => onNavigate("notificaciones")}
        className={cn(
          "group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
          activeTab === "notificaciones" || activeTab === "notificaciones-extended"
            ? "bg-[#105238] text-[#8ee01a] shadow-sm"
            : "bg-[#eaf0e2]/70 hover:bg-[#105238] text-[#105238] hover:text-[#8ee01a]",
        )}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {(unreadNotificationsCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#105238] text-[#8ee01a] border-2 border-white text-[10px] font-black flex items-center justify-center">
            {unreadNotificationsCount}
          </span>
        )}
        <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 absolute left-full ml-3 bg-[#105238] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg border border-[#8ee01a]/40 z-50">
          Notificaciones{(unreadNotificationsCount ?? 0) > 0 ? ` (${unreadNotificationsCount})` : ""}
        </span>
      </button>

      {/* 2. ARRIBA: Corazoncito (Mis Likes / Favoritos) */}
      <button
        type="button"
        onClick={() => onNavigate("favoritos")}
        className={cn(
          "group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
          activeTab === "favoritos"
            ? "bg-[#105238] text-[#8ee01a] shadow-sm"
            : "bg-[#eaf0e2]/70 hover:bg-[#105238] text-[#105238] hover:text-[#8ee01a]",
        )}
        aria-label="Mis Likes"
      >
        <Heart className="w-5 h-5 fill-current" />
        {likesCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8ee01a] text-[#105238] border-2 border-white text-[10px] font-black flex items-center justify-center">
            {likesCount}
          </span>
        )}
        <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 absolute left-full ml-3 bg-[#105238] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg border border-[#8ee01a]/40 z-50">
          Mis Likes ({likesCount})
        </span>
      </button>

      <div className="w-7 h-px bg-[#aeb6a1]/60 my-0.5" />

      {/* 3. ICONOS PRINCIPALES: Experiencias, Explorar, Mis Viajes, Safe-Flow, Go */}
      {mainRailTabs.map((item) => {
        const Icon = item.icon
        const isActive =
          activeTab === item.id ||
          (item.id === "marketplace" && activeTab === "servicios") ||
          (item.id === "rutas" && activeTab === "rutas-classic")
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={cn(
              "group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
              isActive
                ? "bg-[#105238] text-[#8ee01a] shadow-md ring-2 ring-[#8ee01a]/50"
                : "hover:bg-[#eaf0e2] text-muted-foreground hover:text-[#105238]",
            )}
            aria-label={item.label}
          >
            <Icon className="w-5 h-5" />
            <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 absolute left-full ml-3 bg-[#105238] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg border border-[#8ee01a]/40 z-50">
              {item.label}
            </span>
          </button>
        )
      })}

      <div className="w-7 h-px bg-[#aeb6a1]/60 my-0.5" />

      {/* 4. ÚLTIMO: Círculo con tres puntitos + "Más" debajo para abrir todo el menú */}
      <button
        type="button"
        onClick={onExpand}
        className="group relative flex flex-col items-center justify-center pt-0.5 cursor-pointer"
        aria-label="Más opciones"
      >
        <div className="w-10 h-10 rounded-full bg-[#eaf0e2] group-hover:bg-[#105238] text-[#105238] group-hover:text-[#8ee01a] border border-[#105238]/25 flex items-center justify-center transition-all shadow-2xs">
          <MoreHorizontal className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black text-[#105238] dark:text-[#8ee01a] leading-none mt-1">
          Más
        </span>
        <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 absolute left-full ml-3 bg-[#105238] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg border border-[#8ee01a]/40 z-50">
          Abrir menú completo
        </span>
      </button>
    </div>
  )
}

export function DesktopSidebar({ activeTab, onNavigate, onToggleCollapse }: DesktopSidebarProps) {
  const { userPlan, logout, currentUser } = useAppStore()
  const [isMounted, setIsMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null)
  const isHoveringSidebarRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  // Auto-collapse full menu into the Floating Icon Rail briefly after the user scrolls down the main page
  useEffect(() => {
    if (typeof window === "undefined" || !onToggleCollapse) return
    let collapseTimer: ReturnType<typeof setTimeout> | null = null

    const handlePageScroll = (e: Event) => {
      if (isHoveringSidebarRef.current) return
      const target = e.target as HTMLElement | null
      if (target && sidebarContainerRef.current && sidebarContainerRef.current.contains(target)) {
        return
      }
      const scrollEl =
        target && target instanceof HTMLElement && target.scrollTop > 0
          ? target
          : (document.querySelector(".overflow-y-auto") as HTMLElement | null)
      const currentY = scrollEl?.scrollTop || window.scrollY || document.documentElement.scrollTop || 0

      if (currentY > 110 && currentY > lastScrollTopRef.current + 30) {
        if (!collapseTimer) {
          collapseTimer = setTimeout(() => {
            if (!isHoveringSidebarRef.current) {
              onToggleCollapse()
            }
          }, 850)
        }
      }
      lastScrollTopRef.current = currentY
    }

    window.addEventListener("scroll", handlePageScroll, { capture: true, passive: true })
    return () => {
      if (collapseTimer) clearTimeout(collapseTimer)
      window.removeEventListener("scroll", handlePageScroll, { capture: true } as EventListenerOptions)
    }
  }, [onToggleCollapse])

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      const standalone = window.matchMedia("(display-mode: standalone)").matches 
        || window.matchMedia("(display-mode: window-controls-overlay)").matches
        || !!(navigator as any).standalone
      setIsStandalone(standalone)
      if (standalone) {
        setInstalled(true)
      }

      if ("getInstalledRelatedApps" in navigator) {
        ;(navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (apps && apps.length > 0) {
            setInstalled(true)
          } else if (!standalone) {
            setInstalled(false)
          }
        }).catch(() => {})
      }

      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt)
        if (!standalone) {
          setInstalled(false)
        }
      }

      const onBeforeInstall = (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        ;(window as any).deferredPrompt = e
        if (!standalone) {
          setInstalled(false)
        }
      }

      const onPromptAvailable = (e: any) => {
        setDeferredPrompt(e.detail)
        if (!standalone) {
          setInstalled(false)
        }
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
    }
  }

  const isAppInstalled = installed || isStandalone

  const plans = [
    { id: "FREE", label: "Plan Gratis", icon: Zap, description: "Acceso básico", color: "bg-blue-100 text-blue-700" },
    { id: "ORO", label: "Partner ORO", icon: Star, description: "Gestor/Turoperador", color: "bg-amber-100 text-amber-700" },
    { id: "PLATINO", label: "Partner PLATINO", icon: Crown, description: "Socio VIP", color: "bg-purple-100 text-purple-700" },
    { id: "PRO", label: "Soporte PRO", icon: Gem, description: "Profesional", color: "bg-pink-100 text-pink-700" },
  ]

  const mainTabs = [
    { id: "marketplace", label: "Experiencias", icon: Briefcase },
    { id: "map-explorer", label: "Explorar", icon: Compass },
    { id: "pool", label: "Mis Viajes", icon: Users },
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
    <div
      ref={sidebarContainerRef}
      onMouseEnter={() => {
        isHoveringSidebarRef.current = true
      }}
      onMouseLeave={() => {
        isHoveringSidebarRef.current = false
      }}
      className="w-72 bg-card border-r border-border/30 h-full flex flex-col overflow-y-auto hover-scrollbar"
    >
      <div className="p-6">
        {/* Logo/Brand + Botón para ocultar menú */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <img 
              src="/icon-192.png" 
              alt="Palenque Go" 
              className="w-10 h-10 object-contain rounded-xl shadow-xs shrink-0" 
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-extrabold text-[#105238] dark:text-[#8ee01a] tracking-tight leading-tight">
                Palenque Go
              </h1>
              <span className="text-xs text-muted-foreground font-semibold tracking-tight -mt-0.5">
                Movilidad & Experiencias
              </span>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Ocultar menú lateral"
              className="w-8 h-8 rounded-full bg-muted/60 hover:bg-emerald-50 hover:text-[#064e3b] text-muted-foreground flex items-center justify-center transition-all active:scale-95 border border-border/40 hover:border-emerald-200 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
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

        {/* Sección de Recepción (Dueños y Personal Autorizado) */}
        {(currentUser?.es_recepcion || currentUser?.es_aliado || currentUser?.tipo === "ALIADO" || (currentUser?.reception_stores?.length ?? 0) > 0) && (
          <div className="mb-6 p-3.5 bg-[#eaf0e2]/70 dark:bg-[#105238]/15 rounded-2xl border border-[#aeb6a1]/60 shadow-2xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#105238] dark:text-[#8ee01a]">
                Recepción
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-[#105238] text-[#8ee01a]">
                QR & Cobro
              </span>
            </div>
            <button
              onClick={() => onNavigate("recepcion")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-sm shadow-xs cursor-pointer",
                activeTab === "recepcion"
                  ? "bg-[#105238] text-white"
                  : "bg-white dark:bg-card text-[#105238] hover:bg-[#eaf0e2]",
              )}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className={cn("w-5 h-5", activeTab === "recepcion" ? "text-[#8ee01a]" : "text-[#105238]")} />
                <span>Validar QR / Recepción</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
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
                {currentUser?.plan || ((currentUser?.tipo === "ALIADO" || currentUser?.es_aliado) ? "Bronce" : (userPlan || "Plan Gratis"))}
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

          {/* Sección App de Escritorio / Estado de Instalación */}
          <div className="pt-3">
            {isAppInstalled ? (
              /* Mensaje / Indicador Informativo (Informativo, sin flecha de botón de acción) */
              <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-xs select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs leading-tight truncate text-emerald-900 dark:text-emerald-200">
                      App Instalada
                    </span>
                    <span className="text-[10px] leading-tight truncate mt-0.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      Modo Ventana Listo
                    </span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Activo" />
              </div>
            ) : (
              /* Botón Interactivo de Instalación (Solo cuando NO está instalada) */
              <button
                type="button"
                onClick={handleInstall}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs group cursor-pointer transition-all hover:shadow-md active:scale-98 border border-transparent text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Download className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs leading-tight truncate">
                      Instalar App
                    </span>
                    <span className="text-[10px] leading-tight truncate mt-0.5 text-emerald-100">
                      Para tu PC / Escritorio
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 text-white/80" />
              </button>
            )}
          </div>
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