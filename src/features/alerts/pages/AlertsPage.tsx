import { AlertTriangle } from "lucide-react";
import ModulePage from "../../../shared/components/ModulePage";

export default function AlertsPage() {
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