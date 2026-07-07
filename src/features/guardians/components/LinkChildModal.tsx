import { useEffect, useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { ChildService } from "../../children/services/childService";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";
import type { ChildResponse } from "../../children/interfaces/Child.interface";

interface LinkChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardianCode: string;
  guardianName: string;
  daycares: DaycareRegisterResponse[];
  onSubmit: (guardianCode: string, daycareCode: string, childCode: string, relationship: string) => Promise<void>;
}

const RELATIONSHIPS = ["Madre", "Padre", "Abuela", "Abuelo", "Tía", "Tío", "Cuidador", "Responsable Legal"];

export default function LinkChildModal({
  isOpen,
  onClose,
  guardianCode,
  guardianName,
  daycares,
  onSubmit,
}: LinkChildModalProps) {
  const [selectedDaycareId, setSelectedDaycareId] = useState("");
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [selectedChildCode, setSelectedChildCode] = useState("");
  const [relationship, setRelationship] = useState("Madre");
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDaycareId("");
      setChildren([]);
      setSelectedChildCode("");
      setRelationship("Madre");
      setError(null);
    }
  }, [isOpen]);

  // Load children when daycare changes
  useEffect(() => {
    if (!selectedDaycareId) {
      setChildren([]);
      setSelectedChildCode("");
      return;
    }

    const fetchChildren = async () => {
      try {
        setLoadingChildren(true);
        setError(null);
        const childrenData = await ChildService.listarNinos(selectedDaycareId);
        // Only show active children for linking
        setChildren(childrenData.filter((c) => c.status === "ACTIVE"));
        setSelectedChildCode("");
      } catch (err) {
        console.error(err);
        setError("Error al cargar los niños de la guardería seleccionada.");
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [selectedDaycareId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDaycareId) {
      setError("Debes seleccionar una guardería.");
      return;
    }
    if (!selectedChildCode) {
      setError("Debes seleccionar un niño para vincular.");
      return;
    }
    if (!relationship.trim()) {
      setError("El parentesco o relación es obligatorio.");
      return;
    }

    const daycare = daycares.find((d) => d.id === selectedDaycareId);
    if (!daycare) {
      setError("Guardería seleccionada no es válida.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSubmit(guardianCode, daycare.code, selectedChildCode, relationship.trim());
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Ocurrió un error al vincular el niño. Intenta de nuevo.");
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
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl border border-slate-100 transition-all scale-100 duration-300 z-10">
        
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
            Vinculación
          </span>
          <h3 className="text-xl font-black text-slate-900">
            Vincular Niño a {guardianName}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Selecciona el menor al que estará asociado este tutor para el seguimiento y recepción de alertas.
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
            <label htmlFor="link-daycare" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Guardería del Niño
            </label>
            <select
              id="link-daycare"
              value={selectedDaycareId}
              onChange={(e) => setSelectedDaycareId(e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
            >
              <option value="">Selecciona guardería...</option>
              {daycares.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="link-child" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Seleccionar Niño
              </label>
              <select
                id="link-child"
                value={selectedChildCode}
                onChange={(e) => setSelectedChildCode(e.target.value)}
                disabled={saving || !selectedDaycareId || loadingChildren}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
              >
                {loadingChildren ? (
                  <option value="">Cargando niños...</option>
                ) : children.length === 0 ? (
                  <option value="">No hay niños activos</option>
                ) : (
                  <>
                    <option value="">Selecciona niño...</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.full_name} ({c.code})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="link-relation" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Relación / Parentesco
              </label>
              <select
                id="link-relation"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                disabled={saving}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={saving || !selectedChildCode}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 px-6 py-3 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Vincular niño"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
