import {
  AlertTriangle,
  MapPin,
  Radar,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { FeatureBadge } from "../components/FeatureBadge";
import { DecorativeMapPanle } from "../components/DecorativeMapPanel";
import { StatusCard } from "../components/StatusCard";
import { LoginForm } from "../components/LoginForm";

export default function LoginPage() {
  const features = [
    {
      label: "Área segura SIG",
      icon: <MapPin size={16} />,
    },
    {
      label: "Monitoreo en tiempo real",
      icon: <Radar size={16} />,
    },
    {
      label: "Alertas inteligentes",
      icon: <AlertTriangle size={16} />,
    },
    {
      label: "Gestión de niños y tutores",
      icon: <UserRoundCheck size={16} />,
    },
  ];

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-slate-950 lg:h-dvh lg:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.28),transparent_35%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/90" />

      <section className="relative grid min-h-dvh grid-cols-1 lg:h-dvh lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex items-center px-6 py-8 sm:px-10 lg:px-16 lg:py-6">
          <div className="mx-auto w-full max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-50 shadow-sm backdrop-blur-md">
              <ShieldCheck size={17} />
              Panel administrativo autorizado
            </div>

            <h1 className="mt-7 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-[3.4rem] xl:leading-[1.05]">
              Sistema SIG de Monitoreo Infantil
            </h1>

            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-cyan-50/80 sm:text-lg">
              Control administrativo para guarderías, áreas seguras,
              rastreadores y alertas en tiempo real.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {features.map((feature) => (
                <FeatureBadge
                  key={feature.label}
                  icon={feature.icon}
                  label={feature.label}
                />
              ))}
            </div>

            <DecorativeMapPanle />

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatusCard label="Estado" value="Dentro del área" tone="success" />
              <StatusCard label="Alerta" value="Fuera del área" tone="danger" />
              <StatusCard label="Señal" value="Sin señal" tone="muted" />
              <StatusCard label="GPS" value="Baja precisión" tone="warning" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-16 lg:py-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}