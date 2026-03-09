import { create } from "zustand"
import { persist } from "zustand/middleware"

const API_BASE = "/api-proxy";
const MEDIA_BASE = "/media-proxy";

// --- ESTA ES LA FUNCIÓN QUE LIMPIA TODO DE UN SOLO GOLPE ---
const getProxyImage = (url: string) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  
  // REGLA DE ORO: Si ya tiene el proxy o es una URL externa segura, NO LA TOQUES
  if (cleanUrl.includes(MEDIA_BASE) || (cleanUrl.startsWith('http') && !cleanUrl.includes('209.97.146.210'))) {
    return cleanUrl;
  }
  
  // Si viene con la IP prohibida, la cambiamos por el túnel
  return cleanUrl
    .replace("http://209.97.146.210/media", MEDIA_BASE)
    .replace("/media/", `${MEDIA_BASE}/`);
};

export interface Rating {
  userId: string
  userName: string
  stars: number
  date: Date
}

export interface Service {
  id: number
  name: string
  nombre?: string // <-- AÑADIR ESTO
  category: string
  location: string
  rating: number
  reviews: number
  price: number
  precio_base?: string // <-- AÑADIR ESTO
  image: string
  isRemate?: boolean
  discount?: number
  allowsPool: boolean
  spotsLeft: number
  description?: string
  descripcion?: string // <-- AÑADIR ESTO
  capacityMin?: number
  capacityMax?: number
  extras?: { name: string; price: number }[]
  ratings?: Rating[]
  linkTypes?: ("oferta" | "descuento" | "feriado")[]
  businessId?: number
  businessName?: string
  businessAvatar?: string
  businessRating?: number
  businessReviews?: number
  galleryImages?: string[]
  features?: string[]
  relatedServices?: number[]
  socialLinks?: {
    whatsapp?: string
    instagram?: string
    facebook?: string
  }
}

export interface PoolMember {
  name: string
  avatar: string
  paid: boolean
}

export interface PoolPayment {
  memberId: string
  name: string
  amount: number
  status: "PENDIENTE" | "PAGADO"
  paymentDate?: Date
}

export interface Pool {
  id: number
  serviceName: string
  serviceId: number
  location: string
  image: string
  leader: { name: string; avatar: string }
  currentMembers: number
  targetMembers: number
  totalPrice: number
  pricePerMember?: number
  deadline: string
  status: "ABIERTO" | "LLENO" | "PAGADO" | "FINALIZADO"
  members: PoolMember[]
  payments: PoolPayment[]
  qrCodes?: { [key: string]: string }
  createdAt: Date
}

export interface Route {
  id: number;
  name: string;
  colorHex: string; // <-- Agregamos esta línea para que el build pase
  unit_name: string;
  price_one_way: string;
  price_round_trip: string;
  is_active: boolean;
  stops: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    order: number;
    minutes_from_start: number;
  }[];
}

export interface Transportation {
  id: number
  route: Route
  drivers: string[]
  currentLocation: { latitude: number; longitude: number }
  status: "EN_RUTA" | "TALLER" | "ESPERA"
}

export interface Booking {
  id: number
  service: Service
  date: string
  time: string
  guests: number
  extras: string[]
  totalPrice: number
  status: "PENDIENTE" | "CONFIRMADO" | "COMPLETADO"
  qrCode: string
  poolId?: number
}

export interface UserFavorite {
  serviceId: number
  preference: "me_gusta" | "me_gusta_mas"
  selectedForTrip: boolean
  addedAt: Date
}

export interface RecommendationStats {
  clicks: number
  purchases: number
  totalEarned: number
  paymentStatus: "PENDIENTE" | "PAGADO"
  lastPaymentDate?: Date
}

export interface Recommendation {
  id: string
  name: string
  link: string
  type: "oferta" | "descuento" | "feriado"
  serviceId: number
  createdAt: Date
  stats: RecommendationStats
}

export interface Business {
  id: number
  name: string
  category: string
  logo: string
  coverImage: string
  rating: number
  reviews: number
  description: string
  location: string
  services: number[]
  socialLinks: {
    whatsapp?: string
    instagram?: string
    facebook?: string
    phone?: string
  }
}

interface AppState {
  services: Service[]
  businesses: Business[]
  pools: Pool[]
  bookings: Booking[]
  favorites: number[]
  userFavorites: UserFavorite[]
  recommendations: Recommendation[]
  routes: Route[]
  currentUser: { name: string; avatar: string }
  isAuthenticated: boolean
  hasCompletedOnboarding: boolean
  userPlan: "FREE" | "ORO" | "PLATINO" | "PRO"
  paymentMethods: Array<{ id: string; type: string; last4: string; isDefault: boolean }>
  notifications: { email: boolean; sms: boolean; push: boolean }
  poolPaymentPending: { poolId: number; options: "FULL" | "PERSONAL" }[]
  isLoading: boolean

  fetchServices: (query?: string) => Promise<void>
  fetchBusinesses: () => Promise<void>
  toggleFavorite: (id: number) => void
  addPool: (pool: Omit<Pool, "id" | "createdAt">) => Pool
  joinPool: (poolId: number) => void
  addBooking: (booking: Omit<Booking, "id" | "qrCode">) => Booking
  updatePoolStatus: (poolId: number, status: Pool["status"]) => void
  login: (username: string, password: string) => boolean
  completeOnboarding: () => void
  logout: () => void
  upgradePlan: (plan: "ORO" | "PLATINO" | "PRO") => void
  addPaymentMethod: (method: { type: string; last4: string }) => void
  updateNotifications: (settings: { email?: boolean; sms?: boolean; push?: boolean }) => void
  rateService: (serviceId: number, stars: number) => void
  toggleFavoritePreference: (serviceId: number) => void
  setFavoritePreference: (serviceId: number, preference: "me_gusta" | "me_gusta_mas") => void
  selectTripFavorite: (serviceId: number) => void
  addRecommendation: (recommendation: Omit<Recommendation, "id"> | Recommendation) => Recommendation
  updateRecommendationStats: (recommendationId: string, stats: Partial<RecommendationStats>) => void
  markRecommendationAsPaid: (recommendationId: string) => void
  payPool: (poolId: number, paymentType: "FULL" | "PERSONAL") => void
  fetchRoutes: () => Promise<void>
}

const initialServices: Service[] = [
  {
    id: 1,
    name: "Hotel Vista al Volcán",
    category: "hotel",
    location: "Santa Ana",
    rating: 4.9,
    reviews: 127,
    price: 85,
    image: "/volcano-view-hotel.jpg",
    isRemate: true,
    discount: 30,
    allowsPool: true,
    spotsLeft: 3,
    description: "Disfruta de vistas impresionantes al volcán desde tu habitación con todas las comodidades modernas.",
    capacityMin: 1,
    capacityMax: 4,
    extras: [{ name: "Desayuno incluido", price: 15 }, { name: "Tour al volcán", price: 45 }, { name: "Spa & masajes", price: 35 }],
    ratings: [],
    linkTypes: ["oferta", "descuento"],
    businessId: 1,
    businessName: "Hoteles Volcán El Salvador",
    businessAvatar: "HV",
    businessRating: 4.9,
    businessReviews: 127,
    galleryImages: ["/volcano-view-hotel.jpg"],
    features: ["Vistas panorámicas", "Spa completo", "Restaurante gourmet", "WiFi gratis", "Piscina temperada"],
    relatedServices: [2, 4],
    socialLinks: { whatsapp: "+50373456789", instagram: "@hotelvolcan", facebook: "HotelsVolcan" },
  },
  {
    id: 2,
    name: "Surf Experience El Tunco",
    category: "surf",
    location: "El Tunco",
    rating: 4.8,
    reviews: 89,
    price: 45,
    image: "/surfing-beach.jpg",
    isRemate: false,
    allowsPool: true,
    spotsLeft: 5,
    description: "Clases de surf para todos los niveles con instructores certificados en la mejor playa de El Salvador.",
    capacityMin: 1,
    capacityMax: 6,
    extras: [{ name: "Alquiler de tabla", price: 20 }, { name: "Sesión de fotos", price: 25 }, { name: "Almuerzo playero", price: 12 }],
    ratings: [],
    linkTypes: ["oferta"],
    businessId: 2,
    businessName: "Escuela Surf Tunco",
    businessAvatar: "ST",
    businessRating: 4.8,
    businessReviews: 89,
    galleryImages: ["/surfing-beach.jpg"],
    features: ["Instructores certificados", "Equipo de calidad", "Clases personalizadas", "Fotografía incluida"],
    relatedServices: [1, 3],
    socialLinks: { whatsapp: "+50373456790", instagram: "@surftunco", facebook: "SurfTuncoElSalvador" },
  },
  {
    id: 3,
    name: "Ruta del Café Premium",
    category: "cafe",
    location: "Ataco",
    rating: 5.0,
    reviews: 64,
    price: 35,
    image: "/coffee-plantation.jpg",
    isRemate: false,
    allowsPool: true,
    spotsLeft: 8,
    description: "Recorre las fincas de café más exclusivas y aprende todo sobre el proceso del grano a la taza.",
    capacityMin: 2,
    capacityMax: 8,
    extras: [
      { name: "Degustación premium", price: 15 },
      { name: "Bolsa de café 1lb", price: 18 },
      { name: "Almuerzo típico", price: 12 },
    ],
    ratings: [],
    linkTypes: ["feriado"],
    businessId: 3,
    businessName: "Cafeterías Ataco Exclusivo",
    businessAvatar: "CA",
    businessRating: 5.0,
    businessReviews: 64,
    galleryImages: ["/coffee-plantation.jpg"],
    features: ["Plantaciones orgánicas", "Degustación gourmet", "Almuerzo típico", "Tour educativo"],
    relatedServices: [4, 5],
    socialLinks: {
      whatsapp: "+50373456791",
      instagram: "@cafeatacoelsalvador",
      facebook: "CafeteríasAtaco",
    },
  },
  {
    id: 4,
    name: "Parque El Imposible Trek",
    category: "eco",
    location: "Ahuachapán",
    rating: 4.7,
    reviews: 156,
    price: 55,
    image: "/rainforest-hiking.jpg",
    isRemate: true,
    discount: 20,
    allowsPool: true,
    spotsLeft: 4,
    description: "Aventura en el bosque nuboso más biodiverso de El Salvador con guías expertos.",
    capacityMin: 2,
    capacityMax: 10,
    extras: [
      { name: "Guía privado", price: 30 },
      { name: "Equipo de camping", price: 25 },
      { name: "Comida orgánica", price: 15 },
    ],
    ratings: [],
    linkTypes: ["descuento", "feriado"],
    businessId: 4,
    businessName: "Ecoturismo Salvadoreño",
    businessAvatar: "ES",
    businessRating: 4.7,
    businessReviews: 156,
    galleryImages: ["/rainforest-hiking.jpg"],
    features: ["Biodiversidad única", "Guías expertos", "Equipamiento completo", "Avistamiento de fauna"],
    relatedServices: [1, 3],
    socialLinks: {
      whatsapp: "+50373456792",
      instagram: "@ecoturismosalvador",
      facebook: "EcoturismoSalvadoreno",
    },
  },
  {
    id: 5,
    name: "Pupusería La Abuela",
    category: "food",
    location: "San Salvador",
    rating: 4.9,
    reviews: 312,
    price: 12,
    image: "/traditional-pupusas.jpg",
    isRemate: false,
    allowsPool: false,
    spotsLeft: 0,
    description: "Las mejores pupusas tradicionales de El Salvador, receta de tres generaciones.",
    capacityMin: 1,
    capacityMax: 20,
    ratings: [],
    linkTypes: ["oferta"],
    businessId: 5,
    businessName: "Pupusería La Abuela",
    businessAvatar: "PA",
    businessRating: 4.9,
    businessReviews: 312,
    galleryImages: ["/traditional-pupusas.jpg"],
    features: ["Receta tradicional", "Ingredientes frescos", "Comida casera", "Auténtica salvadoreña"],
    relatedServices: [6],
    socialLinks: {
      whatsapp: "+50373456793",
      instagram: "@pupuseriaabuela",
      facebook: "PupuseriaLaAbuela",
    },
  },
  {
    id: 6,
    name: "Festival del Añil",
    category: "events",
    location: "Suchitoto",
    rating: 4.6,
    reviews: 78,
    price: 25,
    image: "/cultural-festival.jpg",
    isRemate: true,
    discount: 15,
    allowsPool: true,
    spotsLeft: 12,
    description: "Vive la tradición del añil con talleres, música y gastronomía local.",
    capacityMin: 1,
    capacityMax: 15,
    extras: [
      { name: "Taller de teñido", price: 20 },
      { name: "Comida tradicional", price: 10 },
    ],
    ratings: [],
    linkTypes: ["feriado"],
    businessId: 6,
    businessName: "Eventos Culturales Suchitoto",
    businessAvatar: "EC",
    businessRating: 4.6,
    businessReviews: 78,
    galleryImages: ["/cultural-festival.jpg"],
    features: ["Taller de teñido", "Música tradicional", "Gastronomía local", "Experiencia cultural"],
    relatedServices: [5],
    socialLinks: {
      whatsapp: "+50373456794",
      instagram: "@festivalesuchioto",
      facebook: "FestivalesSuchitoto",
    },
  },
]

const initialBusinesses: Business[] = [
  {
    id: 1,
    name: "Hoteles Volcán El Salvador",
    category: "hotel",
    logo: "HV",
    coverImage: "/volcano-view-hotel.jpg",
    rating: 4.9,
    reviews: 127,
    description: "Cadena hotelera con las mejores vistas volcánicas de El Salvador. Experiencia premium con todos los servicios.",
    location: "Santa Ana, El Salvador",
    services: [1],
    socialLinks: {
      whatsapp: "+50373456789",
      instagram: "@hotelvolcan",
      facebook: "HotelsVolcan",
      phone: "+50324567890",
    },
  },
  {
    id: 2,
    name: "Escuela Surf Tunco",
    category: "surf",
    logo: "ST",
    coverImage: "/surfing-beach.jpg",
    rating: 4.8,
    reviews: 89,
    description: "Escuela de surf con instructores certificados internacionalmente. Clases para principiantes hasta avanzados.",
    location: "El Tunco, El Salvador",
    services: [2],
    socialLinks: {
      whatsapp: "+50373456790",
      instagram: "@surftunco",
      facebook: "SurfTuncoElSalvador",
      phone: "+50324567891",
    },
  },
  {
    id: 3,
    name: "Cafeterías Ataco Exclusivo",
    category: "cafe",
    logo: "CA",
    coverImage: "/coffee-plantation.jpg",
    rating: 5.0,
    reviews: 64,
    description: "Café gourmet de las mejores plantaciones de El Salvador. Tours educativos y degustaciones premium.",
    location: "Ataco, El Salvador",
    services: [3],
    socialLinks: {
      whatsapp: "+50373456791",
      instagram: "@cafeatacoelsalvador",
      facebook: "CafeteríasAtaco",
      phone: "+50324567892",
    },
  },
  {
    id: 4,
    name: "Ecoturismo Salvadoreño",
    category: "eco",
    logo: "ES",
    coverImage: "/rainforest-hiking.jpg",
    rating: 4.7,
    reviews: 156,
    description: "Operador turístico especializado en aventura y naturaleza. Rutas diseñadas para conservación ambiental.",
    location: "Ahuachapán, El Salvador",
    services: [4],
    socialLinks: {
      whatsapp: "+50373456792",
      instagram: "@ecoturismosalvador",
      facebook: "EcoturismoSalvadoreno",
      phone: "+50324567893",
    },
  },
  {
    id: 5,
    name: "Pupusería La Abuela",
    category: "food",
    logo: "PA",
    coverImage: "/traditional-pupusas.jpg",
    rating: 4.9,
    reviews: 312,
    description: "Tradición culinaria salvadoreña desde 1975. Las mejores pupusas con receta auténtica.",
    location: "San Salvador, El Salvador",
    services: [5],
    socialLinks: {
      whatsapp: "+50373456793",
      instagram: "@pupuseriaabuela",
      facebook: "PupuseriaLaAbuela",
      phone: "+50324567894",
    },
  },
  {
    id: 6,
    name: "Eventos Culturales Suchitoto",
    category: "events",
    logo: "EC",
    coverImage: "/cultural-festival.jpg",
    rating: 4.6,
    reviews: 78,
    description: "Promotora de eventos y experiencias culturales. Celebramos la identidad salvadoreña.",
    location: "Suchitoto, El Salvador",
    services: [6],
    socialLinks: {
      whatsapp: "+50373456794",
      instagram: "@festivalesuchioto",
      facebook: "FestivalesSuchitoto",
      phone: "+50324567895",
    },
  },
]

const initialPools: Pool[] = [
  {
    id: 1,
    serviceName: "Hotel Vista al Volcán",
    serviceId: 1,
    location: "Santa Ana",
    image: "/volcano-view-hotel.jpg",
    leader: { name: "María G.", avatar: "MG" },
    currentMembers: 3,
    targetMembers: 4,
    totalPrice: 340,
    pricePerMember: 85,
    deadline: "2h 30m",
    status: "ABIERTO",
    members: [
      { name: "María G.", avatar: "MG", paid: true },
      { name: "Carlos R.", avatar: "CR", paid: true },
      { name: "Ana L.", avatar: "AL", paid: false },
    ],
    payments: [],
    createdAt: new Date(),
  },
  {
    id: 2,
    serviceName: "Surf Experience El Tunco",
    serviceId: 2,
    location: "El Tunco",
    image: "/surfing-beach.jpg",
    leader: { name: "José P.", avatar: "JP" },
    currentMembers: 5,
    targetMembers: 5,
    totalPrice: 225,
    pricePerMember: 45,
    deadline: "Cerrado",
    status: "PAGADO",
    members: [
      { name: "José P.", avatar: "JP", paid: true },
      { name: "Luis M.", avatar: "LM", paid: true },
      { name: "Sofia T.", avatar: "ST", paid: true },
      { name: "Diego V.", avatar: "DV", paid: true },
      { name: "Elena R.", avatar: "ER", paid: true },
    ],
    qrCodes: {
      "José P.": "QR-2-0-COMPLETE",
      "Luis M.": "QR-2-1-COMPLETE",
      "Sofia T.": "QR-2-2-COMPLETE",
      "Diego V.": "QR-2-3-COMPLETE",
      "Elena R.": "QR-2-4-COMPLETE",
    },
    payments: [
      { memberId: "1", name: "José P.", amount: 45, status: "PAGADO", paymentDate: new Date() },
      { memberId: "2", name: "Luis M.", amount: 45, status: "PAGADO", paymentDate: new Date() },
      { memberId: "3", name: "Sofia T.", amount: 45, status: "PAGADO", paymentDate: new Date() },
      { memberId: "4", name: "Diego V.", amount: 45, status: "PAGADO", paymentDate: new Date() },
      { memberId: "5", name: "Elena R.", amount: 45, status: "PAGADO", paymentDate: new Date() },
    ],
    createdAt: new Date(),
  },
]

const initialRoutes: Route[] = [
  {
    id: 1,
    name: "Ruta del Sol",
    pathSvg: "M10 10 L100 100 L200 50 L300 150",
    colorHex: "#F59E0B",
    stops: [
      { latitude: 13.6843, longitude: -89.2191, order: 1 },
      { latitude: 13.7339, longitude: -89.2191, order: 2 },
    ],
  },
]



export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL (Combinamos los tuyos con el estado de carga)
      services: initialServices,
      businesses: initialBusinesses,
      pools: initialPools,
      bookings: [],
      favorites: [],
      userFavorites: [],
      recommendations: [],
      routes: initialRoutes,
      currentUser: { name: "Juan D.", avatar: "JD" },
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      userPlan: "FREE",
      paymentMethods: [
        { id: "1", type: "Visa", last4: "4242", isDefault: true },
        { id: "2", type: "Mastercard", last4: "5555", isDefault: false },
      ],
      notifications: { email: true, sms: true, push: true },
      poolPaymentPending: [],
      isLoading: false,

      // --- ACCIONES DE API ---
     fetchServices: async (query = "") => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_BASE}/catalog/${query}`)
          const data = await response.json()
          const formatted = data.map((s: any) => ({
            ...s,
            // UNIFICACIÓN DE CAMPOS: Mapeamos lo que viene de la API a tus nombres de variable
            id: s.id,
            name: s.nombre || s.name || "Servicio sin nombre",
            description: s.descripcion || s.description || "Sin descripción disponible",
            location: s.ubicacion || s.location || "Palenque, El Salvador",
            price: parseFloat(s.precio_base) || parseFloat(s.price) || 0,
            image: getProxyImage(s.imagen_principal || s.image || ""),
            rating: parseFloat(s.calificacion) || s.rating || 5.0,
            reviews: parseInt(s.numero_resenas) || s.reviews || 0,
            businessId: s.tienda?.id || s.businessId,
            category: s.categoria?.nombre || s.category || "General",
            spotsLeft: s.cupos_disponibles || s.spotsLeft || 0,
            isRemate: s.en_oferta || s.isRemate || false,
            discount: s.descuento || s.discount || 0,
          }))
          set({ services: formatted, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
        }
      },

      fetchBusinesses: async () => {
        try {
          const response = await fetch(`${API_BASE}/stores/list/`)
          const data = await response.json()
          
          const formattedBusinesses = data.map((b: any) => ({
            ...b,
            name: b.nombre_comercial || b.name,
            description: b.biografia || b.description || "",
            location: b.ubicacion_gps || b.location || "El Salvador",
            // Aplicamos el filtro blindado a los dos campos de imagen
            logo: getProxyImage(b.logo || ""),
            coverImage: getProxyImage(b.portada || b.coverImage || ""),
            rating: b.rating || 5.0,
            reviews: b.reviews || 0,
            category: b.category || "General",
            services: b.services || [],
            socialLinks: b.socialLinks || {},
          }))

          set({ businesses: formattedBusinesses })
        } catch (error) {
          console.error("Error tiendas:", error)
        }
      },
      // --- TUS FUNCIONES ORIGINALES (SIN TOCAR NADA) ---
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id) ? state.favorites.filter((f) => f !== id) : [...state.favorites, id],
        })),

      addPool: (poolData) => {
        const newPool: Pool = {
          ...poolData,
          id: Date.now(),
          createdAt: new Date(),
        }
        set((state) => ({ pools: [...state.pools, newPool] }))
        return newPool
      },

      joinPool: (poolId) =>
        set((state) => ({
          pools: state.pools.map((pool) => {
            if (pool.id === poolId && pool.currentMembers < pool.targetMembers) {
              const updatedPool = {
                ...pool,
                currentMembers: pool.currentMembers + 1,
                members: [...pool.members, { name: state.currentUser.name, avatar: state.currentUser.avatar, paid: false }],
              }
              if (updatedPool.currentMembers >= updatedPool.targetMembers) {
                updatedPool.status = "LLENO"
                updatedPool.deadline = "Cerrado"
              }
              return updatedPool
            }
            return pool
          }),
        })),

      addBooking: (bookingData) => {
        const newBooking: Booking = {
          ...bookingData,
          id: Date.now(),
          qrCode: `PGO-${Date.now().toString(36).toUpperCase()}`,
        }
        set((state) => ({ bookings: [...state.bookings, newBooking] }))
        return newBooking
      },

      updatePoolStatus: (poolId, status) =>
        set((state) => ({
          pools: state.pools.map((pool) => (pool.id === poolId ? { ...pool, status } : pool)),
        })),

      login: (username, password) => {
        if (username === "demo" && password === "1234") {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      logout: () => set({ isAuthenticated: false, hasCompletedOnboarding: false }),
      upgradePlan: (plan) => set({ userPlan: plan }),
      addPaymentMethod: (method) =>
        set((state) => ({
          paymentMethods: [
            ...state.paymentMethods.map((m) => ({ ...m, isDefault: false })),
            { id: Date.now().toString(), ...method, isDefault: true },
          ],
        })),

      updateNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),

      rateService: (serviceId, stars) =>
        set((state) => ({
          services: state.services.map((service) => {
            if (service.id === serviceId) {
              const currentRatings = service.ratings || []
              const newRating: Rating = {
                userId: "user-" + Date.now(),
                userName: state.currentUser.name,
                stars,
                date: new Date(),
              }
              const allRatings = [...currentRatings, newRating]
              const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0)
              const averageRating = totalStars / allRatings.length
              return {
                ...service,
                rating: parseFloat(averageRating.toFixed(1)),
                reviews: allRatings.length,
                ratings: allRatings,
              }
            }
            return service
          }),
        })),

      toggleFavoritePreference: (serviceId) =>
        set((state) => {
          const existingFavorite = state.userFavorites.find((f) => f.serviceId === serviceId)
          if (existingFavorite) {
            return { userFavorites: state.userFavorites.filter((f) => f.serviceId !== serviceId) }
          } else {
            return {
              userFavorites: [
                ...state.userFavorites,
                { serviceId, preference: "me_gusta", selectedForTrip: false, addedAt: new Date() },
              ],
            }
          }
        }),

      setFavoritePreference: (serviceId, preference) =>
        set((state) => ({
          userFavorites: state.userFavorites.map((f) =>
            f.serviceId === serviceId ? { ...f, preference } : f,
          ),
        })),

      selectTripFavorite: (serviceId) =>
        set((state) => ({
          userFavorites: state.userFavorites.map((f) => ({
            ...f,
            selectedForTrip: f.serviceId === serviceId,
          })),
        })),

      addRecommendation: (recommendationData) => {
        const newRecommendation: Recommendation = {
          ...recommendationData,
          id: "rec-" + Date.now(),
        }
        set((state) => ({ recommendations: [...state.recommendations, newRecommendation] }))
        return newRecommendation
      },

      updateRecommendationStats: (recommendationId, stats) =>
        set((state) => ({
          recommendations: state.recommendations.map((rec) =>
            rec.id === recommendationId ? { ...rec, stats: { ...rec.stats, ...stats } } : rec,
          ),
        })),

      markRecommendationAsPaid: (recommendationId) =>
        set((state) => ({
          recommendations: state.recommendations.map((rec) =>
            rec.id === recommendationId
              ? { ...rec, stats: { ...rec.stats, paymentStatus: "PAGADO", lastPaymentDate: new Date() } }
              : rec,
          ),
        })),

        payPool: (poolId, paymentType) => {
        // Aquí puedes meter la lógica real después. 
        // Con solo declarar esto, TypeScript dejará de chillar.
      },

     fetchRoutes: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/transport/routes/`);
          const data = await response.json();
          const formatted: Route[] = data.map((r: any) => ({
            id: r.id, // Se queda como número
            name: r.name,
            colorHex: r.color_hex || '#10b981', // Mapea el color de Django al componente
            unit_name: r.unit_name || "Unidad Estándar",
            price_one_way: String(r.price_one_way), // Se queda como string
            price_round_trip: String(r.price_round_trip), // Se queda como string
            is_active: r.is_active,
            stops: r.stops.map((s: any) => ({
              id: s.id,
              name: s.name,
              latitude: parseFloat(s.latitude),
              longitude: parseFloat(s.longitude),
              order: s.order,
              minutes_from_start: s.minutes_from_start
            }))
          }));
          set({ routes: formatted, isLoading: false });
        } catch (error) {
          console.error("Error API Rutas:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "app-storage",
    }
  )
);