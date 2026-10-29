"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Store, Users, QrCode, Map, Briefcase, Crown, Zap, Star, Gem, LogOut, ChevronRight, ChevronLeft, CreditCard, Bell, Shield, HelpCircle, User, Home, ShieldCheck, Truck, Download, Check, X, Laptop, CheckCircle2 } from "lucide-react"
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
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone
      setIsStandalone(standalone)
      if (standalone) {
        setIsInstalled(true)
      }

      if ("getInstalledRelatedApps" in navigator) {
        ;(navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (apps && apps.length > 0) {
            setIsInstalled(true)
          }
        }).catch(() => {})
      }

      if ((window as any).deferredPrompt) {
        setInstallPrompt((window as any).deferredPrompt)
      }

      const onBeforeInstall = (e: any) => {
        e.preventDefault()
        setInstallPrompt(e)
        ;(window as any).deferredPrompt = e
      }

      const onPromptAvailable = (e: any) => {
        setInstallPrompt(e.detail)
      }

      const onAppInstalled = () => {
        setIsInstalled(true)
        setInstallPrompt(null)
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

  const handleInstallApp = async () => {
    const standalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone)
    if (standalone) {
      setIsStandalone(true)
      setIsInstalled(true)
      setShowInstallGuide(true)
      return
    }

    const prompt = installPrompt || (typeof window !== "undefined" && (window as any).deferredPrompt)
    if (prompt) {
      try {
        await prompt.prompt()
        const choice = await prompt.userChoice
        if (choice && choice.outcome === "accepted") {
          setIsInstalled(true)
          setInstallPrompt(null)
          if (typeof window !== "undefined") {
            (window as any).deferredPrompt = null
          }
          return
        }
      } catch (err) {
        setShowInstallGuide(true)
        return
      }
    }
    setShowInstallGuide(true)
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

          {/* Botón Descargar / Instalar App de Escritorio */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleInstallApp}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all shadow-xs group border text-left cursor-pointer",
                isStandalone
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : isInstalled
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:shadow-md active:scale-98"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  isStandalone || isInstalled ? "bg-emerald-600 text-white" : "bg-white/20 text-white"
                )}>
                  {isStandalone ? (
                    <Laptop className="w-4 h-4 stroke-[2.2]" />
                  ) : isInstalled ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Download className="w-4 h-4 stroke-[2.2]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs leading-tight truncate">
                    {isStandalone ? "Modo Escritorio" : isInstalled ? "App de Escritorio" : "Descargar App"}
                  </span>
                  <span className={cn(
                    "text-[10px] leading-tight truncate mt-0.5",
                    isStandalone || isInstalled ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-emerald-100"
                  )}>
                    {isStandalone ? "Ventana Activa" : isInstalled ? "Instalada en tu PC" : "Instalar en tu PC"}
                  </span>
                </div>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                isStandalone || isInstalled ? "text-emerald-600" : "text-white/80"
              )} />
            </button>
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

      {/* Guía Modal de Instalación con createPortal (aislado completamente del stacking context del sidebar) */}
      {showInstallGuide && isMounted && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowInstallGuide(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle glow decoration */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Botón cerrar */}
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/icon-192.png" alt="PalenqueGo" className="w-8 h-8 rounded-xl object-contain" />
              </div>
              <div className="min-w-0 pr-6">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                  {isStandalone
                    ? "PalenqueGo en tu Escritorio"
                    : isInstalled
                    ? "PalenqueGo ya está en tu Equipo"
                    : "Instalar PalenqueGo en tu PC"}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                  {isStandalone
                    ? "Modo nativo activo"
                    : isInstalled
                    ? "Aplicación registrada"
                    : "Aplicación rápida para Windows y Mac"}
                </p>
              </div>
            </div>

            {/* Contenido según el estado */}
            {isStandalone ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    <strong className="block font-bold text-sm mb-1 text-emerald-950 dark:text-emerald-100">¡App activa en modo escritorio!</strong>
                    Ya estás ejecutando PalenqueGo en su ventana nativa de alta velocidad, sin barras de navegación y con acceso directo optimizado.
                  </div>
                </div>
              </div>
            ) : isInstalled ? (
              <div className="space-y-3 mb-6">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                    <span className="font-bold block text-sm mb-0.5 text-emerald-900 dark:text-emerald-100">La aplicación ya está instalada</span>
                    Para abrirla como aplicación independiente:
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                    <strong>Desde esta pestaña:</strong> Haz clic en el icono de monitor / app <Laptop className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" /> en el extremo derecho de la barra de direcciones.
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                    <strong>Desde Windows o Mac:</strong> Abre el menú Inicio de tu sistema y busca <strong>"PalenqueGo"</strong> para abrir la app.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {/* Botón de instalación con 1 clic si el prompt está listo */}
                {installPrompt && (
                  <div className="mb-2">
                    <Button
                      onClick={async () => {
                        try {
                          await installPrompt.prompt()
                          const choice = await installPrompt.userChoice
                          if (choice && choice.outcome === "accepted") {
                            setIsInstalled(true)
                            setInstallPrompt(null)
                            if (typeof window !== "undefined") {
                              (window as any).deferredPrompt = null
                            }
                            setShowInstallGuide(false)
                          }
                        } catch (e) {
                          // Handled
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Instalar Ahora con 1 Clic</span>
                    </Button>
                  </div>
                )}

                <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                    <strong>Barra de direcciones:</strong> En la parte superior derecha de tu navegador (Chrome o Edge), haz clic en el icono de instalación <Download className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" /> o monitor y pulsa <strong>"Instalar"</strong>.
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-200 dark:border-zinc-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                    <strong>Menú del navegador:</strong> Haz clic en los tres puntos (<strong>⋮</strong> o <strong>…</strong>) arriba a la derecha ➔ selecciona <strong>"Aplicaciones"</strong> ➔ <strong>"Instalar PalenqueGo"</strong>.
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                    <strong>¿Estás en ventana InPrivate / Incógnito?</strong> Los navegadores desactivan la instalación en modo privado. Para instalarla, abre PalenqueGo en una ventana normal.
                  </p>
                </div>
              </div>
            )}

            {/* Botón de cierre */}
            <Button
              onClick={() => setShowInstallGuide(false)}
              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl h-10 text-xs shadow-sm cursor-pointer"
            >
              Entendido
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}