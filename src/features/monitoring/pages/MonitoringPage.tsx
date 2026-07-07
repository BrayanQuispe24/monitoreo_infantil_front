import { useEffect, useState } from "react";
import { 
  MonitorDot, Search, Loader2, RefreshCw, 
  MapPin, ShieldAlert, ShieldCheck, 
  Wifi, WifiOff, AlertTriangle, AlertCircle, Sparkles, Compass, X
} from "lucide-react";
import { ChildService } from "../../children/services/childService";
import { DaycareService } from "../../daycares/services/daycareService";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import { useAuth } from "../../auth/hooks/useAuth";
import { api } from "../../../api/axios";
import type { ChildResponse } from "../../children/interfaces/Child.interface";
import type { DeviceDetails } from "../../trackers/interfaces/Tracker.interface";
import type { DaycareRegisterResponse } from "../../daycares/interfaces/Daycare.interface";

import { GeoJSON, MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MonitoredChild extends ChildResponse {
  tracker: DeviceDetails | null;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    is_inside_area: boolean;
    received_at: string;
    speed?: number | null;
    heading?: number | null;
  } | null;
  calculatedState: "Dentro del área" | "Fuera del área" | "Sin señal" | "GPS con baja precisión" | "Sin rastreador" | "Sin ubicación";
  hasActiveAlert: boolean;
}

// Map center controller
function ChangeMapView({ bounds, center }: { bounds?: L.LatLngBounds; center?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    } else if (center) {
      map.setView(center, 17);
    }
  }, [bounds, center, map]);

  return null;
}

// Custom Marker DivIcon builder based on child status
const createChildMarkerIcon = (name: string, status: string) => {
  let colorClass = "bg-slate-500 border-slate-700";
  if (status === "Dentro del área") colorClass = "bg-emerald-500 border-white shadow-emerald-500/25";
  else if (status === "Fuera del área") colorClass = "bg-red-500 border-white animate-pulse shadow-red-500/30";
  else if (status === "GPS con baja precisión") colorClass = "bg-amber-500 border-white shadow-amber-500/20";
  else if (status === "Sin señal") colorClass = "bg-slate-400 border-slate-650 shadow-slate-400/25";
  else if (status === "Sin ubicación") colorClass = "bg-indigo-500 border-white shadow-indigo-500/20";

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return L.divIcon({
    className: "custom-leaflet-child-marker",
    html: `<div class="relative flex items-center justify-center">
             <div class="w-10 h-10 rounded-full ${colorClass} text-white border-2 shadow-lg flex items-center justify-center font-black text-xs transition-transform hover:scale-110">
               ${initials}
             </div>
             <span class="absolute -top-1 -right-1 flex h-3 w-3">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${
                 status === "Dentro del área" 
                   ? "bg-emerald-400" 
                   : status === "Fuera del área" 
                     ? "bg-red-400" 
                     : "bg-amber-400"
               } opacity-75"></span>
               <span class="relative inline-flex rounded-full h-3 w-3 ${
                 status === "Dentro del área" 
                   ? "bg-emerald-500" 
                   : status === "Fuera del área" 
                     ? "bg-red-500" 
                     : "bg-amber-500"
               }"></span>
             </span>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function MonitoringPage() {
  const { token } = useAuth();
  const [monitoredChildren, setMonitoredChildren] = useState<MonitoredChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDaycareId, setSelectedDaycareId] = useState("");
  
  // Selected child to focus on the map
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | undefined>(undefined);
  const [focusedChildCode, setFocusedChildCode] = useState<string | null>(null);
  const [showOnlyFocusedChild, setShowOnlyFocusedChild] = useState<boolean>(false);

  const { daycares, changeDaycares } = useDaycare();

  const activeDaycare = daycares.find(d => d.id === selectedDaycareId) as DaycareRegisterResponse | undefined;
  const focusedChild = monitoredChildren.find(c => c.code === focusedChildCode);

  const computeState = (tracker: DeviceDetails | null, location: any): MonitoredChild["calculatedState"] => {
    if (!tracker || !tracker.is_active) {
      return "Sin rastreador";
    }
    
    // Check signal time (last_seen_at)
    if (!tracker.last_seen_at) {
      return "Sin señal";
    }
    
    const lastSeen = new Date(tracker.last_seen_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    if (diffMs > 3 * 60 * 1000) { // 3 minutes offline threshold
      return "Sin señal";
    }
    
    if (!location) {
      return "Sin ubicación";
    }
    
    if (location.accuracy && location.accuracy > 20) { // low precision threshold: 20 meters
      return "GPS con baja precisión";
    }
    
    if (!location.is_inside_area) {
      return "Fuera del área";
    }
    
    return "Dentro del área";
  };

  const fetchChildrenMonitoring = async (daycareId: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Get kids of selected daycare
      const childrenData = await ChildService.listarNinos(daycareId);

      // 2. Fetch tracker + location for each child in parallel
      const detailedPromises = childrenData.map(async (child) => {
        let tracker: DeviceDetails | null = null;
        let location: any = null;

        try {
          const trackerRes = await api.get(`/api/tracking-devices/children/${child.code}`);
          tracker = trackerRes.data.device;
        } catch (err) {
          console.error(`Error loading tracker for ${child.code}:`, err);
        }

        try {
          const locRes = await api.get(`/api/children/${child.code}/last-location`);
          location = locRes.data;
        } catch (err: any) {
          // 404 means no location history exists yet, which is handled
          if (err.response?.status !== 404) {
            console.error(`Error loading location for ${child.code}:`, err);
          }
        }

        const calculatedState = computeState(tracker, location);
        const hasActiveAlert = calculatedState === "Fuera del área" || calculatedState === "Sin señal";

        return {
          ...child,
          tracker,
          location,
          calculatedState,
          hasActiveAlert
        };
      });

      const results = await Promise.all(detailedPromises);
      setMonitoredChildren(results);
    } catch (error) {
      console.error("Error fetching monitoring feed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial daycare and list load
  useEffect(() => {
    const init = async () => {
      try {
        const daycaresData = await DaycareService.listarGuarderias();
        changeDaycares(daycaresData);
        if (daycaresData.length > 0) {
          setSelectedDaycareId(daycaresData[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error listing daycares on init:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  // Poll locations every 10 seconds for the selected daycare
  useEffect(() => {
    if (!selectedDaycareId) return;

    fetchChildrenMonitoring(selectedDaycareId);

    const interval = setInterval(() => {
      fetchChildrenMonitoring(selectedDaycareId, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedDaycareId]);

  // Real-time live tracking WebSocket for the focused child
  useEffect(() => {
    if (!focusedChildCode || !token) return;

    const wsBaseURL = api.defaults.baseURL?.replace(/^http/, "ws") || "ws://localhost:8000";
    const wsUrl = `${wsBaseURL}/ws/guardians/me/children/${focusedChildCode}/live-location?token=${token}`;
    
    console.log(`Connecting to WebSocket for live tracking of ${focusedChildCode}:`, wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket update received:", data);
        
        // Update monitoredChildren state immediately
        setMonitoredChildren((prev) => 
          prev.map((c) => {
            if (c.code === data.child_code) {
              const updatedLocation = {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy,
                is_inside_area: data.is_inside_area,
                received_at: data.received_at
              };
              
              const calculatedState = computeState(c.tracker, updatedLocation);
              const hasActiveAlert = calculatedState === "Fuera del área" || calculatedState === "Sin señal";

              return {
                ...c,
                location: updatedLocation,
                calculatedState,
                hasActiveAlert
              };
            }
            return c;
          })
        );
        
        // Center map on the new location
        setFocusedLocation([data.latitude, data.longitude]);
      } catch (err) {
        console.error("Error parsing WebSocket payload:", err);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for ${focusedChildCode}`);
    };

    ws.onerror = (err) => {
      console.error(`WebSocket error for ${focusedChildCode}:`, err);
    };

    return () => {
      ws.close();
    };
  }, [focusedChildCode, token]);

  const handleRefresh = () => {
    if (!selectedDaycareId) return;
    setRefreshing(true);
    fetchChildrenMonitoring(selectedDaycareId, true);
  };

  const handleFocusChild = (child: MonitoredChild) => {
    if (focusedChildCode === child.code) {
      // Toggle off if already focused
      setFocusedChildCode(null);
      setFocusedLocation(undefined);
      setShowOnlyFocusedChild(false);
      return;
    }

    setFocusedChildCode(child.code);
    if (child.location) {
      setFocusedLocation([child.location.latitude, child.location.longitude]);
    } else {
      setFocusedLocation(undefined);
    }
  };

  // Keep map tracking on the focused child as new coordinates are polled
  useEffect(() => {
    if (focusedChildCode) {
      const child = monitoredChildren.find(c => c.code === focusedChildCode);
      if (child && child.location) {
        setFocusedLocation([child.location.latitude, child.location.longitude]);
      }
    }
  }, [monitoredChildren, focusedChildCode]);

  // GeoJSON parsing
  let bounds: L.LatLngBounds | undefined;
  let geojsonFeature: any = null;

  if (activeDaycare?.area && activeDaycare.has_area) {
    try {
      geojsonFeature = {
        type: "Feature",
        properties: { name: activeDaycare.name },
        geometry: activeDaycare.area,
      };
      const geojsonLayer = L.geoJSON(activeDaycare.area as any);
      bounds = geojsonLayer.getBounds();
    } catch (e) {
      console.error("Error mapping daycare polygon bounds:", e);
    }
  }

  // Filter
  const filteredChildren = monitoredChildren.filter((child) => {
    const query = searchQuery.toLowerCase();
    return (
      child.full_name.toLowerCase().includes(query) ||
      child.code.toLowerCase().includes(query)
    );
  });

  // Counters
  const totalMonitored = monitoredChildren.length;
  const insideCount = monitoredChildren.filter(c => c.calculatedState === "Dentro del área").length;
  const outsideCount = monitoredChildren.filter(c => c.calculatedState === "Fuera del área").length;
  const offlineCount = monitoredChildren.filter(c => c.calculatedState === "Sin señal").length;
  const lowGpsCount = monitoredChildren.filter(c => c.calculatedState === "GPS con baja precisión").length;
  const alertCount = monitoredChildren.filter(c => c.hasActiveAlert).length;

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "En línea";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: MonitoredChild["calculatedState"]) => {
    switch (status) {
      case "Dentro del área":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 border border-emerald-150"><ShieldCheck size={12} />Dentro</span>;
      case "Fuera del área":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-500 border border-red-150 animate-pulse"><ShieldAlert size={12} />Fuera del área</span>;
      case "Sin señal":
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 border border-slate-200"><WifiOff size={12} />Sin señal</span>;
      case "GPS con baja precisión":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 border border-amber-150"><AlertTriangle size={12} />Baja precisión</span>;
      case "Sin ubicación":
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-500 border border-indigo-150"><MapPin size={12} />Sin coordenadas</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-400">Sin rastreador</span>;
    }
  };

  if (loading && daycares.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando monitor de guarderías...</span>
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
              <MonitorDot size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Monitoreo en tiempo real
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Panel de control para operadores autorizados. Monitorea la geocerca perimetral, la señal del GPS y la ubicación geográfica de los niños en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            {/* Daycare Selector */}
            <select
              value={selectedDaycareId}
              onChange={(e) => setSelectedDaycareId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 focus:border-cyan-500 focus:outline-none transition-all"
            >
              {daycares.map((daycare) => (
                <option key={daycare.id} value={daycare.id}>
                  {daycare.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing || !selectedDaycareId}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monitoreados</p>
          <h4 className="text-xl font-black text-slate-900 mt-1">{totalMonitored}</h4>
        </div>
        
        <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Dentro de Área</p>
          <h4 className="text-xl font-black text-emerald-700 mt-1">{insideCount}</h4>
        </div>

        <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Fuera de Área</p>
          <h4 className="text-xl font-black text-red-600 mt-1">{outsideCount}</h4>
        </div>

        <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-slate-400">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sin Señal</p>
          <h4 className="text-xl font-black text-slate-600 mt-1">{offlineCount}</h4>
        </div>

        <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Baja Precisión</p>
          <h4 className="text-xl font-black text-amber-600 mt-1">{lowGpsCount}</h4>
        </div>

        <div className={`rounded-[1.2rem] border p-4 shadow-sm transition-all ${
          alertCount > 0 
            ? "border-red-200 bg-red-50 text-red-800 border-l-4 border-l-red-650" 
            : "border-slate-200 bg-white"
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${alertCount > 0 ? "text-red-600" : "text-slate-400"}`}>Alertas Activas</p>
          <h4 className="text-xl font-black mt-1 flex items-center gap-1">
            {alertCount}
            {alertCount > 0 && <AlertCircle size={16} className="text-red-500 animate-pulse" />}
          </h4>
        </div>
      </div>

      {/* Main split dashboard (List left, Map right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Children List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por niño o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 left-0 pl-11 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
                <span className="text-[11px] font-bold text-slate-400">Actualizando coordenadas...</span>
              </div>
            ) : filteredChildren.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">
                No hay niños registrados o activos bajo el filtro actual.
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 pr-1">
                {filteredChildren.map((child) => (
                  <div 
                    key={child.id} 
                    onClick={() => handleFocusChild(child)}
                    className={`group flex items-center justify-between py-3.5 px-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border ${
                      focusedChildCode === child.code 
                        ? "bg-cyan-50/40 border-cyan-300 shadow-xs" 
                        : "border-transparent"
                    } ${
                      child.hasActiveAlert && focusedChildCode !== child.code 
                        ? "bg-red-50/30 hover:bg-red-50/50" 
                        : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          child.calculatedState === "Dentro del área" 
                            ? "bg-emerald-500" 
                            : child.calculatedState === "Fuera del área" 
                              ? "bg-red-500" 
                              : "bg-slate-350"
                        }`} />
                        <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">
                          {child.full_name}
                        </h5>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">{child.code}</span>
                        {child.tracker?.device_code && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 rounded font-mono">
                            {child.tracker.device_code}
                          </span>
                        )}
                        {child.tracker?.last_seen_at && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5 font-semibold">
                            <Wifi size={10} className="text-slate-400" />
                            {formatLastSeen(child.tracker.last_seen_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getStatusBadge(child.calculatedState)}
                      {child.location?.accuracy && (
                        <span className="text-[9px] font-bold text-slate-400">
                          ±{Math.round(child.location.accuracy)}m precisión
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Legend Banner */}
          <div className="flex items-start gap-2 rounded-2xl bg-cyan-50 p-4 border border-cyan-100">
            <Sparkles className="h-5 w-5 shrink-0 text-cyan-600 mt-0.5" />
            <div>
              <h6 className="text-xs font-bold text-cyan-800">Autocomputación del cliente</h6>
              <p className="text-[11px] text-cyan-700 leading-relaxed font-semibold mt-0.5">
                El estado de la señal, cobertura y precisión del GPS se calculan automáticamente analizando la telemetría del dispositivo en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="lg:col-span-7">
          <div className="h-[600px] overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm relative z-10">
            {/* Floating Live Tracking Overlay */}
            {focusedChild && (
              <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col gap-2 backdrop-blur-xs max-w-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </div>
                  <span className="text-[11px] font-black tracking-wide">ENFOQUE ACTIVO</span>
                  <button 
                    onClick={() => {
                      setFocusedChildCode(null);
                      setFocusedLocation(undefined);
                      setShowOnlyFocusedChild(false);
                    }}
                    className="h-6 w-6 inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-colors ml-auto"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="text-xs font-semibold text-slate-350">
                  Siguiendo: <strong className="text-cyan-400 font-black">{focusedChild.full_name}</strong>
                </div>
                {focusedChild.location && (
                  <div className="flex items-center gap-4 border-t border-slate-800 pt-2.5 w-full justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={showOnlyFocusedChild} 
                        onChange={(e) => setShowOnlyFocusedChild(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5 accent-cyan-500"
                      />
                      <span className="text-[10px] font-bold text-slate-300">Aislar niño en el mapa</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            <MapContainer
              center={[-17.7833, -63.1821]}
              zoom={15}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Adjust center and zoom dynamically */}
              <ChangeMapView bounds={bounds} center={focusedLocation} />

              {/* Daycare perimeter polygon */}
              {geojsonFeature && (
                <GeoJSON
                  key={JSON.stringify(geojsonFeature)}
                  data={geojsonFeature}
                  style={{
                    color: "#0891b2",
                    weight: 3,
                    fillColor: "#0891b2",
                    fillOpacity: 0.15,
                    dashArray: "5, 8"
                  }}
                />
              )}

              {/* Markers for children with active locations */}
              {monitoredChildren
                .filter(c => c.location !== null)
                .filter(c => !showOnlyFocusedChild || focusedChildCode === null || c.code === focusedChildCode)
                .map((child) => (
                  <Marker
                    key={child.id}
                    position={[child.location!.latitude, child.location!.longitude]}
                    icon={createChildMarkerIcon(child.full_name, child.calculatedState)}
                    opacity={focusedChildCode ? (focusedChildCode === child.code ? 1.0 : 0.3) : 1.0}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-2 space-y-2 text-slate-800 text-xs w-48 font-medium">
                        <div className="border-b border-slate-100 pb-1.5">
                          <h6 className="font-bold text-slate-900 text-sm leading-tight">{child.full_name}</h6>
                          <span className="text-[10px] font-bold text-slate-400">{child.code}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 font-bold">Estado:</span>
                            {getStatusBadge(child.calculatedState)}
                          </div>
                          
                          {child.tracker?.device_code && (
                            <div className="flex justify-between">
                              <span className="text-slate-450 font-bold">Rastreador:</span>
                              <span className="font-bold text-slate-800 font-mono">{child.tracker.device_code}</span>
                            </div>
                          )}

                          {child.location?.accuracy && (
                            <div className="flex justify-between">
                              <span className="text-slate-450 font-bold">Precisión GPS:</span>
                              <span className="font-bold text-slate-800">±{Math.round(child.location.accuracy)} metros</span>
                            </div>
                          )}

                          {child.location?.speed !== undefined && child.location?.speed !== null && (
                            <div className="flex justify-between">
                              <span className="text-slate-450 font-bold">Velocidad:</span>
                              <span className="font-bold text-slate-850">
                                {Math.round(child.location.speed * 3.6)} km/h
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                            <span className="font-bold">Actualizado:</span>
                            <span>{new Date(child.location!.received_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}