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

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("marketplace")

  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const currentUser = useAppStore((state) => state.currentUser)

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [authView, setAuthView] = useState<"login" | "register">("register")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Restaurar la pestaña previa o redirigir al chofer
  useEffect(() => {
    const savedTab = sessionStorage.getItem("palenque-active-tab") as ActiveTab;
    if (savedTab) {
      setActiveTab(savedTab);
    } else if (currentUser?.tipo === 'CHOFER') {
      const gpsActive = sessionStorage.getItem('chofer-gps-active');
      setActiveTab(gpsActive ? 'rutas-classic' as ActiveTab : 'conductor' as ActiveTab);
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
        {currentUser?.tipo === 'CHOFER' && activeTab !== 'conductor' && <DriverGPSWidget />}
        {/* Mobile Sidebar Menu (hamburger) */}
        <div className="lg:hidden">
          <SidebarMenu activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
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

        {/* Panel del Conductor */}
        {activeTab === "conductor" && <DriverScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}
        
        {/* Vista Clásica de Rutas */}
        {activeTab === "rutas-classic" && (
          <div className="w-full h-full relative">
            {currentUser?.tipo !== 'CHOFER' && (
              <button 
                onClick={() => setActiveTab("businesses")}
                className="absolute z-50 top-4 left-4 bg-background/80 backdrop-blur rounded-full p-2"
              >
                ← Volver
              </button>
            )}
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
