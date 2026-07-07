import { useEffect, useState } from "react";
import { UsersRound, CheckCircle2, Plus, Search, Loader2, KeyRound, UserPlus, Building2 } from "lucide-react";
import { GuardianService } from "../services/guardianService";
import { DaycareService } from "../../daycares/services/daycareService";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import type { GuardianAdminResponse, GuardianCreateResponse } from "../interfaces/Guardian.interface";
import GuardianFormModal from "../components/GuardianFormModal";
import GuardianCredentialsModal from "../components/GuardianCredentialsModal";
import LinkChildModal from "../components/LinkChildModal";
import LinkDaycareModal from "../components/LinkDaycareModal";

const actions = [
  "Crear tutor o cuidador",
  "Generar PIN temporal",
  "Resetear PIN",
  "Vincular tutor con niño o guardería",
];

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<GuardianAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCredsOpen, setIsCredsOpen] = useState(false);
  const [isLinkChildOpen, setIsLinkChildOpen] = useState(false);
  const [isLinkDaycareOpen, setIsLinkDaycareOpen] = useState(false);

  // Credentials target
  const [credsData, setCredsData] = useState<GuardianCreateResponse | null>(null);
  const [credsActionType, setCredsActionType] = useState<"create" | "reset">("create");

  // Selected tutor target for linking
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianAdminResponse | null>(null);

  const { daycares, changeDaycares } = useDaycare();

  const fetchGuardians = async () => {
    try {
      setLoading(true);
      const data = await GuardianService.listarTutores();
      setGuardians(data);

      if (daycares.length === 0) {
        const daycaresData = await DaycareService.listarGuarderias();
        changeDaycares(daycaresData);
      }
    } catch (error) {
      console.error("Error al cargar tutores o guarderías:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const handleCreateGuardianSubmit = async (payload: any) => {
    return await GuardianService.crearTutor(payload);
  };

  const handleCreateSuccess = (response: GuardianCreateResponse) => {
    setCredsData(response);
    setCredsActionType("create");
    setIsCredsOpen(true);
    // Reload guardians list
    fetchGuardians();
  };

  const handleResetPin = async (guardian: GuardianAdminResponse) => {
    if (!confirm(`¿Estás seguro de que deseas resetear el PIN de ${guardian.full_name}?`)) return;

    try {
      const response = await GuardianService.resetearPin(guardian.code);
      setCredsData({
        id: guardian.id,
        code: response.guardian_code,
        temporary_pin: response.temporary_pin,
        full_name: guardian.full_name,
      });
      setCredsActionType("reset");
      setIsCredsOpen(true);
      fetchGuardians();
    } catch (error) {
      console.error("Error al resetear PIN:", error);
      alert("No se pudo resetear el PIN. Por favor intenta de nuevo.");
    }
  };

  const handleLinkChildSubmit = async (
    guardianCode: string,
    daycareCode: string,
    childCode: string,
    relationship: string
  ) => {
    await GuardianService.vincularNino(guardianCode, {
      daycare_code: daycareCode,
      child_code: childCode,
      relationship,
    });
    fetchGuardians();
  };

  const handleLinkDaycareSubmit = async (guardianCode: string, daycareCode: string) => {
    await GuardianService.vincularGuarderia(guardianCode, {
      daycare_code: daycareCode,
    });
    fetchGuardians();
  };

  const filteredGuardians = guardians.filter((g) => {
    const query = searchQuery.toLowerCase();
    return (
      g.full_name.toLowerCase().includes(query) ||
      g.code.toLowerCase().includes(query) ||
      (g.email && g.email.toLowerCase().includes(query))
    );
  });

  if (loading && guardians.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando tutores...</span>
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
              <UsersRound size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Gestión de tutores y cuidadores
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Administra madres, padres o cuidadores que usarán la app móvil mediante código de tutor y PIN temporal.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Registrar tutor
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

      {/* Guardians list table */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">Listado</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Cuentas de tutores configuradas para vinculación móvil.
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
          {filteredGuardians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UsersRound className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-800">No se encontraron tutores</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Prueba a registrar un tutor o a buscar con otro nombre.</p>
            </div>
          ) : (
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 pr-4">Tutor</th>
                  <th className="py-3 pr-4">Contacto</th>
                  <th className="py-3 pr-4">Guarderías</th>
                  <th className="py-3 pr-4">Niños Vinculados</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredGuardians.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                    <td className="py-4 pr-4 text-sm font-bold text-slate-900">
                      {g.code}
                    </td>
                    <td className="py-4 pr-4 text-sm font-bold text-slate-700">
                      {g.full_name}
                    </td>
                    <td className="py-4 pr-4 text-xs font-semibold text-slate-500">
                      <div>{g.phone || "Sin teléfono"}</div>
                      <div className="text-slate-400">{g.email || "Sin correo"}</div>
                    </td>
                    <td className="py-4 pr-4 text-xs font-bold text-slate-600">
                      {g.daycares.length === 0 ? (
                        <span className="text-slate-400 font-medium">Ninguna</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {g.daycares.map((d) => (
                            <span key={d.daycare_code} className="rounded-lg bg-slate-100 px-2 py-0.5 border border-slate-200">
                              {d.daycare_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-xs font-bold text-slate-700">
                      {g.children.length === 0 ? (
                        <span className="text-slate-400 font-medium">Ninguno</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {g.children.map((child) => (
                            <div key={child.child_code} className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                              <span>{child.child_name}</span>
                              <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.2 rounded border border-cyan-100 font-black">
                                {child.relationship}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedGuardian(g);
                            setIsLinkChildOpen(true);
                          }}
                          title="Vincular Niño"
                          className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                        >
                          <UserPlus size={16} />
                          Niño
                        </button>

                        <button
                          onClick={() => {
                            setSelectedGuardian(g);
                            setIsLinkDaycareOpen(true);
                          }}
                          title="Vincular Guardería"
                          className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                        >
                          <Building2 size={16} />
                          Guardería
                        </button>

                        <button
                          onClick={() => handleResetPin(g)}
                          title="Resetear PIN"
                          className="rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 p-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black"
                        >
                          <KeyRound size={16} />
                          Resetear PIN
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

      {/* Modal: Form to register a new guardian */}
      <GuardianFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateGuardianSubmit}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal: Display generated / reset credentials */}
      {credsData && (
        <GuardianCredentialsModal
          isOpen={isCredsOpen}
          onClose={() => {
            setIsCredsOpen(false);
            setCredsData(null);
          }}
          guardianCode={credsData.code}
          temporaryPin={credsData.temporary_pin}
          guardianName={credsData.full_name}
          actionType={credsActionType}
        />
      )}

      {/* Modal: Link child to selected guardian */}
      {selectedGuardian && (
        <LinkChildModal
          isOpen={isLinkChildOpen}
          onClose={() => {
            setIsLinkChildOpen(false);
            setSelectedGuardian(null);
          }}
          guardianCode={selectedGuardian.code}
          guardianName={selectedGuardian.full_name}
          daycares={daycares}
          onSubmit={handleLinkChildSubmit}
        />
      )}

      {/* Modal: Link daycare directly to selected guardian */}
      {selectedGuardian && (
        <LinkDaycareModal
          isOpen={isLinkDaycareOpen}
          onClose={() => {
            setIsLinkDaycareOpen(false);
            setSelectedGuardian(null);
          }}
          guardianCode={selectedGuardian.code}
          guardianName={selectedGuardian.full_name}
          daycares={daycares}
          onSubmit={handleLinkDaycareSubmit}
        />
      )}
    </div>
  );
}