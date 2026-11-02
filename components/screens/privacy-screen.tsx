"use client"

import { Lock, Eye, Key, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrivacyScreenProps {
  onBack: () => void
}

export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  const securityItems = [
    {
      icon: Key,
      title: "Cambiar Contraseña",
      description: "Actualiza tu contraseña regularmente",
    },
    {
      icon: Lock,
      title: "Autenticación de Dos Factores",
      description: "Protege tu cuenta con 2FA",
    },
    {
      icon: Eye,
      title: "Privacidad del Perfil",
      description: "Controla quién ve tu información",
    },
    {
      icon: Shield,
      title: "Sesiones Activas",
      description: "Gestiona tus dispositivos conectados",
    },
  ]

  const privacySettings = [
    { label: "Mostrar mi perfil en búsquedas", enabled: true },
    { label: "Permitir que otros me agreguen a Pools", enabled: true },
    { label: "Mostrar mis recomendaciones públicamente", enabled: false },
    { label: "Compartir datos de ubicación con socios", enabled: true },
    { label: "Permitir cookies de análisis", enabled: true },
  ]

  return (
    <div className="flex flex-col min-h-full items-center">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-6 w-full">
        <div className="max-w-3xl mx-auto w-full">
          <button onClick={onBack} className="mb-4 text-primary-foreground hover:opacity-80">
            ← Atrás
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Privacidad y Seguridad</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Protege tu cuenta y datos personales</p>
        </div>
      </div>

      {/* Security Actions */}
      <div className="px-4 py-6 w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">SEGURIDAD</h3>
        <div className="space-y-3">
          {securityItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={idx}
                className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
              </button>
            )
          })}
        </div>

        {/* Privacy Settings */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">PRIVACIDAD</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {privacySettings.map((setting, idx) => (
              <div key={idx} className="p-4 flex items-center gap-3">
                <input type="checkbox" defaultChecked={setting.enabled} className="w-4 h-4 accent-primary cursor-pointer" />
                <span className="text-sm text-foreground">{setting.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">DATOS Y CUENTA</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-10 bg-transparent border-border hover:bg-muted">
              Descargar mis datos
            </Button>
            <Button variant="outline" className="w-full h-10 bg-transparent border-red-200 text-red-600 hover:bg-red-50">
              Eliminar cuenta permanentemente
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mt-6">
          <p className="text-xs text-foreground">
            Tu privacidad es importante. Consultamos con leyes de protección de datos locales e internacionales (GDPR, CCPA).
          </p>
        </div>
      </div>

      <div className="pb-24" />
    </div>
  )
}
