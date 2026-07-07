import { useEffect, useState } from "react";
import { Map, Trash2, Save, RotateCcw, Edit3, Loader2, AlertCircle } from "lucide-react";
import SigMap from "../components/SigMap";
import { useDaycare } from "../../daycares/hooks/useDaycare";
import { DaycareService } from "../../daycares/services/daycareService";
import { useAuth } from "../../auth/hooks/useAuth";
import type { LatLng } from "leaflet";

export default function SigAreaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Daycare selection state
  const [selectedCode, setSelectedCode] = useState<string>("");

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<LatLng[]>([]);

  const { daycares, changeDaycares } = useDaycare();

  useEffect(() => {
    const fetchDaycares = async () => {
      try {
        const data = await DaycareService.listarGuarderias();
        changeDaycares(data);
      } catch (err) {
        console.error("Error al obtener guarderías:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDaycares();
  }, []);

  useEffect(() => {
    if (daycares.length > 0) {
      if (user?.role === "DAYCARE_MANAGER") {
        const myDaycare = daycares.find(d => d.id === user.daycare_id);
        if (myDaycare) {
          setSelectedCode(myDaycare.code);
        }
      } else {
        setSelectedCode(daycares[0].code);
      }
    }
  }, [daycares, user]);

  const selectedDaycare = daycares.find((d) => d.code === selectedCode) || null;

  // Handle map click to add a point in drawing mode
  const handleMapClick = (latlng: LatLng) => {
    setDrawnPoints((prev) => [...prev, latlng]);
    setError(null);
  };

  // Undo the last point placed
  const handleUndo = () => {
    setDrawnPoints((prev) => prev.slice(0, -1));
  };

  // Clear all points in drawing mode
  const handleClear = () => {
    setDrawnPoints([]);
  };

  // Cancel drawing mode
  const handleCancel = () => {
    setIsDrawing(false);
    setDrawnPoints([]);
    setError(null);
  };

  // Start drawing mode
  const handleStartDrawing = () => {
    setIsDrawing(true);
    setDrawnPoints([]);
    setError(null);
    setSuccessMsg(null);
  };

  // Save the drawn polygon to the backend
  const handleSave = async () => {
    if (drawnPoints.length < 3) {
      setError("Se requieren al menos 3 puntos para delimitar un polígono.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Structure GeoJSON coordinates (longitude, latitude)
      const coords = drawnPoints.map((p) => [p.lng, p.lat]);
      // Close the polygon ring by appending the first point at the end
      coords.push([coords[0][0], coords[0][1]]);

      const geojsonArea = {
        type: "Polygon" as const,
        coordinates: [coords],
      };

      const updatedDaycare = await DaycareService.actualizarGuarderiaArea(selectedCode, geojsonArea);

      // Update global context list
      changeDaycares(daycares.map((d) => (d.code === selectedCode ? updatedDaycare : d)));

      setSuccessMsg("¡Área geográfica guardada y configurada exitosamente!");
      setIsDrawing(false);
      setDrawnPoints([]);
    } catch (err: any) {
      console.error("Error saving daycare polygon area:", err);
      let errorMsg = "No se pudo guardar el área de cobertura. Asegúrate de dibujar un polígono simple no cruzado.";
      if (err.response?.data) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => `${d.loc.join(".")}: ${d.msg}`).join(", ");
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      } else if (err.message) {
        errorMsg = `Error de red o conexión: ${err.message}`;
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

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
      {/* Header section */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
              <Map size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Gestión del área geográfica SIG
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Dibuja, edita y valida el polígono del área de cobertura segura de cada guardería.
                Los niños que salgan de esta delimitación geográfica dispararán alertas de seguridad.
              </p>
            </div>
          </div>

          {/* Daycare selector */}
          <div className="flex flex-col gap-1.5 sm:w-80">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Seleccionar Guardería
            </label>
            <select
              value={selectedCode}
              disabled={user?.role === "DAYCARE_MANAGER"}
              onChange={(e) => {
                setSelectedCode(e.target.value);
                setIsDrawing(false);
                setDrawnPoints([]);
                setError(null);
                setSuccessMsg(null);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="">Selecciona una guardería...</option>
              {daycares
                .filter(d => {
                  if (user?.role === "DAYCARE_MANAGER") {
                    return d.id === user.daycare_id;
                  }
                  return true;
                })
                .map((d) => (
                  <option key={d.code} value={d.code}>
                    [{d.code}] {d.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      {/* Drawing Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
          <AlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Control overlay & status panel */}
      {selectedCode && (
        <section className="transition-all duration-300">
          {isDrawing ? (
            <div className="flex flex-col gap-4 p-5 rounded-3xl bg-cyan-50/50 border border-cyan-100 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-cyan-900">
                    Modo Dibujo Activo
                  </p>
                  <p className="text-xs font-semibold text-cyan-700 mt-0.5">
                    Haz clics en el mapa para colocar los vértices perimetrales. Colocados: <strong className="font-black text-cyan-950">{drawnPoints.length}</strong> (min. 3).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={drawnPoints.length === 0 || saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-700 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  Deshacer
                </button>
                <button
                  onClick={handleClear}
                  disabled={drawnPoints.length === 0 || saving}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-black text-rose-700 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Limpiar
                </button>
                <button
                  onClick={handleSave}
                  disabled={drawnPoints.length < 3 || saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-black text-white disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Guardar Área
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-500 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {selectedDaycare?.has_area ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Área Configurada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Área Pendiente
                  </span>
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedDaycare?.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {selectedDaycare?.has_area
                      ? "Polígono activo cargado correctamente. Haz clic en 'Editar Área' para re-dibujarlo."
                      : "Aún no se ha delimitado el perímetro seguro para esta guardería."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartDrawing}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-black text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow"
              >
                <Edit3 size={14} />
                {selectedDaycare?.has_area ? "Editar Área" : "Dibujar Área"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Map component wrapper */}
      <SigMap
        selectedDaycare={selectedDaycare}
        isDrawing={isDrawing}
        drawnPoints={drawnPoints}
        onMapClick={handleMapClick}
      />
    </div>
  );
}