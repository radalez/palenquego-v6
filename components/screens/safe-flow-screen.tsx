"use client"

import { useState, useEffect } from "react"
import { QrCode, Shield, Bell, CheckCircle2, AlertTriangle, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { HeaderWithMenu } from "@/components/header-with-menu"
import { useAppStore } from "@/lib/store"
import { AddContactModal } from "@/components/add-contact-modal"

interface Contact {
  id: number
  name: string
  phone: string
  avatar: string
  notifyOnArrival: boolean
}

interface SafeFlowScreenProps {
  onNavigate?: (tab: string) => void
}

export function SafeFlowScreen({ onNavigate }: SafeFlowScreenProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const { guardians, fetchGuardians } = useAppStore()
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 1, name: "Mamá", phone: "+503 7890 1234", avatar: "M", notifyOnArrival: true },
    { id: 2, name: "Papá", phone: "+503 7890 5678", avatar: "P", notifyOnArrival: true },
    { id: 3, name: "Ana (Hermana)", phone: "+503 7890 9012", avatar: "A", notifyOnArrival: false },
  ])


  useEffect(() => {
    fetchGuardians()
  }, [])

  const toggleNotify = (id: number) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, notifyOnArrival: !c.notifyOnArrival } : c)))
  }

const handleRealScan = () => {
    setIsScanning(true)
    setScanResult(null)

    // 1. Obtenemos la ubicación real del celular
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta GPS")
      setIsScanning(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // 2. Aquí simulamos que el QR leyó la "Parada ID 1"
        // En el futuro, el valor '1' vendrá de lo que lea la cámara
        const result = await useAppStore.getState().scanCheckpoint(1, "1", latitude, longitude)

        if (result) {
          setIsScanning(false)
          setScanResult("success")
        } else {
          setIsScanning(false)
          setScanResult("error")
        }
      },
      (error) => {
        console.error("Error de GPS:", error)
        setIsScanning(false)
        setScanResult("error")
      }
    )
  }

  const resetScan = () => {
    setScanResult(null)
    setIsScanning(false)
  }

  return (
    <div className="flex flex-col">
      <HeaderWithMenu title="Safe-Flow" onNavigate={onNavigate} />
      <div className="px-4 py-2">
        <p className="text-muted-foreground text-sm">Seguridad en tus viajes</p>
      </div>

      {/* QR Scanner Section */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          {!isScanning && !scanResult && (
            <>
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-primary" />
                </div>
                <h2 className="font-semibold text-lg text-foreground mb-2">Escanea al llegar</h2>
                <p className="text-muted-foreground text-sm">
                  El código QR confirma tu llegada y notifica a tus contactos de emergencia
                </p>
              </div>

              <Button
                onClick={handleRealScan}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
              >
                <Scan className="w-5 h-5 mr-2" />
                Abrir escáner QR
              </Button>
            </>
          )}

          {isScanning && (
            <div className="py-8">
              <div className="relative w-48 h-48 mx-auto mb-6">
                {/* Scanner Animation */}
                <div className="absolute inset-0 border-4 border-primary rounded-2xl" />
                <div className="absolute inset-4 border-2 border-dashed border-primary/50 rounded-xl animate-pulse" />
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="w-full h-1 bg-secondary animate-scan" />
                </div>
                <QrCode className="absolute inset-0 m-auto w-16 h-16 text-primary/30" />
              </div>
              <p className="text-center text-muted-foreground">Escaneando código QR...</p>
              <p className="text-center text-sm text-muted-foreground mt-2">Apunta la cámara al código del destino</p>
            </div>
          )}

          {scanResult === "success" && (
            <div className="py-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">¡Llegada confirmada!</h3>
              <p className="text-muted-foreground text-sm mb-4">Hotel Vista al Volcán, Santa Ana</p>

              {/* Notification Alert */}
              <div className="bg-primary/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notificación enviada</span>
                </div>
                <p className="text-sm text-muted-foreground">Mamá y Papá han sido notificados de tu llegada segura</p>
              </div>

              {/* Benefits unlocked */}
              <div className="bg-secondary/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-secondary mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Beneficios activados</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>✓ Pago liberado al anfitrión (85%)</li>
                  <li>✓ Comisión del afiliado activada (7%)</li>
                  <li>✓ Enlace de recomendación generado</li>
                </ul>
              </div>

              <Button onClick={resetScan} variant="outline" className="w-full h-12 rounded-xl bg-transparent">
                Escanear otro código
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-4 py-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Aviso de seguridad</h3>
              <p className="text-sm text-muted-foreground">
                Siempre verifica que el código QR corresponda al lugar reservado. Nunca compartas tu ubicación con
                desconocidos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">Contactos de emergencia</h2>
         <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => setShowAddContact(true)}
          >
            + Añadir
          </Button>
        </div>

        <div className="space-y-3">
          {guardians.map((guardian) => (
            <div
              key={guardian.id}
              className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {guardian.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{guardian.name}</p>
                  <p className="text-sm text-muted-foreground">{guardian.phone_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground mb-1">Activo</span>
                  <Switch 
                    checked={guardian.is_active} 
                    onCheckedChange={() => {/* Aquí irá luego la lógica de desactivar */}}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Safe-Flow Works */}
      <div className="px-4 pb-6">
        <h2 className="font-semibold text-lg mb-4 text-foreground">¿Cómo funciona Safe-Flow?</h2>
        <div className="bg-muted rounded-2xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Escanea el QR al llegar</p>
              <p className="text-sm text-muted-foreground">El "apretón de manos digital" confirma tu llegada</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Tus familiares son notificados</p>
              <p className="text-sm text-muted-foreground">Reciben tu ubicación real automáticamente</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Viaja tranquilo</p>
              <p className="text-sm text-muted-foreground">Seguridad en tiempo real durante todo el trayecto</p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for scan animation */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(180px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
      {showAddContact && (
        <AddContactModal onClose={() => setShowAddContact(false)} />
      )}
    </div>
  )
}
