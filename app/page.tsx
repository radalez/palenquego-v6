"use client"

import { useState } from "react"
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
import { LoginScreen } from "@/components/screens/login-screen"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"
import { FavoritesScreen } from "@/components/screens/favorites-screen"
import { RecommendationsScreen } from "@/components/screens/recommendations-screen"
import { ShareInviteModal } from "@/components/share-invite-modal"
import { PoolPaymentModal } from "@/components/pool-payment-modal"
import { useAppStore } from "@/lib/store"

type ActiveTab =
  | "marketplace"
  | "businesses"
  | "pool"
  | "safeflow"
  | "profile"
  | "rutas"
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

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  }

  if (showOnboarding || !hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  const isMainTab =
    activeTab === "marketplace" || activeTab === "businesses" || activeTab === "pool" || activeTab === "safeflow" || activeTab === "profile" || activeTab === "rutas"

  return (
    <main className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Sidebar Menu */}
      <SidebarMenu activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />

      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto pb-20">
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
        {activeTab === "rutas" && <RoutesScreen onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />}
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

      {/* Bottom Navigation - only show on main tabs */}
      {isMainTab && <MobileNav activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as any)} />}
    </main>
  )
}
