"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RefPage() {
  const router = useRouter();
  const { slug } = useParams();

  useEffect(() => {
    const resolveLink = async () => {
      try {
        // USAMOS TU PROPIO PROXY (/api-proxy)
        // Esto es lo que ya usas en store.ts para login y servicios
        const response = await fetch(`/api-proxy/marketing/resolve/${slug}/`);
        
        if (!response.ok) throw new Error("Link inválido");

        const data = await response.json();

        // Guardamos la huella del embajador (Cookie 30 días)
        document.cookie = `palenque_ref=${data.codigo_embajador}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        
        // Sincronizamos con tu localStorage como el resto de tu app
        localStorage.setItem("palenque_ref", data.codigo_embajador);
        localStorage.setItem("promo_cupon", data.cupon);

        // REDIRECCIÓN INTELIGENTE A TUS CARPETAS REALES (/s/ o /r/)
        if (data.tipo === "SERVICE") {
          router.push(`/s/${data.id_destino}`);
        } else if (data.tipo === "ROUTE") {
          router.push(`/r/${data.id_destino}`);
        }

      } catch (error) {
        console.error("Error en el radar de marketing:", error);
        router.push("/"); // Seguridad: al home si el slug no existe
      }
    };

    if (slug) {
      resolveLink();
    }
  }, [slug, router]);

  // Aquí tienes tu loader naranja intacto y funcionando
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