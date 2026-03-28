"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RefPage() {
  const router = useRouter();
  const { slug } = useParams();

  useEffect(() => {
    const resolveLink = async () => {
      try {
        console.log("Iniciando radar para el slug:", slug);
        
        // 1. Petición al servidor de producción
        const response = await fetch(`https://palenquego.com/api/v1/marketing/resolve/${slug}/`);
        
        if (!response.ok) {
          throw new Error(`Servidor respondió con error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Data de marketing recibida:", data);

        // 2. Guardamos la huella del embajador (Cookie 30 días)
        document.cookie = `palenque_ref=${data.codigo_embajador}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        
        // Guardamos también en LocalStorage por seguridad
        localStorage.setItem("palenque_ref", data.codigo_embajador);
        localStorage.setItem("promo_cupon", data.cupon);

        // 3. Redirección según tu estructura de carpetas (/s/ o /r/)
        if (data.tipo === "SERVICE") {
          console.log("Redirigiendo a servicio:", data.id_destino);
          router.push(`/s/${data.id_destino}`);
        } else if (data.tipo === "ROUTE") {
          console.log("Redirigiendo a ruta:", data.id_destino);
          router.push(`/r/${data.id_destino}`);
        } else {
          router.push("/");
        }

      } catch (error: any) {
        console.error("ERROR EN EL RADAR:", error);
        
        // ¡MIRA ESTO! Te avisará exactamente qué falló en una ventanita
        alert("FALLO EL RADAR: " + error.message);
        
        // Comentamos la redirección al home para que puedas ver el error en consola
        // router.push("/"); 
      }
    };

    if (slug) {
      resolveLink();
    }
  }, [slug, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-6 text-xl font-bold text-slate-800">¡Validando tu descuento!</h2>
        <p className="text-slate-500 mt-2 text-center">
          Estamos preparando tu experiencia en <br />
          <span className="font-semibold text-orange-600 italic">Palenque Go</span>
        </p>
      </div>
    </div>
  );
}