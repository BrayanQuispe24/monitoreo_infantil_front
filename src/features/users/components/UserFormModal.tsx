import { useEffect, useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import type { UserResponse } from "../interfaces/User.interface";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  user: UserResponse | null;
  daycares: DaycareRegisterResponse[];
  onSubmit: (data: any) => Promise<void>;
}

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "DAYCARE_MANAGER", label: "Encargado de Guardería" },
  { value: "OPERATOR", label: "Operador de Monitoreo" },
  { value: "MONITOR", label: "Monitor" },
];

export default function UserFormModal({
  isOpen,
  onClose,
  mode,
  user,
  daycares,
  onSubmit,
}: UserFormModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MONITOR");
  const [daycareId, setDaycareId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && user) {
        setUsername(user.username);
        setEmail(user.email);
        setRole(user.role);
        setDaycareId(user.daycare_id || "");
        setPassword("");
      } else {
        setUsername("");
        setEmail("");
        setRole("MONITOR");
        setDaycareId("");
        setPassword("");
      }
      setError(null);
    }
  }, [isOpen, mode, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }
    if (username.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    if (role !== "ADMIN" && !daycareId) {
      setError("Para este rol, debes asociar una guardería obligatoriamente.");
      return;
    }

    if (mode === "create" && !password) {
      setError("La contraseña es obligatoria para nuevos usuarios.");
      return;
    }

    if (password && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        username: username.trim(),
        email: email.trim(),
        role,
        daycare_id: role === "ADMIN" ? null : daycareId || null,
      };

      if (password) {
        payload.password = password;
      }

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
        setError("Ocurrió un error al procesar la solicitud. Por favor intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm bg-slate-900/40 transition-opacity duration-300"
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
            {mode === "create" ? "Registrar Usuario Web" : "Actualizar Usuario"}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {mode === "create"
              ? "Crea una nueva cuenta web administrativa definiendo su rol de acceso."
              : "Modifica la información, el rol, la guardería asignada o actualiza la contraseña."}
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
            <label htmlFor="user-username" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Nombre de usuario
            </label>
            <input
              id="user-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="Ej. mrojas"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="user-email" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Correo electrónico
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Ej. maria@lospinos.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="user-role" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Rol
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (e.target.value === "ADMIN") {
                    setDaycareId("");
                  }
                }}
                disabled={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-daycare" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Guardería
              </label>
              <select
                id="user-daycare"
                value={daycareId}
                onChange={(e) => setDaycareId(e.target.value)}
                disabled={loading || role === "ADMIN"}
                className={`w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer ${
                  role === "ADMIN" ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50"
                }`}
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

          <div className="space-y-1.5">
            <label htmlFor="user-password" className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Contraseña {mode === "edit" && "(Opcional)"}
            </label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Dejar en blanco si no se cambia"}
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
                  Guardando...
                </>
              ) : (
                "Guardar usuario"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
