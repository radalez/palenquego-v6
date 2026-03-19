"use client"

import { useState } from "react"
import { Leaf, Lock, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const login = useAppStore((state) => state.login)

  const handleLogin = async () => {
    setError("")
    setIsLoading(true)

    // Llamamos al login del store y ESPERAMOS (await) la respuesta real de Django
    const success = await login(username, password)
      setIsLoading(false)

      if (success) {
        onLoginSuccess()
      } else {
        setError("Usuario o contraseña incorrectos. Verifica tus datos.")
      }
    }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      {/* Logo and branding */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Leaf className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Palenque Go</h1>
        <p className="text-white/70 text-sm mt-1">Turismo Circular & Comunitario</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">Iniciar Sesión</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground text-sm">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="username"
                placeholder="demo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12 rounded-xl border-border bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground text-sm">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 rounded-xl border-border bg-muted/50"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{error || "Credenciales incorrectas"}</span>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoading || !username || !password}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : (
              "Ingresar"
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ingresa con tu cuenta de viajero de Palenque Flow
        </p>
      </div>

      {/* Footer */}
      <p className="text-white/50 text-xs mt-8">Economía Circular El Salvador</p>
    </div>
  )
}
