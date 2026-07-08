import { useEffect, useState } from "react";
import {
  QrCode, CheckCircle2, Search, Loader2, Trash2, Link,
  RefreshCw, Clock, Wifi, WifiOff, History, X, AlertCircle, Sparkles
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { ChildService } from "../../children/services/childService";
import { DaycareService } from "../../daycares/services/daycareService";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import { TrackerService } from "../services/trackerService";
import type { ChildResponse } from "../../children/interfaces/Child.interface";
import type {
  DeviceDetails, PairingCodeResponse, PairingCodeListResponse
} from "../interfaces/Tracker.interface";

interface ChildWithTracker extends ChildResponse {
  tracker: DeviceDetails | null;
  loadingTracker: boolean;
}

export default function TrackersPage() {
  const { user } = useAuth();
  const [childrenWithTrackers, setChildrenWithTrackers] = useState<ChildWithTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [daycareFilter, setDaycareFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildWithTracker | null>(null);

  // Pairing Modal States
  const [pairingCode, setPairingCode] = useState<PairingCodeResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [selectedExpiration, setSelectedExpiration] = useState(10); // default 10 minutes

  // History Modal States
  const [historyCodes, setHistoryCodes] = useState<PairingCodeListResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { daycares, changeDaycares } = useDaycare();

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Fetch children
      const childrenData = await ChildService.listarNinos();

      // 2. Fetch daycares if needed
      if (daycares.length === 0) {
        const daycaresData = await DaycareService.listarGuarderias();
        changeDaycares(daycaresData);
      }

      // Initialize children with loading status for their trackers
      const initialized = childrenData.map(child => ({
        ...child,
        tracker: null,
        loadingTracker: true
      }));
      setChildrenWithTrackers(initialized);

      // 3. Fetch tracker details in parallel or sequentially for each child
      const trackerPromises = childrenData.map(async (child) => {
        try {
          const detail = await TrackerService.getTrackerForChild(child.code);
          return { childCode: child.code, tracker: detail.device };
        } catch (error) {
          console.error(`Error loading tracker for child ${child.code}:`, error);
          return { childCode: child.code, tracker: null };
        }
      });

      const trackerResults = await Promise.all(trackerPromises);

      // Map results back to state
      setChildrenWithTrackers(prev =>
        prev.map(c => {
          const matched = trackerResults.find(r => r.childCode === c.code);
          return {
            ...c,
            tracker: matched ? matched.tracker : null,
            loadingTracker: false
          };
        })
      );

    } catch (error) {
      console.error("Error al cargar la gestión de rastreadores:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (!pairingModalOpen || !pairingCode || pairingSuccess) return;

    // Calculate time left from expires_at
    const calculateTimeLeft = () => {
      const difference = +new Date(pairingCode.expires_at) - +new Date();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const sec = calculateTimeLeft();
      setTimeLeft(sec);
      if (sec <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pairingModalOpen, pairingCode, pairingSuccess]);

  // Polling pairing status
  useEffect(() => {
    if (!pairingModalOpen || !pairingCode || pairingSuccess || timeLeft <= 0) return;

    const interval = setInterval(async () => {
      if (!selectedChild) return;
      try {
        const codes = await TrackerService.listPairingCodes(selectedChild.code);
        const current = codes.find(c => c.code === pairingCode.pairing_code);
        if (current && current.status === "USED") {
          setPairingSuccess(true);
          // Refresh children tracker info
          loadData(true);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling pairing status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pairingModalOpen, pairingCode, pairingSuccess, timeLeft, selectedChild]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleOpenPairing = async (child: ChildWithTracker) => {
    setSelectedChild(child);
    setPairingSuccess(false);
    setPairingCode(null);
    setPairingModalOpen(true);
    setTimeLeft(selectedExpiration * 60);

    // Auto-generate code when opening
    setPairingLoading(true);
    try {
      const codeRes = await TrackerService.generatePairingCode(child.code, selectedExpiration);
      setPairingCode(codeRes);
    } catch (error) {
      console.error("Error al generar código de emparejamiento:", error);
      alert("No se pudo generar el código. Inténtalo de nuevo.");
      setPairingModalOpen(false);
    } finally {
      setPairingLoading(false);
    }
  };

  const handleExpirationChange = async (minutes: number) => {
    setSelectedExpiration(minutes);
    if (!selectedChild) return;
    setPairingLoading(true);
    try {
      const codeRes = await TrackerService.generatePairingCode(selectedChild.code, minutes);
      setPairingCode(codeRes);
      setPairingSuccess(false);
    } catch (error) {
      console.error("Error al generar código de emparejamiento:", error);
      alert("No se pudo regenerar el código con el nuevo tiempo.");
    } finally {
      setPairingLoading(false);
    }
  };

  const handleCancelPairing = async () => {
    if (!pairingCode) {
      setPairingModalOpen(false);
      return;
    }
    try {
      await TrackerService.cancelPairingCode(pairingCode.pairing_code);
    } catch (error) {
      console.error("Error al cancelar código:", error);
    } finally {
      setPairingModalOpen(false);
      setPairingCode(null);
    }
  };

  const handleDecoupleTracker = async (child: ChildWithTracker) => {
    if (!confirm(`¿Estás seguro de que deseas desvincular el dispositivo de ${child.full_name}? Esto inhabilitará el rastreador actual inmediatamente.`)) {
      return;
    }

    try {
      // Mark as loading locally
      setChildrenWithTrackers(prev =>
        prev.map(c => c.code === child.code ? { ...c, loadingTracker: true } : c)
      );

      await TrackerService.decoupleTracker(child.code);

      // Update state to null tracker
      setChildrenWithTrackers(prev =>
        prev.map(c => c.code === child.code ? { ...c, tracker: null, loadingTracker: false } : c)
      );
    } catch (error) {
      console.error("Error al desvincular rastreador:", error);
      alert("No se pudo desvincular el dispositivo.");
      // Reset loading
      loadData(true);
    }
  };

  const handleOpenHistory = async (child: ChildWithTracker) => {
    setSelectedChild(child);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const codes = await TrackerService.listPairingCodes(child.code);
      setHistoryCodes(codes);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCancelHistoryCode = async (codeStr: string) => {
    if (!confirm(`¿Deseas cancelar el código ${codeStr}?`)) return;
    try {
      await TrackerService.cancelPairingCode(codeStr);
      // Reload history
      if (selectedChild) {
        const codes = await TrackerService.listPairingCodes(selectedChild.code);
        setHistoryCodes(codes);
      }
    } catch (error) {
      console.error("Error al cancelar código:", error);
      alert("El código ya no está activo o no se pudo cancelar.");
    }
  };

  const getDaycareName = (daycareId: string) => {
    const daycare = daycares.find((d) => d.id === daycareId);
    return daycare ? daycare.name : "Sin asignar";
  };



  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-600 border border-cyan-150">Activo</span>;
      case "USED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 border border-emerald-150">Usado</span>;
      case "EXPIRED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 border border-slate-200">Expirado</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-500 border border-red-150">Cancelado</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{status}</span>;
    }
  };

  const filteredChildren = childrenWithTrackers
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
        child.code.toLowerCase().includes(query) ||
        (child.tracker?.device_code && child.tracker.device_code.toLowerCase().includes(query));

      const matchesDaycare = daycareFilter === "" || child.daycare_id === daycareFilter;

      return matchesSearch && matchesDaycare;
    });

  // Summary Metrics
  const totalChildrenCount = childrenWithTrackers.length;
  const linkedCount = childrenWithTrackers.filter(c => c.tracker && c.tracker.is_active).length;
  const unlinkedCount = totalChildrenCount - linkedCount;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando datos de rastreadores...</span>
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
              <QrCode size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Gestión de rastreadores
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Empareja dispositivos físicos con los niños mediante códigos QR temporales. Consulta el estado de la señal, última conexión y administra las vinculaciones activas.
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

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 border border-slate-100">
            <QrCode size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Niños</p>
            <h4 className="text-2xl font-black text-slate-950 mt-0.5">{totalChildrenCount}</h4>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Wifi size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispositivos Vinculados</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-0.5">{linkedCount}</h4>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 border border-slate-100">
            <WifiOff size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sin Rastreador</p>
            <h4 className="text-2xl font-black text-slate-600 mt-0.5">{unlinkedCount}</h4>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por niño, código o rastreador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-12 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {user?.role === "ADMIN" && (
          <div className="w-full sm:w-64">
            <select
              value={daycareFilter}
              onChange={(e) => setDaycareFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
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

      {/* Data Table */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Niño / Código</th>
                <th className="px-6 py-4">Guardería</th>
                <th className="px-6 py-4">Rastreador</th>
                {/* <th className="px-6 py-4">Última Conexión</th> */}
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron niños o rastreadores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredChildren.map((child) => (
                  <tr key={child.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{child.full_name}</div>
                      <div className="text-xs font-bold text-slate-400 mt-0.5">{child.code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {getDaycareName(child.daycare_id)}
                    </td>
                    <td className="px-6 py-4">
                      {child.loadingTracker ? (
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Verificando...
                        </div>
                      ) : child.tracker && child.tracker.is_active ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-150">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {child.tracker.device_code || "VINCULADO"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                            {child.tracker.platform}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-200">
                          Sin rastreador
                        </span>
                      )}
                    </td>
                    {/* <td className="px-6 py-4 text-slate-500 font-semibold">
                      {child.loadingTracker ? (
                        <span className="text-slate-300">-</span>
                      ) : child.tracker && child.tracker.is_active ? (
                        <div className="flex items-center gap-2">
                          {child.tracker.last_seen_at ? (
                            <>
                              <Wifi className="h-4 w-4 text-emerald-500" />
                              <span>{formatLastSeen(child.tracker.last_seen_at)}</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-4 w-4 text-slate-300" />
                              <span className="text-slate-400">Nunca conectado</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">N/A</span>
                      )}
                    </td> */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {child.tracker && child.tracker.is_active ? (
                          (user?.role === "ADMIN" || user?.role === "DAYCARE_MANAGER") ? (
                            <button
                              onClick={() => handleDecoupleTracker(child)}
                              title="Desvincular rastreador"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">Vinculado</span>
                          )
                        ) : (
                          <button
                            onClick={() => handleOpenPairing(child)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                          >
                            <Link size={12} />
                            Emparejar QR
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenHistory(child)}
                          title="Historial de códigos"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                        >
                          <History size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: pairing (Generar QR de Emparejamiento) */}
      {pairingModalOpen && selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Emparejar Dispositivo</h3>
                  <p className="text-xs font-semibold text-slate-400">Niño: {selectedChild.full_name}</p>
                </div>
              </div>
              <button
                onClick={handleCancelPairing}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-6 text-center">
              {pairingLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                  <p className="text-sm font-semibold text-slate-500">Generando código temporal...</p>
                </div>
              ) : pairingSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border-2 border-emerald-200">
                    <CheckCircle2 size={36} className="animate-bounce" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mt-2">¡Emparejamiento Exitoso!</h4>
                  <p className="text-sm font-semibold text-slate-500 max-w-xs mx-auto">
                    El dispositivo rastreador ha escaneado el código y está correctamente vinculado a <strong>{selectedChild.full_name}</strong>.
                  </p>
                  <button
                    onClick={() => setPairingModalOpen(false)}
                    className="mt-6 w-full rounded-2xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              ) : pairingCode ? (
                <div className="space-y-5">
                  {/* QR Image Frame */}
                  <div className="relative bg-slate-50/50 p-4 rounded-3xl border border-slate-100 inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pairingCode.qr_payload)}`}
                      alt="Código QR de emparejamiento"
                      className="w-48 h-48 mx-auto border border-slate-200 rounded-2xl bg-white shadow-sm"
                    />
                    {timeLeft <= 0 && (
                      <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-4 gap-2">
                        <AlertCircle className="text-red-500 h-10 w-10" />
                        <span className="text-sm font-black text-slate-850">Código Expirado</span>
                        <span className="text-xs text-slate-400 max-w-[150px] font-semibold">Este código ya no es válido para emparejar.</span>
                      </div>
                    )}
                  </div>

                  {/* Readable Code Display */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código de Emparejamiento</span>
                    <div className="text-2xl font-black text-slate-950 tracking-wider mt-1 select-all bg-slate-50 py-2.5 px-4 rounded-2xl border border-slate-100 inline-block font-mono">
                      {pairingCode.pairing_code}
                    </div>
                  </div>

                  {/* Expiration Timer & Config */}
                  <div className="flex flex-col items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                      <Clock size={16} className={timeLeft > 60 ? "text-cyan-500" : "text-red-500 animate-pulse"} />
                      <span>Expira en:</span>
                      <span className={`font-black ${timeLeft > 60 ? "text-slate-900" : "text-red-500"}`}>
                        {timeLeft > 0 ? formatTimeLeft(timeLeft) : "Expirado"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-200 pt-3 w-full justify-center">
                      <span className="text-xs font-bold text-slate-500">Duración:</span>
                      <div className="flex gap-1.5">
                        {[10, 20, 30].map(mins => (
                          <button
                            key={mins}
                            onClick={() => handleExpirationChange(mins)}
                            disabled={timeLeft <= 0}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${selectedExpiration === mins
                              ? "bg-slate-950 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Helper Text */}
                  <div className="flex items-start gap-2 text-left rounded-2xl bg-cyan-50 p-3.5 border border-cyan-100">
                    <Sparkles className="h-5 w-5 shrink-0 text-cyan-600 mt-0.5" />
                    <p className="text-xs text-cyan-800 leading-relaxed font-semibold">
                      Escanea este código QR desde la aplicación rastreadora móvil del niño. El backend detectará el escaneo y se vinculará de manera automática.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelPairing}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancelar código
                    </button>
                    {timeLeft <= 0 && (
                      <button
                        onClick={() => handleExpirationChange(selectedExpiration)}
                        className="flex-1 rounded-2xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        Generar nuevo
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: History (Historial de códigos) */}
      {historyModalOpen && selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-mono">Historial de Códigos QR</h3>
                  <p className="text-xs font-semibold text-slate-400">Niño: {selectedChild.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                  Cargando historial de códigos...
                </div>
              ) : historyCodes.length === 0 ? (
                <div className="text-center py-12 text-slate-450 font-semibold text-sm">
                  No hay registros de códigos generados anteriormente para este niño.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white max-h-80 overflow-y-auto">
                  <table className="w-full border-collapse text-left text-xs font-medium text-slate-650">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Expiración</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyCodes.map((code) => (
                        <tr key={code.code} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{code.code}</td>
                          <td className="px-4 py-3">{getStatusBadge(code.status)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-500">
                            {new Date(code.expires_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {code.status === "ACTIVE" ? (
                              <button
                                onClick={() => handleCancelHistoryCode(code.code)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 text-red-500 px-2 py-1 text-[10px] font-bold hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}