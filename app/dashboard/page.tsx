"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, Ticket, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

const API_BASE = "/api-proxy";

type Estado = "loading" | "success" | "pending" | "error";

interface ResultadoPago {
  reserva_id?: string;
  servicio?: string;
  tienda?: string;
  monto_total?: number;
  error?: string;
}

function PagoReservaContent() {
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<Estado>("loading");
  const [resultado, setResultado] = useState<ResultadoPago>({});
  const yaEnviado = useRef(false);

  const irAMisReservas = () => {
    window.location.href = "/?tab=profile";
  };

  useEffect(() => {
    if (yaEnviado.current) return;
    yaEnviado.current = true;

    const reservaId = searchParams.get("reserva_id") || "";
    const body = {
      reserva_id: reservaId,
      identificadorEnlaceComercio: searchParams.get("identificadorEnlaceComercio") || "",
      idTransaccion: searchParams.get("idTransaccion") || "",
      idEnlace: searchParams.get("idEnlace") || "",
      monto: searchParams.get("monto") || "",
      hash: searchParams.get("hash") || "",
    };

    if (!reservaId && !body.identificadorEnlaceComercio) {
      setEstado("error");
      setResultado({ error: "No encontramos los datos de la reserva en el enlace de retorno." });
      return;
    }

    const confirmar = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalog/confirm-payment/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setResultado(data);
          setEstado("success");
          try {
            await useAppStore.getState().fetchMyBookings?.();
          } catch {
            /* la lista se recarga al abrir Mi Perfil */
          }
        } else if (res.status === 402) {
          setResultado(data);
          setEstado("pending");
        } else {
          setResultado(data);
          setEstado("error");
        }
      } catch {
        setEstado("error");
        setResultado({ error: "No pudimos comunicarnos con el servidor. Intenta de nuevo en unos segundos." });
      }
    };
    confirmar();
  }, [searchParams]);

  useEffect(() => {
    if (estado !== "success") return;
    const t = setTimeout(irAMisReservas, 4000);
    return () => clearTimeout(t);
  }, [estado]);

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-[#aeb6a1]/40 flex flex-col items-center text-center gap-5">
      {estado === "loading" && (
        <>
          <div className="w-16 h-16 rounded-full bg-[#eaf0e2] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#105238] animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-[#105238]">Confirmando tu pago</h2>
          <p className="text-sm text-gray-500">Estamos verificando la transacción con Wompi de forma segura.</p>
        </>
      )}

      {estado === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-[#eaf0e2] flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-[#105238]" />
          </div>
          <h2 className="text-xl font-bold text-[#105238]">Pago confirmado</h2>
          <p className="text-sm text-gray-500">Tu reserva quedó pagada. Tu voucher QR ya está disponible en Mi Perfil.</p>
          <div className="w-full rounded-xl bg-[#eaf0e2] p-4 text-left text-sm space-y-2">
            {resultado.reserva_id && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Reserva</span>
                <span className="font-semibold text-[#105238]">{resultado.reserva_id}</span>
              </div>
            )}
            {resultado.servicio && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-semibold text-gray-800 text-right">{resultado.servicio}</span>
              </div>
            )}
            {resultado.tienda && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Comercio</span>
                <span className="font-semibold text-gray-800 text-right">{resultado.tienda}</span>
              </div>
            )}
            {typeof resultado.monto_total === "number" && (
              <div className="flex justify-between gap-3 border-t border-[#aeb6a1]/50 pt-2">
                <span className="text-gray-500">Total pagado</span>
                <span className="font-bold text-[#105238]">${resultado.monto_total.toFixed(2)}</span>
              </div>
            )}
          </div>
          <button
            onClick={irAMisReservas}
            className="w-full h-12 rounded-xl bg-[#105238] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0c4029] transition-colors"
          >
            <Ticket className="w-4 h-4" />
            Ver mi reserva y voucher
            <ArrowRight className="w-4 h-4 text-[#8ee01a]" />
          </button>
        </>
      )}

      {(estado === "pending" || estado === "error") && (
        <>
          <div className="w-16 h-16 rounded-full bg-[#eaf0e2] flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#105238]" />
          </div>
          <h2 className="text-xl font-bold text-[#105238]">
            {estado === "pending" ? "Pago en verificación" : "No pudimos confirmar el pago"}
          </h2>
          <p className="text-sm text-gray-500">
            {resultado.error || "Revisa el estado de tu reserva en Mi Perfil."}
          </p>
          <button
            onClick={irAMisReservas}
            className="w-full h-12 rounded-xl bg-[#105238] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0c4029] transition-colors"
          >
            Ir a mis reservas
          </button>
        </>
      )}
    </div>
  );
}

export default function DashboardPagoPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f4] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-[#105238]">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        }
      >
        <PagoReservaContent />
      </Suspense>
    </div>
  );
}
