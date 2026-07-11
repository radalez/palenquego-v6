import { create } from "zustand"
import { persist } from "zustand/middleware"

const API_BASE = "/api-proxy";
const MEDIA_BASE = "/media-proxy";

// --- ESTA ES LA FUNCIÃ“N QUE LIMPIA TODO DE UN SOLO GOLPE ---
const getProxyImage = (url: string) => {
  if (!url) return "";
  let cleanUrl = url.trim();
  
  // Siempre forzar https para el dominio de producción
  cleanUrl = cleanUrl.replace("http://palenquego.com", "https://palenquego.com");
  
  // REGLA DE ORO: Si ya tiene el proxy o es una URL externa segura, NO LA TOQUES
  if (cleanUrl.includes(MEDIA_BASE) || (cleanUrl.startsWith('https://') && !cleanUrl.includes('209.97.146.210'))) {
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
  nombre?: string // <-- AÃ‘ADIR ESTO
  category: string
  location: string
  rating: number
  reviews: number
  price: number
  precio_base?: string // <-- AÃ‘ADIR ESTO
  image: string
  isRemate?: boolean
  discount?: number
  allowsPool: boolean
  spotsLeft: number
  description?: string
  descripcion?: string // <-- AÃ‘ADIR ESTO
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
  chatbotScript?: string
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
  serviceName?: string      // Mapeado desde servicio_detalle.nombre
  serviceId?: number        // Mapeado desde servicio (ID)
  location?: string
  image?: string
  leader?: { 
    name: string; 
    avatar: string 
  }
  currentMembers?: number    // Mapeado desde miembros_count
  targetMembers?: number     // Mapeado desde meta_personas
  totalPrice?: number        // Mapeado desde precio_total_servicio
  pricePerMember?: number    // Mapeado desde precio_persona
  deadline?: string
  status?: "ABIERTO" | "LLENO" | "PAGADO" | "FINALIZADO"
  members?: PoolMember[]
  payments?: PoolPayment[]
  qrCodes?: { [key: string]: string }
  createdAt?: string | Date
}

export interface Route {
  id: number;
  name: string;
  colorHex: string; 
  pathSvg?: string;
  unit_name?: string;       // Opcional con ?
  price_one_way?: string;   // Opcional con ?
  price_round_trip?: string;// Opcional con ?
  is_active?: boolean;      // Opcional con ?
  stops: {
    id?: number;
    name?: string;
    latitude: number;
    longitude: number;
    order: number;
    minutes_from_start?: number;
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


export interface Guardian {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  is_active: boolean;
}

export interface RecommendationStats {
  clicks: number
  purchases: number
  totalEarned: number
  paymentStatus: "PENDIENTE" | "PAGADO"
  lastPaymentDate?: Date
}

export interface Recommendation {
  // --- CAMPOS DEL FRONTEND ---
  id: string;
  name: string;
  link: string;
  type: "oferta" | "descuento" | "feriado" | string;
  serviceId: number;
  createdAt: Date;
  stats: RecommendationStats;

  // --- CAMPOS DE LA API ---
  tipo?: string;
  id_destino?: number;
  nombre?: string;
  descuento?: number;
  cupon?: string;
  codigo_embajador?: string;
  slug?: string; // <--- Â¡AÃ‘ADE ESTO! Es vital para construir el enlace
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
  galleryImages?: string[]
  image?: string
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
  currentUser: { 
    id: number; 
    name: string; 
    avatar: string;
    email?: string;    // El ? significa que es opcional
    telefono?: string; 
    tipo?: string;
    is_ambassador?: boolean;
  }
  accessToken: string | null
  refreshToken: string | null
  signup: (userData: any) => Promise<boolean>
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
  joinPool: (poolId: number) => Promise<boolean>
  addBooking: (booking: Omit<Booking, "id" | "qrCode">) => Booking
  updatePoolStatus: (poolId: number, status: Pool["status"]) => void  
  login: (username: string, password: string) => Promise<boolean>   
  loginWithGoogle: (token: string) => Promise<boolean>
  completeOnboarding: () => void
  logout: () => void
  upgradePlan: (planId: number) => Promise<void>
  payService: (serviceId: number, amount: number) => Promise<void>
  sendNotification: (title: string, message: string) => void
  addPaymentMethod: (method: { type: string; last4: string }) => void
  updateNotifications: (settings: { email?: boolean; sms?: boolean; push?: boolean }) => void
  rateService: (serviceId: number, stars: number) => void
  toggleFavoritePreference: (serviceId: number) => void
  removeFavoriteLike: (serviceId: number) => void
  setFavoritePreference: (serviceId: number, preference: "me_gusta" | "me_gusta_mas") => void
  addSwipeLike: (serviceId: number) => void
  addBusinessSwipeLike: (business: Business) => void
  selectTripFavorite: (serviceId: number) => void
  addRecommendation: (recommendation: Omit<Recommendation, "id"> | Recommendation) => Promise<Recommendation>
  updateRecommendationStats: (recommendationId: string, stats: Partial<RecommendationStats>) => void
  markRecommendationAsPaid: (recommendationId: string) => void
  payPool: (poolId: number, paymentType: "FULL" | "PERSONAL") => void
  fetchRoutes: () => Promise<void>
  fetchPools: () => Promise<void>
fetchRecommendations: () => Promise<void>
  plans: any[]
  fetchPlans: () => Promise<void>
  createPool: (serviceId: number, targetMembers: number, date: string, totalPrice: number) => Promise<boolean>
  guardians: Guardian[]
  fetchGuardians: () => Promise<void>
  addGuardian: (name: string, phone: string, email: string) => Promise<boolean>
  updateGuardian: (guardianId: number, name: string, phone: string, email: string) => Promise<boolean>
  deleteGuardian: (guardianId: number) => Promise<boolean>
  toggleGuardianActive: (guardianId: number, isActive: boolean) => Promise<void>
  scanQRCode: (token: string) => Promise<any>
  scanCheckpoint: (tripId: number, stopId: string, lat: number, lng: number) => Promise<any>
  changePassword: (oldPassword: string, newPassword: string) => Promise<{success: boolean, error?: string}>

  // --- DRIVER GPS LOGIC ---
  isDriverTracking: boolean
  driverGpsError: string | null
  driverGpsCount: number
  driverCurrentPos: { lat: number; lng: number } | null
  startDriverTracking: (unitId: number) => void
  stopDriverTracking: () => void
}

let driverGpsInterval: NodeJS.Timeout | null = null;

const initialServices: Service[] = []
const initialBusinesses: Business[] = []
const initialPools: Pool[] = []
const initialRoutes: Route[] = []

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL (Combinamos los tuyos con el estado de carga)
      services: initialServices,
      businesses: initialBusinesses,
      pools: [],
      bookings: [],
      favorites: [],
      userFavorites: [],
      recommendations: [],
      plans: [],
      routes: initialRoutes,
      currentUser: { id: 0, name: "", avatar: "", is_ambassador: false },
      isAuthenticated: false,      
      accessToken: null,
      refreshToken: null,      
      hasCompletedOnboarding: false,
      userPlan: "FREE",
      paymentMethods: [
        { id: "1", type: "Visa", last4: "4242", isDefault: true },
        { id: "2", type: "Mastercard", last4: "5555", isDefault: false },
      ],
      notifications: { email: true, sms: true, push: true },
      poolPaymentPending: [],
      guardians: [],
      isLoading: false,

      // --- GPS INITIAL STATE ---
      isDriverTracking: false,
      driverGpsError: null,
      driverGpsCount: 0,
      driverCurrentPos: null,

      startDriverTracking: (unitId: number) => {
        const { accessToken } = get();
        if (!navigator.geolocation || !accessToken) {
          set({ driverGpsError: "GPS no soportado o sin sesión." })
          return
        }
        
        set({ isDriverTracking: true, driverGpsError: null, driverGpsCount: 0 });
        sessionStorage.setItem('chofer-gps-active', 'true');

        const sendLocation = async (lat: number, lng: number) => {
          try {
            const res = await fetch(`${API_BASE}/transport/units/${unitId}/update_location/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
              body: JSON.stringify({ lat, lng })
            })
            if (res.ok) {
              const data = await res.json()
              set((state) => ({ driverGpsCount: state.driverGpsCount + 1, driverGpsError: null }))
              if (data.is_trip_finished) {
                get().stopDriverTracking()
              }
            } else {
              set({ driverGpsError: `Error: ${res.status}` })
            }
          } catch {
            set({ driverGpsError: "Sin conexión" })
          }
        }

        const success = (pos: GeolocationPosition) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          set({ driverCurrentPos: { lat, lng } });
          sendLocation(lat, lng);
        }
        const error = (err: GeolocationPositionError) => set({ driverGpsError: "GPS: " + err.message })

        navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000 });

        if (driverGpsInterval) clearInterval(driverGpsInterval);
        driverGpsInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000 });
        }, 10000)
      },

      stopDriverTracking: () => {
        if (driverGpsInterval) clearInterval(driverGpsInterval);
        driverGpsInterval = null;
        sessionStorage.removeItem('chofer-gps-active');
        set({ isDriverTracking: false, driverCurrentPos: null, driverGpsCount: 0 });
      },

      // --- ACCIONES DE API ---
     fetchServices: async (query = "") => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_BASE}/catalog/${query}`)
          if (!response.ok) {
            console.warn(`CatÃ¡logo no disponible (status: ${response.status}). Usando datos de prueba.`);
            set({ isLoading: false });
            return;
          }
          
          // Verificamos si la respuesta es JSON para evitar el error de "Unexpected token <"
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("No JSON response from server for catalog. Usando datos de prueba.");
            set({ isLoading: false });
            return;
          }
          
          const data = await response.json()
          const formatted = data.map((s: any) => ({
            ...s,
            id: s.id,
            name: s.nombre || s.name || "Servicio sin nombre",
            description: s.descripcion || s.description || "Sin descripciÃ³n disponible",
            location: s.ubicacion || s.location || "Palenque, El Salvador",
            price: parseFloat(s.precio_base) || parseFloat(s.price) || 0,
            image: getProxyImage(s.imagen_principal || s.image || ""),
            allowsPool: s.permite_pool || s.allows_pool || s.allowsPool || true,
            rating: parseFloat(s.calificacion) || s.rating || 5.0,
            reviews: parseInt(s.numero_resenas) || s.reviews || 0,
            businessId: s.tienda?.id || s.businessId,
            businessName: s.tienda?.nombre_comercial || s.businessName,
            businessAvatar: s.tienda?.logo ? getProxyImage(s.tienda.logo) : s.businessAvatar,
            category: s.categoria?.nombre || s.category || "General",
            spotsLeft: s.cupos_disponibles || s.spotsLeft || 0,
            isRemate: s.en_oferta || s.isRemate || false,
            discount: s.descuento || s.discount || 0,
            capacityMin: s.capacidad_min || s.capacityMin,
            capacityMax: s.capacidad_max || s.capacityMax,
            // GalerÃ­a: mapear images[] del API a galleryImages[]
            galleryImages: s.images && s.images.length > 0
              ? s.images.map((img: any) => getProxyImage(img.imagen || ""))
              : s.galleryImages || [],
            // Normalizar features a un array de strings para evitar errores de renderizado de objetos en React
            features: s.features && s.features.length > 0
              ? s.features.map((f: any) => typeof f === "string" ? f : (f.nombre || f.name || ""))
              : [],
            // --- ESTA ES LA LLAVE DEL RELOJ SUIZO ---
            linkTypes: s.link_types || s.linkTypes || [],
            chatbotScript: s.chatbot_script || null,
          }))
          set({ services: formatted, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
        }
      },

      fetchBusinesses: async () => {
        try {
          const response = await fetch(`${API_BASE}/stores/list/`)
          if (!response.ok) {
            console.warn(`Tiendas no disponibles (status: ${response.status}). Usando datos de prueba.`);
            return;
          }
          
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("No JSON response from server")
          }

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

      joinPool: async (poolId: number) => {
        const { accessToken } = get(); // Traemos el token
        set({ isLoading: true });
        try {
          
          const response = await fetch(`${API_BASE}/pools/${poolId}/join/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` // <-- Esto es vital
            },
          });

          if (response.ok) {
            const { fetchPools } = get();
            await fetchPools(); // Refrescamos la lista para ver el nuevo miembro y el progreso real
            set({ isLoading: false });
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error("Error al unirse al pool:", error);
          set({ isLoading: false });
          return false;
        }
      },

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

      signup: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          set({ isLoading: false });
          return response.ok;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (response.ok) {
            const data = await response.json();
            // Guardamos el ID REAL que viene de la base de datos de Django
            set({ 
              isAuthenticated: true, 
              accessToken: data.access, 
              refreshToken: data.refresh,
              currentUser: {
                id: data.user.id,
                name: data.user.name,
                avatar: data.user.avatar,
                email: data.user.email || "",
                telefono: data.user.telefono || "",
                tipo: data.user.tipo || "",
                is_ambassador: Boolean(data.user.is_ambassador)
              },
              isLoading: false 
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error("Error en login:", error);
          set({ isLoading: false });
          return false;
        }
      },

      loginWithGoogle: async (token) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: token }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ 
              isAuthenticated: true, 
              accessToken: data.access, 
              refreshToken: data.refresh,
              currentUser: {
                id: data.user.id,
                name: data.user.name,
                avatar: data.user.avatar || "",
                email: data.user.email || "",
                telefono: data.user.telefono || "",
                tipo: data.user.tipo || "",
                is_ambassador: Boolean(data.user.is_ambassador)
              },
              isLoading: false 
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error("Error en login con Google:", error);
          set({ isLoading: false });
          return false;
        }
      },

      changePassword: async (oldPassword, newPassword) => {
        const { accessToken } = get();
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/change-password/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
          });

          set({ isLoading: false });
          
          if (response.ok) {
            return { success: true };
          } else {
            const data = await response.json();
            return { success: false, error: data.error || "Error al cambiar contraseÃ±a" };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: "Fallo de conexiÃ³n" };
        }
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      logout: () => set({ 
          isAuthenticated: false, 
          hasCompletedOnboarding: false,
          accessToken: null,
          refreshToken: null,
          currentUser: { 
          id: 0, 
          name: "", 
          avatar: "",
          email: "",
          telefono: "",
          tipo: "",
          is_ambassador: false
        },
      }),
      upgradePlan: async (planId: number) => {
        const state = get();
        const token = state.accessToken;
        
        if (!token) {
          alert("SesiÃ³n no encontrada. Por favor, inicia sesiÃ³n de nuevo.");
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch(`${API_BASE}/auth/create-checkout-session/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan_id: planId }),
          });

          // Si el servidor dice que no estamos autorizados
          if (response.status === 401) {
            set({ isLoading: false });
            alert("Tu sesiÃ³n ha expirado. Por favor, sal y vuelve a entrar a tu cuenta.");
            return;
          }

          const data = await response.json();

          if (data.url) {
            // REDIRECCIÃ“N A STRIPE
            window.location.href = data.url;
          } else {
            const msg = data.error || data.detail || "Error en la pasarela";
            console.error("Error de Stripe:", msg);
            set({ isLoading: false });
            alert(`AtenciÃ³n: ${msg}`);
          }
        } catch (error) {
          console.error("Fallo de red:", error);
          set({ isLoading: false });
          alert("Error crÃ­tico de conexiÃ³n.");
        }
      },
      payService: async (serviceId: number, amount: number) => {
        const { accessToken, sendNotification } = get();
        set({ isLoading: true });

        try {
          // Llamamos al endpoint de servicios enviando el ID y el MONTO REAL
          const response = await fetch(`${API_BASE}/auth/pay-service/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ 
              service_id: serviceId,
              amount: amount // AquÃ­ mandamos el total con extras y personas
            }),
          });

          const data = await response.json();
          
          if (data.url) {
            // NotificaciÃ³n visual antes de salir de la app
            sendNotification(
              "Procesando Pago", 
              `Hola, mi estimado. Redirigiendo para el pago de $${amount.toLocaleString()}.`
            );
            
            // RedirecciÃ³n inmediata a la pasarela segura de Stripe
            window.location.href = data.url;
          } else {
            const errorMsg = data.error || data.detail || "No se pudo iniciar el pago";
            alert("Error: " + errorMsg);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Error de conexiÃ³n con Stripe:", error);
          set({ isLoading: false });
          alert("Fallo de conexiÃ³n. Revisa tu internet o el estado del servidor.");
        }
      },

      sendNotification: (title: string, message: string) => {
        const { notifications } = get();
        
        // NotificaciÃ³n Push si hay permiso en el navegador
        if (notifications.push && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: message });
        }

        // Logs de respaldo para Email y SMS
        if (notifications.email) console.log(`ðŸ“§ [EMAIL] ${title}: ${message}`);
        if (notifications.sms) console.log(`ðŸ“± [SMS] ${title}: ${message}`);
      },

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
            // Eliminar de favoritos. Si es servicio sintÃ©tico (id negativo), tambiÃ©n del array de services
            const isSynthetic = serviceId < 0
            return {
              userFavorites: state.userFavorites.filter((f) => f.serviceId !== serviceId),
              services: isSynthetic
                ? state.services.filter((s) => s.id !== serviceId)
                : state.services,
            }
          } else {
            return {
              userFavorites: [
                ...state.userFavorites,
                { serviceId, preference: "me_gusta", selectedForTrip: false, addedAt: new Date() },
              ],
            }
          }
        }),

      // Elimina un favorito del swipe y llama al backend para sincronizar
      removeFavoriteLike: (serviceId) =>
        set((state) => {
          const isSynthetic = serviceId < 0
          // El businessId real es el valor absoluto del syntheticId
          const backendId = isSynthetic ? Math.abs(serviceId) : serviceId
          
          // Llamada al backend para marcar como nope
          const token = localStorage.getItem('access_token')
          fetch(`/api-proxy/catalog/${backendId}/swipe/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ es_like: false })
          }).catch(e => console.error('Remove swipe error:', e))

          return {
            userFavorites: state.userFavorites.filter((f) => f.serviceId !== serviceId),
            services: isSynthetic
              ? state.services.filter((s) => s.id !== serviceId)
              : state.services,
          }
        }),

      setFavoritePreference: (serviceId, preference) =>
        set((state) => {
          const exists = state.userFavorites.some((f) => f.serviceId === serviceId)
          if (exists) {
            // Si ya existe, solo actualiza la preferencia
            return {
              userFavorites: state.userFavorites.map((f) =>
                f.serviceId === serviceId ? { ...f, preference } : f,
              ),
            }
          } else {
            // Si NO existe, agregar el nuevo favorito
            return {
              userFavorites: [
                ...state.userFavorites,
                { serviceId, preference, selectedForTrip: false, addedAt: new Date() },
              ],
            }
          }
        }),

      addSwipeLike: (serviceId) =>
        set((state) => {
          const exists = state.userFavorites.some((f) => f.serviceId === serviceId)
          if (exists) return state
          return {
            userFavorites: [
              ...state.userFavorites,
              { serviceId, preference: "me_gusta" as const, selectedForTrip: false, addedAt: new Date() },
            ],
          }
        }),

      addBusinessSwipeLike: (business) =>
        set((state) => {
          // Determinar quÃ© serviceId usar
          // Primero intentamos encontrar un servicio real del negocio
          const existingServiceId = business.services && business.services.length > 0
            ? business.services.find(sid => state.services.some(s => s.id === sid)) ?? null
            : null

          if (existingServiceId) {
            // Ya existe un servicio real - solo agregar a favoritos
            const alreadyFav = state.userFavorites.some(f => f.serviceId === existingServiceId)
            if (alreadyFav) return state
            return {
              userFavorites: [
                ...state.userFavorites,
                { serviceId: existingServiceId, preference: "me_gusta" as const, selectedForTrip: false, addedAt: new Date() },
              ],
            }
          }

          // No existe servicio real - creamos uno sintÃ©tico con ID Ãºnico negativo para no colisionar
          const syntheticId = -(business.id)
          const alreadyFav = state.userFavorites.some(f => f.serviceId === syntheticId)
          if (alreadyFav) return state

          const syntheticService: Service = {
            id: syntheticId,
            name: business.name,
            category: business.category || "general",
            location: business.location,
            rating: business.rating,
            reviews: business.reviews,
            price: 0,
            image: business.coverImage || business.image || "/placeholder.svg",
            isRemate: false,
            allowsPool: false,
            spotsLeft: 0,
            description: business.description,
            galleryImages: business.galleryImages,
          }

          return {
            services: [...state.services, syntheticService],
            userFavorites: [
              ...state.userFavorites,
              { serviceId: syntheticId, preference: "me_gusta" as const, selectedForTrip: false, addedAt: new Date() },
            ],
          }
        }),

      selectTripFavorite: (serviceId) =>
        set((state) => ({
          userFavorites: state.userFavorites.map((f) => ({
            ...f,
            selectedForTrip: f.serviceId === serviceId,
          })),
        })),

      addRecommendation: async (recommendationData) => {
        const { accessToken } = get();
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE}/marketing/generate-link/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken || localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
              service_id: recommendationData.serviceId,
              type: recommendationData.type,
              name: recommendationData.name
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // El link real usa el slug generado por Django: /ref/del-tano...
            const newRecommendation: Recommendation = {
              ...recommendationData,
              id: String(data.id),
              link: `${window.location.origin}/ref/${data.slug}`,
              createdAt: new Date(),
            };
            
            set((state) => ({ 
              recommendations: [newRecommendation, ...state.recommendations],
              isLoading: false 
            }));
            return newRecommendation;
          }
          throw new Error("Error al crear link en Django");
        } catch (error) {
          console.error("Fallo creaciÃ³n de recomendaciÃ³n:", error);
          set({ isLoading: false });
          // Fallback por si falla el servidor
          const fallback: Recommendation = { ...recommendationData, id: "temp-" + Date.now(), createdAt: new Date() };
          return fallback;
        }
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
          const { accessToken } = get();
          const response = await fetch(`${API_BASE}/transport/routes/`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });

          // Si el servidor dice 401/403, salimos limpio sin explotar
          if (!response.ok) {
            console.warn(`Rutas: servidor respondió ${response.status}.`);
            set({ routes: [], isLoading: false });
            return;
          }

          const data = await response.json();

          // Protección: si no es array (error de Django), salimos
          if (!Array.isArray(data)) {
            set({ routes: [], isLoading: false });
            return;
          }
          
          const formatted: Route[] = data.map((r: any) => ({
              id: r.id,
              name: r.name,
              colorHex: r.color_hex || '#10b981',
              unit_id: r.unit_id ?? null,
              unit_name: r.unit_name || null,
              // --- GPS VIVO ---
              unit_lat: r.unit_lat ?? null, 
              unit_lng: r.unit_lng ?? null, 
              price_one_way: String(r.price_one_way || '0'),
              price_round_trip: String(r.price_round_trip || '0'),
              is_active: r.is_active,
              // Viene del backend: true si el usuario tiene boleto activo para esta ruta
              user_has_ticket: r.user_has_ticket ?? false,
              stops: (r.stops || []).map((s: any) => ({
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


      fetchPools: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/pools/`);
          if (!response.ok) throw new Error("Error al obtener pools");
          const data = await response.json();
          
          const formatted: Pool[] = data.map((p: any) => ({
            id: p.id,
            serviceId: p.servicio,
            serviceName: p.servicio_detalle?.nombre || "Servicio Palenque",
            status: p.estado,
            targetMembers: p.meta_personas,
            currentMembers: p.miembros_actuales,
            totalPrice: parseFloat(p.precio_total_servicio),
            pricePerMember: parseFloat(p.precio_persona),
            leader: {
              name: p.lider_nombre,
              avatar: "/avatars/default.png"
            },
            location: p.servicio_detalle?.ubicacion || "El Salvador",
            image: getProxyImage(p.servicio_detalle?.imagen_principal || p.servicio_detalle?.imagen || "/placeholder.svg"),
            deadline: "24h restantes",
            createdAt: p.creado_el,
            members: [],
            payments: [],
            qrCodes: {}
          }));

          set({ pools: formatted, isLoading: false });
        } catch (error) {
          console.error("Error cargando Pools:", error);
          set({ isLoading: false });
        }
      },

      fetchRecommendations: async () => {
        set({ isLoading: true });
        try {
          // AHORA LE PEGAMOS A LA RUTA NUEVA CON EL TOKEN DE AUTENTICACIÃ“N (PASE VIP)
         // Sacamos el token a la fuerza, directo de la bÃ³veda secreta de Zustand
          const token = get().accessToken || (typeof window !== "undefined" && localStorage.getItem("app-storage") ? JSON.parse(localStorage.getItem("app-storage") as string)?.state?.accessToken : "");
          const response = await fetch(`${API_BASE}/marketing/my-links/`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            const formattedRecommendations = data.map((camp: any) => ({
              // --- DATOS VIEJOS DE RELLENO (Para que tu frontend no explote) ---
              id: camp.slug_unico || camp.codigo_embajador || `rec-${Date.now()}`,
              name: camp.nombre || "CampaÃ±a",
              link: `${typeof window !== "undefined" ? window.location.origin : ""}/ref/${camp.slug_unico}`,
              type: "descuento", 
              serviceId: camp.id_destino || 0,
              createdAt: camp.creado_el ? new Date(camp.creado_el) : new Date(),
              stats: {
                clicks: 0,
                purchases: 0,
                totalEarned: 0,
                paymentStatus: "PENDIENTE",
              },

              // --- LA JOYA DE LA CORONA (Datos reales de la nueva API) ---
              tipo: camp.tipo,
              id_destino: camp.id_destino,
              nombre: camp.nombre,
              descuento: camp.descuento,
              cupon: camp.cupon,
              codigo_embajador: camp.codigo_embajador,
              slug: camp.slug_unico // Â¡AQUÃ ATRAPAMOS EL SLUG_UNICO DE DJANGO!
            }));

            set({ recommendations: formattedRecommendations, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Error trayendo las campaÃ±as del embajador:", error);
          set({ isLoading: false });
        }
      },
      fetchPlans: async () => {
        set({ isLoading: true });
        try {
          // Apuntamos a /auth/plans/ porque asÃ­ estÃ¡ en tu urls.py
          const response = await fetch(`${API_BASE}/auth/plans/`);
          if (response.ok) {
            const data = await response.json();
            set({ plans: data, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Error cargando planes desde la API de Django:", error);
          set({ isLoading: false });
        }
      },

      generateAmbassadorLink: async (templateId: number) => {
        const state = get() as any;
        const token = state.currentUser?.access || state.currentUser?.token || state.accessToken;

        if (!token) return;

        try {
          const response = await fetch(`/api-proxy/marketing/generate-link/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ template_id: templateId })
          });

          if (response.ok) {
            const newLink = await response.json();
            
            // Actualizamos la recomendaciÃ³n especÃ­fica con el link real
            const currentRecs = get().recommendations;
            const updatedRecs = currentRecs.map(rec => 
              rec.id === String(templateId) 
                ? { ...rec, link: `${window.location.origin}/ref/${newLink.slug_unico}` }
                : rec
            );

            set({ recommendations: updatedRecs });
            return newLink.slug_unico;
          }
        } catch (error) {
          console.error("Error generando el link:", error);
        }
      },

      createPool: async (serviceId: number, targetMembers: number, dateStr: string, totalPrice: number) => {
        const { currentUser, accessToken } = get();
        set({ isLoading: true });

        const formatForDjango = (str: string) => {
          const months: { [key: string]: string } = {
            'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Ago': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
          };
          const parts = str.split(' ');
          if (parts.length < 2) return "2026-03-15";
          return `2026-${months[parts[1]]}-${parts[0].padStart(2, '0')}`;
        };

        try {
          const response = await fetch(`${API_BASE}/pools/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': accessToken ? `Bearer ${accessToken}` : '' 
            },
            body: JSON.stringify({
              servicio: serviceId,
              meta_personas: targetMembers,
              fecha_servicio: formatForDjango(dateStr),
              lider: currentUser.id,
              precio_total_servicio: totalPrice,
              estado: "ABIERTO"
            }),
          });
          
          if (response.ok) {
            await get().fetchPools();
            set({ isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      fetchGuardians: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          console.error("No hay token en el store, por eso sale el 401");
          return;
        }
        try {
          const response = await fetch(`${API_BASE}/safeflow/guardians/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            set({ guardians: data });
          }
        } catch (error) {
          console.error("Error fetching guardians:", error);
        }
      },

      addGuardian: async (name: string, phone: string, email: string) => {
        const { accessToken } = get();
        try {
          const response = await fetch(`${API_BASE}/safeflow/guardians/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify({ name: name, phone_number: phone, email: email })
          });
          if (response.ok) {
            await get().fetchGuardians(); 
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      toggleGuardianActive: async (guardianId: number, isActive: boolean) => {
        const { accessToken } = get();
        try {
          const response = await fetch(`${API_BASE}/safeflow/guardians/${guardianId}/`, {
            method: 'PATCH', // Usamos PATCH para actualizar solo un campo
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify({ is_active: isActive })
          });
          if (response.ok) {
            await get().fetchGuardians();
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      updateGuardian: async (guardianId: number, name: string, phone: string, email: string) => {
        const { accessToken } = get();
        try {
          const response = await fetch(`${API_BASE}/safeflow/guardians/${guardianId}/`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify({ name: name, phone_number: phone, email: email })
          });
          if (response.ok) {
            await get().fetchGuardians();
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      deleteGuardian: async (guardianId: number) => {
        const { accessToken } = get();
        try {
          const response = await fetch(`${API_BASE}/safeflow/guardians/${guardianId}/`, {
            method: 'DELETE',
            headers: { 
              'Authorization': `Bearer ${accessToken}` 
            }
          });
          if (response.ok) {
            await get().fetchGuardians();
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      scanQRCode: async (token: string) => {
        const { accessToken } = get();
        try {
          const response = await fetch(`${API_BASE}/safeflow/trips/scan_qr/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify({ token })
          });
          return await response.json();
        } catch (error) {
          console.error("Error al escanear QR:", error);
          return null;
        }
      },

      scanCheckpoint: async (tripId: number, stopId: string, lat: number, lng: number) => {
        const { accessToken } = get();
        try {
          const response = await fetch(`${API_BASE}/safeflow/trips/${tripId}/scan_checkpoint/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify({ 
              stop_id: stopId,
              lat: lat,
              lng: lng
            })
          });
          return await response.json();
        } catch (error) {
          console.error("Error al escanear:", error);
          return null;
        }
      },
      
    }),
    {
      name: "app-storage",
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          // v3: Eliminar TODOS los datos falsos hardcodeados
          // Solo datos reales del API deben existir
          return {
            ...persistedState,
            services: [],
            businesses: [],
            userFavorites: [],
          }
        }
        return persistedState as AppState
      },
    }
  )
);
