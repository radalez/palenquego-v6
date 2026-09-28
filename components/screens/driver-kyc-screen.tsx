"use client"

import { useState, useEffect, useRef } from "react"
import { AlertCircle, Camera, CheckCircle2, ChevronRight, UploadCloud, FileText, ArrowLeft, RefreshCw, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

const DEFAULT_REQUIREMENTS = [
  {
    id: 1,
    title: "Licencia de Conducir (Frente)",
    description: "Foto clara y legible del anverso de tu licencia de conducir vigente.",
  },
  {
    id: 2,
    title: "Documento de Identidad (DUI / Cédula / DNI)",
    description: "Foto del anverso de tu documento de identidad personal oficial.",
  },
  {
    id: 3,
    title: "Licencia de Conducir (Reverso)",
    description: "Foto legible del reverso de tu licencia de conducir.",
  },
]

export function DriverKycScreen({ user, onNavigate }: { user: any; onNavigate?: (tab: string) => void }) {
  const { kycRequirements, fetchKycRequirements, isLoading } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<number, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.kyc_status !== "APPROVED") {
      fetchKycRequirements()
    }
  }, [fetchKycRequirements, user?.kyc_status])

  const requirementsList = (kycRequirements && kycRequirements.length > 0) ? kycRequirements : DEFAULT_REQUIREMENTS

  if (user?.kyc_status === "APPROVED") {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6 text-center pb-24">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-[#105238]" />
        </div>
        <h2 className="text-3xl font-black mb-3 text-foreground">¡Estás Aprobado!</h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-base leading-relaxed mb-6">
          Tus documentos han sido verificados satisfactoriamente. Tu cuenta está habilitada para operar con PalenqueGo.
        </p>
        {onNavigate && (
          <Button 
            onClick={() => onNavigate("conductor")}
            className="bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold px-6 py-3 rounded-xl shadow-md"
          >
            Abrir Mi Panel de Conductor &rarr;
          </Button>
        )}
      </div>
    )
  }

  const isCompleted = currentStep >= requirementsList.length
  const currentReq = requirementsList[currentStep]
  const currentPhoto = uploadedPhotos[currentStep]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUploadedPhotos(prev => ({ ...prev, [currentStep]: url }))
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Encabezado Corporativo */}
      <div className="bg-gradient-to-br from-[#105238] to-[#0c3e2b] px-4 pt-12 pb-8 rounded-b-[2rem] text-white shadow-lg relative">
        {onNavigate && (
          <button 
            onClick={() => onNavigate("profile")}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="max-w-md mx-auto">
          <span className="inline-block px-3 py-1 bg-white/15 text-emerald-200 text-[11px] font-black rounded-full uppercase tracking-wider mb-2">
            Verificación Oficial de Conductor
          </span>
          <h1 className="text-2xl font-black mb-1.5">Sube tus Documentos</h1>
          <p className="text-emerald-100/90 text-xs leading-relaxed">
            Sube las fotos de tu documentación para que tu empresa de transporte valide tu perfil y active tu vehículo.
          </p>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="px-4 -mt-4 max-w-md mx-auto w-full">
        <div className="bg-card rounded-2xl p-4 shadow-md border border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-foreground">Progreso de Documentos</span>
            <span className="text-xs font-semibold text-muted-foreground">
              Paso {Math.min(currentStep + 1, requirementsList.length)} de {requirementsList.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-[#105238] h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(Math.min(currentStep, requirementsList.length) / requirementsList.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="px-4 mt-6 flex-1 flex flex-col max-w-md mx-auto w-full">
        {!isCompleted ? (
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex-1 flex flex-col justify-between text-center">
            <div>
              <div className="w-14 h-14 bg-[#105238]/10 text-[#105238] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-7 h-7" />
              </div>
              
              <h2 className="text-lg font-black text-foreground mb-1.5">{currentReq?.title}</h2>
              <p className="text-muted-foreground mb-6 text-xs leading-relaxed">
                {currentReq?.description}
              </p>

              {/* Input oculto */}
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileChange}
              />

              {/* Área de subida / vista previa */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-52 border-2 border-dashed border-[#105238]/40 bg-[#105238]/5 rounded-2xl flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-[#105238]/10 transition-colors overflow-hidden relative"
              >
                {currentPhoto ? (
                  <div className="w-full h-full relative group">
                    <img src={currentPhoto} alt="Documento" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4" /> Tocar para cambiar foto
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-[#105238]">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#105238]">Tocar para tomar o subir foto</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Asegúrate de que el texto sea legible y con buena luz</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <Button 
                className="w-full h-12 text-sm font-bold bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl shadow-md"
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                {currentStep === requirementsList.length - 1 ? "Finalizar y Enviar Documentos" : "Siguiente Documento"}
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-[#105238]" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">¡Documentos Registrados!</h2>
            <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
              Tus documentos han sido registrados en tu perfil para validación de tu empresa de transporte. Te notificaremos en cuanto tu cuenta sea aprobada.
            </p>
            
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left mb-6">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Estado actual: <strong className="font-bold">Pendiente de Aprobación</strong>. Tu Aliado puede aprobarte digitalmente en su panel o validar físicamente si ya presentaste tus papeles en oficina.
              </p>
            </div>

            {onNavigate && (
              <Button 
                onClick={() => onNavigate("profile")}
                className="w-full h-12 text-sm font-bold bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl shadow-md"
              >
                Volver a Mi Perfil
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
