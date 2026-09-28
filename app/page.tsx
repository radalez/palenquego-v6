"use client"

import { useState, useEffect } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { SidebarMenu } from "@/components/sidebar-menu"
import { MarketplaceScreen } from "@/components/screens/marketplace-screen"
import { BusinessesScreen } from "@/components/screens/businesses-screen"
import { PoolScreen } from "@/components/screens/pool-screen"
import { SafeFlowScreen } from "@/components/screens/safe-flow-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { BillingScreen } from "@/components/screens/billing-screen"
import { PlansScreen } from "@/components/screens/plans-screen"
import { PaymentsScreen } from "@/components/screens/payments-screen"
import { PaymentsExtendedScreen } from "@/components/screens/payments-extended-screen"
import { NotificationsScreen } from "@/components/screens/notifications-screen"
import { NotificationsExtendedScreen } from "@/components/screens/notifications-extended-screen"
import { PrivacyScreen } from "@/components/screens/privacy-screen"
import { PrivacyExtendedScreen } from "@/components/screens/privacy-extended-screen"
import { SupportScreen } from "@/components/screens/support-screen"
import { SupportExtendedScreen } from "@/components/screens/support-extended-screen"
import { RoutesScreen } from "@/components/screens/routes-screen"
import { SwipeGoScreen } from "@/components/screens/swipe-go-screen"
import { ExploreMapScreen } from "@/components/screens/explore-map-screen"
import { LoginScreen } from "@/components/screens/login-screen"
import { RegisterScreen } from "@/components/screens/register-screen"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"
import { FavoritesScreen } from "@/components/screens/favorites-screen"
import { RecommendationsScreen } from "@/components/screens/recommendations-screen"
import { DriverGPSWidget } from "@/components/driver-gps-widget"
import { DriverScreen } from "@/components/screens/driver-screen"
import { ShareInviteModal } from "@/components/share-invite-modal"
import { PoolPaymentModal } from "@/components/pool-payment-modal"
import { InstallPWABanner } from "@/components/install-pwa-banner"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useAppStore } from "@/lib/store"
import { Truck, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ActiveTab =
  | "marketplace"
  | "businesses"
  | "pool"
  | "safeflow"
  | "profile"
  | "rutas"
  | "rutas-classic"
  | "conductor"
  | "billing"
  | "planes"
  | "pagos"
  | "pagos-extended"
  | "notificaciones"
  | "notificaciones-extended"
  | "privacidad"
  | "privacidad-extended"
  | "soporte"
  | "soporte-extended"
  | "favoritos"
  | "recomendaciones"
  | "map-explorer"

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("map-explorer")

  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const currentUser = useAppStore((state) => state.currentUser)

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [authView, setAuthView] = useState<"login" | "register">("register")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showChoferModal, setShowChoferModal] = useState(false)

  // Mostrar modal de bienvenida explicativo únicamente a choferes con KYC sin verificar (UNVERIFIED)
  useEffect(() => {
    if (currentUser?.tipo === 'CHOFER' && (currentUser?.kyc_status === 'UNVERIFIED' || !currentUser?.kyc_status)) {
      const dismissed = sessionStorage.getItem('chofer-modal-dismissed')
      if (!dismissed) {
        setShowChoferModal(true)
      }
    }
  }, [currentUser])

  // Restaurar la pestaña previa o redirigir al chofer
  useEffect(() => {
    if (currentUser?.tipo === 'CHOFER') {
      const gpsActive = sessionStorage.getItem('chofer-gps-active');
      if (!gpsActive) {
        // Obligar a ir al panel del chofer si el GPS está apagado
        setActiveTab('conductor' as ActiveTab);
        return;
      }
    }
    
    // Si no es chofer, o si es chofer pero el GPS ya está activo, respetamos la pestaña guardada
    const savedTab = sessionStorage.getItem("palenque-active-tab") as ActiveTab;
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, [currentUser]);

  // Guardar la pestaña activa actual en sessionStorage
  useEffect(() => {
    sessionStorage.setItem("palenque-active-tab", activeTab);
  }, [activeTab]);
  const [selectedPoolForShare, setSelectedPoolForShare] = useState<any>(null)
  const [selectedPoolForPayment, setSelectedPoolForPayment] = useState<any>(null)
  
  // Para soporte de queries en URL (si se necesita)
  const [, setQueryParams] = useState<Record<string, string>>({})

  const handleLoginSuccess = () => {
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = () => {
    completeOnboarding()
    setShowOnboarding(false)
  }

  const handleNavigateToBilling = () => {
    setActiveTab("billing")
  }

  const handleBack = () => {
    setActiveTab("profile")
  }

  const handleOpenShare = (pool: any) => {
    setSelectedPoolForShare(pool)
    setShowShareModal(true)
  }

  const handleOpenPayment = (pool: any) => {
    setSelectedPoolForPayment(pool)
    setShowPaymentModal(true)
  }

  if (!isAuthenticated) {
    return authView === "register" ? (
      <RegisterScreen 
        onRegisterSuccess={() => setAuthView("login")} 
        onBackToLogin={() => setAuthView("login")} 
      />
    ) : (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess} 
        onShowRegister={() => setAuthView("register")} 
      />
    )
  }

  if (showOnboarding || !hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  const isMainTab =
    activeTab === "marketplace" || activeTab === "businesses" || activeTab === "pool" || activeTab === "safeflow" || activeTab === "profile" || activeTab === "rutas" || activeTab === "rutas-classic"

  const isMapExplorer = activeTab === "map-explorer"

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen flex-shrink-0 shadow-lg relative z-20">
        <DesktopSidebar activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden w-full lg:max-w-none max-w-md mx-auto shadow-2xl lg:shadow-none bg-background lg:border-l lg:border-border">
        <InstallPWABanner />

        {/* Widget GPS flotante para choferes (solo cuando NO están en su panel) */}
        {currentUser?.tipo === 'CHOFER' && activeTab !== 'conductor' && <DriverGPSWidget onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}
        {/* Mobile Sidebar Menu (hamburger) — hidden on map explorer */}
        {!isMapExplorer && (
          <div className="lg:hidden">
            <SidebarMenu activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
          </div>
        )}

        {/* Screen Content */}
        <div className={`flex-1 overflow-y-auto ${isMapExplorer ? '' : 'pb-20 lg:pb-0'}`}>
        {activeTab === "marketplace" && (
          <MarketplaceScreen
            onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}
        {activeTab === "businesses" && (
          <BusinessesScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
        )}
        {activeTab === "pool" && <PoolScreen onOpenShare={handleOpenShare} onOpenPayment={handleOpenPayment} onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}
        {activeTab === "safeflow" && <SafeFlowScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}
        
        {/* Nueva vista Tinder-Style para "Go" (rutas) */}
        {activeTab === "rutas" && <SwipeGoScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}

        {/* Vista Exploración Mapa Rutas */}
        {activeTab === "map-explorer" && (
          <ExploreMapScreen
             onBack={() => setActiveTab("rutas")}
             onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {/* Panel del Conductor */}
        {activeTab === "conductor" && <DriverScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}
        
        {/* Vista Clásica de Rutas */}
        {activeTab === "rutas-classic" && (
          <div className="w-full h-full relative">
            <RoutesScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
          </div>
        )}
        {activeTab === "profile" && <ProfileScreen onNavigateToBilling={handleNavigateToBilling} onNavigateToSettings={(tab) => setActiveTab(tab as ActiveTab)} />}
        {activeTab === "favoritos" && <FavoritesScreen onBack={() => setActiveTab("profile")} />}
        {activeTab === "recomendaciones" && <RecommendationsScreen onBack={() => setActiveTab("profile")} />}
        {activeTab === "billing" && <BillingScreen onBack={handleBack} />}
        {activeTab === "planes" && <PlansScreen onBack={handleBack} />}
        {activeTab === "pagos" && <PaymentsScreen onBack={handleBack} />}
        {activeTab === "pagos-extended" && <PaymentsExtendedScreen onBack={() => setActiveTab("pagos")} />}
        {activeTab === "notificaciones" && <NotificationsScreen onBack={handleBack} />}
        {activeTab === "notificaciones-extended" && <NotificationsExtendedScreen onBack={() => setActiveTab("notificaciones")} />}
        {activeTab === "privacidad" && <PrivacyScreen onBack={handleBack} />}
        {activeTab === "privacidad-extended" && <PrivacyExtendedScreen onBack={() => setActiveTab("privacidad")} />}
        {activeTab === "soporte" && <SupportScreen onBack={handleBack} />}
        {activeTab === "soporte-extended" && <SupportExtendedScreen onBack={() => setActiveTab("soporte")} />}
      </div>

      {/* Modals */}
      {showShareModal && selectedPoolForShare && (
        <ShareInviteModal
          poolId={selectedPoolForShare.id}
          poolName={selectedPoolForShare.serviceName}
          spotPrice={selectedPoolForShare.totalPrice / selectedPoolForShare.targetMembers}
          spotsLeft={selectedPoolForShare.targetMembers - selectedPoolForShare.currentMembers}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showPaymentModal && selectedPoolForPayment && (
        <PoolPaymentModal
          poolId={selectedPoolForPayment.id}
          poolName={selectedPoolForPayment.serviceName}
          totalPrice={selectedPoolForPayment.totalPrice}
          targetMembers={selectedPoolForPayment.targetMembers}
          currentMembers={selectedPoolForPayment.currentMembers}
          onClose={() => {
            setShowPaymentModal(false)
            setActiveTab("pool")
          }}
          onSuccess={() => {
            console.log("[v0] Pool payment successful")
          }}
        />
      )}

      {/* Modal de Bienvenida para Choferes */}
      {showChoferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border-2 border-[#105238]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => {
                sessionStorage.setItem('chofer-modal-dismissed', 'true');
                setShowChoferModal(false);
              }}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#105238]/10 text-[#105238] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8" />
              </div>

              <span className="inline-block px-3 py-1 bg-[#105238]/10 text-[#105238] text-[11px] font-black rounded-full uppercase tracking-wider mb-2">
                Equipo Oficial de Transporte
              </span>
              
              <h3 className="text-xl font-black text-foreground mb-2">¡Bienvenido a PalenqueGo!</h3>
              <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                Has sido registrado como conductor de transporte. Para comenzar a recibir rutas asignadas y operar el GPS de tu vehículo, necesitamos que completes tu <strong>verificación de identidad (KYC)</strong> subiendo las fotos de tu licencia y documento de identidad.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    sessionStorage.setItem('chofer-modal-dismissed', 'true');
                    setShowChoferModal(false);
                    setActiveTab('conductor');
                  }}
                  className="w-full h-12 bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold rounded-xl shadow-md text-sm"
                >
                  Subir Mis Documentos Ahora &rarr;
                </Button>
                <div>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('chofer-modal-dismissed', 'true');
                      setShowChoferModal(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold py-1.5 transition-colors"
                  >
                    Lo haré más tarde
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - only show on main tabs for mobile */}
      {isMainTab && (
        <div className="lg:hidden">
          <MobileNav activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as any)} />
        </div>
      )}
      </main>
    </div>
  )
}
