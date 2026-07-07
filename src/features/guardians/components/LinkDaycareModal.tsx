import { useEffect, useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";

interface LinkDaycareModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardianCode: string;
  guardianName: string;
  daycares: DaycareRegisterResponse[];
  onSubmit: (guardianCode: string, daycareCode: string) => Promise<void>;
}

export default function LinkDaycareModal({
  isOpen,
  onClose,
  guardianCode,
  guardianName,
  daycares,
  onSubmit,
}: LinkDaycareModalProps) {
  const [selectedDaycareCode, setSelectedDaycareCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDaycareCode("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDaycareCode) {
      setError("Debes seleccionar una guardería.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSubmit(guardianCode, selectedDaycareCode);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Ocurrió un error al vincular la guardería. Intenta de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={saving ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl border border-slate-100 transition-all scale-100 duration-300 z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="mb-6">
          <span className="inline-block rounded-2xl bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-600 mb-2">
            Vincular Guardería
          </span>
          <h3 className="text-xl font-black text-slate-900">
            Asociar Guardería a {guardianName}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Asocia directamente este tutor a una guardería. Nota: Vincular a un niño automáticamente asocia su guardería correspondiente.
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
            <label htmlFor="direct-daycare" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Seleccionar Guardería
            </label>
            <select
              id="direct-daycare"
              value={selectedDaycareCode}
              onChange={(e) => setSelectedDaycareCode(e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
            >
              <option value="">Selecciona guardería...</option>
              {daycares.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selectedDaycareCode}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 px-6 py-3 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Asociar guardería"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
