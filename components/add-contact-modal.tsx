"use client"

import { useState } from "react"
import { X, User, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

export function AddContactModal({ 
  onClose, 
  initialData 
}: { 
  onClose: () => void, 
  initialData?: { id: number, name: string, phone: string, email: string }
}) {
  const [name, setName] = useState(initialData?.name || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [loading, setLoading] = useState(false)
  const { addGuardian, updateGuardian, deleteGuardian } = useAppStore()

  const isEditing = !!initialData

  const handleSave = async () => {
    if (!name || !phone) return
    setLoading(true)
    
    let success = false
    if (isEditing && initialData) {
      success = await updateGuardian(initialData.id, name, phone, email)
    } else {
      success = await addGuardian(name, phone, email)
    }
    
    if (success) onClose()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!initialData) return
    setLoading(true)
    const success = await deleteGuardian(initialData.id)
    if (success) onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold italic text-foreground">
            {isEditing ? "Editar Guardián" : "Nuevo Guardián"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}><X className="w-5 h-5" /></Button>
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Correo Electrónico (Para recibir avisos)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="correo@ejemplo.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              className="w-full h-14 bg-primary text-primary-foreground rounded-2xl text-lg font-bold"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Contacto"}
            </Button>
            
            {isEditing && (
              <Button 
                variant="destructive"
                className="w-full h-14 rounded-2xl text-lg font-bold"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Eliminando..." : "Eliminar Contacto"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}