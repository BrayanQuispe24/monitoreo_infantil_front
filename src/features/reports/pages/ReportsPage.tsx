import { useEffect, useState } from "react";
import {
  BarChart3, Download, Search, Loader2, RefreshCw,
  Building2, User, AlertTriangle, ShieldCheck, ShieldAlert,
  Compass, Radio, Users, Calendar, HelpCircle,
  WifiOff
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { DaycareService } from "../../daycares/services/daycareService";
import { ChildService } from "../../children/services/childService";
import { AlertService } from "../../alerts/services/alertService";
import { GuardianService } from "../../guardians/services/guardianService";
import { api } from "../../../api/axios";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";
import type { ChildResponse } from "../../children/interfaces/Child.interface";
import type { AlertResponse } from "../../alerts/interfaces/Alert.interface";
import type { GuardianAdminResponse } from "../../guardians/interfaces/Guardian.interface";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<
    "alerts" | "children" | "outside" | "trackers" | "daycares" | "guardians"
  >("alerts");

  // Datasets
  const [daycares, setDaycares] = useState<DaycareRegisterResponse[]>([]);
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [guardians, setGuardians] = useState<GuardianAdminResponse[]>([]);
  const [trackersDetails, setTrackersDetails] = useState<
    Record<string, { tracker: any; location: any; state: string }>
  >({});

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [selectedDaycare, setSelectedDaycare] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [trackerStatusFilter, setTrackerStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [daycaresRes, childrenRes, alertsRes, guardiansRes] = await Promise.all([
        DaycareService.listarGuarderias(),
        ChildService.listarNinos(),
        AlertService.listAlerts(),
        GuardianService.listarTutores()
      ]);

      setDaycares(daycaresRes);
      setChildren(childrenRes);
      setAlerts(alertsRes);
      setGuardians(guardiansRes);

      // Fetch tracker telemery for each child in parallel
      const details: Record<string, any> = {};

      await Promise.all(
        childrenRes.map(async (child) => {
          let tracker = null;
          let location = null;

          try {
            const tRes = await api.get(`/api/tracking-devices/children/${child.code}`);
            tracker = tRes.data.device;
          } catch { }

          try {
            const lRes = await api.get(`/api/children/${child.code}/last-location`);
            location = lRes.data;
          } catch { }

          // Compute state matching our monitoring page rules
          let state = "Sin rastreador";
          if (tracker && tracker.is_active) {
            if (!tracker.last_seen_at) {
              state = "Sin señal";
            } else {
              const lastSeen = new Date(tracker.last_seen_at);
              const diffMs = new Date().getTime() - lastSeen.getTime();
              if (diffMs > 3 * 60 * 1000) {
                state = "Sin señal";
              } else if (location && location.accuracy && location.accuracy > 20) {
                state = "GPS con baja precisión";
              } else if (location && !location.is_inside_area) {
                state = "Fuera del área";
              } else {
                state = "Dentro del área";
              }
            }
          }

          details[child.code] = { tracker, location, state };
        })
      );

      setTrackersDetails(details);
    } catch (err) {
      console.error("Error al cargar datos para reportes:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.role !== "ADMIN" && user?.daycare_id) {
      setSelectedDaycare(user.daycare_id);
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const getDaycareName = (id: string) => {
    return daycares.find(d => d.id === id)?.name || "Desconocida";
  };

  // CSV Exporter Helper
  const handleExportCSV = () => {
    setExporting(true);
    try {
      let headers: string[] = [];
      let rows: string[][] = [];
      let filename = "reporte";

      if (reportType === "alerts") {
        filename = "reporte_alertas_por_fecha";
        headers = ["Codigo Alerta", "Nino", "Codigo Nino", "Guarderia", "Tipo Alerta", "Mensaje", "Severidad", "Fecha Creacion", "Estado"];
        rows = filteredAlerts.map(a => [
          a.code,
          a.child_name,
          a.child_code,
          a.daycare_name,
          a.alert_type,
          a.message,
          a.severity,
          new Date(a.created_at).toLocaleString(),
          a.status
        ]);
      } else if (reportType === "children") {
        filename = "reporte_ninos_monitoreados";
        headers = ["Codigo Nino", "Nombre Nino", "Edad", "Guarderia", "Rastreador Vinculado", "Ultima Conexion", "Estado Conexion"];
        rows = filteredChildren.map(c => {
          const detail = trackersDetails[c.code];
          return [
            c.code,
            c.full_name,
            c.age ? String(c.age) : "N/A",
            getDaycareName(c.daycare_id),
            detail?.tracker?.device_code || "No",
            detail?.tracker?.last_seen_at ? new Date(detail.tracker.last_seen_at).toLocaleString() : "Nunca",
            detail?.state || "Sin rastreador"
          ];
        });
      } else if (reportType === "outside") {
        filename = "reporte_ninos_fuera_de_area";
        headers = ["Codigo Nino", "Nombre Nino", "Guarderia", "Ultima Ubicacion Reportada", "Fecha/Hora Reporte"];
        rows = filteredOutsideChildren.map(c => {
          const detail = trackersDetails[c.code];
          return [
            c.code,
            c.full_name,
            getDaycareName(c.daycare_id),
            detail?.location ? `${detail.location.latitude}, ${detail.location.longitude}` : "N/A",
            detail?.location?.received_at ? new Date(detail.location.received_at).toLocaleString() : "N/A"
          ];
        });
      } else if (reportType === "trackers") {
        filename = "reporte_rastreadores";
        headers = ["Codigo Nino", "Nombre Nino", "Guarderia", "Rastreador Vinculado", "Codigo Dispositivo", "Plataforma", "Ultima Conexion", "Estado"];
        rows = filteredTrackers.map(c => {
          const detail = trackersDetails[c.code];
          return [
            c.code,
            c.full_name,
            getDaycareName(c.daycare_id),
            detail?.tracker ? "Si" : "No",
            detail?.tracker?.device_code || "N/A",
            detail?.tracker?.platform || "N/A",
            detail?.tracker?.last_seen_at ? new Date(detail.tracker.last_seen_at).toLocaleString() : "Nunca",
            detail?.state || "Sin vinculacion"
          ];
        });
      } else if (reportType === "daycares") {
        filename = "reporte_guarderias";
        headers = ["Codigo Guarderia", "Nombre Guarderia", "Direccion", "Tiene Area Geocerca", "Estado"];
        rows = filteredDaycares.map(d => [
          d.code,
          d.name,
          d.address,
          d.has_area ? "Si" : "No",
          d.status
        ]);
      } else if (reportType === "guardians") {
        filename = "reporte_tutores";
        headers = ["Codigo Tutor", "Nombre Completo", "Telefono", "Correo", "Estado", "Ninos Vinculados", "Guarderias Vinculadas"];
        rows = filteredGuardians.map(g => [
          g.code,
          g.full_name,
          g.phone || "N/A",
          g.email || "N/A",
          g.status,
          g.children.map(c => `${c.child_name} (${c.relationship})`).join(" | "),
          g.daycares.map(d => d.daycare_name).join(" | ")
        ]);
      }

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error al exportar reporte:", err);
    } finally {
      setExporting(false);
    }
  };

  // Filtered lists
  const filteredAlerts = alerts.filter(a => {
    const alertDate = a.created_at.slice(0, 10);
    const matchesFrom = dateFrom === "" || alertDate >= dateFrom;
    const matchesTo = dateTo === "" || alertDate <= dateTo;
    const matchesDaycare = selectedDaycare === "" || a.daycare_id === selectedDaycare;
    const matchesSearch = searchQuery === "" ||
      a.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFrom && matchesTo && matchesDaycare && matchesSearch;
  });

  const filteredChildren = children.filter(c => {
    const matchesDaycare = selectedDaycare === "" || c.daycare_id === selectedDaycare;
    const matchesSearch = searchQuery === "" ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDaycare && matchesSearch;
  });

  const filteredOutsideChildren = children.filter(c => {
    const detail = trackersDetails[c.code];
    const isOutside = detail && detail.state === "Fuera del área";
    const matchesDaycare = selectedDaycare === "" || c.daycare_id === selectedDaycare;
    const matchesSearch = searchQuery === "" ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return isOutside && matchesDaycare && matchesSearch;
  });

  const filteredTrackers = children.filter(c => {
    const detail = trackersDetails[c.code];
    const hasTracker = detail && detail.tracker && detail.tracker.is_active;

    let matchesStatus = true;
    if (trackerStatusFilter === "ACTIVE") {
      matchesStatus = !!hasTracker;
    } else if (trackerStatusFilter === "INACTIVE") {
      matchesStatus = !hasTracker;
    }

    const matchesDaycare = selectedDaycare === "" || c.daycare_id === selectedDaycare;
    const matchesSearch = searchQuery === "" ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesDaycare && matchesSearch;
  });

  const filteredDaycares = daycares.filter(d => {
    return searchQuery === "" ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGuardians = guardians.filter(g => {
    const matchesDaycare = selectedDaycare === "" ||
      g.daycares.some(d => d.daycare_code === daycares.find(dc => dc.id === selectedDaycare)?.code);

    const matchesSearch = searchQuery === "" ||
      g.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.phone && g.phone.includes(searchQuery)) ||
      (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDaycare && matchesSearch;
  });

  if (loading && daycares.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando datos para reportes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
              <BarChart3 size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Módulo de reportes
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Consulta y filtra información histórica sobre anomalías, vinculación de dispositivos, asistencia de niños y tutores autorizados. Exportación rápida en formato CSV compatible con Excel.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Sincronizar
          </button>
        </div>
      </section>

      {/* Reports Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { id: "alerts", label: "Alertas por Fecha", icon: <AlertTriangle size={14} /> },
          { id: "children", label: "Niños Monitoreados", icon: <User size={14} /> },
          { id: "outside", label: "Niños Fuera de Área", icon: <ShieldAlert size={14} /> },
          { id: "trackers", label: "Rastreadores", icon: <Radio size={14} /> },
          { id: "daycares", label: "Guarderías Registradas", icon: <Building2 size={14} /> },
          { id: "guardians", label: "Tutores Vinculados", icon: <Users size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setReportType(tab.id as any);
              setSearchQuery("");
            }}
            className={`px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${reportType === tab.id
                ? "bg-slate-950 text-white border-slate-950 shadow-md shadow-slate-950/10"
                : "bg-white text-slate-650 hover:bg-slate-50 border-slate-200"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Export Console */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en registros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Daycare Filter (Hidden on Daycare list report) */}
            {reportType !== "daycares" && user?.role === "ADMIN" && (
              <div className="w-full sm:w-56">
                <select
                  value={selectedDaycare}
                  onChange={(e) => setSelectedDaycare(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
                >
                  <option value="">Todas las guarderías</option>
                  {daycares.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date range picker for Alerts */}
            {reportType === "alerts" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <Calendar size={12} className="text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400 font-bold">a</span>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <Calendar size={12} className="text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tracker status filter for Trackers */}
            {reportType === "trackers" && (
              <div className="w-full sm:w-48">
                <select
                  value={trackerStatusFilter}
                  onChange={(e) => setTrackerStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="ACTIVE">Con rastreador</option>
                  <option value="INACTIVE">Sin rastreador</option>
                </select>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white hover:bg-slate-800 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Render selected Report Table */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {reportType === "alerts" && (
            <table className="w-full border-collapse text-left text-xs text-slate-600 font-medium">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Niño / Código</th>
                  <th className="px-6 py-4">Guardería</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Mensaje</th>
                  <th className="px-6 py-4">Severidad</th>
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400 font-semibold">No se encontraron alertas en este rango.</td>
                  </tr>
                ) : (
                  filteredAlerts.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">{a.code}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{a.child_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{a.child_code}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{a.daycare_name}</td>
                      <td className="px-6 py-4">
                        {a.alert_type === "OUT_OF_AREA" ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-50 text-red-600 px-1.5 py-0.5 font-bold"><AlertTriangle size={10} />Fuera geocerca</span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 font-bold"><WifiOff size={10} />Sin señal</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{a.message}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${a.severity === "HIGH" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>{a.severity}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold border ${a.status === "NEW" ? "bg-red-50 text-red-600 border-red-100" : a.status === "VIEWED" ? "bg-cyan-50 text-cyan-600 border-cyan-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}>{a.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === "children" && (
            <table className="w-full border-collapse text-left text-xs text-slate-600 font-medium">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Código Niño</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Edad</th>
                  <th className="px-6 py-4">Guardería Sede</th>
                  <th className="px-6 py-4">Código Rastreador</th>
                  <th className="px-6 py-4">Última Ubicación</th>
                  <th className="px-6 py-4">Estado Señal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredChildren.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-semibold">No se encontraron niños monitoreados.</td>
                  </tr>
                ) : (
                  filteredChildren.map(c => {
                    const detail = trackersDetails[c.code];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono">{c.code}</td>
                        <td className="px-6 py-4 font-bold text-slate-950">{c.full_name}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{c.age ? `${c.age} años` : "N/A"}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">{getDaycareName(c.daycare_id)}</td>
                        <td className="px-6 py-4">
                          {detail?.tracker?.device_code ? (
                            <span className="font-mono bg-slate-100 px-1 rounded text-slate-750 font-bold">{detail.tracker.device_code}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">
                          {detail?.location ? `${detail.location.latitude.toFixed(5)}, ${detail.location.longitude.toFixed(5)}` : "Sin coordenadas"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold border ${detail?.state === "Dentro del área" ? "bg-emerald-50 text-emerald-650 border-emerald-100" : detail?.state === "Fuera del área" ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-150"
                            }`}>{detail?.state || "Sin rastreador"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === "outside" && (
            <table className="w-full border-collapse text-left text-xs text-slate-600 font-medium">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Código Niño</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Guardería Sede</th>
                  <th className="px-6 py-4">Última Ubicación</th>
                  <th className="px-6 py-4">Fecha / Hora Reporte</th>
                  <th className="px-6 py-4">Alerta Geocerca</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOutsideChildren.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-red-500 font-bold">Excelente: No hay ningún niño fuera del área en este momento.</td>
                  </tr>
                ) : (
                  filteredOutsideChildren.map(c => {
                    const detail = trackersDetails[c.code];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-colors bg-red-50/10">
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono">{c.code}</td>
                        <td className="px-6 py-4 font-bold text-red-750">{c.full_name}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">{getDaycareName(c.daycare_id)}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono font-bold">
                          {detail?.location ? `${detail.location.latitude.toFixed(5)}, ${detail.location.longitude.toFixed(5)}` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">
                          {detail?.location?.received_at ? new Date(detail.location.received_at).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-black text-red-650 border border-red-150 animate-pulse">
                            <ShieldAlert size={10} /> FUERA DE LÍMITES
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === "trackers" && (
            <table className="w-full border-collapse text-left text-xs text-slate-600 font-medium">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Código Niño</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Guardería</th>
                  <th className="px-6 py-4">Tiene Rastreador</th>
                  <th className="px-6 py-4">Código Dispositivo</th>
                  <th className="px-6 py-4">Plataforma</th>
                  <th className="px-6 py-4">Último Check-in</th>
                  <th className="px-6 py-4">Estado Conexión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTrackers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400 font-semibold">No se encontraron rastreadores.</td>
                  </tr>
                ) : (
                  filteredTrackers.map(c => {
                    const detail = trackersDetails[c.code];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono">{c.code}</td>
                        <td className="px-6 py-4 font-bold text-slate-950">{c.full_name}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">{getDaycareName(c.daycare_id)}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {detail?.tracker ? "Sí" : "No"}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">
                          {detail?.tracker?.device_code || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">
                          {detail?.tracker?.platform || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">
                          {detail?.tracker?.last_seen_at ? new Date(detail.tracker.last_seen_at).toLocaleString() : "Nunca"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold border ${detail?.state !== "Sin rastreador" && detail?.state !== "Sin señal" ? "bg-emerald-50 text-emerald-650 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-150"
                            }`}>{detail?.state || "Desconectado"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === "daycares" && (
            <table className="w-full border-collapse text-left text-xs text-slate-600 font-medium">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Código Guardería</th>
                  <th className="px-6 py-4">Nombre de la Sede</th>
                  <th className="px-6 py-4">Dirección</th>
                  <th className="px-6 py-4">Tiene Área Perimetral</th>
                  <th className="px-6 py-4">Estado Sede</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDaycares.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-semibold">No se encontraron guarderías registradas.</td>
                  </tr>
                ) : (
                  filteredDaycares.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">{d.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-950">{d.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{d.address}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${d.has_area ? "bg-cyan-50 text-cyan-600 border border-cyan-100" : "bg-slate-100 text-slate-500"
                          }`}>{d.has_area ? "Geocerca configurada" : "Sin área definida"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold border ${d.status === "active" ? "bg-emerald-50 text-emerald-650 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                          }`}>{d.status === "active" ? "Activa" : "Inactiva"}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === "guardians" && (
            <table className="w-full border-collapse text-left text-xs text-slate-600 font-medium">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Código Tutor</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Niños Vinculados</th>
                  <th className="px-6 py-4">Sedes Autorizadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredGuardians.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-semibold">No se encontraron tutores vinculados.</td>
                  </tr>
                ) : (
                  filteredGuardians.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">{g.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-950">{g.full_name}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold font-mono">{g.phone || "-"}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{g.email || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold border ${g.status === "active" ? "bg-emerald-50 text-emerald-650 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>{g.status === "active" ? "Activo" : "Inactivo"}</span>
                      </td>
                      <td className="px-6 py-4">
                        {g.children.length === 0 ? (
                          <span className="text-slate-400">Sin vinculaciones</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {g.children.map(c => (
                              <span key={c.child_code} className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg w-fit text-[10px]">
                                {c.child_name} <span className="text-slate-400 font-semibold">({c.relationship})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        {g.daycares.map(d => d.daycare_name).join(", ") || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}