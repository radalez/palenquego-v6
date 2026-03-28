"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RefPage() {
  const router = useRouter();
  const { slug } = useParams();

  useEffect(() => {
    const resolveLink = async () => {
      try {
        // 1. Preguntamos a tu Django por el slug
        const response = await fetch(`https://palenquego.com/api/v1/marketing/resolve/${slug}/`);
        
        if (!response.ok) throw new Error("Link inválido");

        const data = await response.json();

        // 2. Guardamos la "huella" de Melvis (Cookie por 30 días)
        // Esto asegura que aunque el cliente cierre la pestaña y vuelva mañana, Melvis cobre.
        document.cookie = `palenque_ref=${data.codigo_embajador}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        
        // También lo guardamos en LocalStorage por si las moscas
        localStorage.setItem("palenque_ref", data.codigo_embajador);
        localStorage.setItem("promo_cupon", data.cupon);

        // 3. LA REDIRECCIÓN INTELIGENTE
        // Aquí es donde usamos el "tipo" y el "id_destino" que tanto nos costó sacar
        if (data.tipo === "SERVICE") {
        // Te mando a /s/[id] porque esa es tu carpeta
        router.push(`/s/${data.id_destino}`);
        } else if (data.tipo === "ROUTE") {
        // Te mando a /r/[id] porque esa es tu carpeta
        router.push(`/r/${data.id_destino}`);
        }

      } catch (error) {
        console.error("Error al resolver link:", error);
        router.push("/"); // Si algo falla, lo mandamos al home para no perder al cliente
      }
    };

    if (slug) {
      resolveLink();
    }
  }, [slug, router]);

  // Esto es lo "bonito" que verá el cliente mientras ocurre la magia
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