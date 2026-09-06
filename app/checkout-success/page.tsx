"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Ticket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const idTransaccion = searchParams.get("idTransaccion");
    const esAprobada = searchParams.get("esAprobada") === "true";
    const ticketIdStr = searchParams.get("ticket_id");
    
    if (idTransaccion && ticketIdStr) {
      useAppStore.getState().confirmTicketWompi(parseInt(ticketIdStr), idTransaccion, esAprobada)
        .then((success) => {
          setStatus(success ? "success" : "error");
        });
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  return (
    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl p-8 flex flex-col items-center text-center space-y-6">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold">Verificando tu pago...</h2>
          <p className="text-muted-foreground text-sm">
            Estamos confirmando tu transacción con Wompi de forma segura.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Ticket className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-green-600 dark:text-green-400">¡Pago Exitoso!</h2>
          <p className="text-muted-foreground text-sm">
            Tu boleto de transporte ha sido confirmado. Puedes verlo en tu panel principal.
          </p>
          <Button className="w-full mt-4" onClick={() => router.push("/")}>
            Ver mi Boleto
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Hubo un problema</h2>
          <p className="text-muted-foreground text-sm">
            No pudimos confirmar tu pago o la transacción fue denegada por Wompi.
          </p>
          <Button className="w-full mt-4" variant="outline" onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={<p>Cargando...</p>}>
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}
