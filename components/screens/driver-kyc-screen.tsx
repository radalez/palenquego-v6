"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Camera, CheckCircle2, ChevronRight, UploadCloud, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DriverKycScreen({ user }: { user: any }) {
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Simulamos cargar requisitos del backend
    setTimeout(() => {
      setRequirements([
        { id: 1, title: 'DNI Frontal', description: 'Toma una foto clara del frente de tu DNI.' },
        { id: 2, title: 'DNI Reverso', description: 'Toma una foto clara del reverso de tu DNI.' },
        { id: 3, title: 'Licencia de Conducir', description: 'Foto de tu licencia de conducir vigente.' }
      ])
      setLoading(false)
    }, 800)
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Cargando requisitos de KYC...</p>
      </div>
    )
  }

  const isCompleted = currentStep >= requirements.length

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Encabezado */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-12 pb-8 rounded-b-[2rem] text-primary-foreground shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Verificación de Identidad</h1>
        <p className="text-primary-foreground/80 text-sm">
          Sube tus documentos para que el dueño de tu vehículo te apruebe. Una vez verificado, podrás usar el GPS.
        </p>
      </div>

      {/* Progreso */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl p-4 shadow-md border border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Progreso</span>
            <span className="text-sm text-muted-foreground">
              {Math.min(currentStep, requirements.length)} / {requirements.length} pasos
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${(Math.min(currentStep, requirements.length) / requirements.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 flex-1 flex flex-col">
        {!isCompleted ? (
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold mb-2">{requirements[currentStep].title}</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              {requirements[currentStep].description}
            </p>

            <div className="w-full h-48 border-2 border-dashed border-primary/40 bg-primary/5 rounded-xl flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-primary/10 transition-colors">
              <UploadCloud className="w-10 h-10 text-primary mb-2" />
              <p className="text-sm font-medium text-primary">Tocar para tomar/subir foto</p>
              <p className="text-xs text-muted-foreground mt-1">(Aquí se abrirá react-easy-crop)</p>
            </div>

            <Button 
              className="w-full h-12 text-base font-bold"
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Continuar <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">¡Documentos Subidos!</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Tus documentos han sido enviados al dueño de tu vehículo (Aliado) para su revisión. Te notificaremos cuando tu cuenta sea aprobada.
            </p>
            
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Tu estado actual es <span className="font-bold">Pendiente de Revisión</span>. El GPS y las rutas estarán bloqueadas hasta que se complete la verificación.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
