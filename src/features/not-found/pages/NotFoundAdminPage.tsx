import { ShieldCheck } from "lucide-react";

export default function NotFoundAdminPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <ShieldCheck size={32} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-900">
          Página no encontrada
        </h1>

        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          La ruta solicitada no existe dentro del panel administrativo.
        </p>
      </div>
    </div>
  );
}