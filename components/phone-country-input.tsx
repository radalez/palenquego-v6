"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Search, ChevronDown, Check, Globe, X, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CountryData {
  name: string
  dialCode: string // e.g. "+503"
  code: string // e.g. "SV"
  placeholder: string
  popular?: boolean
}

export const COUNTRIES: CountryData[] = [
  // Principal / Por Defecto
  { name: "El Salvador", dialCode: "+503", code: "SV", placeholder: "7000-0000", popular: true },

  // Latinoamérica y el Caribe
  { name: "Perú", dialCode: "+51", code: "PE", placeholder: "912 345 678", popular: true },
  { name: "Guatemala", dialCode: "+502", code: "GT", placeholder: "5000-0000", popular: true },
  { name: "Honduras", dialCode: "+504", code: "HN", placeholder: "9000-0000", popular: true },
  { name: "Nicaragua", dialCode: "+505", code: "NI", placeholder: "8000-0000" },
  { name: "Costa Rica", dialCode: "+506", code: "CR", placeholder: "8000-0000", popular: true },
  { name: "Panamá", dialCode: "+507", code: "PA", placeholder: "6000-0000" },
  { name: "México", dialCode: "+52", code: "MX", placeholder: "55 1234 5678", popular: true },
  { name: "Colombia", dialCode: "+57", code: "CO", placeholder: "300 123 4567", popular: true },
  { name: "Argentina", dialCode: "+54", code: "AR", placeholder: "9 11 1234-5678" },
  { name: "Chile", dialCode: "+56", code: "CL", placeholder: "9 1234 5678" },
  { name: "Ecuador", dialCode: "+593", code: "EC", placeholder: "99 123 4567" },
  { name: "Bolivia", dialCode: "+591", code: "BO", placeholder: "7000 0000" },
  { name: "República Dominicana", dialCode: "+1809", code: "DO", placeholder: "809 123 4567" },
  { name: "Venezuela", dialCode: "+58", code: "VE", placeholder: "412 123 4567" },
  { name: "Uruguay", dialCode: "+598", code: "UY", placeholder: "99 123 456" },
  { name: "Paraguay", dialCode: "+595", code: "PY", placeholder: "981 123 456" },
  { name: "Brasil", dialCode: "+55", code: "BR", placeholder: "11 91234-5678" },
  { name: "Puerto Rico", dialCode: "+1787", code: "PR", placeholder: "787 123 4567" },
  { name: "Cuba", dialCode: "+53", code: "CU", placeholder: "5 123 4567" },

  // Norteamérica
  { name: "Estados Unidos", dialCode: "+1", code: "US", placeholder: "(555) 000-0000", popular: true },
  { name: "Canadá", dialCode: "+1", code: "CA", placeholder: "(555) 000-0000" },

  // Europa
  { name: "España", dialCode: "+34", code: "ES", placeholder: "612 34 56 78", popular: true },
  { name: "Italia", dialCode: "+39", code: "IT", placeholder: "312 345 6789" },
  { name: "Francia", dialCode: "+33", code: "FR", placeholder: "6 12 34 56 78" },
  { name: "Alemania", dialCode: "+49", code: "DE", placeholder: "151 12345678" },
  { name: "Reino Unido", dialCode: "+44", code: "GB", placeholder: "7123 456789" },
  { name: "Portugal", dialCode: "+351", code: "PT", placeholder: "912 345 678" },
  { name: "Países Bajos", dialCode: "+31", code: "NL", placeholder: "6 12345678" },
  { name: "Suiza", dialCode: "+41", code: "CH", placeholder: "78 123 45 67" },
  { name: "Bélgica", dialCode: "+32", code: "BE", placeholder: "470 12 34 56" },
  { name: "Suecia", dialCode: "+46", code: "SE", placeholder: "70 123 45 67" },
  { name: "Noruega", dialCode: "+47", code: "NO", placeholder: "412 34 567" },
  { name: "Dinamarca", dialCode: "+45", code: "DK", placeholder: "20 12 34 56" },
  { name: "Irlanda", dialCode: "+353", code: "IE", placeholder: "85 123 4567" },
  { name: "Austria", dialCode: "+43", code: "AT", placeholder: "650 1234567" },
  { name: "Polonia", dialCode: "+48", code: "PL", placeholder: "512 345 678" },

  // Asia y Oceanía
  { name: "Australia", dialCode: "+61", code: "AU", placeholder: "412 345 678" },
  { name: "Japón", dialCode: "+81", code: "JP", placeholder: "90 1234 5678" },
  { name: "Corea del Sur", dialCode: "+82", code: "KR", placeholder: "10 1234 5678" },
  { name: "China", dialCode: "+86", code: "CN", placeholder: "138 0000 0000" },
  { name: "India", dialCode: "+91", code: "IN", placeholder: "98123 45678" },
  { name: "Israel", dialCode: "+972", code: "IL", placeholder: "50 123 4567" },
  { name: "Turquía", dialCode: "+90", code: "TR", placeholder: "501 234 56 78" },
]

function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

interface PhoneCountryInputProps {
  value: string // Clean or full number: e.g. "+51912276085" or "+503 7000-0000"
  onChange: (fullNumber: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PhoneCountryInput({
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  className,
}: PhoneCountryInputProps) {
  // Estado del país seleccionado (por defecto El Salvador +503)
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(COUNTRIES[0])
  const [nationalNumber, setNationalNumber] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Descomponer el valor inicial si viene con código de país
  useEffect(() => {
    if (!value) {
      setNationalNumber("")
      return
    }

    const trimmed = value.trim()

    // Intentar encontrar si empieza por algún dialCode conocido (ordenando de más largo a más corto)
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    const matched = sortedCountries.find((c) => trimmed.startsWith(c.dialCode))

    if (matched) {
      setSelectedCountry(matched)
      const rest = trimmed.slice(matched.dialCode.length).trim()
      setNationalNumber(rest)
    } else if (trimmed.startsWith("+")) {
      // Tiene código desconocido, mantener tal cual
      setNationalNumber(trimmed)
    } else {
      // Sin prefijo, asumimos país actual
      setNationalNumber(trimmed)
    }
  }, [value])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Autoenfoque en el buscador
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Manejo de cambio en el número nacional
  const handleNumberChange = (raw: string) => {
    // Permitir dígitos, espacios y guiones
    const cleanDigits = raw.replace(/[^\d\s-]/g, "")
    setNationalNumber(cleanDigits)

    // Formatear el número completo internacional (E.164: +CódigoDígitos)
    const digitsOnly = cleanDigits.replace(/\D/g, "")
    if (!digitsOnly) {
      onChange("")
    } else {
      const full = `${selectedCountry.dialCode}${digitsOnly}`
      onChange(full)
    }
  }

  // Manejo de selección de país
  const handleSelectCountry = (country: CountryData) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchQuery("")

    // Reconstruir de inmediato con el nuevo código
    const digitsOnly = nationalNumber.replace(/\D/g, "")
    if (digitsOnly) {
      onChange(`${country.dialCode}${digitsOnly}`)
    }
  }

  // Filtrar países según búsqueda (nombre, código dial o ISO)
  const filteredCountries = useMemo(() => {
    const query = normalizeSearch(searchQuery)
    if (!query) return COUNTRIES

    const cleanQueryDial = query.replace(/[^\d+]/g, "")

    return COUNTRIES.filter((country) => {
      const nameNorm = normalizeSearch(country.name)
      const codeNorm = country.code.toLowerCase()
      const dialNorm = country.dialCode.replace("+", "")

      // Coincidencia por nombre (ej: "Perú" o "peru")
      if (nameNorm.includes(query)) return true

      // Coincidencia por código ISO (ej: "PE", "SV")
      if (codeNorm === query) return true

      // Coincidencia por código dial (ej: "+51", "51", "+503", "503")
      if (country.dialCode.includes(query) || (cleanQueryDial && dialNorm.startsWith(cleanQueryDial.replace("+", "")))) {
        return true
      }

      return false
    })
  }, [searchQuery])

  // Número internacional construido
  const constructedFullNumber = useMemo(() => {
    const digits = nationalNumber.replace(/\D/g, "")
    return digits ? `${selectedCountry.dialCode}${digits}` : ""
  }, [selectedCountry.dialCode, nationalNumber])

  return (
    <div className={cn("relative space-y-1.5", className)} ref={dropdownRef}>
      {/* Contenedor del Input Compuesto */}
      <div
        className={cn(
          "flex items-center w-full h-12 rounded-xl bg-background border transition-all shadow-xs overflow-hidden",
          error
            ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : isOpen
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        )}
      >
        {/* Botón Selector de País */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-full px-3 flex items-center gap-1.5 bg-muted/40 hover:bg-muted/80 transition-colors border-r border-border shrink-0 select-none text-left cursor-pointer focus:outline-hidden"
          title="Seleccionar país y código de área internacional"
        >
          {/* Badge ISO Corporativo */}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-[#eaf0e2] text-[#105238] border border-[#aeb6a1]/50">
            {selectedCountry.code}
          </span>

          {/* Código de Área */}
          <span className="text-sm font-bold text-foreground font-mono">
            {selectedCountry.dialCode}
          </span>

          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-primary"
            )}
          />
        </button>

        {/* Input del Número Local / Móvil */}
        <div className="flex-1 relative flex items-center h-full">
          <input
            type="tel"
            disabled={disabled}
            value={nationalNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={placeholder || selectedCountry.placeholder}
            className="w-full h-full px-3 py-2 text-sm font-medium bg-transparent border-0 outline-hidden focus:outline-hidden text-foreground placeholder:text-muted-foreground/60"
          />

          {nationalNumber && !disabled && (
            <button
              type="button"
              onClick={() => handleNumberChange("")}
              className="mr-2.5 p-1 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Borrar número"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Indicador de Número Construido e Información */}
      {constructedFullNumber && !error && (
        <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ee01a]" />
            Número internacional:
          </span>
          <span className="font-mono font-bold text-[#105238] dark:text-emerald-400 bg-[#eaf0e2]/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#aeb6a1]/30">
            {constructedFullNumber}
          </span>
        </div>
      )}

      {/* Modal / Menú Desplegable con Buscador Inteligente */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[290px] max-w-sm sm:max-w-md bg-card border border-border rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera del Buscador */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar país o prefijo (ej. Perú, +51, 503)..."
              className="w-full h-10 pl-9 pr-8 text-xs font-medium rounded-lg bg-muted/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista Scrollable de Países */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <Globe className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/40" />
                No se encontró ningún país con <span className="font-semibold text-foreground">"{searchQuery}"</span>
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode
                return (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer",
                      isSelected
                        ? "bg-[#eaf0e2] text-[#105238] font-bold dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Badge ISO */}
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                        isSelected
                          ? "bg-[#105238] text-white"
                          : "bg-muted text-muted-foreground border border-border"
                      )}>
                        {country.code}
                      </span>

                      {/* Nombre del País */}
                      <span className="truncate">{country.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Prefijo Dial */}
                      <span className="font-mono font-semibold text-muted-foreground">
                        {country.dialCode}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#105238] dark:text-emerald-400" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Pie informativo sutil */}
          <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>{filteredCountries.length} países disponibles</span>
            <span className="text-primary font-semibold">El Salvador (+503) por defecto</span>
          </div>
        </div>
      )}
    </div>
  )
}
