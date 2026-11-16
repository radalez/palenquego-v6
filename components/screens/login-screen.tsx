"use client"

import { useState } from "react"
import { Lock, Mail, AlertCircle, Eye, EyeOff, MapPin, Users, Tent, Compass, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"
import { GoogleLogin } from "@react-oauth/google"

interface LoginScreenProps {
  onLoginSuccess: () => void
  onShowRegister: () => void
}

const DESKTOP_HERO_BG =
  "https://res.cloudinary.com/kclwjivi/image/upload/v1794788530/tres_excursionistas_contemplan_el_valle_dorado.webp"

export function LoginScreen({ onLoginSuccess, onShowRegister }: LoginScreenProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [forgotMessage, setForgotMessage] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const login = useAppStore((state) => state.login)

  const handleLogin = async () => {
    setError("")
    setForgotMessage(false)
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
    <>
      {/* =====================================================================
          VERSIÓN MÓVIL / TELÉFONO (< lg) — INTACTA
         ===================================================================== */}
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 lg:hidden">
        {/* Logo and branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <img src="/logo-white.png" alt="Palenque Go Logo" className="w-16 h-16 object-contain" />
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
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="email"
                  placeholder="ejemplo@correo.com"
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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-border bg-muted/50"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">o continúa con</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    const success = await useAppStore.getState().loginWithGoogle(credentialResponse.credential)
                    if (success) {
                      onLoginSuccess()
                    } else {
                      setError("Error al iniciar sesión con Google")
                    }
                  }
                }}
                onError={() => setError("Error en el inicio de sesión de Google")}
                theme="outline"
                size="large"
                shape="pill"
              />
            </div>
          </div>

          <div className="mt-6 text-center space-y-3">
            <p className="text-xs text-muted-foreground">Ingresa con tu cuenta de viajero de PalenqueGo</p>
            <button onClick={onShowRegister} className="text-sm font-semibold text-primary hover:underline">
              ¿No tienes cuenta? Regístrate aquí
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/50 text-xs mt-8">Economía Circular El Salvador</p>
      </div>

      {/* =====================================================================
          VERSIÓN ESCRITORIO (lg:flex) — HERO PANORÁMICO SIN MENÚ + LOGO + CARD
         ===================================================================== */}
      <div className="hidden lg:flex h-screen w-full relative overflow-hidden bg-[#eaf0e2] select-none items-center">
        {/* Imagen panorámica de fondo: Tres excursionistas contemplan el valle dorado */}
        <img
          src={DESKTOP_HERO_BG}
          alt="Viaja, comparte experiencias y conoce gente en Palenque Go"
          className="absolute inset-0 w-full h-full object-cover object-bottom"
        />

        {/* Gradiente suave superior izquierdo para legibilidad nítida del titular sobre el cielo */}
        <div
          className="
            absolute inset-0 pointer-events-none
            bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.35)_38%,rgba(0,0,0,0.08)_100%)]
          "
        />

        {/* Top-Left Brand Logo fijo en la esquina superior izquierda (Sin barra de menú superior) */}
        <div className="absolute top-5 left-10 xl:left-16 z-30 flex items-center">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_8px_30px_rgba(16,82,56,0.12)] border border-white">
            <img src="/icon-192.png" alt="Palenque Go" className="w-9 h-9 object-contain" />
            <div className="leading-tight">
              <span className="block text-lg font-black text-[#105238] tracking-tight">Palenque Go</span>
              <span className="block text-[11px] font-semibold text-[#105238]/75">
                Movilidad &amp; Experiencias
              </span>
            </div>
          </div>
        </div>

        {/* Detalle decorativo orgánico en esquina inferior derecha (hojas verdes de marca) */}
        <svg
          viewBox="0 0 360 220"
          fill="none"
          className="absolute bottom-0 right-0 w-[340px] xl:w-[400px] h-auto pointer-events-none z-10"
        >
          <path
            d="M40 220C105 145 215 95 360 70V220H40Z"
            fill="#8ee01a"
            fillOpacity="0.9"
          />
          <path
            d="M145 220C205 160 275 115 360 35V220H145Z"
            fill="#105238"
            fillOpacity="0.88"
          />
        </svg>

        {/* Contenedor Principal Escritorio */}
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-10 xl:px-16 py-6 flex flex-col justify-center h-full">
          {/* Grid Central: Izquierda (Titular + 4 Iconos sobre los excursionistas) / Derecha (Card Login) */}
          <div className="grid grid-cols-12 items-center gap-8 pt-10 xl:pt-6">
            {/* Columna Izquierda: Mensaje inspiracional + 4 pilares */}
            <div className="col-span-7 flex flex-col items-center text-center self-start mt-2 xl:mt-4">
              <h1 className="text-[44px] xl:text-[54px] font-black text-[#105238] leading-[1.08] tracking-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)]">
                Viaja, comparte
                <br />
                experiencias y
              </h1>

              {/* Franja verde lima tipo pincelada con "conoce gente" y 3 destellos */}
              <div className="relative inline-flex items-center mt-2">
                <div className="bg-[#8ee01a] px-9 py-1.5 rounded-[22px] -rotate-1 shadow-[0_10px_25px_rgba(142,224,26,0.45)] border border-[#105238]/10">
                  <span
                    className="block text-[40px] xl:text-[48px] text-[#105238] leading-none rotate-1 font-serif italic font-bold tracking-wide"
                  >
                    conoce gente
                  </span>
                </div>
                {/* 3 destellos decorativos a la derecha */}
                <svg
                  viewBox="0 0 36 42"
                  fill="none"
                  className="w-8 h-9 -ml-1 -mt-5 text-[#105238] shrink-0"
                >
                  <path d="M6 14L18 3" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M10 23L28 17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M10 32L29 32" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Fila de 4 Iconos con divisores verticales */}
              <div className="mt-7 grid grid-cols-4 divide-x divide-[#105238]/20 bg-white/65 backdrop-blur-xs rounded-2xl px-4 py-3.5 shadow-[0_8px_24px_rgba(16,82,56,0.08)] border border-white/80 max-w-[580px] w-full">
                <div className="flex flex-col items-center px-3 text-center">
                  <MapPin className="w-7 h-7 text-[#105238] stroke-[2.2] mb-1.5" />
                  <span className="text-xs xl:text-[13px] font-extrabold text-[#105238] leading-tight">
                    Descubre
                    <br />
                    destinos
                  </span>
                </div>

                <div className="flex flex-col items-center px-3 text-center">
                  <Users className="w-7 h-7 text-[#105238] stroke-[2.2] mb-1.5" />
                  <span className="text-xs xl:text-[13px] font-extrabold text-[#105238] leading-tight">
                    Viaja
                    <br />
                    en grupo
                  </span>
                </div>

                <div className="flex flex-col items-center px-3 text-center">
                  <Tent className="w-7 h-7 text-[#105238] stroke-[2.2] mb-1.5" />
                  <span className="text-xs xl:text-[13px] font-extrabold text-[#105238] leading-tight">
                    Vive
                    <br />
                    experiencias
                  </span>
                </div>

                <div className="flex flex-col items-center px-3 text-center">
                  <Compass className="w-7 h-7 text-[#105238] stroke-[2.2] mb-1.5" />
                  <span className="text-xs xl:text-[13px] font-extrabold text-[#105238] leading-tight">
                    Conecta
                    <br />
                    con viajeros
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Blanca de Inicio de Sesión */}
            <div className="col-span-5 flex justify-end">
              <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md rounded-[32px] p-8 xl:p-10 shadow-[0_24px_60px_rgba(16,82,56,0.22)] border border-white">
                <div className="text-center mb-7">
                  <h2 className="text-[26px] xl:text-[28px] font-black text-[#0f172a] leading-tight">
                    Bienvenido a
                    <span className="block text-[30px] xl:text-[32px] text-[#105238]">Palenque Go</span>
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1.5">
                    Tu comunidad de viajes y experiencias
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Input Correo */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#105238]" />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="w-full h-12 pl-12 pr-4 rounded-full border border-slate-200 bg-[#f8faf7] text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#105238] focus:ring-2 focus:ring-[#105238]/15 transition-all"
                    />
                  </div>

                  {/* Input Contraseña */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#105238]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="w-full h-12 pl-12 pr-11 rounded-full border border-slate-200 bg-[#f8faf7] text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#105238] focus:ring-2 focus:ring-[#105238]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#105238] focus:outline-none cursor-pointer"
                      aria-label="Mostrar u ocultar contraseña"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Fila Recordarme + ¿Olvidaste tu contraseña? */}
                  <div className="flex items-center justify-between pt-0.5 px-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className="inline-flex items-center gap-2 text-slate-700 font-semibold cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          rememberMe
                            ? "bg-[#105238] border-[#105238] text-white"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span>Recordarme</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForgotMessage((prev) => !prev)}
                      className="font-bold text-[#105238] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  {forgotMessage && (
                    <div className="p-3 rounded-2xl bg-[#eaf0e2] border border-[#aeb6a1]/70 text-xs text-[#105238] leading-relaxed">
                      Puedes ingresar directamente con <strong>Continuar con Google</strong> usando tu correo, o escribirnos a soporte de PalenqueGo para restablecer tu clave.
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-[#eaf0e2] border border-[#105238]/30 rounded-2xl">
                      <AlertCircle className="w-4 h-4 text-[#105238] shrink-0" />
                      <span className="text-xs font-bold text-[#105238]">{error}</span>
                    </div>
                  )}

                  {/* Botón Principal Iniciar sesión */}
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading || !username || !password}
                    className="w-full h-12 rounded-full bg-[#105238] hover:bg-[#0c3e2b] text-white font-bold text-base shadow-md transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Ingresando...
                      </span>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>

                  {/* Separador O continúa con */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-500 font-medium">O continúa con</span>
                    </div>
                  </div>

                  {/* Continuar con Google */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        if (credentialResponse.credential) {
                          const success = await useAppStore
                            .getState()
                            .loginWithGoogle(credentialResponse.credential)
                          if (success) {
                            onLoginSuccess()
                          } else {
                            setError("Error al iniciar sesión con Google")
                          }
                        }
                      }}
                      onError={() => setError("Error en el inicio de sesión de Google")}
                      theme="outline"
                      size="large"
                      shape="pill"
                      width="350"
                    />
                  </div>
                </div>

                {/* Enlace inferior de registro */}
                <div className="mt-7 text-center text-sm text-slate-600">
                  <span>¿Aún no tienes cuenta? </span>
                  <button
                    type="button"
                    onClick={onShowRegister}
                    className="font-extrabold text-[#105238] underline decoration-2 underline-offset-4 hover:text-[#0c3e2b] cursor-pointer"
                  >
                    Créala ahora
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Espaciador inferior sutil */}
          <div className="h-2" />
        </div>
      </div>
    </>
  )
}
