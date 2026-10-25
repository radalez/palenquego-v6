'use client'

import { useState } from 'react'
import { X, Settings, LogOut, Layers, Heart, Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

interface HeaderWithMenuProps {
  title: string
  subtitle?: string
  onProfileClick?: () => void
  onNavigate?: (tab: string) => void
}

export function HeaderWithMenu({ title, subtitle, onProfileClick, onNavigate }: HeaderWithMenuProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { currentUser, logout, userFavorites, setMobileMenuOpen, unreadNotificationsCount } = useAppStore()

  const getAvatarUrl = (url: string | null | undefined) => {
    if (!url || url.length < 2) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `https://palenquego.com${url}`;
    return `https://palenquego.com/${url}`;
  }

  const avatarUrl = getAvatarUrl(currentUser?.avatar);

  const profileMenuItems = [
    { label: 'Mi Perfil', icon: Settings, id: 'profile' },
    { label: 'Planes y Membresías', icon: Layers, id: 'planes' },
  ]

  const handleProfileMenuClick = (id: string) => {
    if (id === 'logout') {
      logout()
      setIsProfileMenuOpen(false)
    } else {
      onNavigate?.(id)
      setIsProfileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Header */}
      <header className="bg-primary px-4 pt-4 pb-4 rounded-b-3xl relative z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all shrink-0 border border-white/10"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-primary-foreground leading-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-emerald-100/90 text-xs font-medium mt-0.5 tracking-tight truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Favorites Heart + Profile Avatar */}
          <div className="flex items-center gap-2">
            {/* Favorites Heart Button */}
            <button
              onClick={() => onNavigate?.("favoritos")}
              className="relative flex items-center gap-1 px-3 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
              title="Favoritos"
            >
              <Heart className="w-5 h-5 fill-white stroke-white" />
              <span className="text-sm font-semibold text-primary-foreground">{userFavorites.length}</span>
            </button>

            {/* Notifications Bell Button - a la derecha del corazon y a la izquierda inmediata del thumbnail */}
            <button
              type="button"
              onClick={() => onNavigate?.("notificaciones")}
              className="relative p-2.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 active:scale-95 transition-all border border-primary-foreground/20 text-white flex items-center justify-center shrink-0"
              title="Centro de Notificaciones"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-primary animate-pulse shadow-sm">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="relative w-12 h-12 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors flex items-center justify-center border-2 border-primary-foreground/30 font-bold text-primary-foreground text-lg overflow-hidden shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"
              )}
            </button>
          </div>
        </div>

        {/* Profile Dropdown Menu */}
        {isProfileMenuOpen && (
          <div className="absolute top-16 right-4 bg-card rounded-2xl shadow-xl border border-border w-56 z-50">
            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">Cuenta activa</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              {profileMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleProfileMenuClick(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-foreground text-sm font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}

              <div className="border-t border-border my-1"></div>

              <button
                onClick={() => handleProfileMenuClick('logout')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Overlay when menu is open */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsProfileMenuOpen(false)}
        ></div>
      )}
    </>
  )
}
