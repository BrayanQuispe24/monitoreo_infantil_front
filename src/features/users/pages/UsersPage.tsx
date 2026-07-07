import { useEffect, useState } from "react";
import { CheckCircle2, CircleUserRound, Plus, Search, Loader2 } from "lucide-react";
import { UserService } from "../services/userService";
import { DaycareService } from "../../daycares/services/daycareService";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import type { UserResponse } from "../interfaces/User.interface";
import UserFormModal from "../components/UserFormModal";

const actions = [
  "Crear usuarios web",
  "Asignar roles",
  "Activar o desactivar acceso",
  "Administrar permisos",
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const { daycares, changeDaycares } = useDaycare();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await UserService.listarUsuarios();
        setUsers(usersData);

        // Load daycares if they are not already loaded
        if (daycares.length === 0) {
          const daycaresData = await DaycareService.listarGuarderias();
          changeDaycares(daycaresData);
        }
      } catch (error) {
        console.error("Error al cargar datos de usuarios/guarderías:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFormSubmit = async (data: any) => {
    if (modalMode === "create") {
      const newUser = await UserService.crearUsuario(data);
      setUsers([...users, newUser]);
    } else if (modalMode === "edit" && selectedUser) {
      const updatedUser = await UserService.actualizarUsuario(selectedUser.id, data);
      setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
    }
  };

  const getDaycareName = (daycareId: string | null, role: string) => {
    if (role === "ADMIN") return "General (Todos)";
    const daycare = daycares.find((d) => d.id === daycareId);
    return daycare ? daycare.name : "Sin asignar";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center rounded-xl bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
            Administrador
          </span>
        );
      case "DAYCARE_MANAGER":
        return (
          <span className="inline-flex items-center rounded-xl bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
            Encargado
          </span>
        );
      case "OPERATOR":
        return (
          <span className="inline-flex items-center rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            Operador
          </span>
        );
      case "MONITOR":
        return (
          <span className="inline-flex items-center rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            Monitor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
            {role}
          </span>
        );
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando usuarios...</span>
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
              <CircleUserRound size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Usuarios y roles
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Administra usuarios web autorizados, roles del sistema y
                permisos de acceso al panel administrativo.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setModalMode("create");
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Crear usuario
          </button>
        </div>
      </section>

      {/* Info grids */}
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

      {/* Users table list */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">Listado</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Cuentas autorizadas para gestionar el monitoreo y SIG.
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
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CircleUserRound className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-800">No se encontraron usuarios</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Prueba a buscar con otro nombre o correo.</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="py-3 pr-4">Usuario</th>
                  <th className="py-3 pr-4">Correo</th>
                  <th className="py-3 pr-4">Rol</th>
                  <th className="py-3 pr-4">Guardería</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                    <td className="py-4 pr-4 text-sm font-bold text-slate-900">
                      {user.username}
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-700">
                      {user.email}
                    </td>
                    <td className="py-4 pr-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-slate-500">
                      {getDaycareName(user.daycare_id, user.role)}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedUser(user);
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
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        user={selectedUser}
        daycares={daycares}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}