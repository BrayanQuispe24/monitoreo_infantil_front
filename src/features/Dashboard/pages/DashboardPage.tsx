import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  QrCode,
  Radar,
  Signal,
  UserRoundCheck,
} from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  tone: "cyan" | "emerald" | "amber" | "rose" | "slate";
};

type AlertItem = {
  type: string;
  child: string;
  daycare: string;
  status: string;
  time: string;
  tone: "rose" | "amber" | "slate";
};

type ChildStatus = {
  name: string;
  code: string;
  daycare: string;
  status: "Dentro del área" | "Fuera del área" | "Sin señal" | "GPS baja precisión";
  lastSeen: string;
};

function StatCard({ title, value, description, icon, tone }: StatCardProps) {
  const styles = {
    cyan: "from-cyan-500 to-sky-600 text-cyan-700 bg-cyan-50",
    emerald: "from-emerald-500 to-teal-600 text-emerald-700 bg-emerald-50",
    amber: "from-amber-500 to-orange-600 text-amber-700 bg-amber-50",
    rose: "from-rose-500 to-red-600 text-rose-700 bg-rose-50",
    slate: "from-slate-600 to-slate-800 text-slate-700 bg-slate-100",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${styles[tone]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{description}</p>
    </article>
  );
}

function StatusPill({ status }: { status: ChildStatus["status"] }) {
  const styles = {
    "Dentro del área": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Fuera del área": "bg-rose-50 text-rose-700 ring-rose-200",
    "Sin señal": "bg-slate-100 text-slate-700 ring-slate-200",
    "GPS baja precisión": "bg-amber-50 text-amber-700 ring-amber-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function AlertBadge({ tone, children }: { tone: AlertItem["tone"]; children: React.ReactNode }) {
  const styles = {
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${styles[tone]}`}>
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const stats = [
    {
      title: "Guarderías activas",
      value: "12",
      description: "Centros registrados y habilitados.",
      icon: <Building2 size={24} />,
      tone: "cyan" as const,
    },
    {
      title: "Niños monitoreados",
      value: "248",
      description: "Niños con registro activo.",
      icon: <UserRoundCheck size={24} />,
      tone: "emerald" as const,
    },
    {
      title: "QR activos",
      value: "18",
      description: "Códigos temporales de emparejamiento.",
      icon: <QrCode size={24} />,
      tone: "amber" as const,
    },
    {
      title: "Alertas activas",
      value: "4",
      description: "Eventos pendientes de atención.",
      icon: <AlertTriangle size={24} />,
      tone: "rose" as const,
    },
  ];

  const childStatuses: ChildStatus[] = [
    {
      name: "Mateo Vargas",
      code: "NIN-8F42K",
      daycare: "Guardería Los Pinos",
      status: "Dentro del área",
      lastSeen: "Hace 1 min",
    },
    {
      name: "Sofía Méndez",
      code: "NIN-2H91B",
      daycare: "Guardería Los Pinos",
      status: "Fuera del área",
      lastSeen: "Hace 3 min",
    },
    {
      name: "Lucas Rojas",
      code: "NIN-9P10Q",
      daycare: "Guardería Arcoíris",
      status: "Sin señal",
      lastSeen: "Hace 14 min",
    },
    {
      name: "Valeria Suárez",
      code: "NIN-6T77A",
      daycare: "Guardería Pequeños Pasos",
      status: "GPS baja precisión",
      lastSeen: "Hace 5 min",
    },
  ];

  const alerts: AlertItem[] = [
    {
      type: "OUT_OF_AREA",
      child: "Sofía Méndez",
      daycare: "Guardería Los Pinos",
      status: "Nueva",
      time: "Hace 3 min",
      tone: "rose",
    },
    {
      type: "LOW_GPS_ACCURACY",
      child: "Valeria Suárez",
      daycare: "Pequeños Pasos",
      status: "Vista",
      time: "Hace 5 min",
      tone: "amber",
    },
    {
      type: "NO_SIGNAL",
      child: "Lucas Rojas",
      daycare: "Guardería Arcoíris",
      status: "Pendiente",
      time: "Hace 14 min",
      tone: "slate",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.25),transparent_35%)]" />

          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-50 backdrop-blur-md">
                <Radar size={17} />
                Monitoreo administrativo en tiempo real
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Panel de control del Sistema SIG de Monitoreo Infantil
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-cyan-50/75 sm:text-base">
                Administra guarderías, áreas seguras, niños, tutores,
                rastreadores, códigos QR, alertas y reportes desde un solo panel.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/70">
                    Estado general
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    Sistema operativo
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-100">
                  <CheckCircle2 size={30} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <Signal className="text-cyan-100" size={22} />
                  <p className="mt-3 text-xl font-black text-white">91%</p>
                  <p className="text-xs font-medium text-cyan-50/70">Conectividad</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <MapPin className="text-emerald-100" size={22} />
                  <p className="mt-3 text-xl font-black text-white">10/12</p>
                  <p className="text-xs font-medium text-cyan-50/70">Áreas SIG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Monitoreo reciente
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Estado de niños monitoreados por guardería.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
              Ver monitoreo
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="py-3 pr-4">Niño</th>
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 pr-4">Guardería</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Última señal</th>
                </tr>
              </thead>

              <tbody>
                {childStatuses.map((child) => (
                  <tr key={child.code} className="border-b border-slate-100">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                          <UserRoundCheck size={20} />
                        </div>
                        <p className="font-black text-slate-800">{child.name}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-500">
                      {child.code}
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-600">
                      {child.daycare}
                    </td>
                    <td className="py-4 pr-4">
                      <StatusPill status={child.status} />
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-500">
                      {child.lastSeen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Alertas recientes
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Eventos generados por ubicación, señal o precisión GPS.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {alerts.map((alert) => (
              <div
                key={`${alert.type}-${alert.child}`}
                className="rounded-3xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {alert.type}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {alert.child}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {alert.daycare}
                    </p>
                  </div>

                  <AlertBadge tone={alert.tone}>{alert.status}</AlertBadge>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock3 size={15} />
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}