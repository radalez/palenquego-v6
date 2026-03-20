"use client"

import { useState } from "react"
import { Leaf, Lock, User, Mail, UserPlus, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"

interface RegisterScreenProps {
  onRegisterSuccess: () => void
  onBackToLogin: () => void
}

export function RegisterScreen({ onRegisterSuccess, onBackToLogin }: RegisterScreenProps) {
  const [formData, setFormData] = useState({ username: "", password: "", email: "", first_name: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const signup = useAppStore((state) => state.signup)

  const handleRegister = async () => {
    setError("")
   if (!formData.username || !formData.password || !formData.first_name || !formData.email) {
      setError("Todos los campos, incluyendo el correo, son obligatorios.")
      return
    }
    setIsLoading(true)
    const success = await signup(formData)
    setIsLoading(false)
    if (success) onRegisterSuccess()
    else setError("Error al crear la cuenta. Intenta con otro usuario.")
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
        <button onClick={onBackToLogin} className="flex items-center gap-2 text-muted-foreground text-sm mb-4 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al ingreso
        </button>
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">Crea tu cuenta</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Nombre Completo</Label>
            <Input placeholder="Ej: Enrique Pérez" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="h-12 rounded-xl border-border bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="pl-10 h-12 rounded-xl border-border bg-muted/50"
              />
            </div>
          </div>


          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Nombre de Usuario</Label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ej: enrique_viajero"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="pl-10 h-12 rounded-xl border-border bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Contraseña</Label>
            <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-12 rounded-xl border-border bg-muted/50" />
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-sm text-destructive">{error}</span></div>}
          <Button onClick={handleRegister} disabled={isLoading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base mt-2">
            {isLoading ? "Creando..." : "Registrarme"}
          </Button>
        </div>
      </div>
    </div>
  )
}