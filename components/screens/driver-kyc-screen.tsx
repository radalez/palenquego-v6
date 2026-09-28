"use client"

import { useState, useEffect, useRef } from "react"
import { AlertCircle, Camera, CheckCircle2, ChevronRight, UploadCloud, RefreshCw, ChevronLeft, FileCheck, ShieldCheck, ArrowRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

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

export const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("blob:")) return url
  const cleanPath = url.startsWith("/") ? url : `/${url}`
  return `https://palenquego.com${cleanPath}`
}

export function DriverKycScreen({ user, onNavigate }: { user: any; onNavigate?: (tab: string) => void }) {
  const { kycRequirements, fetchKycRequirements, accessToken } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<number, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.kyc_status !== "APPROVED") {
      fetchKycRequirements()
    }
  }, [fetchKycRequirements, user?.kyc_status])

  useEffect(() => {
    if (kycRequirements && kycRequirements.length > 0) {
      const initialPhotos: Record<number, string> = {}
      kycRequirements.forEach((req, idx) => {
        if (req.uploaded_image_url) {
          initialPhotos[idx] = req.uploaded_image_url
        }
      })
      if (Object.keys(initialPhotos).length > 0) {
        setUploadedPhotos(prev => ({ ...initialPhotos, ...prev }))
      }
    }
  }, [kycRequirements])

  const requirementsList = (kycRequirements && kycRequirements.length > 0) ? kycRequirements : DEFAULT_REQUIREMENTS

  // 1. Pantalla cuando el conductor ya está completamente APROBADO
  if (user?.kyc_status === "APPROVED") {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6 text-center pb-24">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-[#105238] dark:text-emerald-400" />
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

  // 2. Pantalla de Comprobante cuando los documentos están EN REVISIÓN (PENDING) y no está en modo edición
  if (user?.kyc_status === "PENDING" && !isEditing) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        {/* Encabezado Corporativo */}
        <div className="bg-gradient-to-br from-[#105238] to-[#0c3e2b] px-4 pt-12 pb-8 rounded-b-[2rem] text-white shadow-lg relative">
          <div className="max-w-md mx-auto">
            <span className="inline-block px-3 py-1 bg-blue-500/30 text-blue-100 text-[11px] font-black rounded-full uppercase tracking-wider mb-2 border border-blue-400/40">
              En Revisión Oficial
            </span>
            <h1 className="text-2xl font-black mb-1.5">Documentos en Revisión</h1>
            <p className="text-emerald-100/90 text-xs leading-relaxed">
              Tus documentos han sido recibidos exitosamente y están siendo evaluados por tu empresa de transporte o aliado.
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 max-w-md mx-auto w-full space-y-4">
          {/* Tarjeta de Estado Informativo */}
          <div className="bg-card rounded-2xl p-5 shadow-md border border-border">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-foreground text-sm">Estado: En Validación</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    Pendiente
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Tu documentación ya fue enviada. No necesitas realizar ningún paso adicional a menos que tu empresa te solicite actualizar o corregir alguna foto.
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Documentos Enviados con Checks Verdes */}
          <div className="bg-card rounded-2xl p-5 shadow-md border border-border">
            <h4 className="font-black text-xs text-foreground uppercase tracking-wider mb-3">
              Documentos Registrados ({requirementsList.length})
            </h4>
            <div className="space-y-3">
              {requirementsList.map((req, idx) => {
                const photoUrl = uploadedPhotos[idx] || req.uploaded_image_url
                const formattedUrl = photoUrl ? formatImageUrl(photoUrl) : null

                return (
                  <div 
                    key={req.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-snug">{req.title}</p>
                        <p className="text-[11px] text-muted-foreground">Documento adjuntado</p>
                      </div>
                    </div>
                    {formattedUrl ? (
                      <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-black/5 shrink-0 ml-2 shadow-inner">
                        <img 
                          src={formattedUrl} 
                          alt={req.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Recibido ✓
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-2 space-y-3 text-center">
            {onNavigate && (
              <Button
                onClick={() => onNavigate("profile")}
                className="w-full h-12 text-sm font-bold bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl shadow-md"
              >
                Volver a Mi Perfil
              </Button>
            )}

            <button
              type="button"
              onClick={() => {
                setCurrentStep(0)
                setIsEditing(true)
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 py-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ¿Deseas reemplazar o actualizar alguna foto?
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Flujo Wizard de Subida de Documentos (si no ha subido o si eligió editar)
  const isCompleted = currentStep >= requirementsList.length
  const currentReq = requirementsList[currentStep]
  const currentPhoto = uploadedPhotos[currentStep]
  const hasPhoto = Boolean(currentPhoto)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSelectedFiles(prev => ({ ...prev, [currentStep]: file }))
      setUploadedPhotos(prev => ({ ...prev, [currentStep]: url }))
      setUploadError(null)
    }
  }

  const handleUploadAndAdvance = async () => {
    if (!hasPhoto) {
      setUploadError("Debes tomar o adjuntar una foto del documento para continuar.")
      return
    }

    const fileToUpload = selectedFiles[currentStep]
    if (fileToUpload) {
      setIsUploading(true)
      setUploadError(null)
      try {
        const formData = new FormData()
        formData.append("requirement_id", String(currentReq.id))
        formData.append("image", fileToUpload)

        const token = accessToken || (typeof window !== "undefined" && localStorage.getItem("app-storage") ? JSON.parse(localStorage.getItem("app-storage") as string)?.state?.accessToken : "")

        const res = await fetch("/api-proxy/accounts/kyc-documents/upload/", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || "No se pudo subir la foto del documento al servidor.")
        }

        const data = await res.json()
        if (data.image_url) {
          setUploadedPhotos(prev => ({ ...prev, [currentStep]: data.image_url }))
        }
      } catch (err: any) {
        console.error("KYC upload error:", err)
        setUploadError(err.message || "Error al conectar con el servidor. Intenta de nuevo.")
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    if (currentStep < requirementsList.length - 1) {
      setCurrentStep(prev => prev + 1)
      setUploadError(null)
    } else {
      useAppStore.setState(state => ({
        currentUser: {
          ...state.currentUser,
          kyc_status: "PENDING"
        }
      }))
      setCurrentStep(requirementsList.length)
      setUploadError(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Encabezado Corporativo sin botón de retroceso que rompía vistas */}
      <div className="bg-gradient-to-br from-[#105238] to-[#0c3e2b] px-4 pt-12 pb-8 rounded-b-[2rem] text-white shadow-lg relative">
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

      {/* Botón para volver al comprobante si estaba en modo edición */}
      {isEditing && (
        <div className="px-4 mt-3 max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs font-semibold text-[#105238] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Cancelar y volver al comprobante
          </button>
        </div>
      )}

      {/* Barra de Progreso */}
      <div className="px-4 mt-3 max-w-md mx-auto w-full">
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

              {/* Área de subida / vista previa con formatImageUrl */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-52 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center mb-4 cursor-pointer transition-colors overflow-hidden relative ${
                  hasPhoto 
                    ? "border-emerald-500 bg-emerald-50/20" 
                    : "border-[#105238]/40 bg-[#105238]/5 hover:bg-[#105238]/10"
                }`}
              >
                {currentPhoto ? (
                  <div className="w-full h-full relative group">
                    <img 
                      src={formatImageUrl(currentPhoto)} 
                      alt="Documento" 
                      className="w-full h-full object-cover" 
                    />
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

              {/* Aviso si falta foto */}
              {!hasPhoto && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-amber-800 leading-snug">
                    Foto obligatoria: Toma o adjunta una fotografía clara de tu documento antes de continuar.
                  </p>
                </div>
              )}

              {/* Error si falló el upload */}
              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold text-red-700 leading-snug">
                    {uploadError}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                disabled={!hasPhoto || isUploading}
                className={`w-full h-12 text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  hasPhoto && !isUploading
                    ? "bg-[#105238] hover:bg-[#0c3e2b] text-white cursor-pointer"
                    : "bg-gray-300 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed opacity-70 shadow-none"
                }`}
                onClick={handleUploadAndAdvance}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando documento...</span>
                  </>
                ) : !hasPhoto ? (
                  <span>Adjunta la foto para continuar</span>
                ) : currentStep === requirementsList.length - 1 ? (
                  <>
                    <span>Finalizar y Enviar Documentos</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Guardar y Continuar</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {currentStep > 0 && !isUploading && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(prev => prev - 1)
                    setUploadError(null)
                  }}
                  className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground mt-3 py-1 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Volver al documento anterior
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-[#105238] dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">¡Documentos Registrados!</h2>
            <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
              Tus documentos han sido subidos exitosamente a tu perfil para validación de tu empresa de transporte. Te notificaremos en cuanto tu cuenta sea aprobada.
            </p>
            
            <div className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex items-start gap-3 text-left mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                Estado actual: <strong className="font-bold">Pendiente de Aprobación</strong>. Tu Aliado puede aprobarte digitalmente desde su panel o validar físicamente si ya presentaste tus papeles en oficina.
              </p>
            </div>

            <div className="w-full space-y-2">
              <Button 
                onClick={() => {
                  setIsEditing(false)
                }}
                className="w-full h-12 text-sm font-bold bg-[#105238] hover:bg-[#0c3e2b] text-white rounded-xl shadow-md"
              >
                Ver Comprobante de Envío
              </Button>

              {onNavigate && (
                <Button 
                  variant="outline"
                  onClick={() => onNavigate("profile")}
                  className="w-full h-11 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl"
                >
                  Volver a Mi Perfil
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
