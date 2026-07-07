import { X, KeyRound, Copy, Check } from "lucide-react";
import { useState } from "react";

interface GuardianCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardianCode: string;
  temporaryPin: string;
  guardianName: string;
  actionType: "create" | "reset";
}

export default function GuardianCredentialsModal({
  isOpen,
  onClose,
  guardianCode,
  temporaryPin,
  guardianName,
  actionType,
}: GuardianCredentialsModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: "code" | "pin") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl border border-slate-100 transition-all scale-100 duration-300 z-10 text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Credentials Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 mb-4 shadow-inner">
          <KeyRound size={32} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900">
          {actionType === "create" ? "¡Tutor Registrado!" : "¡PIN Reseteado!"}
        </h3>
        <p className="mt-2 text-sm font-medium text-slate-500 max-w-xs mx-auto">
          Por favor entrega estas credenciales temporales a **{guardianName}** para que pueda iniciar sesión en la aplicación móvil.
        </p>

        {/* Credentials detail panel */}
        <div className="mt-6 space-y-4 rounded-3xl bg-slate-50 p-6 border border-slate-100">
          {/* Code */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
              Código de Tutor
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wide text-slate-900">
                {guardianCode}
              </span>
              <button
                onClick={() => handleCopy(guardianCode, "code")}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                {copiedCode ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-200/60 w-3/4 mx-auto" />

          {/* PIN */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
              PIN Temporal
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-[0.2em] text-cyan-600">
                {temporaryPin}
              </span>
              <button
                onClick={() => handleCopy(temporaryPin, "pin")}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                {copiedPin ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 py-3 text-xs font-black text-white transition-all cursor-pointer"
        >
          Entendido, cerrar
        </button>
      </div>
    </div>
  );
}
