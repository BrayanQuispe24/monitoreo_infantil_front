import { AlertTriangle, MapPin, Radar, Signal } from "lucide-react";

export const DecorativeMapPanle = () => {
    return (
        <div className="relative mt-7 overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 opacity-30">
                <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:42px_42px]" />
            </div>

            <div className="relative min-h-[220px] rounded-[1.5rem] border border-cyan-100/20 bg-slate-950/30 p-5">
                <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-50">
                    <Signal size={15} />
                    Área activa
                </div>

                <div className="absolute right-7 top-7 rounded-2xl border border-white/15 bg-white/10 p-3 text-white shadow-lg backdrop-blur-lg">
                    <Radar className="text-cyan-100" size={26} />
                </div>

                <div className="absolute left-1/2 top-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded-[2rem] border-2 border-dashed border-emerald-300/80 bg-emerald-300/10 shadow-[0_0_50px_rgba(52,211,153,0.25)]" />

                <div className="absolute left-[42%] top-[38%] flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.65)]">
                    <MapPin size={24} fill="currentColor" />
                </div>

                <div className="absolute bottom-7 left-7 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-md">
                    <p className="font-bold">Guardería Los Pinos</p>
                    <p className="mt-1 text-xs text-cyan-50/75">Zona SIG validada</p>
                </div>

                <div className="absolute bottom-7 right-7 flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/15 px-4 py-3 text-sm font-bold text-amber-50 backdrop-blur-md">
                    <AlertTriangle size={17} />
                    Precisión GPS media
                </div>
            </div>
        </div>
    );
}