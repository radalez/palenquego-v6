'use client'

import { Bell, ChevronLeft, Mail, MessageSquare, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'

interface NotificationsExtendedScreenProps {
  onBack: () => void
}

export function NotificationsExtendedScreen({ onBack }: NotificationsExtendedScreenProps) {
  const { notificationPreferences, updateNotificationPreferences } = useAppStore()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold text-primary-foreground">Notificaciones</h1>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto pb-20">
        {/* Notification Channels */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Canales de notificación</h2>
          <div className="space-y-3">
            {[
              { icon: Mail, label: 'Correo electrónico', key: 'canal_email' as const },
              { icon: Smartphone, label: 'Notificaciones push', key: 'canal_push' as const },
              { icon: MessageSquare, label: 'SMS', key: 'canal_sms' as const },
            ].map(({ icon: Icon, label, key }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-primary" />
                  <span className="font-medium text-foreground">{label}</span>
                </div>
                <Switch 
                  checked={notificationPreferences[key]} 
                  onCheckedChange={(checked) => updateNotificationPreferences({ [key]: checked })} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Tipos de alertas</h2>
          <div className="space-y-3">
            {[
              { label: 'Reservas confirmadas', key: 'alert_reservas' as const },
              { label: 'Actualizaciones de Pool', key: 'alert_pool' as const },
              { label: 'Remates Flow disponibles', key: 'alert_remates' as const },
              { label: 'Alertas Safe-Flow', key: 'alert_safeflow' as const },
              { label: 'Comisiones por recomendaciones', key: 'alert_recomendaciones' as const },
              { label: 'Promociones y ofertas', key: 'alert_promociones' as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <span className="font-medium text-foreground">{label}</span>
                <Switch
                  checked={notificationPreferences[key]}
                  onCheckedChange={(checked) => updateNotificationPreferences({ [key]: checked })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-muted/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Horas silenciosas</h3>
            <Switch
              checked={notificationPreferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updateNotificationPreferences({ quiet_hours_enabled: checked })}
            />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            No recibirás notificaciones sonoras durante estas horas
          </p>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-2">De</label>
              <input
                type="time"
                value={notificationPreferences.quiet_start || "22:00"}
                onChange={(e) => updateNotificationPreferences({ quiet_start: e.target.value })}
                disabled={!notificationPreferences.quiet_hours_enabled}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-2">Hasta</label>
              <input
                type="time"
                value={notificationPreferences.quiet_end || "07:00"}
                onChange={(e) => updateNotificationPreferences({ quiet_end: e.target.value })}
                disabled={!notificationPreferences.quiet_hours_enabled}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
