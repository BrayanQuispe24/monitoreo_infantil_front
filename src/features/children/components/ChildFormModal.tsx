import { useEffect, useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import type { ChildResponse } from "../interfaces/Child.interface";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";

interface ChildFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  child: ChildResponse | null;
  daycares: DaycareRegisterResponse[];
  onSubmit: (data: any) => Promise<void>;
}

export default function ChildFormModal({
  isOpen,
  onClose,
  mode,
  child,
  daycares,
  onSubmit,
}: ChildFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [daycareId, setDaycareId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && child) {
        setFullName(child.full_name);
        setAge(child.age !== null ? child.age.toString() : "");
        setDaycareId(child.daycare_id);
        setStatus(child.status || "ACTIVE");
      } else {
        setFullName("");
        setAge("");
        setDaycareId("");
        setStatus("ACTIVE");
      }
      setError(null);
    }
  }, [isOpen, mode, child]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("El nombre completo del niño es obligatorio.");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!daycareId) {
      setError("Debes asociar el niño a una guardería.");
      return;
    }

    const ageNum = age.trim() !== "" ? parseInt(age.trim(), 10) : null;
    if (ageNum !== null && (isNaN(ageNum) || ageNum < 0 || ageNum > 18)) {
      setError("La edad debe ser un número válido entre 0 y 18 años.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        full_name: fullName.trim(),
        age: ageNum,
        daycare_id: daycareId,
        status,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail.map((d: any) => `${d.loc.join(".")}: ${d.msg}`).join(", "));
        }
      } else {
        setError("Ocurrió un error al guardar la ficha del niño. Intenta de nuevo.");
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
            {mode === "create" ? "Nuevo" : "Editar"}
          </span>
          <h3 className="text-xl font-black text-slate-900">
            {mode === "create" ? "Registrar Perfil del Niño" : "Actualizar Ficha"}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {mode === "create"
              ? "Ingresa los datos básicos del niño para inscribirlo en el sistema."
              : "Modifica los datos personales, cambia su guardería o actualiza su estado."}
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
            <label htmlFor="child-fullname" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Nombre Completo del Niño
            </label>
            <input
              id="child-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              placeholder="Ej. Mateo Vargas Méndez"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="child-age" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Edad (Años)
              </label>
              <input
                id="child-age"
                type="number"
                min="0"
                max="18"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={loading}
                placeholder="Ej. 5"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="child-daycare" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Guardería Asignada
              </label>
              <select
                id="child-daycare"
                value={daycareId}
                onChange={(e) => setDaycareId(e.target.value)}
                disabled={loading}
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
          </div>

          {mode === "edit" && (
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
                Estado del Registro
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("ACTIVE")}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black transition-all border cursor-pointer ${
                    status === "ACTIVE"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/10"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  Activo
                </button>
                
                <button
                  type="button"
                  onClick={() => setStatus("INACTIVE")}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black transition-all border cursor-pointer ${
                    status === "INACTIVE"
                      ? "border-rose-500 bg-rose-50 text-rose-700 shadow-sm shadow-rose-500/10"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${status === "INACTIVE" ? "bg-rose-500 animate-pulse" : "bg-slate-300"}`} />
                  Inactivo
                </button>
              </div>
            </div>
          )}

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
                  Guardando...
                </>
              ) : (
                "Guardar ficha"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
