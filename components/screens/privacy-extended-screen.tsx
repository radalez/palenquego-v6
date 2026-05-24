'use client'

import { useState } from 'react'
import { ChevronLeft, Lock, Eye, Trash2, Download, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'

interface PrivacyExtendedScreenProps {
  onBack: () => void
}

export function PrivacyExtendedScreen({ onBack }: PrivacyExtendedScreenProps) {
  const changePassword = useAppStore(state => state.changePassword)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: false,
    showLocation: false,
    allowMessages: true,
    twoFactorAuth: false,
  })

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('Todos los campos son obligatorios')
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Las contraseñas nuevas no coinciden')
      return
    }
    
    setIsChangingPassword(true)
    const result = await changePassword(passwordData.current, passwordData.new)
    setIsChangingPassword(false)

    if (result.success) {
      setPasswordData({ current: '', new: '', confirm: '' })
      setShowPasswordModal(false)
      alert("Contraseña actualizada con éxito")
    } else {
      setPasswordError(result.error || 'Error al cambiar la contraseña')
    }
  }

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
        <h1 className="text-2xl font-bold text-primary-foreground">Privacidad y Seguridad</h1>
      </header>

      <div className="flex-1 px-4 py-6 overflow-y-auto pb-20 space-y-6">
        {/* Password Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Contraseña</h2>
          <Button
            variant="outline"
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between"
          >
            <span>Cambiar contraseña</span>
            <Lock size={18} />
          </Button>
        </div>

        {/* Two-Factor Authentication */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Seguridad avanzada</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Autenticación de dos factores</p>
                <p className="text-xs text-muted-foreground">Aumenta la seguridad de tu cuenta</p>
              </div>
              <Switch
                checked={privacySettings.twoFactorAuth}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, twoFactorAuth: checked })
                }
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium">
                Nota: Deberás verificar con tu teléfono al iniciar sesión
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Privacidad del perfil</h2>
          <div className="space-y-3">
            {[
              {
                label: 'Perfil público',
                description: 'Otros usuarios pueden ver tu perfil',
                key: 'profilePublic',
              },
              {
                label: 'Mostrar ubicación',
                description: 'Compartir tu ubicación en reservas',
                key: 'showLocation',
              },
              {
                label: 'Permitir mensajes',
                description: 'Otros usuarios pueden contactarte',
                key: 'allowMessages',
              },
            ].map(({ label, description, key }) => (
              <div key={key} className="flex items-start justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={privacySettings[key as keyof typeof privacySettings]}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({
                      ...privacySettings,
                      [key]: checked,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Gestión de datos</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full flex items-center justify-between bg-transparent">
              <span className="flex items-center gap-2">
                <Download size={18} />
                Descargar mis datos
              </span>
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center justify-between text-destructive hover:text-destructive bg-transparent"
            >
              <span className="flex items-center gap-2">
                <Trash2 size={18} />
                Eliminar cuenta
              </span>
            </Button>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Sesiones activas</h2>
          <div className="space-y-3">
            {[
              { device: 'iPhone 14 Pro', location: 'San Salvador, SV', current: true },
              { device: 'Chrome en Windows', location: 'San Salvador, SV', current: false },
            ].map((session, idx) => (
              <div key={idx} className="flex items-start justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{session.device}</p>
                  <p className="text-xs text-muted-foreground">{session.location}</p>
                  {session.current && (
                    <p className="text-xs text-primary font-bold mt-1">Sesión actual</p>
                  )}
                </div>
                {!session.current && (
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Cerrar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-foreground mb-4">Cambiar contraseña</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Contraseña actual
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Nueva contraseña
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Confirmar contraseña
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1" disabled={isChangingPassword}>
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} className="flex-1" disabled={isChangingPassword}>
                {isChangingPassword ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            {passwordError && <p className="text-destructive text-sm text-center mt-4">{passwordError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
