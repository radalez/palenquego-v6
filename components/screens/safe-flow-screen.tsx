"use client"

import { useState, useEffect } from "react"
import { QrCode, Shield, Bell, CheckCircle2, AlertTriangle, Scan, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Scanner } from '@yudiel/react-qr-scanner'
import { HeaderWithMenu } from "@/components/header-with-menu"
import { useAppStore } from "@/lib/store"
import { AddContactModal } from "@/components/add-contact-modal"
import QRCode from "react-qr-code"

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
  const [editingContact, setEditingContact] = useState<{id: number, name: string, phone: string, email: string} | null>(null)
  const { guardians, fetchGuardians, currentUser, accessToken } = useAppStore()
  
  // Passenger state
  const [myTicketId, setMyTicketId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const isDriver = currentUser.tipo === 'CHOFER'

  useEffect(() => {
    fetchGuardians()
  }, [])

  const handleRealScan = () => {
    setIsScanning(true)
    setScanResult(null)
  }

  const fetchMyActiveTicket = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api-proxy/transport/tickets/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Buscamos el primer boleto que no haya sido usado
        const activeTicket = data.find((t: any) => !t.is_used)
        if (activeTicket) {
          setMyTicketId(activeTicket.id.toString())
        } else {
          setMyTicketId(null)
        }
      }
    } catch (e) {
      console.error("Error al obtener boletos", e)
    } finally {
      setIsGenerating(false)
    }
  }

  // Cargar el boleto real al abrir la pantalla si es pasajero
  useEffect(() => {
    if (!isDriver && accessToken) {
      fetchMyActiveTicket()
    }
  }, [isDriver, accessToken])

  const handleQRScan = async (ticket_id: string) => {
    setIsScanning(false)
    try {
      const res = await fetch('/api-proxy/safeflow/trips/scan_passenger_ticket/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ ticket_id })
      })
      const data = await res.json()
      
      if (res.ok) {
        setScanResult("success")
        alert(data.message)
      } else {
        setScanResult("error")
        alert(data.error || "Boleto inválido o ya usado")
      }
    } catch (e) {
      setScanResult("error")
      alert("Error al comunicarse con el servidor")
    }
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
      <div className="px-4 -mt-4 max-w-2xl mx-auto w-full">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          
          {/* VISTA CHOFER */}
          {isDriver && (
            <>
              {!isScanning && !scanResult && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Scan className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="font-semibold text-lg text-foreground mb-2">Escanear Pasajero</h2>
                    <p className="text-muted-foreground text-sm">
                      Escanea el código QR del boleto del pasajero para registrar su abordaje.
                    </p>
                  </div>

                  <Button
                    onClick={handleRealScan}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
                  >
                    <Scan className="w-5 h-5 mr-2" />
                    Abrir cámara
                  </Button>
                </>
              )}

              {isScanning && (
                <div className="py-4">
                  <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl mb-4 border-4 border-primary/30">
                    <Scanner 
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          handleQRScan(result[0].rawValue)
                        }
                      }}
                      formats={['qr_code']}
                    />
                  </div>
                  <p className="text-center text-muted-foreground font-medium mb-4">Apunta la cámara al código QR del pasajero</p>
                  <Button onClick={resetScan} variant="outline" className="w-full">
                    Cancelar Escaneo
                  </Button>
                </div>
              )}
            </>
          )}

          {/* VISTA PASAJERO */}
          {!isDriver && (
            <div className="text-center mb-2">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-semibold text-lg text-foreground mb-2">Tu Código de Abordaje</h2>
              
              {!myTicketId ? (
                <div className="py-4">
                  <p className="text-muted-foreground text-sm mb-6">
                    No tienes boletos activos en este momento. Compra un pasaje para generar tu código QR.
                  </p>
                  <Button
                    onClick={fetchMyActiveTicket}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full h-14 rounded-xl text-lg font-semibold"
                  >
                    <Ticket className="w-5 h-5 mr-2" />
                    {isGenerating ? "Buscando boletos..." : "Refrescar boletos"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center mt-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-border inline-block mb-4">
                    <QRCode value={myTicketId} size={200} />
                  </div>
                  <p className="text-primary font-bold text-xl mb-1">Boleto #{myTicketId}</p>
                  <p className="text-muted-foreground text-sm mb-4">Muéstrale este código al chofer</p>
                  
                  <Button onClick={() => setMyTicketId(null)} variant="outline" className="w-full h-12">
                    Cerrar Boleto
                  </Button>
                </div>
              )}
            </div>
          )}

          {isDriver && scanResult === "success" && (
            <div className="py-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">¡Llegada confirmada!</h3>
              <p className="text-muted-foreground text-sm mb-4">Ubicación registrada exitosamente</p>

              {/* Notificación Dinámica */}
              <div className="bg-primary/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notificación enviada</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Los contactos de emergencia del pasajero han sido notificados.
                </p>
              </div>

              <div className="bg-secondary/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-secondary mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Seguridad Activa</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  ✓ Punto de control verificado.<br/>
                  ✓ Alerta de llegada procesada.<br/>
                  ✓ Tracking actualizado.
                </p>
              </div>

              <Button onClick={resetScan} variant="outline" className="w-full h-12 rounded-xl bg-transparent border-primary/30 text-foreground">
                Escanear otro código
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-4 py-6 max-w-2xl mx-auto w-full">
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
      <div className="px-4 pb-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">Contactos de emergencia</h2>
         <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => {
              setEditingContact(null)
              setShowAddContact(true)
            }}
          >
            + Añadir
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onCheckedChange={(checked) => {
                      useAppStore.getState().toggleGuardianActive(guardian.id, checked)
                    }} 
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary px-2"
                  onClick={() => {
                    setEditingContact({
                      id: guardian.id,
                      name: guardian.name,
                      phone: guardian.phone_number,
                      email: guardian.email || ''
                    })
                    setShowAddContact(true)
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Safe-Flow Works */}
      <div className="px-4 pb-24 max-w-4xl mx-auto w-full">
        <h2 className="font-semibold text-lg mb-4 text-foreground">¿Cómo funciona Safe-Flow?</h2>
        <div className="bg-muted rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Escanea el QR al llegar</p>
              <p className="text-sm text-muted-foreground">El &quot;apretón de manos digital&quot; confirma tu llegada</p>
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
        <AddContactModal 
          onClose={() => {
            setShowAddContact(false)
            setEditingContact(null)
          }} 
          initialData={editingContact || undefined} 
        />
      )}
    </div>
  )
}
