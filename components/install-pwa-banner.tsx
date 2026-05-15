"use client"
import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Detect if already installed (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    
    // Listen for beforeinstallprompt (Android / Desktop Chrome)
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    
    // If not standalone and it's iOS, we can show a specific instruction
    // We only show it for iOS because Android/Desktop use the beforeinstallprompt event natively.
    if (isIOSDevice && !isStandalone) {
      setIsVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsVisible(false)
    }
    setDeferredPrompt(null)
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-primary/20 shadow-xl rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Instalar Palenque Flow</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acceso rápido a tus viajes y reservas
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:bg-muted p-1 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS && !deferredPrompt ? (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs text-muted-foreground flex flex-col gap-2">
            <p className="font-medium text-foreground">Para instalar en iOS:</p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Toca el ícono <Share className="w-3.5 h-3.5 inline mx-1 text-foreground" /> <strong>Compartir</strong> en Safari</li>
              <li>Desliza hacia abajo y selecciona <strong>"Añadir a inicio"</strong></li>
            </ol>
          </div>
        ) : (
          <Button 
            onClick={handleInstall} 
            className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm font-medium rounded-xl h-10"
          >
            Instalar Aplicación
          </Button>
        )}
      </div>
    </div>
  )
}
