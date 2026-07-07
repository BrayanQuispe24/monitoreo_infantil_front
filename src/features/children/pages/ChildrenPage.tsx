import { useEffect, useState } from "react";
import { UserRoundCheck, CheckCircle2, Plus, Search, Loader2, Baby } from "lucide-react";
import { ChildService } from "../services/childService";
import { DaycareService } from "../../daycares/services/daycareService";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import { useAuth } from "../../auth/hooks/useAuth";
import type { ChildResponse } from "../interfaces/Child.interface";
import ChildFormModal from "../components/ChildFormModal";

const actions = [
  "Registrar niños",
  "Editar datos básicos",
  "Asignar guardería",
  "Generar código único",
];

export default function ChildrenPage() {
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState<ChildResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [daycareFilter, setDaycareFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedChild, setSelectedChild] = useState<ChildResponse | null>(null);

  const { daycares, changeDaycares } = useDaycare();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const childrenData = await ChildService.listarNinos();
        setChildrenList(childrenData);

        // Load daycares if they are not already loaded
        if (daycares.length === 0) {
          const daycaresData = await DaycareService.listarGuarderias();
          changeDaycares(daycaresData);
        }
      } catch (error) {
        console.error("Error al cargar niños y guarderías:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFormSubmit = async (data: any) => {
    const payload = { ...data };
    if (user?.role !== "ADMIN" && user?.daycare_id) {
      payload.daycare_id = user.daycare_id;
    }
    if (modalMode === "create") {
      const newChild = await ChildService.crearNino(payload);
      setChildrenList([...childrenList, newChild]);
    } else if (modalMode === "edit" && selectedChild) {
      const updatedChild = await ChildService.actualizarNino(selectedChild.code, payload);
      setChildrenList(childrenList.map((c) => (c.code === selectedChild.code ? updatedChild : c)));
    }
  };

  const getDaycareName = (daycareId: string) => {
    const daycare = daycares.find((d) => d.id === daycareId);
    return daycare ? daycare.name : "Sin asignar";
  };

  const filteredChildren = childrenList
    .filter((c) => {
      if (user?.role === "DAYCARE_MANAGER" || user?.role === "OPERATOR") {
        return c.daycare_id === user.daycare_id;
      }
      return true;
    })
    .filter((child) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        child.full_name.toLowerCase().includes(query) ||
        child.code.toLowerCase().includes(query);
        
      const matchesDaycare = daycareFilter === "" || child.daycare_id === daycareFilter;

      return matchesSearch && matchesDaycare;
    });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando niños...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
              <UserRoundCheck size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Gestión de niños
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Registra niños, asigna guardería, genera código único, activa o desactiva registros y consulta el detalle de monitoreo.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setModalMode("create");
              setSelectedChild(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Registrar niño
          </button>
        </div>
      </section>

      {/* Actions widgets */}
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

      {/* Main Table view */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">Listado</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Fichas de menores registrados y asociados a guarderías del sistema.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Filter by Daycare */}
            {user?.role === "ADMIN" && (
              <select
                value={daycareFilter}
                onChange={(e) => setDaycareFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
              >
                <option value="">Todas las guarderías</option>
                {daycares.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-72">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {filteredChildren.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Baby className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-800">No se encontraron niños</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Prueba a cambiar los filtros o a registrar un niño.</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Edad</th>
                  <th className="py-3 pr-4">Guardería</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredChildren.map((child) => (
                  <tr key={child.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                    <td className="py-4 pr-4 text-sm font-bold text-slate-900">
                      {child.code}
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-700">
                      {child.full_name}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-slate-500">
                      {child.age !== null ? `${child.age} años` : "No registrada"}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-slate-500">
                      {getDaycareName(child.daycare_id)}
                    </td>
                    <td className="py-4 pr-4">
                      {child.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedChild(child);
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
      <ChildFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        child={selectedChild}
        daycares={
          user?.role === "ADMIN"
            ? daycares
            : daycares.filter(d => d.id === user?.daycare_id)
        }
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}