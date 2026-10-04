"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  X, Plus, MapPin, Navigation, Car, Clock, CheckCircle2,
  Trash2, Star, Phone, MessageCircle, AlertCircle, ArrowRight,
  ShieldCheck, Sparkles, Navigation2, Repeat, DollarSign,
  Search, Loader2, ArrowLeftRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { RateTripModal } from "./rate-trip-modal"

// Función de distancia Haversine
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Cálculo de tarifa sugerida según distancia y tipo de viaje
function computeSuggestedFare(distKm: number, type: 'SOLO_IDA' | 'IDA_Y_VUELTA') {
  const d = Math.max(0.5, distKm)
  let base = 1.50 + d * 0.50
  if (type === 'IDA_Y_VUELTA') {
    base = base * 1.8 // Tarifa con descuento de retorno
  }
  const rounded = Math.round(base * 4) / 4
  const minFare = type === 'IDA_Y_VUELTA' ? 3.50 : 2.00
  return Math.max(minFare, rounded)
}

interface UserRoutesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectRouteOnMap: (route: any) => void
  onStartMapPickMode?: (mode: 'origin' | 'destination', center?: { lat: number; lng: number }) => void
  currentPickedOrigin?: { name: string; lat: number; lng: number } | null
  currentPickedDestination?: { name: string; lat: number; lng: number } | null
}

export function UserRoutesModal({
  isOpen,
  onClose,
  onSelectRouteOnMap,
  onStartMapPickMode,
  currentPickedOrigin,
  currentPickedDestination,
}: UserRoutesModalProps) {
  const {
    currentUser,
    myUserRoutes,
    requestedTrips,
    fetchMyUserRoutes,
    createUserRoute,
    deleteUserRoute,
    fetchRequestedTrips,
    acceptTrip,
    startTrip,
    finishTrip,
    contraofertarTrip,
    aceptarContraoferta,
    rechazarContraoferta,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'my_routes' | 'create' | 'driver_requests'>(
    currentUser?.tipo === 'CHOFER' ? 'driver_requests' : 'my_routes'
  )

  // Estados del formulario para crear ruta
  const [routeName, setRouteName] = useState("")
  const [originName, setOriginName] = useState("Mi ubicación actual")
  const [originLat, setOriginLat] = useState<number>(13.69294)
  const [originLng, setOriginLng] = useState<number>(-89.21819)

  const [destName, setDestName] = useState("")
  const [destLat, setDestLat] = useState<number>(13.70500)
  const [destLng, setDestLng] = useState<number>(-89.20500)

  // Tipo de viaje y precio ofertado
  const [tripType, setTripType] = useState<'SOLO_IDA' | 'IDA_Y_VUELTA'>('SOLO_IDA')
  const [offeredPrice, setOfferedPrice] = useState<string>("2.50")
  const [isCustomPrice, setIsCustomPrice] = useState<boolean>(false)

  // Estados de autocompletado en vivo de Google Places
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([])
  const [destSuggestions, setDestSuggestions] = useState<any[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false)
  const [isSearchingDest, setIsSearchingDest] = useState(false)
  const [isOriginFocused, setIsOriginFocused] = useState(false)
  const [isDestFocused, setIsDestFocused] = useState(false)

  // Estados de contraoferta del chofer
  const [activeCounterOfferId, setActiveCounterOfferId] = useState<number | null>(null)
  const [counterOfferAmount, setCounterOfferAmount] = useState<string>("")
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Estado para modal de confirmación de eliminación
  const [routeToDelete, setRouteToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast flotante elegante
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 3800)
  }

  // Rate trip state
  const [ratingRoute, setRatingRoute] = useState<any | null>(null)

  // Distancia estimada actual en tiempo real
  const currentEstimatedDist = getDistanceInKm(originLat, originLng, destLat, destLng)

  // Actualizar tarifa sugerida si cambia la distancia o el tipo de viaje y el usuario no fijó un precio manual
  useEffect(() => {
    if (!isCustomPrice) {
      const suggested = computeSuggestedFare(currentEstimatedDist, tripType)
      setOfferedPrice(suggested.toFixed(2))
    }
  }, [currentEstimatedDist, tripType, isCustomPrice])

  // Cargar rutas del usuario y solicitudes
  useEffect(() => {
    if (isOpen) {
      fetchMyUserRoutes()
      if (currentUser?.tipo === 'CHOFER') {
        fetchRequestedTrips()
      }
    }
  }, [isOpen, fetchMyUserRoutes, fetchRequestedTrips, currentUser?.tipo])

  // Pre-llenar nombre sugerido por defecto
  useEffect(() => {
    if (!routeName) {
      const nextNum = (myUserRoutes?.length || 0) + 1
      setRouteName(`Mi ruta ${nextNum}`)
    }
  }, [myUserRoutes, routeName])

  // Sincronizar coordenadas seleccionadas desde el mapa exterior si se pasan
  useEffect(() => {
    if (currentPickedOrigin) {
      setOriginName(currentPickedOrigin.name)
      setOriginLat(currentPickedOrigin.lat)
      setOriginLng(currentPickedOrigin.lng)
    }
  }, [currentPickedOrigin])

  useEffect(() => {
    if (currentPickedDestination) {
      setDestName(currentPickedDestination.name)
      setDestLat(currentPickedDestination.lat)
      setDestLng(currentPickedDestination.lng)
    }
  }, [currentPickedDestination])

  // Autocompletado en vivo para ORIGEN
  useEffect(() => {
    if (!originName || originName.length < 3 || !isOriginFocused) {
      setOriginSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places?.AutocompleteService) {
        setIsSearchingOrigin(true)
        try {
          const service = new (window as any).google.maps.places.AutocompleteService()
          const locationBias = new (window as any).google.maps.LatLng(originLat, originLng)
          service.getPlacePredictions(
            {
              input: originName,
              location: locationBias,
              radius: 40000,
            },
            (predictions: any, status: string) => {
              setIsSearchingOrigin(false)
              if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
                setOriginSuggestions(
                  predictions.slice(0, 5).map((p: any) => ({
                    place_id: p.place_id,
                    description: p.description,
                    main_text: p.structured_formatting?.main_text || p.description,
                    secondary_text: p.structured_formatting?.secondary_text || '',
                  }))
                )
                setShowOriginSuggestions(true)
              } else {
                setOriginSuggestions([])
              }
            }
          )
        } catch (e) {
          setIsSearchingOrigin(false)
          setOriginSuggestions([])
        }
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [originName, isOriginFocused, originLat, originLng])

  // Autocompletado en vivo para DESTINO
  useEffect(() => {
    if (!destName || destName.length < 3 || !isDestFocused) {
      setDestSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places?.AutocompleteService) {
        setIsSearchingDest(true)
        try {
          const service = new (window as any).google.maps.places.AutocompleteService()
          const locationBias = new (window as any).google.maps.LatLng(originLat, originLng)
          service.getPlacePredictions(
            {
              input: destName,
              location: locationBias,
              radius: 40000,
            },
            (predictions: any, status: string) => {
              setIsSearchingDest(false)
              if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
                setDestSuggestions(
                  predictions.slice(0, 5).map((p: any) => ({
                    place_id: p.place_id,
                    description: p.description,
                    main_text: p.structured_formatting?.main_text || p.description,
                    secondary_text: p.structured_formatting?.secondary_text || '',
                  }))
                )
                setShowDestSuggestions(true)
              } else {
                setDestSuggestions([])
              }
            }
          )
        } catch (e) {
          setIsSearchingDest(false)
          setDestSuggestions([])
        }
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [destName, isDestFocused, originLat, originLng])

  // Selección de sugerencia de Origen
  const handleSelectOriginSuggestion = (item: any) => {
    setOriginName(item.main_text || item.description)
    setShowOriginSuggestions(false)
    setOriginSuggestions([])

    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder()
      geocoder.geocode({ placeId: item.place_id }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location
          setOriginLat(loc.lat())
          setOriginLng(loc.lng())
          if (results[0].formatted_address) {
            setOriginName(results[0].formatted_address)
          }
        }
      })
    }
  }

  // Selección de sugerencia de Destino
  const handleSelectDestSuggestion = (item: any) => {
    setDestName(item.main_text || item.description)
    setShowDestSuggestions(false)
    setDestSuggestions([])

    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder()
      geocoder.geocode({ placeId: item.place_id }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location
          setDestLat(loc.lat())
          setDestLng(loc.lng())
          if (results[0].formatted_address) {
            setDestName(results[0].formatted_address)
          }
        }
      })
    }
  }

  // Obtener geolocalización del navegador con geocodificación inversa real
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setOriginLat(lat)
          setOriginLng(lng)

          // Si el destino estaba en otro país o muy lejos (> 50 km), reubicarlo cerca del origen en el mismo entorno
          const currentDist = getDistanceInKm(lat, lng, destLat, destLng)
          if (currentDist > 50) {
            setDestLat(lat + 0.012)
            setDestLng(lng + 0.012)
          }

          // Resolver dirección legible con Google Geocoder
          if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
            try {
              const geocoder = new (window as any).google.maps.Geocoder()
              const res = await geocoder.geocode({ location: { lat, lng } })
              if (res.results && res.results[0]) {
                setOriginName(res.results[0].formatted_address)
              } else {
                setOriginName("Mi ubicación actual (GPS)")
              }
            } catch (e) {
              setOriginName("Mi ubicación actual (GPS)")
            }
          } else {
            setOriginName("Mi ubicación actual (GPS)")
          }
          showToast('success', "Ubicación GPS fijada en tu entorno actual.")
        },
        () => {
          showToast('error', "No se pudo obtener tu ubicación GPS automáticamente. Puedes escribir tu dirección o marcar en el mapa.")
        }
      )
    }
  }

  // Crear ruta y solicitar viaje (con geocodificación local y validación de entorno)
  const handleCreateRoute = async (solicitar: boolean) => {
    if (!destName.trim()) {
      setFormError("Por favor ingresa un destino para tu viaje.")
      return
    }

    const priceNum = parseFloat(offeredPrice) || 0
    if (solicitar && priceNum <= 0) {
      setFormError("Por favor ingresa una tarifa válida para tu viaje.")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    let finalDestLat = destLat
    let finalDestLng = destLng
    let finalDestName = destName.trim()

    // 1. Si el usuario escribió un destino sin seleccionar sugerencia, geocodificar con sesgo estricto
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder && finalDestName) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder()
        const bounds = new (window as any).google.maps.LatLngBounds(
          { lat: originLat - 0.35, lng: originLng - 0.35 },
          { lat: originLat + 0.35, lng: originLng + 0.35 }
        )

        const geoRes: any = await new Promise((resolve) => {
          geocoder.geocode({ address: finalDestName, bounds }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0])
            } else {
              geocoder.geocode({ address: finalDestName }, (r2: any, s2: string) => {
                if (s2 === 'OK' && r2 && r2[0]) resolve(r2[0])
                else resolve(null)
              })
            }
          })
        })

        if (geoRes) {
          finalDestLat = geoRes.geometry.location.lat()
          finalDestLng = geoRes.geometry.location.lng()
          finalDestName = geoRes.formatted_address || finalDestName
        }
      } catch (err) {
        console.warn("Geocodificación de destino falló, usando coordenadas seleccionadas:", err)
      }
    }

    // 2. Control de Entorno / Distancia urbana (< 60 km para evitar saltos internacionales)
    const distKm = getDistanceInKm(originLat, originLng, finalDestLat, finalDestLng)
    if (distKm > 60) {
      setFormError(
        `El destino seleccionado se encuentra a ${distKm.toFixed(0)} km (fuera de tu ciudad o en otro país). Los viajes urbanos deben realizarse dentro de tu misma zona local.`
      )
      setIsSubmitting(false)
      return
    }

    const payload = {
      name: routeName.trim() || `Mi ruta ${(myUserRoutes?.length || 0) + 1}`,
      origin: {
        name: originName.trim() || "Punto de partida",
        lat: originLat,
        lng: originLng,
      },
      destination: {
        name: finalDestName,
        lat: finalDestLat,
        lng: finalDestLng,
      },
      solicitar_servicio: solicitar,
      tipo_viaje: tripType,
      precio_ofertado: priceNum,
    }

    const res = await createUserRoute(payload)
    setIsSubmitting(false)

    if (res.success) {
      setFormSuccess(solicitar ? "¡Viaje solicitado con éxito! Buscando choferes urbanos..." : "¡Ruta guardada como borrador!")
      setTimeout(() => {
        setFormSuccess(null)
        setActiveTab('my_routes')
        if (res.data) {
          onSelectRouteOnMap(res.data)
        }
      }, 1200)
    } else {
      setFormError(res.error || "Error al crear la ruta.")
    }
  }

  // Confirmar y eliminar ruta con modal bonito
  const confirmDelete = async () => {
    if (!routeToDelete) return
    setIsDeleting(true)
    const success = await deleteUserRoute(routeToDelete.id)
    setIsDeleting(false)
    setRouteToDelete(null)
    if (success) {
      showToast('success', "Ruta eliminada con éxito.")
    } else {
      showToast('error', "No se pudo eliminar la ruta.")
    }
  }

  // Enviar contraoferta de chofer
  const handleSendCounterOffer = async (routeId: number) => {
    const amount = parseFloat(counterOfferAmount)
    if (!amount || amount <= 0) {
      showToast('error', "Por favor ingresa una tarifa válida para tu contraoferta.")
      return
    }

    setIsSubmittingCounter(true)
    const res = await contraofertarTrip(routeId, amount)
    setIsSubmittingCounter(false)

    if (res.success) {
      showToast('success', `Contraoferta de $${amount.toFixed(2)} enviada al pasajero.`)
      setActiveCounterOfferId(null)
      fetchRequestedTrips()
    } else {
      showToast('error', res.error || "No se pudo enviar la contraoferta.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* TOAST FLOTANTE ELEGANTE */}
        {toastMsg && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300 ${
            toastMsg.type === 'success' ? 'bg-emerald-600 text-white' :
            toastMsg.type === 'error' ? 'bg-red-600 text-white' :
            'bg-gray-900 text-white'
          }`}>
            {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {toastMsg.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#064e3b] to-[#043324] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#a3e635]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">
                Mis Rutas & Taxi Urbano
              </h2>
              <p className="text-[11px] text-white/75 font-medium">
                Crea recorridos, oferta tu precio o viaja a demanda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('my_routes')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'my_routes'
                ? 'bg-white text-[#064e3b] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Mis Rutas ({myUserRoutes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-[#064e3b] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#059669]" />
            + Pedir Viaje
          </button>

          {currentUser?.tipo === 'CHOFER' && (
            <button
              onClick={() => setActiveTab('driver_requests')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'driver_requests'
                  ? 'bg-white text-[#064e3b] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Solicitudes ({requestedTrips?.length || 0})
            </button>
          )}
        </div>

        {/* TAB CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: MIS RUTAS */}
          {activeTab === 'my_routes' && (
            <div className="space-y-3">
              {myUserRoutes?.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto shadow-inner">
                    <Navigation className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      No tienes rutas creadas aún
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Crea tu primera ruta personalizada con tu propia tarifa de subasta para moverte en la ciudad.
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="bg-[#064e3b] hover:bg-[#043324] text-white text-xs font-bold h-10 px-5 rounded-xl shadow-md gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear mi primera ruta
                  </Button>
                </div>
              ) : (
                myUserRoutes.map((route: any) => {
                  const estado = route.estado_viaje || 'BORRADOR'
                  const estadoOferta = route.estado_oferta || 'PENDIENTE'
                  const stops = route.stops || []
                  const origin = stops[0]?.name || "Origen"
                  const destination = stops[stops.length - 1]?.name || "Destino"
                  const isIdaVuelta = route.tipo_viaje === 'IDA_Y_VUELTA'
                  const displayPrice = route.precio_ofertado || route.price_one_way

                  return (
                    <div
                      key={route.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                            <h4 className="text-sm font-bold text-gray-900">
                              {route.name}
                            </h4>
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                              Urbano
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isIdaVuelta 
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {isIdaVuelta ? <Repeat className="w-2.5 h-2.5" /> : <Car className="w-2.5 h-2.5" />}
                              {isIdaVuelta ? 'Ida y Retorno' : 'Solo Ida'}
                            </span>
                          </div>

                          {displayPrice && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs">
                              <span className="text-gray-500 font-medium">Tarifa ofertada:</span>
                              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                ${displayPrice}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Estado del viaje */}
                        <div className="shrink-0">
                          {estado === 'SOLICITADO' && (
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              Buscando Chofer...
                            </span>
                          )}
                          {estado === 'ACEPTADO' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Chofer Asignado
                            </span>
                          )}
                          {estado === 'EN_CURSO' && (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <Navigation2 className="w-3.5 h-3.5 text-blue-600" />
                              En Curso
                            </span>
                          )}
                          {estado === 'FINALIZADO' && (
                            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Finalizado
                            </span>
                          )}
                          {estado === 'BORRADOR' && (
                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                              Guardada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Origen y Destino */}
                      <div className="bg-gray-50/80 rounded-xl p-2.5 space-y-1.5 text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate"><strong>De:</strong> {origin}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate"><strong>A:</strong> {destination}</span>
                        </div>
                      </div>

                      {/* BANNER DE CONTRAOFERTA RECIBIDA DEL CHOFER (NEGOCIACIÓN EN VIVO) */}
                      {estadoOferta === 'CONTRAOFERTADO' && route.precio_contraoferta && (
                        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/80 space-y-2 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-black">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              <span>¡El chofer propone una contraoferta!</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                              Negociación
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs">
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold">Tu oferta:</p>
                              <p className="text-gray-500 line-through font-bold">${route.precio_ofertado}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                            <div className="text-right">
                              <p className="text-[10px] text-amber-700 font-semibold">Propuesta del Chofer:</p>
                              <p className="text-base font-black text-amber-600">${route.precio_contraoferta}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={async () => {
                                const res = await aceptarContraoferta(route.id)
                                if (res.success) {
                                  showToast('success', `¡Contraoferta de $${route.precio_contraoferta} aceptada! Chofer confirmado.`)
                                  fetchMyUserRoutes()
                                } else {
                                  showToast('error', res.error || "No se pudo aceptar la contraoferta.")
                                }
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aceptar ${route.precio_contraoferta}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const res = await rechazarContraoferta(route.id)
                                if (res.success) {
                                  showToast('info', "Contraoferta rechazada. El viaje continuará buscando otros choferes.")
                                  fetchMyUserRoutes()
                                } else {
                                  showToast('error', res.error || "No se pudo rechazar.")
                                }
                              }}
                              className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 h-9 rounded-xl px-3"
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Tarjeta de Chofer si ya fue aceptado */}
                      {route.driver_name && (
                        <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                              {route.driver_avatar ? (
                                <img src={route.driver_avatar} alt="Chofer" className="w-full h-full object-cover" />
                              ) : (
                                route.driver_name[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{route.driver_name}</p>
                              <p className="text-[10px] text-gray-500">
                                {estadoOferta === 'ACEPTADO' ? `Tarifa acordada: $${route.precio_ofertado}` : 'Conductor asignado'}
                              </p>
                            </div>
                          </div>

                          {route.driver_phone && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${route.driver_phone}`}
                                className="w-7 h-7 rounded-full bg-white text-gray-700 hover:text-emerald-700 border border-gray-200 flex items-center justify-center shadow-2xs"
                                title="Llamar al chofer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${route.driver_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center shadow-2xs"
                                title="WhatsApp al chofer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Calificación si ya finalizó */}
                      {estado === 'FINALIZADO' && (
                        <div className="pt-1 flex items-center justify-between border-t border-gray-100">
                          {route.calificacion ? (
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>{route.calificacion}.0 estrellas</span>
                              {route.comentario_calificacion && (
                                <span className="text-[11px] text-gray-400 font-normal ml-1">
                                  "{route.comentario_calificacion}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRatingRoute(route)}
                              className="text-xs font-bold text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100 h-8 rounded-xl flex items-center gap-1.5"
                            >
                              <Star className="w-3 h-3 text-amber-600" />
                              Calificar Servicio
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Acciones inferiores */}
                      <div className="flex items-center justify-between pt-1 gap-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          onClick={() => {
                            onSelectRouteOnMap(route)
                            onClose()
                          }}
                          className="bg-[#064e3b] hover:bg-[#043324] text-white text-xs font-bold h-8 px-3 rounded-xl gap-1.5"
                        >
                          <Navigation className="w-3 h-3" />
                          Ver en mapa
                        </Button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRouteToDelete(route)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar ruta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: CREAR RUTA / SOLICITAR VIAJE */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Nombre de la ruta */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Nombre de tu ruta (opcional)
                </label>
                <Input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Ej: Mi ruta 1, Casa al Trabajo..."
                  className="rounded-xl text-xs h-10"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Categoría asignada: <strong>Ciudad (Urbano)</strong>
                </span>
              </div>

              {/* Origen con Autocompletado */}
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                    Punto de Partida (Origen)
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-[10px] font-bold text-[#059669] hover:underline flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Mi GPS actual
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    value={originName}
                    onChange={(e) => setOriginName(e.target.value)}
                    onFocus={() => {
                      setIsOriginFocused(true)
                      if (originSuggestions.length > 0) setShowOriginSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                    placeholder="Dirección o punto de partida..."
                    className="rounded-xl text-xs h-10 bg-white pr-8"
                  />
                  {isSearchingOrigin && (
                    <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}

                  {/* Dropdown de Sugerencias de Origen */}
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-30 max-h-52 overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95">
                      {originSuggestions.map((sugg) => (
                        <button
                          key={sugg.place_id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectOriginSuggestion(sugg)
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/60 transition-colors flex items-start gap-2.5"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">{sugg.main_text}</p>
                            {sugg.secondary_text && (
                              <p className="text-[10px] text-gray-400 truncate">{sugg.secondary_text}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {onStartMapPickMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartMapPickMode('origin', { lat: originLat, lng: originLng })
                      onClose()
                    }}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    📍 Marcar punto de origen en el mapa
                  </button>
                )}
              </div>

              {/* Destino con Autocompletado */}
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Destino (En tu ciudad o entorno)
                  </label>
                  {currentEstimatedDist <= 50 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ~{currentEstimatedDist.toFixed(1)} km
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    value={destName}
                    onChange={(e) => setDestName(e.target.value)}
                    onFocus={() => {
                      setIsDestFocused(true)
                      if (destSuggestions.length > 0) setShowDestSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                    placeholder="¿A dónde vas? (Ej: Plaza Centro, Metrocentro, etc.)"
                    className="rounded-xl text-xs h-10 bg-white pr-8"
                  />
                  {isSearchingDest && (
                    <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}

                  {/* Dropdown de Sugerencias de Destino */}
                  {showDestSuggestions && destSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-30 max-h-52 overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95">
                      {destSuggestions.map((sugg) => (
                        <button
                          key={sugg.place_id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectDestSuggestion(sugg)
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/60 transition-colors flex items-start gap-2.5"
                        >
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">{sugg.main_text}</p>
                            {sugg.secondary_text && (
                              <p className="text-[10px] text-gray-400 truncate">{sugg.secondary_text}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {onStartMapPickMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartMapPickMode('destination', { lat: originLat, lng: originLng })
                      onClose()
                    }}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    📍 Marcar destino en el mapa
                  </button>
                )}
              </div>

              {/* TIPO DE VIAJE (SOLO IDA vs IDA Y RETORNO) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Modalidad de Viaje
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100/80 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTripType('SOLO_IDA')
                      if (!isCustomPrice) {
                        setOfferedPrice(computeSuggestedFare(currentEstimatedDist, 'SOLO_IDA').toFixed(2))
                      }
                    }}
                    className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      tripType === 'SOLO_IDA'
                        ? 'bg-white text-[#064e3b] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5 text-[#059669]" />
                    Solo Ida
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTripType('IDA_Y_VUELTA')
                      if (!isCustomPrice) {
                        setOfferedPrice(computeSuggestedFare(currentEstimatedDist, 'IDA_Y_VUELTA').toFixed(2))
                      }
                    }}
                    className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      tripType === 'IDA_Y_VUELTA'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5 text-purple-600" />
                    Ida y Retorno
                  </button>
                </div>
              </div>

              {/* OFERTA DE PRECIO (SUBASTA TIPO INDRIVE) */}
              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#064e3b] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#059669]" />
                    Tu Oferta de Tarifa (Subasta)
                  </label>
                  <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                    Sugerido: ${computeSuggestedFare(currentEstimatedDist, tripType).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">$</span>
                    <Input
                      type="number"
                      step="0.25"
                      min="1.00"
                      value={offeredPrice}
                      onChange={(e) => {
                        setOfferedPrice(e.target.value)
                        setIsCustomPrice(true)
                      }}
                      className="pl-7 text-sm font-black rounded-xl h-10 bg-white border-emerald-200 focus-visible:ring-emerald-500"
                    />
                  </div>

                  {/* Botones de ajuste rápido */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(1, (parseFloat(offeredPrice) || 0) - 0.50)
                        setOfferedPrice(val.toFixed(2))
                        setIsCustomPrice(true)
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      -$0.50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = (parseFloat(offeredPrice) || 0) + 0.50
                        setOfferedPrice(val.toFixed(2))
                        setIsCustomPrice(true)
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-50 text-[#064e3b] border border-emerald-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      +$0.50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = (parseFloat(offeredPrice) || 0) + 1.00
                        setOfferedPrice(val.toFixed(2))
                        setIsCustomPrice(true)
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-50 text-[#064e3b] border border-emerald-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      +$1.00
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 leading-tight">
                  Los conductores pueden aceptar tu tarifa o proponerte una contraoferta. Tú siempre tienes el control final.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => handleCreateRoute(true)}
                  disabled={isSubmitting}
                  className="w-full bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <Car className="w-4 h-4 text-[#a3e635]" />
                  {isSubmitting ? "Solicitando..." : `🚖 Pedir Viaje Urbano (${tripType === 'IDA_Y_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'} · $${offeredPrice})`}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleCreateRoute(false)}
                  disabled={isSubmitting}
                  className="w-full text-xs font-semibold text-gray-600 rounded-xl h-10 border-gray-200 hover:bg-gray-50"
                >
                  Guardar solo como mi ruta (Borrador)
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: SOLICITUDES DE CHOFER (SOLO CHOFERES) */}
          {activeTab === 'driver_requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">
                  Viajes esperando conductor ({requestedTrips?.length || 0})
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fetchRequestedTrips()}
                  className="text-[11px] text-[#059669] h-7 px-2 font-semibold"
                >
                  Actualizar lista
                </Button>
              </div>

              {requestedTrips?.length === 0 ? (
                <div className="py-10 text-center space-y-2 text-gray-500">
                  <Car className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-xs font-bold">No hay solicitudes activas en este momento</p>
                  <p className="text-[11px] text-gray-400">
                    Mantén tu GPS activo para recibir nuevos viajes solicitados por usuarios en tu zona.
                  </p>
                </div>
              ) : (
                requestedTrips.map((req: any) => {
                  const stops = req.stops || []
                  const origin = stops[0]?.name || "Origen"
                  const destination = stops[stops.length - 1]?.name || "Destino"
                  const isIdaVuelta = req.tipo_viaje === 'IDA_Y_VUELTA'
                  const clientPrice = req.precio_ofertado || req.price_one_way || '2.50'
                  const isCounterActive = activeCounterOfferId === req.id

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border-2 border-emerald-500/20 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <h4 className="text-sm font-bold text-gray-900">{req.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isIdaVuelta 
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {isIdaVuelta ? <Repeat className="w-2.5 h-2.5" /> : <Car className="w-2.5 h-2.5" />}
                              {isIdaVuelta ? 'Ida y Retorno' : 'Solo Ida'}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500 font-medium">Tarifa que ofrece el cliente:</span>
                            <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ${clientPrice}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                          Nueva Solicitud
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-2.5 space-y-1 text-xs">
                        <p className="text-gray-700">
                          <strong>Recogida:</strong> {origin}
                        </p>
                        <p className="text-gray-700">
                          <strong>Destino:</strong> {destination}
                        </p>
                      </div>

                      {/* CAJA DE CONTRAOFERTA SI ESTÁ ACTIVA */}
                      {isCounterActive ? (
                        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Tu Contraoferta de Precio:
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Cliente ofreció: ${clientPrice}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">$</span>
                              <Input
                                type="number"
                                step="0.25"
                                value={counterOfferAmount}
                                onChange={(e) => setCounterOfferAmount(e.target.value)}
                                className="pl-6 h-9 text-xs font-bold rounded-lg bg-white"
                                placeholder="Monto..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const current = parseFloat(counterOfferAmount) || parseFloat(clientPrice) || 0
                                setCounterOfferAmount((current + 0.50).toFixed(2))
                              }}
                              className="px-2 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-[10px] font-bold"
                            >
                              +$0.50
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const current = parseFloat(counterOfferAmount) || parseFloat(clientPrice) || 0
                                setCounterOfferAmount((current + 1.00).toFixed(2))
                              }}
                              className="px-2 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-[10px] font-bold"
                            >
                              +$1.00
                            </button>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              disabled={isSubmittingCounter}
                              onClick={() => handleSendCounterOffer(req.id)}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                            >
                              {isSubmittingCounter ? "Enviando..." : `Enviar Oferta ($${counterOfferAmount})`}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveCounterOfferId(null)}
                              className="text-xs font-semibold text-gray-600 h-9 rounded-xl px-3"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* ACEPTAR TARIFA DIRECTA */}
                          <Button
                            size="sm"
                            onClick={async () => {
                              const res = await acceptTrip(req.id)
                              if (res.success) {
                                showToast('success', "¡Has aceptado el viaje! Dirígete al punto de partida.")
                                fetchRequestedTrips()
                                fetchMyUserRoutes()
                              } else {
                                showToast('error', res.error || "No se pudo aceptar el viaje.")
                              }
                            }}
                            className="flex-1 min-w-[130px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl shadow-md gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aceptar ${clientPrice}
                          </Button>

                          {/* CONTRAOFERTAR */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActiveCounterOfferId(req.id)
                              const base = parseFloat(clientPrice) || 2.50
                              setCounterOfferAmount((base + 1.00).toFixed(2))
                            }}
                            className="text-xs font-bold text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 h-10 rounded-xl px-3 flex items-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                            Contraofertar
                          </Button>

                          {/* VER EN MAPA */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onSelectRouteOnMap(req)
                              onClose()
                            }}
                            className="text-xs font-bold text-gray-700 h-10 rounded-xl px-3"
                          >
                            Mapa
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN HERMOSO (CERO DIALOGOS DEL NAVEGADOR) */}
      {routeToDelete && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                ¿Eliminar esta ruta?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                ¿Estás seguro de que deseas eliminar <span className="font-bold text-gray-800">"{routeToDelete.name}"</span>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setRouteToDelete(null)}
                className="flex-1 rounded-xl h-11 text-xs font-bold text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-11 rounded-xl shadow-md"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CALIFICAR CHOFER */}
      {ratingRoute && (
        <RateTripModal
          routeId={ratingRoute.id}
          routeName={ratingRoute.name}
          driverName={ratingRoute.driver_name}
          driverAvatar={ratingRoute.driver_avatar}
          onClose={() => setRatingRoute(null)}
          onSuccess={() => {
            fetchMyUserRoutes()
          }}
        />
      )}
    </div>
  )
}
