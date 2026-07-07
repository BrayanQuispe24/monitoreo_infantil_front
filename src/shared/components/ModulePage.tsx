import type { ReactNode } from "react";
import { CheckCircle2, Plus, Search } from "lucide-react";

type ModulePageProps = {
  title: string;
  description: string;
  icon: ReactNode;
  actions: string[];
  columns: string[];
  rows: string[][];
  primaryAction?: string;
};

export default function ModulePage({
  title,
  description,
  icon,
  actions,
  columns,
  rows,
  primaryAction = "Nuevo registro",
}: ModulePageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
              {icon}
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                {description}
              </p>
            </div>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
            <Plus size={18} />
            {primaryAction}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <div
            key={action}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <CheckCircle2 size={22} />
            </div>

            <p className="mt-4 text-sm font-black text-slate-800">{action}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">Listado</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Datos de ejemplo listos para conectar con el backend.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-80">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {columns.map((column) => (
                  <th key={column} className="py-3 pr-4">
                    {column}
                  </th>
                ))}
                <th className="py-3 pr-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      className="py-4 pr-4 text-sm font-bold text-slate-600"
                    >
                      {cell}
                    </td>
                  ))}

                  <td className="py-4 pr-4">
                    <div className="flex gap-2">
                      <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                        Ver
                      </button>

                      <button className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white hover:bg-cyan-700">
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}