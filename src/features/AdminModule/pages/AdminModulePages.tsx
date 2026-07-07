import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleUserRound,
  Map,
  MonitorDot,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

type ModulePageProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions: string[];
  columns: string[];
  rows: string[][];
  primaryAction?: string;
};

function ModulePage({
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

export function DaycaresPage() {
  return (
    <ModulePage
      title="Gestión de guarderías"
      description="Administra guarderías, códigos únicos, estados, datos generales y detalle de cada centro registrado."
      icon={<Building2 size={28} />}
      primaryAction="Nueva guardería"
      actions={[
        "Crear guarderías",
        "Editar datos de guardería",
        "Activar o desactivar",
        "Generar código único",
      ]}
      columns={["Código", "Nombre", "Estado", "Área SIG", "Responsable"]}
      rows={[
        ["GUA-SCZ-001", "Guardería Los Pinos", "Activa", "Configurada", "María Rojas"],
        ["GUA-SCZ-002", "Guardería Arcoíris", "Activa", "Pendiente", "Carlos Méndez"],
        ["GUA-SCZ-003", "Pequeños Pasos", "Inactiva", "Configurada", "Ana Vargas"],
      ]}
    />
  );
}

export function SigAreaPage() {
  return (
    <ModulePage
      title="Gestión del área geográfica SIG"
      description="Dibuja, edita y valida el polígono del área segura de cada guardería. El área se guardará como GeoJSON para el backend."
      icon={<Map size={28} />}
      primaryAction="Configurar área"
      actions={[
        "Mostrar mapa",
        "Dibujar polígono seguro",
        "Editar área existente",
        "Guardar como GeoJSON",
      ]}
      columns={["Guardería", "Código", "Estado área", "Tipo", "Última actualización"]}
      rows={[
        ["Guardería Los Pinos", "GUA-SCZ-001", "Configurada", "POLYGON 4326", "Hoy"],
        ["Guardería Arcoíris", "GUA-SCZ-002", "Pendiente", "Sin área", "No disponible"],
        ["Pequeños Pasos", "GUA-SCZ-003", "Configurada", "POLYGON 4326", "Ayer"],
      ]}
    />
  );
}

export function ChildrenPage() {
  return (
    <ModulePage
      title="Gestión de niños"
      description="Registra niños, asigna guardería, genera código único, activa o desactiva registros y consulta el detalle de monitoreo."
      icon={<UserRoundCheck size={28} />}
      primaryAction="Registrar niño"
      actions={[
        "Registrar niños",
        "Editar datos básicos",
        "Asignar guardería",
        "Generar código único",
      ]}
      columns={["Código", "Nombre", "Guardería", "Estado", "Rastreador"]}
      rows={[
        ["NIN-8F42K", "Mateo Vargas", "GUA-SCZ-001", "Activo", "Vinculado"],
        ["NIN-2H91B", "Sofía Méndez", "GUA-SCZ-001", "Activo", "Vinculado"],
        ["NIN-9P10Q", "Lucas Rojas", "GUA-SCZ-002", "Activo", "Sin señal"],
      ]}
    />
  );
}

export function GuardiansPage() {
  return (
    <ModulePage
      title="Gestión de tutores"
      description="Administra madres, padres o cuidadores que usarán la app móvil mediante código de tutor y PIN temporal."
      icon={<UsersRound size={28} />}
      primaryAction="Registrar tutor"
      actions={[
        "Crear tutor o cuidador",
        "Generar PIN temporal",
        "Resetear PIN",
        "Vincular tutor con niño",
      ]}
      columns={["Código", "Nombre", "Relación", "Niños vinculados", "Estado"]}
      rows={[
        ["TUT-7A91P", "Ana Vargas", "Madre", "Mateo Vargas", "Activo"],
        ["TUT-3B22C", "José Méndez", "Padre", "Sofía Méndez", "Activo"],
        ["TUT-9K18L", "Rosa Rojas", "Cuidadora", "Lucas Rojas", "Activo"],
      ]}
    />
  );
}

export function TrackersPage() {
  return (
    <ModulePage
      title="Rastreadores y códigos QR"
      description="Genera códigos QR temporales de emparejamiento, consulta estados y administra rastreadores vinculados a cada niño."
      icon={<QrCode size={28} />}
      primaryAction="Generar QR"
      actions={[
        "Generar QR temporal",
        "Cancelar emparejamiento",
        "Ver rastreador vinculado",
        "Desvincular rastreador",
      ]}
      columns={["Niño", "Código niño", "Código QR", "Estado", "Expira"]}
      rows={[
        ["Mateo Vargas", "NIN-8F42K", "PAIR-X7K2-91A", "Activo", "10 min"],
        ["Sofía Méndez", "NIN-2H91B", "PAIR-L9T1-20Z", "Usado", "Finalizado"],
        ["Lucas Rojas", "NIN-9P10Q", "PAIR-A2B8-76N", "Expirado", "Expirado"],
      ]}
    />
  );
}

export function MonitoringPage() {
  return (
    <ModulePage
      title="Monitoreo en tiempo real"
      description="Visualiza estados de niños monitoreados, última ubicación, señal, precisión GPS, rastreadores conectados y alertas activas."
      icon={<MonitorDot size={28} />}
      primaryAction="Actualizar monitoreo"
      actions={[
        "Ver niños monitoreados",
        "Consultar última ubicación",
        "Ver niños fuera del área",
        "Ver rastreadores conectados",
      ]}
      columns={["Niño", "Guardería", "Estado", "Última ubicación", "Última señal"]}
      rows={[
        ["Mateo Vargas", "Los Pinos", "Dentro del área", "-17.783 / -63.182", "Hace 1 min"],
        ["Sofía Méndez", "Los Pinos", "Fuera del área", "-17.784 / -63.190", "Hace 3 min"],
        ["Lucas Rojas", "Arcoíris", "Sin señal", "No disponible", "Hace 14 min"],
      ]}
    />
  );
}

export function AlertsPage() {
  return (
    <ModulePage
      title="Gestión de alertas"
      description="Revisa alertas activas e históricas, filtra por guardería o niño, y marca eventos como vistos o resueltos."
      icon={<AlertTriangle size={28} />}
      primaryAction="Ver alertas activas"
      actions={[
        "Ver alertas activas",
        "Filtrar por guardería",
        "Marcar como vista",
        "Marcar como resuelta",
      ]}
      columns={["Tipo", "Niño", "Guardería", "Estado", "Mensaje"]}
      rows={[
        ["OUT_OF_AREA", "Sofía Méndez", "Los Pinos", "Nueva", "Salió del área definida"],
        ["NO_SIGNAL", "Lucas Rojas", "Arcoíris", "Pendiente", "Rastreador sin señal"],
        ["LOW_GPS_ACCURACY", "Valeria Suárez", "Pequeños Pasos", "Vista", "GPS con baja precisión"],
      ]}
    />
  );
}

export function ReportsPage() {
  return (
    <ModulePage
      title="Reportes"
      description="Consulta reportes básicos de alertas, niños monitoreados, rastreadores, guarderías y tutores vinculados."
      icon={<BarChart3 size={28} />}
      primaryAction="Generar reporte"
      actions={[
        "Alertas por fecha",
        "Niños monitoreados",
        "Rastreadores activos",
        "Exportación simple",
      ]}
      columns={["Reporte", "Periodo", "Registros", "Estado", "Formato"]}
      rows={[
        ["Alertas por fecha", "Últimos 7 días", "32", "Disponible", "PDF / Excel"],
        ["Niños fuera del área", "Hoy", "4", "Disponible", "PDF / Excel"],
        ["Rastreadores activos", "Mes actual", "218", "Disponible", "PDF / Excel"],
      ]}
    />
  );
}

export function UsersPage() {
  return (
    <ModulePage
      title="Usuarios y roles"
      description="Administra usuarios web autorizados, roles del sistema y permisos de acceso al panel administrativo."
      icon={<CircleUserRound size={28} />}
      primaryAction="Crear usuario"
      actions={[
        "Crear usuarios web",
        "Asignar roles",
        "Activar o desactivar acceso",
        "Administrar permisos",
      ]}
      columns={["Usuario", "Correo", "Rol", "Guardería", "Estado"]}
      rows={[
        ["Administrador SIG", "admin@guarderia.com", "ADMIN", "General", "Activo"],
        ["María Rojas", "manager@lospinos.com", "DAYCARE_MANAGER", "Los Pinos", "Activo"],
        ["Carlos Méndez", "operador@guarderia.com", "OPERATOR", "Los Pinos", "Activo"],
      ]}
    />
  );
}

export function SettingsPage() {
  return (
    <ModulePage
      title="Configuración"
      description="Configura parámetros generales del sistema, tiempos de expiración de QR, políticas de alertas y opciones administrativas."
      icon={<Settings size={28} />}
      primaryAction="Guardar configuración"
      actions={[
        "Tiempo de expiración QR",
        "Parámetros de alertas",
        "Precisión mínima GPS",
        "Configuración global",
      ]}
      columns={["Parámetro", "Valor", "Descripción", "Estado", "Módulo"]}
      rows={[
        ["QR_EXPIRATION_MINUTES", "10", "Duración del código QR temporal", "Activo", "Rastreadores"],
        ["GPS_MIN_ACCURACY", "25m", "Precisión mínima aceptada", "Activo", "Monitoreo"],
        ["ALERT_REPEAT_INTERVAL", "5 min", "Intervalo de repetición de alerta", "Activo", "Alertas"],
      ]}
    />
  );
}

export function NotFoundAdminPage() {
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