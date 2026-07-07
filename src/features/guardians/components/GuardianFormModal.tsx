import { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import type { GuardianCreateResponse } from "../interfaces/Guardian.interface";

interface GuardianFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { full_name: string; phone?: string; email?: string }) => Promise<GuardianCreateResponse>;
  onSuccess: (creds: GuardianCreateResponse) => void;
}

export default function GuardianFormModal({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
}: GuardianFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("El nombre completo del tutor es obligatorio.");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        full_name: fullName.trim(),
      };

      if (phone.trim()) payload.phone = phone.trim();
      if (email.trim()) payload.email = email.trim();

      const response = await onSubmit(payload);
      
      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      
      // Trigger credentials display modal on parent
      onSuccess(response);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Ocurrió un error al procesar el registro del tutor.");
        }
      } else {
        setError("Error de red. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl border border-slate-100 transition-all scale-100 duration-300 z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="mb-6">
          <span className="inline-block rounded-2xl bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-600 mb-2">
            Nuevo Tutor
          </span>
          <h3 className="text-xl font-black text-slate-900">
            Registrar Madre, Padre o Cuidador
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ingresa los datos personales del tutor. El sistema le asignará un código único de seguimiento y un PIN inicial.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-600">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="guardian-fullname" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Nombre Completo
            </label>
            <input
              id="guardian-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              placeholder="Ej. Ana Vargas Perez"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="guardian-phone" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Teléfono / Celular (Opcional)
            </label>
            <input
              id="guardian-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              placeholder="Ej. +591 76543210"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="guardian-email" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Correo Electrónico (Opcional)
            </label>
            <input
              id="guardian-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Ej. ana.vargas@mail.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 px-6 py-3 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition-all cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar tutor"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
