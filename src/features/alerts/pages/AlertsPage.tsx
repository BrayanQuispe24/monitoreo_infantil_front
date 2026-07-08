import { useEffect, useState, useRef } from "react";
import {
  AlertTriangle, CheckCircle2, Eye, Search, Loader2, RefreshCw,
  X, Sparkles, Building2, User, Check, Calendar, WifiOff
} from "lucide-react";
import { AlertService } from "../services/alertService";
import { DaycareService } from "../../daycares/services/daycareService";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import { useAuth } from "../../auth/hooks/useAuth";
import type { AlertResponse, AlertStatus, AlertType, AlertSeverity } from "../interfaces/Alert.interface";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [daycareFilter, setDaycareFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, NEW, VIEWED, RESOLVED

  // Modals state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(null);

  const { daycares, changeDaycares } = useDaycare();
  const { user } = useAuth();

  const loadAlerts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Fetch Daycares if not loaded
      if (daycares.length === 0) {
        const daycaresData = await DaycareService.listarGuarderias();
        changeDaycares(daycaresData);
      }

      // 2. Fetch Alerts
      const queryParams: any = {};
      if (user && user.role !== "ADMIN" && user.daycare_id) {
        queryParams.daycare_id = user.daycare_id;
      }
      const data = await AlertService.listAlerts(queryParams);
      setAlerts(data);
    } catch (error) {
      console.error("Error al cargar alertas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAlertsRef = useRef(loadAlerts);
  useEffect(() => {
    loadAlertsRef.current = loadAlerts;
  });

  useEffect(() => {
    loadAlertsRef.current();

    const interval = setInterval(() => {
      loadAlertsRef.current(true);
    }, 5000); // Consulta cada 5 segundos para simular tiempo real (WebSocket)

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.daycare_id) {
      setDaycareFilter(user.daycare_id);
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts(true);
  };

  const handleMarkViewed = async (alert: AlertResponse, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent modal trigger
    try {
      const updated = await AlertService.markAsViewed(alert.code);
      setAlerts(prev => prev.map(a => a.code === alert.code ? updated : a));

      // Update selected alert if open in modal
      if (selectedAlert && selectedAlert.code === alert.code) {
        setSelectedAlert(updated);
      }
    } catch (error) {
      console.error("Error al marcar alerta como vista:", error);
      console.error("No se pudo actualizar el estado de la alerta.");
    }
  };

  const handleMarkResolved = async (alert: AlertResponse, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent modal trigger
    try {
      const updated = await AlertService.markAsResolved(alert.code);
      setAlerts(prev => prev.map(a => a.code === alert.code ? updated : a));

      // Update selected alert if open in modal
      if (selectedAlert && selectedAlert.code === alert.code) {
        setSelectedAlert(updated);
      }
    } catch (error) {
      console.error("Error al resolver alerta:", error);
      console.error("No se pudo resolver la alerta.");
    }
  };

  const handleRowClick = (alert: AlertResponse) => {
    setSelectedAlert(alert);
    setDetailsModalOpen(true);
  };

  // State Formatting
  const getAlertTypeBadge = (type: AlertType) => {
    switch (type) {
      case "OUT_OF_AREA":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-650 border border-red-150 animate-pulse"><AlertTriangle size={12} />Fuera de geocerca</span>;
      case "NO_SIGNAL":
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 border border-slate-200"><WifiOff size={12} />Sin señal</span>;
      case "GPS_ERROR":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 border border-amber-150"><AlertTriangle size={12} />Precisión baja</span>;
      default:
        return <span className="text-xs font-semibold">{type}</span>;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "HIGH":
        return <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-800 uppercase">Alta</span>;
      case "MEDIUM":
        return <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 uppercase">Media</span>;
      case "LOW":
        return <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-800 uppercase">Baja</span>;
      default:
        return <span className="text-xs">{severity}</span>;
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case "NEW":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 border border-red-150">Nueva</span>;
      case "VIEWED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-600 border border-cyan-150">Vista</span>;
      case "RESOLVED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-150">Resuelta</span>;
      default:
        return <span className="text-xs font-medium text-slate-700">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString();
  };

  // Filter logic
  const filteredAlerts = alerts.filter((alert) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      alert.child_name.toLowerCase().includes(query) ||
      alert.child_code.toLowerCase().includes(query) ||
      alert.code.toLowerCase().includes(query) ||
      alert.message.toLowerCase().includes(query);

    const matchesDaycare = daycareFilter === "" || alert.daycare_id === daycareFilter;
    const matchesStatus = statusFilter === "ALL" || alert.status === statusFilter;

    return matchesSearch && matchesDaycare && matchesStatus;
  });

  // KPI calculations
  const totalCount = alerts.length;
  const newCount = alerts.filter(a => a.status === "NEW").length;
  const viewedCount = alerts.filter(a => a.status === "VIEWED").length;
  const resolvedCount = alerts.filter(a => a.status === "RESOLVED").length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando alertas de seguridad...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/20">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Gestión de alertas
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Revisa y procesa las anomalías operativas generadas por el sistema. Filtra las alertas por estado, niño o guardería y mantén el registro de incidencias resueltas.
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

      {/* KPI Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historial Total</p>
          <h4 className="text-2xl font-black text-slate-950 mt-1">{totalCount}</h4>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Nuevas (Activas)</p>
          <h4 className="text-2xl font-black text-red-650 mt-1">{newCount}</h4>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-cyan-500">
          <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">En Revisión (Vistas)</p>
          <h4 className="text-2xl font-black text-cyan-600 mt-1">{viewedCount}</h4>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Resueltas</p>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</h4>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {[
            { id: "ALL", label: "Todas las alertas", count: totalCount },
            { id: "NEW", label: "Nuevas", count: newCount, color: "text-red-600 bg-red-50" },
            { id: "VIEWED", label: "Vistas", count: viewedCount, color: "text-cyan-600 bg-cyan-50" },
            { id: "RESOLVED", label: "Resueltas", count: resolvedCount, color: "text-emerald-600 bg-emerald-50" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${statusFilter === tab.id
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-650 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${statusFilter === tab.id
                ? "bg-slate-800 text-white"
                : tab.color || "bg-slate-100 text-slate-600"
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Input filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por niño, código, mensaje o alerta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-11 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {user?.role === "ADMIN" && (
            <div className="w-full sm:w-64">
              <select
                value={daycareFilter}
                onChange={(e) => setDaycareFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="">Todas las guarderías</option>
                {daycares.map((daycare) => (
                  <option key={daycare.id} value={daycare.id}>
                    {daycare.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Alerta / Código</th>
                <th className="px-6 py-4">Niño / Código</th>
                <th className="px-6 py-4">Guardería</th>
                <th className="px-6 py-4">Tipo / Severidad</th>
                <th className="px-6 py-4">Mensaje</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-xs">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No se encontraron alertas registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => handleRowClick(alert)}
                    className="hover:bg-slate-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {alert.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{alert.child_name}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">{alert.child_code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {alert.daycare_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {getAlertTypeBadge(alert.alert_type)}
                        {getSeverityBadge(alert.severity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-semibold">
                      {alert.message}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold" title={formatDate(alert.created_at)}>
                      {formatRelativeTime(alert.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(alert.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {alert.status === "NEW" && (
                          <button
                            onClick={(e) => handleMarkViewed(alert, e)}
                            title="Marcar como vista"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {alert.status !== "RESOLVED" && (
                          <button
                            onClick={(e) => handleMarkResolved(alert, e)}
                            title="Marcar como resuelta"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {alert.status === "RESOLVED" && (
                          <span className="text-[10px] font-bold text-slate-350">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (Detalle de Alerta) */}
      {detailsModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100">
                  <AlertTriangle size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Detalles de la Incidencia</h3>
                  <p className="text-xs font-semibold text-slate-400 font-mono">Código: {selectedAlert.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-5 space-y-4 text-xs font-semibold text-slate-650">

              {/* Alert Meta Badges */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Estado actual</span>
                  <div>{getStatusBadge(selectedAlert.status)}</div>
                </div>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo de alerta</span>
                  <div>{getAlertTypeBadge(selectedAlert.alert_type)}</div>
                </div>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gravedad</span>
                  <div>{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-1 bg-red-50/20 border border-red-100/50 p-4 rounded-2xl">
                <h4 className="text-slate-900 font-black text-sm">{selectedAlert.title}</h4>
                <p className="text-slate-600 leading-relaxed font-semibold mt-1">{selectedAlert.message}</p>
              </div>

              {/* Detailed Specs Grid */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Child info */}
                <div className="space-y-3 bg-slate-50/40 border border-slate-150 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-800">
                    <User size={14} className="text-slate-400" />
                    <span className="font-bold">Niño Involucrado</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    <div className="font-bold text-slate-900">{selectedAlert.child_name}</div>
                    <div className="text-[10px] font-bold text-slate-450">Código: {selectedAlert.child_code}</div>
                  </div>
                </div>

                {/* Daycare Info */}
                <div className="space-y-3 bg-slate-50/40 border border-slate-150 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="font-bold">Sede / Guardería</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    <div className="font-bold text-slate-900">{selectedAlert.daycare_name}</div>
                    <div className="text-[10px] font-bold text-slate-455">Código: {selectedAlert.daycare_code}</div>
                  </div>
                </div>
              </div>

              {/* Timeline Log */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Línea de Tiempo</span>
                </div>
                <div className="space-y-2 pl-5 font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Generada:</span>
                    <span className="text-slate-800">{formatDate(selectedAlert.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última modificación:</span>
                    <span className="text-slate-800">{formatDate(selectedAlert.updated_at)}</span>
                  </div>
                  {selectedAlert.resolved_at && (
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-emerald-600 font-bold">
                      <span>Resuelta / Cerrada:</span>
                      <span>{formatDate(selectedAlert.resolved_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Tips */}
              {selectedAlert.status !== "RESOLVED" && (
                <div className="flex items-start gap-2 bg-cyan-50 p-3 rounded-2xl border border-cyan-100 text-[11px] text-cyan-800 leading-relaxed font-semibold">
                  <Sparkles className="h-4.5 w-4.5 shrink-0 text-cyan-600" />
                  <span>
                    Como operador autorizado, puedes marcar esta alerta como vista para indicar que está bajo revisión, o resolverla para cerrar el ciclo de la incidencia.
                  </span>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-all"
              >
                Cerrar
              </button>

              {selectedAlert.status === "NEW" && (
                <button
                  onClick={() => handleMarkViewed(selectedAlert)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-50 text-cyan-600 hover:bg-cyan-100 text-xs font-black cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Eye size={14} />
                  Marcar Vista
                </button>
              )}

              {selectedAlert.status !== "RESOLVED" && (
                <button
                  onClick={() => handleMarkResolved(selectedAlert)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-black cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Resolver Incidencia
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}