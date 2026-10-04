"use client"

import React, { useState, useEffect } from "react"
import {
  X, Plus, MapPin, Navigation, Car, Clock, CheckCircle2,
  Trash2, Star, Phone, MessageCircle, AlertCircle, ArrowRight,
  ShieldCheck, Sparkles, Navigation2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { RateTripModal } from "./rate-trip-modal"

interface UserRoutesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectRouteOnMap: (route: any) => void
  onStartMapPickMode?: (mode: 'origin' | 'destination') => void
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
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'my_routes' | 'create' | 'driver_requests'>(
    currentUser?.tipo === 'CHOFER' ? 'driver_requests' : 'my_routes'
  )

  // Form states for creating a route
  const [routeName, setRouteName] = useState("")
  const [originName, setOriginName] = useState("Mi ubicación actual")
  const [originLat, setOriginLat] = useState<number>(13.69294)
  const [originLng, setOriginLng] = useState<number>(-89.21819)

  const [destName, setDestName] = useState("")
  const [destLat, setDestLat] = useState<number>(13.70000)
  const [destLng, setDestLng] = useState<number>(-89.20000)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Rate trip state
  const [ratingRoute, setRatingRoute] = useState<any | null>(null)

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

  // Obtener geolocalización del navegador
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOriginLat(pos.coords.latitude)
          setOriginLng(pos.coords.longitude)
          setOriginName("Mi ubicación actual (GPS)")
        },
        () => {
          alert("No se pudo obtener tu ubicación GPS automáticamente. Puedes escribirla o marcar en el mapa.")
        }
      )
    }
  }

  // Crear ruta y solicitar viaje
  const handleCreateRoute = async (solicitar: boolean) => {
    if (!destName.trim()) {
      setFormError("Por favor ingresa un destino para tu viaje.")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const payload = {
      name: routeName.trim() || `Mi ruta ${(myUserRoutes?.length || 0) + 1}`,
      origin: {
        name: originName.trim() || "Punto de partida",
        lat: originLat,
        lng: originLng,
      },
      destination: {
        name: destName.trim(),
        lat: destLat,
        lng: destLng,
      },
      solicitar_servicio: solicitar,
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

  // Eliminar ruta
  const handleDelete = async (routeId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta ruta?")) {
      await deleteUserRoute(routeId)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
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
                Crea recorridos o solicita servicio a demanda
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
                      Crea tu primera ruta personalizada para moverte en la ciudad y pedir un chofer urbano.
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
                  const stops = route.stops || []
                  const origin = stops[0]?.name || "Origen"
                  const destination = stops[stops.length - 1]?.name || "Destino"

                  return (
                    <div
                      key={route.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                          <h4 className="text-sm font-bold text-gray-900">
                            {route.name}
                          </h4>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                            Urbano
                          </span>
                        </div>

                        {/* Estado del viaje */}
                        <div>
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
                              <p className="text-[10px] text-gray-500">Conductor asignado</p>
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
                            onClick={() => handleDelete(route.id)}
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

              {/* Origen */}
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-2">
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
                <Input
                  type="text"
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  placeholder="Dirección o punto de inicio"
                  className="rounded-xl text-xs h-10 bg-white"
                />
                {onStartMapPickMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartMapPickMode('origin')
                      onClose()
                    }}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    📍 Marcar punto de origen en el mapa
                  </button>
                )}
              </div>

              {/* Destino */}
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Destino
                </label>
                <Input
                  type="text"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  placeholder="¿A dónde vas? (Ej: Multiplaza, Metrocentro, etc.)"
                  className="rounded-xl text-xs h-10 bg-white"
                />
                {onStartMapPickMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartMapPickMode('destination')
                      onClose()
                    }}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    📍 Marcar destino en el mapa
                  </button>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => handleCreateRoute(true)}
                  disabled={isSubmitting}
                  className="w-full bg-[#064e3b] hover:bg-[#043324] text-white font-bold text-xs h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <Car className="w-4 h-4 text-[#a3e635]" />
                  {isSubmitting ? "Solicitando..." : "🚖 Confirmar y Pedir Viaje Urbano"}
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
                  Viajes esperando conductor
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
                    Mantén tu GPS activo para recibir nuevos viajes solicitados por usuarios.
                  </p>
                </div>
              ) : (
                requestedTrips.map((req: any) => {
                  const stops = req.stops || []
                  const origin = stops[0]?.name || "Origen"
                  const destination = stops[stops.length - 1]?.name || "Destino"

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border-2 border-emerald-500/20 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <h4 className="text-sm font-bold text-gray-900">{req.name}</h4>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
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

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const res = await acceptTrip(req.id)
                            if (res.success) {
                              alert("¡Has aceptado el viaje! Dirígete al punto de partida.")
                              fetchRequestedTrips()
                              fetchMyUserRoutes()
                            } else {
                              alert(res.error || "No se pudo aceptar el viaje.")
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl shadow-md gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aceptar Viaje
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onSelectRouteOnMap(req)
                            onClose()
                          }}
                          className="text-xs font-bold text-gray-700 h-10 rounded-xl px-3"
                        >
                          Ver en mapa
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

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
