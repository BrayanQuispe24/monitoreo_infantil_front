import { Building2, CheckCircle2, Plus, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { DaycareRegisterResponse } from "../interfaces/Daycare.interface";
import { DaycareService } from "../services/daycareService";
import { useDaycare } from "../hooks/useDaycare";
import DaycareFormModal from "../components/DaycareFormModal";

const actions = [
  "Crear guarderías",
  "Editar datos de guardería",
  "Activar o desactivar",
  "Generar código único",
];

export default function DaycaresPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedDaycare, setSelectedDaycare] = useState<DaycareRegisterResponse | null>(null);

  const { daycares, changeDaycares } = useDaycare();

  useEffect(() => {
    const fetchDaycares = async () => {
      try {
        const data = await DaycareService.listarGuarderias();
        changeDaycares(data);
      } catch (error) {
        console.error("Error al listar guarderías:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDaycares();
  }, []);

  const handleFormSubmit = async (data: { name: string; address: string; status?: string }) => {
    if (modalMode === "create") {
      const newDaycare = await DaycareService.registrarGuarderia(data);
      changeDaycares([...daycares, newDaycare]);
    } else if (modalMode === "edit" && selectedDaycare) {
      const updatedDaycare = await DaycareService.actualizarGuarderia(selectedDaycare.code, data);
      changeDaycares(daycares.map((d) => (d.code === selectedDaycare.code ? updatedDaycare : d)));
    }
  };

  const filteredDaycares = daycares.filter((daycare) => {
    const query = searchQuery.toLowerCase();
    return (
      daycare.name.toLowerCase().includes(query) ||
      daycare.code.toLowerCase().includes(query) ||
      (daycare.address && daycare.address.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando guarderías...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
              <Building2 size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Gestión de guarderías
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Administra guarderías, códigos únicos, estados, datos generales
                y detalle de cada centro registrado.
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              setModalMode("create");
              setSelectedDaycare(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Nueva guardería
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
              Guarderías registradas activas en la plataforma.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-80">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {filteredDaycares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-800">No se encontraron guarderías</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Prueba a buscar con otro término o agrega una nueva guardería.</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Dirección</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Área SIG</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredDaycares.map((daycare) => (
                  <tr key={daycare.code} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                    <td className="py-4 pr-4 text-sm font-bold text-slate-900">
                      {daycare.code}
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-700">
                      {daycare.name}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-slate-500 max-w-xs truncate">
                      {daycare.address || "Sin dirección"}
                    </td>
                    <td className="py-4 pr-4">
                      {daycare.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      {daycare.has_area ? (
                        <span className="inline-flex items-center rounded-xl bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                          Configurada
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedDaycare(daycare);
                            setIsModalOpen(true);
                          }}
                          className="rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-black text-white hover:bg-cyan-700 shadow-sm shadow-cyan-600/10 hover:shadow-md transition-all cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Form Modal for Create & Edit */}
      <DaycareFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        daycare={selectedDaycare}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}