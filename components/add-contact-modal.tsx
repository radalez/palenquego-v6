"use client"

import { useState } from "react"
import { X, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

export function AddContactModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const { addGuardian } = useAppStore()

  const handleSave = async () => {
    if (!name || !phone) return
    setLoading(true)
    const success = await addGuardian(name, phone)
    if (success) onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold italic text-foreground">Nuevo Guardián</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de confianza</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Ej: Mi Papá"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="+503 7000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <Button 
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl text-lg font-bold mt-4"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Contacto"}
          </Button>
        </div>
      </div>
    </div>
  )
}